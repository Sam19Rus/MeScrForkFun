/* file-test.cjs — проверка, что production-сборка открывается по file:// (без сервера).
   Запуск из корня lavka-game: NODE_PATH=/tmp/pptr/node_modules node tools/file-test.cjs */
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const url = 'file://' + path.join(process.cwd(), 'dist', 'index.html') + '?speed=fast';
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1600));
  const rootChildren = await p.evaluate(() => document.getElementById('root').children.length);
  const hasScene = await p.evaluate(() => !!document.querySelector('.scene'));
  console.log('file:// root children:', rootChildren, '| scene rendered:', hasScene, '| errors:', errs.length, errs.slice(0, 3));
  await b.close();
  process.exit(errs.length || !hasScene ? 1 : 0);
})();
