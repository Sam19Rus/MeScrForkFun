/* parts.ts — каталог запчастей, дефектов и операций реставрации.
   Всё data-driven: веса дефектов, стоимости, привязки операций — здесь, не в коде сцен. */
import type { DefectDef, DefectId, OpDef, OpId, PartDef, PartId } from '../types';

/* ---------- запчасти (малая система: 4 базовых + особые под предметы) ---------- */
export const PARTS: Record<PartId, PartDef> = {
  universal:  { name: 'Универсальные детали', icon: '🔩', price: 20,  desc: 'крепёж, пружинки, мелочовка — подходит почти ко всему' },
  electronic: { name: 'Электронные детали',   icon: '🔌', price: 45,  desc: 'лампы, конденсаторы, провода — для техники' },
  mechanical: { name: 'Механические детали',  icon: '⚙️', price: 45,  desc: 'шестерни, оси, пружины — для часов и приборов' },
  polish:     { name: 'Полироль и материал',  icon: '🧴', price: 15,  desc: 'паста, ветошь, лак — убирает царапины и патину' },
  knob:       { name: 'Ручка настройки',      icon: '🎛️', price: 130, special: true, desc: 'бакелитовая ручка старого типа — к приёмникам' },
  belt:       { name: 'Приводной пассик',     icon: '➰', price: 140, special: true, desc: 'резиновый пассик для катушечников и плееров' },
  pendulum:   { name: 'Маятник',              icon: '🕰️', price: 150, special: true, desc: 'латунная линза маятника — к ходикам' },
  lens:       { name: 'Объектив',             icon: '🔍', price: 160, special: true, desc: 'стекло в оправе — к фотоаппаратам и биноклям' }
};

export const SPECIAL_PARTS: PartId[] = (Object.keys(PARTS) as PartId[]).filter(p => PARTS[p].special);
export const BASIC_PARTS: PartId[] = (Object.keys(PARTS) as PartId[]).filter(p => !PARTS[p].special);

/* ---------- операции реставрации ---------- */
export const OPS: Record<OpId, OpDef> = {
  clean:     { id: 'clean',     name: 'Очистка',        verb: 'Отмыть',        minigame: 'erase',     desc: 'сотрите грязь и пыль тряпкой' },
  polish:    { id: 'polish',    name: 'Полировка',      verb: 'Отполировать',  minigame: 'erase',     desc: 'снимите патину и царапины, верните блеск' },
  assemble:  { id: 'assemble',  name: 'Сборка',         verb: 'Собрать',       minigame: 'mosaic',    desc: 'соберите предмет из черепков и осколков' },
  repair:    { id: 'repair',    name: 'Ремонт',         verb: 'Починить',      minigame: 'repair',    desc: 'замените сломанный узел рабочей деталью' },
  replace:   { id: 'replace',   name: 'Замена детали',  verb: 'Установить',    minigame: 'repair',    desc: 'поставьте недостающую особую деталь' },
  calibrate: { id: 'calibrate', name: 'Настройка',      verb: 'Настроить',     minigame: 'calibrate', desc: 'поймайте стрелку в зелёной зоне' }
};

/* ---------- каталог дефектов ----------
   weight — вклад в итоговое качество (progress = Σ решённых весов / Σ всех).
   cost — запчасти на операцию (списываются из инвентаря).
   broken_mech: стоимость зависит от категории предмета (техника→электронные, приборы→механические). */
