/* selftest.js — бот играет 3 игровых дня (headless, jsdom) и считает метрики прототипа.
   Политика бота: осматривает лоты с бейджами мотивации (заказ/сет/фикстура) и первый попавшийся;
   ставка — до 80% от середины диапазона оценки; остальные лоты — пас.
   Решения: заказ > фикстура > сет-предмет в коллекцию > продажа.
   Запуск: NODE_PATH=<node_modules> node tests/selftest.js */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const vc = new VirtualConsole();
const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'outside-only', url: 'http://localhost/?speed=fast&dev=0', pretendToBeVisual: true, virtualConsole: vc });
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
const $$ = s => [...doc.querySelectorAll(s)];
const byText = (sel, t) => $$(sel).find(n => (n.textContent || '').includes(t));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T0 = Date.now();

async function wait(fn, label, timeout = 15000) {
  const t = Date.now();
  while (Date.now() - t < timeout) { const r = fn(); if (r) return r; await sleep(35); }
  throw new Error('timeout waiting: ' + label);
}
const itemByName = (n) => window.ITEMS.find(i => n.includes(i.name));

const botCaps = {}; // lotIndex -> max bid (null = не мотивирован)

async function inspectPhase() {
  await wait(() => byText('button', 'Начать торги'), 'inspect');
  const rows = $$('.lot-row');
  for (let i = 0; i < rows.length; i++) {
    const motivated = !!rows[i].querySelector('.badge-order, .badge-set, .badge-fix');
    if (!motivated && i !== 0) { botCaps[i] = null; continue; } // осматриваем мотивированные + первый
    rows[i].click();
    await wait(() => doc.querySelector('.est-range'), 'modal ' + i);
    const txt = doc.querySelector('.est-range').textContent;
    const m = txt.match(/(\d+)–(\d+)/);
    const mid = m ? (+m[1] + +m[2]) / 2 : 300;
    // выбираем полосу, содержащую середину диапазона
    const bands = window.CONFIG.estimateBands;
    let bi = bands.findIndex(b => mid >= b[0] && mid < b[1]); if (bi < 0) bi = bands.length - 1;
    const bb = byText('button', `${bands[bi][0]}${bands[bi][1] >= 999999 ? '+' : '–' + bands[bi][1]}`);
    if (bb) bb.click(); else $$('.btn.band')[bi].click();
    await sleep(60);
    botCaps[i] = motivated ? Math.round(mid * 0.8) : Math.round(mid * 0.45); // немаксимальный интерес — дешёвый арбитраж
  }
  byText('button', 'Начать торги').click();
}

