/* types.ts — типы данных «Лавка 2.0: Аукцион» (vertical slice).
   Вся игровая доменная модель; UI-слой импортирует только её. */

export type CategoryId = 'tech' | 'clocks' | 'home' | 'free';
export type Rarity = 'junk' | 'common' | 'rare' | 'epic' | 'legend';
export type NpcId = 'arkady' | 'zinaida' | 'petr' | 'nina';
export type HouseId = 'city' | 'estate' | 'special';
export type PartId = 'universal' | 'electronic' | 'mechanical' | 'polish' | 'knob' | 'belt' | 'pendulum' | 'lens';
export type OpId = 'clean' | 'polish' | 'assemble' | 'repair' | 'replace' | 'calibrate';
export type DefectId =
  | 'dirt' | 'dust' | 'rust' | 'scratches' | 'worn'
  | 'crack' | 'broken_mech' | 'missing_part' | 'consumable' | 'calibration';

export interface CategoryDef { name: string; icon: string; }

export interface ItemClues {
  material: string; weight: string; seller: string; marking?: string;
}

export interface ItemDef {
  id: string;
  name: string;
  cat: CategoryId;
  rarity: Rarity;
  /** диапазон базовой ценности, ₽ */
  value: [number, number];
  /** legacy-тип ведущей мини-игры (clean|polish|assemble) — используется для быстрой очистк */
  restore: 'clean' | 'polish' | 'assemble';
  set?: 'tech' | 'clocks' | 'home';
  fixture?: string | null;
  clues: ItemClues;
  story: string;
  /** SVG-арт (строка, viewBox 200×200) */
  svg: string;
  /** особая деталь, нужная для полной реставрации (defect missing_part) */
  requiredPart?: PartId;
  /** что даёт разборка предмета-донора на запчасти */
  yieldParts?: Partial<Record<PartId, number>>;
  /** предмет-донор: в основном приобретается ради запчастей */
  donor?: boolean;
  /** тяжёлый пул дефектов (предмет почти всегда сильно повреждён) */
  defectBias?: 'heavy';
  /** явный пул дефектов (переопределяет категорийный) */
  defectPool?: DefectId[];
  /** явное число дефектов [min,max] (переопределяет ярусное) */
  defectCount?: [number, number];
  /** визуальное представление: подпись на полке лавки и т.п. */
  shelf?: 'wall' | 'shelf' | 'vitrine' | 'desk';
}

export interface SetDef {
  name: string; need: number; cat: CategoryId; bonus: string;
  effect: { orderBoostCat?: CategoryId; mult?: number; clueU?: number; sellBoostCat?: CategoryId };
}

export interface FixtureDef {
  item: string; name: string; desc: string;
  effect: { sellAll?: number; orderDays?: number; qualityFloor?: number; clueNarrow?: number };
}

export interface NpcCap { love?: [number, number]; other?: [number, number]; any?: [number, number]; }

export interface NpcDef {
  name: string; role: string; loves: CategoryId[] | null;
  cap: NpcCap; aggression: number;
  bid: string[]; pass: string[];
  tell: string; face: string;
  /** визуал: цвет костюма, тип тела */
  look: { coat: string; accent: string; body: 'suit' | 'dress' | 'apron' | 'shawl' };
  /** реплики эмоций для живой сцены торгов */
  emo: { think?: string; outbid?: string; win?: string; lose?: string };
}

export interface OrderTemplate {
  id: string; who: string; whoDat?: string; face: string;
  want: { cat?: CategoryId; item?: string; rarity?: Rarity };
  mult: 'cat' | 'item' | 'rarity';
  notWith?: string[];
  text: string; days: number;
}

export interface Order {
  id: string; who: string; whoDat: string; face: string;
  want: { cat?: CategoryId; item?: string; rarity?: Rarity };
  mult: 'cat' | 'item' | 'rarity';
  text: string; deadline: number; days: number;
}

export interface HouseDef {
  name: string; lots: number; startFrac: [number, number]; clueFree: number; unlock: number;
  desc: string; photo?: boolean;
  pool: { boost?: CategoryId[]; junkCut?: number };
}

export interface PackDef {
  id: string; name: string; clues: number; desc: string;
  condWide?: boolean; condNarrow?: boolean;
}

export interface PartDef {
  name: string; icon: string; price: number; special?: boolean;
  desc?: string;
}

export interface DefectDef {
  id: DefectId; name: string; op: OpId; weight: number;
  cost?: Partial<Record<PartId, number>>;
  /** cost зависит от категории предмета (broken_mech) */
  costByCat?: Partial<Record<CategoryId, Partial<Record<PartId, number>>>>;
  /** доступна только после указанной операции (calibration → repair) */
  requiresOp?: OpId;
  hint: string;
  short: string;
}

export interface OpDef {
  id: OpId; name: string; verb: string; minigame: 'erase' | 'mosaic' | 'repair' | 'calibrate' | 'instant';
  desc: string;
}

