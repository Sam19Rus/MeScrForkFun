/* results.ts — PostAuctionResultSystem: обучающие строки экранов проигрыша/наблюдения.
   Порт 1-в-1 из lavka2-vp/js/systems.js (ResultSystem); lot.item → ITEMS_BY_ID[lot.itemId]. */
import { CATS, NPCS } from '../data/world';
import { ITEMS_BY_ID } from '../data/items';
import * as E from '../economy';
import type { LotInst, NpcDef } from '../types';

function winnerDef(lot: LotInst): NpcDef | null {
  const wid = typeof lot.winner === 'string' ? lot.winner : null;
  return (wid && (NPCS as any)[wid]) || null;
}

export const ResultSystem = {
  lossLines(lot: LotInst, player: { band: number | null; playerMax?: number | null }): string[] {
    const def = winnerDef(lot);
    const itemCat = ITEMS_BY_ID[lot.itemId].cat;
    const lines: string[] = [];
    if (def) lines.push(`${def.name} (${def.role}) забрал лот за ${lot.price} ₽.`);
    else lines.push(`Лот ушёл за ${lot.price} ₽.`);
    lines.push(`Настоящая стоимость: ${lot.trueValue} ₽. Ваша оценка: ${player.band != null ? E.bandLabel(player.band) : '—'}.`);
    const correct = player.band != null && E.bandOf(lot.trueValue) === player.band;
    if (player.playerMax != null) lines.push(`Вы остановились на ${player.playerMax} ₽.`);
    lines.push(correct ? 'Оценка верна — решение пасовать или биться было осознанным.'
      : 'Оценка мимо: в следующий раз учтите улики точнее.');
    if (lot.price > lot.trueValue) lines.push(`Переплата ${lot.price - lot.trueValue} ₽ — ${def ? def.name : 'покупатель'} иногда горячится. Запомните это.`);
    if (def && def.loves && def.loves.includes(itemCat))
      lines.push(`Подсказка: ${def.name} коллекционирует «${def.loves.map(c => CATS[c].name).join(', ')}» — за них он платит выше рынка.`);
    else if (def && def.cap && def.cap.any)
      lines.push(`Подсказка: ${def.name} никогда не платит больше ~${Math.round(def.cap.any[1] * 100)}% стоимости — против него выгодно торговаться.`);
    return lines;
  },
  watchLines(lot: LotInst): string[] {
    const def = winnerDef(lot);
    if (!def) return [`Лот забрал неизвестный покупатель за ${lot.price} ₽ (стоимость была ${lot.trueValue} ₽).`];
    return [`${def.name} забрал за ${lot.price} ₽ (стоимость была ${lot.trueValue} ₽).`,
      lot.price > lot.trueValue ? 'Кажется, он переплатил.' : 'Он купил выгодно — учитесь у него.'];
  }
};
