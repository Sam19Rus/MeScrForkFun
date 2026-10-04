/* browser-smoke.js — визуальный прогон vertical slice в реальном Chromium (puppeteer):
   сценарий от интро до итогов дня со скриншотами каждой сцены + сбор ошибок консоли.
   Запуск (нужен puppeteer и собранный dist):
     npm run build && (npx vite preview --port 4173 &) && \
     NODE_PATH=/tmp/pptr/node_modules node tools/browser-smoke.cjs
   Скриншоты → screenshots/, ошибки → screenshots/errors.txt */
const puppeteer = require('puppeteer');
const _sh = require('fs').readdirSync('/tmp/.cache/puppeteer/chrome-headless-shell')[0];
const SHELL_EXE = `/tmp/.cache/puppeteer/chrome-headless-shell/${_sh}/chrome-headless-shell-linux64/chrome-headless-shell`;
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];

async function shot(page, name) {
  await sleep(350);
  await page.screenshot({ path: path.join(OUT, name + '.png') });
  console.log('shot:', name);
}

async function clickText(page, text, selector = 'button') {
  const ok = await page.evaluate((t, sel) => {
    const nodes = [...document.querySelectorAll(sel)];
    const n = nodes.find(x => x.textContent.includes(t));
    if (n) { n.click(); return true; }
    return false;
  }, text, selector);
  if (!ok) throw new Error('not clickable: ' + text);
  await sleep(250);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell',
    executablePath: SHELL_EXE,
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto('http://localhost:4173/index.html?dev=1&speed=fast', { waitUntil: 'networkidle0' });
  await sleep(700);

  // 1. intro
  await shot(page, '01-intro');
  await clickText(page, 'Открыть лавку');

  // 2. лавка (утро дня 1: заказ Иваныча на доске)
  await shot(page, '02-shop-morning');

  // 3. город
  await clickText(page, 'В город');
  await shot(page, '03-city');

  // 4. зал склада: клик по первому лоту → модалка улик
  await page.evaluate(() => document.querySelector('.building[data-id="city_warehouse"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(700);
  await shot(page, '04-hall-inspect');
  await page.evaluate(() => document.querySelector('.lot-tag')?.click());
  await sleep(400);
  await shot(page, '05-lot-modal');
  await clickText(page, '0–200');

  // 5. торги
  await clickText(page, 'Начать торги');
  await sleep(900);
  await shot(page, '06-bidding-start');
  for (let i = 0; i < 12; i++) {
    const st = await page.evaluate(() => {
      const g = window.game; const s = g.getSnapshot();
      return { phase: s.phase, turn: s.auction ? s.auction.playerTurn : false, leader: s.auction ? s.auction.isLeader : false, next: s.auction ? s.auction.nextPrice : 0 };
    });
    if (st.phase !== 'bidding') break;
    if (st.turn && !st.leader && st.next <= 80) { await page.evaluate(() => window.game.playerBid()); }
    else if (st.turn) { await page.evaluate(() => window.game.playerPass()); break; }
    await sleep(300);
    if (i === 4) await shot(page, '07-bidding-mid');
  }
  await sleep(1400);

  // 6. вскрытие
  const ph1 = await page.evaluate(() => window.game.getSnapshot().phase);
  console.log('phase after bidding:', ph1);
  if (ph1 === 'unbox') {
    await shot(page, '08-unbox');
    await sleep(1200);
    await shot(page, '09-unbox-reveal');
    await page.evaluate(() => { const el = document.querySelector('.unbox-stage'); if (el) el.click(); });
    await sleep(500);
  }

  // 7. верстак
  const ph2 = await page.evaluate(() => window.game.getSnapshot().phase);
  console.log('phase after unbox:', ph2);
  if (ph2 === 'workbench') {
    await shot(page, '10-workbench');
    const started = await page.evaluate(() => {
      const s = window.game.getSnapshot();
      const op = (s.workbenchOps || []).find(o => o.affordable && !o.lockedBy);
      return op ? window.game.startOp(op) : false;
    });
    console.log('op started:', started);
    await sleep(600);
    await shot(page, '11-minigame-erase');
    // играем в очистку мышью (реальный canvas)
    const box = await page.evaluate(() => {
      const c = document.getElementById('restoreCanvas');
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    if (box) {
      await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2);
      await page.mouse.down();
      // плотный зигзаг по всей площади canvas
      for (let row = 0; row < 14; row++) {
        const y = box.y + (box.h / 14) * row + box.h / 28;
        if (row % 2 === 0) {
          for (let x = box.x + 8; x < box.x + box.w - 8; x += 14) await page.mouse.move(x, y);
        } else {
          for (let x = box.x + box.w - 8; x > box.x + 8; x -= 14) await page.mouse.move(x, y);
        }
      }
      await page.mouse.up();
      await sleep(500);
      await shot(page, '12-minigame-cleaned');
      const canFinish = await page.evaluate(() => {
        const b = [...document.querySelectorAll('.mg-panel button')].find(x => x.textContent.includes('Готово'));
        if (b && !b.disabled) { b.click(); return true; }
        return false;
      });
      console.log('erase finished:', canFinish);
      if (!canFinish) await page.evaluate(() => { window.game.cancelOp(); });
      await sleep(500);
    }
    await shot(page, '13-workbench-after');
    await clickText(page, 'Оценить');
    await sleep(600);
  }

  // 8. оценка + решение + сделка
  const ph3 = await page.evaluate(() => window.game.getSnapshot().phase);
  console.log('phase after workbench:', ph3);
  if (ph3 === 'appraisal') {
    await shot(page, '14-appraisal');
    await clickText(page, 'Что делать с находкой');
    await sleep(400);
    await shot(page, '15-decision');
    const hasOrder = await page.evaluate(() => !!document.querySelector('.decision-grid .btn.gold'));
    if (hasOrder) await page.evaluate(() => document.querySelector('.decision-grid .btn.gold').click());
    else await clickText(page, 'Продать за');
    await sleep(600);
    await shot(page, '16-deal');
  }

  // 9. остальные лоты: пасуем до обучающего экрана проигрыша
  for (let i = 0; i < 30; i++) {
    const st = await page.evaluate(() => {
      const s = window.game.getSnapshot();
      return { phase: s.phase, turn: s.auction ? s.auction.playerTurn : false };
    });
    if (st.phase === 'loss') { await shot(page, '17-loss-learning'); break; }
    if (st.phase === 'dayResult') break;
    if (st.phase === 'deal') { await page.evaluate(() => window.game.dealContinue()); }
    else if (st.phase === 'bidding' && st.turn) { await page.evaluate(() => window.game.playerPass()); }
    await sleep(350);
  }
  // добиваем день до итогов
  for (let i = 0; i < 60; i++) {
    const ph = await page.evaluate(() => window.game.getSnapshot().phase);
    if (ph === 'dayResult') break;
    if (ph === 'loss') await page.evaluate(() => window.game.lossContinue());
    else if (ph === 'bidding') { const t = await page.evaluate(() => window.game.getSnapshot().auction?.playerTurn); if (t) await page.evaluate(() => window.game.playerPass()); }
    else if (ph === 'deal') await page.evaluate(() => window.game.dealContinue());
    await sleep(300);
  }
  const ph4 = await page.evaluate(() => window.game.getSnapshot().phase);
  console.log('phase at day end:', ph4);
  if (ph4 === 'dayResult') await shot(page, '18-day-result');

  // 10. день 2: лавка, город, магазин запчастей, альбом
  if (ph4 === 'dayResult') {
    await clickText(page, 'новый день');
    await sleep(600);
    await shot(page, '19-shop-day2');
    await clickText(page, 'В город');
    await sleep(500);
    await page.evaluate(() => document.querySelector('.building[data-id="parts"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await sleep(800);
    await shot(page, '20-parts-shop');
    await clickText(page, 'Назад');
    await sleep(400);
    await page.evaluate(() => document.querySelector('.building[data-id="shop"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await sleep(800);
    await clickText(page, 'Альбом');
    await sleep(500);
    await shot(page, '21-album');
  }

  // 11. мобильная раскладка (390×844): setViewport с isMobile перезагружает страницу,
  // поэтому ждём бут из сохранения и идём заново: лавка → город → склад → торги
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(1800);
  await page.goto('http://localhost:4173/index.html?dev=1&speed=fast', { waitUntil: 'networkidle0' });
  await sleep(1200);
  const mPhase = await page.evaluate(() => window.game.getSnapshot().phase);
  console.log('mobile boot phase:', mPhase);
  if (mPhase === 'shop') { await shot(page, '22-mobile-shop'); await clickText(page, 'В город'); }
  else if (mPhase === 'city') { /* уже в городе */ }
  else { await page.evaluate(() => { const g = window.game; if (g.getSnapshot().phase === 'intro') g.introDone(); g.goToCity(); }); }
  await sleep(600);
  await shot(page, '23-mobile-city');
  await page.evaluate(() => document.querySelector('.building[data-id="city_warehouse"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(800);
  await shot(page, '24-mobile-hall');
  await clickText(page, 'Начать торги');
  await sleep(1400);
  await shot(page, '25-mobile-bidding');
  // верстак на мобильном (через dev: форсим лот и вскрытие)
  await page.evaluate(() => {
    const g = window.game;
    const s = g.getSnapshot();
    if (s.phase === 'bidding' && s.lot) {
      // мгновенно завершаем торги проигрышем и переходим к следующему этапу через dev-путь:
      g.playerPass();
    }
  });
  await sleep(800);

  console.log('ERRORS(' + errors.length + '):');
  errors.slice(0, 30).forEach(e => console.log(' -', e));
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'errors.txt'), errors.join('\n'));
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('FATAL', e); fs.writeFileSync(path.join(OUT, 'errors.txt'), String(e)); process.exit(2); });
