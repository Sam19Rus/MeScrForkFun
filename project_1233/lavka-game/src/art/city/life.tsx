/* life.tsx — жизнь города в новой пространственной модели.
   Персонажи и машины НЕ скользят по экрану: у каждого есть траектория
   точка A → точка B в координатах городской поверхности (мир wx,wy).
   Каждый кадр: позиция по траектории → проекция → масштаб по глубине →
   ориентация по экранным dx/dy (left / right / front-¾ / back-¾) →
   шаги синхронны скорости. Слоирование: сущность переставляется в
   глубину-полосу (band) своего wy, поэтому люди честно проходят
   ЗА фонарями/машинами и ПЕРЕД кустами. */
import React, { useEffect, useRef, useState } from 'react';
import { Cam, P, W, alongPath, pathLen } from './proj';
import { Person, PersonFB, Cyclist } from './people';
import { Car } from './kit';

/* общий тикер: один rAF на всех */
type TickFn = (t: number) => void;
const subs = new Set<TickFn>();
let raf = 0, t0 = 0;
function tick(now: number) {
  if (!t0) t0 = now;
  const t = (now - t0) / 1000;
  subs.forEach(f => f(t));
  raf = requestAnimationFrame(tick);
}
function useTicker(fn: TickFn, active = true) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const f: TickFn = t => ref.current(t);
    subs.add(f);
    if (!raf) raf = requestAnimationFrame(tick);
    return () => { subs.delete(f); if (!subs.size) { cancelAnimationFrame(raf); raf = 0; } };
  }, [active]);
}

/* ?t=12.3 — детерминированный стоп-кадр жизни (QA) */
const FREEZE_T = (() => {
  try { const v = new URLSearchParams(location.search).get('t'); return v ? parseFloat(v) : null; } catch { return null; }
})();

/* ---------- траектории ---------- */
export interface Mover {
  path: W[];
  speed: number;           // мировых ед./с
  mode?: 'pingpong' | 'loop';
  waits?: number[];        // паузы (с) у каждой точки маршрута
}
function timeline(m: Mover) {
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < m.path.length - 1; i++) {
    const l = Math.hypot(m.path[i + 1][0] - m.path[i][0], m.path[i + 1][1] - m.path[i][1]);
    segs.push(l); total += l / m.speed + (m.waits?.[i + 1] || 0);
  }
  total += (m.waits?.[0] || 0);
  return { segs, total };
}
/** позиция на траектории в момент t; dir — мировое направление движения */
export function moverAt(m: Mover, time: number): { p: W; dir: W; moving: boolean } {
  const { segs, total } = timeline(m);
  let t = m.mode === 'loop' ? ((time % total) + total) % total : (() => {
    const cyc = total * 2; const ph = ((time % cyc) + cyc) % cyc;
    return ph <= total ? ph : cyc - ph;
  })();
  t -= (m.waits?.[0] || 0);
  if (t < 0) return { p: m.path[0], dir: [1, 0], moving: false };
  for (let i = 0; i < segs.length; i++) {
    const st = segs[i] / m.speed;
    if (t <= st || i === segs.length - 1) {
      const k = Math.min(1, t / (st || 1e-6));
      const a = m.path[i], b = m.path[i + 1];
      const dir: W = [(b[0] - a[0]) / (segs[i] || 1), (b[1] - a[1]) / (segs[i] || 1)];
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], dir, moving: t < st };
    }
    t -= st + (m.waits?.[i + 1] || 0);
    if (t < 0) return { p: m.path[i + 1], dir: [1, 0], moving: false };
  }
  return { p: m.path[m.path.length - 1], dir: [1, 0], moving: false };
}

/* ---------- ориентация по экранному направлению ---------- */
export type Facing = 'left' | 'right' | 'front' | 'back';
export function facingOf(cam: Cam, p: W, dir: W, moving: boolean): Facing | null {
  if (!moving) return null;
  const a = P(cam, p[0], p[1]);
  const b = P(cam, p[0] + dir[0] * 1.5, p[1] + dir[1] * 1.5);
  const dx = b.x - a.x, dy = b.y - a.y;
  const ang = Math.atan2(dy, dx) * 180 / Math.PI; // экранный угол (y вниз)
  if (ang > 58 && ang < 122) return 'front';       // вниз по экрану = к камере
  if (ang < -58 && ang > -122) return 'back';      // вверх = в глубину
  return dx >= 0 ? 'right' : 'left';
}

