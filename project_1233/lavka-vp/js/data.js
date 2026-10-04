/* ============================================================
   data.js — конфигурация экономики + каталог предметов (MVP-A)
   Все числа баланса — из validation/economy_sim_v4.py (калибровка N=10000)
   Никаких магических чисел в коде сцен: только CONFIG.
   ============================================================ */

window.CONFIG = {
  meta: { name: 'Лавка древностей', version: '0.1.0-mvpA', saveKey: 'lavka_save_v0' },
  start_coins: 450,
  bailout: { threshold: 130, amount: 160 },        // анти-тупик в MVP-A (телеметрия: событие bailout)
  tiers: {
    T1: {
      cost: 150, costSpread: 0.12,                // цена лота 150 ±12%
      p: { junk: 0.46, common: 0.35, rare: 0.135, epic: 0.045, legend: 0.010 }
    }
    // T2/T3 — в MVP-B (ключи зарезервированы, чтобы не переписывать схему)
  },
  restore: { minProgress: 0.60, qFrom: 0.55, qTo: 0.97, autoQuality: 1.0 },
  economy: { keep_refund: 0.35, dup_fraction: 0.40 },
  pity: 70,                                       // считается, но в MVP-A НЕ применяется (по спеке A.6)
  ftue: {
    firstLotFree: true,
    scripted: [                                    // первые 3 открытия — скрипт (см. валид-док, раздел 11)
      { rarity: 'rare',  item: 'camera'  },        // «вау-находка» + история
      { rarity: 'epic',  item: 'cuckoo'  },        // второй вау-момент
      { rarity: 'junk',  item: 'buttons' }         // урок «хлам → монеты»
    ]
  },
  ads: {
    rewarded: { auto_restore: { limitPerDay: 3 } },
    interstitial: { result_to_auction: { every: 3 } }
  },
  rarityLabels: { junk: 'Хлам', common: 'Обычный', rare: 'Редкий', epic: 'Эпический', legend: 'Легендарный' },
  eraLabels: { village: 'Дачный быт', retrotech: 'Ретротехника', nineties: 'Двор 90-х' }
};

/* ---------- SVG-хелпер: единый стиль (сепия, «гравюра») ---------- */
const _svg = (body) =>
  `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#5a4632" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const S = { // палитра
  wood: '#c8a97e', woodDark: '#a67c52', metal: '#b9b2a4', metalDark: '#8d887c',
  brass: '#d9b23f', red: '#b5533c', green: '#6e7f6a', cream: '#efe3cc', glass: '#cfe0e0'
};

/* ---------- Ящик (лот/анимация открытия) ---------- */
window.CRATE_SVG = _svg(`
  <rect x="30" y="55" width="140" height="100" rx="8" fill="${S.woodDark}"/>
  <rect x="30" y="55" width="140" height="100" rx="8"/>
  <path d="M30 55 L170 155 M170 55 L30 155" stroke-width="8" stroke="${S.wood}"/>
  <rect x="22" y="48" width="156" height="14" rx="6" fill="${S.wood}"/>
  <rect x="22" y="148" width="156" height="14" rx="6" fill="${S.wood}"/>
  <circle cx="100" cy="105" r="16" fill="${S.brass}" stroke-width="5"/>
  <text x="100" y="113" text-anchor="middle" font-size="22" fill="#5a4632" stroke="none" font-family="Georgia">?</text>
