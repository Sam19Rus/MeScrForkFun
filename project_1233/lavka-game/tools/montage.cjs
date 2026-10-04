/* montage.cjs — склейка «старый ракурс → новый» (запускать из корня проекта) */
const fs = require('fs');
const { PNG } = require('/tmp/pngtool/node_modules/pngjs');
const load = p => PNG.sync.read(fs.readFileSync(p));

const oldI = load('screenshots/city/compare/old-desk-city.png');
const newI = load('screenshots/city/desk-city.png');
const W = Math.min(oldI.width, newI.width), H = oldI.height + newI.height + 8;
const out = new PNG({ width: W, height: H });
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const di = (y * W + x) * 4;
  let src = null, sy = y;
  if (y < oldI.height) src = oldI;
  else if (y >= oldI.height + 8) { src = newI; sy = y - oldI.height - 8; }
  if (src) { const si = (sy * src.width + x) * 4; for (let k = 0; k < 4; k++) out.data[di + k] = src.data[si + k]; }
  else { out.data[di] = 40; out.data[di + 1] = 30; out.data[di + 2] = 20; out.data[di + 3] = 255; }
}
fs.writeFileSync('screenshots/city/compare/old-vs-new-desktop.png', PNG.sync.write(out));

const oldP = load('screenshots/city/compare/old-port-city.png');
const newP = load('screenshots/city/port-city.png');
const PW = oldP.width + newP.width + 8, PH = Math.max(oldP.height, newP.height);
const out2 = new PNG({ width: PW, height: PH });
for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
  const di = (y * PW + x) * 4;
  let src = null, sx = x;
  if (x < oldP.width) src = oldP;
  else if (x >= oldP.width + 8) { src = newP; sx = x - oldP.width - 8; }
  if (src && y < src.height) { const si = (y * src.width + sx) * 4; for (let k = 0; k < 4; k++) out2.data[di + k] = src.data[si + k]; }
  else { out2.data[di] = 40; out2.data[di + 1] = 30; out2.data[di + 2] = 20; out2.data[di + 3] = 255; }
}
fs.writeFileSync('screenshots/city/compare/old-vs-new-portrait.png', PNG.sync.write(out2));
console.log('montages done');