/* ---------- band-слоирование ---------- */
export function bandOf(bands: number[], wy: number): number {
  for (let i = 0; i < bands.length; i++) if (wy < bands[i]) return i;
  return bands.length;
}
export function placeInBand(node: SVGGElement | null, bands: number[], wy: number, prev: number): number {
  if (!node || !node.parentElement) return prev;
  const b = bandOf(bands, wy);
  if (b !== prev) {
    const host = node.ownerSVGElement?.querySelector(`[data-band="${b}"]`);
    if (host) host.appendChild(node);
    prev = b;
  }
  /* порядок внутри полосы: перед pierwszym более ближним соседом */
  const parent = node.parentElement;
  if (parent) {
    const sibs = Array.from(parent.children) as SVGGElement[];
    for (const s of sibs) {
      if (s === node) break;
      const swy = parseFloat(s.getAttribute('data-wy') || '9999');
      if (swy < wy) { parent.insertBefore(node, s); break; }
    }
  }
  return prev;
}

/* ---------- масштаб спрайтов (мир. высота → px kit-арта) ---------- */
export const SPRITE_K = {
  person: 0.78, child: 0.52, tree: 1.0, lamp: 0.86, car: 0.52, bike: 0.62,
  bench: 0.62, bin: 0.66, stall: 0.6, fountain: 0.62, crate: 0.6, barrel: 0.6,
  cat: 0.6, mailbox: 0.7, poster: 0.75, bikeRider: 0.62, truck: 0.56,
};

/* ================================================================== */
export interface WalkerSpec extends Mover {
  v: number;                 // вариант внешности
  role?: 'person' | 'child' | 'worker' | 'elder';
  phase?: number;            // сдвиг времени (рассинхрон)
}
export function PathWalker({ cam, spec, bands }: { cam: Cam; spec: WalkerSpec; bands: number[] }) {
  const gRef = useRef<SVGGElement | null>(null);
  const bandRef = useRef(-1);
  const [face, setFace] = useState<Facing>('right');
  const faceRef = useRef<Facing>('right');
  const step = 1.15 / spec.speed;  // период шага синхронен скорости
  useTicker((time) => {
    const g = gRef.current; if (!g) return;
    const { p, dir, moving } = moverAt(spec, time + (spec.phase || 0));
    const sp = P(cam, p[0], p[1]);
    const k = sp.s * (spec.role === 'child' ? SPRITE_K.child : SPRITE_K.person);
    g.setAttribute('transform', `translate(${sp.x.toFixed(1)} ${sp.y.toFixed(1)}) scale(${k.toFixed(3)})`);
    g.setAttribute('data-wy', p[1].toFixed(1));
    bandRef.current = placeInBand(g, bands, p[1], bandRef.current);
    const f = facingOf(cam, p, dir, moving);
    if (f && f !== faceRef.current) { faceRef.current = f; setFace(f); }
    g.setAttribute('data-moving', moving ? '1' : '0');
  }, FREEZE_T === null);
  /* стоп-кадр QA */
  useEffect(() => {
    if (FREEZE_T === null) return;
    const g = gRef.current; if (!g) return;
    const { p, dir, moving } = moverAt(spec, FREEZE_T + (spec.phase || 0));
    const sp = P(cam, p[0], p[1]);
    const k = sp.s * (spec.role === 'child' ? SPRITE_K.child : SPRITE_K.person);
    g.setAttribute('transform', `translate(${sp.x} ${sp.y}) scale(${k})`);
    g.setAttribute('data-wy', String(p[1]));
    bandRef.current = placeInBand(g, bands, p[1], bandRef.current);
    const f = facingOf(cam, p, dir, moving);
    if (f && f !== faceRef.current) { faceRef.current = f; setFace(f); }
  }, [FREEZE_T]);
  const child = spec.role === 'child';
  const elder = spec.role === 'elder';
  return <g ref={gRef} data-wy="999">
    {/* контактная + направленная тень (солнце слева) */}
    <ellipse cx="2" cy="1" rx={child ? 7 : 10} ry="2.8" fill="#241a10" opacity=".22" />
    <path d={`M-6 0 q6 -2 12 0 l${elder ? 18 : 24} 5 q-16 4 -34 -1z`} fill="#241a10" opacity=".14" />
    {(face === 'left' || face === 'right')
      ? <g className="passer2" style={{ ['--step' as any]: `${step}s`, transform: face === 'left' ? 'scaleX(-1)' : undefined }}>
        <Person v={spec.v} pose="walk" still child={child} elder={elder} noShadow />
      </g>
      : <g className="passer2" style={{ ['--step' as any]: `${step}s` }}>
        <PersonFB v={spec.v} view={face} child={child} elder={elder} />
      </g>}
  </g>;
}

