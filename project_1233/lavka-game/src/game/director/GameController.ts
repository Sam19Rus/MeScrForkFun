/* GameController.ts — FSM дня и все игровые действия (порт lavka2-vp/js/game.js).
   React-слой не содержит геймплейной логики: компоненты вызывают методы контроллера
   и рендерят снапшот. Контроллер headless-safe (используется в тестах и симуляциях).

   Поток дня: shop(утро) → city → [parts | hall] → hall(осмотр) → bidding (по лотам)
   → [выигрыш: unbox → workbench(осмотр дефектов/реставрация) → appraisal → decision → deal]
   → [проигрыш: loss] → dayResult → shop(новый день).
   FTUE: день 1 — скриптованные лоты и заказ Иваныча (как в прототипе). */
import { CONFIG } from '../data/config';
import { CATS, HOUSES, NPCS, SETS, FIXTURES, FACES } from '../data/world';
import { ITEMS, ITEMS_BY_ID } from '../data/items';
import { PARTS } from '../data/parts';
import * as E from '../economy';
import { Goals } from '../systems/goals';
import { OrdersSystem } from '../systems/orders';
import { AuctionSystem } from '../systems/auction';
import { ClueSystem } from '../systems/clues';
import { ResultSystem } from '../systems/results';
import { RestorationSystem, type OpView } from '../systems/restoration';
import { BuyersSystem, type BuyerOffer } from '../systems/buyers';
import { Telemetry } from '../telemetry';
import { SDK } from '../sdk';
import { SFX } from '../sfx';
import { AuctionEngine } from './AuctionEngine';
import type { AuctionView, DayCtx, LotInst, NpcId, PartId, Phase, Save, Toast } from '../types';

export interface LossInfo {
  title: string; face: string | null; lines: string[];
  estOk: boolean | null; estReward: number; estBandLabel: string | null;
}
export interface DealInfo { kind: string; text: string; itemId: string; }
export interface DayResultInfo { profit: number; acc: number | null; n: number; ok: number; hint: string | null; }

export interface Snapshot {
  rev: number;
  phase: Phase;
  save: Save;
  day: DayCtx | null;
  lot: LotInst | null;
  auction: AuctionView | null;
  toasts: Toast[];
  loss: LossInfo | null;
  deal: DealInfo | null;
  dayResult: DayResultInfo | null;
  inspectIdx: number | null;
  workbenchOps: OpView[] | null;
  activeOp: OpView | null;
  buyerOffer: BuyerOffer | null;
  ftueStep: string | null;
  sessionAuctions: number;
  speed: number;
  dev: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

export class GameController {
  save!: Save;
  day: DayCtx | null = null;
  lot: LotInst | null = null;
  phase: Phase = 'intro';
  speed = 550;
  dev = false;
  sessionAuctions = 0;
  toasts: Toast[] = [];
  loss: LossInfo | null = null;
  deal: DealInfo | null = null;
  dayResult: DayResultInfo | null = null;
  inspectIdx: number | null = null;
  workbenchOps: OpView[] | null = null;
  activeOp: OpView | null = null;
  buyerOffer: BuyerOffer | null = null;
  ftueStep: string | null = null;
  private engine: AuctionEngine | null = null;
  private rev = 0;
  private listeners = new Set<() => void>();
  private toastSeq = 0;
  private rnd = E.mulberry32((Date.now() ^ 0x5eed) >>> 0);
  private started = false;

  constructor() {
    this.save = this.newSave();
    this.snap = {
      rev: 0, phase: 'intro', save: this.save, day: null, lot: null, auction: null,
      toasts: [], loss: null, deal: null, dayResult: null, inspectIdx: null,
      workbenchOps: null, activeOp: null, buyerOffer: null, ftueStep: null,
      sessionAuctions: 0, speed: this.speed, dev: false
    };
  }

  /* ================== store-контракт (useSyncExternalStore) ================== */
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  getSnapshot = (): Snapshot => this.snap;
  private snap!: Snapshot;
  emit() {
    this.rev++;
    this.snap = {
      rev: this.rev, phase: this.phase, save: this.save, day: this.day, lot: this.lot,
      auction: this.engine ? this.engine.view : this.lastAuctionView,
      toasts: [...this.toasts], loss: this.loss, deal: this.deal, dayResult: this.dayResult,
      inspectIdx: this.inspectIdx, workbenchOps: this.workbenchOps, activeOp: this.activeOp,
      buyerOffer: this.buyerOffer, ftueStep: this.ftueStep,
      sessionAuctions: this.sessionAuctions, speed: this.speed, dev: this.dev
    };
    this.listeners.forEach(fn => fn());
  }
  private lastAuctionView: AuctionView | null = null;

