/* clues.ts — ClueSystem: построение улик лота. Порт 1-в-1 из lavka2-vp/js/systems.js.
   Новое: улика «история» (story) для части предметов — иногда раскрывает доп. информацию
   и влияет на интерес покупателя (через категорию/слова продавца — как в прототипе). */
import { CATS } from '../data/world';
import { CONFIG } from '../data/config';
import { mulberry32 } from '../rng';
import type { Clue, LotInst } from '../types';
import { ITEMS_BY_ID } from '../data/items';

const COND_HINTS_BAD = ['«Следы влаги на упаковке»', '«Угол коробки примят»', '«Пахнет пылью и подвалом»'];
const COND_HINTS_GOOD = ['«Упаковка на удивление целая»', '«Хранили бережно»', '«Почти не пользовались»'];

export const ClueSystem = {
  build(lot: LotInst, nFree: number): Clue[] {
    const it = ITEMS_BY_ID[lot.itemId];
    const clues: Clue[] = [];
    clues.push({ kind: 'cat', text: `Категория на глаз: ${CATS[it.cat].icon} ${CATS[it.cat].name}`, free: false });
    clues.push({ kind: 'era', text: `Эпоха/происхождение: ${CONFIG.eras[it.cat]}`, free: false });
    if (lot.photo) clues.push({ kind: 'photo', text: 'Частичное фото: в щель упаковки видно фрагмент', sprite: true, free: false });
    clues.push({ kind: 'material', text: `Материал: ${it.clues.material}`, free: false });
    clues.push({ kind: 'weight', text: `Вес: ${it.clues.weight}`, free: false });
    clues.push({ kind: 'seller', text: `Слова продавца: ${it.clues.seller}`, free: false });
    if (it.clues.marking && it.clues.marking !== 'нет') clues.push({ kind: 'marking', text: `Маркировка: ${it.clues.marking}`, free: false });
    clues.push({
      kind: 'cond',
      text: lot.cond < 0.85 ? COND_HINTS_BAD[(lot.seedN || 0) % COND_HINTS_BAD.length]
        : lot.cond > 1.12 ? COND_HINTS_GOOD[(lot.seedN || 0) % COND_HINTS_GOOD.length]
          : '«Состояние обычное, бывшее в употреблении»',
      free: false
    });
    // детерминированное перемешивание + разметка бесплатных
    const rnd = mulberry32(lot.seed);
    clues.sort(() => rnd() - 0.5);
    clues.forEach((c, i) => { c.free = i < nFree; });
    return clues;
  }
};
