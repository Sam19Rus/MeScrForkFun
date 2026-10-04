/* ============================================================
   data.js — «Лавка 2.0: Аукцион» (вертикальный прототип)
   Всё содержание игры — данные. Никаких чисел баланса в коде сцен.
   ============================================================ */

const _svg = (body) =>
  `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#5a4632" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const S = {
  wood: '#c8a97e', woodDark: '#a67c52', metal: '#b9b2a4', metalDark: '#8d887c',
  brass: '#d9b23f', red: '#b5533c', green: '#6e7f6a', cream: '#efe3cc', glass: '#cfe0e0', dark: '#3a3f45'
};

window.CONFIG = {
  meta: { name: 'Лавка 2.0: Аукцион', version: '0.2.0-vp', saveKey: 'lavka2_save_v0' },
  start_coins: 600,
  bailout: { threshold: 120, amount: 150 },
  lot: { conditionRange: [0.7, 1.3], startFracDefault: [0.22, 0.34], incrementFrac: 0.13, minIncrement: 10 },
  clue: { baseU: 2.6, narrowPerClue: 0.30, estimateReward: 25 },
  estimateBands: [[0, 200], [200, 600], [600, 1500], [1500, 999999]],
  restore: { minProgress: 0.60, qFrom: 0.55, qTo: 0.97, autoQuality: 1.0 },
  economy: { keep_refund: 0.35, dup_fraction: 0.40,
    orderMult: { cat: 2.2, item: 3.0, rarity: 2.5 }, estimateReward: 25 },
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
    { id:'box',     name:'Картонная коробка',      clues: 0, desc:'обычная тара' },
    { id:'chest',   name:'Чемодан',                clues: 1, desc:'через щели видно больше' },
    { id:'sack',    name:'Мешок',                  clues:-1, desc:'тёмный тюк — улик меньше' },
    { id:'crate',   name:'Обрешечённый ящик',      clues: 0, condWide: true,  desc:'состояние плавает сильнее' },
    { id:'coffre',  name:'Дорожный кофр',          clues: 1, condNarrow: true, desc:'хранили бережно' }
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
    lots: [ { item: 'phone', cond: 0.9,  npcs: ['zinaida'], capMultOverride: 0.6 },
            { item: 'cplayer', cond: 0.85, npcs: ['nina'], capMultOverride: 0.5 },
            { item: 'pins', cond: 1.0, npcs: ['zinaida','nina'] },
            { item: 'jug', cond: 0.8, npcs: ['nina'] } ]
  }
};

/* ---------- категории ---------- */
window.CATS = {
  tech:   { name: 'Ретротехника',    icon: '📻' },
  clocks: { name: 'Часы и приборы',  icon: '⏰' },
  home:   { name: 'Дом и уют',       icon: '🏺' },
  free:   { name: 'Разности',        icon: '🎲' }
};

/* ---------- наборы (3 категории коллекционных целей) ---------- */
window.SETS = {
  tech:   { name: 'Советская электроника', need: 5, cat: 'tech',
            bonus: 'Заказы на технику платят ×1.5', effect: { orderBoostCat: 'tech', mult: 1.5 } },
  clocks: { name: 'Мастер и приборы', need: 5, cat: 'clocks',
            bonus: 'Диапазон оценки по уликам уже на 25%', effect: { clueU: 0.75 } },
  home:   { name: 'Уютный дом', need: 5, cat: 'home',
            bonus: 'Продажа предметов «Дом и уют» +15%', effect: { sellBoostCat: 'home', mult: 1.15 } }
};

/* ---------- витринные экспонаты (функциональные предметы) ---------- */
window.FIXTURES = [
  { item: 'radiola', name: 'Радиола в зале',    desc: '+5% ко всем продажам',            effect: { sellAll: 1.05 } },
  { item: 'cuckoo',  name: 'Ходики на стене',   desc: 'Заказы живут на 1 день дольше',    effect: { orderDays: 1 } },
  { item: 'sewing',  name: 'Швейная машина',    desc: 'Мин. качество реставрации +15%',   effect: { qualityFloor: 0.15 } },
  { item: 'watch',   name: 'Часы в витрине',    desc: 'Улики сужают оценку сильнее',      effect: { clueNarrow: 1.35 } }
];

/* ---------- NPC-соперники (архетипы; конечные автоматы) ---------- */
window.NPCS = {
  arkady:  { name: 'Аркадий', role: 'Коллекционер', loves: ['tech', 'clocks'],
             cap: { love: [1.5, 1.8], other: [0.5, 0.7] }, aggression: 0.9,
             bid: ['Моё! Забираю!', 'Я давно за ним охочусь', 'Не уступлю'], pass: ['Не мой профиль', 'Пусть идёт…'],
             tell: 'на любимых категориях загорается ♥', face: 'n1' },
  zinaida: { name: 'Зинаида', role: 'Перекупщица', loves: null,
             cap: { any: [0.68, 0.85] }, aggression: 0.55,
             bid: ['Возьму подешевле', 'Мне ещё margin нужен', 'Не много ли хочешь?'], pass: ['Невыгодно мне это'],
             tell: 'щелкает калькулятором, если лот ниже рынка', face: 'n2' },
  petr:    { name: 'Пётр', role: 'Часовщик-специалист', loves: ['clocks'],
             cap: { love: [1.15, 1.35], other: [0, 0] }, aggression: 0.7,
             bid: ['Тик-так. Моё.', 'Механизм меня ждёт'], pass: ['Я только по часам'],
             tell: 'торгуется ТОЛЬКО за часы и приборы', face: 'n3' },
  nina:    { name: 'Бабуля Нина', role: 'Сюрприз', loves: null,
             cap: { any: [0.4, 1.4] }, aggression: 0.5,
             bid: ['Внучку порадую!', 'В хозяйстве сгодится', 'А дай-ка я ещё накину'], pass: ['Ой, дорого́'],
             tell: 'непредсказуема: иногда переплачивает за хлам', face: 'n4' }
};

/* ---------- заказы (шаблоны) ---------- */
window.ORDER_TEMPLATES = [
  { id: 'o1', who: 'Иваныч', whoDat: 'Иванычу', face: 'c1', want: { cat: 'tech' }, mult: 'cat', notWith: ['ftue'],
    text: 'Нужна любая ретротехника. Жене на юбилей — «чтоб гудело и блестело».', days: 3 },
  { id: 'o2', who: 'Светлана', whoDat: 'Светлане', face: 'c2', want: { item: 'photoalbum' }, mult: 'item',
    text: 'Ищу фотоальбом для семейного архива. Любой! Заплачу щедро.', days: 3 },
  { id: 'o3', who: 'Мастер Пётр', whoDat: 'мастеру Петру', face: 'c3', want: { cat: 'clocks' }, mult: 'cat',
    text: 'Для мастерской: часы, приборы, механизмы — что угодно в рабочем виде.', days: 4 },
  { id: 'o4', who: 'Коллекционерша', whoDat: 'Коллекционерше', face: 'c4', want: { rarity: 'rare' }, mult: 'rarity',
    text: 'Куплю любую редкость. Состояние не важно — приведу в порядок сама.', days: 3 },
  { id: 'o5', who: 'Геннадий', whoDat: 'Геннадию', face: 'c5', want: { cat: 'home' }, mult: 'cat',
    text: 'Беру посуду и утварь для столовой. Дорого, но только своё.', days: 2 },
  { id: 'o6', who: 'Музейщик', whoDat: 'Музейщику', face: 'c1', want: { rarity: 'epic' }, mult: 'rarity',
    text: 'Экспозиция «Быт XX века». Нужен выдающийся предмет. Бюджет есть.', days: 4 },
  { id: 'o7', who: 'Гоша', whoDat: 'Гоше', face: 'c2', want: { item: 'guitar' }, mult: 'item',
    text: 'Всю жизнь мечтаю о советской гитаре. Отдам всё, что просите.', days: 3 },
  { id: 'o8', who: 'Гроссмейстер', whoDat: 'Гроссмейстеру', face: 'c3', want: { item: 'chess' }, mult: 'item',
    text: 'Ищу шахматы с историей. Фигуры должны быть тяжелыми.', days: 4 },
  { id: 'o9', who: 'Дачница', whoDat: 'Дачнице', face: 'c4', want: { cat: 'home' }, mult: 'cat',
    text: 'Украшаю веранду. Самовары, лампы, железо — всё беру.', days: 3 },
  { id: 'o10', who: 'Радиоведущий', whoDat: 'Радиоведущему', face: 'c5', want: { cat: 'tech' }, mult: 'cat',
    text: 'Реквизит для студии: старая техника в кадре должна смотреться.', days: 3 },
  { id: 'o11', who: 'Фотограф Кирилл', whoDat: 'Фотографу Кириллу', face: 'c2', want: { item: 'camera' }, mult: 'item',
    text: 'Снимаю ретро-серию. Нужен плёночный фотоаппарат — в кадре он будет главным героем.', days: 3 },
  { id: 'o12', who: 'Музыкальная школа', whoDat: 'Музыкальной школе', face: 'c4', want: { item: 'player' }, mult: 'item',
    text: 'Ищем проигрыватель пластинок для холла. Чтобы родители плакали от умиления.', days: 4 },
  { id: 'o13', who: 'Геолог дядя Боря', whoDat: 'Геологу дяде Боре', face: 'c1', want: { item: 'compass' }, mult: 'item',
    text: 'Внук поступает на геологию. Хочу подарить настоящий компас, а не приложение в телефоне.', days: 3 },
  { id: 'o14', who: 'Семёныч', whoDat: 'Семёнычу', face: 'c5', want: { item: 'fishing' }, mult: 'item',
    text: 'Скучаю по бамбуковой удочке. Найдёшь такую — заплачу сверху, слово рыбака.', days: 3 },
  { id: 'o15', who: 'Воспитательница', whoDat: 'Воспитательнице', face: 'c3', want: { cat: 'free' }, mult: 'cat',
    text: 'Собираем уголок старинных вещиц для детского сада. Лишь бы без острых углов.', days: 3 },
  { id: 'o16', who: 'Театральный реквизитор', whoDat: 'Театральному реквизитору', face: 'c4', want: { item: 'binoculars' }, mult: 'item',
    text: 'В спектакле нужен театральный бинокль. Один акт, зато крупный план.', days: 4 },
  { id: 'o17', who: 'Писатель', whoDat: 'Писателю', face: 'c2', want: { item: 'typewriter' }, mult: 'item',
    text: 'Пишу роман про шестидесятые. На столе должна стоять настоящая печатная машинка — для духа эпохи.', days: 4 },
  { id: 'o18', who: 'Соседка тётя Таня', whoDat: 'Соседке тёте Тане', face: 'c5', want: { cat: 'home' }, mult: 'cat',
    text: 'Обживаю дачу. Нужна посуда и всякая уютная всячина — что приглядится.', days: 2 }
];

/* ---------- аукционные дома ---------- */
window.HOUSES = {
  city:    { name: 'Городской склад', lots: 6, startFrac: [0.20, 0.32], clueFree: 2, unlock: 1,
             desc: 'Дёшево и сердито: хлам вперемешку с находками', pool: {} },
  estate:  { name: 'Усадебный аукцион', lots: 5, startFrac: [0.30, 0.42], clueFree: 3, unlock: 2, photo: true,
             desc: 'Из старых домов: реже хлам, чаще редкое, старт дороже; показывают частичное фото', pool: { boost: ['home', 'clocks'], junkCut: 0.5 } },
  special: { name: 'Гараж мастеров', lots: 4, startFrac: [0.28, 0.40], clueFree: 3, unlock: 3, photo: true,
             desc: 'Сегодня техника и приборы; состояние плавает сильно; есть частичное фото', pool: { boost: ['tech', 'clocks'], junkCut: 0.8 } }
};

/* ---------- каталог: 35 предметов ---------- */
window.ITEMS = [
  /* ===== Ретротехника (tech) ===== */
  { id:'phone', name:'Дисковый телефон', cat:'tech', rarity:'common', value:[50,130], restore:'clean',
    clues:{ material:'бакелит', weight:'тяжёлый', marking:'стертое клеймо завода', seller:'«Гудел до последних хозяев»' },
    story:'Аппарат, у которого каждую цифру надо было заслужить: диск возвращался с благородным «вжжж». Номер «07» набирался дольше всех — и все об этом знали.',
    svg:_svg(`<rect x="42" y="108" width="116" height="52" rx="12" fill="${S.red}"/><circle cx="100" cy="134" r="20" fill="${S.cream}"/><circle cx="100" cy="134" r="6" fill="#5a4632" stroke="none"/><path d="M50 104 q10 -26 50 -26 q40 0 50 26" stroke-width="14" stroke="${S.red}"/><path d="M58 96 h18 M124 96 h18" stroke-width="6"/>`) },
  { id:'camera', name:'Плёночный фотоаппарат', cat:'tech', rarity:'rare', value:[260,600], restore:'clean', set:'tech',
    clues:{ material:'металл и стекло', weight:'средний', marking:'гравировка «ЗОМЗ»', seller:'«Лежал в кожаном чехле»' },
    story:'Тридцать шесть кадров — и ни одного дубля. Именно поэтому каждый снимок, сделанный этим аппаратом, кто-то хранил потом всю жизнь в альбоме с уголками.',
    svg:_svg(`<rect x="34" y="72" width="132" height="84" rx="12" fill="${S.metalDark}"/><rect x="72" y="58" width="42" height="16" rx="5" fill="${S.metal}"/><circle cx="100" cy="114" r="30" fill="#3a3f45"/><circle cx="100" cy="114" r="18" fill="${S.glass}" opacity=".8"/><circle cx="90" cy="104" r="5" fill="#fff" opacity=".7" stroke="none"/><rect x="140" y="84" width="16" height="12" rx="3" fill="${S.brass}"/>`) },
  { id:'reel', name:'Катушечный магнитофон', cat:'tech', rarity:'epic', value:[900,1800], restore:'clean', set:'tech', fixture:null,
    clues:{ material:'дерево и металл', weight:'очень тяжёлый', marking:'шильдик «Маяк»', seller:'«Работал! Точно работал»' },
    story:'Запись песни с радио была священным ритуалом: все замирали, телефон — под подушку, дышать через раз. Щёлк — и у семьи появлялся собственный концерт.',
    svg:_svg(`<rect x="30" y="58" width="140" height="86" rx="10" fill="${S.wood}"/><circle cx="72" cy="98" r="24" fill="${S.cream}"/><circle cx="128" cy="98" r="24" fill="${S.cream}"/><circle cx="72" cy="98" r="7" fill="#5a4632" stroke="none"/><circle cx="128" cy="98" r="7" fill="#5a4632" stroke="none"/><path d="M72 74 h56" stroke-width="4"/><rect x="46" y="150" width="108" height="14" rx="6" fill="${S.metalDark}"/><circle cx="60" cy="157" r="3" fill="${S.red}" stroke="none"/><circle cx="140" cy="157" r="3" fill="${S.green}" stroke="none"/>`) },
  { id:'radiola', name:'Ламповая радиола', cat:'tech', rarity:'legend', value:[4000,9000], restore:'polish', set:'tech', fixture:'radiola',
    clues:{ material:'полированное дерево', weight:'неподъёмный', marking:'паспорт на задней крышке', seller:'«Из профессорской квартиры»' },
    story:'Гордость квартиры: проигрыватель и приёмник в одном корпусе. Утром — новости, вечером — джаз, а в Новый год не решались включать ничего, кроме неё.',
    svg:_svg(`<rect x="28" y="52" width="144" height="98" rx="10" fill="${S.woodDark}"/><rect x="40" y="64" width="60" height="56" rx="6" fill="${S.wood}"/><path d="M46 72 v40 M58 72 v40 M70 72 v40 M82 72 v40 M94 72 v40" stroke-width="3"/><circle cx="134" cy="92" r="22" fill="${S.cream}"/><circle cx="134" cy="92" r="6" fill="#5a4632" stroke="none"/><rect x="112" y="126" width="46" height="12" rx="5" fill="${S.brass}"/><path d="M42 150 l-6 22 M158 150 l6 22" stroke-width="7"/>`) },
  { id:'player', name:'Проигрыватель пластинок', cat:'tech', rarity:'common', value:[70,160], restore:'clean', set:'tech',
    clues:{ material:'дерево, пластик', weight:'средний', seller:'«Игла в комплекте»', marking:'нет' },
    story:'Ставишь пластинку, опускаешь тонарм — и комната становится другой. Иглу берегли как зеницу: одна царапина на весь вечер воспоминаний.',
    svg:_svg(`<rect x="36" y="70" width="128" height="84" rx="8" fill="${S.wood}"/><circle cx="88" cy="112" r="30" fill="${S.dark}"/><circle cx="88" cy="112" r="4" fill="${S.brass}"/><path d="M88 112 m-22 0 a22 22 0 0 1 22 -22" stroke-width="2"/><path d="M140 84 l-30 20" stroke-width="6"/><circle cx="142" cy="82" r="6" fill="${S.metal}"/>`) },
  { id:'typewriter', name:'Печатная машинка', cat:'tech', rarity:'rare', value:[300,650], restore:'assemble', set:'tech',
    clues:{ material:'чугун', weight:'очень тяжёлая', marking:'«Ять» на клавише', seller:'«Печатала диссертации всему подъезду»' },
    story:'Каждый удар клавиши — маленький выстрел по бумаге. Ошибка стоила листа: корректором служила спичка с лезвием и железные нервы.',
    svg:_svg(`<rect x="34" y="96" width="132" height="56" rx="10" fill="${S.dark}"/><rect x="52" y="66" width="96" height="34" rx="6" fill="${S.metal}"/><path d="M58 74 h84" stroke-width="3"/><g fill="${S.cream}">`+
      [0,1,2,3,4,5].map(i=>`<circle cx="${58+i*17}" cy="118" r="6"/>`).join('')+
      `<circle cx="66" cy="136" r="6"/><circle cx="83" cy="136" r="6"/><circle cx="100" cy="136" r="6"/><circle cx="117" cy="136" r="6"/><circle cx="134" cy="136" r="6"/></g><rect x="60" y="52" width="80" height="10" rx="4" fill="${S.brass}"/>`) },
  { id:'cplayer', name:'Кассетный плеер', cat:'tech', rarity:'common', value:[50,130], restore:'clean',
    clues:{ material:'пластик', weight:'лёгкий', marking:'надпись маркером «МОЙ»', seller:'«С наушниками»' },
    story:'Батареек хватало на два часа, а радости — на всю дорогу до школы. Функцию «перемотай карандашом» производитель заложил сам, просто скромно не написал об этом.',
    svg:_svg(`<rect x="58" y="34" width="84" height="132" rx="10" fill="${S.metalDark}"/><rect x="70" y="48" width="60" height="44" rx="6" fill="${S.cream}"/><circle cx="86" cy="70" r="9"/><circle cx="114" cy="70" r="9"/><rect x="70" y="102" width="60" height="10" rx="4" fill="#3a3f45"/><circle cx="100" cy="136" r="12" fill="${S.green}"/><path d="M142 50 h16 v30 h-16" stroke-width="5"/>`) },
  { id:'console', name:'Игровая приставка', cat:'tech', rarity:'rare', value:[260,600], restore:'clean',
    clues:{ material:'пластик, провода', weight:'средний', seller:'«Джойстик в наборе»', marking:'желтая от времени' },
    story:'Подключалась к телевизору через тот самый разъём, который «надо покрутить». Во дворах страны из-за неё часами звучало одно и то же: «Дай поиграть! Я только один раз!»',
    svg:_svg(`<rect x="30" y="86" width="140" height="58" rx="10" fill="#4a4f55"/><rect x="44" y="70" width="60" height="20" rx="4" fill="${S.metalDark}"/><path d="M66 116 h-10 v-10 h-8 v10 h-10 v8 h10 v10 h8 v-10 h10 z" fill="${S.cream}" transform="translate(14,0)"/><circle cx="132" cy="108" r="8" fill="${S.red}"/><circle cx="152" cy="118" r="8" fill="${S.green}"/><path d="M46 144 q-14 20 -30 16" stroke-width="5"/>`) },

  /* ===== Часы и приборы (clocks) ===== */
  { id:'watch', name:'Золотые карманные часы', cat:'clocks', rarity:'legend', value:[4000,9000], restore:'polish', set:'clocks', fixture:'watch',
    clues:{ material:'тяжёлый металл, жёлтый', weight:'увесистые', marking:'дарственная гравировка внутри', seller:'«Ходят. До сих пор»' },
    story:'Их передавали «когда подрастёт старший». На внутренней крышке выцарапано перочинным ножом: «Не опаздывай, но и не торопись» — завещание лучше не придумать.',
    svg:_svg(`<circle cx="100" cy="112" r="52" fill="${S.brass}"/><circle cx="100" cy="112" r="40" fill="${S.cream}"/><path d="M100 88 v24 l16 10" stroke-width="5"/><rect x="92" y="48" width="16" height="12" rx="4" fill="${S.brass}"/><circle cx="100" cy="40" r="9"/><path d="M108 34 q30 -14 44 6" stroke-width="4"/>`) },
  { id:'cuckoo', name:'Ходики с кукушкой', cat:'clocks', rarity:'epic', value:[900,1800], restore:'assemble', set:'clocks', fixture:'cuckoo',
    clues:{ material:'дерево', weight:'громоздкие', seller:'«Кукушка молчит, но дверца открывается»', marking:'циферблат эмалевый' },
    story:'Часы, которые жили в доме громче всех. Кукушка потеряла голос ещё в семидесятые, но дверцу по привычке открывала исправно — ровно в восемь утра.',
    svg:_svg(`<path d="M52 78 L100 36 L148 78 v84 h-96 z" fill="${S.woodDark}"/><circle cx="100" cy="104" r="26" fill="${S.cream}"/><path d="M100 88 v16 l12 8" stroke-width="4"/><rect x="86" y="138" width="28" height="18" rx="3" fill="${S.wood}"/><path d="M100 162 v22 M88 184 h24" stroke-width="4"/><circle cx="88" cy="192" r="7" fill="${S.brass}"/><circle cx="112" cy="192" r="7" fill="${S.brass}"/>`) },
  { id:'alarm', name:'Будильник «Заря»', cat:'clocks', rarity:'common', value:[50,120], restore:'clean', set:'clocks',
    clues:{ material:'жесть', weight:'лёгкий', marking:'цена «1 р. 20 к.»', seller:'«Звонил так, что соседи просили»' },
    story:'Поднимал всю коммуналку ровно в шесть пятнадцать. Кнопка «ещё пять минут» существовала только в воображении владельцев.',
    svg:_svg(`<circle cx="100" cy="104" r="48" fill="${S.red}"/><circle cx="100" cy="104" r="36" fill="${S.cream}"/><path d="M100 84 v20 l14 8" stroke-width="4"/><circle cx="66" cy="62" r="12" fill="${S.brass}"/><circle cx="134" cy="62" r="12" fill="${S.brass}"/><path d="M74 146 l-8 18 M126 146 l8 18" stroke-width="6"/>`) },
  { id:'scales', name:'Аптекарские весы', cat:'clocks', rarity:'common', value:[60,140], restore:'assemble', set:'clocks',
    clues:{ material:'латунь', weight:'средний', seller:'«С гирьками»', marking:'клеймо поверки' },
    story:'Взвешивали до миллиграмма: мука для кулича, порошок от головы, конфеты «Мишка на севере» по десять грамм. Точность была вопросом совести.',
    svg:_svg(`<rect x="60" y="150" width="80" height="12" rx="4" fill="${S.woodDark}"/><path d="M100 150 v-56" stroke-width="7"/><path d="M56 94 h88" stroke-width="6"/><path d="M56 94 l-16 30 h32 z" fill="${S.brass}"/><path d="M144 94 l-16 30 h32 z" fill="${S.brass}"/><circle cx="100" cy="94" r="7" fill="${S.metalDark}"/><path d="M100 108 v14" stroke-width="3"/><circle cx="100" cy="126" r="5" fill="${S.brass}"/>`) },
  { id:'compass', name:'Геодезический компас', cat:'clocks', rarity:'rare', value:[280,620], restore:'polish', set:'clocks',
    clues:{ material:'латунь и стекло', weight:'увесистый', marking:'«Азимут», номер на крышке', seller:'«Из экспедиции 60-х»' },
    story:'С этим компасом ходили в Хибины и на Памир. Стрелка до сих пор уверенно показывает север — единственное, в чём этот мир абсолютно надёжен.',
    svg:_svg(`<circle cx="100" cy="106" r="50" fill="${S.brass}"/><circle cx="100" cy="106" r="38" fill="${S.cream}"/><path d="M100 76 l10 30 l-10 30 l-10 -30 z" fill="${S.red}" stroke-width="3"/><path d="M100 76 l10 30 h-20 z" fill="${S.dark}" stroke-width="2"/><text x="100" y="66" text-anchor="middle" font-size="16" fill="#5a4632" stroke="none">С</text><rect x="88" y="44" width="24" height="10" rx="4" fill="${S.metalDark}"/>`) },
  { id:'sewing', name:'Швейная машина', cat:'clocks', rarity:'epic', value:[900,1700], restore:'assemble', set:'clocks', fixture:'sewing',
    clues:{ material:'чугун, дуб', weight:'неподъёмная', marking:'заводской номер на станине', seller:'«Шила всей пятиэтажке»' },
    story:'Под её стрекот выросло три поколения: школьная форма, платья на выпускной, латки на коленках. Педаль ходила так ровно, будто машина дышала.',
    svg:_svg(`<rect x="40" y="140" width="120" height="16" rx="4" fill="${S.woodDark}"/><path d="M56 140 v-44 h88 v16 h-64 v28 z" fill="${S.dark}"/><circle cx="150" cy="104" r="12" fill="${S.metal}"/><path d="M72 96 l10 22" stroke-width="5"/><rect x="62" y="118" width="26" height="8" rx="3" fill="${S.metal}"/><path d="M96 156 v22 M124 156 v22" stroke-width="5"/><path d="M150 116 q14 20 -6 34" stroke-width="4"/>`) },
  { id:'binoculars', name:'Бинокль театральный', cat:'clocks', rarity:'rare', value:[260,580], restore:'polish', set:'clocks',
    clues:{ material:'перламутр и латунь', weight:'лёгкий', seller:'«В футляре с бархатом»', marking:'оптик «ВОМЗ»' },
    story:'Из ложи бельэтажа в него было видно, кто в антракте с кем здоровается. Главный светский инструмент прошлого века.',
    svg:_svg(`<circle cx="72" cy="96" r="26" fill="${S.brass}"/><circle cx="128" cy="96" r="26" fill="${S.brass}"/><circle cx="72" cy="96" r="14" fill="${S.glass}"/><circle cx="128" cy="96" r="14" fill="${S.glass}"/><rect x="88" y="88" width="24" height="16" rx="4" fill="${S.metalDark}"/><path d="M72 122 v20 M128 122 v20" stroke-width="8"/>`) },

  /* ===== Дом и уют (home) ===== */
  { id:'samovar', name:'Самовар', cat:'home', rarity:'rare', value:[280,620], restore:'polish', set:'home',
    clues:{ material:'латунь', weight:'тяжёлый', marking:'«Товарищество Баташевых»', seller:'«Грелся, как зверь»' },
    story:'Тульская фабрика, начало прошлого века. Закипал за три минуты, а вокруг него за полчаса собиралась вся семья — в этом и был главный его механизм.',
    svg:_svg(`<path d="M62 66 q-14 48 0 78 q20 14 38 14 q18 0 38 -14 q14 -30 0 -78 q-38 -12 -76 0 z" fill="${S.brass}"/><rect x="84" y="40" width="32" height="18" rx="4" fill="${S.brass}"/><circle cx="100" cy="34" r="8" fill="${S.brass}"/><path d="M138 128 h22 v10 h-22" fill="${S.brass}"/><path d="M62 84 q-18 8 -14 28 q2 12 14 14 M138 84 q18 8 14 28 q-2 12 -14 14" stroke-width="7"/><path d="M76 158 l-8 20 M124 158 l8 20" stroke-width="6"/>`) },
  { id:'kerosene', name:'Керосиновая лампа', cat:'home', rarity:'rare', value:[260,600], restore:'clean', set:'home',
    clues:{ material:'стекло и жестянка', weight:'средний', seller:'«Стекло целое — редкость»', marking:'нет' },
    story:'У керосиновой лампы свет мягкий и тёплый, почти живой. При этом свете кто-то делал уроки, кто-то штопал, а кто-то написал своё первое письмо — и так и не отправил.',
    svg:_svg(`<path d="M88 62 q-8 -22 12 -30 q-6 14 6 18 q10 4 8 14" stroke="${S.brass}" fill="${S.brass}" stroke-width="4"/><path d="M84 62 h32 l6 34 q-22 8 -44 0 z" fill="${S.glass}" opacity=".75"/><path d="M70 100 q30 10 60 0 l6 44 q-36 12 -72 0 z" fill="${S.metal}"/><circle cx="76" cy="118" r="7" fill="${S.brass}"/><path d="M70 144 q30 10 60 0" stroke-width="4"/>`) },
  { id:'iron', name:'Чугунный утюг', cat:'home', rarity:'common', value:[50,130], restore:'clean', set:'home',
    clues:{ material:'чугун', weight:'пудовый', seller:'«Бабушкин»', marking:'клеймо литейщиков' },
    story:'Весит три килограмма и требует твёрдой руки. Нагревался в печи — вся инструкция к нему состояла из одной фразы: «за железо не хватайся».',
    svg:_svg(`<path d="M44 138 h112 l-28 -56 h-56 z" fill="${S.metalDark}"/><path d="M72 76 q28 -30 56 0" stroke-width="9"/><path d="M44 138 q56 16 112 0" stroke-width="5"/><circle cx="100" cy="104" r="5" fill="#5a4632" stroke="none"/>`) },
  { id:'spindle', name:'Прялка', cat:'home', rarity:'common', value:[50,130], restore:'assemble', set:'home',
    clues:{ material:'дерево', weight:'громоздкая', seller:'«С чердака избы»', marking:'резьба по гребню' },
    story:'Вечера у окна, гудение колеса и бесконечные разговоры ни о чём. На этой прялке связали едва ли не половину деревенских носков — тёплых, колючих, неубиваемых.',
    svg:_svg(`<circle cx="76" cy="76" r="44" stroke-width="8" stroke="${S.woodDark}"/><path d="M76 32 v88 M32 76 h88 M45 45 l62 62 M107 45 l-62 62" stroke-width="4"/><path d="M118 120 h50 v40 h-50 z" fill="${S.wood}"/><path d="M96 120 l20 -20 M140 160 l24 16" stroke-width="5"/>`) },
  { id:'sugar', name:'Сахарница с росписью', cat:'home', rarity:'common', value:[60,140], restore:'clean', set:'home',
    clues:{ material:'фарфор', weight:'лёгкая', seller:'«Крышка на месте!»', marking:'синее клеймо завода' },
    story:'В таких держали сахар «к чаю для гостей», а everyday-чай пили с вареньем. Роспись слегка стёрта от рук — значит, гостей было много.',
    svg:_svg(`<path d="M56 96 q44 -18 88 0 q8 34 -10 50 q-34 16 -68 0 q-18 -16 -10 -50 z" fill="${S.cream}"/><ellipse cx="100" cy="94" rx="46" ry="12" fill="${S.cream}"/><circle cx="100" cy="80" r="9" fill="${S.blue||'#7d9ab1'}"/><path d="M70 112 q8 8 0 16 M100 116 q8 8 0 16 M128 112 q8 8 0 16" stroke-width="3" stroke="${S.blue||'#7d9ab1'}"/>`) },
  { id:'photoalbum', name:'Фотоальбом в бархате', cat:'home', rarity:'rare', value:[280,600], restore:'clean', set:'home',
    clues:{ material:'бархат, картон', weight:'увесистый', seller:'«Внутри фотографии — не выбрасывайте!»', marking:'уголки тиснёные' },
    story:'Сто лет семейной истории в уголках «под фото»: прадед в шинели, мама на первом курсе, дача, которой больше нет. Чужие лица — и почему-то родные.',
    svg:_svg(`<rect x="48" y="52" width="104" height="120" rx="8" fill="${S.red}"/><rect x="60" y="64" width="80" height="96" rx="4" fill="${S.cream}" stroke-width="4"/><rect x="72" y="78" width="56" height="42" rx="3" fill="${S.metal}"/><path d="M72 134 h56 M72 146 h40" stroke-width="4"/><circle cx="100" cy="99" r="10" fill="${S.woodDark}"/>`) },
  { id:'books', name:'Собрание сочинений', cat:'home', rarity:'common', value:[55,130], restore:'clean', set:'home',
    clues:{ material:'бумага, коленкор', weight:'тяжёлая стопка', seller:'«Десять томов, все на месте»', marking:'экслибрис на форзаце' },
    story:'Книги держали не для чтения — их было не достать. Собрание сочинений на полке было знаком: в доме живут уважаемые люди.',
    svg:_svg(`<rect x="52" y="60" width="26" height="104" rx="4" fill="${S.red}"/><rect x="82" y="52" width="26" height="112" rx="4" fill="${S.green}"/><rect x="112" y="66" width="26" height="98" rx="4" fill="${S.dark}"/><path d="M58 76 h14 M88 68 h14 M118 82 h14" stroke-width="3" stroke="${S.brass}"/><rect x="44" y="164" width="112" height="10" rx="4" fill="${S.woodDark}"/>`) },
  { id:'podstakannik', name:'Подстаканник', cat:'home', rarity:'common', value:[50,120], restore:'polish', set:'home',
    clues:{ material:'мельхиор', weight:'средний', seller:'«Из железнодорожного буфета»', marking:'«Мстёрский завод»' },
    story:'Чай в подстаканнике — вкус поезда: стук колёс, белая скатерть на столике, и за окном полстраны. Из такого стакана не пили — с ним путешествовали.',
    svg:_svg(`<path d="M70 72 h60 v72 q-30 14 -60 0 z" fill="${S.glass}" opacity=".8"/><path d="M62 96 q-16 6 -12 22 q2 10 12 12 M138 96 q16 6 12 22 q-2 10 -12 12" stroke-width="6"/><ellipse cx="100" cy="72" rx="30" ry="8" fill="${S.metal}"/><rect x="62" y="144" width="76" height="12" rx="5" fill="${S.metal}"/><path d="M100 156 v10" stroke-width="5"/><ellipse cx="100" cy="170" rx="26" ry="7" fill="${S.metal}"/>`) },

  /* ===== Разности (free) — чистый арбитраж и заказы ===== */
  { id:'jug', name:'Крынка со сколом', cat:'free', rarity:'junk', value:[5,25], restore:'clean',
    clues:{ material:'глина', weight:'лёгкая', seller:'«Скололось на горлышке»', marking:'нет' },
    story:'Глиняная крынка, в которой держали молоко. Скол на горлышке ещё довоенный: бабушка прошлого владельца говорила, что так молоко дольше остаётся холодным.',
    svg:_svg(`<path d="M78 58 h44 v14 c26 16 30 44 22 78 c-6 22 -24 32 -44 32 s-38 -10 -44 -32 c-8 -34 -4 -62 22 -78 z" fill="${S.cream}"/><path d="M122 66 q34 12 26 52 q-4 16 -16 20"/><path d="M70 62 l-8 -6 M136 96 l10 4" stroke-width="4"/>`) },
  { id:'horseshoe', name:'Подкова', cat:'free', rarity:'junk', value:[5,25], restore:'clean',
    clues:{ material:'ржавое железо', weight:'тяжёлая', seller:'«Со снятого сарая»', marking:'гвоздевые отверстия' },
    story:'Её прибивали над дверью «на счастье» — судя по потёртым отверстиям, держалась лет сорок. Счастье, кажется, работало: дом до сих пор стоит.',
    svg:_svg(`<path d="M62 152 v-52 a38 38 0 0 1 76 0 v52" stroke-width="14" stroke="${S.metalDark}"/><path d="M62 152 v-52 a38 38 0 0 1 76 0 v52" stroke-width="6"/><circle cx="72" cy="118" r="4" fill="#5a4632" stroke="none"/><circle cx="128" cy="118" r="4" fill="#5a4632" stroke="none"/><circle cx="82" cy="88" r="4" fill="#5a4632" stroke="none"/><circle cx="118" cy="88" r="4" fill="#5a4632" stroke="none"/>`) },
  { id:'valenok', name:'Валенок (один)', cat:'free', rarity:'junk', value:[5,25], restore:'clean',
    clues:{ material:'войлок', weight:'лёгкий', seller:'«Пара была. Была.»', marking:'нет' },
    story:'Один. Второй, по семейной легенде, обменяли в девяносто третьем на банку солений — и это была выгодная сделка.',
    svg:_svg(`<path d="M76 38 q-12 62 -6 98 q3 26 32 26 h44 q22 0 16 -20 q-6 -16 -32 -19 l-18 -4 q-9 -42 -6 -81 z" fill="#9a8d7a"/><path d="M70 52 q26 10 52 2" stroke-width="5"/>`) },
  { id:'buttons', name:'Жестянка с пуговицами', cat:'free', rarity:'junk', value:[5,25], restore:'clean',
    clues:{ material:'жесть', weight:'гремящая', seller:'«Гремит — значит полная»', marking:'из-под печенья' },
    story:'Банка из-под печенья, полная пуговиц, которыми никто никогда не пользовался. Здесь есть пуговица от пальто, которое доносили в девяносто четвёртом.',
    svg:_svg(`<ellipse cx="100" cy="86" rx="52" ry="16" fill="${S.metal}"/><path d="M48 86 v52 q52 22 104 0 v-52" fill="${S.metalDark}"/><circle cx="76" cy="66" r="9" fill="${S.red}"/><circle cx="104" cy="60" r="8" fill="${S.green}"/><circle cx="128" cy="68" r="7" fill="${S.cream}"/><path d="M60 112 q40 12 80 0" stroke-width="4"/>`) },
  { id:'vhs', name:'Видеокассета', cat:'free', rarity:'junk', value:[5,25], restore:'clean',
    clues:{ material:'пластик', weight:'лёгкая', seller:'«Подписана: НЕ СТИРАТЬ»', marking:'от руки «Терминатор?»' },
    story:'На наклейке от руки: «НЕ СТИРАТЬ!!». Что записано после первых десяти минут, не знал никто — но спорить с тремя восклицательными знаками было нельзя.',
    svg:_svg(`<rect x="34" y="66" width="132" height="76" rx="8" fill="#3a3f45"/><rect x="52" y="84" width="96" height="40" rx="6" fill="${S.cream}"/><circle cx="78" cy="104" r="13"/><circle cx="122" cy="104" r="13"/><circle cx="78" cy="104" r="4" fill="#5a4632" stroke="none"/><circle cx="122" cy="104" r="4" fill="#5a4632" stroke="none"/><path d="M52 150 h96" stroke-width="8" stroke="${S.metalDark}"/>`) },
  { id:'mirror', name:'Треснувшее зеркальце', cat:'free', rarity:'junk', value:[5,25], restore:'polish',
    clues:{ material:'металл, стекло', weight:'лёгкое', seller:'«Пудреница, вроде»', marking:'паутинка трещин' },
    story:'Пудреница с треснувшим зеркальцем. По примете — к беде; но раз уж попало в лавку, пусть будет памятью о чьей-то танцплощадке в четверг.',
    svg:_svg(`<circle cx="82" cy="112" r="46" fill="${S.red}"/><circle cx="82" cy="112" r="34" fill="${S.glass}"/><path d="M62 92 l40 40 M96 84 l-24 52 M70 130 l30 -18" stroke-width="3"/><circle cx="126" cy="76" r="6" fill="${S.brass}"/>`) },
  { id:'pins', name:'Подушечка со значками', cat:'free', rarity:'common', value:[50,130], restore:'clean',
    clues:{ material:'бархат, металл', weight:'лёгкая', seller:'«Дед копил всю жизнь»', marking:'«Служу лету!»' },
    story:'Бархатная подушечка, густо утыканная значками: космонавт, яхта, «С днём рождения!» и загадочный «Служу лету». Целая биография — по цене килограмма металла.',
    svg:_svg(`<rect x="42" y="58" width="116" height="88" rx="10" fill="${S.red}"/><circle cx="72" cy="86" r="13" fill="${S.cream}"/><circle cx="110" cy="78" r="11" fill="${S.brass}"/><circle cx="134" cy="104" r="12" fill="${S.green}"/><circle cx="86" cy="120" r="12" fill="${S.metal}"/><path d="M72 80 l3 4 l6 -6 M106 74 l4 4 l6 -5" stroke-width="3"/><circle cx="120" cy="126" r="8" fill="${S.cream}"/>`) },
  { id:'thermo', name:'Походный термос', cat:'free', rarity:'common', value:[50,120], restore:'clean',
    clues:{ material:'алюминий', weight:'средний', seller:'«Держит кипяток сутки — проверял»', marking:'вмятина на дне' },
    story:'С этим термосом ходили в походы, на рыбалку и встречать поезд. Вмятина на дне — от медведя, «а может, и сам помял», — как рассказывал владелец.',
    svg:_svg(`<rect x="72" y="52" width="56" height="112" rx="14" fill="${S.metal}"/><rect x="80" y="38" width="40" height="22" rx="8" fill="${S.red}"/><path d="M72 92 h56" stroke-width="4"/><path d="M84 110 h32" stroke-width="3"/><path d="M92 164 v14 M108 164 v14" stroke-width="4"/>`) },
  { id:'fishing', name:'Бамбуковая удочка', cat:'free', rarity:'common', value:[55,130], restore:'assemble',
    clues:{ material:'бамбук, леска', weight:'длинная, лёгкая', seller:'«Крючки в пробке»', marking:'подпись «Дяде Коле»' },
    story:'Трёхколенка, пробка на рукояти отшлифована ладонью до блеска. На такую ловили плотву всей дачей — и каждый был уверен, что его поклёвка вот-вот.',
    svg:_svg(`<path d="M40 170 L160 40" stroke-width="8" stroke="${S.wood}"/><path d="M40 170 l-8 8 M160 40 q6 -10 14 -6" stroke-width="4"/><path d="M166 46 q10 30 -6 50 q-6 8 -2 16" stroke-width="2"/><circle cx="160" cy="116" r="5" fill="${S.metal}"/><path d="M92 112 q12 8 0 16" stroke-width="3"/><rect x="60" y="140" width="26" height="10" rx="4" fill="${S.woodDark}" transform="rotate(-42 73 145)"/>`) },
  { id:'guitar', name:'Советская гитара', cat:'free', rarity:'epic', value:[900,1700], restore:'assemble',
    clues:{ material:'дерево, струны', weight:'объёмная', seller:'«Играл в студенческом ансамбле»', marking:'этикетка внутри деки' },
    story:'Семиструнная, с трещиной, заклеенной изнутри газетой 1974 года. В её компании пели у костра, на кухнях и в плацкарте — где угодно, лишь бы не мешали.',
    svg:_svg(`<ellipse cx="100" cy="128" rx="46" ry="40" fill="${S.wood}"/><ellipse cx="100" cy="88" rx="34" ry="28" fill="${S.wood}"/><circle cx="100" cy="122" r="14" fill="#3a2c1d"/><rect x="94" y="24" width="12" height="52" rx="3" fill="${S.woodDark}"/><rect x="86" y="14" width="28" height="14" rx="4" fill="${S.woodDark}"/><path d="M96 30 v-8 M100 30 v-8 M104 30 v-8" stroke-width="2"/><path d="M92 96 v64 M100 96 v64 M108 96 v64" stroke-width="1.5"/>`) },
  { id:'chess', name:'Шахматы tournament', cat:'free', rarity:'epic', value:[950,1800], restore:'polish',
    clues:{ material:'точёный камень', weight:'фигуры тяжёлые', seller:'«Доска из красного дерева»', marking:'свинец в основаниях' },
    story:'Тяжёлые фигурки со свинцом в основаниях — такими играли «на серьёзных турнирах». Король слегка отполирован тысячей пальцев: им решались судьбы дворовых чемпионатов.',
    svg:_svg(`<rect x="36" y="120" width="128" height="40" rx="6" fill="${S.woodDark}"/>`+[0,1,2,3].map(i=>`<rect x="${44+i*30}" y="128" width="22" height="22" fill="${i%2?S.cream:S.woodDark}" stroke-width="2"/>`).join('')+
    `<path d="M84 118 q-14 -6 -12 -22 q0 -10 12 -12 q12 2 12 12 q2 16 -12 22 z M84 118 h0 l4 8 h-24 l4 -8" fill="${S.cream}"/><circle cx="84" cy="70" r="8" fill="${S.cream}"/><path d="M120 118 q-10 -8 -8 -24 h16 q2 16 -8 24 z M112 94 h16 l-2 -12 h-12 z" fill="${S.dark}"/><circle cx="120" cy="72" r="7" fill="${S.dark}"/>`) },
  { id:'pet', name:'Электронный питомец', cat:'free', rarity:'epic', value:[900,1600], restore:'clean',
    clues:{ material:'пластик, брелок', weight:'крошечный', seller:'«Пищал всю дорогу, пока вёз»', marking:'пиксельный экран' },
    story:'Его кормили на переменах всей школой по очереди. Если питомец «умирал», траур был настоящим — первый в жизни урок цифровой ответственности.',
    svg:_svg(`<ellipse cx="100" cy="104" rx="52" ry="46" fill="${S.red}"/><ellipse cx="100" cy="100" rx="38" ry="30" fill="${S.cream}"/><rect x="76" y="82" width="48" height="34" rx="6" fill="${S.green}"/><circle cx="92" cy="94" r="3" fill="#3a2c1d" stroke="none"/><circle cx="108" cy="94" r="3" fill="#3a2c1d" stroke="none"/><path d="M94 104 q6 6 12 0" stroke-width="3"/><circle cx="80" cy="130" r="5" fill="${S.brass}"/><circle cx="100" cy="132" r="5" fill="${S.brass}"/><circle cx="120" cy="130" r="5" fill="${S.brass}"/><path d="M100 58 v-10 q0 -6 6 -6" stroke-width="4"/>`) }
];

/* ---------- лица (NPC и клиенты) ---------- */
window.FACES = {
  n1: _svg(`<circle cx="100" cy="100" r="70" fill="#e8c9a8"/><circle cx="76" cy="88" r="16" fill="none" stroke-width="5"/><circle cx="124" cy="88" r="16" fill="none" stroke-width="5"/><path d="M92 88 h16" stroke-width="5"/><path d="M70 130 q30 18 60 0" stroke-width="6"/><path d="M88 152 q12 10 24 0" stroke-width="5"/><path d="M52 52 q48 -34 96 0 l-8 -18 q-40 -22 -80 0 z" fill="${S.dark}"/>`),
  n2: _svg(`<circle cx="100" cy="100" r="70" fill="#f0d5b8"/><path d="M40 76 q60 -50 120 0 q-60 -22 -120 0 z" fill="${S.red}"/><circle cx="80" cy="100" r="6" fill="#3a2c1d" stroke="none"/><circle cx="120" cy="100" r="6" fill="#3a2c1d" stroke="none"/><path d="M78 130 q22 12 44 0" stroke-width="6"/><rect x="56" y="128" width="26" height="18" rx="4" fill="${S.metalDark}"/>`),
  n3: _svg(`<circle cx="100" cy="100" r="70" fill="#e0b894"/><circle cx="82" cy="92" r="7" fill="#3a2c1d" stroke="none"/><circle cx="118" cy="92" r="7" fill="#3a2c1d" stroke="none"/><circle cx="118" cy="92" r="18" fill="none" stroke-width="4"/><path d="M132 104 l16 14" stroke-width="5"/><path d="M60 60 q40 -26 80 0" stroke-width="8" stroke="${S.metalDark}"/><path d="M76 134 q24 26 48 0 q-24 40 -48 0 z" fill="${S.metalDark}"/>`),
  n4: _svg(`<circle cx="100" cy="100" r="70" fill="#f2dcc4"/><path d="M36 92 q64 -66 128 0 q-20 -14 -30 -12 q-34 -18 -68 0 q-12 -2 -30 12 z" fill="#c9b7d9"/><circle cx="80" cy="102" r="5" fill="#3a2c1d" stroke="none"/><circle cx="120" cy="102" r="5" fill="#3a2c1d" stroke="none"/><circle cx="80" cy="102" r="14" fill="none" stroke-width="4"/><circle cx="120" cy="102" r="14" fill="none" stroke-width="4"/><path d="M94 102 h12" stroke-width="4"/><path d="M82 134 q18 10 36 0" stroke-width="5"/>`),
  c1: _svg(`<circle cx="100" cy="100" r="70" fill="#e8c9a8"/><rect x="46" y="40" width="108" height="30" rx="12" fill="${S.woodDark}"/><circle cx="80" cy="98" r="6" fill="#3a2c1d" stroke="none"/><circle cx="120" cy="98" r="6" fill="#3a2c1d" stroke="none"/><path d="M74 132 q26 16 52 0" stroke-width="6"/><path d="M84 150 q16 8 32 0" stroke-width="4"/>`),
  c2: _svg(`<circle cx="100" cy="100" r="70" fill="#f0d5b8"/><path d="M34 96 q10 -60 66 -60 q56 0 66 60 q-24 -20 -34 -44 q-32 20 -64 8 q-20 12 -34 36 z" fill="#7a5c3e"/><circle cx="80" cy="100" r="6" fill="#3a2c1d" stroke="none"/><circle cx="120" cy="100" r="6" fill="#3a2c1d" stroke="none"/><path d="M80 132 q20 12 40 0" stroke-width="5"/>`),
  c3: _svg(`<circle cx="100" cy="100" r="70" fill="#e0b894"/><path d="M52 66 q48 -30 96 0" stroke-width="10" stroke="${S.dark}"/><circle cx="82" cy="96" r="6" fill="#3a2c1d" stroke="none"/><circle cx="118" cy="96" r="6" fill="#3a2c1d" stroke="none"/><path d="M78 130 q22 14 44 0" stroke-width="5"/><path d="M70 140 q30 34 60 0 q-30 22 -60 0 z" fill="${S.dark}"/>`),
  c4: _svg(`<circle cx="100" cy="100" r="70" fill="#f2dcc4"/><path d="M36 92 q20 -56 64 -56 q44 0 64 56 q-30 -24 -64 -20 q-34 -4 -64 20 z" fill="${S.brass}"/><circle cx="80" cy="100" r="6" fill="#3a2c1d" stroke="none"/><circle cx="120" cy="100" r="6" fill="#3a2c1d" stroke="none"/><path d="M80 132 q20 12 40 0" stroke-width="5"/><circle cx="66" cy="118" r="4" fill="${S.red}" stroke="none"/><circle cx="134" cy="118" r="4" fill="${S.red}" stroke="none"/>`),
  c5: _svg(`<circle cx="100" cy="100" r="70" fill="#d9b48f"/><path d="M40 78 q60 -44 120 0 l-10 -20 q-50 -30 -100 0 z" fill="#4a4f55"/><circle cx="80" cy="98" r="6" fill="#3a2c1d" stroke="none"/><circle cx="120" cy="98" r="6" fill="#3a2c1d" stroke="none"/><path d="M72 128 q28 20 56 0" stroke-width="6"/><path d="M60 140 q40 30 80 0" stroke-width="4" opacity=".5"/>`)
};

/* ---------- ящик лота ---------- */
window.CRATE_SVG = _svg(`
  <rect x="30" y="55" width="140" height="100" rx="8" fill="${S.woodDark}"/>
  <path d="M30 55 L170 155 M170 55 L30 155" stroke-width="8" stroke="${S.wood}"/>
  <rect x="22" y="48" width="156" height="14" rx="6" fill="${S.wood}"/>
  <rect x="22" y="148" width="156" height="14" rx="6" fill="${S.wood}"/>
  <circle cx="100" cy="105" r="16" fill="${S.brass}" stroke-width="5"/>
  <text x="100" y="113" text-anchor="middle" font-size="22" fill="#5a4632" stroke="none" font-family="Georgia">?</text>`);

/* ---------- индексы ---------- */
window.ITEMS_BY_ID = {}; window.ITEMS_BY_CAT = { tech: [], clocks: [], home: [], free: [] };
window.ITEMS_BY_RARITY = { junk: [], common: [], rare: [], epic: [], legend: [] };
window.ITEMS.forEach(it => {
  window.ITEMS_BY_ID[it.id] = it;
  window.ITEMS_BY_CAT[it.cat].push(it);
  window.ITEMS_BY_RARITY[it.rarity].push(it);
});