async function biddingPhase() {
  // каждый лот: бот смотрит номер лота и свой кэп
  for (;;) {
    const opened = await Promise.race([
      wait(() => doc.querySelector('.opening-stage'), 'opening', 8000).then(() => 'opening'),
      wait(() => doc.querySelector('#bidLog'), 'bidding', 8000).then(() => 'bidding'),
      wait(() => byText('button', 'Следующий лот'), 'loss', 8000).then(() => 'loss'),
      wait(() => byText('button', 'Спать'), 'dayend', 8000).then(() => 'dayend')
    ]).catch(() => 'none');
    if (opened === 'dayend' || opened === 'none') return;
    if (opened === 'loss') { byText('button', 'Следующий лот').click(); await sleep(80); continue; }
    if (opened === 'opening') { await wonPipeline(); continue; }
    // bidding screen
    const title = doc.querySelector('.bid-lot') ? doc.querySelector('.bid-lot').textContent : '';
    const mm = title.match(/Лот (\d+)\//);
    const li = mm ? +mm[1] - 1 : 0;
    const cap = botCaps[li] != null ? botCaps[li] : 0;
    for (;;) {
      const rb = byText('button', 'Поднять до');
      const pb = byText('button', 'Пас');
      if (!rb) {
        if (pb) { pb.click(); await sleep(120); }
        // ждём разрешения (opening/loss/dayend/след.лот)
        const nx = await Promise.race([
          wait(() => doc.querySelector('.opening-stage'), 'o2', 6000).then(() => 'opening'),
          wait(() => byText('button', 'Следующий лот'), 'l2', 6000).then(() => 'loss'),
          wait(() => byText('button', 'Спать'), 'd2', 6000).then(() => 'dayend'),
          wait(() => doc.querySelector('#bidLog') && !pb.isConnected, 'nextbid', 6000).then(() => 'nextlot')
        ]).catch(() => 'stuck');
        if (nx === 'opening') { await wonPipeline(); }
        else if (nx === 'loss') { byText('button', 'Следующий лот').click(); await sleep(80); }
        else if (nx === 'dayend') { return; }
        break;
      } else {
        const amount = +rb.textContent.match(/(\d+)/)[1];
        if (amount <= cap) { rb.click(); await sleep(120); }
        else if (pb) { pb.click(); await sleep(120); }
      }
    }
  }
}

async function wonPipeline() {
  doc.querySelector('.opening-stage').click();
  await wait(() => byText('button', 'Идеально'), 'restore', 8000);
  byText('button', 'Идеально').click(); // авто-реставрация (RV-заглушка)
  await wait(() => byText('button', 'Что делать с находкой'), 'appraisal', 8000);
  byText('button', 'Что делать с находкой').click();
  await wait(() => byText('.decision-grid', '') || doc.querySelector('.decision-grid'), 'decision', 8000);
  const name = doc.querySelector('.item-card .iname') ? doc.querySelector('.item-card .iname').textContent : '';
  const it = itemByName(name) || {};
  const save = window.Game.getSave();
  const orderBtn = byText('button', 'Отдать');
  const fixBtn = byText('button', 'Установить');
  const keepBtn = byText('button', 'В коллекцию');
  const sellBtn = byText('button', 'Продать за');
  if (orderBtn) orderBtn.click();
  else if (fixBtn && save.shopLevel >= 1) fixBtn.click();
  else if (keepBtn && it.set && !save.owned[it.id]) keepBtn.click();
  else if (sellBtn) sellBtn.click();
  else if (byText('button', 'Продать дубликат')) byText('button', 'Продать дубликат').click();
  await wait(() => byText('button', 'К торгам') || byText('button', 'Следующий лот') || byText('button', 'Спать'), 'after-decision', 8000);
  const nx = byText('button', 'К торгам') || byText('button', 'Следующий лот') || byText('button', 'Спать');
  nx.click(); await sleep(120);
}

(async function run() {
  await sleep(300);
  byText('button', 'Открыть лавку').click();
  for (let d = 1; d <= 3; d++) {
    await wait(() => byText('button', 'На аукцион'), 'morning d' + d);
    byText('button', 'На аукцион').click();
    if (d > 1) { await wait(() => byText('button', 'Поехать'), 'house d' + d); byText('button', 'Поехать').click(); }
    await inspectPhase();
    await biddingPhase();
    await wait(() => byText('button', 'Спать'), 'dayresult d' + d);
    byText('button', 'Спать').click();
    await sleep(150);
  }
  // отчёт
  const buf = window.Telemetry.buffer();
  const cnt = ev => buf.filter(e => e.event === ev).length;
  const won = buf.filter(e => e.event === 'auction_won');
  const lost = buf.filter(e => e.event === 'auction_lost');
  const dec = buf.filter(e => e.event === 'decision');
  const est = buf.filter(e => e.event === 'estimate_resolved');
  const ims = { order: 0, set: 0, improvement: 0, resale: 0, collection: 0, other: 0 };
  dec.forEach(e => { if (e.params.motivation) ims[e.params.motivation]++; });
  const imsTotal = dec.length;
  const imsScore = imsTotal ? Math.round(100 * (ims.order + ims.set + ims.improvement + ims.resale) / imsTotal) : 0;
  const margins = won.map(e => e.params.margin);
  const s = window.Game.getSave();
  const report = {
    days: s.day - 1, coins: s.coins, shopLevel: s.shopLevel, ordersDone: s.stats.ordersDone,
    album: Object.keys(s.owned).length, wins: won.length, losses: lost.length,
    winRate: Math.round(100 * won.length / Math.max(1, won.length + lost.length)) + '%',
    avgMargin: margins.length ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : null,
    positiveMarginShare: margins.length ? Math.round(100 * margins.filter(m => m > 0).length / margins.length) + '%' : '—',
    estAccuracy: est.length ? Math.round(100 * est.filter(e => e.params.ok).length / est.length) + '%' : '—',
    bidsTotal: cnt('bid_raised'), bidsPerAuction: +(cnt('bid_raised') / Math.max(1, cnt('auction_started'))).toFixed(1),
    eventsTotal: buf.length,
    IMS: { score: imsScore + '%', ...ims },
    goalsCompleted: buf.filter(e => e.event === 'goal_completed').map(e => e.params.type),
    telemetryNames: [...new Set(buf.map(e => e.event))].sort()
  };
  console.log(JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(ROOT, 'tests/selftest_report.json'), JSON.stringify(report, null, 1));
  window.close(); process.exit(0);
})().catch(e => { console.error('SELFTEST CRASH:', e.message); window.close(); process.exit(1); });
