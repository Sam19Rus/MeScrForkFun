/* auction.ts — AuctionSystem: построение дня/лотов, ход NPC.
   Порт из lavka2-vp/js/systems.js + генерация дефектов экземпляра (restoration.ts).
   Экономика лота (base/cond/trueValue/start/caps) — без изменений. */
import { CONFIG } from '../data/config';
import { HOUSES, NPCS } from '../data/world';
import { ITEMS, ITEMS_BY_ID } from '../data/items';
import * as E from '../economy';
import { ClueSystem } from './clues';
import { Goals } from './goals';
import { RestorationSystem } from './restoration';
import type { HouseId, ItemDef, LotInst, NpcBidder, NpcId, Save } from '../types';

export const AuctionSystem = {
  pickItem(houseId: HouseId, rnd: () => number): ItemDef {
    const house = HOUSES[houseId];
    const pool = ITEMS.filter(it => {
      if (it.rarity === 'junk' && house.pool.junkCut && rnd() < house.pool.junkCut) return false;
      return true;
    });
    const weighted: ItemDef[] = [];
    pool.forEach(it => {
      const w = (house.pool.boost && house.pool.boost.includes(it.cat)) ? 3 : 1;
      for (let i = 0; i < w; i++) weighted.push(it);
    });
    return weighted[Math.floor(rnd() * weighted.length)];
  },

  buildLot(houseId: HouseId, rnd: () => number, dayN: number, idx: number): LotInst {
    const house = HOUSES[houseId];
    const item = AuctionSystem.pickItem(houseId, rnd);
    const packs = CONFIG.packs;
    const pack = packs[Math.floor(rnd() * packs.length)];
    let cond = E.rollCondition(rnd);
    if (pack.condWide) cond = +Math.max(0.55, Math.min(1.45, cond + (rnd() - 0.5) * 0.4)).toFixed(2);
    if (pack.condNarrow) cond = +Math.max(0.85, Math.min(1.2, cond)).toFixed(2);
    const base = E.baseValue(item, rnd);
    const tV = E.trueValue(base, cond);
    const seed = (dayN * 977 + idx * 31 + base) >>> 0;
    const lot: LotInst = {
      id: `d${dayN}_l${idx}`, itemId: item.id, base, cond, trueValue: tV, packId: pack.id,
      photo: !!house.photo, start: E.startPrice(tV, house, rnd), seed, seedN: idx,
      clues: null, revealedClues: 0, estimateBand: null,
      npcs: [], price: 0, high: null, winner: null, log: []
    };
    // дефекты экземпляра (скрыты до вскрытия)
    const lotRnd = E.mulberry32(seed ^ 0x51ed);
    lot.defects = RestorationSystem.rollDefects(item, cond, lotRnd);
    return lot;
  },

  buildDay(save: Save, houseId: HouseId, rnd: () => number): { houseId: HouseId; lots: LotInst[] } {
    const house = HOUSES[houseId];
    const lots: LotInst[] = [];
    for (let i = 0; i < house.lots; i++) lots.push(AuctionSystem.buildLot(houseId, rnd, save.day, i));
    // NPC-состав (как в прототипе)
    const ids = Object.keys(NPCS) as NpcId[];
    let pool: NpcId[] = ids.slice();
    if (houseId === 'estate') pool = ['arkady', 'petr', 'zinaida', rnd() < 0.5 ? 'nina' : 'zinaida'];
    if (houseId === 'special') pool = ids;
    const chosen = [...new Set(pool)].slice(0, houseId === 'city' ? 3 : 4);
    lots.forEach(lot => {
      const item = ITEMS_BY_ID[lot.itemId];
      lot.npcs = chosen.map(id => {
        const def = NPCS[id];
        const wants = E.npcWants(def, item);
        const cap = wants ? E.npcCap(def, item, lot.trueValue, rnd) : 0;
        return { id, cap, active: cap > lot.start * 0.6, lastBid: 0 };
      }).filter(b => b.active);
    });
    const nFree = Goals.freeClues(save, houseId);
    lots.forEach(lot => {
      lot.clues = ClueSystem.build(lot, Math.max(1, nFree + (packClues(lot) || 0)));
    });
    return { houseId, lots };
  },

  buildFTUEDay(save: Save): { houseId: HouseId; lots: LotInst[] } {
    const rnd = E.mulberry32(777);
    const house = HOUSES['city'];
    const lots = CONFIG.ftue.lots.map((spec, i) => {
      const item = ITEMS_BY_ID[spec.item];
      const cond = spec.cond;
      const base = Math.round((item.value[0] + item.value[1]) / 2);
      const tV = E.trueValue(base, cond);
      const lot: LotInst = {
        id: `ftue_l${i}`, itemId: item.id, base, cond, trueValue: tV,
        packId: CONFIG.packs[i % CONFIG.packs.length].id, photo: false,
        start: E.startPrice(tV, house, rnd), seed: 1000 + i, seedN: i,
        clues: null, revealedClues: 0, estimateBand: null, npcs: [], price: 0, high: null, winner: null, log: []
      };
      lot.npcs = (spec.npcs || []).map(id => {
        const def = NPCS[id];
        const cap = spec.capMultOverride != null
          ? E.npcCap(def, item, tV, rnd, spec.capMultOverride)
          : E.npcCap(def, item, tV, rnd);
        return { id, cap, active: cap > lot.start * 0.6, lastBid: 0 };
      }).filter(b => b.active) as NpcBidder[];
      lot.clues = ClueSystem.build(lot, Math.max(1, 2 + (packClues(lot) || 0)));
      // явные обучающие дефекты
      lot.defects = RestorationSystem.rollDefects(item, cond, rnd, spec.defects as any);
      return lot;
    });
    void save;
    return { houseId: 'city', lots };
  },

  /* ---- ход NPC (конечный автомат архетипа) ---- */
  npcDecide(bidder: NpcBidder, lot: LotInst): { action: 'bid' | 'pass' | 'wait'; amount?: number; phrase?: string } {
    const def = NPCS[bidder.id];
    const inc = E.increment(Math.max(lot.price, lot.start));
    const next = Math.max(lot.price + inc, lot.start);
    if (next > bidder.cap) return { action: 'pass', phrase: def.pass[0] };
    if (def.aggression < 1 && Math.random() > def.aggression + 0.25) return { action: 'wait' };
    return { action: 'bid', amount: next, phrase: def.bid[Math.floor(Math.random() * def.bid.length)] };
  }
};

function packClues(lot: LotInst): number {
  const p = CONFIG.packs.find(x => x.id === lot.packId);
  return p ? p.clues : 0;
}
