/* proj.tsx — проекция приподнятой 3/4-камеры (elevated 3/4 perspective city map).
   Городская поверхность живёт в мировых координатах (wx, wy):
     wx — вбок («восток» +), wy — в глубину экрана (0 = ближний край кадра, больше = дальше).
   Камера высоко и смотрит вниз под углом: одноточечная перспектива на плоскости земли.
     d(wy) = F / (F + wy)          — глубинный фактор (масштаб всего)
     y     = horizonY + A · d      — гиперболическое сжатие к горизонту
     x     = vpx + wx · Lx · d     — боковое сходнение к точке схода
     lift  = h · Lx · Vf · d       — экранные пиксели для мировой высоты h (Vf — стил. растяжение)
   Мировые прямые остаются прямыми на экране → дороги/площади = точные полигоны.
   Никакой строгой изометрии: здания можно поворачивать на произвольный угол. */

import React from 'react';

export interface Cam {
  vpx: number;      // боковая точка схода (px)
  horizonY: number; // линия горизонта (px)
  A: number;        // nearY − horizonY: экранный вылет ближней плоскости
  F: number;        // глубинный масштаб (в мировых единицах): d = F/(F+wy)
  Lx: number;       // px на мировую единицу в ближней плоскости (по x)
  Vf: number;       // вертикальное растяжение высот (стилизация)
}

/* desktop 1600×900: небо ~17%, город 75–85% кадра */
export const CAM_DESK: Cam = { vpx: 706, horizonY: 150, A: 765, F: 100, Lx: 9, Vf: 1.25 };
/* portrait 800×1400: отдельная композиция — улица уходит в глубину от нижнего края */
export const CAM_PORT: Cam = { vpx: 400, horizonY: 236, A: 690, F: 80, Lx: 7.4, Vf: 1.25 };

export type W = [number, number];           // мировая точка (wx, wy)
export interface PP { x: number; y: number; s: number }  // экран + глубинный масштаб

export const dAt = (cam: Cam, wy: number): number => cam.F / (cam.F + wy);
export function P(cam: Cam, wx: number, wy: number): PP {
  const d = dAt(cam, wy);
  return { x: cam.vpx + wx * cam.Lx * d, y: cam.horizonY + cam.A * d, s: d };
}
export const liftPx = (cam: Cam, h: number, wy: number): number => h * cam.Lx * cam.Vf * dAt(cam, wy);
/** экранные px на мировую единицу «в глубину» (для наземных овалов/декалей) */
export const groundRatio = (cam: Cam, wy: number): number => (cam.A / (cam.F * cam.Lx)) * dAt(cam, wy);
/** наземная декаль (люк, лужа, клумба): мировой радиус → экранный эллипс */
export function decal(cam: Cam, wx: number, wy: number, ru: number) {
  const p = P(cam, wx, wy);
  const rx = ru * cam.Lx * p.s;
  return { x: p.x, y: p.y, s: p.s, rx, ry: Math.max(0.6, rx * groundRatio(cam, wy)) };
}
/** точка на высоте h над землёй */
export function top(cam: Cam, wx: number, wy: number, h: number): { x: number; y: number } {
  const p = P(cam, wx, wy);
  return { x: p.x, y: p.y - liftPx(cam, h, wy) };
}

const f1 = (n: number) => Math.round(n * 10) / 10;
export const q = (...pts: { x: number; y: number }[]) => pts.map(p => `${f1(p.x)},${f1(p.y)}`).join(' ');
export const qw = (cam: Cam, pts: W[]) => q(...pts.map(([x, y]) => P(cam, x, y)));

/* ---------- дороги: лента вдоль мировой полилинии ---------- */
/** единичная нормаль к сегменту */
function segNormal(a: W, b: W): W {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
}
/** точки обеих кромок ленты (miter-стыки); hw — полуширина в мировых единицах */
export function ribbonEdges(pts: W[], hw: number | ((wy: number) => number)): { l: W[]; r: W[] } {
  const L: W[] = [], R: W[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const n0 = i === 0 ? segNormal(pts[0], pts[1]) : i === pts.length - 1 ? segNormal(pts[i - 1], pts[i]) : segNormal(a, b);
    const w = typeof hw === 'function' ? hw(pts[i][1]) : hw;
    L.push([pts[i][0] + n0[0] * w, pts[i][1] + n0[1] * w]);
    R.push([pts[i][0] - n0[0] * w, pts[i][1] - n0[1] * w]);
  }
  return { l: L, r: R };
}
/** полигон ленты (мировая полилиния → экранный path) */
export function ribbonPath(cam: Cam, pts: W[], hw: number | ((wy: number) => number)): string {
  const { l, r } = ribbonEdges(pts, hw);
  return `M${qw(cam, l)} L${qw(cam, [...r].reverse())} Z`;
}
/** семплы вдоль полилинии: t — мировая дистанция */
export function alongPath(pts: W[], dist: number): { p: W; dir: W } {
  let rest = dist;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6;
    if (rest <= seg || i === pts.length - 2) {
      const t = Math.min(1, Math.max(0, rest / seg));
      return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: [(b[0] - a[0]) / seg, (b[1] - a[1]) / seg] };
    }
    rest -= seg;
  }
  const a = pts[0], b = pts[1] || pts[0];
  return { p: a, dir: [Math.sign(b[0] - a[0]) || 1, 0] };
}
export function pathLen(pts: W[]): number {
  let l = 0;
  for (let i = 0; i < pts.length - 1; i++) l += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  return l;
}

