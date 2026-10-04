/* repro-erase.cjs — воспроизведение бага «не смог отчистить предмет»:
   игрок трет ТОЛЬКО предмет (центральный квадрат ~71% canvas), а не весь фон.
   Проверяем: становится ли «Готово» активной и какой erased достигается. */
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto('http://localhost:4173/index.html?dev=1&speed=fast', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(800);

  // intro → лавка → город → склад
  await page.evaluate(() => window.game.introDone());
  await sleep(400);
  await page.evaluate(() => window.game.goToCity());
  await sleep(300);
  await page.evaluate(() => document.querySelector('.building[data-id="city_warehouse"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(600);

  // оценка первого лота + торги: перебиваем до победы (FTUE-лот дешёвый)
  await page.evaluate(() => window.game.openLotModal(0));
  await sleep(200);
  await page.evaluate(() => window.game.submitEstimate(0));
  await page.evaluate(() => window.game.startBidding());
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => {
      const s = window.game.getSnapshot();
      return { phase: s.phase, turn: s.auction ? s.auction.playerTurn : false, next: s.auction ? s.auction.nextPrice : 0 };
    });
    if (st.phase !== 'bidding') break;
    if (st.turn && st.next <= 500) await page.evaluate(() => window.game.playerBid());
    else if (st.turn) break;
    await sleep(200);
  }
  await sleep(1500);
  let phase = await page.evaluate(() => window.game.getSnapshot().phase);
  console.log('phase after bidding:', phase);
  if (phase === 'unbox') { await page.evaluate(() => window.game.unboxContinue()); await sleep(400); }
  phase = await page.evaluate(() => window.game.getSnapshot().phase);
  console.log('phase now:', phase);
  if (phase !== 'workbench') { console.log('NO WORKBENCH — repro failed'); await browser.close(); process.exit(3); }

  const defects = await page.evaluate(() => window.game.getSnapshot().lot.defects.map(d => d.id));
  console.log('defects:', defects.join(','));

  // стартуем операцию clean (или любую erase-операцию, которая доступна)
  const started = await page.evaluate(() => {
    const s = window.game.getSnapshot();
    const op = (s.workbenchOps || []).find(o => o.minigame === 'erase' && o.affordable && !o.lockedBy);
    return op ? (window.game.startOp(op), op.op) : null;
  });
  console.log('erase-op started:', started);
  if (!started) { await browser.close(); process.exit(4); }
  await sleep(700);

  const box = await page.evaluate(() => {
    const r = document.getElementById('restoreCanvas').getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  // ТРЁМ ТОЛЬКО ПРЕДМЕТ: центральный квадрат 340/480 ≈ 70.8% стороны
  const frac = 340 / 480;
  const ix = box.x + box.w * (1 - frac) / 2, iy = box.y + box.h * (1 - frac) / 2;
  const iw = box.w * frac, ih = box.h * frac;
  await page.mouse.move(ix + iw / 2, iy + ih / 2);
  await page.mouse.down();
  for (let pass = 0; pass < 2; pass++) {
    for (let row = 0; row < 16; row++) {
      const y = iy + (ih / 16) * row + ih / 32;
      if (row % 2 === 0) for (let x = ix + 4; x < ix + iw; x += 10) await page.mouse.move(x, y);
      else for (let x = ix + iw - 4; x > ix; x -= 10) await page.mouse.move(x, y);
    }
  }
  await page.mouse.up();
  await sleep(800);

  const state = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.mg-panel button')].find(b => b.textContent.includes('Готово'));
    const qtxt = [...document.querySelectorAll('.mg-hint')].map(h => h.textContent).join(' | ');
    return { doneEnabled: btn ? !btn.disabled : null, hints: qtxt };
  });
  console.log('=== РЕЗУЛЬТАТ ПОСЛЕ ИНТЕНСИВНОЙ ОЧИСТКИ ПРЕДМЕТА ===');
  console.log('«Готово» активна:', state.doneEnabled);
  console.log('hint:', state.hints);
  await page.screenshot({ path: 'screenshots/repro-erase-item-only.png' });
  console.log('errors:', errors.length);
  await browser.close();
  process.exit(state.doneEnabled ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
