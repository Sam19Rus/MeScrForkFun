/* CityMap.tsx — город «Лавки» в новой пространственной модели:
   ELEVATED 3/4 PERSPECTIVE CITY MAP. Камера на уровне 3–5 этажа смотрит
   вниз на район: вся сцена построена на плоскости земли (wx, wy) и
   проецируется через proj.ts (одноточечная перспектива, гиперболическое
   сжатие к горизонту). Улицы уходят в глубину и расходятся диагоналями,
   здания — объёмы с видимыми крышами, повёрнуты под разными углами
   (не изометрия), площадь — горизонтальная поверхность, дворы и переулки
   создают отрицательное пространство. Небо ~17% кадра.
   Слоирование: depth-bands (полосы глубины) — статика сортируется по wy,
   динамика (life.tsx) переставляется между полосами каждый кадр.
   Desktop 1600×900 и portrait 800×1400 — две самостоятельные композиции. */
import React from 'react';
import {
  CAM_DESK, CAM_PORT, Cam, P, liftPx, decal, qw, ribbonPath, dashes, crosswalk,
  hazy, hazeFilter, W, mixCol, q,
} from './proj';
import {
  CityDefs, GroundShadow, StreetLamp, Tree, Bench, Bin, Bike, Car, Truck, Crate, Barrel, Mailbox,
  PosterCol, Stall, Fountain, Fence, Hedge, Cat, Bird, Chimney, WaterTower, Factory, Pole, CarBack,
} from './kit';
import { Person } from './people';
import { Bld, BldSpec, bldShadow, bldAnchor } from './blocks';
import { SPRITE_K, PathWalker, PathCyclist, PathCar, WalkerSpec } from './life';
import {
  shopF, warehouseF, estateF, garageF, partsF, bakeryF, clockmakerF, closedF, cafeF, towerF, gridF,
} from './facades';

export interface CityAnchor { id: string; x: number; y: number; }

/* ================= вспомогательные примитивы сцены ================= */

/* diegetic-штендер (A-frame) у входа — подпись места без UI */
function SidewalkBoard({ text, hidden }: { text: string; hidden?: boolean }) {
  return <g className="ui-label" opacity={hidden ? .55 : 1}>
    <path d="M-20 0 l4 -26 M20 0 l-4 -26" stroke="#3a2c1d" strokeWidth="3" />
    <g transform="rotate(-2)">
      <rect x="-30" y="-26" width="60" height="20" rx="3" fill="#241a12" stroke="#57432c" strokeWidth="1.4" />
      <text textAnchor="middle" y="-12" fontSize="10.5" fontFamily="Georgia, serif" fill={hidden ? '#9a8c74' : '#f2d788'} fontWeight="bold">{text}</text>
    </g>
  </g>;
}

