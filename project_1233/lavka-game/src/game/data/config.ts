/* config.ts — единственный источник чисел баланса (требование: data-driven).
   Портер CONFIG из lavka2-vp/js/data.js v0.2.0 + новые секции вертикального среза:
   parts (запчасти), buyers (NPC-офферы), defects (число дефектов по ярусам), restore.quickQuality. */
import type { CategoryId, HouseId, NpcId, PartId } from '../types';

export interface ShopLevelDef {
  name: string; cost?: number; ordersDone?: number; setsNeeded?: number; setsAt?: number;
  altOrdersDone?: number; orders: number; houses: HouseId[]; vitrine: number; extraClue?: boolean;
}

export interface BuyerDef {
  cats: CategoryId[] | null;
  rarities?: string[];
  premium: number;
  chance: number;
  phrase: string;
}

export interface GameConfig {
  meta: { name: string; version: string; saveKey: string };
  start_coins: number;
  bailout: { threshold: number; amount: number };
  lot: { conditionRange: [number, number]; startFracDefault: [number, number]; incrementFrac: number; minIncrement: number };
  clue: { baseU: number; narrowPerClue: number; estimateReward: number };
  estimateBands: [number, number][];
  restore: {
    minProgress: number; qFrom: number; qTo: number; autoQuality: number;
    quickQuality: number; qualityFloorBonus: number;
    /** число дефектов по редкости [min,max]; cond<0.85 → +1 к max, cond>1.15 → −1 к min */
    defectCounts: Record<string, [number, number]>;
    /** доля стоимости запчастей, возвращаемая при «разобрать» */
    disassembleRefund: number;
  };
  economy: { keep_refund: number; dup_fraction: number; orderMult: { cat: number; item: number; rarity: number }; estimateReward: number };
  npc: { capNoise: number };
  shop: Record<number, ShopLevelDef>;
  dailyDividend: { base: number; perSetDone: number };
  packs: { id: string; name: string; clues: number; desc: string; condWide?: boolean; condNarrow?: boolean }[];
  eras: Record<CategoryId, string>;
  ads: {
    rewarded: { extra_clue: number; auto_restore: number; advance: number; double_sale: number };
    interstitial: { morning_to_auction: { every: number }; day_result: { every: number } };
  };
  ftue: {
    order: { id: string; who: string; whoDat: string; face: string; want: { cat?: CategoryId }; text: string; days: number };
    lots: { item: string; cond: number; npcs: NpcId[]; capMultOverride?: number; defects?: string[] }[];
  };
  /** стартовый набор запчастей */
  startParts: Partial<Record<PartId, number>>;
  /** магазин запчастей: сколько особых деталей в ассортименте в день */
  partsShop: { specialsPerDay: number; specialMarkup: number };
  /** NPC-покупатели, заходящие в лавку (оффер сверх рыночной цены) */
  buyers: Partial<Record<NpcId, BuyerDef>>;
  rarityLabels: Record<string, string>;
}