/* ---------- штриховка/разметка ---------- */
/** пунктир осевой линии: мировые квадратики вдоль полилинии */
export function dashes(cam: Cam, pts: W[], opt: { len?: number; gap?: number; w?: number; fill?: string; op?: number } = {}) {
  const { len = 2.2, gap = 2.6, w = 0.34, fill = '#d8ccb0', op = 0.5 } = opt;
  const total = pathLen(pts);
  const out: React.ReactNode[] = [];
  for (let t = 1.5; t < total - 1; t += len + gap) {
    const a = alongPath(pts, t), b = alongPath(pts, Math.min(total, t + len));
    const n1 = segNormal(a.p, b.p);
    const p1: W = [a.p[0] + n1[0] * w / 2, a.p[1] + n1[1] * w / 2];
    const p2: W = [b.p[0] + n1[0] * w / 2, b.p[1] + n1[1] * w / 2];
    const p3: W = [b.p[0] - n1[0] * w / 2, b.p[1] - n1[1] * w / 2];
    const p4: W = [a.p[0] - n1[0] * w / 2, a.p[1] - n1[1] * w / 2];
    out.push(<polygon key={t} points={qw(cam, [p1, p2, p3, p4])} fill={fill} opacity={op} />);
  }
  return out;
}
/** зебра: полосы вдоль направления движения `along`, поперёк — `across` */
export function crosswalk(cam: Cam, c: W, along: W, acrossLen: number, n = 6, stripeLen = 3.4) {
  const al = Math.hypot(along[0], along[1]) || 1;
  const A: W = [along[0] / al, along[1] / al];
  const AC: W = [-A[1], A[0]];
  const sw = acrossLen / n * 0.56;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const off = ((i + 0.5) / n - 0.5) * acrossLen;
    const cx = c[0] + AC[0] * off, cy = c[1] + AC[1] * off;
    const pts: W[] = [
      [cx - A[0] * stripeLen / 2 - AC[0] * sw / 2, cy - A[1] * stripeLen / 2 - AC[1] * sw / 2],
      [cx + A[0] * stripeLen / 2 - AC[0] * sw / 2, cy + A[1] * stripeLen / 2 - AC[1] * sw / 2],
      [cx + A[0] * stripeLen / 2 + AC[0] * sw / 2, cy + A[1] * stripeLen / 2 + AC[1] * sw / 2],
      [cx - A[0] * stripeLen / 2 + AC[0] * sw / 2, cy - A[1] * stripeLen / 2 + AC[1] * sw / 2],
    ];
    out.push(<polygon key={i} points={qw(cam, pts)} fill="#d8ccb0" opacity=".42" />);
  }
  return <g>{out}</g>;
}

/* ---------- след здания на земле ---------- */
export function footprint(c: W, w: number, d: number, rotDeg = 0): { FL: W; FR: W; BR: W; BL: W; u: W; v: W } {
  const r = rotDeg * Math.PI / 180;
  const u: W = [Math.cos(r), Math.sin(r)];   // вдоль фасада
  const v: W = [-Math.sin(r), Math.cos(r)];  // в глубину (от камеры)
  const pt = (su: number, sv: number): W => [c[0] + u[0] * su + v[0] * sv, c[1] + u[1] * su + v[1] * sv];
  return { FL: pt(-w / 2, -d / 2), FR: pt(w / 2, -d / 2), BR: pt(w / 2, d / 2), BL: pt(-w / 2, d / 2), u, v };
}
/** выпуклая оболочка (для теней) */
export function hull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length < 3) return pts;
  const cross = (o: any, a: any, b: any) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: any[] = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper: any[] = [];
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

/* ---------- цвет: атмосферная перспектива ---------- */
function hex2rgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  const n = s.length === 3 ? s.split('').map(c => c + c).join('') : s;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
export function mixCol(a: string, b: string, t: number): string {
  const A = hex2rgb(a), B = hex2rgb(b);
  const c = A.map((v, i) => Math.round(v + (B[i] - v) * Math.min(1, Math.max(0, t))));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
const HAZE_COL = '#c3ccd2';
export const hazy = (col: string, k: number) => mixCol(col, HAZE_COL, k);

/* ---------- фильтры глубины (для дальних групп) ---------- */
export const hazeFilter = (k: number) =>
  k <= 0 ? undefined : { filter: `saturate(${(1 - 0.5 * k).toFixed(2)}) contrast(${(1 - 0.3 * k).toFixed(2)}) brightness(${(1 + 0.16 * k).toFixed(2)})` };
