/* logic_tests.js — проверки данных и экономики «Лавки 2.0». Запуск: node tests/logic_tests.js */
global.window = {};
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'));
// минимальные зависимости systems/economy
global.SFX = { scrub(){}, click(){}, creak(){} };
global.window.Telemetry = { log(){}, buffer: () => [] };
eval(fs.readFileSync(path.join(root, 'js/economy.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'js/systems.js'), 'utf8'));

const E = window.Economy, C = window.CONFIG, G = window.Goals, AS = window.AuctionSystem, OS = window.OrdersSystem;
const results = [];
const check = (n, p, d) => results.push({ n, p: !!p, d: d || '' });

// 1. целостность каталога
check('каталог 30–40 предметов', window.ITEMS.length >= 30 && window.ITEMS.length <= 40, 'n=' + window.ITEMS.length);
check('id уникальны', new Set(window.ITEMS.map(i => i.id)).size === window.ITEMS.length);
let ok = true;
window.ITEMS.forEach(i => {
  if (!i.story || i.story.length < 40) ok = false;
  if (!i.svg || !i.svg.startsWith('<svg')) ok = false;
  if (!(i.value[0] > 0 && i.value[1] >= i.value[0])) ok = false;
  if (!window.CATS[i.cat]) ok = false;
  if (!['clean', 'polish', 'assemble'].includes(i.restore)) ok = false;
  if (!i.clues || !i.clues.material || !i.clues.weight || !i.clues.seller) ok = false;
  if (i.set && !window.SETS[i.set]) ok = false;
  if (i.fixture && !window.FIXTURES.find(f => f.item === i.id)) ok = false;
});
check('предметы: story/svg/value/cat/restore/clues валидны', ok);
const rar = { junk: 0, common: 0, rare: 0, epic: 0, legend: 0 };
window.ITEMS.forEach(i => rar[i.rarity]++);
check('редкости: 5 уровней представлены', Object.values(rar).every(v => v >= 2), JSON.stringify(rar));

// 2. сеты и заказы ссылаются на существующее
check('в каждом сете ≥5 предметов', Object.keys(window.SETS).every(s => window.ITEMS.filter(i => i.set === s).length >= 5));
check('заказы: item-цели существуют', window.ORDER_TEMPLATES.filter(t => t.want.item).every(t => window.ITEMS_BY_ID[t.want.item]));
check('заказы: cat-цели существуют', window.ORDER_TEMPLATES.filter(t => t.want.cat).every(t => window.CATS[t.want.cat]));
check('FTUE-лоты существуют', C.ftue.lots.every(l => window.ITEMS_BY_ID[l.item]));
check('фикстуры ссылаются на предметы', window.FIXTURES.every(f => window.ITEMS_BY_ID[f.item] && window.ITEMS_BY_ID[f.item].fixture === f.item));

// 3. экономика: условие/цена/шаг
const rnd = E.mulberry32(42);
let condOk = true, spOk = true, incOk = true;
for (let i = 0; i < 5000; i++) {
  const c = E.rollCondition(rnd);
  if (c < C.lot.conditionRange[0] - 0.01 || c > C.lot.conditionRange[1] + 0.01) condOk = false;
  const tV = 1000;
  const sp = E.startPrice(tV, window.HOUSES.city, rnd);
  if (sp < tV * 0.18 || sp > tV * 0.36) spOk = false;
  const inc = E.increment(100 + i);
  if (inc < C.lot.minIncrement) incOk = false;
}
check('condition в [0.7,1.3]', condOk);
check('start price в долях дома', spOk);
check('increment ≥ minIncrement', incOk);

// 4. NPC-потолки: Зинаида ниже стоимости, Аркадий выше на любимых, Пётр=0 на чужих
const phone = window.ITEMS_BY_ID.phone;
let zMax = 0, aLoveMin = 1e9, pOther = -1;
for (let i = 0; i < 2000; i++) {
  const tV = 1000;
  zMax = Math.max(zMax, E.npcCap(window.NPCS.zinaida, phone, tV, rnd));
  aLoveMin = Math.min(aLoveMin, E.npcCap(window.NPCS.arkady, phone, tV, rnd)); // tech — любовь Аркадия
  pOther = Math.max(pOther, E.npcCap(window.NPCS.petr, phone, tV, rnd));
}
check('Зинаида не платит выше ~1000 (перекуп)', zMax <= 1000 * (0.85 * 1.15 + 0.02), 'max=' + zMax);
check('Аркадий переплачивает за технику', aLoveMin >= 1000 * 1.5 * 0.85 * 0.9, 'min=' + aLoveMin);
check('Пётр не торгуется за чужую категорию', pOther === 0);

// 5. оценка по уликам сужается
const u0 = E.uncertainty(0, null), u2 = E.uncertainty(2, null), u4 = E.uncertainty(4, null);
check('улики сужают диапазон', u0 > u2 && u2 > u4 && u4 > 1, `${u0.toFixed(2)}>${u2.toFixed(2)}>${u4.toFixed(2)}`);
check('bandOf корректен', E.bandOf(50) === 0 && E.bandOf(300) === 1 && E.bandOf(900) === 2 && E.bandOf(2000) === 3);

// 6. заказы/сеты/фикстуры на фейковом сейве
const save = { v: 2, day: 1, coins: 600, owned: {}, fixtures: [], vitrine: [], orders: [], shopLevel: 1,
  stats: { ordersDone: 0 }, est: { submitted: 0, correct: 0 } };
OS.ensureBoard(save, rnd);
check('доска заказов заполнена (3 слота L1)', save.orders.length === 3, 'n=' + save.orders.length);
const payout = E.orderPayout({ mult: 'item' }, 500, save);
check('выплата item ×3', payout === 1500, 'p=' + payout);
// сеты
['camera', 'reel', 'radiola', 'player', 'typewriter'].forEach(id => save.owned[id] = { q: 1 });
check('сет tech активен при 5 предметах', G.setActive(save, 'tech'));
check('sellMultiplier учитывает фикстуры/витрину', (() => {
  save.fixtures = ['radiola']; save.vitrine = ['watch'];
  const m = G.sellMultiplier(save);
  return Math.abs(m - 1.05 * 1.08) < 1e-9;
})());
check('canUpgrade L2 требует монет/заказов/сетов', (() => {
  const s2 = { v:2, day:1, coins:10, owned:{}, fixtures:[], vitrine:[], orders:[], shopLevel:1, stats:{ordersDone:0} };
  const c = G.canUpgrade(s2);
  return c && !c.ok && c.reqs.length === 3;
})());
check('canUpgrade L2 проходит при выполнении', (() => {
  save.coins = 2000; save.stats.ordersDone = 2;
  const c = G.canUpgrade(save);
  return c && c.ok;
})());

// 7. аукционный день строится
const day = AS.buildDay({ ...save, day: 3 }, 'city', rnd);
check('buildDay: нужное число лотов', day.lots.length === window.HOUSES.city.lots);
check('лоты: у всех есть NPC с кэпами и улики', day.lots.every(l => l.clues && l.clues.length >= 4 && Array.isArray(l.npcs)));
check('лоты: trueValue = base×cond', day.lots.every(l => Math.abs(l.trueValue - l.base * l.cond) <= 1));
const ftue = AS.buildFTUEDay({ ...save, day: 1 });
check('FTUE: 4 лота, первый — телефон', ftue.lots.length === 4 && ftue.lots[0].item.id === 'phone');

// 8. упаковки/эпохи/алиасы/фото-улика
check('5 типов упаковок (лотов)', C.packs.length === 5);
check('эпохи описаны для всех категорий', Object.keys(window.CATS).every(c => C.eras[c] && C.eras[c].length > 5));
check('алиасы систем по спеке #12', !!(window.NPCBidderSystem && window.LotValuationSystem && window.PostAuctionResultSystem && window.CollectionGoalSystem));
const day2 = AS.buildDay({ ...save, day: 5 }, 'city', rnd);
check('лоты имеют упаковку и улику эпохи', day2.lots.every(l => l.pack && l.clues.some(c => c.kind === 'era')));
const day3 = AS.buildDay({ ...save, day: 5 }, 'estate', rnd);
check('усадебный аукцион: частичное фото', day3.lots.every(l => l.photo && l.clues.some(c => c.kind === 'photo')));

// 9. пре-плейтест правки
check('заказов ≥16 шаблонов', window.ORDER_TEMPLATES.length >= 16, 'n=' + window.ORDER_TEMPLATES.length);
const inst = OS.instantiate(window.ORDER_TEMPLATES[10], 1, 0);
check('инстанс заказа получает вкусовой хвост', inst.text.length > window.ORDER_TEMPLATES[10].text.length);
const ftueInst = OS.instantiate({ ...C.ftue.order, mult: 'cat' }, 1, 0);
check('FTUE-заказ без хвоста', ftueInst.text === C.ftue.order.text);
check('альт-гейт лавки: 4 заказа заменяют сеты', (() => {
  const s3 = { v:2, day:2, coins:2000, owned:{}, fixtures:[], vitrine:[], orders:[], shopLevel:1, stats:{ordersDone:4} };
  const c = G.canUpgrade(s3);
  return c && c.ok;
})());
check('быстрая реставрация доступна хламу (value≤30)', window.ITEMS.filter(i => i.rarity === 'junk').every(i => i.value[1] <= 30));

let pass = 0;
results.forEach(r => { if (r.p) pass++; console.log((r.p ? 'PASS' : 'FAIL') + ' | ' + r.n + (r.d ? ' | ' + r.d : '')); });
console.log(`\nTOTAL: ${pass}/${results.length}`);
process.exit(pass === results.length ? 0 : 1);
