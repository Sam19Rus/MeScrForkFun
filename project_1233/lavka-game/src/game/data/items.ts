/* items.ts — каталог предметов.
   База (35 предметов с SVG-артом, историями и уликами) перенесена 1-в-1 из lavka2-vp/js/data.js.
   Расширения вертикального среза: requiredPart (особая деталь), yieldParts (доноры),
   defectBias/defectPool (пулы дефектов) + 3 новых предмета для показательных сценариев A–G:
     radio (B: редкая деталь), radio_broken (G: донор детали), junk_box (донор базовых деталей). */
import rawItems from './raw/items.json';
import type { DefectId, ItemDef } from '../types';

const S = {
  wood: '#c8a97e', woodDark: '#a67c52', metal: '#b9b2a4', metalDark: '#8d887c',
  brass: '#d9b23f', red: '#b5533c', green: '#6e7f6a', cream: '#efe3cc',
  glass: '#cfe0e0', dark: '#3a3f45', blue: '#7d9ab1'
};
const _svg = (body: string) =>
  `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#5a4632" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

/* ---------- новые предметы вертикального среза ---------- */
const NEW_ITEMS: ItemDef[] = [
  /* B — хорошая потенциальная стоимость, нужна одна редкая деталь (ручка настройки) */
  { id: 'radio', name: 'Радиоприёмник «Меридиан»', cat: 'tech', rarity: 'rare', value: [280, 640],
    restore: 'clean', set: 'tech', requiredPart: 'knob',
    clues: { material: 'дерево, бакелит', weight: 'увесистый', seller: '«Гудел на всю коммуналку»', marking: '«Меридиан», 1961 г.' },
    story: 'Утром его включали вместо будильника. Ручки крутили по очереди: папа — новости, мама — романсы. Одну ручку давным-давно потеряли — может, и к лучшему: меньше соблазна.',
    svg: _svg(`<rect x="28" y="58" width="144" height="92" rx="10" fill="${S.wood}"/><path d="M28 78 h144" stroke-width="4"/><circle cx="64" cy="110" r="27" fill="${S.cream}"/><path d="M64 88 v44 M50 96 v28 M78 96 v28" stroke-width="3"/><rect x="100" y="86" width="58" height="26" rx="4" fill="${S.glass}"/><path d="M118 88 v22" stroke-width="3" stroke="${S.red}"/><path d="M104 100 h50" stroke-width="2"/><circle cx="112" cy="130" r="9" fill="${S.brass}"/><circle cx="146" cy="130" r="9" fill="${S.brass}"/><path d="M44 150 l-6 18 M156 150 l6 18" stroke-width="6"/><path d="M40 58 q60 -14 120 0" stroke-width="5"/>`) },
  /* G — донор: даёт особую деталь «ручка настройки» + электронные детали */
  { id: 'radio_broken', name: 'Сломанный приёмник', cat: 'tech', rarity: 'junk', value: [5, 25],
    restore: 'clean', donor: true, yieldParts: { knob: 1, electronic: 1 },
    defectPool: ['dirt', 'dust', 'crack'], defectCount: [1, 1],
    clues: { material: 'дерево, пластик', weight: 'средний', seller: '«Не играет — а жалко выбросить»', marking: 'задняя крышка на ниточке' },
    story: 'Умер в 1983-м, в грозу. Внутри — целое богатство для мастера: целая ручка настройки, лампы, динамик. Хозяин хотел выбросить, но рука не поднялась.',
    svg: _svg(`<rect x="34" y="66" width="132" height="82" rx="8" fill="${S.woodDark}" transform="rotate(-4 100 107)"/><circle cx="66" cy="106" r="22" fill="${S.dark}" opacity=".55"/><path d="M120 78 l14 30 l-18 6 l22 28" stroke-width="4"/><rect x="104" y="82" width="44" height="20" rx="3" fill="${S.metalDark}" opacity=".7"/><circle cx="112" cy="128" r="8" fill="${S.metalDark}"/><path d="M140 124 q16 10 6 26" stroke-width="3"/><path d="M52 148 l-8 14 M150 146 l10 14" stroke-width="5"/><path d="M96 62 v-8 M104 60 v-10" stroke-width="2"/>`) },
  /* донор базовых деталей — «вторая жизнь мусора» */
  { id: 'junk_box', name: 'Коробка со старым железом', cat: 'free', rarity: 'junk', value: [5, 25],
    restore: 'clean', donor: true, yieldParts: { universal: 2, mechanical: 1 },
    defectPool: ['dirt'], defectCount: [1, 1],
    clues: { material: 'картон, металл', weight: 'гремящая', seller: '«Тридцать лет переезжала с места на место»', marking: 'надпись «НЕ ВЫБРАСАТЬ!!»' },
    story: 'Гайки, шестерни, ключи неизвестно от чего, пара будильников без стрелок. Тридцать лет коробку переносили с места на место — и ведь пригождалось.',
    svg: _svg(`<path d="M40 84 h120 l-10 76 h-100 z" fill="${S.wood}"/><path d="M40 84 l14 -18 h92 l14 18" fill="${S.cream}"/><path d="M40 84 h120" stroke-width="5"/><circle cx="76" cy="112" r="15" fill="${S.metal}"/><circle cx="76" cy="112" r="6" fill="${S.metalDark}"/><path d="M76 97 v-5 M76 132 v5 M61 112 h-5 M96 112 h5" stroke-width="3"/><rect x="104" y="98" width="30" height="12" rx="4" fill="${S.metalDark}" transform="rotate(12 119 104)"/><path d="M108 124 l24 14" stroke-width="6" stroke="${S.brass}"/><circle cx="126" cy="134" r="9" fill="${S.brass}"/><path d="M52 100 l8 12" stroke-width="3"/>`) }
];

/* ---------- расширения существующих предметов (без изменения ценности/экономики) ---------- */
const EXT: Record<string, Partial<ItemDef>> = {
  /* C — сильно повреждённый эпик: выгодно только полное восстановление (пассик + электроника) */
  reel:   { requiredPart: 'belt', defectBias: 'heavy' },
  camera: { requiredPart: 'lens' },
  cuckoo: { requiredPart: 'pendulum' },
  binoculars: { requiredPart: 'lens' },
  /* тяжёлые дефектные пулы для атмосферности */
  sewing: { defectPool: ['rust', 'broken_mech', 'calibration', 'worn', 'dust'] },
  typewriter: { defectPool: ['dirt', 'scratches', 'broken_mech', 'consumable', 'worn'] },
  watch: { defectPool: ['rust', 'scratches', 'calibration', 'worn'] },
  radiola: { defectPool: ['dust', 'scratches', 'broken_mech', 'calibration', 'worn'] }
};

/* ---------- сборка каталога ---------- */
export const ITEMS: ItemDef[] = [
  ...(rawItems as unknown as ItemDef[]).map(it => (EXT[it.id] ? { ...it, ...EXT[it.id] } : it)),
  ...NEW_ITEMS
];

export const ITEMS_BY_ID: Record<string, ItemDef> = {};
export const ITEMS_BY_CAT: Record<string, ItemDef[]> = { tech: [], clocks: [], home: [], free: [] };
export const ITEMS_BY_RARITY: Record<string, ItemDef[]> = { junk: [], common: [], rare: [], epic: [], legend: [] };
ITEMS.forEach(it => {
  ITEMS_BY_ID[it.id] = it;
  ITEMS_BY_CAT[it.cat].push(it);
  ITEMS_BY_RARITY[it.rarity].push(it);
});

/* ---------- доноры (предметы, которые разбирают на запчасти) ---------- */
export const DONOR_ITEMS = ITEMS.filter(it => it.donor && it.yieldParts);

export type { DefectId };
