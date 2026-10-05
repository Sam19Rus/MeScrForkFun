/* kit.tsx — городской конструктор: единая перспектива (1-point, VP в горизонте),
   единый свет (низкое солнце слева → фасады тёплые, боковины в тени, тени вправо),
   единые материалы. Всё — параметрические SVG-примитивы, без растра. */
import React from 'react';

export const VPX = 800, VPY = 415;          // точка схода / горизонт (desktop)
export type VP = [number, number];
export const proj = (x: number, y: number, k: number, vp: VP = [VPX, VPY]): [number, number] =>
  [vp[0] + k * (x - vp[0]), vp[1] + k * (y - vp[1])];

/* ---------- геометрия коробки здания (oblique 2.5D) ----------
   Глубина — единый направленный вектор dv (вправо-вверх или влево-вверх,
   в сторону точки схода), без сходнения рёбер: объёмы читаются одинаково
   по всей карте, как в классической стилизованной диораме. */
export interface BoxGeom {
  x1: number; x2: number; yt: number; yb: number;         // передняя грань
  bx1: number; bx2: number; byt: number; byb: number;     // задняя грань = передняя + dv
  side: 'l' | 'r' | null; dvx: number; dvy: number;
}
export function boxGeom(x: number, y: number, w: number, h: number, depth = 26, vpx = 800): BoxGeom {
  const x1 = x - w / 2, x2 = x + w / 2, yt = y - h, yb = y;
  const side = x - vpx > w * 0.1 ? 'l' : vpx - x > w * 0.1 ? 'r' : null;
  const t = side === 'l' ? -1 : 1;
  const dvx = t * depth * 0.82, dvy = -depth * 0.5;
  return { x1, x2, yt, yb, bx1: x1 + dvx, bx2: x2 + dvx, byt: yt + dvy, byb: yb + dvy, side, dvx, dvy };
}
const q = (...pts: [number, number][]) => pts.map(p => p.join(',')).join(' ');

/* Боковина + крыша. type: flat | hip | gable */
export function Shell({ g, sideCol, roofCol, roofLit, type = 'hip', rh = 26, ov = 8 }: {
  g: BoxGeom; sideCol: string; roofCol: string; roofLit?: string; type?: 'flat' | 'hip' | 'gable'; rh?: number; ov?: number;
}) {
  const { x1, x2, yt, yb, bx1, bx2, byt, byb, side, dvx, dvy } = g;
  const roof = roofLit || roofCol;
  return <g>
    {side && (side === 'r'
      ? <polygon points={q([x2, yb], [x2, yt], [bx2, byt], [bx2, byb])} fill={sideCol} />
      : <polygon points={q([x1, yb], [x1, yt], [bx1, byt], [bx1, byb])} fill={sideCol} />)}
    {type === 'flat' && <>
      <polygon points={q([x1, yt], [x2, yt], [bx2, byt], [bx1, byt])} fill={roofCol} />
      <rect x={x1 - 3} y={yt - 7} width={x2 - x1 + 6} height={9} rx={2} fill={roof} />
    </>}
    {type === 'hip' && <>
      {/* конёк→зад */}
      <polygon points={q([x1 + ov * 2, yt - rh], [x2 - ov * 2, yt - rh], [bx2, byt], [bx1, byt])} fill={roofCol} />
      {/* передний скат */}
      <polygon points={q([x1 - ov, yt + 2], [x2 + ov, yt + 2], [x2 - ov * 2, yt - rh], [x1 + ov * 2, yt - rh])} fill={roof} />
      <path d={`M${x1 - ov} ${yt + 2} L${x2 + ov} ${yt + 2}`} stroke="rgba(30,18,8,.35)" strokeWidth="2.4" />
    </>}
    {type === 'gable' && (() => {
      const ax = (x1 + x2) / 2, ay = yt - rh;
      return <>
        <polygon points={q([x1 - ov, yt + 2], [ax, ay], [ax + dvx, ay + dvy], [bx1, byt])} fill={roof} />
        <polygon points={q([x2 + ov, yt + 2], [ax, ay], [ax + dvx, ay + dvy], [bx2, byt])} fill={roofCol} />
        <path d={`M${x1 - ov} ${yt + 2} L${ax} ${ay} L${x2 + ov} ${yt + 2}`} fill="none" stroke="rgba(30,18,8,.4)" strokeWidth="2.6" />
      </>;
    })()}
  </g>;
}