/* ---------- велосипедист (боковая траектория) ---------- */
export function PathCyclist({ cam, spec, bands }: { cam: Cam; spec: Mover & { v: number; phase?: number }; bands: number[] }) {
  const gRef = useRef<SVGGElement | null>(null);
  const bandRef = useRef(-1);
  const [flip, setFlip] = useState(false);
  const flipRef = useRef(false);
  useTicker((time) => {
    const g = gRef.current; if (!g) return;
    const { p, dir, moving } = moverAt(spec, time + (spec.phase || 0));
    const sp = P(cam, p[0], p[1]);
    const k = sp.s * SPRITE_K.bikeRider;
    g.setAttribute('transform', `translate(${sp.x.toFixed(1)} ${sp.y.toFixed(1)}) scale(${k.toFixed(3)})`);
    g.setAttribute('data-wy', p[1].toFixed(1));
    bandRef.current = placeInBand(g, bands, p[1], bandRef.current);
    const a = P(cam, p[0], p[1]), b = P(cam, p[0] + dir[0], p[1] + dir[1]);
    const f = (b.x - a.x) < 0;
    if (f !== flipRef.current && moving) { flipRef.current = f; setFlip(f); }
  }, FREEZE_T === null);
  useEffect(() => {
    if (FREEZE_T === null) return;
    const g = gRef.current; if (!g) return;
    const { p } = moverAt(spec, FREEZE_T + (spec.phase || 0));
    const sp = P(cam, p[0], p[1]);
    g.setAttribute('transform', `translate(${sp.x} ${sp.y}) scale(${sp.s * SPRITE_K.bikeRider})`);
    g.setAttribute('data-wy', String(p[1]));
    bandRef.current = placeInBand(g, bands, p[1], bandRef.current);
  }, [FREEZE_T]);
  return <g ref={gRef} data-wy="999">
    <g style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <Cyclist v={spec.v} />
    </g>
  </g>;
}

/* ---------- машина по улице: угол соответствует направлению улицы ---------- */
export function PathCar({ cam, spec, bands, col }: { cam: Cam; spec: Mover & { phase?: number }; bands: number[]; col: string }) {
  const gRef = useRef<SVGGElement | null>(null);
  const bandRef = useRef(-1);
  const [flip, setFlip] = useState(false);
  const flipRef = useRef(false);
  useTicker((time) => {
    const g = gRef.current; if (!g) return;
    const { p, dir } = moverAt(spec, time + (spec.phase || 0));
    const sp = P(cam, p[0], p[1]);
    const k = sp.s * SPRITE_K.car;
    /* экранный угол улицы в этой точке — машина наклонена по улице */
    const a = P(cam, p[0] - dir[0] * 2, p[1] - dir[1] * 2);
    const b = P(cam, p[0] + dir[0] * 2, p[1] + dir[1] * 2);
    let ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const toLeft = (b.x - a.x) < 0;
    if (toLeft) ang = ang > 0 ? ang - 180 : ang + 180;
    if (toLeft !== flipRef.current) { flipRef.current = toLeft; setFlip(toLeft); }
    g.setAttribute('transform',
      `translate(${sp.x.toFixed(1)} ${sp.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${k.toFixed(3)})`);
    g.setAttribute('data-wy', p[1].toFixed(1));
    bandRef.current = placeInBand(g, bands, p[1], bandRef.current);
  }, FREEZE_T === null);
  useEffect(() => {
    if (FREEZE_T === null) return;
    const g = gRef.current; if (!g) return;
    const { p, dir } = moverAt(spec, FREEZE_T + (spec.phase || 0));
    const sp = P(cam, p[0], p[1]);
    const a = P(cam, p[0] - dir[0] * 2, p[1] - dir[1] * 2);
    const b = P(cam, p[0] + dir[0] * 2, p[1] + dir[1] * 2);
    let ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    if ((b.x - a.x) < 0) ang = ang > 0 ? ang - 180 : ang + 180;
    g.setAttribute('transform', `translate(${sp.x} ${sp.y}) rotate(${ang}) scale(${sp.s * SPRITE_K.car})`);
    g.setAttribute('data-wy', String(p[1]));
    bandRef.current = placeInBand(g, bands, p[1], bandRef.current);
  }, [FREEZE_T]);
  return <g ref={gRef} data-wy="999">
    <Car x={0} y={0} col={col} flip={flip} />
  </g>;
}
