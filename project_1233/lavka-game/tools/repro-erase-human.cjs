/* repro-erase-human.cjs — «человеческий» сценарий: игрок видит грязный предмет и
   трет круговыми движениями там, где предмет (несколько кругов в центре + по краям предмета),
   фон вокруг предмета не трогает. Проверяем, активируется ли «Готово». */
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:4173/index.html?dev=1&speed=fast', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(800);
  await page.evaluate(() => window.game.introDone());
  await sleep(400);
  await page.evaluate(() => window.game.goToCity());
  await sleep(300);
  await page.evaluate(() => document.querySelector('.building[data-id="city_warehouse"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(600);
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
  if ((await page.evaluate(() => window.game.getSnapshot().phase)) === 'unbox') {
    await page.evaluate(() => window.game.unboxContinue()); await sleep(400);
  }
  const started = await page.evaluate(() => {
    const s = window.game.getSnapshot();
    const op = (s.workbenchOps || []).find(o => o.minigame === 'erase' && o.affordable && !o.lockedBy);
    return op ? (window.game.startOp(op), op.op) : null;
  });
  await sleep(700);
  const box = await page.evaluate(() => {
    const r = document.getElementById('restoreCanvas').getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

  // «человеческие» круговые движения: 6 кругов разного радиуса в зоне предмета (340/480)
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const itemR = box.w * (340 / 480) / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (const [rr, turns] of [[0.18, 3], [0.4, 3], [0.62, 2.5], [0.8, 2.5], [0.95, 2], [0.5, 2]]) {
    const rad = itemR * rr;
    for (let a = 0; a <= turns * Math.PI * 2; a += 0.12) {
      await page.mouse.move(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.9);
    }
  }
  await page.mouse.up();
  await sleep(900);

  const state = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.mg-panel button')].find(b => b.textContent.includes('Готово'));
    const hints = [...document.querySelectorAll('.mg-hint')].map(h => h.textContent).join(' | ');
    const bar = document.querySelector('.mg-panel .qbar > div');
    return { doneEnabled: btn ? !btn.disabled : null, hints, barW: bar ? bar.style.width : null };
  });
  console.log('=== «ЧЕЛОВЕЧЕСКАЯ» ОЧИСТКА (круговые движения по предмету) ===');
  console.log('op:', started);
  console.log('«Готово» активна:', state.doneEnabled);
  console.log('hints:', state.hints);
  await page.screenshot({ path: 'screenshots/repro-erase-human.png' });
  await browser.close();
  process.exit(state.doneEnabled ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