`);

/* ---------- Каталог: 19 предметов ---------- */
window.ITEMS = [
  /* ===== Дачный быт (village) ===== */
  { id:'jug', name:'Крынка со сколом', era:'village', rarity:'junk', value:[5,25], restore:'clean',
    story:'Глиняная крынка, в которой когда-то держали молоко. Скол на горлышке — ещё довоенный: бабушка прошлого владельца говорила, что так молоко дольше остаётся холодным.',
    svg:_svg(`<path d="M78 58 h44 v14 c26 16 30 44 22 78 c-6 22 -24 32 -44 32 s-38 -10 -44 -32 c-8 -34 -4 -62 22 -78 z" fill="${S.cream}"/>
      <path d="M122 66 q34 12 26 52 q-4 16 -16 20" />
      <path d="M70 62 l-8 -6 M136 96 l10 4" stroke-width="4"/>`) },
  { id:'horseshoe', name:'Подкова «на счастье»', era:'village', rarity:'junk', value:[5,25], restore:'clean',
    story:'Её прибивали над дверью «на счастье» — судя по потёртым гвоздевым отверстиям, держалась она там лет сорок. Счастье, кажется, работало: дом до сих пор стоит.',
    svg:_svg(`<path d="M62 152 v-52 a38 38 0 0 1 76 0 v52" stroke-width="14" stroke="${S.metalDark}"/>
      <path d="M62 152 v-52 a38 38 0 0 1 76 0 v52" stroke-width="6"/>
      <circle cx="72" cy="118" r="4" fill="#5a4632" stroke="none"/><circle cx="128" cy="118" r="4" fill="#5a4632" stroke="none"/>
      <circle cx="82" cy="88" r="4" fill="#5a4632" stroke="none"/><circle cx="118" cy="88" r="4" fill="#5a4632" stroke="none"/>`) },
  { id:'valenok', name:'Валенок (один)', era:'village', rarity:'junk', value:[5,25], restore:'clean',
    story:'Один. Второй, по семейной легенде, обменяли в девяносто третьем на банку солений — и это была выгодная сделка. Внутри до сих пор пахнет печкой и дымом.',
    svg:_svg(`<path d="M76 38 q-12 62 -6 98 q3 26 32 26 h44 q22 0 16 -20 q-6 -16 -32 -19 l-18 -4 q-9 -42 -6 -81 z" fill="#9a8d7a"/>
      <path d="M70 52 q26 10 52 2" stroke-width="5"/>`) },
  { id:'spindle', name:'Прялка', era:'village', rarity:'common', value:[50,130], restore:'clean',
    story:'Вечера у окна, гудение колеса и бесконечные разговоры ни о чём. На этой прялке связали едва ли не половину деревенских носков — тёплых, колючих, неубиваемых.',
    svg:_svg(`<circle cx="76" cy="76" r="44" stroke-width="8" stroke="${S.woodDark}"/>
      <path d="M76 32 v88 M32 76 h88 M45 45 l62 62 M107 45 l-62 62" stroke-width="4"/>
      <path d="M118 120 h50 v40 h-50 z" fill="${S.wood}"/>
      <path d="M96 120 l20 -20 M140 160 l24 16" stroke-width="5"/>`) },
  { id:'iron', name:'Чугунный утюг', era:'village', rarity:'common', value:[50,130], restore:'clean',
    story:'Весит три килограмма и требует твёрдой руки. Нагревался в печи — вся инструкция к нему состояла из одной фразы: «за железо не хватайся».',
    svg:_svg(`<path d="M44 138 h112 l-28 -56 h-56 z" fill="${S.metalDark}"/>
      <path d="M72 76 q28 -30 56 0" stroke-width="9"/>
      <path d="M44 138 q56 16 112 0" stroke-width="5"/>
      <circle cx="100" cy="104" r="5" fill="#5a4632" stroke="none"/>`) },
  { id:'samovar', name:'Самовар', era:'village', rarity:'rare', value:[260,600], restore:'clean',
    story:'Тульская фабрика, начало десятого года прошлого века. Закипал за три минуты, а вокруг него за полчаса собиралась вся семья — в этом и был главный его механизм.',
    svg:_svg(`<path d="M62 66 q-14 48 0 78 q20 14 38 14 q18 0 38 -14 q14 -30 0 -78 q-38 -12 -76 0 z" fill="${S.brass}"/>
      <rect x="84" y="40" width="32" height="18" rx="4" fill="${S.brass}"/>
      <circle cx="100" cy="34" r="8" fill="${S.brass}"/>
      <path d="M138 128 h22 v10 h-22" fill="${S.brass}"/>
      <path d="M62 84 q-18 8 -14 28 q2 12 14 14 M138 84 q18 8 14 28 q-2 12 -14 14" stroke-width="7"/>
      <path d="M76 158 l-8 20 M124 158 l8 20" stroke-width="6"/>`) },
  { id:'kerosene', name:'Керосиновая лампа', era:'village', rarity:'rare', value:[260,600], restore:'clean',
    story:'У керосиновой лампы свет мягкий и тёплый, почти живой. При этом свете кто-то делал уроки, кто-то штопал, а кто-то написал своё первое письмо — и так и не отправил.',
    svg:_svg(`<path d="M88 62 q-8 -22 12 -30 q-6 14 6 18 q10 4 8 14" stroke="${S.brass}" fill="${S.brass}" stroke-width="4"/>
      <path d="M84 62 h32 l6 34 q-22 8 -44 0 z" fill="${S.glass}" opacity=".75"/>
      <path d="M70 100 q30 10 60 0 l6 44 q-36 12 -72 0 z" fill="${S.metal}"/>
      <circle cx="76" cy="118" r="7" fill="${S.brass}"/>
      <path d="M70 144 q30 10 60 0" stroke-width="4"/>`) },
  { id:'cuckoo', name:'Ходики с кукушкой', era:'village', rarity:'epic', value:[900,1800], restore:'clean',
    story:'Часы, которые жили в доме громче всех. Кукушка потеряла голос ещё в семидесятые, но дверцу по привычке открывала исправно — ровно в восемь утра и ровно в десять вечера.',
    svg:_svg(`<path d="M52 78 L100 36 L148 78 v84 h-96 z" fill="${S.woodDark}"/>
      <circle cx="100" cy="104" r="26" fill="${S.cream}"/>
      <path d="M100 88 v16 l12 8" stroke-width="4"/>
      <rect x="86" y="138" width="28" height="18" rx="3" fill="${S.wood}"/>
      <path d="M100 162 v22 M88 184 h24" stroke-width="4"/>
      <circle cx="88" cy="192" r="7" fill="${S.brass}"/><circle cx="112" cy="192" r="7" fill="${S.brass}"/>`) },

  /* ===== Ретротехника (retrotech) ===== */
  { id:'phone', name:'Дисковый телефон', era:'retrotech', rarity:'common', value:[50,130], restore:'clean',
    story:'Аппарат, у которого каждую цифру надо было заслужить: диск возвращался с благородным «вжжж». Номер «07» набирался дольше всех — и все об этом знали.',
    svg:_svg(`<rect x="42" y="108" width="116" height="52" rx="12" fill="${S.red}"/>
      <circle cx="100" cy="134" r="20" fill="${S.cream}"/>
      <circle cx="100" cy="134" r="6" fill="#5a4632" stroke="none"/>
      <path d="M50 104 q10 -26 50 -26 q40 0 50 26" stroke-width="14" stroke="${S.red}"/>
      <path d="M58 96 h18 M124 96 h18" stroke-width="6"/>`) },
  { id:'camera', name:'Плёночный фотоаппарат', era:'retrotech', rarity:'rare', value:[260,600], restore:'clean',
    story:'Тридцать шесть кадров — и ни одного дубля. Именно поэтому каждый снимок, сделанный этим аппаратом, кто-то хранил потом всю жизнь в альбоме с уголками.',
    svg:_svg(`<rect x="34" y="72" width="132" height="84" rx="12" fill="${S.metalDark}"/>
      <rect x="72" y="58" width="42" height="16" rx="5" fill="${S.metal}"/>
      <circle cx="100" cy="114" r="30" fill="#3a3f45"/>
      <circle cx="100" cy="114" r="18" fill="${S.glass}" opacity=".8"/>
      <circle cx="90" cy="104" r="5" fill="#fff" opacity=".7" stroke="none"/>
      <rect x="140" y="84" width="16" height="12" rx="3" fill="${S.brass}"/>`) },
  { id:'watch', name:'Карманные часы', era:'retrotech', rarity:'rare', value:[260,600], restore:'clean',
    story:'Их передавали «когда подрастёт старший». На внутренней крышке выцарапано перочинным ножом: «Не опаздывай, но и не торопись» — завещание лучше не придумать.',
    svg:_svg(`<circle cx="100" cy="112" r="52" fill="${S.brass}"/>
      <circle cx="100" cy="112" r="40" fill="${S.cream}"/>
      <path d="M100 88 v24 l16 10" stroke-width="5"/>
      <rect x="92" y="48" width="16" height="12" rx="4" fill="${S.brass}"/>
      <circle cx="100" cy="40" r="9"/>
      <path d="M108 34 q30 -14 44 6" stroke-width="4"/>`) },
  { id:'reel', name:'Катушечный магнитофон', era:'retrotech', rarity:'epic', value:[900,1800], restore:'clean',
    story:'Короли гостиной. Запись песни с радио была священным ритуалом: все замирали, телефон — под подушку, дышать через раз. Щёлк — и у семьи появлялся собственный концерт.',
    svg:_svg(`<rect x="30" y="58" width="140" height="86" rx="10" fill="${S.wood}"/>
      <circle cx="72" cy="98" r="24" fill="${S.cream}"/><circle cx="128" cy="98" r="24" fill="${S.cream}"/>
      <circle cx="72" cy="98" r="7" fill="#5a4632" stroke="none"/><circle cx="128" cy="98" r="7" fill="#5a4632" stroke="none"/>
      <path d="M72 74 h56" stroke-width="4"/>
      <rect x="46" y="150" width="108" height="14" rx="6" fill="${S.metalDark}"/>
      <circle cx="60" cy="157" r="3" fill="${S.red}" stroke="none"/><circle cx="140" cy="157" r="3" fill="${S.green}" stroke="none"/>`) },
  { id:'radiola', name:'Ламповая радиола', era:'retrotech', rarity:'legend', value:[4000,9000], restore:'clean',
    story:'Гордость квартиры: проигрыватель и приёмник в одном полированном корпусе. Из неё по утрам — новости, по вечерам — джаз, а в Новый год не решались включать ничего, кроме неё.',
    svg:_svg(`<rect x="28" y="52" width="144" height="98" rx="10" fill="${S.woodDark}"/>
      <rect x="40" y="64" width="60" height="56" rx="6" fill="${S.wood}"/>
      <path d="M46 72 v40 M58 72 v40 M70 72 v40 M82 72 v40 M94 72 v40" stroke-width="3"/>
      <circle cx="134" cy="92" r="22" fill="${S.cream}"/>
      <circle cx="134" cy="92" r="6" fill="#5a4632" stroke="none"/>
      <rect x="112" y="126" width="46" height="12" rx="5" fill="${S.brass}"/>
      <path d="M42 150 l-6 22 M158 150 l6 22" stroke-width="7"/>`) },

  /* ===== Двор 90-х (nineties) ===== */
  { id:'buttons', name:'Жестянка с пуговицами', era:'nineties', rarity:'junk', value:[5,25], restore:'clean',
    story:'Банка из-под печенья, полная пуговиц, которыми никто никогда не пользовался. Здесь есть пуговица от пальто, которое доносили в девяносто четвёртом, и три запасные — от всего на свете.',
    svg:_svg(`<ellipse cx="100" cy="86" rx="52" ry="16" fill="${S.metal}"/>
      <path d="M48 86 v52 q52 22 104 0 v-52" fill="${S.metalDark}"/>
      <circle cx="76" cy="66" r="9" fill="${S.red}"/><circle cx="104" cy="60" r="8" fill="${S.green}"/>
      <circle cx="128" cy="68" r="7" fill="${S.cream}"/>
      <path d="M60 112 q40 12 80 0" stroke-width="4"/>`) },
  { id:'vhs', name:'Видеокассета', era:'nineties', rarity:'junk', value:[5,25], restore:'clean',
    story:'На наклейке от руки: «НЕ СТИРАТЬ!!». Что записано после первых десяти минут фильма, не знал никто — включая владельца, но спорить с тремя восклицательными знаками было нельзя.',
    svg:_svg(`<rect x="34" y="66" width="132" height="76" rx="8" fill="#3a3f45"/>
      <rect x="52" y="84" width="96" height="40" rx="6" fill="${S.cream}"/>
      <circle cx="78" cy="104" r="13"/><circle cx="122" cy="104" r="13"/>
      <circle cx="78" cy="104" r="4" fill="#5a4632" stroke="none"/><circle cx="122" cy="104" r="4" fill="#5a4632" stroke="none"/>
      <path d="M52 150 h96" stroke-width="8" stroke="${S.metalDark}"/>`) },
  { id:'mirror', name:'Треснувшее зеркальце', era:'nineties', rarity:'junk', value:[5,25], restore:'clean',
    story:'Пудреница с треснувшим зеркальцем. По примете — к беде; но раз уж оно попало в коллекцию, пусть будет просто памятью о чьей-то танцплощадке в четверг.',
    svg:_svg(`<circle cx="82" cy="112" r="46" fill="${S.red}"/>
      <circle cx="82" cy="112" r="34" fill="${S.glass}"/>
      <path d="M62 92 l40 40 M96 84 l-24 52 M70 130 l30 -18" stroke-width="3"/>
      <path d="M128 112 a46 46 0 0 0 -46 -46" stroke-width="6"/>
      <circle cx="126" cy="76" r="6" fill="${S.brass}"/>`) },
  { id:'cplayer', name:'Кассетный плеер', era:'nineties', rarity:'common', value:[50,130], restore:'clean',
    story:'Батареек хватало на два часа, а радости — на всю дорогу до школы. Функцию «перемотай карандашом» производитель заложил сам, просто скромно не написал об этом на корпусе.',
    svg:_svg(`<rect x="58" y="34" width="84" height="132" rx="10" fill="${S.metalDark}"/>
      <rect x="70" y="48" width="60" height="44" rx="6" fill="${S.cream}"/>
      <circle cx="86" cy="70" r="9"/><circle cx="114" cy="70" r="9"/>
      <rect x="70" y="102" width="60" height="10" rx="4" fill="#3a3f45"/>
      <circle cx="100" cy="136" r="12" fill="${S.green}"/>
      <path d="M142 50 h16 v30 h-16" stroke-width="5"/>`) },
  { id:'pins', name:'Подушечка со значками', era:'nineties', rarity:'common', value:[50,130], restore:'clean',
    story:'Бархатная подушечка, густо утыканная значками: космонавт, яхта, «С днём рождения!» и загадочный «Служу лету». Целая биография владельца — по цене килограмма металла.',
    svg:_svg(`<rect x="42" y="58" width="116" height="88" rx="10" fill="${S.red}"/>
      <circle cx="72" cy="86" r="13" fill="${S.cream}"/><circle cx="110" cy="78" r="11" fill="${S.brass}"/>
      <circle cx="134" cy="104" r="12" fill="${S.green}"/><circle cx="86" cy="120" r="12" fill="${S.metal}"/>
      <path d="M72 80 l3 4 l6 -6 M106 74 l4 4 l6 -5" stroke-width="3"/>
      <circle cx="120" cy="126" r="8" fill="${S.cream}"/>`) },
  { id:'console', name:'Игровая приставка', era:'nineties', rarity:'rare', value:[260,600], restore:'clean',
    story:'Подключалась к телевизору через тот самый разъём, который «надо покрутить, чтобы поймать». Во дворах по всей стране из-за неё звучало одно и то же: «Дай поиграть! Я только один раз!»',
    svg:_svg(`<rect x="30" y="86" width="140" height="58" rx="10" fill="#4a4f55"/>
      <rect x="44" y="70" width="60" height="20" rx="4" fill="${S.metalDark}"/>
      <path d="M52 116 h-10 v-10 h-8 v10 h-10 v8 h10 v10 h8 v-10 h10 z" fill="${S.cream}" transform="translate(14,0)"/>
      <circle cx="132" cy="108" r="8" fill="${S.red}"/><circle cx="152" cy="118" r="8" fill="${S.green}"/>
      <path d="M46 144 q-14 20 -30 16" stroke-width="5"/>`) }
];

/* индекс для быстрого доступа */
window.ITEMS_BY_ID = {};
window.ITEMS_BY_RARITY = { junk:[], common:[], rare:[], epic:[], legend:[] };
window.ITEMS.forEach(it => {
  window.ITEMS_BY_ID[it.id] = it;
  window.ITEMS_BY_RARITY[it.rarity].push(it);
});