/* бельевая верёвка между двумя точками мира */
function LaundryLine({ cam, a, b }: { cam: Cam; a: W; b: W }) {
  const pa = P(cam, a[0], a[1]), pb = P(cam, b[0], b[1]);
  const k = (pa.s + pb.s) / 2;
  const hgt = 26 * k;
  const A = { x: pa.x, y: pa.y - hgt }, B = { x: pb.x, y: pb.y - hgt };
  const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + 7 * k;
  const at = (t: number) => ({
    x: (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x,
    y: (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y,
  });
  return <g>
    <path d={`M${pa.x} ${pa.y} v${-hgt} M${pb.x} ${pb.y} v${-hgt}`} stroke="#5c4f38" strokeWidth={2.4 * k} />
    <path d={`M${A.x} ${A.y} Q${mx} ${my} ${B.x} ${B.y}`} stroke="#3a3226" strokeWidth={1.3 * k} fill="none" />
    {[0.22, 0.45, 0.68].map((t, i) => {
      const p = at(t);
      return <path key={i} d={`M${p.x} ${p.y} q${4 * k} ${9 * k} 0 ${13 * k} q${-4 * k} ${-4 * k} 0 ${-13 * k}z`}
        fill={['#c8b898', '#b5533c', '#8aa0b0'][i]} transform={`rotate(${i * 4 - 4} ${p.x} ${p.y})`} />;
    })}
  </g>;
}

/* провода между столбами (мир. точки) + птицы */
function WireSpan({ cam, a, b, poleH = 118, sag = 16, birds = 0 }: { cam: Cam; a: W; b: W; poleH?: number; sag?: number; birds?: number }) {
  const pa = P(cam, a[0], a[1]), pb = P(cam, b[0], b[1]);
  const A = { x: pa.x, y: pa.y - poleH * pa.s }, B = { x: pb.x, y: pb.y - poleH * pb.s };
  const k = (pa.s + pb.s) / 2;
  const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + sag * k;
  return <g>
    <path d={`M${A.x} ${A.y} Q${mx} ${my} ${B.x} ${B.y}`} stroke="#3a3226" strokeWidth={1.6 * k} fill="none" opacity=".55" />
    <path d={`M${A.x} ${A.y + 9 * k} Q${mx} ${my + 9 * k} ${B.x} ${B.y + 9 * k}`} stroke="#3a3226" strokeWidth={1.2 * k} fill="none" opacity=".4" />
    {Array.from({ length: birds }).map((_, i) => {
      const t = 0.3 + i * 0.22;
      const x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x;
      const y = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
      return <g key={i} transform={`translate(${x} ${y - 3 * k}) scale(${k})`}><Bird x={0} y={0} i={i} /></g>;
    })}
  </g>;
}

/* флажки-гирлянда */
function Bunting({ cam, a, b, hgt = 7, sag = 10 }: { cam: Cam; a: W; b: W; hgt?: number; sag?: number }) {
  const pa = P(cam, a[0], a[1]), pb = P(cam, b[0], b[1]);
  const k = (pa.s + pb.s) / 2;
  const A = { x: pa.x, y: pa.y - liftPx(cam, hgt, a[1]) }, B = { x: pb.x, y: pb.y - liftPx(cam, hgt, b[1]) };
  const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + sag * k;
  const cols = ['#b5533c', '#d9b23f', '#4f6a6a', '#c87850', '#6e7f56'];
  return <g>
    <path d={`M${A.x} ${A.y} Q${mx} ${my} ${B.x} ${B.y}`} stroke="#4a3a28" strokeWidth={1.4 * k} fill="none" opacity=".8" />
    {Array.from({ length: 9 }).map((_, i) => {
      const t = (i + 0.5) / 9;
      const x = (1 - t) * (1 - t) * A.x + 2 * (1 - t) * t * mx + t * t * B.x;
      const y = (1 - t) * (1 - t) * A.y + 2 * (1 - t) * t * my + t * t * B.y;
      const s = 7 * k;
      return <path key={i} d={`M${x - s} ${y} h${s * 2} l${-s} ${s * 1.7}z`} fill={cols[i % cols.length]} opacity=".92"
        className="flag-wave" style={{ animationDelay: `${i * 0.4}s`, transformOrigin: `${x}px ${y}px` }} />;
    })}
  </g>;
}

/* наземная декаль-эллипс (люк/лужа/клумба) */
function Decal({ cam, wx, wy, ru, children }: { cam: Cam; wx: number; wy: number; ru: number; children: (d: { x: number; y: number; rx: number; ry: number; s: number }) => React.ReactNode }) {
  const d = decal(cam, wx, wy, ru);
  return <g>{children(d)}</g>;
}
function ManholeD({ cam, wx, wy }: { cam: Cam; wx: number; wy: number }) {
  const d = decal(cam, wx, wy, 1.5);
  return <g transform={`translate(${d.x} ${d.y})`}>
    <ellipse rx={d.rx} ry={d.ry} fill="#57504a" stroke="#3a3630" strokeWidth={1.8 * d.s} />
    <path d={`M${-d.rx * .6} 0 h${d.rx * 1.2} M${-d.rx * .4} ${-d.ry * .45} h${d.rx * .8} M${-d.rx * .4} ${d.ry * .45} h${d.rx * .8}`} stroke="#3a3630" strokeWidth={1.2 * d.s} />
  </g>;
}
function PuddleD({ cam, wx, wy, ru = 3 }: { cam: Cam; wx: number; wy: number; ru?: number }) {
  const d = decal(cam, wx, wy, ru);
  return <g>
    <ellipse cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill="#7a98a8" opacity=".5" />
    <ellipse cx={d.x - d.rx * .2} cy={d.y - d.ry * .25} rx={d.rx * .48} ry={d.ry * .4} fill="#c8d8e8" opacity=".5" />
  </g>;
}

/* ==================================================================
   DESKTOP 1600×900 — план района (мировые координаты)
   География: главная улица внизу → лавка и запчасти западнее площади,
   аукцион-склад восточнее; площадь с фонтаном между ними; два переулка
   уходят к камере; северная улица, западный и восточный переулки ведут
   в серединные кварталы (усадьба, гараж, кафе, жилые дома); дальше —
   фоновый район и силуэт города у горизонта.
   ================================================================== */
const D_BANDS = [13, 24, 34, 44, 56, 70, 88, 112, 148, 210];

const D_MAIN: W[] = [[-205, 24.2], [-100, 23.2], [0, 22.4], [100, 21.6], [205, 21]];
const D_ALLEY_W: W[] = [[-31, -7], [-27, 6], [-22.5, 15], [-19, 23], [-15.5, 32], [-13.5, 39.5]];
const D_ALLEY_E: W[] = [[47, -7], [43, 8], [38.5, 17], [34.5, 25.5], [31, 33], [29.5, 38.5]];
const D_NORTH: W[] = [[10, 59], [11, 72], [8, 86], [12, 104], [9, 132], [12, 172], [8, 240], [10, 330]];
const D_WEST_RD: W[] = [[-4, 59], [-22, 68], [-44, 78], [-70, 90], [-100, 106], [-134, 122]];
const D_EAST_RD: W[] = [[26, 59.5], [48, 68], [72, 79], [100, 92], [132, 108], [164, 122]];
const D_LANE: W[] = [[-62, 50.5], [-86, 56.5], [-112, 62]];
const D_ESTATE_WALK: W[] = [[-62, 84], [-70, 78], [-76.5, 72.5]];
const D_PLAZA: W[] = [[-15, 37.5], [35, 36.5], [36.5, 60], [-13.5, 61.5]];

function deskSpecs(L: (id: string) => boolean): BldSpec[] {
  const S: BldSpec[] = [];
  /* ——— героический ряд (север главной улицы) ——— */
  S.push({
    id: 'shop', uid: 'd-shop', c: [-50, 41.5], w: 26, d: 15, h: 18, rot: -5,
    roof: 'gable', ridge: 'v', rh: 5.2, ov: 1, face: '#b0855a', side: '#6e5138',
    roofCol: '#8a5a44', roofLit: '#a06a4c', tex: 'plaster', facade: shopF(L('shop')), locked: L('shop'),
    onRoof: at => { const p = at(19.5, 9.5); return <Chimney x={p.x} y={p.y} s={p.s * 0.92} smoke={!L('shop')} />; },
  });
  S.push({
    id: 'parts', uid: 'd-parts', c: [-25.5, 42], w: 17, d: 13, h: 13, rot: -3,
    roof: 'flat', face: '#4f6a6a', side: '#33484a', roofCol: '#3f5656', roofLit: '#4c6666',
    tex: 'paint', facade: partsF(L('parts')), locked: L('parts'),
    onRoof: at => {
      const m = at(13.5, 2); const v = at(4, 9);
      return <g>
        <g transform={`translate(${m.x} ${m.y}) scale(${m.s * 0.85})`}>
          <rect x={-3} y={-58} width={6} height={58} fill="#3a2c1d" />
          <g transform="translate(-9 -62)"><rect x={-15} y={0} width={30} height={5 * 15 + 12} rx={4} fill={L('parts') ? '#5d584c' : '#3f5656'} stroke="#241a12" strokeWidth={2} />
            {'ДЕТАЛИ'.split('').map((ch, i) => <text key={i} textAnchor="middle" x={0} y={14 + i * 15} fontSize={12.4} fontFamily="Georgia, serif" fill={L('parts') ? '#9a8c74' : '#f6e7c2'} fontWeight="bold">{ch}</text>)}</g>
        </g>
        <g transform={`translate(${v.x} ${v.y}) scale(${v.s})`}>
          <rect x={-7} y={-10} width={14} height={10} rx={2} fill="#5d6a52" /><rect x={-7} y={-12} width={14} height={3} fill="#77846c" />
        </g>
      </g>;
    },
  });
  S.push({
    id: 'city_warehouse', uid: 'd-wh', c: [54, 43.5], w: 30, d: 18, h: 21, rot: 6,
    roof: 'hip', rh: 4.6, ov: 0.9, face: '#8a5a44', side: '#5a3a2c', roofCol: '#4a3226', roofLit: '#5c4030',
    tex: 'brick', facade: warehouseF(L('city_warehouse')), locked: L('city_warehouse'),
    onRoof: at => {
      const a = at(8, 9), b = at(21, 12), c = at(14, 5);
      return <g>
        <Chimney x={a.x} y={a.y} s={a.s * 0.8} smoke delay={0.8} />
        <g transform={`translate(${b.x} ${b.y}) scale(${b.s})`}><rect x={-6} y={-8} width={12} height={8} rx={1.6} fill="#5d5240" /></g>
        <g transform={`translate(${c.x} ${c.y}) scale(${c.s})`}><rect x={-9} y={-6} width={18} height={6} rx={1.4} fill="#6e6250" /><path d="M-6 -6 v-3 h12 v3" stroke="#57504a" strokeWidth={1.6} fill="none" /></g>
      </g>;
    },
  });
  S.push({ uid: 'd-bakery', c: [-72, 44], w: 17, d: 12, h: 12, rot: -8, roof: 'gable', ridge: 'u', rh: 3.8, face: '#c8a070', side: '#8a6a48', roofCol: '#7c4a32', roofLit: '#94583c', facade: bakeryF(), onRoof: at => { const p = at(4, 8); return <Chimney x={p.x} y={p.y} s={p.s * 0.8} smoke delay={1.4} />; } });
  S.push({ uid: 'd-closed', c: [-92, 46.5], w: 15, d: 11, h: 11, rot: -11, roof: 'flat', face: '#8a8072', side: '#5d584c', roofCol: '#4a4238', tex: 'paint', facade: closedF() });
  S.push({ uid: 'd-clockm', c: [78, 46.5], w: 14, d: 11, h: 13, rot: 9, roof: 'gable', ridge: 'u', rh: 3.6, face: '#6e7f56', side: '#4a5a3c', roofCol: '#5a4632', roofLit: '#6e5638', tex: 'wood', facade: clockmakerF() });
  S.push({ uid: 'd-aptE', c: [101, 49], w: 18, d: 14, h: 21, rot: 12, roof: 'flat', face: '#a89878', side: '#78684c', roofCol: '#5d5240', tex: 'paint', facade: gridF(180, 210, { rows: 3, cols: 3, vs: ['lit', 'curtain', 'dark'] }), onRoof: at => { const p = at(13, 4); return <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`}><rect x={-8} y={-14} width={16} height={14} rx={2} fill="#6e6250" /><rect x={-8} y={-16} width={16} height={3} fill="#847862" /></g>; } });
  /* ——— усадьба и гараж (второй план) ——— */
  S.push({
    id: 'estate', uid: 'd-estate', c: [-78, 64], w: 26, d: 16, h: 16, rot: -13,
    roof: 'hip', rh: 4.2, ov: 0.9, face: '#d4bc94', side: '#a08c68', roofCol: '#8a5a44', roofLit: '#9c664a',
    tex: 'plaster', facade: estateF(L('estate')), locked: L('estate'),
    onRoof: at => { const p = at(19, 8); return <Chimney x={p.x} y={p.y} s={p.s * 0.85} smoke={false} />; },
  });
  S.push({
    id: 'garage', uid: 'd-garage', c: [84, 62], w: 24, d: 15, h: 13, rot: 14,
    roof: 'flat', face: '#5d6a52', side: '#46523c', roofCol: '#4a5240', roofLit: '#59614e',
    tex: 'metal', facade: garageF(L('garage')), locked: L('garage'),
    onRoof: at => { const a = at(17, 4), b = at(6, 10); return <g>
      <g transform={`translate(${a.x} ${a.y}) scale(${a.s})`}><rect x={-9} y={-12} width={18} height={12} rx={2} fill="#57504a" /><ellipse cx={0} cy={-12} rx={9} ry={2.6} fill="#6e675e" /></g>
      <g transform={`translate(${b.x} ${b.y}) scale(${b.s})`}><rect x={-6} y={-8} width={12} height={8} rx={1.4} fill="#4a5240" /></g>
    </g>; },
  });
  /* ——— серединный район ——— */
  S.push({ uid: 'd-tower', c: [-10, 66.5], w: 9, d: 9, h: 34, rot: -2, roof: 'hip', rh: 7.5, ov: 0.6, face: '#b09878', side: '#8a7458', roofCol: '#6e4234', roofLit: '#7c4e3c', tex: 'stone', facade: towerF(),
    onRoof: at => { const p = at(4.5, 4.5, 3.4); return <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`}><path d="M0 0 v-22" stroke="#4a3a28" strokeWidth={2.4} /><circle cx={0} cy={-24} r={3} fill="#d9b23f" /></g>; } });
  S.push({ uid: 'd-cafe', c: [24, 70], w: 16, d: 12, h: 11.5, rot: 8, roof: 'gable', ridge: 'u', rh: 3.6, face: '#c8a070', side: '#8a6a48', roofCol: '#7c4a32', roofLit: '#94583c', facade: cafeF(), onRoof: at => { const p = at(11, 8); return <Chimney x={p.x} y={p.y} s={p.s * 0.75} smoke delay={2.1} />; } });
  S.push({ uid: 'd-h1', c: [42, 77], w: 14, d: 11, h: 12, rot: 10, roof: 'gable', ridge: 'u', rh: 3.6, face: '#b09878', side: '#7c6a52', roofCol: '#7c4a32', roofLit: '#94583c', facade: gridF(140, 120, { rows: 2, cols: 3, vs: ['curtain', 'lit', 'flower'] }), onRoof: at => { const p = at(4, 7); return <Chimney x={p.x} y={p.y} s={p.s * 0.72} smoke delay={0.4} />; } });
  S.push({ uid: 'd-h2', c: [-23, 73], w: 13, d: 11, h: 11.5, rot: -8, roof: 'gable', ridge: 'v', rh: 3.8, face: '#9aa888', side: '#68785c', roofCol: '#6e4f33', roofLit: '#84603e', facade: gridF(130, 115, { rows: 2, cols: 3, vs: ['lit', 'dark', 'curtain'] }) });
  S.push({ uid: 'd-h3', c: [-41, 80.5], w: 14, d: 11, h: 12, rot: -12, roof: 'gable', ridge: 'u', rh: 3.4, face: '#c0a088', side: '#8a6c58', roofCol: '#7c4a32', roofLit: '#94583c', facade: gridF(140, 120, { rows: 2, cols: 3, vs: ['flower', 'curtain', 'lit'] }) });
  S.push({ uid: 'd-h4', c: [58, 86], w: 14, d: 12, h: 12.5, rot: 12, roof: 'gable', ridge: 'v', rh: 3.8, face: '#a89878', side: '#78684c', roofCol: '#6e4234', roofLit: '#7c4e3c', facade: gridF(140, 125, { rows: 2, cols: 3, vs: ['dark', 'lit', 'curtain'] }) });
  S.push({ uid: 'd-a1', c: [-58, 90], w: 16, d: 13, h: 17, rot: -10, roof: 'flat', face: '#a89878', side: '#78684c', roofCol: '#5d5240', tex: 'paint', facade: gridF(160, 170, { rows: 3, cols: 3, vs: ['curtain', 'lit', 'dark'] }) });
  S.push({ uid: 'd-a2', c: [80, 98], w: 16, d: 13, h: 16, rot: 14, roof: 'flat', face: '#93877a', side: '#6e645a', roofCol: '#57504a', tex: 'paint', facade: gridF(160, 160, { rows: 3, cols: 3, vs: ['lit', 'dark', 'curtain', 'flower'] }) });
  /* сараи во дворах */
  S.push({ uid: 'd-sh1', c: [3, 70], w: 6, d: 5, h: 5.5, rot: -4, roof: 'flat', face: '#7a6248', side: '#5d4a34', roofCol: '#57504a', gableWin: false });
  S.push({ uid: 'd-sh2', c: [37, 68.5], w: 6.5, d: 5, h: 5.5, rot: 9, roof: 'flat', face: '#6e5a42', side: '#54452f', roofCol: '#57504a', gableWin: false });
  S.push({ uid: 'd-sh3', c: [-31, 86], w: 6, d: 5, h: 5, rot: -12, roof: 'flat', face: '#7a6248', side: '#5d4a34', roofCol: '#4a4238', gableWin: false });
  /* дома вдоль северной улицы и переулков — кварталы, а не редкая гребёнка */
  const mid: [number, number, number, number, number, 'flat' | 'gable', string, string][] = [
    [-2, 79, 12, 11, -6, 'gable', '#b09878', '#7c6a52'],
    [-8, 93, 13, 12, -4, 'gable', '#9aa888', '#68785c'],
    [21, 81, 12, 11, 8, 'gable', '#c0a088', '#8a6c58'],
    [27, 95, 13, 12, 6, 'gable', '#a89878', '#78684c'],
    [62, 73, 12, 11, 16, 'gable', '#b09878', '#7c6a52'],
    [88, 88, 13, 11.5, 18, 'gable', '#9aa888', '#68785c'],
    [-36, 97, 12, 11, -14, 'gable', '#c0a088', '#8a6c58'],
    [56, 105, 12, 11, 14, 'flat', '#a89878', '#78684c'],
  ];
  mid.forEach(([wx, wy, w, h, rot, roof, face, side], i) => {
    S.push({ uid: `dm${i}`, c: [wx, wy], w, d: w * 0.85, h, rot, roof, ridge: i % 2 ? 'u' : 'v', rh: 3.4,
      face, side, roofCol: '#7c4a32', roofLit: '#94583c',
      facade: gridF(w * 10, h * 10, { rows: 2, cols: 3, vs: i % 2 ? ['curtain', 'lit', 'flower'] : ['lit', 'dark', 'curtain'] }),
      onRoof: i % 3 === 0 ? (at => { const q2 = at(w * 0.3, w * 0.5); return <Chimney x={q2.x} y={q2.y} s={q2.s * 0.7} smoke delay={i * 0.7} />; }) : undefined });
  });
  return S;
}

/* фоновый и дальний районы — генерируются с атмосферным затуханием */
function deskFarSpecs(): BldSpec[] {
  const S: BldSpec[] = [];
  const bg: [number, number, number, number, number, number, 'flat' | 'gable', string][] = [
    // wx, wy, w, h, rot, ridge?, roof, face
    [-96, 108, 13, 11, -8, 0, 'gable', '#b09878'],
    [-72, 104, 12, 9.5, -6, 0, 'gable', '#9aa888'],
    [-46, 110, 13, 10.5, 5, 0, 'gable', '#c0a088'],
    [-20, 106, 12, 9, -4, 0, 'flat', '#a89878'],
    [4, 112, 13, 11, 6, 0, 'gable', '#b09878'],
    [30, 108, 12, 10, 9, 0, 'gable', '#93877a'],
    [56, 114, 13, 10, 11, 0, 'flat', '#a89878'],
    [84, 120, 12, 10.5, 13, 0, 'gable', '#b09878'],
    [112, 128, 12, 9.5, 10, 0, 'flat', '#93877a'],
    [-124, 120, 12, 10, -12, 0, 'gable', '#9aa888'],
    [-152, 132, 13, 10, -8, 0, 'flat', '#a89878'],
    [142, 142, 12, 9, 8, 0, 'gable', '#93877a'],
  ];
  bg.forEach(([wx, wy, w, h, rot, , roof, face], i) => {
    const k = 0.22 + (wy - 100) * 0.004;
    S.push({
      uid: `dbg${i}`, c: [wx, wy], w, d: w * 0.8, h, rot, roof: roof as 'flat' | 'gable',
      ridge: i % 2 ? 'u' : 'v', rh: 3, face: hazy(face, k), side: hazy('#78684c', k),
      roofCol: hazy('#7c4a32', k), roofLit: hazy('#94583c', k),
      facade: gridF(w * 10, h * 10, { rows: h > 10 ? 2 : 1, cols: 3, vs: i % 3 === 0 ? ['lit', 'dark', 'curtain'] : ['dark', 'curtain', 'lit'], door: false, frame: '#6e6250' }),
    });
  });
  /* церковь со шпилем */
  S.push({ uid: 'd-church', c: [-108, 150], w: 10, d: 16, h: 15, rot: -8, roof: 'hip', rh: 13, face: hazy('#c8b898', .4), side: hazy('#a08c68', .4), roofCol: hazy('#6e4234', .4), roofLit: hazy('#7c4e3c', .4), gableWin: false,
    onRoof: at => { const p = at(5, 8, 6); return <g transform={`translate(${p.x} ${p.y}) scale(${p.s})`}><path d="M0 0 v-16 M-4.4 -11 h8.8" stroke="#5a4a38" strokeWidth={2} /></g>; } });
  return S;
}
function deskDistSpecs(): BldSpec[] {
  const S: BldSpec[] = [];
  const rows: [number, number, number, number][] = [
    [-230, 250, 15, 10], [-196, 232, 12, 8.5], [-168, 262, 14, 9.5], [-140, 240, 11, 8],
    [-112, 268, 13, 9], [-84, 246, 11, 8], [-56, 272, 14, 10], [-28, 250, 12, 8.5],
    [0, 276, 13, 9], [28, 254, 11, 8], [56, 280, 14, 10], [84, 258, 12, 8.5],
    [112, 284, 13, 9], [140, 262, 11, 8], [168, 288, 14, 10], [196, 266, 12, 8.5], [224, 292, 13, 9],
    [-186, 342, 12, 7], [-124, 358, 10, 6], [-62, 346, 11, 7], [2, 362, 10, 6], [64, 350, 11, 7], [126, 366, 10, 6], [188, 354, 11, 7], [246, 370, 10, 6],
  ];
  rows.forEach(([wx, wy, w, h], i) => {
    const k = 0.32 + (i % 3) * 0.06;
    S.push({
      uid: `ddist${i}`, c: [wx, wy], w, d: w * 0.75, h, rot: (i % 5) * 4 - 8,
      roof: i % 2 ? 'gable' : 'flat', ridge: i % 4 < 2 ? 'u' : 'v', rh: 2.8,
      face: hazy(i % 4 === 1 ? '#9aa888' : '#a89878', k), side: hazy('#78684c', k),
      roofCol: hazy(i % 3 === 0 ? '#6e7f8a' : '#7c4a32', k), roofLit: hazy(i % 3 === 0 ? '#8494a0' : '#94583c', k),
      gableWin: false,
      facade: gridF(w * 10, h * 10, { rows: h > 9 ? 2 : 1, cols: 3, vs: ['dark', 'curtain', 'lit'], door: false, frame: '#6e6250' }),
    });
  });
  return S;
}

/* ============================== DESKTOP ============================== */
export function CityMapDesktop({ lockedIds }: { lockedIds: Set<string> }) {
  const cam = CAM_DESK;
  const L = (id: string) => lockedIds.has(id);
  const specs = [...deskSpecs(L), ...deskFarSpecs(), ...deskDistSpecs()];

  const ents: { wy: number; node: React.ReactNode }[] = [];
  const addE = (wy: number, node: React.ReactNode) => { ents.push({ wy, node }); };
  const addProp = (wx: number, wy: number, K: number, node: React.ReactNode, rot = 0) => {
    const p = P(cam, wx, wy);
    addE(wy, <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(p.s * K).toFixed(3)})${rot ? ` rotate(${rot})` : ''}`}>{node}</g>);
  };

  /* ---- здания (с атмосферным затуханием по глубине) ---- */
  specs.forEach((sp, i) => {
    const wyF = sp.c[1] - sp.d / 2 + 0.4;
    const k = Math.max(0, Math.min(0.72, (sp.c[1] - 84) / 190));
    const el = <Bld cam={cam} sp={{ ...sp, uid: sp.uid || `dx${i}` }} />;
    const wrapped = sp.id
      ? <g className={`building ${sp.locked ? 'locked' : ''}`} data-id={sp.id}>{el}</g>
      : el;
    addE(wyF, k > 0.02 ? <g style={hazeFilter(k)}>{wrapped}</g> : wrapped);
  });

  /* ---- пропсы: фонари, деревья, мелочи ---- */
  const LP = SPRITE_K.lamp, TR = SPRITE_K.tree, PS = SPRITE_K.person;
  // южный тротуар главной улицы
  [[-92, 14.5], [-36, 14], [16, 13.5], [70, 13], [124, 12.8]].forEach(([x, y]) => addProp(x, y, LP, <StreetLamp x={0} y={0} />));
  // северная сторона
  [[-62, 31], [-8, 30.5], [56, 30], [108, 29.8]].forEach(([x, y]) => addProp(x, y, LP, <StreetLamp x={0} y={0} />));
  // площадь
  [[-13.5, 41], [33, 40], [34.5, 59.5], [-12, 60.5]].forEach(([x, y]) => addProp(x, y, LP, <StreetLamp x={0} y={0} />));
  addProp(10, 50, SPRITE_K.fountain * 1.18, <Fountain x={0} y={0} />);
  [[-9.5, 43.5, false], [30.5, 47.5, true], [-7.5, 56.5, false]].forEach(([x, y, f], i) =>
    addProp(x as number, y as number, SPRITE_K.stall, <g transform={f ? 'scale(-1 1)' : undefined}><Stall x={0} y={0} col={['#b5533c', '#4f6a6a', '#8a6a3c'][i] } /></g>));
  [[1, 47, false], [19.5, 47.4, true], [10.5, 55.8, false]].forEach(([x, y, f]) =>
    addProp(x as number, y as number, SPRITE_K.bench, <Bench x={0} y={0} flip={!!f} />));
  // деревья: передний план (крупные, кадрируют сцену)
  addProp(-84, 3.5, TR * 1.2, <Tree x={0} y={0} tone={0} />);
  addProp(87, 2.5, TR * 1.3, <Tree x={0} y={0} tone={2} />);
  addProp(-52, 6, TR * 1.05, <Tree x={0} y={0} tone={1} />);
  // деревья района
  [[-38, 36.5], [-58.5, 37.5], [-4, 35.5], [44, 37.5], [68, 38.5], [-110, 40], [120, 39.5], [-128, 43],
  [-11, 41.8], [31.5, 41], [-9.5, 58.8], [32, 57.8], [-24, 66], [14.5, 66.5], [48, 70], [-48, 74.5],
  [62, 74], [-16, 84.5], [24, 92], [-92, 60], [-64, 59.5], [-84, 70.5], [-34, 88], [4, 95], [38, 96],
  [92, 104], [-70, 100], [-110, 110], [60, 106], [120, 116], [-140, 118], [150, 128]].forEach(([x, y], i) =>
    addProp(x, y, TR * (0.9 + (i % 3) * 0.06), <Tree x={0} y={0} tone={i % 3} />));
  // столбы с проводами (южная бровка)
  const poles: W[] = [[-118, 15], [-48, 14.4], [26, 13.6], [96, 13.1]];
  poles.forEach(([x, y]) => addProp(x, y, 0.59, <Pole x={0} y={0} />));
  addE(poles[0][1], <WireSpan cam={cam} a={poles[0]} b={poles[1]} poleH={124} birds={3} />);
  addE(poles[1][1], <WireSpan cam={cam} a={poles[1]} b={poles[2]} poleH={124} birds={2} />);
  addE(poles[2][1], <WireSpan cam={cam} a={poles[2]} b={poles[3]} poleH={124} />);
  // гирлянды над площадью
  addE(40.4, <Bunting cam={cam} a={[-13.5, 41]} b={[33, 40]} hgt={7.2} sag={9} />);
  addE(60, <Bunting cam={cam} a={[-12, 60.5]} b={[34.5, 59.5]} hgt={7.2} sag={9} />);
  // мелочи улицы и дворов
  addProp(-56, 11.8, SPRITE_K.bench, <Bench x={0} y={0} />);
  addProp(-52.4, 12, SPRITE_K.bin, <Bin x={0} y={0} />);
  addProp(88, 12.4, SPRITE_K.bench, <Bench x={0} y={0} flip />);
  addProp(92, 12.5, SPRITE_K.bin, <Bin x={0} y={0} />);
  addProp(110, 14.6, SPRITE_K.poster, <PosterCol x={0} y={0} />);
  addProp(-36.5, 32.6, SPRITE_K.mailbox, <Mailbox x={0} y={0} />);
  addProp(-19.5, 35.8, SPRITE_K.bike, <Bike x={0} y={0} />);
  addProp(-14, 7.5, SPRITE_K.bench, <Bench x={0} y={0} />);
  addProp(-10.4, 7.8, SPRITE_K.bin, <Bin x={0} y={0} />);
  addProp(40, 7, SPRITE_K.poster, <PosterCol x={0} y={0} />);
  addProp(-30, 8, SPRITE_K.cat * 1.1, <Cat x={0} y={0} col="#7a6a4c" />);
  addProp(-66, 10, 0.9, <Hedge x={0} y={0} w={90} />);
  addProp(14.8, 86, SPRITE_K.car * 0.95, <CarBack x={0} y={0} col="#6e7f8a" />);
  addProp(-60, 6.5, 0.6, <g><Crate x={0} y={0} /><Barrel x={26} y={4} /></g>);
  addProp(17, 52.6, 0.5, <g><Bird x={0} y={0} i={1} /><Bird x={16} y={5} i={2} /><Bird x={-13} y={7} /></g>);
  // рыночные столы на площади
  addProp(2, 44.5, 0.6, <g><GroundShadow x={0} y={1} rx={20} ry={4} /><rect x={-18} y={-16} width={36} height={5} rx={1.5} fill="#8a6a48" /><path d="M-15 -11 v11 M15 -11 v11" stroke="#6e5638" strokeWidth={3} /><circle cx={-8} cy={-19} r={3.4} fill="#c8a030" /><circle cx={0} cy={-20} r={3.4} fill="#b5533c" /><circle cx={8} cy={-19} r={3.4} fill="#c8a030" /></g>);
  addProp(19, 44, 0.6, <g><GroundShadow x={0} y={1} rx={20} ry={4} /><rect x={-18} y={-16} width={36} height={5} rx={1.5} fill="#8a6a48" /><path d="M-15 -11 v11 M15 -11 v11" stroke="#6e5638" strokeWidth={3} /><rect x={-10} y={-24} width={9} height={8} rx={1.5} fill="#4f6a6a" /><rect x={1} y={-23} width={9} height={7} rx={1.5} fill="#8a6a3c" /></g>);
  addProp(-4, 57.8, SPRITE_K.cat, <Cat x={0} y={0} />);
  // ящики/бочки: пекарня, склад, гаражный двор
  addProp(-80.5, 39, 0.55, <g><Crate x={0} y={0} /><Crate x={20} y={5} s={0.8} /></g>);
  addProp(69, 38, 0.5, <g><Barrel x={0} y={0} /><Crate x={22} y={3} /></g>);
  addProp(93.5, 55, 0.5, <g><Crate x={0} y={0} /><Barrel x={24} y={3} /><Crate x={12} y={9} s={0.75} /></g>);
  addProp(89.5, 59, SPRITE_K.truck, <Truck x={0} y={0} col="#8a6a48" />, -6);
  addProp(-96, 25.8, SPRITE_K.car, <Car x={0} y={0} col="#6e7f8a" flip />);
  // живые изгороди и заборы
  addProp(-95, 56.5, 0.8, <Hedge x={0} y={0} w={90} />);
  addProp(-85, 56.7, 0.8, <Hedge x={0} y={0} w={80} />);
  addProp(-67.5, 57, 0.8, <Hedge x={0} y={0} w={70} />);
  addProp(-108, 58, 0.75, <Fence x={0} y={0} n={7} />);
  addProp(30.5, 75.6, 0.7, <Fence x={0} y={0} n={6} col="#7a6a4c" />);
  // бельевые верёвки дворов
  addE(68, <LaundryLine cam={cam} a={[-40, 68]} b={[-24, 68.6]} />);
  addE(69, <LaundryLine cam={cam} a={[32, 68.4]} b={[47, 69.2]} />);
  // дальние ориентиры: водонапорная башня и завод (билборды у горизонта)
  addProp(-128, 142, 1.15, <WaterTower x={0} y={0} s={1} />);
  addProp(114, 152, 0.95, <Factory x={0} y={0} />);
  // редкие деревья дальней равнины
  [[-140, 172], [-44, 182], [62, 176], [152, 188], [-210, 196], [210, 200]].forEach(([x, y], i) =>
    addProp(x, y, TR * 0.8, <Tree x={0} y={0} tone={i % 3} />));
  // фоновые фонари серединного района
  [[-18, 66], [18.5, 67.5], [-52, 77.5], [46.5, 73.5], [80, 84], [-84, 96], [12, 90], [104, 110]].forEach(([x, y]) =>
    addProp(x, y, LP, <StreetLamp x={0} y={0} />));
  // статичные горожане
  addProp(-10.8, 44.9, PS, <Person v={2} pose="stand" still />);
  addProp(14.5, 53.2, PS * 0.96, <Person v={3} pose="look" still />);
  addProp(16.4, 53.8, PS * 0.96, <Person v={1} pose="stand" still flip />);
  addProp(44, 38.4, PS, <Person v={6} pose="carry" still />);
  addProp(-56, 11.2, PS, <Person v={4} pose="sit" still />);
  addProp(-74, 58, PS * 0.96, <Person v={5} pose="look" still />);
  addProp(-24.5, 67, PS * 0.9, <Person v={7} pose="stand" still flip />);
  addProp(-22.6, 67.5, PS * 0.9, <Person v={0} pose="look" still />);
  // штендеры (diegetic-подписи мест)
  addProp(-45, 35.4, 0.54, <SidewalkBoard text="ЛАВКА" hidden={L('shop')} />);
  addProp(-24, 36.2, 0.54, <SidewalkBoard text="ЗАПЧАСТИ" hidden={L('parts')} />);
  addProp(44.5, 36.4, 0.54, <SidewalkBoard text="АУКЦИОН" hidden={L('city_warehouse')} />);
  addProp(75.5, 55.5, 0.54, <SidewalkBoard text="ГАРАЖ" hidden={L('garage')} />);
  addProp(-69.5, 57.2, 0.54, <SidewalkBoard text="УСАДЬБА" hidden={L('estate')} />);

  /* ---- жизнь: траектории (см. life.tsx) ---- */
  const walkers: (WalkerSpec & { key: string })[] = [
    { key: 'seller', v: 0, path: [[-44, 35.4], [-36, 34.8]], speed: 0.7, mode: 'pingpong', waits: [1.6, 2.2], phase: -2 },
    { key: 'passer', v: 3, path: [[-128, 15.2], [126, 12.8]], speed: 2.3, mode: 'pingpong', waits: [1, 2.6], phase: -6 },
    { key: 'elder', v: 1, role: 'elder', path: [[-6, 45.5], [24, 44.8], [24, 55], [-6, 55.8]], speed: 1.05, mode: 'pingpong', waits: [2.6, 1.6, 3, 1.6], phase: -4 },
    { key: 'child', v: 4, role: 'child', path: [[6, 53.4], [16.5, 50.8], [12, 56.6]], speed: 1.7, mode: 'pingpong', waits: [.8, 1.4, .8], phase: -1 },
    { key: 'worker', v: 6, path: [[86, 56], [64, 48], [50, 41.6]], speed: 1.6, mode: 'pingpong', waits: [2, 2.8], phase: -8 },
    { key: 'crosser', v: 2, path: [[21, 37.5], [23, 45], [19, 54]], speed: 1.45, mode: 'pingpong', waits: [1.8, 2.4], phase: -3 },
    { key: 'north', v: 5, path: [[8.5, 61], [11, 73], [7.5, 86]], speed: 1.9, mode: 'pingpong', waits: [1, 2], phase: -11 },
  ];

  /* ---- раскладка по полосам глубины ---- */
  const bandOf = (wy: number) => { for (let i = 0; i < D_BANDS.length; i++) if (wy < D_BANDS[i]) return i; return D_BANDS.length; };
  const buckets: { wy: number; node: React.ReactNode }[][] = Array.from({ length: D_BANDS.length + 1 }, () => []);
  ents.forEach(e => buckets[bandOf(e.wy)].push(e));
  const bandG = (i: number) => (
    <g key={`band${i}`} data-band={i}>
      {buckets[i].sort((a, b) => b.wy - a.wy).map((e, j) => <g key={j} data-wy={e.wy.toFixed(1)}>{e.node}</g>)}
    </g>
  );
  const nB = buckets.length;

  const road = (pts: W[], hw: number, col: string, curb = true) => (
    <path d={ribbonPath(cam, pts, hw)} fill={col} stroke={curb ? '#5f5647' : 'none'} strokeWidth={curb ? 1.6 : 0} strokeOpacity=".55" />
  );
  const walkway = (pts: W[], hw: number) => <path d={ribbonPath(cam, pts, hw)} fill="#c9b995" />;

  return <g>
    <CityDefs />
    <defs>
      <linearGradient id="c-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#aba287" /><stop offset=".14" stopColor="#9b9274" />
        <stop offset=".45" stopColor="#8c8264" /><stop offset=".78" stopColor="#7e7254" /><stop offset="1" stopColor="#716748" />
      </linearGradient>
      <linearGradient id="c-hz" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9d2d8" stopOpacity=".45" /><stop offset=".5" stopColor="#c9d2d8" stopOpacity=".2" /><stop offset="1" stopColor="#c9d2d8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="c-hz2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9d2d8" stopOpacity=".36" /><stop offset=".55" stopColor="#c9d2d8" stopOpacity=".15" /><stop offset="1" stopColor="#c9d2d8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="c-hz3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9d2d8" stopOpacity=".2" /><stop offset=".6" stopColor="#c9d2d8" stopOpacity=".07" /><stop offset="1" stopColor="#c9d2d8" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="c-rooftop" cx=".3" cy=".3" r=".9">
        <stop offset="0" stopColor="#ffe9b0" stopOpacity=".3" /><stop offset="1" stopColor="#241a10" stopOpacity=".22" />
      </radialGradient>
    </defs>

    {/* ===== небо (~17% кадра) ===== */}
    <rect width="1600" height="900" fill="url(#c-sky)" />
    <circle cx="236" cy="88" r="150" fill="url(#c-sun)" />
    <circle cx="236" cy="88" r="34" fill="#fff6cc" opacity=".95" />
    <g className="cloud" style={{ animationDuration: '95s' }} opacity=".75">
      <ellipse cx="430" cy="66" rx="70" ry="16" fill="#fff" opacity=".7" /><ellipse cx="482" cy="56" rx="44" ry="12" fill="#fff" opacity=".65" />
    </g>
    <g className="cloud" style={{ animationDuration: '135s', animationDelay: '-70s' }} opacity=".6">
      <ellipse cx="1060" cy="48" rx="84" ry="16" fill="#fff" opacity=".65" /><ellipse cx="1120" cy="38" rx="46" ry="11" fill="#fff" opacity=".6" />
    </g>
    <g className="cloud" style={{ animationDuration: '115s', animationDelay: '-30s' }} opacity=".55">
      <ellipse cx="1430" cy="80" rx="60" ry="13" fill="#fff" opacity=".65" />
    </g>
    {/* птицы над городом */}
    <g className="cw" style={{ animationName: 'cwR', animationDuration: '120s', animationDelay: '-30s', ['--from' as any]: '-120px', ['--to' as any]: '1720px' }}>
      <g transform="translate(0 196)"><path d="M0 0 q6 -6 12 0 q-6 -2 -12 0z M22 -8 q5 -5 10 0 q-5 -2 -10 0z M40 4 q5 -5 10 0 q-5 -2 -10 0z" fill="#5d6a74" opacity=".7" /></g>
    </g>
    <g className="cw" style={{ animationName: 'cwR', animationDuration: '160s', animationDelay: '-90s', ['--from' as any]: '1720px', ['--to' as any]: '-120px' }}>
      <g transform="translate(0 120) scale(-1 1)"><path d="M0 0 q5 -5 10 0 q-5 -2 -10 0z M18 -7 q4.4 -4.4 8.8 0 q-4.4 -1.8 -8.8 0z" fill="#5d6a74" opacity=".55" /></g>
    </g>
    {/* ===== земля ===== */}
    <rect x="0" y="148" width="1600" height="752" fill="url(#c-ground)" />
    {/* холмы и силуэт дальнего города у горизонта (поверх дальней земли) */}
    <path transform="translate(0 220) scale(1 .55) translate(0 -220)" d="M0 150 q110 -30 250 -16 q170 16 320 -10 q190 -30 360 0 q210 30 400 -14 q130 -22 270 8 v70 H0z" fill="#87989f" opacity=".7" />
    <g opacity=".9" fill="#6f8090" transform="translate(0 210) scale(1 .45) translate(0 -210)">
      <path d="M0 262 h40 v-12 h26 l9 -11 9 11 h24 v-15 h30 l11 -13 11 13 h26 v-9 h40 l7 -9 7 9 h32 v-13 h26 l9 -11 9 11 h36 v-7 h44 l9 -11 9 11 h30 v-12 h24 l8 -10 8 10 h34 v-8 h40 l9 -11 9 11 h28 v-13 h26 l9 -11 9 11 h36 v-7 h42 l8 -10 8 10 h30 v-12 h26 l9 -11 9 11 h38 v-8 h40 l9 -11 9 11 h30 v-9 h24 l8 -10 8 10 h34 v-13 h26 l9 -11 9 11 h36 v56 H0z" transform="translate(0 -52)" />
      <path d="M300 168 l8 -34 8 34z M1180 160 l10 -42 10 42z" />
      <rect x="640" y="152" width="7" height="22" /><rect x="910" y="146" width="6" height="20" />
    </g>
    <g opacity=".65" fill="#7d8c98" transform="translate(0 328) scale(1 .5) translate(0 -328)">
      <path d="M0 322 h58 v-13 h38 l11 -13 11 13 h34 v-10 h50 l10 -11 10 11 h42 v-8 h54 l11 -12 11 12 h38 v-11 h46 l10 -11 10 11 h42 v-9 h50 l11 -12 11 12 h38 v-12 h44 l10 -11 10 11 h46 v-8 h52 l11 -12 11 12 h40 v-10 h48 l10 -11 10 11 h44 v-9 h40 l10 -11 10 11 h48 v46 H0z" transform="translate(0 6)" />
    </g>
    <rect x="0" y="140" width="1600" height="80" fill="url(#c-hz)" opacity=".35" pointerEvents="none" />
    {/* зелёные участки и дворы */}
    <g>
      <polygon points={qw(cam, [[-210, -8], [210, -8], [210, 12.5], [-210, 12.5]])} fill="#77855a" />
      <polygon points={qw(cam, [[-210, -8], [210, -8], [210, 2], [-210, 2]])} fill="#6b7a50" opacity=".5" />
      <polygon points={qw(cam, [[-125, 33], [150, 31], [152, 45], [-127, 48]])} fill="#84905f" opacity=".85" />
      <polygon points={qw(cam, [[-96, 56], [-60, 56], [-58, 75], [-98, 77]])} fill="#7c8a5c" />
      <polygon points={qw(cam, [[66, 52], [102, 54], [104, 70], [68, 68]])} fill="#8d8064" />
      <polygon points={qw(cam, [[-42, 63], [-14, 63], [-16, 76], [-44, 76]])} fill="#81905e" />
      <polygon points={qw(cam, [[28, 63], [58, 65], [54, 78], [26, 76]])} fill="#81905e" />
      <polygon points={qw(cam, [[-170, 96], [170, 96], [196, 152], [-196, 152]])} fill="#8a9468" opacity=".45" />
      {/* поля-лоскуты дальней равнины */}
      <polygon points={qw(cam, [[-250, 180], [-140, 176], [-150, 240], [-256, 246]])} fill="#98a077" opacity=".3" />
      <polygon points={qw(cam, [[140, 176], [250, 180], [258, 246], [150, 240]])} fill="#a09468" opacity=".28" />
      <polygon points={qw(cam, [[-124, 260], [-20, 254], [-26, 322], [-132, 328]])} fill="#8f9a6e" opacity=".26" />
      <polygon points={qw(cam, [[20, 254], [124, 260], [132, 328], [26, 322]])} fill="#a89878" opacity=".22" />
      <polygon points={qw(cam, [[-256, 250], [-140, 246], [-148, 330], [-262, 336]])} fill="#a09468" opacity=".2" />
      <polygon points={qw(cam, [[150, 246], [262, 250], [270, 336], [158, 330]])} fill="#98a077" opacity=".2" />
      {/* полосы покоса на переднем лугу */}
      {[[-180, 40], [-90, 40], [0, 40], [90, 40], [160, 40]].map(([x, w], i) =>
        <polygon key={i} points={qw(cam, [[x, -8], [x + w, -8], [x + w, 12.5], [x, 12.5]])} fill="#82905e" opacity=".22" />)}
      {/* цветы на лугу */}
      {[[-44, 4], [-20, 8], [8, 3], [30, 9], [58, 5], [76, 8], [-70, 9], [104, 4]].map(([x, y], i) => {
        const d = decal(cam, x, y, 0.9);
        return <g key={i}>
          <ellipse cx={d.x} cy={d.y} rx={d.rx * 1.5} ry={d.ry * 1.5} fill="#6e8a56" opacity=".5" />
          <circle cx={d.x - 3} cy={d.y - 1} r={1.7 * d.s + 0.6} fill={['#d9784a', '#c8b898', '#b5533c', '#e8c9a8'][i % 4]} />
          <circle cx={d.x + 3.4} cy={d.y + 1} r={1.4 * d.s + 0.6} fill={['#e8c9a8', '#d9784a', '#e8c9a8', '#b5533c'][i % 4]} />
        </g>;
      })}
    </g>
    {/* дорожки грунта */}
    <path d={ribbonPath(cam, D_LANE, 2.2)} fill="#a89468" />
    <path d={ribbonPath(cam, D_ESTATE_WALK, 1.7)} fill="#b0a078" />
    {/* тротуары, затем мостовая */}
    {walkway(D_MAIN, 8.6)}
    {walkway(D_ALLEY_W, 6.1)}
    {walkway(D_ALLEY_E, 6.1)}
    {walkway(D_NORTH, 7)}
    {walkway(D_WEST_RD, 5.2)}
    {walkway(D_EAST_RD, 5.4)}
    {road(D_MAIN, 6, '#7d7462')}
    <path d={ribbonPath(cam, D_MAIN.map(([x, y]) => [x, y + 2.7] as W), 1.1)} fill="#6b6250" opacity=".3" />
    <path d={ribbonPath(cam, D_MAIN.map(([x, y]) => [x, y - 2.7] as W), 1.1)} fill="#6b6250" opacity=".3" />
    {road(D_ALLEY_W, 4.2, '#827964')}
    {road(D_ALLEY_E, 4.2, '#827964')}
    {road(D_NORTH, 5, '#82796a')}
    {road(D_WEST_RD, 3.6, '#8a7f6c')}
    {road(D_EAST_RD, 3.8, '#8a7f6c')}
    {road([[-240, 150], [240, 143]], 3, '#8a7f6c', false)}
    {road([[-260, 236], [260, 228]], 2.6, '#8a7f6c', false)}
    {[D_MAIN, D_ALLEY_W, D_ALLEY_E, D_NORTH].map((pts, i) =>
      <path key={`curb${i}`} d={ribbonPath(cam, pts, i === 0 ? 6 : i === 3 ? 5 : 4.2)} fill="none" stroke="#cdbd9c" strokeWidth="2" opacity=".45" />)}
    {/* связка площади с улицей */}
    <polygon points={qw(cam, [[-15, 32.5], [35, 31.8], [35.5, 38], [-15, 38.4]])} fill="#c2b292" />
    {/* площадь — горизонтальная поверхность в перспективе */}
    <polygon points={qw(cam, D_PLAZA)} fill="#b8a888" stroke="#9c8b6c" strokeWidth="2.4" />
    <g stroke="#a08f70" strokeWidth="1.1" opacity=".4">
      {Array.from({ length: 9 }).map((_, i) => {
        const wx = -15 + i * 6.25;
        const a = P(cam, wx, 37.6), b = P(cam, wx + 1.6, 61.2);
        return <path key={`v${i}`} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />;
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const wy = 40.5 + i * 4.8;
        const a = P(cam, -14.8, wy), b = P(cam, 35.8, wy - 0.8);
        return <path key={`h${i}`} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />;
      })}
    </g>
    {/* вход в лавку: дорожка от двери к тротуару */}
    <polygon points={qw(cam, [[-47.8, 33.2], [-40.6, 33.2], [-40, 36.4], [-47.2, 36.4]])} fill="#c2b292" />
    <polygon points={qw(cam, [[-46.6, 36.2], [-41.4, 36.2], [-41.8, 37.4], [-46.2, 37.4]])} fill="#b0a078" />
    <polygon points={qw(cam, [[-76, 37.6], [-68, 37.4], [-67.6, 39.4], [-75.6, 39.6]])} fill="#b0a078" />
    <polygon points={qw(cam, [[46, 36.8], [58, 36.4], [58.6, 38.6], [46.6, 39]])} fill="#b0a078" />
    {/* разметка и зебры */}
    <g>{dashes(cam, D_MAIN, { len: 2.4, gap: 2.8, op: .45 })}</g>
    <g>{dashes(cam, D_NORTH, { len: 2.4, gap: 3.8, w: .3, op: .35 })}</g>
    {crosswalk(cam, [-19.8, 22.9], [4.2, 9], 12.4, 6)}
    {crosswalk(cam, [36.2, 21.5], [4.5, 9.5], 12.4, 6)}
    {crosswalk(cam, [10, 59.6], [1, 6], 9, 5, 2.6)}
    {/* декали улицы: люки, лужи, трещины */}
    <ManholeD cam={cam} wx={-70} wy={23.4} /><ManholeD cam={cam} wx={5} wy={22.6} /><ManholeD cam={cam} wx={80} wy={21.9} />
    <ManholeD cam={cam} wx={-19} wy={16.5} /><ManholeD cam={cam} wx={34} wy={27} />
    <PuddleD cam={cam} wx={-24} wy={26.5} ru={2.6} /><PuddleD cam={cam} wx={52} wy={10} ru={3} /><PuddleD cam={cam} wx={26} wy={54} ru={1.6} />
    <g stroke="#5f5647" strokeWidth="1.4" opacity=".35" fill="none">
      <path d={`M${qw(cam, [[-60, 20], [-57.5, 21.4], [-55, 21]])}`} />
      <path d={`M${qw(cam, [[30, 25.4], [33.5, 24.4], [36, 25]])}`} />
      <path d={`M${qw(cam, [[10.4, 66], [11.6, 70], [10, 73]])}`} />
    </g>
    {/* клумбы площади */}
    {[[-11, 42], [31.5, 41], [-9.5, 59], [32, 58]].map(([x, y], i) => {
      const d = decal(cam, x, y, 2.1);
      return <g key={i}>
        <ellipse cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill="#8a7a5a" />
        <ellipse cx={d.x} cy={d.y} rx={d.rx * .82} ry={d.ry * .82} fill="#6e8a56" />
        <circle cx={d.x - d.rx * .3} cy={d.y - d.ry * .2} r={1.6 * d.s + .5} fill="#d9784a" />
        <circle cx={d.x + d.rx * .3} cy={d.y + d.ry * .2} r={1.5 * d.s + .5} fill="#e8c9a8" />
        <circle cx={d.x + d.rx * .1} cy={d.y - d.ry * .35} r={1.4 * d.s + .5} fill="#b5533c" />
      </g>;
    })}
    {/* тёплая лужа света из витрины лавки */}
    {!L('shop') && (() => { const d = decal(cam, -44, 35.2, 5.5); return <ellipse cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill="#ffd98a" opacity=".16" />; })()}

    {/* ===== тени зданий (на земле, под всеми объектами) ===== */}
    <g>{[...specs].sort((a, b) => b.c[1] - a.c[1]).map((sp, i) => <g key={i}>{bldShadow(cam, sp)}</g>)}</g>

    {/* ===== полосы глубины: дальние первыми, дымка между слоями ===== */}
    {bandG(nB - 1)}
    <rect x="0" y="126" width="1600" height="150" fill="url(#c-hz)" pointerEvents="none" />
    {bandG(nB - 2)}
    {bandG(nB - 3)}
    <rect x="0" y="128" width="1600" height="330" fill="url(#c-hz2)" pointerEvents="none" />
    {bandG(nB - 4)}
    <rect x="0" y="128" width="1600" height="400" fill="url(#c-hz3)" pointerEvents="none" />
    {Array.from({ length: nB - 4 }).map((_, i) => bandG(nB - 5 - i))}

    {/* ===== жизнь на траекториях ===== */}
    <g>
      {walkers.map(w => <PathWalker key={w.key} cam={cam} spec={w} bands={D_BANDS} />)}
      <PathCyclist cam={cam} bands={D_BANDS} spec={{ v: 7, path: [[-118, 31.6], [120, 29.4]], speed: 4.4, mode: 'pingpong', phase: -5 }} />
      <PathCar cam={cam} bands={D_BANDS} col="#8a4a3c" spec={{ path: [[-190, 26.6], [190, 24.2]], speed: 9, mode: 'loop' }} />
      <PathCar cam={cam} bands={D_BANDS} col="#5a5f7a" spec={{ path: [[190, 19.4], [-190, 21.8]], speed: 7.4, mode: 'loop', phase: -13 }} />
    </g>

    {/* ===== вечерний свет и виньетка ===== */}
    <rect y="866" width="1600" height="34" fill="#241a10" opacity=".16" pointerEvents="none" />
    <rect width="1600" height="900" fill="url(#c-dusk)" pointerEvents="none" />
  </g>;
}

/* ==================================================================
   PORTRAIT 800×1400 — самостоятельная композиция: камера смотрит
   вдоль улицы, уходящей от нижнего края в глубину; лавка и детали
   фланкируют улицу, площадь с фонтаном и аукцион — в её створе.
   ================================================================== */
const P_BANDS = [-8, 6, 20, 34, 48, 60, 74, 92, 116, 150];

const P_MAIN: W[] = [[2, -30], [1.5, -8], [0.5, 12], [-0.5, 32], [-1.5, 47]];
const P_NORTH: W[] = [[-1, 72], [1, 92], [0, 120], [2, 160], [0, 230]];
const P_EAST: W[] = [[26, 56], [44, 64], [62, 76]];
const P_WALK_W: W[] = [[-28, 64], [-46, 72], [-64, 82]];
const P_PLAZA: W[] = [[-30, 48], [26, 47], [28, 72], [-28, 73]];

function portSpecs(L: (id: string) => boolean): BldSpec[] {
  const S: BldSpec[] = [];
  S.push({
    id: 'shop', uid: 'p-shop', c: [-24, 14], w: 21, d: 14, h: 16.5, rot: 46,
    roof: 'gable', ridge: 'u', rh: 4.6, ov: 0.9, face: '#b0855a', side: '#6e5138',
    roofCol: '#8a5a44', roofLit: '#a06a4c', tex: 'plaster', facade: shopF(L('shop')), locked: L('shop'),
    onRoof: at => { const p = at(15, 8); return <Chimney x={p.x} y={p.y} s={p.s * 0.9} smoke={!L('shop')} />; },
  });
  S.push({
    id: 'parts', uid: 'p-parts', c: [26, 4], w: 16, d: 12, h: 12.5, rot: -42,
    roof: 'flat', face: '#4f6a6a', side: '#33484a', roofCol: '#3f5656', roofLit: '#4c6666',
    tex: 'paint', facade: partsF(L('parts')), locked: L('parts'),
  });
  S.push({
    id: 'city_warehouse', uid: 'p-wh', c: [2, 84], w: 26, d: 16, h: 20, rot: 3,
    roof: 'hip', rh: 4.4, ov: 0.9, face: '#8a5a44', side: '#5a3a2c', roofCol: '#4a3226', roofLit: '#5c4030',
    tex: 'brick', facade: warehouseF(L('city_warehouse')), locked: L('city_warehouse'),
    onRoof: at => { const p = at(7, 8); return <Chimney x={p.x} y={p.y} s={p.s * 0.8} smoke delay={0.8} />; },
  });
  S.push({
    id: 'estate', uid: 'p-estate', c: [-46, 58], w: 22, d: 14, h: 15, rot: 30,
    roof: 'hip', rh: 4, ov: 0.9, face: '#d4bc94', side: '#a08c68', roofCol: '#8a5a44', roofLit: '#9c664a',
    tex: 'plaster', facade: estateF(L('estate')), locked: L('estate'),
  });
  S.push({
    id: 'garage', uid: 'p-garage', c: [52, 58], w: 20, d: 14, h: 12.5, rot: -30,
    roof: 'flat', face: '#5d6a52', side: '#46523c', roofCol: '#4a5240', roofLit: '#59614e',
    tex: 'metal', facade: garageF(L('garage')), locked: L('garage'),
  });
  S.push({ uid: 'p-bakery', c: [-34, 32], w: 16, d: 12, h: 11.5, rot: 40, roof: 'gable', ridge: 'u', rh: 3.6, face: '#c8a070', side: '#8a6a48', roofCol: '#7c4a32', roofLit: '#94583c', facade: bakeryF(), onRoof: at => { const p = at(4, 7); return <Chimney x={p.x} y={p.y} s={p.s * 0.75} smoke delay={1.4} />; } });
  S.push({ uid: 'p-closed', c: [-30, -4], w: 14, d: 11, h: 11, rot: 44, roof: 'flat', face: '#8a8072', side: '#5d584c', roofCol: '#4a4238', tex: 'paint', facade: closedF() });
  S.push({ uid: 'p-clockm', c: [30, 26], w: 13, d: 11, h: 12, rot: -38, roof: 'gable', ridge: 'u', rh: 3.4, face: '#6e7f56', side: '#4a5a3c', roofCol: '#5a4632', roofLit: '#6e5638', tex: 'wood', facade: clockmakerF() });
  S.push({ uid: 'p-aptE', c: [40, 46], w: 16, d: 13, h: 17, rot: -26, roof: 'flat', face: '#a89878', side: '#78684c', roofCol: '#5d5240', tex: 'paint', facade: gridF(160, 170, { rows: 3, cols: 3, vs: ['lit', 'curtain', 'dark'] }) });
  S.push({ uid: 'p-tower', c: [16, 78], w: 8, d: 8, h: 34, rot: -4, roof: 'hip', rh: 7, ov: 0.6, face: '#b09878', side: '#8a7458', roofCol: '#6e4234', roofLit: '#7c4e3c', tex: 'stone', facade: towerF() });
  S.push({ uid: 'p-cafe', c: [-22, 88], w: 15, d: 11, h: 11, rot: 20, roof: 'gable', ridge: 'u', rh: 3.4, face: '#c8a070', side: '#8a6a48', roofCol: '#7c4a32', roofLit: '#94583c', facade: cafeF() });
  S.push({ uid: 'p-h1', c: [28, 88], w: 13, d: 11, h: 12, rot: -16, roof: 'gable', ridge: 'u', rh: 3.4, face: '#b09878', side: '#7c6a52', roofCol: '#7c4a32', roofLit: '#94583c', facade: gridF(130, 120, { rows: 2, cols: 3, vs: ['curtain', 'lit', 'flower'] }) });
  const bg: [number, number, number, number, number, 'flat' | 'gable'][] = [
    [-38, 102, 13, 11, 22, 'gable'], [46, 106, 13, 11, -20, 'gable'], [-16, 116, 12, 10, 14, 'flat'],
    [8, 120, 12, 10, -10, 'gable'], [30, 126, 12, 9.5, -16, 'flat'], [-40, 130, 12, 10, 18, 'gable'],
    [-4, 138, 11, 9, 8, 'flat'], [18, 144, 11, 9, -12, 'gable'],
  ];
  bg.forEach(([wx, wy, w, h, rot, roof], i) => {
    const k = 0.28 + i * 0.045;
    S.push({ uid: `pbg${i}`, c: [wx, wy], w, d: w * 0.8, h, rot, roof, ridge: i % 2 ? 'u' : 'v', rh: 3,
      face: hazy('#b09878', k), side: hazy('#78684c', k), roofCol: hazy('#7c4a32', k), roofLit: hazy('#94583c', k),
      facade: gridF(w * 10, h * 10, { rows: 2, cols: 3, vs: ['dark', 'curtain', 'lit'], door: false, frame: '#6e6250' }) });
  });
  const dist: [number, number, number, number][] = [
    [-56, 168, 12, 8], [-30, 176, 10, 7], [-6, 166, 11, 8], [18, 178, 10, 6.5],
    [42, 170, 12, 8], [62, 182, 10, 7], [-70, 190, 11, 7.5], [-44, 200, 10, 7],
    [-16, 194, 11, 7.5], [10, 204, 10, 7], [36, 196, 11, 7.5], [60, 208, 10, 6.5],
    [-40, 240, 10, 6], [-12, 248, 9, 5.5], [16, 242, 10, 6], [44, 250, 9, 5.5], [-64, 252, 9, 5.5], [66, 256, 9, 5.5],
  ];
  dist.forEach(([wx, wy, w, h], i) => {
    const k = 0.38 + (i % 3) * 0.06;
    S.push({ uid: `pdist${i}`, c: [wx, wy], w, d: w * 0.75, h, rot: (i % 5) * 6 - 12, roof: i % 2 ? 'gable' : 'flat', ridge: i % 4 < 2 ? 'u' : 'v', rh: 2.4, gableWin: false,
      face: hazy('#a89878', k), side: hazy('#78684c', k), roofCol: hazy(i % 3 === 0 ? '#6e7f8a' : '#7c4a32', k), roofLit: hazy('#94583c', k),
      facade: gridF(w * 10, h * 10, { rows: 1, cols: 3, vs: ['dark', 'curtain', 'lit'], door: false, frame: '#6e6250' }) });
  });
  return S;
}

export function CityMapPortrait({ lockedIds }: { lockedIds: Set<string> }) {
  const cam = CAM_PORT;
  const L = (id: string) => lockedIds.has(id);
  const specs = portSpecs(L);

  const ents: { wy: number; node: React.ReactNode }[] = [];
  const addE = (wy: number, node: React.ReactNode) => { ents.push({ wy, node }); };
  const addProp = (wx: number, wy: number, K: number, node: React.ReactNode, rot = 0) => {
    const p = P(cam, wx, wy);
    addE(wy, <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(p.s * K).toFixed(3)})${rot ? ` rotate(${rot})` : ''}`}>{node}</g>);
  };
  specs.forEach((sp, i) => {
    const wyF = sp.c[1] - sp.d / 2 + 0.4;
    const k = Math.max(0, Math.min(0.72, (sp.c[1] - 92) / 170));
    const el = <Bld cam={cam} sp={{ ...sp, uid: sp.uid || `px${i}` }} />;
    const wrapped = sp.id ? <g className={`building ${sp.locked ? 'locked' : ''}`} data-id={sp.id}>{el}</g> : el;
    addE(wyF, k > 0.02 ? <g style={hazeFilter(k)}>{wrapped}</g> : wrapped);
  });

  const LP = SPRITE_K.lamp, TR = SPRITE_K.tree, PS = SPRITE_K.person;
  // фонари вдоль улицы
  [[-9.5, 0], [-11, 22], [-12.5, 40], [11, -3], [10, 19], [8.5, 39]].forEach(([x, y]) => addProp(x, y, LP, <StreetLamp x={0} y={0} />));
  // площадь
  [[-28, 49.5], [24, 48.5], [26, 71], [-27, 71.5]].forEach(([x, y]) => addProp(x, y, LP, <StreetLamp x={0} y={0} />));
  addProp(-14, 60, SPRITE_K.fountain * 1.18, <Fountain x={0} y={0} />);
  addProp(-25, 55.5, SPRITE_K.stall, <Stall x={0} y={0} col="#b5533c" />);
  addProp(-24.5, 65.5, SPRITE_K.stall, <g transform="scale(-1 1)"><Stall x={0} y={0} col="#4f6a6a" /></g>);
  addProp(-5.5, 57.5, SPRITE_K.bench, <Bench x={0} y={0} />);
  addProp(-20.5, 63.5, SPRITE_K.bench, <Bench x={0} y={0} flip />);
  addE(49, <Bunting cam={cam} a={[-28, 49.5]} b={[24, 48.5]} hgt={7.2} sag={8} />);
  addE(71, <Bunting cam={cam} a={[-27, 71.5]} b={[26, 71]} hgt={7.2} sag={8} />);
  // деревья
  [[30, -14, 1.3], [-30, -16, 1.2], [-13.5, 9, .95], [12.5, 30, .95], [-15.5, 34, .95], [12, 2, .95],
  [-27.5, 50.5, .9], [24.5, 49.5, .9], [-26.5, 70, .9], [25, 69.5, .9],
  [-52, 52, .95], [-38, 50.5, .95], [-56, 62, .95], [-34, 76, .9], [40, 80, .9], [-8, 96, .9],
  [14, 100, .9], [-30, 110, .9], [34, 112, .9], [-58, 124, .9], [56, 126, .9]].forEach(([x, y, k], i) =>
    addProp(x, y, TR * (k as number), <Tree x={0} y={0} tone={i % 3} />));
  // передний план: крупный фонарь и провода через улицу
  addProp(-26, -8, LP * 1.15, <StreetLamp x={0} y={0} />);
  addProp(-12, -10, 0.68, <Pole x={0} y={0} />);
  addProp(12.5, -12, 0.68, <Pole x={0} y={0} />);
  addE(-12, <WireSpan cam={cam} a={[-12, -10]} b={[12.5, -12]} poleH={142} birds={2} />);
  addProp(-18, -13, SPRITE_K.bench, <Bench x={0} y={0} />);
  addProp(-14.6, -12.6, SPRITE_K.bin, <Bin x={0} y={0} />);
  addProp(20, -18, SPRITE_K.cat * 1.1, <Cat x={0} y={0} col="#7a6a4c" />);
  addProp(26, -18, 0.9, <Hedge x={0} y={0} w={90} />);
  addProp(-22, -20, 0.62, <g><Crate x={0} y={0} /><Barrel x={24} y={5} /></g>);
  addProp(7.6, -2.5, SPRITE_K.car * 1.08, <CarBack x={0} y={0} col="#5a5f7a" />);
  addProp(-13, 8, 0.7, <Fence x={0} y={0} n={5} />);
  addProp(-14.5, 28, 0.7, <Fence x={0} y={0} n={4} col="#7a6a4c" />);
  addProp(14.5, 6, 0.8, <Hedge x={0} y={0} w={70} />);
  addProp(16, 26, 0.8, <Hedge x={0} y={0} w={60} />);
  addProp(-21, -22, 0.75, <g>
    <rect x={-16} y={-40} width={32} height={40} rx={3} fill="#4f6a6a" />
    <rect x={-12} y={-34} width={24} height={16} rx={2} fill="#22303a" />
    <rect x={-10} y={-32} width={20} height={12} fill="url(#c-winglow)" opacity=".35" />
    <path d="M-18 -40 h36 l3 -7 h-42z" fill="#3f5656" />
  </g>);
  // гаражный двор
  addProp(48, 53.5, 0.5, <g><Crate x={0} y={0} /><Barrel x={22} y={4} /></g>);
  addProp(58, 62, SPRITE_K.truck, <Truck x={0} y={0} col="#8a6a48" />, -18);
  // склад: пандус и бочки
  addProp(-9, 77.5, 0.5, <g><Barrel x={0} y={0} /><Crate x={20} y={4} /></g>);
  // изгороди усадьбы
  addProp(-58, 66.5, 0.75, <Hedge x={0} y={0} w={80} />);
  addProp(-48, 67, 0.75, <Hedge x={0} y={0} w={70} />);
  // статичные горожане
  addProp(-26.4, 56.6, PS, <Person v={2} pose="stand" still />);
  addProp(-4.6, 56.4, PS * 0.96, <Person v={3} pose="look" still />);
  addProp(-6.4, 56.9, PS * 0.96, <Person v={1} pose="stand" still flip />);
  addProp(1, 77.6, PS, <Person v={6} pose="carry" still />);
  addProp(-40, 52.4, PS * 0.96, <Person v={5} pose="look" still flip />);
  // штендеры
  addProp(-15.5, 7.5, 0.54, <SidewalkBoard text="ЛАВКА" hidden={L('shop')} />);
  addProp(17.5, 1.5, 0.54, <SidewalkBoard text="ЗАПЧАСТИ" hidden={L('parts')} />);
  addProp(-3, 75.4, 0.54, <SidewalkBoard text="АУКЦИОН" hidden={L('city_warehouse')} />);
  addProp(43.5, 52.4, 0.54, <SidewalkBoard text="ГАРАЖ" hidden={L('garage')} />);
  addProp(-37.5, 51.8, 0.54, <SidewalkBoard text="УСАДЬБА" hidden={L('estate')} />);
  // дальние ориентиры
  addProp(-52, 122, 1.0, <WaterTower x={0} y={0} />);
  addProp(50, 132, 0.8, <Factory x={0} y={0} />);

  const walkers: (WalkerSpec & { key: string })[] = [
    { key: 'seller', v: 0, path: [[-15, 6.5], [-12.5, 16]], speed: 0.7, mode: 'pingpong', waits: [1.6, 2.2], phase: -2 },
    { key: 'crosser', v: 3, path: [[-14, -6.5], [16, -7.5]], speed: 1.5, mode: 'pingpong', waits: [2.4, 3], phase: -1 },
    { key: 'deep', v: 5, path: [[9, 30], [8, 10], [9.5, -8]], speed: 1.7, mode: 'pingpong', waits: [1.2, 2.4], phase: -6 },
    { key: 'elder', v: 1, role: 'elder', path: [[-22, 54], [-4, 53], [-4, 66], [-22, 67]], speed: 1.0, mode: 'pingpong', waits: [2.6, 1.6, 3, 1.6], phase: -3 },
    { key: 'child', v: 4, role: 'child', path: [[-10, 62], [-18, 58], [-12, 55.5]], speed: 1.6, mode: 'pingpong', waits: [.8, 1.4, .8], phase: -2 },
    { key: 'worker', v: 6, path: [[46, 52.5], [30, 51.5], [14, 53.5]], speed: 1.55, mode: 'pingpong', waits: [2, 2.8], phase: -9 },
    { key: 'north', v: 2, path: [[-0.5, 74], [1, 88], [0, 100]], speed: 1.8, mode: 'pingpong', waits: [1, 2], phase: -13 },
  ];

  const bandOf = (wy: number) => { for (let i = 0; i < P_BANDS.length; i++) if (wy < P_BANDS[i]) return i; return P_BANDS.length; };
  const buckets: { wy: number; node: React.ReactNode }[][] = Array.from({ length: P_BANDS.length + 1 }, () => []);
  ents.forEach(e => buckets[bandOf(e.wy)].push(e));
  const bandG = (i: number) => (
    <g key={`band${i}`} data-band={i}>
      {buckets[i].sort((a, b) => b.wy - a.wy).map((e, j) => <g key={j} data-wy={e.wy.toFixed(1)}>{e.node}</g>)}
    </g>
  );
  const nB = buckets.length;
  const road = (pts: W[], hw: number, col: string) => (
    <path d={ribbonPath(cam, pts, hw)} fill={col} stroke="#5f5647" strokeWidth="1.6" strokeOpacity=".55" />
  );
  const walkway = (pts: W[], hw: number) => <path d={ribbonPath(cam, pts, hw)} fill="#c9b995" />;

  return <g>
    <CityDefs />
    <defs>
      <linearGradient id="p-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#aba287" /><stop offset=".14" stopColor="#9b9274" />
        <stop offset=".45" stopColor="#8c8264" /><stop offset=".78" stopColor="#7e7254" /><stop offset="1" stopColor="#716748" />
      </linearGradient>
      <linearGradient id="p-hz" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9d2d8" stopOpacity=".45" /><stop offset=".5" stopColor="#c9d2d8" stopOpacity=".2" /><stop offset="1" stopColor="#c9d2d8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="p-hz2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9d2d8" stopOpacity=".36" /><stop offset=".55" stopColor="#c9d2d8" stopOpacity=".15" /><stop offset="1" stopColor="#c9d2d8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="p-hz3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9d2d8" stopOpacity=".2" /><stop offset=".6" stopColor="#c9d2d8" stopOpacity=".07" /><stop offset="1" stopColor="#c9d2d8" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* небо */}
    <rect width="800" height="1400" fill="url(#c-sky)" />
    <circle cx="148" cy="150" r="115" fill="url(#c-sun)" />
    <circle cx="148" cy="150" r="28" fill="#fff6cc" opacity=".95" />
    <g className="cloud" style={{ animationDuration: '100s' }} opacity=".7">
      <ellipse cx="330" cy="92" rx="60" ry="14" fill="#fff" opacity=".7" /><ellipse cx="378" cy="82" rx="38" ry="10" fill="#fff" opacity=".6" />
    </g>
    <g className="cloud" style={{ animationDuration: '140s', animationDelay: '-60s' }} opacity=".55">
      <ellipse cx="620" cy="60" rx="66" ry="14" fill="#fff" opacity=".6" />
    </g>
    <g className="cw" style={{ animationName: 'cwR', animationDuration: '110s', animationDelay: '-40s', ['--from' as any]: '-100px', ['--to' as any]: '900px' }}>
      <g transform="translate(0 200)"><path d="M0 0 q6 -6 12 0 q-6 -2 -12 0z M22 -8 q5 -5 10 0 q-5 -2 -10 0z M40 4 q5 -5 10 0 q-5 -2 -10 0z" fill="#5d6a74" opacity=".7" /></g>
    </g>
    {/* земля */}
    <rect x="0" y="234" width="800" height="1166" fill="url(#p-ground)" />
    {/* холмы + дальний город */}
    <path transform="translate(0 296) scale(1 .55) translate(0 -296)" d="M0 236 q90 -34 210 -20 q140 16 260 -8 q150 -26 330 4 v60 H0z" fill="#87989f" opacity=".7" />
    <g opacity=".88" fill="#6f8090" transform="translate(0 244) scale(1 .5) translate(0 -244)">
      <path d="M0 310 h34 v-10 h22 l8 -9 8 9 h20 v-13 h26 l9 -11 9 11 h22 v-8 h34 l6 -8 6 8 h28 v-11 h22 l8 -9 8 9 h30 v-6 h38 l8 -9 8 9 h26 v-10 h20 l7 -8 7 8 h30 v-7 h34 l8 -9 8 9 h24 v-11 h22 l8 -9 8 9 h32 v-6 h36 l7 -8 7 8 h26 v-10 h22 l8 -9 8 9 h30 v44 H0z" transform="translate(0 -66)" />
      <path d="M250 232 l7 -28 7 28z M620 226 l8 -34 8 34z" />
    </g>
    <g opacity=".62" fill="#7d8c98" transform="translate(0 308) scale(1 .5) translate(0 -308)">
      <path d="M0 330 h44 v-11 h30 l9 -11 9 11 h26 v-8 h38 l8 -10 8 10 h32 v-7 h40 l9 -10 9 10 h30 v-9 h36 l8 -9 8 9 h32 v-7 h38 l9 -10 9 10 h28 v-8 h34 l8 -9 8 9 h30 v-6 h36 l8 -9 8 9 h30 v40 H0z" transform="translate(0 -22)" />
    </g>
    <rect x="0" y="226" width="800" height="90" fill="url(#p-hz)" opacity=".35" pointerEvents="none" />
    {/* сады и дворы */}
    <polygon points={qw(cam, [[-64, -32], [-11, -32], [-13.5, 46], [-64, 46]])} fill="#77855a" />
    <polygon points={qw(cam, [[-60, -30], [-38, -30], [-40, 44], [-62, 44]])} fill="#82905e" opacity=".22" />
    <polygon points={qw(cam, [[-34, -30], [-14, -30], [-16, 44], [-36, 44]])} fill="#82905e" opacity=".16" />
    <polygon points={qw(cam, [[16, -30], [38, -30], [40, 44], [18, 44]])} fill="#82905e" opacity=".2" />
    <polygon points={qw(cam, [[13, -32], [64, -32], [64, 46], [11.5, 46]])} fill="#77855a" />
    <polygon points={qw(cam, [[-64, 50], [-30, 50], [-28, 78], [-64, 78]])} fill="#7c8a5c" />
    <polygon points={qw(cam, [[40, 48], [66, 50], [68, 72], [42, 70]])} fill="#8d8064" />
    {[[-40, -18], [-24, -6], [26, -20], [34, 4], [-34, 22], [22, 16]].map(([x, y], i) => {
      const d = decal(cam, x, y, 0.9);
      return <g key={i}>
        <ellipse cx={d.x} cy={d.y} rx={d.rx * 1.5} ry={d.ry * 1.5} fill="#6e8a56" opacity=".5" />
        <circle cx={d.x - 3} cy={d.y - 1} r={1.7 * d.s + .6} fill={['#d9784a', '#c8b898', '#b5533c', '#e8c9a8'][i % 4]} />
        <circle cx={d.x + 3.4} cy={d.y + 1} r={1.4 * d.s + .6} fill={['#e8c9a8', '#d9784a', '#e8c9a8', '#b5533c'][i % 4]} />
      </g>;
    })}
    {/* тротуары и мостовая */}
    {walkway(P_MAIN, 10)}
    {walkway(P_NORTH, 6.6)}
    {walkway(P_EAST, 4.6)}
    {walkway(P_WALK_W, 4.4)}
    {road(P_MAIN, 7.6, '#7d7462')}
    {road(P_NORTH, 4.8, '#82796a')}
    {road(P_EAST, 3.2, '#8a7f6c')}
    {road(P_WALK_W, 3, '#8a7f6c')}
    {/* площадь */}
    <polygon points={qw(cam, P_PLAZA)} fill="#b8a888" stroke="#9c8b6c" strokeWidth="2.4" />
    <g stroke="#a08f70" strokeWidth="1.1" opacity=".4">
      {Array.from({ length: 8 }).map((_, i) => {
        const wx = -30 + i * 8;
        const a = P(cam, wx, 47.6), b = P(cam, wx + 2, 72.6);
        return <path key={`v${i}`} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />;
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const wy = 52 + i * 4.6;
        const a = P(cam, -29.6, wy), b = P(cam, 27.6, wy - 1);
        return <path key={`h${i}`} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />;
      })}
    </g>
    {/* поля-лоскуты дальней равнины */}
    <polygon points={qw(cam, [[-76, 150], [-30, 146], [-34, 210], [-82, 214]])} fill="#98a077" opacity=".26" />
    <polygon points={qw(cam, [[30, 146], [76, 150], [82, 214], [34, 210]])} fill="#a09468" opacity=".24" />
    <polygon points={qw(cam, [[-26, 220], [10, 216], [8, 282], [-28, 286]])} fill="#8f9a6e" opacity=".22" />
    <polygon points={qw(cam, [[12, 216], [48, 220], [52, 286], [10, 282]])} fill="#a89878" opacity=".2" />
    {/* разметка, зебры, декали */}
    <g>{dashes(cam, P_MAIN, { len: 2.2, gap: 2.8, op: .45 })}</g>
    <g>{dashes(cam, P_NORTH, { len: 2.2, gap: 3.4, w: .3, op: .35 })}</g>
    {crosswalk(cam, [1.5, -6], [1, 0], 15, 7, 2.4)}
    {crosswalk(cam, [0, 45.5], [1, 0], 14, 6, 2.4)}
    <ManholeD cam={cam} wx={1} wy={4} /><ManholeD cam={cam} wx={0} wy={26} /><ManholeD cam={cam} wx={-1} wy={64} />
    <PuddleD cam={cam} wx={-2} wy={16} ru={2.2} /><PuddleD cam={cam} wx={-22} wy={-10} ru={2.6} />
    {!L('shop') && (() => { const d = decal(cam, -16, 9, 4.4); return <ellipse cx={d.x} cy={d.y} rx={d.rx} ry={d.ry} fill="#ffd98a" opacity=".15" />; })()}
    {/* тени */}
    <g>{[...specs].sort((a, b) => b.c[1] - a.c[1]).map((sp, i) => <g key={i}>{bldShadow(cam, sp)}</g>)}</g>
    {/* полосы глубины + дымка */}
    {bandG(nB - 1)}
    <rect x="0" y="218" width="800" height="175" fill="url(#p-hz)" pointerEvents="none" />
    {bandG(nB - 2)}
    {bandG(nB - 3)}
    <rect x="0" y="218" width="800" height="290" fill="url(#p-hz2)" pointerEvents="none" />
    {bandG(nB - 4)}
    <rect x="0" y="218" width="800" height="360" fill="url(#p-hz3)" pointerEvents="none" />
    {Array.from({ length: nB - 4 }).map((_, i) => bandG(nB - 5 - i))}
    {/* жизнь */}
    <g>
      {walkers.map(w => <PathWalker key={w.key} cam={cam} spec={w} bands={P_BANDS} />)}
      <PathCyclist cam={cam} bands={P_BANDS} spec={{ v: 7, path: [[-3, 36], [-1, 14], [0.5, -6], [1.5, -24]], speed: 3.8, mode: 'pingpong', phase: -4 }} />
    </g>
    {/* вечерний свет */}
    <rect y="1348" width="800" height="52" fill="#241a10" opacity=".16" pointerEvents="none" />
    <rect width="800" height="1400" fill="url(#c-dusk)" pointerEvents="none" />
  </g>;
}

/* ============================== ЯКОРЯ ============================== */
export function cityAnchors(portrait: boolean): CityAnchor[] {
  const cam = portrait ? CAM_PORT : CAM_DESK;
  const specs = portrait ? portSpecs(() => false) : deskSpecs(() => false);
  return specs.filter(s => s.id).map(s => ({ id: s.id as string, ...bldAnchor(cam, s) }));
}
