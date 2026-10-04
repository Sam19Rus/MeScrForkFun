/* art-shots.cjs — скриншоты ключевых сцен для визуальной итерации (desktop + portrait). */
const puppeteer = require('puppeteer');
const fsx = require('fs');
const _sh = fsx.readdirSync('/tmp/.cache/puppeteer/chrome-headless-shell')[0];
const SHELL_EXE = `/tmp/.cache/puppeteer/chrome-headless-shell/${_sh}/chrome-headless-shell-linux64/chrome-headless-shell`;
const fs = require('fs');

const OUT = process.env.SHOT_DIR || 'screenshots/vq';
const BASE = 'http://localhost:4173/?dev=1';

const SHOTS = [
  ['bid', async p => { await p.evaluate(() => { window.game.devForceDay('city', 'radiola'); window.game.startBidding(); }); await sleep(1400); }],
  ['bid-react', async p => { await p.evaluate(() => { window.game.playerBid(); }); await sleep(900); }],
  ['hall', async p => { await p.evaluate(() => { window.game.leaveHall ? null : null; }); await p.evaluate(() => { window.game.devForceDay('city', 'camera'); }); await sleep(900); }],
  ['city', async p => { await p.evaluate(() => window.game.goToCity()); await sleep(900); }],
  ['shop', async p => { await p.evaluate(() => { window.game.devGiveItem('alarm'); window.game.devGiveItem('samovar'); window.game.enterShopFromCity(); }); await sleep(900); }],
  ['workbench', async p => { await p.evaluate(() => { window.game.devForceDay('city', 'phone'); const l = window.game.day.lots[0]; window.game.lot = l; l.price = 120; window.game.enterWorkbench(); }); await sleep(900); }],
  ['unbox', async p => { await p.evaluate(() => { window.game.devForceDay('city', 'watch'); const l = window.game.day.lots[0]; window.game.lot = l; window.game.enterUnbox(); }); await sleep(2200); }],
  ['parts', async p => { await p.evaluate(() => window.game.goParts()); await sleep(800); }],
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'shell', executablePath: SHELL_EXE, protocolTimeout: 120000, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const errors = [];
  for (const mode of ['desk', 'port']) {
    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    await page.setViewport(mode === 'desk' ? { width: 1280, height: 780 } : { width: 420, height: 860 });
    page.on('console', m => { if (m.type() === 'error') errors.push(`[${mode}] ${m.text()}`); });
    page.on('pageerror', e => errors.push(`[${mode}] pageerror: ${e.message}`));
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(() => window.game.introDone && window.game.introDone());
    await sleep(600);
    for (const [name, fn] of SHOTS) {
      try { await fn(page); } catch (e) { errors.push(`[${mode}/${name}] ${e.message}`); }
      await page.screenshot({ path: `${OUT}/${mode}-${name}.png` });
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(`${OUT}/errors.txt`, errors.join('\n') || 'no errors');
  console.log('shots done; errors:', errors.length);
  if (errors.length) console.log(errors.slice(0, 12).join('\n'));
})();