/* Длинная контактная тень здания вправо (солнце слева и низко). */
export function LongShadow({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const len = Math.min(300, h * 1.15 + w * 0.35);
  return <polygon points={q([x - w / 2 + 6, y], [x + w / 2, y], [x + w / 2 + len, y + 16], [x - w / 2 + 6 + len * 0.72, y + 16])}
    fill="url(#c-shad)" opacity=".5" />;
}
export function GroundShadow({ x, y, rx, ry = 4.5, o = .32 }: { x: number; y: number; rx: number; ry?: number; o?: number }) {
  return <ellipse cx={x + rx * 0.35} cy={y} rx={rx} ry={ry} fill="#241a10" opacity={o} />;
}
/* направленная тень вправо (вечернее солнце слева): клеится к основанию объекта */
export function DirShadow({ x, y, w, len, o = .5 }: { x: number; y: number; w: number; len: number; o?: number }) {
  return <polygon points={q([x - w / 2, y], [x + w / 2, y], [x + w / 2 + len, y + 7], [x - w / 2 + len * 0.8, y + 7])}
    fill="url(#c-shad)" opacity={o} />;
}

/* ---------- окна: набор вариаций ---------- */
export type WinV = 'lit' | 'dark' | 'curtain' | 'flower' | 'open' | 'poster' | 'shut';
export function Win({ x, y, w = 22, h = 30, v = 'dark', frame = '#3a2c1d', arc = false }: {
  x: number; y: number; w?: number; h?: number; v?: WinV; frame?: string; arc?: boolean;
}) {
  const glass = v === 'lit' ? '#ffd98a' : v === 'open' ? '#26313e' : '#39485a';
  return <g transform={`translate(${x} ${y})`}>
    {arc
      ? <path d={`M0 ${w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} h-${w} z`} fill={frame} />
      : <rect x={-1.6} y={-1.6} width={w + 3.2} height={h + 3.2} rx={2} fill={frame} />}
    {arc
      ? <path d={`M1.6 ${w / 2} a${w / 2 - 1.6} ${w / 2 - 1.6} 0 0 1 ${w - 3.2} 0 v${h - w / 2 - 1.6} h-${w - 3.2} z`} fill={glass} />
      : <rect x={0} y={0} width={w} height={h} fill={glass} />}
    {v === 'lit' && <rect x={0} y={0} width={w} height={h} fill="url(#c-winglow)" opacity=".9" />}
    {(v === 'dark' || v === 'open' || v === 'flower' || v === 'curtain') &&
      <path d={`M1 2 l${w - 2} ${h * 0.42} M1 ${h * 0.5} l${w * 0.6} ${h * 0.48}`} stroke="#cfe0ea" strokeWidth="1.4" opacity=".35" />}
    <path d={`M${w / 2} 0 v${h} M0 ${h / 2} h${w}`} stroke={frame} strokeWidth="1.8" opacity=".9" />
    {v === 'curtain' && <>
      <rect x={0.6} y={0.6} width={w * 0.24} height={h - 1.2} fill="#b0653c" opacity=".9" />
      <rect x={w * 0.7} y={0.6} width={w * 0.24} height={h - 1.2} fill="#b0653c" opacity=".9" />
      <path d={`M0.6 1 h${w - 1.2} v${h * 0.16} q-${w * 0.25} ${h * 0.1} -${w * 0.44} 0 q-${w * 0.25} ${h * 0.1} -${w * 0.44} 0z`} fill="#c87850" opacity=".9" />
    </>}
    {v === 'shut' && <>
      <rect x={-3} y={-2} width={(w + 6) / 2} height={h + 4} rx={1.4} fill="#5d6a52" />
      <rect x={(w) / 2 + 1} y={-2} width={(w + 6) / 2} height={h + 4} rx={1.4} fill="#556249" />
      <path d={`M-1 ${h * 0.3} h${w / 2 - 1} M-1 ${h * 0.62} h${w / 2 - 1} M${w / 2 + 3} ${h * 0.3} h${w / 2 - 1} M${w / 2 + 3} ${h * 0.62} h${w / 2 - 1}`} stroke="#46523c" strokeWidth="1.6" />
    </>}
    {v === 'flower' && <g transform={`translate(${w / 2} ${h + 2})`}>
      <path d={`M-${w / 2} 0 h${w} l-2 7 h-${w - 4} z`} fill="#7c4a32" />
      {[-6, 0, 6].map(dx => <circle key={dx} cx={dx} cy={-2.4} r={3} fill={dx ? '#b5533c' : '#d9784a'} />)}
      <path d="M-6 -1 q6 -5 12 0" stroke="#5c7a4a" strokeWidth="2" fill="none" />
    </g>}
    {v === 'poster' && <g>
      <rect x={2} y={3} width={w - 4} height={h - 6} fill="#e3d3b3" />
      <path d={`M4 8 h${w - 8} M4 13 h${w - 10} M4 18 h${w - 8}`} stroke="#8a4a32" strokeWidth="2" />
    </g>}
    {v === 'open' && <polygon points={`0,0 ${w * 0.55},-3 ${w * 0.55},${h * 0.6} 0,${h * 0.66}`} fill="#4a5a6a" opacity=".9" />}
  </g>;
}

/* ---------- двери ---------- */
export function Door({ x, y, w = 34, h = 62, col = '#5a4632', open = false, boarded = false, awning }: {
  x: number; y: number; w?: number; h?: number; col?: string; open?: boolean; boarded?: boolean; awning?: string;
}) {
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M0 0 v-${h - w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} z`} fill="#2a2018" />
    <path d={`M2 0 v-${h - w / 2 - 1} a${w / 2 - 2} ${w / 2 - 2} 0 0 1 ${w - 4} 0 v${h - w / 2 - 1} z`} fill={open ? '#171008' : col} />
    {!open && <><rect x={w * 0.16} y={-h * 0.62} width={w * 0.68} height={h * 0.24} rx={2} fill="rgba(255,230,170,.16)" />
      <circle cx={w * 0.8} cy={-h * 0.42} r={2.4} fill="#d9b23f" /></>}
    {open && <path d={`M2 0 v-${h - w / 2 - 1} a${w / 2 - 2} ${w / 2 - 2} 0 0 1 ${w - 4} 0 v${h - w / 2 - 1} z`} fill="url(#c-doorwarm)" />}
    {boarded && <>
      <path d={`M-4 -${h * 0.3} l${w + 8} -7 M-4 -${h * 0.62} l${w + 8} 6`} stroke="#a08054" strokeWidth="6" strokeLinecap="round" />
      <path d={`M-4 -${h * 0.3} l${w + 8} -7 M-4 -${h * 0.62} l${w + 8} 6`} stroke="#6e5638" strokeWidth="1.6" />
    </>}
    {awning && <path d={`M-6 -${h + 4} h${w + 12} l5 13 h-${w + 22} z`} fill={awning} />}
    <path d={`M-3 0 h${w + 6} v3 h-${w + 6} z`} fill="#8a7a5a" />
  </g>;
}

/* ---------- вывески ---------- */
export function SignBoard({ x, y, w = 120, h = 26, text, bg = '#241a12', fg = '#f2d788', fs = 14, tilt = 0 }: {
  x: number; y: number; w?: number; h?: number; text: string; bg?: string; fg?: string; fs?: number; tilt?: number;
}) {
  return <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={bg} stroke="#d9b23f" strokeWidth="1.8" />
    <rect x={-w / 2 + 2.5} y={-h / 2 + 2.5} width={w - 5} height={h - 5} rx={3} fill="none" stroke="rgba(217,178,63,.4)" strokeWidth="1" />
    <text textAnchor="middle" y={fs * 0.36} fontSize={fs} fontFamily="Georgia, serif" fill={fg} letterSpacing="2" fontWeight="bold">{text}</text>
  </g>;
}
/* вертикальная мачта-вывеска (diegetic-маркер места) */
export function SignMast({ x, y, h = 90, text, col = '#b5533c' }: { x: number; y: number; h?: number; text: string; col?: string }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect x={-3} y={-h} width={6} height={h} fill="#3a2c1d" />
    <path d={`M-3 -${h} h-4 M-3 -${h + 10} h-4`} stroke="#3a2c1d" strokeWidth="3" />
    <g transform={`translate(-9 -${h + 4})`}>
      <rect x={-16} y={0} width={32} height={text.length * 15 + 14} rx={4} fill={col} stroke="#241a12" strokeWidth="2" />
      {text.split('').map((ch, i) => <text key={i} textAnchor="middle" x={0} y={15 + i * 15} fontSize={13} fontFamily="Georgia, serif" fill="#f6e7c2" fontWeight="bold">{ch}</text>)}
    </g>
  </g>;
}

/* ---------- уличные объекты ---------- */
export function Tree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) {
  const g1 = ['#5c7a4a', '#4f6a3f', '#6e8a56'][tone % 3], g2 = ['#6e8a56', '#5c7a4a', '#7c9464'][tone % 3];
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={2} rx={34} ry={7} o={.3} />
    <path d="M-6 0 q-2 -26 -4 -40 l10 0 q-2 14 -0 40z" fill="#5d4630" />
    <path d="M-2 -34 q-12 -8 -18 -18 M2 -40 q10 -6 16 -16" stroke="#5d4630" strokeWidth="4.5" fill="none" />
    <g className="leaf-sway" style={{ transformOrigin: '0px -60px' }}>
      <circle cx={-16} cy={-64} r={24} fill={g1} /><circle cx={18} cy={-70} r={26} fill={g2} />
      <circle cx={0} cy={-88} r={24} fill={g1} /><circle cx={-2} cy={-62} r={20} fill={g2} opacity=".9" />
      <circle cx={-14} cy={-84} r={12} fill="#8aa870" opacity=".55" />
    </g>
  </g>;
}
export function StreetLamp({ x, y, s = 1, lit = true }: { x: number; y: number; s?: number; lit?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={10} ry={3} />
    <path d="M-7 0 h14 l-3 -12 h-8z" fill="#26241e" />
    <rect x={-2.6} y={-118} width={5.2} height={108} rx={2} fill="#2c2a24" />
    <path d="M-2.6 -104 q-14 -4 -16 -18 M2.6 -104 q14 -4 16 -18" stroke="#2c2a24" strokeWidth="3" fill="none" />
    <g transform="translate(0 -128)">
      <path d="M-8 10 q8 -16 16 0 l-3 6 h-10z" fill="#26241e" />
      <circle cx={0} cy={12} r={5.4} fill={lit ? '#ffe9a3' : '#8a8a7a'} />
      {lit && <circle cx={0} cy={12} r={17} fill="url(#c-lamp)" opacity=".8" />}
      <path d="M-2 -6 q2 -5 4 0z" fill="#26241e" />
    </g>
  </g>;
}
export function Bench({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <GroundShadow x={0} y={1} rx={30} ry={4} />
    <path d="M-26 0 v-14 M26 0 v-14" stroke="#33302a" strokeWidth="4" />
    <path d="M-30 -14 h60 v5 h-60z M-30 -23 h60 v5 h-60z" fill="#8a6a48" />
    <path d="M-30 -34 h60 v4.6 h-60z M-26 -34 v10 M26 -34 v10" fill="#8a6a48" stroke="#8a6a48" strokeWidth="2.4" />
  </g>;
}
export function Bin({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={11} ry={3} />
    <rect x={-10} y={-26} width={20} height={26} rx={4} fill="#4f6a6a" />
    <ellipse cx={0} cy={-26} rx={10} ry={3.6} fill="#3f5656" />
    <path d="M-10 -17 h20" stroke="#33484a" strokeWidth="2" />
  </g>;
}
export function Bike({ x, y, s = 1, col = '#7c2a1c' }: { x: number; y: number; s?: number; col?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={24} ry={3.4} />
    <circle cx={-16} cy={-11} r={11} fill="none" stroke="#2a2620" strokeWidth="3" />
    <circle cx={16} cy={-11} r={11} fill="none" stroke="#2a2620" strokeWidth="3" />
    <path d="M-16 -11 l7 -15 h17 l8 15 M-9 -26 l-3 -8 M8 -26 l5 -9 h6" stroke={col} strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M-12 -34 h8 M20 -36 h6" stroke="#2a2620" strokeWidth="3" strokeLinecap="round" />
    <circle cx={-16} cy={-11} r={2.2} fill="#8d887c" /><circle cx={16} cy={-11} r={2.2} fill="#8d887c" />
  </g>;
}
export function Car({ x, y, s = 1, col = '#6e7f8a', flip = false }: { x: number; y: number; s?: number; col?: string; flip?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <GroundShadow x={0} y={1} rx={46} ry={6} o={.36} />
    <path d="M-44 -8 q-3 -14 6 -16 l10 -2 q6 -12 16 -13 h18 q10 1 15 12 l12 3 q8 2 7 16z" fill={col} />
    <path d="M-26 -26 q5 -10 14 -11 h16 q8 1 12 10z" fill="#bcd4de" opacity=".85" />
    <path d="M-4 -37 v11" stroke={col} strokeWidth="3" />
    <circle cx={-26} cy={-8} r={9} fill="#22201c" /><circle cx={26} cy={-8} r={9} fill="#22201c" />
    <circle cx={-26} cy={-8} r={4} fill="#8d887c" /><circle cx={26} cy={-8} r={4} fill="#8d887c" />
    <path d="M40 -18 h4 v5 h-4z" fill="#ffe9a3" />
    <path d="M-44 -18 h3 v5 h-3z" fill="#c86a4a" />
    <path d="M-44 -12 h88" stroke="rgba(255,255,255,.14)" strokeWidth="2" />
  </g>;
}
export function Truck({ x, y, s = 1, col = '#8a6a48' }: { x: number; y: number; s?: number; col?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={56} ry={7} o={.36} />
    <rect x={-52} y={-46} width={70} height={38} rx={4} fill={col} />
    {[-40, -28, -16, -4, 8].map(x => <path key={x} d={`M${x} -44 v34`} stroke="rgba(30,18,8,.16)" strokeWidth="2" />)}
    <path d="M-52 -46 h70" stroke="rgba(255,236,190,.28)" strokeWidth="2" />
    <path d="M-52 -14 h3 v5 h-3z" fill="#b5533c" />
    <path d="M-52 -26 h70" stroke="rgba(30,18,8,.25)" strokeWidth="2.4" />
    <path d="M18 -8 v-34 q0 -4 4 -4 h16 q4 0 6 4 l6 12 v22z" fill="#5d6a52" />
    <path d="M26 -10 v-28" stroke="rgba(18,18,14,.3)" strokeWidth="1.6" />
    <path d="M50 -12 h5 v5 h-5z" fill="#8d887c" />
    <path d="M24 -40 h14 l5 10 h-19z" fill="#bcd4de" opacity=".85" />
    <circle cx={-34} cy={-8} r={10} fill="#22201c" /><circle cx={30} cy={-8} r={10} fill="#22201c" />
    <circle cx={-34} cy={-8} r={4.4} fill="#8d887c" /><circle cx={30} cy={-8} r={4.4} fill="#8d887c" />
    <path d="M48 -20 h4 v6 h-4z" fill="#ffe9a3" />
  </g>;
}
export function CarBack({ x, y, s = 1, col = '#6e7f8a' }: { x: number; y: number; s?: number; col?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx="1" cy="1" rx="24" ry="5" fill="#241a10" opacity=".34" />
    {/* корпус сзади */}
    <path d="M-22 -6 q-2 -16 3 -18 h38 q5 2 3 18z" fill={col} />
    <path d="M-17 -24 q2 -9 6 -10 h22 q4 1 6 10z" fill={col} />
    <path d="M-14 -25 q2 -7 5 -7.6 h18 q3 .6 5 7.6z" fill="#bcd4de" opacity=".85" />
    <circle cx="-16" cy="-9" r="8.4" fill="#22201c" /><circle cx="16" cy="-9" r="8.4" fill="#22201c" />
    <circle cx="-16" cy="-9" r="3.6" fill="#8d887c" /><circle cx="16" cy="-9" r="3.6" fill="#8d887c" />
    <path d="M-21 -14 h5 v4 h-5z" fill="#c86a4a" /><path d="M16 -14 h5 v4 h-5z" fill="#c86a4a" />
    <rect x="-5" y="-15" width="10" height="6" rx="1.4" fill="#e3d3b3" />
    <path d="M-22 -8 h44" stroke="rgba(255,255,255,.14)" strokeWidth="1.8" />
  </g>;
}
export function Crate({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={15} ry={3} />
    <rect x={-14} y={-24} width={28} height={24} rx={2} fill="#a67c52" stroke="#5a4632" strokeWidth="2" />
    <path d="M-14 -24 l28 24 M14 -24 l-28 24 M-14 -12 h28" stroke="#c8a97e" strokeWidth="2.4" />
  </g>;
}
export function Barrel({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={11} ry={3} />
    <rect x={-10} y={-30} width={20} height={30} rx={5} fill="#5d584c" />
    <path d="M-10 -22 h20 M-10 -10 h20" stroke="#3a3630" strokeWidth="2.2" />
    <ellipse cx={0} cy={-30} rx={10} ry={3.4} fill="#7a7568" />
  </g>;
}
export function Mailbox({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={7} ry={2.4} />
    <rect x={-2} y={-22} width={4} height={22} fill="#33484a" />
    <rect x={-8} y={-36} width={16} height={15} rx={3} fill="#3f5656" />
    <path d="M-8 -32 h16" stroke="#22303a" strokeWidth="2" />
  </g>;
}
export function PosterCol({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={15} ry={4} />
    <rect x={-13} y={-64} width={26} height={64} rx={3} fill="#6e5f42" />
    <path d="M-13 -50 l26 0 M-13 -26 l26 0" stroke="#57492f" strokeWidth="2" />
    <rect x={-11} y={-58} width={10} height={20} fill="#e3d3b3" transform="rotate(-2 -6 -48)" />
    <rect x={1} y={-46} width={10} height={18} fill="#c8b898" transform="rotate(2 6 -37)" />
    <path d="M-9 -54 h6 M-9 -50 h6 M3 -42 h6 M3 -38 h6" stroke="#8a4a32" strokeWidth="1.6" />
    <path d="M-16 -64 h32 l-4 -8 h-24z" fill="#46523c" />
  </g>;
}
export function Stall({ x, y, s = 1, col = '#b5533c' }: { x: number; y: number; s?: number; col?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={30} ry={5} />
    <rect x={-26} y={-30} width={52} height={30} rx={2} fill="#8a6a48" />
    <path d="M-26 -18 h52" stroke="#6e5638" strokeWidth="2.4" />
    <path d="M-24 -30 v-26 M24 -30 v-26" stroke="#5a4632" strokeWidth="3.4" />
    <path d="M-32 -56 h64 l4 12 h-72z" fill={col} />
    {[-24, -8, 8, 24].map((dx, i) => <path key={dx} d={`M${dx} -56 l-1.6 12`} stroke="#efe3cc" strokeWidth={i % 2 ? 0 : 7} />)}
    {/* товар на прилавке */}
    <circle cx={-14} cy={-33} r={4} fill="#c8a030" /><circle cx={-6} cy={-34} r={4} fill="#b5533c" /><circle cx={2} cy={-33} r={4} fill="#c8a030" />
    <rect x={8} y={-38} width={12} height={8} rx={2} fill="#4f6a6a" />
  </g>;
}
export function Fountain({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={2} rx={44} ry={9} o={.3} />
    <ellipse cx={0} cy={-4} rx={42} ry={12} fill="#8a8072" />
    <ellipse cx={0} cy={-7} rx={36} ry={9.4} fill="#5d7a88" />
    <ellipse cx={-8} cy={-8.6} rx={16} ry={3.4} fill="#a8c4cc" opacity=".7" />
    <rect x={-6} y={-34} width={12} height={28} rx={3} fill="#9a9082" />
    <ellipse cx={0} cy={-34} rx={13} ry={4.4} fill="#8a8072" />
    <g className="fount">
      <path d="M0 -36 q-8 -14 -14 -4 M0 -36 q8 -14 14 -4 M0 -36 q0 -18 0 -12" stroke="#cfe4ea" strokeWidth="2.6" fill="none" opacity=".85" />
    </g>
    <circle cx={0} cy={-40} r={3.4} fill="#cfe4ea" opacity=".8" />
  </g>;
}
export function Fence({ x, y, n = 8, s = 1, col = '#8a7a5a' }: { x: number; y: number; n?: number; s?: number; col?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: n }).map((_, i) => <path key={i} d={`M${i * 14} 0 v-24 l3.4 -5 3.4 5 v24z`} fill={col} />)}
    <path d={`M-2 -17 h${n * 14} M-2 -8 h${n * 14}`} stroke={col} strokeWidth="2.8" />
  </g>;
}
export function Hedge({ x, y, w = 90, s = 1 }: { x: number; y: number; w?: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={w / 2 - 10} y={1} rx={w / 2} ry={4} />
    {Array.from({ length: Math.round(w / 18) }).map((_, i) =>
      <circle key={i} cx={i * 18 + 4} cy={-9 - (i % 2) * 3} r={11} fill={i % 2 ? '#6e8a56' : '#5c7a4a'} />)}
    <circle cx={w * 0.4} cy={-14} r={8} fill="#7c9464" opacity=".9" />
    <circle cx={w * 0.7} cy={-11} r={6} fill="#8aa870" opacity=".7" />
  </g>;
}
export function Manhole({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse rx={20} ry={6.4} fill="#57504a" stroke="#3a3630" strokeWidth="2.4" />
    <path d="M-12 0 h24 M-8 -3 h16 M-8 3 h16" stroke="#3a3630" strokeWidth="1.6" />
  </g>;
}
export function Puddle({ x, y, rx = 60, ry = 10 }: { x: number; y: number; rx?: number; ry?: number }) {
  return <g>
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#7a98a8" opacity=".5" />
    <ellipse cx={x - rx * 0.2} cy={y - ry * 0.25} rx={rx * 0.5} ry={ry * 0.4} fill="#c8d8e8" opacity=".5" />
  </g>;
}
export function Cat({ x, y, s = 1, col = '#5d584c' }: { x: number; y: number; s?: number; col?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={11} ry={2.6} o={.28} />
    <ellipse rx={11} ry={6} fill={col} />
    <circle cx={-9} cy={-5} r={5} fill={col} />
    <path d="M-12.5 -8 l-1.6 -5 4 2.4 M-6 -9 l1 -5 3.4 4" fill={col} />
    <path d="M10 -2 q8 0 6 7" stroke={col} strokeWidth="3.4" fill="none" strokeLinecap="round" className="cat-tail" />
    <path d="M-11 -5 q1.6 1.6 3.2 0" stroke="#241a12" strokeWidth="1" fill="none" />
  </g>;
}
export function Bird({ x, y, i = 0 }: { x: number; y: number; i?: number }) {
  return <g transform={`translate(${x} ${y})`} className={i === 1 ? 'bird-hop' : ''}>
    <ellipse rx={5.4} ry={4} fill={i % 2 ? '#5d584c' : '#7a7568'} />
    <circle cx={4.6} cy={-3} r={2.7} fill={i % 2 ? '#5d584c' : '#8d887c'} />
    <path d="M7 -3 l3.4 1 -3.4 1z" fill="#d9b23f" />
    <path d="M-4.6 -1.4 q-3 -3.4 -.6 -5" stroke="#5d584c" strokeWidth="1.6" fill="none" />
  </g>;
}
export function Chimney({ x, y, s = 1, smoke = true, delay = 0 }: { x: number; y: number; s?: number; smoke?: boolean; delay?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-8} y={-34} width={16} height={34} fill="#6e4f33" />
    <rect x={-11} y={-39} width={22} height={7} rx={2} fill="#5a4632" />
    {smoke && <>
      <g className="smoke-puff" style={{ animationDelay: `${delay}s` }}><circle cx={0} cy={-44} r={6} fill="#e8e0cc" opacity=".6" /></g>
      <g className="smoke-puff" style={{ animationDelay: `${delay + 1.4}s` }}><circle cx={3} cy={-48} r={5} fill="#e8e0cc" opacity=".5" /></g>
    </>}
  </g>;
}
export function Wires({ x1, y1, x2, y2, sag = 26, birds = 3 }: { x1: number; y1: number; x2: number; y2: number; sag?: number; birds?: number }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag;
  return <g>
    <path d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} stroke="#3a3226" strokeWidth="2" fill="none" opacity=".6" />
    <path d={`M${x1} ${y1 + 12} Q${mx} ${my + 12} ${x2} ${y2 + 12}`} stroke="#3a3226" strokeWidth="1.6" fill="none" opacity=".42" />
    {Array.from({ length: birds }).map((_, i) => {
      const t = 0.28 + i * 0.22;
      const bx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
      const by = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;
      return <Bird key={i} x={bx} y={by - 1} i={i} />;
    })}
  </g>;
}
export function Pole({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <GroundShadow x={0} y={1} rx={7} ry={2.4} />
    <rect x={-4} y={-210} width={8} height={210} rx={3} fill="#5c4f38" />
    <rect x={-3} y={-210} width={3} height={210} fill="#6e5f42" opacity=".8" />
    <path d="M-26 -198 h52 M-20 -184 h40" stroke="#5c4f38" strokeWidth="4.4" />
    <circle cx={-23} cy={-201} r={3} fill="#3a3226" /><circle cx={23} cy={-201} r={3} fill="#3a3226" />
  </g>;
}

/* ---------- дальний план: силуэты ---------- */
export function WaterTower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity=".85">
    <path d="M-16 0 l6 -54 M16 0 l-6 -54 M-13 -26 h26" stroke="#6e7a84" strokeWidth="4" fill="none" />
    <rect x={-20} y={-84} width={40} height={32} rx={4} fill="#7c8894" />
    <path d="M-22 -84 h44 l-6 -12 h-32z" fill="#6e7a84" />
    <path d="M-20 -70 h40" stroke="#6e7a84" strokeWidth="2.4" />
  </g>;
}
export function Factory({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity=".8">
    <path d="M-70 0 v-34 l22 -12 v12 l22 -12 v12 l22 -12 v46z" fill="#7c8894" />
    <rect x={26} y={-78} width={12} height={78} fill="#6e7a84" />
    <rect x={44} y={-64} width={10} height={64} fill="#76828c" />
    <g className="smoke-puff"><circle cx={32} cy={-84} r={7} fill="#dfe4e6" opacity=".55" /></g>
    <g className="smoke-puff" style={{ animationDelay: '1.8s' }}><circle cx={49} cy={-70} r={5.4} fill="#dfe4e6" opacity=".45" /></g>
    <path d="M-60 -14 h10 M-44 -14 h10 M-28 -14 h10" stroke="#5d6a74" strokeWidth="3" />
  </g>;
}
export function ClockTower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-22} y={-150} width={44} height={150} fill="#b09878" />
    <rect x={-22} y={-150} width={10} height={150} fill="#c8b090" opacity=".7" />
    <path d="M-26 -150 h52 l-8 -16 h-36z" fill="#8a5a44" />
    <path d="M-18 -166 l18 -26 18 26z" fill="#6e4234" />
    <circle cx={0} cy={-128} r={13} fill="#efe3cc" stroke="#5a4632" strokeWidth="2.6" />
    <path d="M0 -128 v-8 M0 -128 l5.6 3.4" stroke="#5a4632" strokeWidth="2" />
    <path d="M-10 -96 h20 M-10 -60 h20" stroke="#9a8468" strokeWidth="3" />
    <rect x={-7} y={-104} width={14} height={20} rx={6} fill="#5d5240" />
    <rect x={-7} y={-68} width={14} height={20} rx={6} fill="#5d5240" />
  </g>;
}

/* ---------- общие defs города ---------- */
export function CityDefs() {
  return <defs>
    <linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6f9cb8" /><stop offset=".45" stopColor="#aebc98" />
      <stop offset=".78" stopColor="#eed094" /><stop offset="1" stopColor="#f8e0a8" />
    </linearGradient>
    <radialGradient id="c-sun" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#fff6cc" stopOpacity=".95" /><stop offset=".45" stopColor="#ffe9a3" stopOpacity=".4" />
      <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="c-shad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#2a1c10" stopOpacity=".55" /><stop offset="1" stopColor="#2a1c10" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="c-road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#93876f" /><stop offset="1" stopColor="#6f6452" />
    </linearGradient>
    <linearGradient id="c-walk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#d2c09a" /><stop offset="1" stopColor="#aa9878" />
    </linearGradient>
    <radialGradient id="c-lamp" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#ffe9a3" stopOpacity=".85" /><stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="c-winglow" cx=".5" cy=".5" r=".7">
      <stop offset="0" stopColor="#fff2c0" /><stop offset="1" stopColor="#e8a84a" />
    </radialGradient>
    <linearGradient id="c-doorwarm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#1d1208" stopOpacity=".96" /><stop offset=".62" stopColor="#3a2416" stopOpacity=".95" />
      <stop offset="1" stopColor="#c87a2a" stopOpacity=".85" />
    </linearGradient>
    <linearGradient id="c-facadewarm" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#ffd98a" stopOpacity=".22" /><stop offset=".55" stopColor="#ffd98a" stopOpacity="0" />
      <stop offset="1" stopColor="#2a1c10" stopOpacity=".16" />
    </linearGradient>
    <linearGradient id="c-haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#cfd8dc" stopOpacity="0" /><stop offset=".45" stopColor="#cfd8dc" stopOpacity=".5" />
      <stop offset="1" stopColor="#cfd8dc" stopOpacity="0" />
    </linearGradient>
    <radialGradient id="c-dusk" cx=".3" cy=".34" r=".98">
      <stop offset="0" stopColor="#ffd98a" stopOpacity=".17" /><stop offset=".55" stopColor="#e8a860" stopOpacity=".05" />
      <stop offset="1" stopColor="#2a3a4a" stopOpacity=".2" />
    </radialGradient>
  </defs>;
}
