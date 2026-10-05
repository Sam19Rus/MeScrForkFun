/* goals.ts — GoalsSystem: наборы, уровни лавки, фикстуры, витрина, дивиденд.
   Порт 1-в-1 из lavka2-vp/js/systems.js (GoalsSystem). */
import { CONFIG } from '../data/config';
import { FIXTURES, HOUSES, SETS } from '../data/world';
import { ITEMS } from '../data/items';
import type { HouseId, Save } from '../types';

export const Goals = {
  setOwned(save: Save, setId: string): number {
    const ids = ITEMS.filter(i => i.set === setId).map(i => i.id);
    return ids.filter(id => save.owned[id]).length;
  },
  setTotal(setId: string): number {
    return ITEMS.filter(i => i.set === setId).length;
  },
  setActive(save: Save, setId: string): boolean {
    return Goals.setOwned(save, setId) >= (SETS as any)[setId].need;
  },
  setsDoneCount(save: Save, threshold?: number): number {
    return Object.keys(SETS).filter(s => Goals.setOwned(save, s) >= (threshold || (SETS as any)[s].need)).length;
  },
  shopLevel(save: Save): number {
    return save.shopLevel || 1;
  },
  canUpgrade(save: Save): { ok: boolean; reqs?: string[]; next: any } | null {
    const L = Goals.shopLevel(save);
    const next = CONFIG.shop[L + 1];
    if (!next) return null;
    const reqs: string[] = [];
    if (save.coins < (next.cost || 0)) reqs.push(`монеты ${save.coins}/${next.cost}`);
    if ((save.stats.ordersDone || 0) < (next.ordersDone || 0)) reqs.push(`заказы ${save.stats.ordersDone || 0}/${next.ordersDone}`);
    const setsOk = Goals.setsDoneCount(save, next.setsAt) >= (next.setsNeeded || 0);
    const altOk = !!(next.altOrdersDone && (save.stats.ordersDone || 0) >= next.altOrdersDone);
    if (!setsOk && !altOk) {
      reqs.push(`наборы (≥${next.setsAt} предм.) ${Goals.setsDoneCount(save, next.setsAt)}/${next.setsNeeded}` +
        (next.altOrdersDone ? ` ИЛИ ${next.altOrdersDone} выполненных заказов (${save.stats.ordersDone || 0})` : ''));
    }
    return reqs.length ? { ok: false, reqs, next } : { ok: true, next };
  },
  upgrade(save: Save): boolean {
    const c = Goals.canUpgrade(save);
    if (!c || !c.ok) return false;
    save.coins -= c.next.cost;
    save.shopLevel = Goals.shopLevel(save) + 1;
    return true;
  },
  sellMultiplier(save: Save): number {
    let m = 1;
    (save.fixtures || []).forEach(fid => {
      const f = FIXTURES.find(x => x.item === fid);
      if (f && f.effect.sellAll) m *= f.effect.sellAll;
    });
    (save.vitrine || []).forEach(() => { m *= 1.08; });
    return m;
  },
  sellMultiplierForItem(save: Save, cat: string): number {
    let m = Goals.sellMultiplier(save);
    if (cat === 'home' && Goals.setActive(save, 'home')) m *= SETS.home.effect.mult || 1;
    return m;
  },
  installFixture(save: Save, itemId: string): boolean {
    const f = FIXTURES.find(x => x.item === itemId);
    if (!f || !save.owned[itemId]) return false;
    if ((save.fixtures || []).includes(itemId)) return false;
    save.fixtures = save.fixtures || [];
    save.fixtures.push(itemId);
    return true;
  },
  vitrinePut(save: Save, itemId: string): boolean {
    const slots = CONFIG.shop[Goals.shopLevel(save)].vitrine || 0;
    save.vitrine = save.vitrine || [];
    if (save.vitrine.length >= slots) return false;
    save.vitrine.push(itemId);
    return true;
  },
  dividend(save: Save): number {
    return CONFIG.dailyDividend.base + CONFIG.dailyDividend.perSetDone * Goals.setsDoneCount(save);
  },
  orderSlots(save: Save): number {
    return CONFIG.shop[Goals.shopLevel(save)].orders;
  },
  houses(save: Save): HouseId[] {
    return CONFIG.shop[Goals.shopLevel(save)].houses;
  },
  houseUnlocked(save: Save, houseId: HouseId): boolean {
    return Goals.houses(save).includes(houseId);
  },
  freeClues(save: Save, house: HouseId): number {
    let n = HOUSES[house].clueFree;
    if (CONFIG.shop[Goals.shopLevel(save)].extraClue) n += 1;
    return n;
  }
};
