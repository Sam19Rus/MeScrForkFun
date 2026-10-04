/* probe-ui.cjs — дамп геометрии ключевых элементов по фазам: ищем невидимое/перекрытое/вылезшее */
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const RECTS = sel => {
  const out = [];
  document.querySelectorAll(sel).forEach(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push({
      sel, cls: el.className && el.className.toString ? el.className.toString().slice(0, 40) : '',
      txt: (el.textContent || '').trim().slice(0, 32),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      vis: cs.visibility, disp: cs.display, op: cs.opacity,
      off: r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth
    });
  });
  return out;
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:4173/index.html?dev=1&speed=fast', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(700);
  await page.evaluate(() => window.game.introDone());
  await sleep(300);

  // доводим до верстака
  await page.evaluate(() => window.game.goToCity());
  await sleep(200);
  await page.evaluate(() => document.querySelector('.building[data-id="city_warehouse"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(500);
  await page.evaluate(() => window.game.openLotModal(0));
  await sleep(150);
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
    await sleep(150);
  }
  await sleep(1200);
  if ((await page.evaluate(() => window.game.getSnapshot().phase)) === 'unbox') { await page.evaluate(() => window.game.unboxContinue()); await sleep(300); }

  console.log('=== WORKBENCH (1280x800, dev panel ON) ===');
  for (const sel of ['.wb-scene', '.wb-layout', '.wb-left', '.wb-right', '.defect-card', '.op-card', '.wb-bottom', '.wb-bottom button', '.qmeter', '.ba-toggle', '.wb-item', '.dev-panel, [class*=dev]']) {
    const rs = await page.evaluate(RECTS, sel);
    rs.forEach(r => console.log(JSON.stringify(r)));
  }
  const extra = await page.evaluate(() => {
    const wb = document.querySelector('.wb-layout');
    const scene = document.querySelector('.wb-scene');
    const right = document.querySelector('.wb-right');
    const bottom = document.querySelector('.wb-bottom');
    return {
      sceneRect: scene ? scene.getBoundingClientRect().toJSON() : null,
      sceneScroll: scene ? { sh: scene.scrollHeight, ch: scene.clientHeight } : null,
      wbRect: wb ? wb.getBoundingClientRect().toJSON() : null,
      rightScroll: right ? { sh: right.scrollHeight, ch: right.clientHeight, st: right.scrollTop } : null,
      bottomRect: bottom ? bottom.getBoundingClientRect().toJSON() : null,
      innerH: innerHeight
    };
  });
  console.log('EXTRA', JSON.stringify(extra, null, 1));

  // мобильный верстак
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await sleep(600);
  console.log('=== WORKBENCH mobile 390x844 ===');
  for (const sel of ['.wb-layout', '.wb-left', '.wb-right', '.defect-card', '.op-card', '.wb-bottom', '.wb-item']) {
    const rs = await page.evaluate(RECTS, sel);
    rs.forEach(r => console.log(JSON.stringify(r)));
  }
  const mob = await page.evaluate(() => {
    const scene = document.querySelector('.wb-scene');
    const layout = document.querySelector('.wb-layout');
    return {
      scene: scene ? { sh: scene.scrollHeight, ch: scene.clientHeight, oy: getComputedStyle(scene).overflowY } : null,
      layout: layout ? { sh: layout.scrollHeight, ch: layout.clientHeight, oy: getComputedStyle(layout).overflowY } : null,
      innerH: innerHeight
    };
  });
  console.log('MOB EXTRA', JSON.stringify(mob));
  await page.screenshot({ path: 'screenshots/probe-wb-mobile.png' });
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
