/* economy.ts — оценка стоимости, NPC-потолки, шаги торгов, выплаты, бонусы.
   Порт 1-в-1 из lavka2-vp/js/economy.js (модель v4, калибрована симуляцией 10K игроков).
   Единственный источник экономических решений; числа — только CONFIG. */
import { CONFIG } from './data/config';
import { SETS } from './data/world';
import { mulberry32, r5, uni } from './rng';
import type { HouseDef, ItemDef, NpcDef, Order, Save } from './types';
import { Goals } from './systems/goals';

/* ---- лот ---- */
export function rollCondition(rnd: () => number): number {
  return +uni(rnd, CONFIG.lot.conditionRange[0], CONFIG.lot.conditionRange[1]).toFixed(2);
}
export function baseValue(item: ItemDef, rnd: () => number): number {
  return Math.round(uni(rnd, item.value[0], item.value[1]));
}
export function trueValue(base: number, cond: number): number {
  return Math.round(base * cond);
}
export function startPrice(tV: number, house: HouseDef, rnd: () => number): number {
  const f = house.startFrac || CONFIG.lot.startFracDefault;
  return r5(tV * uni(rnd, f[0], f[1]));
}
export function increment(price: number): number {
  return Math.max(CONFIG.lot.minIncrement, r5(price * CONFIG.lot.incrementFrac));
}

/* ---- NPC-потолок ставки ---- */
export function npcCap(npcDef: NpcDef, item: ItemDef, tV: number, rnd: () => number, override?: number | null): number {
  if (override != null) return Math.round(tV * override);
  const loves = npcDef.loves && npcDef.loves.includes(item.cat);
  const range = npcDef.cap.any ? npcDef.cap.any : (loves ? npcDef.cap.love : npcDef.cap.other);
  if (!range || (range[0] === 0 && range[1] === 0)) return 0; // Пётр не торгуется за чужое
  const noise = 1 + uni(rnd, -1, 1) * CONFIG.npc.capNoise;
  return Math.max(0, Math.round(tV * uni(rnd, range[0], range[1]) * noise));
}
export function npcWants(npcDef: NpcDef, item: ItemDef): boolean {
  if (!npcDef.loves) return true; // Зинаида/Нина берут всё (в пределах кэпа)
  return npcDef.loves.includes(item.cat);
}

/* ---- улики и оценка игрока ---- */
export function uncertainty(cluesViewed: number, save?: Save | null): number {
  let narrow = CONFIG.clue.narrowPerClue;
  if (save && save.fixtures && save.fixtures.includes('watch')) narrow *= 1.35; // часы в витрине
  let baseU = CONFIG.clue.baseU;
  if (save && Goals.setActive(save, 'clocks')) baseU *= 0.75;                   // сет «Мастер и приборы»
  return 1 + (baseU - 1) * Math.pow(1 - narrow, cluesViewed);
}
export function estimateRange(tV: number, u: number): [number, number] {
  return [Math.max(5, Math.round(tV / u)), Math.round(tV * u)];
}
export function bandOf(v: number): number {
  const b = CONFIG.estimateBands;
  for (let i = 0; i < b.length; i++) if (v >= b[i][0] && v < b[i][1]) return i;
  return b.length - 1;
}
export function bandLabel(i: number): string {
  const b = CONFIG.estimateBands[i];
  return b[1] >= 999999 ? `${b[0]}+` : `${b[0]}–${b[1]}`;
}
/** относительная ошибка оценки (для телеметрии) */
export function bandDiff(band: number, tV: number): number {
  const b = CONFIG.estimateBands[band];
  const mid = b[1] >= 999999 ? b[0] * 1.5 : (b[0] + b[1]) / 2;
  return +((mid - tV) / tV).toFixed(2);
}

/* ---- реставрация (модель v4; качество из прогресса решения дефектов) ---- */
export function qualityFromProgress(p: number): number {
  const R = CONFIG.restore;
  if (p <= R.qFrom) return 0;
  return Math.min(1, (p - R.qFrom) / (R.qTo - R.qFrom));
}
export function priceMultiplier(q: number): number {
  return 0.6 + 0.6 * q;
}

/* ---- продажа / заказы / бонусы ---- */
export function saleValue(tV: number, q: number, save?: Save | null): number {
  let m = priceMultiplier(q);
  if (save) {
    m *= Goals.sellMultiplier(save); // витрина + фикстуры
    if ((save.fixtures || []).includes('sewing')) {
      const floor = CONFIG.restore.qualityFloorBonus;
      m = Math.max(m, 0.6 + 0.6 * floor + 0.35);
    }
  }
  return Math.round(tV * m);
}
export function orderPayout(order: Order, saleV: number, save?: Save | null): number {
  const mult = CONFIG.economy.orderMult[order.mult];
  let m = mult;
  if (save && Goals.setActive(save, 'tech') && order.want.cat === 'tech') m *= 1.5;
  return Math.round(saleV * m);
}
export function keepValue(sale: number): number {
  return Math.round(sale * CONFIG.economy.keep_refund);
}
export function dupValue(sale: number): number {
  return Math.round(sale * CONFIG.economy.dup_fraction);
}

/* ---- EV-справки для dev-панели ---- */
export function expectedTrueValue(catPool: ItemDef[], condAvg = 1.0): number {
  const avg = catPool.reduce((s, it) => s + (it.value[0] + it.value[1]) / 2, 0) / catPool.length;
  return avg * condAvg;
}

export { mulberry32, uni, r5, SETS };