/* ---------- дефекты конкретного экземпляра ---------- */
export interface DefectInst {
  id: DefectId;
  /** для missing_part — id особой детали */
  part?: PartId;
  partName?: string;
  weight: number;
  /** фактическая стоимость (части) в монетах/ресурсах — для UI */
  cost: Partial<Record<PartId, number>>;
  resolved: boolean;
  /** качество выполнения операции 0..1 */
  opq?: number;
}

/* ---------- лот ---------- */
export interface LotInst {
  id: string;
  itemId: string;
  base: number;
  cond: number;
  trueValue: number;
  packId: string;
  photo: boolean;
  start: number;
  seed: number;
  seedN: number;
  clues: Clue[] | null;
  revealedClues: number;
  estimateBand: number | null;
  estimated?: boolean;
  estLogged?: boolean;
  npcs: NpcBidder[];
  price: number;
  high: string | null;
  winner: string | null;
  log: string[];
  /* торговое состояние */
  playerIn?: boolean;
  playerEverBid?: boolean;
  playerMax?: number;
  rounds?: number;
  margin?: number;
  /* пост-аукционное состояние */
  defects?: DefectInst[];
  q?: number;
  sale?: number;
  restoreMs?: number;
  autoRestore?: boolean;
  delta?: number;
  kind?: 'sell' | 'order' | 'keep' | 'dup' | 'fixture' | 'vitrine' | 'disassemble';
  strategy?: 'asis' | 'quick' | 'full' | 'custom';
  _clueLogged?: Record<number, boolean>;
  _resolved?: boolean;
  _inited?: boolean;
  _estResolved?: boolean;
  _estOk?: boolean;
}

export interface Clue { kind: string; text: string; sprite?: boolean; free: boolean; }

export interface NpcBidder {
  id: NpcId; cap: number; active: boolean; lastBid: number; waits?: number;
}

/* ---------- сохранения ---------- */
export interface SaveStats {
  wins: number; losses: number; sold: number; kept: number;
  ordersDone: number; ordersExpired: number; dup: number; best: number; motivated: number;
  disassembled?: number; partsSpent?: number; restoreSpent?: number;
}

export interface Save {
  v: number;
  day: number;
  coins: number;
  owned: Record<string, { q: number; day: number } | 'fixture' | 'vitrine'>;
  fixtures: string[];
  vitrine: string[];
  orders: Order[];
  shopLevel: number;
  lastDivDay: number;
  pity: number;
  stats: SaveStats;
  est: { submitted: number; correct: number };
  autoRestore: { date: string; count: number };
  ftue: { done: boolean };
  parts: Record<PartId, number>;
  tips?: { bid?: boolean };
  setDone?: Record<string, boolean>;
  /** незавершённый лот (refresh-safe, требование п.1.9) */
  pending?: PendingLot | null;
  /** покупатель дня (NPC-оффер) */
  buyerToday?: { npc: NpcId; } | null;
  buyerRolledDay?: number;
}

export interface PendingLot {
  stage: 'workbench' | 'appraisal' | 'decision';
  lot: LotInst;
  day?: DayCtx | null;
}

export interface Toast { id: number; msg: string; }

/* ---------- город ---------- */
export interface BuildingDef {
  id: string;
  name: string;
  sign: string;
  house?: HouseId;
  scene: 'shop' | 'parts' | 'hall';
  unlockLevel: number;
  /** позиция на карте, % */
  x: number; y: number; w: number;
  art: 'shop' | 'warehouse' | 'estate' | 'garage' | 'parts';
  desc: string;
}

/* ---------- фазы (экраны) ---------- */
export type Phase =
  | 'intro' | 'shop' | 'city' | 'parts' | 'hall' | 'bidding'
  | 'unbox' | 'workbench' | 'appraisal' | 'decision' | 'deal' | 'loss'
  | 'dayResult' | 'album';

/* ---------- представление торгов для UI ---------- */
export type NpcEmotion = 'idle' | 'think' | 'bid' | 'lead' | 'pass' | 'angry' | 'happy' | 'sad';

export interface NpcView {
  id: NpcId;
  emotion: NpcEmotion;
  bubble: string | null;
  bubbleUntil: number;
  active: boolean;
  leader: boolean;
  lastBid: number;
  wants: boolean;
}

export interface AuctionView {
  price: number;
  nextPrice: number;
  step: number;
  isLeader: boolean;
  playerIn: boolean;
  playerTurn: boolean;
  canAfford: boolean;
  resolved: boolean;
  winner: string | null;
  npcs: Record<string, NpcView>;
  log: string[];
  gavel: boolean;
}

export interface DayCtx {
  houseId: HouseId;
  lots: LotInst[];
  idx: number;
  dayStartCoins: number;
  wins: number;
  losses: number;
  estDay: { n: number; ok: number };
  ftue: boolean;
}
