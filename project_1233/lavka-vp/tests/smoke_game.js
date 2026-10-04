const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = process.cwd();
const vc = new VirtualConsole(); // глушим jsdom-шум (canvas/Image not implemented)
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'outside-only', url: 'http://localhost/', pretendToBeVisual: true, virtualConsole: vc });
const { window } = dom;

// --- стабы браузерных API ---
window.HTMLCanvasElement.prototype.getContext = function () {
  const gradient = { addColorStop() {} };
  return new Proxy({}, { get(t, k) {
    if (k === 'createRadialGradient') return () => gradient;
    if (k === 'getImageData') return (x, y, w, h) => { const d = new Uint8ClampedArray(w * h * 4); for (let i = 3; i < d.length; i += 4) d[i] = 255; return { data: d }; };
    if (k === 'canvas') return { width: 48, height: 48 };
    return typeof k === 'string' ? (() => {}) : undefined;
  }, set() { return true; } });
};
window.Element.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {} }; };

// --- загрузка модулей игры в порядке index.html ---
for (const f of ['js/data.js','js/telemetry.js','js/sdk.js','js/economy.js','js/sfx.js','js/game.js','js/main.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), dom.getInternalVMContext(), { filename: f });
}

const doc = window.document;
const $  = (sel) => doc.querySelector(sel);
const $$ = (sel) => [...doc.querySelectorAll(sel)];
const byText = (sel, txt) => $$(sel).find(n => (n.textContent || '').includes(txt));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; throw new Error('FAIL: ' + msg); } console.log('ok  :', msg); };

(async function run() {
  await sleep(150); // boot (Game.start async)

  // 1. INTRO
  assert($('.intro-card'), 'intro отрисован');
  const startBtn = byText('button', 'Открыть первый ящик');
  assert(startBtn, 'кнопка старта есть');
  startBtn.click(); await sleep(50);

  // 2. AUCTION (FTUE: один лот, бесплатный)
  assert(byText('.title', 'Склад лавки'), 'FTUE-аукцион (склад)');
  assert($('.free-tag'), 'первый лот бесплатный');
  assert($$('.lot').length === 1, 'в FTUE один лот');

  // 3. покупка → OPENING → скип → RESTORE → авто-реставрация (RV mock)
  $('.lot').click(); await sleep(50);
  assert($('.opening-stage'), 'анимация открытия началась');
  $('.opening-stage').click(); await sleep(50); // skip
  assert($('#restoreCanvas'), 'реставрация отрисована');
  byText('button', 'Идеально').click(); await sleep(400); // RV-stub → complete(q=1)

  // 4. APPRAISAL → DECISION
  assert(byText('.item-card', 'Плёночный фотоаппарат'), 'FTUE №1: редкий фотоаппарат');
  assert(byText('.calc', 'качество 120%'), 'авто-реставрация дала ×1.2');
  byText('button', 'Решить судьбу').click(); await sleep(30);
  const sellBtn = byText('button', 'Продать за');
  assert(sellBtn, 'кнопка продажи есть');
  sellBtn.click(); await sleep(30);
  assert(byText('.result-big', '+'), 'результат продажи показан');
  const coinsAfter1 = window.Game.getSave().coins;
  assert(coinsAfter1 > 450, `монеты выросли после продажи (450 → ${coinsAfter1})`);
  byText('button', 'На аукцион').click(); await sleep(30);

  // 5. FTUE №2: эпик — ОСТАВИТЬ в коллекцию
  assert($$('.lot').length === 1, 'FTUE лот №2 (один)');
  $('.lot').click(); await sleep(30);
  $('.opening-stage').click(); await sleep(30);
  byText('button', 'Готово').disabled = false; // эмуляция: игрок «оттёр» достаточно
  // используем штатную кнопку «Готово» (progress=0 → q=0.35 пол) — достаточно для smoke
  byText('button', 'Готово').click(); await sleep(50);
  assert(byText('.item-card', 'Ходики с кукушкой'), 'FTUE №2: эпические ходики');
  byText('button', 'Решить судьбу').click(); await sleep(30);
  const keepBtn = byText('button', 'Оставить');
  assert(keepBtn, 'кнопка «Оставить» есть (равноправна «Продать»)');
  keepBtn.click(); await sleep(30);
  assert(window.Game.getSave().owned['cuckoo'], 'ходики попали в альбом');
  byText('button', 'На аукцион').click(); await sleep(30);

  // 6. FTUE №3: хлам → продажа → переход к нормальному аукциону (3 лота)
  $('.lot').click(); await sleep(30);
  $('.opening-stage').click(); await sleep(30);
  byText('button', 'Идеально').click(); await sleep(400);
  assert(byText('.item-card', 'Жестянка с пуговицами'), 'FTUE №3: хлам (жестянка)');
  byText('button', 'Решить судьбу').click(); await sleep(30);
  byText('button', 'Продать за').click(); await sleep(30);
  byText('button', 'На аукцион').click(); await sleep(30);
  assert($$('.lot').length === 3, 'после FTUE — обычный аукцион на 3 лота');

  // 7. Альбом
  byText('button', 'Альбом').click(); await sleep(30);
  assert($$('.cell.owned').length === 1, 'в альбоме 1 предмет (ходики)');
  assert($$('.era-block').length === 3, 'альбом: 3 эпохи');
  byText('button', '← Назад').click(); await sleep(30);

  // 8. Телеметрия и сейв
  const c = window.Telemetry.counters();
  assert(c.boxes === 3 && c.sold === 2 && c.kept === 1 && c.rv_calls === 2, `телеметрия: boxes=${c.boxes} sold=${c.sold} kept=${c.kept} rv=${c.rv_calls}`);
  const raw = window.localStorage.getItem(window.CONFIG.meta.saveKey);
  assert(raw && JSON.parse(raw).stats.boxes === 3, 'сейв сохранён в localStorage (boxes=3)');
  assert(JSON.parse(raw).pity === 3, 'pity-счётчик считается (3, не применяется)');

  console.log('\nSMOKE TEST PASSED'); window.close(); process.exit(0);
})().catch(e => { console.error('SMOKE TEST FAILED:', e.message); process.exit(1); });
