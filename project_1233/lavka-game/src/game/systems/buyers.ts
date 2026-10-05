/* buyers.ts — НОВОЕ: NPC-покупатели, заходящие в лавку.
   Раз в день (детерминированно) один из NPC «заходит» и делает оффер
   сверх/ниже рыночной цены за свою любимую категорию.
   Визуализирует мотивацию D: «предмет интересен конкретному человеку — продай именно ему». */
import { CONFIG } from '../data/config';
import { NPCS } from '../data/world';
import { mulberry32 } from '../rng';
import type { ItemDef, NpcId, Save } from '../types';

export interface BuyerOffer {
  npc: NpcId;
  name: string;
  face: string;
  phrase: string;
  premium: number;
  price: number;
}

export const BuyersSystem = {
  /** кто сегодня зайдёт в лавку (один раз в день, детерминированно по дню) */
  rollBuyerToday(save: Save, day: number): NpcId | null {
    if (save.buyerRolledDay === day) return save.buyerToday ? save.buyerToday.npc : null;
    const rnd = mulberry32(day * 3571 + save.shopLevel * 31 + 7);
    const ids = Object.keys(CONFIG.buyers) as NpcId[];
    let chosen: NpcId | null = null;
    for (const id of ids) {
      const b = CONFIG.buyers[id]!;
      if (rnd() < b.chance) { chosen = id; break; }
    }
    save.buyerRolledDay = day;
    save.buyerToday = chosen ? { npc: chosen } : null;
    return chosen;
  },

  /** оффер на предмет (если сегодняшний покупатель интересуется им) */
  offerFor(save: Save, item: ItemDef, sale: number): BuyerOffer | null {
    const npcId = save.buyerToday ? save.buyerToday.npc : null;
    if (!npcId) return null;
    const b = CONFIG.buyers[npcId];
    if (!b) return null;
    if (b.cats && !b.cats.includes(item.cat)) return null;
    if (b.rarities && !b.rarities.includes(item.rarity)) return null;
    const def = NPCS[npcId];
    return {
      npc: npcId, name: def.name, face: def.face, phrase: b.phrase,
      premium: b.premium, price: Math.round(sale * b.premium)
    };
  }
};
