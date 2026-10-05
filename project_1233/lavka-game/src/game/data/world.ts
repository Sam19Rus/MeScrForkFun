/* world.ts — категории, наборы, фикстуры, аукционные дома, NPC, лица, ящик.
   Данные перенесены 1-в-1 из lavka2-vp/js/data.js (баланс не менялся),
   NPC расширены визуальными параметрами (look) и репликами эмоций (emo). */
import rawCats from './raw/cats.json';
import rawSets from './raw/sets.json';
import rawFixtures from './raw/fixtures.json';
import rawHouses from './raw/houses.json';
import rawNpcs from './raw/npcs.json';
import rawFaces from './raw/faces.json';
import rawCrate from './raw/crate_svg.json';
import type { CategoryDef, CategoryId, FixtureDef, HouseDef, HouseId, NpcDef, NpcId, SetDef } from '../types';

export const CATS = rawCats as Record<CategoryId, CategoryDef>;
export const SETS = rawSets as Record<'tech' | 'clocks' | 'home', SetDef>;
export const FIXTURES = rawFixtures as FixtureDef[];
export const HOUSES = rawHouses as Record<HouseId, HouseDef>;
export const FACES = rawFaces as Record<string, string>;
export const CRATE_SVG = rawCrate as string;

/* ---------- NPC: базовые архетипы (портер) + визуал/эмоции ---------- */
const NPC_BASE = rawNpcs as Record<NpcId, Omit<NpcDef, 'look' | 'emo'>>;

const NPC_LOOK: Record<NpcId, Pick<NpcDef, 'look' | 'emo'>> = {
  arkady: {
    look: { coat: '#4a5d4f', accent: '#d9b23f', body: 'suit' },
    emo: { think: 'Хм… а вещь-то с историей', outbid: 'Что?! Перебиваете МЕНЯ?', win: 'Прекрасно! В коллекцию!', lose: 'Вы пожалеете… или нет. Я пожалею.' }
  },
  zinaida: {
    look: { coat: '#8a4a3c', accent: '#efe3cc', body: 'dress' },
    emo: { think: 'Так, считаем маржу…', outbid: 'Ну и забирайте, мне не в убыток', win: 'Выгодно взяла!', lose: 'Дорого. Пас.' }
  },
  petr: {
    look: { coat: '#3f4a5a', accent: '#b9b2a4', body: 'apron' },
    emo: { think: 'Механизм… дай посмотреть', outbid: 'Не трогайте, я сам', win: 'Тик-так. Моё.', lose: 'Часы ушли… эх' }
  },
  nina: {
    look: { coat: '#7a6a8f', accent: '#c9b7d9', body: 'shawl' },
    emo: { think: 'Дай-ка приценюсь…', outbid: 'Ой, а я ещё накину!', win: 'Внучек-то как обрадуется!', lose: 'Дорого́… ну и ладно' }
  }
};

export const NPCS: Record<NpcId, NpcDef> = Object.fromEntries(
  (Object.keys(NPC_BASE) as NpcId[]).map(id => [id, { ...NPC_BASE[id], ...NPC_LOOK[id] }])
) as Record<NpcId, NpcDef>;

export const NPC_IDS = Object.keys(NPCS) as NpcId[];

/* ---------- упаковка лотов ---------- */
export const PACK_SVG: Record<string, string> = {
  box: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="46" y="72" width="108" height="86" rx="6" fill="#c8a06a" stroke="#5a4632" stroke-width="6"/><path d="M46 96 h108" stroke="#5a4632" stroke-width="5"/><path d="M92 72 v110" stroke="#a67c52" stroke-width="8"/><rect x="84" y="112" width="32" height="20" rx="3" fill="#efe3cc" stroke="#5a4632" stroke-width="4"/></svg>`,
  chest: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="36" y="86" width="128" height="72" rx="10" fill="#8a5a3c" stroke="#5a4632" stroke-width="6"/><path d="M36 108 q64 -30 128 0" fill="#a67c52" stroke="#5a4632" stroke-width="6"/><rect x="86" y="112" width="28" height="24" rx="4" fill="#d9b23f" stroke="#5a4632" stroke-width="4"/><circle cx="100" cy="124" r="4" fill="#5a4632"/><path d="M52 86 v72 M148 86 v72" stroke="#5a4632" stroke-width="4"/></svg>`,
  sack: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M78 58 q-10 12 4 20 q-30 22 -28 60 q2 30 46 30 q44 0 46 -30 q2 -38 -28 -60 q14 -8 4 -20 q-22 8 -44 0 z" fill="#9a8d6a" stroke="#5a4632" stroke-width="6"/><path d="M76 80 q24 10 48 0" stroke="#5a4632" stroke-width="5"/><path d="M86 110 q14 10 28 0 M82 132 q18 12 36 0" stroke="#7a6f52" stroke-width="4"/></svg>`,
  crate: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="38" y="62" width="124" height="94" rx="6" fill="#a67c52" stroke="#5a4632" stroke-width="6"/><path d="M38 62 L162 156 M162 62 L38 156" stroke="#c8a97e" stroke-width="9"/><rect x="30" y="54" width="140" height="14" rx="5" fill="#c8a97e" stroke="#5a4632" stroke-width="4"/><rect x="30" y="148" width="140" height="14" rx="5" fill="#c8a97e" stroke="#5a4632" stroke-width="4"/></svg>`,
  coffre: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect x="40" y="78" width="120" height="80" rx="8" fill="#3a3f45" stroke="#5a4632" stroke-width="6"/><path d="M40 100 q60 -26 120 0" fill="#4a5058" stroke="#5a4632" stroke-width="5"/><rect x="84" y="104" width="32" height="26" rx="4" fill="#d9b23f" stroke="#5a4632" stroke-width="4"/><path d="M56 78 v80 M144 78 v80" stroke="#d9b23f" stroke-width="4"/><circle cx="100" cy="117" r="4" fill="#3a3f45"/></svg>`
};
