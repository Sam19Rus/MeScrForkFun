/* smoke_game.js — headless-прогон полного цикла «Лавки 2.0» (jsdom).
   Запуск: npm i jsdom && node tests/smoke_game.js
   Сценарий: intro → утро → FTUE-аукцион (4 лота) → оценка лота → торги (победа)
   → вскрытие → авто-реставрация → оценка находки → отдача заказа Иванычу →
   пас на остальных лотах (обучающие экраны проигрыша) → итоги дня → день 2 → выбор дома → осмотр. */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const vc = new VirtualConsole();
vc.on('jsdomError', e => console.error('JSDOM-ERROR:', (e.detail||e.message||e).toString().split('\n').slice(0,4).join(' | ')));
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'outside-only', url: 'http://localhost/?speed=fast', pretendToBeVisual: true, virtualConsole: vc });
const { window } = dom;

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

for (const f of ['js/data.js','js/telemetry.js','js/sdk.js','js/economy.js','js/systems.js','js/sfx.js','js/restore.js','js/game.js','js/main.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), dom.getInternalVMContext(), { filename: f });
}

const doc = window.document;
const $$ = (sel) => [...doc.querySelectorAll(sel)];
const byText = (sel, txt) => $$(sel).find(n => (n.textContent || '').includes(txt));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let failures = 0;
const assert = (c, m) => { if (!c) { failures++; console.error('FAIL:', m); } else console.log('ok  :', m); };
async function waitUntil(fn, label, timeout = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { if (fn()) return true; await sleep(40); }
  assert(false, 'timeout: ' + label); return false;
}

(async function run() {
  await sleep(300);

  // ---- INTRO ----
  assert(!!byText('button', 'Открыть лавку'), 'intro показан');
  byText('button', 'Открыть лавку').click();
  await waitUntil(() => byText('button', 'На аукцион'), 'утро лавки');
  assert(!!byText('.order-card', 'Иваныч'), 'FTUE-заказ Иваныча на доске');
  assert($$('.order-card').length >= 1, 'доска заказов видна');

  const coins0 = window.Game.getSave().coins;
  byText('button', 'На аукцион').click();
  await waitUntil(() => byText('button', 'Начать торги'), 'осмотр FTUE-лотов');
  assert($$('.lot-row').length === 4, 'FTUE: 4 лота');
  assert(!!byText('.lot-row', 'Иваныч'), 'бейдж заказа на лоте виден');

  // ---- оценка лота 1 ----
  $$('.lot-row')[0].click();
  await waitUntil(() => byText('button', '0–200'), 'модалка улик');
  assert(!!doc.querySelector('.est-range'), 'диапазон оценки по уликам показан');
  byText('button', '0–200').click(); // телефон дешёвый — верная полоса
  await waitUntil(() => !!doc.querySelector('.est-mark'), 'оценка сохранена');

  // ---- торги: агрессивно до победы ----
  byText('button', 'Начать торги').click();
  await waitUntil(() => byText('button', 'Поднять'), 'торги лота 1 начались');
  assert(!!doc.querySelector('.npc'), 'NPC-соперники видны');
  let raised = 0, won = false;
  const tbeg = Date.now();
  while (Date.now() - tbeg < 20000) {
    if (doc.querySelector('.opening-stage')) { won = true; break; }
    if (byText('button', 'Следующий лот')) break;
    const rb = byText('button', 'Поднять');
    if (rb && raised < 20) { rb.click(); raised++; }
    await sleep(120);
  }
  assert(won, 'лот 1 выигран → вскрытие');

  // ---- вскрытие → реставрация (авто) ----
  doc.querySelector('.opening-stage').click();
  await waitUntil(() => byText('button', 'Идеально'), 'реставрация смонтирована');
  byText('button', 'Идеально').click();
  await waitUntil(() => byText('button', 'Что делать с находкой'), 'оценка находки');
  assert(!!byText('.item-card', 'Дисковый телефон'), 'находка — телефон (FTUE-скрипт)');
  assert(!!byText('.calc', 'состояние'), 'формула ценности видна (база×состояние×реставрация)');

  // ---- решение: отдать Иванычу ----
  byText('button', 'Что делать с находкой').click();
  await waitUntil(() => byText('button', 'Отдать Иванычу'), 'решение с заказом');
  const btnOrder = byText('button', 'Отдать Иванычу');
  btnOrder.click();
  await waitUntil(() => byText('button', 'К торгам'), 'сделка совершена');
  assert(!!byText('.result-big', 'Заказ выполнен'), 'экран сделки: заказ выполнен');
  const s1 = window.Game.getSave();
  assert(s1.stats.ordersDone === 1, 'ordersDone=1');
  assert(s1.coins > coins0, `монеты выросли (${coins0} → ${s1.coins})`);
  assert(s1.ftue.done === true, 'FTUE завершён после первого заказа');

  // ---- лоты 2–4: пас (обучающие экраны) ----
  byText('button', 'К торгам').click();
  for (let i = 0; i < 3; i++) {
    const passed = await waitUntil(() => byText('button', 'Пас'), `торги лота ${i + 2}: кнопка пас`, 8000);
    if (!passed) break;
    byText('button', 'Пас').click();
    const next = await waitUntil(() => byText('button', 'Следующий лот') || byText('button', 'Спать'), `лот ${i + 2}: экран итога`, 8000);
    if (!next) break;
    if (i === 0) assert(!!byText('.story', '₽'), 'экран проигрыша показывает цену и стоимость (обучение)');
    (byText('button', 'Следующий лот') || byText('button', 'Спать')).click();
    await sleep(150);
  }

  // ---- итоги дня → день 2 ----
  await waitUntil(() => byText('button', 'Спать'), 'итоги дня');
  assert(!!byText('.result-big', '₽'), 'итоги дня с прибылью');
  byText('button', 'Спать').click();
  await waitUntil(() => byText('.day-chip', 'День 2'), 'день 2 наступил');
  const s2 = window.Game.getSave();
  assert(s2.day === 2, 'save.day=2');
  assert(s2.stats.wins >= 1 && s2.stats.losses >= 1, 'статистика побед/поражений ведётся');

  // ---- день 2: выбор дома → обычный аукцион ----
  byText('button', 'На аукцион').click();
  await waitUntil(() => byText('button', 'Поехать'), 'выбор аукциона');
  byText('button', 'Поехать').click();
  await waitUntil(() => byText('button', 'Начать торги'), 'осмотр обычного аукциона');
  assert($$('.lot-row').length === 6, 'городской склад: 6 лотов');

  // ---- телеметрия ----
  const buf = window.Telemetry.buffer().map(e => e.event);
  ['auction_started', 'auction_won', 'auction_lost', 'bid_raised', 'bid_stopped', 'estimate_submitted',
   'goal_completed', 'item_restored', 'item_revealed', 'decision', 'day_end', 'npc_pass', 'clue_opened'].forEach(ev =>
    assert(buf.includes(ev), `телеметрия содержит ${ev}`));
  const wonEv = window.Telemetry.buffer().find(e => e.event === 'auction_won');
  assert(wonEv && wonEv.params.motivated === true, 'победа помечена мотивированной (заказ)');
  const raw = window.localStorage.getItem(window.CONFIG.meta.saveKey);
  assert(raw && JSON.parse(raw).day === 2, 'сейв сохранён (день 2)');

  console.log(failures ? `\nSMOKE: ${failures} FAILURES` : '\nSMOKE TEST PASSED');
  window.close(); process.exit(failures ? 1 : 0);
})().catch(e => { console.error('SMOKE CRASH:', e); window.close(); process.exit(1); });