export const DEFECTS: Record<DefectId, DefectDef> = {
  dirt:         { id: 'dirt', name: 'Грязь',               op: 'clean',     weight: 1.0, hint: 'Засохшая грязь скрывает, что там вообще под ней.', short: 'грязный корпус' },
  dust:         { id: 'dust', name: 'Слой пыли',           op: 'clean',     weight: 0.7, hint: 'Пыль десятилетий — в щелях и на механизме.', short: 'в пыли' },
  rust:         { id: 'rust', name: 'Ржавчина',            op: 'polish',    weight: 1.0, cost: { polish: 1 }, hint: 'Рыжие пятна на металле. Снимите их пастой — и вещь заиграет.', short: 'ржавые пятна' },
  scratches:    { id: 'scratches', name: 'Царапины',       op: 'polish',    weight: 1.0, cost: { polish: 1 }, hint: 'Паутинка царапин портит вид. Полироль это лечит.', short: 'поцарапан' },
  worn:         { id: 'worn', name: 'Потёртая поверхность', op: 'polish',   weight: 0.8, cost: { polish: 1 }, hint: 'Краска стёрта до основы — отполируйте и подновите.', short: 'потёртости' },
  crack:        { id: 'crack', name: 'Трещина / скол',     op: 'assemble',  weight: 1.2, cost: { universal: 1 }, hint: 'Треснувший фрагмент придётся собирать по частям.', short: 'треснул' },
  broken_mech:  { id: 'broken_mech', name: 'Сломан механизм', op: 'repair', weight: 1.4,
                  costByCat: { tech: { electronic: 1 }, clocks: { mechanical: 1 }, home: { mechanical: 1 }, free: { universal: 1 } },
                  hint: 'Внутри что-то не крутится и не звенит. Нужна замена узла.', short: 'механизм мёртв' },
  missing_part: { id: 'missing_part', name: 'Нет детали',  op: 'replace',   weight: 1.5,
                  hint: 'Не хватает ключевой детали — без неё предмет не полон.', short: 'нет детали' },
  consumable:   { id: 'consumable', name: 'Нужен расходник', op: 'repair',  weight: 0.9, cost: { universal: 1 },
                  hint: 'Прокладки, батарейки, нитки — мелочь, а без неё не работает.', short: 'изношен расходник' },
  calibration:  { id: 'calibration', name: 'Расстроен механизм', op: 'calibrate', weight: 1.0, requiresOp: 'repair',
                  hint: 'Механизм целый, но сбит. Ловите стрелку в зелёной зоне.', short: 'сбита настройка' }
};

/* ---------- пулы дефектов по категориям (дефолт, если у предмета нет своего) ---------- */
export const DEFECT_POOL_BY_CAT: Record<string, DefectId[]> = {
  tech:   ['dirt', 'dust', 'scratches', 'broken_mech', 'consumable', 'calibration'],
  clocks: ['rust', 'dust', 'scratches', 'broken_mech', 'calibration', 'worn'],
  home:   ['dirt', 'rust', 'crack', 'worn', 'scratches'],
  free:   ['dirt', 'dust', 'crack', 'worn']
};

/* ---------- городские здания ---------- */
import type { BuildingDef } from '../types';

export const CITY_BUILDINGS: BuildingDef[] = [
  { id: 'shop', name: 'Ваша лавка', sign: 'ЛАВКА', scene: 'shop', unlockLevel: 1,
    x: 7, y: 66, w: 22, art: 'shop', desc: 'Дом: витрина, заказы, верстак и полки с находками' },
  { id: 'city_warehouse', name: 'Городской склад', sign: 'СКЛАД', house: 'city', scene: 'hall', unlockLevel: 1,
    x: 37, y: 36, w: 24, art: 'warehouse', desc: 'Дёшево и сердито: хлам вперемешку с находками' },
  { id: 'estate', name: 'Усадебный аукцион', sign: 'УСАДЬБА', house: 'estate', scene: 'hall', unlockLevel: 2,
    x: 71, y: 46, w: 22, art: 'estate', desc: 'Из старых домов: реже хлам, чаще редкое' },
  { id: 'garage', name: 'Гараж мастеров', sign: 'ГАРАЖ', house: 'special', scene: 'hall', unlockLevel: 3,
    x: 41, y: 68, w: 20, art: 'garage', desc: 'Техника и приборы; состояние плавает сильно' },
  { id: 'parts', name: 'Запчасти «У Шпуля»', sign: 'ЗАПЧАСТИ', scene: 'parts', unlockLevel: 1,
    x: 6, y: 30, w: 20, art: 'parts', desc: 'Детали, расходники и полироль для реставрации' }
];
