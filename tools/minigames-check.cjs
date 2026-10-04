/* minigames-check.cjs — прогон мозаики/ремонта/калибровки в браузере:
   рендер, играбельность, завершение операции, скриншоты, ошибки консоли. */
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('http://localhost:4173/index.html?dev=1&speed=fast', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(700);
  await page.evaluate(() => window.game.introDone());
  await sleep(300);
  await page.evaluate(() => window.game.goToCity());
  await sleep(200);
  await page.evaluate(() => document.querySelector('.building[data-id="city_warehouse"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await sleep(500);
  await page.evaluate(() => window.game.openLotModal(0));
  await page.evaluate(() => window.game.submitEstimate(0));
  await page.evaluate(() => window.game.startBidding());
  for (let i = 0; i < 40; i++) {
    const st = await page.evaluate(() => { const s = window.game.getSnapshot(); return { phase: s.phase, turn: s.auction ? s.auction.playerTurn : false, next: s.auction ? s.auction.nextPrice : 0 }; });
    if (st.phase !== 'bidding') break;
    if (st.turn && st.next <= 500) await page.evaluate(() => window.game.playerBid());
    else if (st.turn) break;
    await sleep(150);
  }
  await sleep(1200);
  if ((await page.evaluate(() => window.game.getSnapshot().phase)) === 'unbox') { await page.evaluate(() => window.game.unboxContinue()); await sleep(400); }

  async function setDefects(defs) {
    await page.evaluate(d => {
      const g = window.game;
      g.lot.defects = d.map(x => ({ cost: {}, ...x }));
      g.enterWorkbench();
    }, defs);
    await sleep(400);
  }
  async function grantParts() { await page.evaluate(() => window.game.devGrant(0, { universal: 5, polish: 5, electronic: 5, mechanical: 5 })); }

  /* ---- МОЗАИКА (crack → assemble) ---- */
  await grantParts();
  await setDefects([{ id: 'crack', weight: 1.2, cost: { universal: 1 }, resolved: false }]);
  const opClicked1 = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.op-card button')].find(x => x.textContent.includes('Собрать'));
    if (b) { b.click(); return true; } return false;
  });
  await sleep(500);
  await page.screenshot({ path: 'screenshots/mg-mosaic.png' });
  if (opClicked1) {
    // решаем мозаику: для каждой плитки трейа читаем backgroundPosition → индекс фрагмента → клик по ячейке
    for (let step = 0; step < 9; step++) {
      const idx = await page.evaluate(() => {
        const tray = [...document.querySelectorAll('.asm-tray .tray-tile')];
        if (!tray.length) return -1;
        const t = tray[0];
        const tile = t.querySelector('.tile');
        const bp = tile.style.backgroundPosition.split(' ').map(v => parseInt(v));
        const c = -bp[0] / 100, r = -bp[1] / 100;
        t.click();
        return r * 3 + c;
      });
      if (idx < 0) break;
      await sleep(200);
      await page.evaluate(i => [...document.querySelectorAll('.asm-cell')][i].click(), idx);
      await sleep(200);
    }
    await sleep(600);
  }
  let st1 = await page.evaluate(() => ({ phase: window.game.getSnapshot().phase, resolved: window.game.getSnapshot().lot.defects.map(d => d.resolved) }));
  console.log('MOSAIC: opClicked=', opClicked1, 'resolved=', JSON.stringify(st1.resolved));

  /* ---- РЕМОНТ (broken_mech → repair) ---- */
  await grantParts();
  await setDefects([{ id: 'broken_mech', weight: 1.4, cost: { mechanical: 1 }, resolved: false }]);
  const opClicked2 = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.op-card button')].find(x => x.textContent.includes('Починить'));
    if (b) { b.click(); return true; } return false;
  });
  await sleep(500);
  await page.screenshot({ path: 'screenshots/mg-repair.png' });
  if (opClicked2) {
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => document.querySelector('.repair-spot')?.click());
      await sleep(250);
    }
    await sleep(800);
  }
  let st2 = await page.evaluate(() => window.game.getSnapshot().lot.defects.map(d => d.resolved));
  console.log('REPAIR: opClicked=', opClicked2, 'resolved=', JSON.stringify(st2));

  /* ---- КАЛИБРОВКА (calibration → calibrate) ---- */
  await setDefects([{ id: 'calibration', weight: 1.0, resolved: false }]);
  const opClicked3 = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.op-card button')].find(x => x.textContent.includes('Настроить'));
    if (b) { b.click(); return true; } return false;
  });
  await sleep(500);
  console.log('CAL pre:', JSON.stringify(await page.evaluate(() => ({ activeOp: window.game.getSnapshot().activeOp && window.game.getSnapshot().activeOp.op, hasStage: !!document.querySelector('.cal-stage'), defects: window.game.getSnapshot().lot.defects }))));
  await page.screenshot({ path: 'screenshots/mg-calibrate.png' });
  if (opClicked3) {
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => { const b = [...document.querySelectorAll('.mg-panel button')].find(x => x.textContent.includes('Стоп')); if (b && !b.disabled) b.click(); });
      await sleep(1000);
      const info = await page.evaluate(() => ({ gone: !document.querySelector('.cal-stage'), msg: document.querySelector('.cal-result') ? document.querySelector('.cal-result').textContent : null }));
      console.log('  calibrate step', i, JSON.stringify(info));
      if (info.gone) break;
    }
    await sleep(900);
  }
  console.log('CAL post:', JSON.stringify(await page.evaluate(() => ({ phase: window.game.getSnapshot().phase, activeOp: window.game.getSnapshot().activeOp, ops: (window.game.getSnapshot().workbenchOps||[]).map(o=>o.op), defects: window.game.getSnapshot().lot.defects }))));
  let st3 = await page.evaluate(() => window.game.getSnapshot().lot.defects.map(d => d.resolved));
  console.log('CALIBRATE: opClicked=', opClicked3, 'resolved=', JSON.stringify(st3));

  await page.screenshot({ path: 'screenshots/mg-after-all.png' });
  console.log('ERRORS(' + errors.length + '):'); errors.slice(0, 10).forEach(e => console.log(' -', e));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
