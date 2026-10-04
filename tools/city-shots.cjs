/* city-shots.cjs — QA-кадры города v0.8 (elevated 3/4 perspective):
   1 full desktop · 2 full desktop без UI · 3 квартал крупно · 4 перспектива улицы ·
   5 площадь крупно · 6 лавка+площадь+аукцион · 7 прохожие · 8 portrait · 9 hover ·
   10 camera move (+ жизнь через 4с, lock-состояния, console errors). */
const puppeteer = require('puppeteer');
const fs = require('fs');
const _sh = fs.readdirSync('/tmp/.cache/puppeteer/chrome-headless-shell')[0];
const SHELL_EXE = `/tmp/.cache/puppeteer/chrome-headless-shell/${_sh}/chrome-headless-shell-linux64/chrome-headless-shell`;
const OUT = process.env.SHOT_DIR || 'screenshots/city';
const BASE = 'http://localhost:4173/?dev=1';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* art(1600x900 / 800x1400 slice) → css px окна */
function mapper(w, h, portrait) {
  const W = portrait ? 800 : 1600, H = portrait ? 1400 : 900;
  const hh = h - 46;
  const scale = Math.max(w / W, hh / H);
  const Vw = w / scale, Vh = hh / scale;
  const x0 = (W - Vw) / 2, y0 = (H - Vh) / 2;
  return (x, y) => [(x - x0) * scale, (y - y0) * scale + 46];
}

async function mkPage(browser, url, vp, errors, tag) {
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  await page.setViewport(vp);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => window.game.introDone && window.game.introDone());
  await sleep(400);
  await page.evaluate(() => window.game.goToCity());
  await sleep(1400);
  return page;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'shell', executablePath: SHELL_EXE, protocolTimeout: 180000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const errors = [];
  const VP = { width: 1280, height: 780, deviceScaleFactor: 2 };
  const M = mapper(1280, 780, false);

  /* ---- 1/3/4/5/6/7/9: desktop, жизнь заморожена на t=6 для детерминизма ---- */
  let page = await mkPage(browser, BASE + '&t=6', VP, errors, 'desk');
  await page.screenshot({ path: `${OUT}/desk-city.png` });
  const clip = (x1, y1, x2, y2) => { const [a, b] = M(x1, y1), [c, d] = M(x2, y2); return { x: a, y: b, width: c - a, height: d - b }; };
  await page.screenshot({ path: `${OUT}/desk-quarter.png`, clip: clip(170, 400, 1190, 790) });      // 3 квартал
  await page.screenshot({ path: `${OUT}/desk-road.png`, clip: clip(260, 560, 1340, 900) });        // 4 улица в перспективе
  await page.screenshot({ path: `${OUT}/desk-square.png`, clip: clip(470, 470, 1030, 730) });       // 5 площадь
  await page.screenshot({ path: `${OUT}/desk-trio.png`, clip: clip(230, 400, 1170, 780) });         // 6 лавка+площадь+аукцион
  await page.screenshot({ path: `${OUT}/desk-pedestrians.png`, clip: clip(430, 520, 1010, 800) });   // 7 прохожие
  // 9 hover на лавку
  const [hx, hy] = M(388, 620);
  await page.mouse.move(hx, hy);
  await sleep(450);
  await page.screenshot({ path: `${OUT}/desk-hover.png` });
  await page.close();

  /* ---- 2: desktop без UI ---- */
  page = await mkPage(browser, BASE + '&noui=1&t=6', VP, errors, 'desk-noui');
  await page.screenshot({ path: `${OUT}/desk-city-noui.png` });
  await page.close();

  /* ---- 10: camera move (стоп-кадр середины наезда) ---- */
  page = await mkPage(browser, BASE + '&slowzoom=1&zoompause=1', VP, errors, 'zoom');
  const [zx, zy] = M(388, 620);
  await page.mouse.click(zx, zy);
  await sleep(2600);
  await page.screenshot({ path: `${OUT}/desk-cameramove.png` });
  await page.close();

  /* ---- приезд в лавку + жизнь через 4с ---- */
  page = await mkPage(browser, BASE, VP, errors, 'arrive');
  const [ax, ay] = M(388, 620);
  await page.mouse.click(ax, ay);
  await sleep(3200);
  await page.screenshot({ path: `${OUT}/desk-camera-arrive.png` });
  await page.evaluate(() => window.game.goToCity());
  await sleep(4200);
  await page.screenshot({ path: `${OUT}/desk-city-4s.png` });
  await page.close();

  /* ---- 8: portrait ---- */
  page = await mkPage(browser, BASE + '&t=6', { width: 420, height: 860, deviceScaleFactor: 2 }, errors, 'port');
  await page.screenshot({ path: `${OUT}/port-city.png` });
  await page.close();
  page = await mkPage(browser, BASE, { width: 420, height: 860, deviceScaleFactor: 2 }, errors, 'port4');
  await sleep(3600);
  await page.screenshot({ path: `${OUT}/port-city-4s.png` });
  await page.close();

  await browser.close();
  fs.writeFileSync(`${OUT}/errors.txt`, errors.join('\n') || 'no errors');
  console.log('city shots done; errors:', errors.length);
  if (errors.length) console.log(errors.slice(0, 12).join('\n'));
})();