  toast(msg: string, ms = 2400) {
    const id = ++this.toastSeq;
    this.toasts.push({ id, msg });
    this.emit();
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); this.emit(); }, ms);
  }

  setPhase(p: Phase) { this.phase = p; this.emit(); }
  private setCoins(v: number) { this.save.coins = Math.max(0, Math.round(v)); }
  persist() { SDK.save(this.save); }

  /* ================== save ================== */
  newSave(): Save {
    const parts = { universal: 0, electronic: 0, mechanical: 0, polish: 0, knob: 0, belt: 0, pendulum: 0, lens: 0 } as Record<PartId, number>;
    (Object.keys(CONFIG.startParts) as PartId[]).forEach(p => { parts[p] = CONFIG.startParts[p] || 0; });
    return {
      v: 3, day: 1, coins: CONFIG.start_coins, owned: {}, fixtures: [], vitrine: [],
      orders: [], shopLevel: 1, lastDivDay: 0, pity: 0,
      stats: { wins: 0, losses: 0, sold: 0, kept: 0, ordersDone: 0, ordersExpired: 0, dup: 0, best: 0, motivated: 0, disassembled: 0, partsSpent: 0, restoreSpent: 0 },
      est: { submitted: 0, correct: 0 },
      autoRestore: { date: '', count: 0 }, ftue: { done: false },
      parts, tips: {}, setDone: {}, pending: null, buyerToday: null
    };
  }
  private migrate(loaded: any): Save {
    const s = loaded as Save;
    if (s.v === 2) {
      // миграция с прототипа v2: добавляем запчасти/покупателей/pending
      const parts = { universal: 0, electronic: 0, mechanical: 0, polish: 0, knob: 0, belt: 0, pendulum: 0, lens: 0 } as Record<PartId, number>;
      (Object.keys(CONFIG.startParts) as PartId[]).forEach(p => { parts[p] = CONFIG.startParts[p] || 0; });
      s.parts = parts;
      s.pending = null; s.buyerToday = null;
      s.stats.disassembled = 0; s.stats.partsSpent = 0;
      s.v = 3;
    }
    // нормализация owned: {q} → {q, day}
    Object.keys(s.owned || {}).forEach(k => {
      const o = (s.owned as any)[k];
      if (o && typeof o === 'object' && o.day == null) o.day = 1;
    });
    s.tips = s.tips || {};
    s.setDone = s.setDone || {};
    return s;
  }

  /* ================== boot ================== */
  async start(opts?: { speed?: number; dev?: boolean }) {
    if (opts?.speed != null) this.speed = opts.speed;
    this.dev = !!opts?.dev;
    Telemetry.setDev(this.dev);
    await SDK.ready();
    const loaded = await SDK.load();
    this.save = (loaded && (loaded.v === 2 || loaded.v === 3)) ? this.migrate(loaded) : this.newSave();
    Telemetry.log('session_start', { fresh: !loaded, day: this.save.day, coins: this.save.coins });
    Telemetry.log('boot', { dev: this.dev, items: ITEMS.length, version: CONFIG.meta.version });
    this.started = true;
    // незавершённый лот (refresh-safe, п.1.9)
    if (this.save.pending) {
      const p = this.save.pending;
      this.day = (p as any).day || null;
      this.lot = p.lot;
      if (p.stage === 'workbench') { this.workbenchOps = RestorationSystem.buildOps(this.save, this.lot); this.setPhase('workbench'); return; }
      if (p.stage === 'appraisal') { this.enterAppraisal(); return; }
      if (p.stage === 'decision') { this.enterAppraisal(); this.setPhase('decision'); return; }
    }
    this.ensureFTUEOrder();
    if (!this.save.ftue.done && this.save.day === 1 && this.save.stats.wins === 0) {
      this.setPhase('intro');
    } else {
      OrdersSystem.ensureBoard(this.save, this.rnd);
      this.enterShop(true);
    }
  }

  ensureFTUEOrder() {
    if (!this.save.ftue.done && this.save.day === 1 && !(this.save.orders || []).some(o => o.id === 'ftue')) {
      this.save.orders = [OrdersSystem.instantiate({ ...CONFIG.ftue.order, mult: 'cat' } as any, this.save.day, 0), ...(this.save.orders || [])];
    }
  }

  /* ================== УТРО / ЛАВКА ================== */
  enterShop(first: boolean) {
    const save = this.save;
    if (save.lastDivDay < save.day) {
      const div = Goals.dividend(save);
      this.setCoins(save.coins + div);
      save.lastDivDay = save.day;
      Telemetry.log('dividend', { day: save.day, amount: div });
      setTimeout(() => this.toast(`Утренняя выручка лавки: +${div} ₽ (витрина и наборы работают)`), 300);
    }
    if (!first && save.coins < CONFIG.bailout.threshold) {
      this.setCoins(save.coins + CONFIG.bailout.amount);
      Telemetry.log('bailout', { day: save.day, coins: save.coins });
      setTimeout(() => this.toast(`Сосед одолжил монет: +${CONFIG.bailout.amount}`), 900);
    }
    OrdersSystem.ensureBoard(save, this.rnd);
    BuyersSystem.rollBuyerToday(save, save.day);
    this.save.pending = null;
    this.setPhase('shop');
    this.persist();
    Telemetry.log('screen_morning', { day: save.day, coins: save.coins, orders: (save.orders || []).length });
  }

  introDone() {
    SFX.click();
    Telemetry.log('ftue_step', { step: 'intro_done' });
    OrdersSystem.ensureBoard(this.save, this.rnd);
    this.enterShop(true);
  }

  upgradeShop() {
    const up = Goals.canUpgrade(this.save);
    if (!up || !up.ok) return;
    SFX.legendary();
    Goals.upgrade(this.save);
    this.persist();
    Telemetry.log('shop_upgraded', { level: this.save.shopLevel });
    Telemetry.log('goal_completed', { type: 'shop', level: this.save.shopLevel });
    this.toast(`Лавка выросла: «${CONFIG.shop[this.save.shopLevel].name}»!`);
    this.enterShop(true);
  }

  openAlbum() { SFX.click(); this.setPhase('album'); }
  closeAlbum() { SFX.click(); this.enterShop(true); }

  /* ================== ГОРОД ================== */
  goToCity() { SFX.click(); this.setPhase('city'); }
  enterShopFromCity() { SFX.click(); this.enterShop(true); }
  /** в магазин запчастей (в т.ч. с верстака — leaveParts вернёт обратно) */
  goParts() { SFX.click(); this.setPhase('parts'); }

  enterBuilding(buildingId: string) {
    const save = this.save;
    if (buildingId === 'shop') return this.enterShopFromCity();
    if (buildingId === 'parts') { SFX.click(); this.setPhase('parts'); return; }
    const houseId = ({ city_warehouse: 'city', estate: 'estate', garage: 'special' } as Record<string, string>)[buildingId];
    if (!houseId) return;
    if (!Goals.houseUnlocked(save, houseId as any)) {
      this.toast('Заперто: сначала развите лавку');
      SFX.error();
      return;
    }
    SFX.click();
    // interstitial утро→аукцион (каждый N-й день, как в прототипе)
    if (save.day % CONFIG.ads.interstitial.morning_to_auction.every === 0) SDK.interstitial('morning_to_auction');
    this.day = { houseId: houseId as any, lots: [], idx: 0, dayStartCoins: save.coins, wins: 0, losses: 0, estDay: { n: 0, ok: 0 }, ftue: false };
    if (!save.ftue.done) this.startFTUEDay();
    else this.beginDay(houseId as any, false);
  }

  /* ================== АУКЦИОН ================== */
  beginDay(houseId: any, isFTUE: boolean) {
    const d = this.day!;
    const built = isFTUE ? AuctionSystem.buildFTUEDay(this.save) : AuctionSystem.buildDay(this.save, houseId, this.rnd);
    d.lots = built.lots;
    d.houseId = built.houseId;
    d.idx = 0;
    d.ftue = isFTUE;
    this.sessionAuctions++;
    Telemetry.log('auction_started', { house: d.houseId, day: this.save.day, n: this.sessionAuctions, ftue: isFTUE });
    if (this.sessionAuctions > 1) Telemetry.log('next_auction_started', { day: this.save.day, n: this.sessionAuctions });
    this.inspectIdx = null;
    this.setPhase('hall');
    Telemetry.log('screen_inspect', { lots: d.lots.length, house: d.houseId });
  }

  startFTUEDay() {
    if (!(this.save.orders || []).some(o => o.id === 'ftue')) {
      this.save.orders.unshift(OrdersSystem.instantiate({ ...CONFIG.ftue.order, mult: 'cat' } as any, this.save.day, 0));
    }
    Telemetry.log('ftue_step', { step: 'day1_start' });
    this.beginDay('city', true);
  }

  /* ---- осмотр лотов (hall) ---- */
  lotBadges(l: LotInst): { cls: string; text: string }[] {
    const badges: { cls: string; text: string }[] = [];
    const item = ITEMS_BY_ID[l.itemId];
    const ord = OrdersSystem.matching(this.save, item);
    if (ord) badges.push({ cls: 'order', text: `📋 заказ: ${ord.who} ×${CONFIG.economy.orderMult[ord.mult]}` });
    if (item.set && !this.save.owned[item.id]) badges.push({ cls: 'set', text: `🏆 набор «${SETS[item.set].name}» ${Goals.setOwned(this.save, item.set)}/${SETS[item.set].need}` });
    if (item.fixture && !(this.save.fixtures || []).includes(item.fixture)) {
      const f = FIXTURES.find(x => x.item === item.id);
      if (f) badges.push({ cls: 'fix', text: `🔧 можно установить: ${f.desc}` });
    }
    if (item.rarity === 'legend' && (this.save.vitrine || []).length < (CONFIG.shop[this.save.shopLevel].vitrine || 0))
      badges.push({ cls: 'fix', text: '✨ витрина +8%' });
    if (item.donor && item.yieldParts)
      badges.push({ cls: 'part', text: '🔩 на запчасти: ' + (Object.keys(item.yieldParts) as PartId[]).map(p => PARTS[p].name).join(', ') });
    // деталь нужна игроку (незакрытый missing_part в pending? просто каталожная справка)
    return badges;
  }

  openLotModal(i: number) {
    const l = this.day!.lots[i];
    this.inspectIdx = i;
    l._clueLogged = l._clueLogged || {};
    const viewed = (l.clues || []).filter((c, ci) => c.free || ci < l.revealedClues).length;
    (l.clues || []).forEach((c, ci) => {
      const visible = c.free || ci < l.revealedClues;
      if (visible && !l._clueLogged![ci]) { l._clueLogged![ci] = true; Telemetry.log('clue_opened', { lot: l.id, kind: c.kind, paid: !c.free }); }
    });
    Telemetry.log('lot_inspected', { lot: l.id, clues: viewed });
    this.emit();
  }
  closeLotModal() { this.inspectIdx = null; this.emit(); }

  cluesPaidToday(): number {
    const cp = (this.save as any).cluesPaid;
    return cp && cp.day === this.save.day ? cp.n : 0;
  }
  async buyExtraClue() {
    const l = this.day!.lots[this.inspectIdx!];
    const used = this.cluesPaidToday();
    if (used >= CONFIG.ads.rewarded.extra_clue) { this.toast('Лимит платных улик на сегодня'); return; }
    const ok = await SDK.rewarded('extra_clue');
    if (ok) {
      l.revealedClues = (l.clues || []).filter(c => c.free).length + used + 1;
      (this.save as any).cluesPaid = { day: this.save.day, n: used + 1 };
      Telemetry.log('clue_revealed', { lot: l.id });
      this.openLotModal(this.inspectIdx!);
    }
  }

  submitEstimate(band: number) {
    const l = this.day!.lots[this.inspectIdx!];
    l.estimateBand = band;
    l.estimated = true;
    if (!l.estLogged) {
      l.estLogged = true;
      this.save.est.submitted++;
      const viewed = (l.clues || []).filter((c, ci) => c.free || ci < l.revealedClues).length;
      const u = E.uncertainty(viewed, this.save);
      const [lo, hi] = E.estimateRange(l.trueValue, u);
      Telemetry.log('estimate_submitted', { lot: l.id, band, range: [lo, hi] });
    }
    SFX.click();
    this.inspectIdx = null;
    this.emit();
  }

  estimateRangeFor(l: LotInst): [number, number] {
    const viewed = (l.clues || []).filter((c, ci) => c.free || ci < l.revealedClues).length;
    const u = E.uncertainty(viewed, this.save);
    return E.estimateRange(l.trueValue, u);
  }

  /* ---- торги ---- */
  startBidding() {
    SFX.click();
    this.day!.idx = 0;
    this.nextLotFlow();
  }

  async runBidding(l: LotInst) {
    this.lot = l;
    this.save.pending = null;
    this.engine = new AuctionEngine(l, { getSave: () => this.save, speed: this.speed, emit: () => this.emit() });
    this.lastAuctionView = null;
    this.setPhase('bidding');
    const winner = await this.engine.run();
    this.lastAuctionView = this.engine.view;
    if (winner === 'player') {
      this.setCoins(this.save.coins - l.price);
      l.margin = l.trueValue - l.price;
      this.save.stats.wins++;
      const ord = OrdersSystem.matching(this.save, ITEMS_BY_ID[l.itemId]);
      const itemDef = ITEMS_BY_ID[l.itemId];
      // мотивированная победа: заказ / набор / фикстура / донор запчастей
      const motivated = !!(ord || (itemDef.set && !this.save.owned[l.itemId]) || itemDef.fixture || itemDef.donor);
      if (motivated) this.save.stats.motivated++;
      Telemetry.log('auction_won', { lot: l.id, price: l.price, true: l.trueValue, margin: l.margin, order: ord ? ord.id : null, motivated, playerMax: l.playerMax });
      SFX.coins();
      this.persist();
      this.enterUnbox();
    } else {
      if (l.winner) {
        const b = l.npcs.find(x => x.id === l.winner);
        l.price = Math.max(l.price, b?.lastBid || l.start);
      }
      this.save.stats.losses++;
      if (this.day) this.day.losses++;
      Telemetry.log('auction_lost', { lot: l.id, winner: l.winner, price: l.price, true: l.trueValue, band: l.estimateBand, playerMax: l.playerMax || 0 });
      this.persist();
      this.enterLoss(l);
    }
  }

  playerBid() { this.engine?.playerAct('raise'); }
  playerPass() { this.engine?.playerAct('pass'); }

  /** уйти из зала до начала торгов (обратно в город) */
  leaveHall() {
    SFX.click();
    this.day = null;
    this.lot = null;
    this.inspectIdx = null;
    this.setPhase('city');
  }

  markBidTip() {
    this.save.tips = this.save.tips || {};
    this.save.tips.bid = true;
    this.persist();
  }

  nextLotFlow() {
    const d = this.day!;
    if (d.idx >= d.lots.length) { this.enterDayResult(); return; }
    const l = d.lots[d.idx];
    d.idx++;
    this.runBidding(l).catch(err => {
      console.error('auction engine error', err);
      Telemetry.log('engine_error', { msg: String(err && err.message || err) });
    });
  }

  /* ---- проигрыш: обучающий экран ---- */
  enterLoss(l: LotInst) {
    const lines = !l.winner
      ? ['Никто не стал брать: стартовая цена оказалась выше аппетита публики. Такое тоже рынок.', `Настоящая стоимость была: ${l.trueValue} ₽.`]
      : (l.playerEverBid === false ? ResultSystem.watchLines(l) : ResultSystem.lossLines(l, { band: l.estimateBand, playerMax: l.playerMax }));
    let estOk: boolean | null = null;
    let estReward = 0;
    if (l.estimateBand != null && l.winner) {
      estOk = E.bandOf(l.trueValue) === l.estimateBand;
      if (this.day) { this.day.estDay.n++; if (estOk) this.day.estDay.ok++; }
      if (estOk) {
        this.setCoins(this.save.coins + CONFIG.economy.estimateReward);
        this.save.est.correct++;
        estReward = CONFIG.economy.estimateReward;
        SFX.coins();
      }
      Telemetry.log('estimate_resolved', { lot: l.id, ok: estOk, band: l.estimateBand, true: l.trueValue, diff: E.bandDiff(l.estimateBand, l.trueValue) });
    } else if (l.estimateBand != null && !l.winner) {
      // лот не ушёл: оценка засчитывается, но без телеметрии estimate_resolved (как в прототипе)
      estOk = E.bandOf(l.trueValue) === l.estimateBand;
      if (this.day) { this.day.estDay.n++; if (estOk) { this.day.estDay.ok++; this.save.est.correct++; this.setCoins(this.save.coins + CONFIG.economy.estimateReward); estReward = CONFIG.economy.estimateReward; } }
    }
    const def = l.winner ? (NPCS as any)[l.winner] : null;
    this.loss = {
      title: !l.winner ? 'Лот не ушёл' : def ? `${def.name} забрал лот` : 'Лот ушёл',
      face: def ? (FACES[def.face] || null) : null,
      lines, estOk, estReward,
      estBandLabel: l.estimateBand != null ? E.bandLabel(l.estimateBand) : null
    };
    this.persist();
    this.setPhase('loss');
  }

  lossContinue() { SFX.click(); this.loss = null; this.lastAuctionView = null; this.engine = null; this.nextLotFlow(); }

  /* ================== ВСКРЫТИЕ ================== */
  enterUnbox() {
    const l = this.lot!;
    Telemetry.log('item_revealed', { item: l.itemId, rarity: ITEMS_BY_ID[l.itemId].rarity, cond: l.cond, lot: l.id });
    this.setPhase('unbox');
  }
  unboxContinue() {
    SFX.click();
    this.enterWorkbench();
  }

  /* ================== ВЕРСТАК: осмотр + реставрация ================== */
  enterWorkbench() {
    const l = this.lot!;
    this.workbenchOps = RestorationSystem.buildOps(this.save, l);
    this.save.pending = { stage: 'workbench', lot: l, day: this.day } as any;
    this.setPhase('workbench');
    Telemetry.log('screen_workbench', { item: l.itemId, defects: (l.defects || []).length });
    this.emit();
  }

  /** старт операции: списываем запчасти (если нужны); UI запускает мини-игру */
  startOp(op: OpView): boolean {
    const l = this.lot!;
    if (op.lockedBy) { this.toast('Сначала ' + op.lockedBy); SFX.error(); return false; }
    if (!RestorationSystem.spendParts(this.save, op.cost)) {
      const missing = (Object.keys(op.cost) as PartId[]).filter(p => (this.save.parts[p] || 0) < (op.cost[p] || 0));
      this.toast(`Не хватает: ${missing.map(p => PARTS[p].name).join(', ')} — загляните к Шпулю`);
      SFX.error();
      return false;
    }
    this.activeOp = op;
    this.persist();
    this.emit();
    return true;
  }

  /** завершение операции с качеством выполнения perf (0..1) */
  finishOp(perf: number) {
    const l = this.lot!;
    const op = this.activeOp;
    if (!op) return;
    RestorationSystem.resolveOp(l, op, perf);
    Telemetry.log('op_completed', { item: l.itemId, op: op.op, perf: +perf.toFixed(2), defects: op.defects.map(d => d.id) });
    SFX.reveal();
    this.activeOp = null;
    this.workbenchOps = RestorationSystem.buildOps(this.save, l);
    this.persist();
    this.emit();
  }

  cancelOp() {
    // запчасти уже списаны (как в реальной мастерской: вскрытие — расход)
    this.activeOp = null;
    this.emit();
  }

  /** быстрая обтирка хлама (старый быстрый режим) */
  quickWipe() {
    const l = this.lot!;
    SFX.click();
    RestorationSystem.quickWipe(l);
    Telemetry.log('item_restored', { item: l.itemId, type: 'quick', quality: l.q, ms: 0, auto: false, quick: true });
    Telemetry.log('restore_strategy', { strategy: 'quick', item: l.itemId });
    this.finishRestore();
  }

  /** «продать как есть» — без реставрации (q=0, ×0.6) */
  sellAsIs() {
    const l = this.lot!;
    SFX.click();
    RestorationSystem.asIs(l);
    Telemetry.log('restore_strategy', { strategy: 'asis', item: l.itemId });
    this.finishRestore();
  }

  /** авто-реставрация за rewarded-рекламу */
  async autoRestoreAd(): Promise<boolean> {
    const l = this.lot!;
    const todayStr = today();
    if (this.save.autoRestore.date !== todayStr) this.save.autoRestore = { date: todayStr, count: 0 };
    if (this.save.autoRestore.count >= CONFIG.ads.rewarded.auto_restore) { this.toast('Лимит авто-реставраций на сегодня'); return false; }
    const need = RestorationSystem.partsNeeded(l.defects || []);
    if (!RestorationSystem.canAfford(this.save, need)) {
      const missing = (Object.keys(need) as PartId[]).filter(p => (this.save.parts[p] || 0) < (need[p] || 0));
      this.toast(`Мастер разводит руками: нет ${missing.map(p => PARTS[p].name).join(', ')}`);
      SFX.error();
      return false;
    }
    const ok = await SDK.rewarded('auto_restore');
    if (!ok) return false;
    const t0 = Date.now();
    RestorationSystem.autoRestore(this.save, l);
    this.save.autoRestore.count++;
    Telemetry.log('item_restored', { item: l.itemId, type: 'auto', quality: l.q, ms: Date.now() - t0, auto: true });
    Telemetry.log('restore_strategy', { strategy: 'full', item: l.itemId, auto: true });
    this.finishRestore();
    return true;
  }

  /** «Готово → оценить»: стратегия full/custom по факту решённых дефектов */
  finishRestore() {
    const l = this.lot!;
    if (l.q == null) {
      l.q = RestorationSystem.manualQuality(l);
      l.strategy = RestorationSystem.progress(l.defects || []) >= 0.999 ? 'full' : 'custom';
      Telemetry.log('item_restored', { item: l.itemId, type: 'manual', quality: +l.q.toFixed(3), ms: l.restoreMs || 0, auto: false });
      Telemetry.log('restore_strategy', { strategy: l.strategy, item: l.itemId });
    }
    this.enterAppraisal();
  }

  /* ================== ОЦЕНКА ================== */
  enterAppraisal() {
    const l = this.lot!;
    const item = ITEMS_BY_ID[l.itemId];
    const q = l.q ?? 0;
    l.sale = Math.round(l.trueValue * E.priceMultiplier(q) * Goals.sellMultiplierForItem(this.save, item.cat));
    // разрешение оценки игрока (как в прототипе — однократно)
    if (l.estimateBand != null && !(l as any)._estResolved) {
      (l as any)._estResolved = true;
      const ok = E.bandOf(l.trueValue) === l.estimateBand;
      if (this.day) { this.day.estDay.n++; if (ok) this.day.estDay.ok++; }
      if (ok) { this.setCoins(this.save.coins + CONFIG.economy.estimateReward); this.save.est.correct++; }
      Telemetry.log('estimate_resolved', { lot: l.id, ok, band: l.estimateBand, true: l.trueValue, diff: E.bandDiff(l.estimateBand, l.trueValue) });
      (l as any)._estOk = ok;
    }
    this.save.pending = { stage: 'appraisal', lot: l, day: this.day } as any;
    this.setPhase('appraisal');
    Telemetry.log('screen_appraisal', { item: l.itemId, sale: l.sale, margin: (l.sale || 0) - l.price });
    this.persist();
  }
  appraisalContinue() {
    SFX.click();
    const l = this.lot!;
    const item = ITEMS_BY_ID[l.itemId];
    this.buyerOffer = BuyersSystem.offerFor(this.save, item, l.sale || 0);
    this.save.pending = { stage: 'decision', lot: l, day: this.day } as any;
    this.setPhase('decision');
    Telemetry.log('screen_decision', { item: l.itemId, dup: !!this.save.owned[l.itemId], hasOrder: !!OrdersSystem.matching(this.save, item), sale: l.sale });
    this.persist();
  }

  /* ================== РЕШЕНИЕ ================== */
  isDup(): boolean { return !!this.save.owned[this.lot!.itemId]; }

  decideSellDup() {
    const l = this.lot!;
    const v = E.dupValue(l.sale || 0);
    this.setCoins(this.save.coins + v);
    this.save.stats.dup++;
    SFX.coins();
    Telemetry.log('decision', { choice: 'dup_autosell', item: l.itemId, value: v, motivation: 'other' });
    Telemetry.log('item_sold', { item: l.itemId, value: v, to: 'dup' });
    this.completeDeal('dup', `Дубликат продан: +${v} ₽`, l.itemId, 0);
  }

  decideOrder(orderId: string) {
    const l = this.lot!;
    const ord = (this.save.orders || []).find(o => o.id === orderId);
    if (!ord) return;
    const pay = E.orderPayout(ord, l.sale || 0, this.save);
    this.setCoins(this.save.coins + pay);
    OrdersSystem.complete(this.save, ord.id);
    SFX.legendary();
    Telemetry.log('decision', { choice: 'order', item: l.itemId, order: ord.id, value: pay, motivation: 'order' });
    Telemetry.log('item_sold', { item: l.itemId, value: pay, to: ord.id });
    Telemetry.log('goal_completed', { type: 'order', id: ord.id, payout: pay });
    this.completeDeal('order', `Заказ закрыт! ${ord.who} доволен: +${pay} ₽`, l.itemId, pay);
  }

  decideNpcOffer() {
    const l = this.lot!;
    const off = this.buyerOffer;
    if (!off) return;
    this.setCoins(this.save.coins + off.price);
    this.save.stats.sold++;
    this.save.stats.best = Math.max(this.save.stats.best, off.price);
    SFX.coins();
    Telemetry.log('decision', { choice: 'npc_offer', item: l.itemId, value: off.price, margin: off.price - l.price, motivation: 'resale' });
    Telemetry.log('item_sold', { item: l.itemId, value: off.price, to: `npc_${off.npc}`, margin: off.price - l.price });
    this.completeDeal('sell', `${off.name} забрал за ${off.price} ₽ (сверх рынка!)`, l.itemId, off.price);
  }

  decideSell() {
    const l = this.lot!;
    const v = l.sale || 0;
    this.setCoins(this.save.coins + v);
    this.save.stats.sold++;
    this.save.stats.best = Math.max(this.save.stats.best, v);
    SFX.coins();
    Telemetry.log('decision', { choice: 'sell', item: l.itemId, value: v, margin: v - l.price, motivation: 'resale' });
    Telemetry.log('item_sold', { item: l.itemId, value: v, to: 'market', margin: v - l.price });
    this.completeDeal('sell', `Продано за ${v} ₽ (куплено за ${l.price} — ${v - l.price >= 0 ? '+' : ''}${v - l.price})`, l.itemId, v);
  }

  decideKeep() {
    const l = this.lot!;
    const item = ITEMS_BY_ID[l.itemId];
    const keep = E.keepValue(l.sale || 0);
    const setInProgress = item.set && Goals.setOwned(this.save, item.set) < SETS[item.set].need;
    this.setCoins(this.save.coins + keep);
    this.save.stats.kept++;
    this.save.owned[item.id] = { q: +(l.q ?? 0).toFixed(2), day: this.save.day };
    SFX.reveal();
    const motiv = setInProgress ? 'set' : 'collection';
    Telemetry.log('decision', { choice: 'keep', item: l.itemId, value: keep, motivation: motiv });
    Telemetry.log('item_kept', { item: l.itemId, motivation: motiv });
    if (item.set && Goals.setOwned(this.save, item.set) === SETS[item.set].need) {
      this.save.setDone = this.save.setDone || {};
      if (!this.save.setDone[item.set]) {
        this.save.setDone[item.set] = true;
        Telemetry.log('goal_completed', { type: 'set', set: item.set });
        this.toast(`🏆 Набор «${SETS[item.set].name}» собран! ${SETS[item.set].bonus}`);
      }
    }
    this.completeDeal('keep', `«${item.name}» занял место на полке лавки (+${keep} ₽ страховки)`, item.id, keep);
  }

  decideFixture() {
    const l = this.lot!;
    const item = ITEMS_BY_ID[l.itemId];
    const f = FIXTURES.find(x => x.item === item.id);
    if (!f) return;
    this.save.owned[item.id] = 'fixture';
    Goals.installFixture(this.save, item.id);
    SFX.reveal();
    Telemetry.log('fixture_installed', { item: item.id });
    Telemetry.log('goal_completed', { type: 'improvement', kind: 'fixture', item: item.id });
    Telemetry.log('decision', { choice: 'fixture', item: item.id, value: 0, motivation: 'improvement' });
    this.completeDeal('fixture', `${f.name}: ${f.desc}`, item.id, 0);
  }

  decideVitrine() {
    const l = this.lot!;
    const item = ITEMS_BY_ID[l.itemId];
    this.save.owned[item.id] = 'vitrine';
    Goals.vitrinePut(this.save, item.id);
    SFX.legendary();
    Telemetry.log('vitrine_put', { item: item.id });
    Telemetry.log('goal_completed', { type: 'improvement', kind: 'vitrine', item: item.id });
    Telemetry.log('decision', { choice: 'vitrine', item: item.id, value: 0, motivation: 'improvement' });
    this.completeDeal('vitrine', 'Витрина сияет: +8% ко всем продажам навсегда', item.id, 0);
  }

  decideDisassemble() {
    const l = this.lot!;
    const item = ITEMS_BY_ID[l.itemId];
    const yieldP = RestorationSystem.disassembleYield(item);
    const got = (Object.keys(yieldP) as PartId[]).map(p => { this.save.parts[p] = (this.save.parts[p] || 0) + (yieldP[p] || 0); return `${PARTS[p].icon} ${PARTS[p].name} ×${yieldP[p]}`; });
    this.save.stats.disassembled = (this.save.stats.disassembled || 0) + 1;
    SFX.creak();
    Telemetry.log('donor_disassembled', { item: item.id, parts: yieldP });
    Telemetry.log('decision', { choice: 'disassemble', item: item.id, value: 0, motivation: 'improvement' });
    this.completeDeal('disassemble', `Разобрано на запчасти: ${got.join(', ')}`, item.id, 0);
  }

  private completeDeal(kind: string, text: string, itemId: string, delta: number) {
    const l = this.lot!;
    l.delta = delta;
    l.kind = kind as any;
    if (this.day) this.day.wins++;
    this.save.pending = null;
    this.deal = { kind, text, itemId };
    this.buyerOffer = null;
    this.persist();
    this.setPhase('deal');
    // FTUE-урок: первый заказ закрыт
    if (!this.save.ftue.done && kind === 'order') {
      this.save.ftue.done = true;
      this.persist();
      this.ftueStep = 'lesson';
      Telemetry.log('ftue_step', { step: 'first_order_done' });
    }
  }

  dealContinue() {
    SFX.click();
    this.deal = null;
    this.lastAuctionView = null;
    this.engine = null;
    if (this.ftueStep === 'lesson') this.ftueStep = null;
    this.nextLotFlow();
  }

  /* ================== ИТОГИ ДНЯ ================== */
  enterDayResult() {
    const d = this.day!;
    const profit = this.save.coins - d.dayStartCoins;
    const acc = d.estDay.n ? Math.round(100 * d.estDay.ok / d.estDay.n) : null;
    let hint: string | null = null;
    if (acc != null && d.estDay.n >= 2) hint = acc >= 60
      ? '👁 Глаз-алмаз: вы всё точнее оцениваете лоты — соперникам пора напрячься.'
      : 'Совет: читайте все улики до ставки — точная оценка приносит и деньги, и знание рынка.';
    this.dayResult = { profit, acc, n: d.estDay.n, ok: d.estDay.ok, hint };
    Telemetry.log('day_end', { day: this.save.day, profit, wins: d.wins, losses: d.lots.length - d.wins, est_ok: d.estDay.ok, est_n: d.estDay.n, coins: this.save.coins });
    this.setPhase('dayResult');
    this.persist();
  }

  endDay() {
    SFX.click();
    SDK.interstitial('day_result');
    if (this.save.day === 1) this.save.ftue.done = true;
    const expired = OrdersSystem.tickDay(this.save);
    expired.forEach(o => { this.save.stats.ordersExpired++; Telemetry.log('order_expired', { id: o.id }); });
    if (expired.length) this.toast(`Заказ(ы) истекли: ${expired.map(o => o.who).join(', ')}`);
    this.save.day++;
    this.day = null;
    this.lot = null;
    this.dayResult = null;
    this.persist();
    this.enterShop(false);
  }

  /* ================== МАГАЗИН ЗАПЧАСТЕЙ ================== */
  buyPart(partId: PartId, n = 1): boolean {
    const price = PARTS[partId].price * n;
    if (this.save.coins < price) { this.toast('Не хватает монет'); SFX.error(); return false; }
    this.setCoins(this.save.coins - price);
    this.save.parts[partId] = (this.save.parts[partId] || 0) + n;
    SFX.coins();
    Telemetry.log('part_bought', { part: partId, n, coins: price });
    this.persist();
    this.emit();
    return true;
  }
  leaveParts() { SFX.click(); this.setPhase(this.lot ? 'workbench' : 'city'); if (this.lot) { this.workbenchOps = RestorationSystem.buildOps(this.save, this.lot); } this.emit(); }

  /* ================== DEV ================== */
  devGrant(coins = 0, parts?: Partial<Record<PartId, number>>) {
    if (coins) this.setCoins(this.save.coins + coins);
    if (parts) (Object.keys(parts) as PartId[]).forEach(p => { this.save.parts[p] = (this.save.parts[p] || 0) + (parts[p] || 0); });
    this.persist(); this.emit();
  }
  devUnlockAll() { this.save.shopLevel = 3; this.persist(); this.emit(); }
  devGiveItem(itemId: string) { this.save.owned[itemId] = { q: 1, day: this.save.day }; this.persist(); this.emit(); }
  devNextDay() { this.save.day++; this.save.lastDivDay = this.save.day - 1; OrdersSystem.ensureBoard(this.save, this.rnd); this.persist(); this.enterShop(true); }
  devFinishRestore() {
    if (!this.lot) return;
    RestorationSystem.autoRestore(this.save, this.lot);
    this.lot.q = CONFIG.restore.autoQuality;
    this.workbenchOps = [];
    this.persist(); this.emit();
  }
  devForceDay(houseId: any, itemId?: string) {
    this.day = { houseId, lots: [], idx: 0, dayStartCoins: this.save.coins, wins: 0, losses: 0, estDay: { n: 0, ok: 0 }, ftue: false };
    this.beginDay(houseId, false);
    if (itemId && this.day.lots.length) {
      // подменяем первый лот на выбранный предмет (тест конкретных сценариев)
      const l = this.day.lots[0];
      const item = ITEMS_BY_ID[itemId];
      l.itemId = itemId;
      l.base = Math.round((item.value[0] + item.value[1]) / 2);
      l.trueValue = E.trueValue(l.base, l.cond);
      l.defects = RestorationSystem.rollDefects(item, l.cond, E.mulberry32(l.seed ^ 0x51ed));
      l.clues = null;
      const nFree = Goals.freeClues(this.save, houseId);
      l.clues = ClueSystem.build(l, Math.max(1, nFree));
    }
    this.emit();
  }

  /* ================== справка для UI ================== */
  houseName(): string { return this.day ? HOUSES[this.day.houseId].name : ''; }
  catName(cat: string) { return CATS[cat as keyof typeof CATS]; }
  get ITEMS() { return ITEMS; }
  get ITEMS_BY_ID() { return ITEMS_BY_ID; }
  get NPCS() { return NPCS; }
  get FACES() { return FACES; }
  get CONFIG() { return CONFIG; }
  get PARTS() { return PARTS; }
  get SETS() { return SETS; }
  get FIXTURES() { return FIXTURES; }
  get Goals() { return Goals; }
  get OrdersSystem() { return OrdersSystem; }
  get E() { return E; }
  isStarted() { return this.started; }
}

export type { NpcId };