export const CONFIG: GameConfig = {
  meta: { name: 'Лавка 2.0: Аукцион', version: '0.5.1-vs', saveKey: 'lavka_game_save_v3' },
  start_coins: 600,
  bailout: { threshold: 120, amount: 150 },
  lot: { conditionRange: [0.7, 1.3], startFracDefault: [0.22, 0.34], incrementFrac: 0.13, minIncrement: 10 },
  clue: { baseU: 2.6, narrowPerClue: 0.30, estimateReward: 25 },
  estimateBands: [[0, 200], [200, 600], [600, 1500], [1500, 999999]],
  restore: {
    minProgress: 0.60, qFrom: 0.55, qTo: 0.97, autoQuality: 1.0,
    quickQuality: 0.75, qualityFloorBonus: 0.15,
    defectCounts: { junk: [1, 1], common: [1, 2], rare: [2, 3], epic: [3, 4], legend: [3, 5] },
    disassembleRefund: 0.5
  },
  economy: { keep_refund: 0.35, dup_fraction: 0.40, orderMult: { cat: 2.2, item: 3.0, rarity: 2.5 }, estimateReward: 25 },
  npc: { capNoise: 0.15 },
  shop: {
    1: { name: 'Ларёк у вокзала', orders: 3, houses: ['city'], vitrine: 0 },
    2: { name: 'Антикварная лавка', cost: 1500, ordersDone: 2, setsNeeded: 1, setsAt: 3, altOrdersDone: 4,
         orders: 4, houses: ['city', 'estate'], vitrine: 1, extraClue: true },
    3: { name: 'Мастерская древностей', cost: 5000, ordersDone: 6, setsNeeded: 2, setsAt: 5, altOrdersDone: 9,
         orders: 5, houses: ['city', 'estate', 'special'], vitrine: 2 }
  },
  dailyDividend: { base: 30, perSetDone: 25 },
  packs: [
    { id: 'box',    name: 'Картонная коробка', clues: 0,  desc: 'обычная тара' },
    { id: 'chest',  name: 'Чемодан',           clues: 1,  desc: 'через щели видно больше' },
    { id: 'sack',   name: 'Мешок',             clues: -1, desc: 'тёмный тюк — улик меньше' },
    { id: 'crate',  name: 'Обрешечённый ящик', clues: 0,  condWide: true,   desc: 'состояние плавает сильнее' },
    { id: 'coffre', name: 'Дорожной кофр',     clues: 1,  condNarrow: true, desc: 'хранили бережно' }
  ],
  eras: {
    tech: 'середина — конец XX века, заводское изделие',
    clocks: 'начало — середина XX века, прибор',
    home: 'XIX — середина XX века, домашний обиход',
    free: 'разнобой XX века'
  },
  ads: { rewarded: { extra_clue: 2, auto_restore: 3, advance: 1, double_sale: 2 },
         interstitial: { morning_to_auction: { every: 2 }, day_result: { every: 1 } } },
  ftue: {
    order: { id: 'ftue', who: 'Иваныч', whoDat: 'Иванычу', face: 'c1', want: { cat: 'tech' },
             text: 'Срочно нужна любая ретротехника! Жена просила «чтоб гудело и блестело».', days: 4 },
    // defects — явные дефекты FTUE-лотов (обучение: первый лот = только грязь)
    lots: [ { item: 'phone', cond: 0.9,  npcs: ['zinaida'], capMultOverride: 0.6, defects: ['dirt'] },
            { item: 'cplayer', cond: 0.85, npcs: ['nina'], capMultOverride: 0.5, defects: ['dirt', 'dust'] },
            { item: 'pins', cond: 1.0, npcs: ['zinaida', 'nina'], defects: ['dust'] },
            { item: 'jug', cond: 0.8, npcs: ['nina'], defects: ['dirt'] } ]
  },
  startParts: { polish: 2, universal: 1 },
  partsShop: { specialsPerDay: 1, specialMarkup: 1.0 },
  buyers: {
    petr:    { cats: ['clocks'], premium: 1.25, chance: 0.55, phrase: 'Тик-так. Для мастерской заберу — и не продешевлю.' },
    arkady:  { cats: ['tech'], premium: 1.2, chance: 0.5, phrase: 'В коллекцию! Заплачу сверху, мне не жалко.' },
    nina:    { cats: ['free'], rarities: ['junk'], premium: 1.5, chance: 0.45, phrase: 'Внучку порадую! Не жалко и переплатить.' },
    zinaida: { cats: null, premium: 0.95, chance: 0.3, phrase: 'Беру всё подряд, но дёшево — мне ещё margin нужен.' }
  },
  rarityLabels: { junk: 'Хлам', common: 'Обычный', rare: 'Редкий', epic: 'Эпический', legend: 'Легендарный' }
};
