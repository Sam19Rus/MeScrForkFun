/* AuctionEngine.ts — движок торгов (порт async-цикла runBidding из lavka2-vp/js/game.js).
   Логика и правила завершения — без изменений; добавлен слой представления (AuctionView):
   эмоции NPC, пузыри реплик, состояние кнопок игрока. UI только рендерит view. */
import { NPCS } from '../data/world';
import { ITEMS_BY_ID } from '../data/items';
import * as E from '../economy';
import { AuctionSystem } from '../systems/auction';
import { Telemetry } from '../telemetry';
import { SFX } from '../sfx';
import type { AuctionView, LotInst, NpcEmotion, NpcView, Save } from '../types';

export interface EngineOpts {
  getSave(): Save;
  speed: number;                      // 550 норма, 40 fast, 0 headless
  emit(): void;                       // сигнал контроллеру пересобрать снапшот
}

export class AuctionEngine {
  view: AuctionView;
  running = false;
  private playerResolve: ((a: 'raise' | 'pass') => void) | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(public lot: LotInst, public opts: EngineOpts) {
    this.view = this.buildView();
  }

  destroy() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.playerResolve) { this.playerResolve('pass'); this.playerResolve = null; }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => {
      const t = setTimeout(r, ms * (this.opts.speed / 550));
      this.timers.push(t);
    });
  }

  private touch() { this.view = { ...this.view, npcs: { ...this.view.npcs } }; this.opts.emit(); }

  nextBidPrice(l: LotInst): number {
    return l.price === 0 ? l.start : l.price + E.increment(l.price);
  }

  buildView(): AuctionView {
    const l = this.lot;
    const save = this.opts.getSave();
    const item = ITEMS_BY_ID[l.itemId];
    const npcs: Record<string, NpcView> = {};
    l.npcs.forEach(b => {
      const def = NPCS[b.id];
      npcs[b.id] = {
        id: b.id, emotion: 'idle', bubble: null, bubbleUntil: 0,
        active: b.active, leader: l.high === b.id, lastBid: b.lastBid,
        wants: E.npcWants(def, item)
      };
    });
    const nb = this.nextBidPrice(l);
    return {
      price: l.price || l.start,
      nextPrice: nb,
      step: E.increment(Math.max(l.price, l.start)),
      isLeader: l.high === 'player',
      playerIn: !!l.playerIn,
      playerTurn: false,
      canAfford: nb <= save.coins,
      resolved: !!l._resolved,
      winner: l.winner,
      npcs,
      log: l.log.slice(-6),
      gavel: false
    };
  }

  private syncBase() {
    const l = this.lot;
    const save = this.opts.getSave();
    const nb = this.nextBidPrice(l);
    const v = this.view;
    v.price = l.price || l.start;
    v.nextPrice = nb;
    v.step = E.increment(Math.max(l.price, l.start));
    v.isLeader = l.high === 'player';
    v.playerIn = !!l.playerIn;
    v.canAfford = nb <= save.coins;
    v.resolved = !!l._resolved;
    v.winner = l.winner;
    v.log = l.log.slice(-6);
    l.npcs.forEach(b => {
      const nv = v.npcs[b.id];
      if (!nv) return;
      nv.active = b.active;
      nv.leader = l.high === b.id;
      nv.lastBid = b.lastBid;
      if (!b.active && nv.emotion !== 'pass' && nv.emotion !== 'sad') nv.emotion = 'pass';
    });
  }

  setEmo(id: string, emo: NpcEmotion, bubble?: string | null, ms = 2600) {
    const nv = this.view.npcs[id];
    if (!nv) return;
    nv.emotion = emo;
    if (bubble != null) {
      nv.bubble = bubble;
      nv.bubbleUntil = Date.now() + Math.max(400, ms * Math.max(0.15, this.opts.speed / 550));
      const t = setTimeout(() => { nv.bubble = null; this.touch(); }, Math.max(400, ms * Math.max(0.15, this.opts.speed / 550)));
      this.timers.push(t);
    }
    this.touch();
  }

  private bidLog(msg: string) { this.lot.log.push(msg); }

  /** действие игрока из UI */
  playerAct(act: 'raise' | 'pass') {
    if (this.playerResolve) { const r = this.playerResolve; this.playerResolve = null; r(act); }
  }

  private waitPlayer(): Promise<'raise' | 'pass'> {
    return new Promise(res => { this.playerResolve = res; });
  }

  /** главный цикл — правила завершения перенесены 1-в-1 */
  async run(): Promise<string | null> {
    const l = this.lot;
    const save = this.opts.getSave();
    // инициализация (как в прототипе)
    if (!l._inited) {
      l.price = 0; l.high = null; l.playerIn = true; l._resolved = false;
      l.npcs.forEach(b => { b.active = b.cap > 0 && (b.cap >= l.start * 0.75 || Math.random() < 0.6); b.lastBid = 0; b.waits = 0; });
      (l as any)._inited = true;
    }
    this.running = true;
    this.syncBase();
    l.npcs.forEach(b => this.setEmo(b.id, 'idle'));
    this.touch();
    Telemetry.log('bid_started', { lot: l.id, start: l.start, npcs: l.npcs.filter(b => b.active).map(b => b.id) });

    let guard = 0;
    while (guard++ < 60) {
      /* --- ход игрока --- */
      if (l.playerIn && l.high !== 'player') {
        const nb = this.nextBidPrice(l);
        if (nb > save.coins) {
          this.bidLog('Вы: не хватает монет — пас');
          l.playerIn = false;
          l.playerMax = l.playerMax || l.price;
          Telemetry.log('bid_stopped', { lot: l.id, reason: 'no_coins', price: l.price, playerMax: l.playerMax });
        } else {
          this.syncBase();
          this.view.playerTurn = true;
          this.touch();
          const act = await this.waitPlayer();
          this.view.playerTurn = false;
          if (act === 'raise') {
            l.price = nb; l.high = 'player'; l.playerEverBid = true; l.playerMax = nb;
            l.rounds = (l.rounds || 0) + 1;
            this.bidLog(`Вы: ${nb} ₽`);
            Telemetry.log('bid_raised', { lot: l.id, amount: nb, round: l.rounds });
            SFX.click();
            // реакции соперников на ставку игрока
            l.npcs.forEach(b => {
              if (!b.active) return;
              const def = NPCS[b.id];
              if (def.aggression >= 0.7 && b.cap > nb) this.setEmo(b.id, 'angry', b.id === 'arkady' ? def.emo.outbid : null, 1800);
              else if (b.cap <= nb) this.setEmo(b.id, 'think', null, 1200);
            });
          } else {
            l.playerIn = false;
            l.playerMax = l.playerMax || l.price;
            this.bidLog(`Вы: пас (остановились на ${l.playerMax} ₽)`);
            Telemetry.log('bid_stopped', { lot: l.id, reason: 'choice', price: l.price, playerMax: l.playerMax });
          }
        }
        this.syncBase(); this.touch();
        await this.sleep(this.opts.speed * 0.6);
      }

      /* --- ходы NPC --- */
      let anyoneBid = false;
      for (const b of l.npcs) {
        if (!b.active) continue;
        if (l.high === b.id) continue;
        this.setEmo(b.id, 'think');
        await this.sleep(this.opts.speed * 0.45);
        const dec = AuctionSystem.npcDecide(b, l);
        const def = NPCS[b.id];
        if (dec.action === 'bid') {
          l.price = dec.amount!; l.high = b.id; b.lastBid = dec.amount!;
          this.bidLog(`${def.name}: ${dec.amount} ₽ — «${dec.phrase}»`);
          SFX.click(); anyoneBid = true;
          this.setEmo(b.id, 'bid', dec.phrase, 2400);
          setTimeout(() => { if (l.high === b.id && b.active) this.setEmo(b.id, 'lead'); }, Math.max(300, this.opts.speed * 1.2));
          this.syncBase(); this.touch();
          await this.sleep(this.opts.speed);
          if (l.playerIn) break; // возвращаем ход игроку
        } else if (dec.action === 'pass') {
          b.active = false;
          this.bidLog(`${def.name}: пас`);
          Telemetry.log('npc_pass', { lot: l.id, npc: b.id, at: l.price });
          this.setEmo(b.id, 'pass', def.pass[0], 2200);
          this.syncBase(); this.touch();
          await this.sleep(this.opts.speed * 0.5);
        } else {
          b.waits = (b.waits || 0) + 1;
          if (b.waits > 2) { b.active = false; this.bidLog(`${def.name}: пас (передумал)`); this.setEmo(b.id, 'pass'); }
          await this.sleep(this.opts.speed * 0.4);
        }
      }

      const left = l.npcs.filter(b => b.active && l.high !== b.id).length;
      // конец: игрок-лидер и активных соперников нет
      if (l.high === 'player' && l.npcs.filter(b => b.active).length === 0) { l.winner = 'player'; break; }
      if (l.high === 'player' && left === 0) { l.winner = 'player'; break; }
      // конец: игрок выбыл
      if (!l.playerIn) {
        const activeNpcs = l.npcs.filter(b => b.active);
        if (activeNpcs.length === 0) { l.winner = l.high; break; }
        if (activeNpcs.length === 1 && l.high === activeNpcs[0].id) { l.winner = l.high; break; }
        if (!anyoneBid && l.price === 0 && activeNpcs.every(b => !b.active)) { l.winner = null; break; }
      }
      if (l.price === 0 && !l.playerIn && !anyoneBid) { l.winner = null; break; }
    }
    l._resolved = true;
    this.running = false;

    /* --- финальные эмоции --- */
    this.syncBase();
    if (l.winner === 'player') {
      this.bidLog(`🔨 Молоток! Лот ваш за ${l.price} ₽`);
      l.npcs.forEach(b => {
        const def = NPCS[b.id];
        if (b.cap >= l.price * 0.8) this.setEmo(b.id, 'angry', def.emo.lose, 3000);
        else this.setEmo(b.id, 'sad', null, 3000);
      });
      this.view.gavel = true;
      SFX.gavel();
      this.touch();
      await this.sleep(this.opts.speed);
      this.view.gavel = false;
    } else if (l.winner) {
      const w = this.view.npcs[l.winner];
      const def = NPCS[l.winner as keyof typeof NPCS];
      this.bidLog(`🔨 Молоток! ${def ? def.name : ''} за ${l.price} ₽`);
      if (w) this.setEmo(l.winner, 'happy', def ? def.emo.win : null, 3000);
      l.npcs.forEach(b => { if (b.id !== l.winner) this.setEmo(b.id, 'pass'); });
      this.view.gavel = true;
      SFX.gavel();
      this.touch();
      await this.sleep(this.opts.speed);
      this.view.gavel = false;
    } else {
      this.bidLog('Лот не ушёл — никто не стал брать.');
    }
    this.syncBase();
    this.view.log = l.log.slice(-6);
    this.touch();
    return l.winner;
  }
}
