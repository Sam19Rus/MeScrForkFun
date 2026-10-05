/* blocks.tsx — здания как настоящие объёмы в проекции приподнятой камеры:
   footprint на земле → передняя стена + видимая боковина + полноценная крыша
   (плоская с парапетом / вальмовая / щипцовая с видимым коньком и скатами).
   Фасады рисуются в локальных координатах (X: 0..w·FS слева направо, Y: 0..h·FS
   от конька/карниза вниз до земли) и отображаются на стену кусочно-аффинными
   полосами с точным клипом — перспектива стен честная, контент переиспользует kit. */
import React from 'react';
import { Cam, P, liftPx, footprint, hull, mixCol, q, W, PP } from './proj';
import { Win, Door, SignBoard, Chimney, WinV } from './kit';

export const FS = 10;    // px локального фасада на мировую единицу ширины
export const FSS = 8;    // px локальной боковины на мировую единицу глубины

/* ---------- материалы (перенесены из v0.7, единая палитра) ---------- */
export type TexKind = 'plaster' | 'brick' | 'brickB' | 'wood' | 'stone' | 'metal' | 'paint';
export function Tex({ kind, x1, yt, w, h }: { kind: TexKind; x1: number; yt: number; w: number; h: number }) {
  if (kind === 'brick' || kind === 'brickB') {
    const a = kind === 'brick' ? 'rgba(60,26,16,.28)' : 'rgba(120,96,64,.3)';
    return <g opacity=".8">{Array.from({ length: Math.floor(h / 12) }).map((_, r) =>
      <path key={`r${r}`} d={`M${x1} ${yt + r * 12} h${w}`} stroke={a} strokeWidth="1.4" />)}
      {Array.from({ length: Math.floor(h / 12) }).map((_, r) =>
        Array.from({ length: Math.floor(w / 26) }).map((_, c) =>
          <path key={`${r}-${c}`} d={`M${x1 + c * 26 + (r % 2) * 13} ${yt + r * 12} v12`} stroke={a} strokeWidth="1.2" />))}
    </g>;
  }
  if (kind === 'wood') return <g opacity=".55">{Array.from({ length: Math.floor(w / 16) }).map((_, i) =>
    <path key={i} d={`M${x1 + i * 16} ${yt} v${h}`} stroke="rgba(50,30,14,.4)" strokeWidth="1.6" />)}</g>;
  if (kind === 'metal') return <g opacity=".6">{Array.from({ length: Math.floor(w / 14) }).map((_, i) =>
    <path key={i} d={`M${x1 + i * 14 + 4} ${yt + 4} v${h - 8}`} stroke="rgba(20,20,16,.35)" strokeWidth="3" />)}</g>;
  if (kind === 'stone') return <g opacity=".5">{Array.from({ length: Math.floor(h / 20) }).map((_, r) =>
    <path key={`r${r}`} d={`M${x1} ${yt + r * 20} h${w}`} stroke="rgba(40,30,20,.35)" strokeWidth="1.6" />)}
    {Array.from({ length: Math.floor(h / 20) }).map((_, r) =>
      Array.from({ length: Math.floor(w / 44) }).map((_, c) =>
        <path key={`${r}-${c}`} d={`M${x1 + c * 44 + (r % 2) * 22} ${yt + r * 20} v20`} stroke="rgba(40,30,20,.3)" strokeWidth="1.4" />))}</g>;
  if (kind === 'paint') return <g opacity=".5">
    <path d={`M${x1} ${yt + h * .3} h${w} M${x1} ${yt + h * .62} h${w}`} stroke="rgba(255,244,214,.25)" strokeWidth="2.4" />
    <path d={`M${x1 + w * .2} ${yt} v${h * .3} M${x1 + w * .7} ${yt + h * .62} v${h * .38}`} stroke="rgba(30,18,8,.14)" strokeWidth="5" />
  </g>;
  return <g opacity=".4">
    <path d={`M${x1 + w * .12} ${yt + 6} q10 ${h * .3} -4 ${h * .5}`} stroke="rgba(30,18,8,.12)" strokeWidth="7" fill="none" />
    <path d={`M${x1 + w * .8} ${yt + h * .4} q-8 ${h * .25} 6 ${h * .45}`} stroke="rgba(30,18,8,.1)" strokeWidth="6" fill="none" />
  </g>;
}

/* ---------- табличка-подпись и «ЗАКРЫТО» (перенесены из v0.7) ---------- */
export function NamePlate({ text, locked }: { text: string; locked?: boolean }) {
  return <g className="ui-label" transform="translate(0 30)">
    <path d="M-40 -6 v14 M40 -6 v14" stroke="#3a2c1d" strokeWidth="3" />
    <rect x="-62" y="-15" width="124" height="24" rx="6" fill="#241a12d9" stroke="#57432c" strokeWidth="1.6" />
    <text textAnchor="middle" y="2" fontSize="13" fontFamily="Georgia, serif" fill={locked ? '#9a8c74' : '#efe3cc'} fontWeight="bold">{text}</text>
  </g>;
}
export function ClosedSign() {
  return <g transform="translate(0 -70)">
    <path d="M-2 -14 v8 M14 -14 v8" stroke="#3a2c1d" strokeWidth="2" />
    <rect x="-26" y="-8" width="52" height="18" rx="3" fill="#8a4a32" stroke="#5a2c1c" strokeWidth="1.6" transform="rotate(-3)" />
    <text textAnchor="middle" y="5" fontSize="11" fontFamily="Georgia, serif" fill="#f0e0c0" letterSpacing="2" transform="rotate(-3)">ЗАКРЫТО</text>
  </g>;
}

/* ================================================================== */
export interface BldSpec {
  id?: string;                       // интерактивное здание
  c: W;                              // центр footprint (мир)
  w: number; d: number; h: number;   // ширина фасада / глубина / высота стен (мир. ед.)
  rot?: number;                      // поворот фасада, град (не изометрия — любой угол)
  roof: 'flat' | 'gable' | 'hip';
  ridge?: 'u' | 'v';                 // для gable: вдоль фасада ('u') или в глубину ('v')
  rh?: number;                       // высота крыши
  ov?: number;                       // свес кровли
  face: string; side: string; sideLit?: string;
  roofCol: string; roofLit?: string;
  tex?: TexKind;
  facade?: React.ReactNode;          // локальный контент фасада (X:0..w·FS, Y:0..h·FS)
  sideWin?: WinV[] | boolean;        // окна на боковине
  onRoof?: (at: RoofAt) => React.ReactNode; // дымоходы/вентиляция на крыше
  gableWin?: boolean;                // мансардное окошко на фронтальном щипце (ridge='v')
  locked?: boolean;
  uid?: string;
}
/** размещение объекта на крыше: u — вдоль фасада 0..w, v — в глубину 0..d, hh — над коньком */
export type RoofAt = (u: number, v: number, hh?: number) => { x: number; y: number; s: number };

interface Corner { w: W; p: PP; }
function cornersOf(cam: Cam, fp: ReturnType<typeof footprint>, ov: number, u: W, v: W): { e: Corner[]; c: Corner[] } {
  const ext = (p: W, su: number, sv: number): W => [p[0] + u[0] * su + v[0] * sv, p[1] + u[1] * su + v[1] * sv];
  const mk = (p: W): Corner => ({ w: p, p: P(cam, p[0], p[1]) });
  return {
    c: [fp.FL, fp.FR, fp.BR, fp.BL].map(mk),
    e: [ext(fp.FL, -ov, -ov), ext(fp.FR, ov, -ov), ext(fp.BR, ov, ov), ext(fp.BL, -ov, ov)].map(mk),
  };
}
const liftC = (cam: Cam, cn: Corner, h: number) => ({ x: cn.p.x, y: cn.p.y - liftPx(cam, h, cn.w[1]) });

/** тень здания на земле (солнце слева → длинная тень вправо и чуть к камере) */
export function bldShadow(cam: Cam, sp: BldSpec) {
  const fp = footprint(sp.c, sp.w, sp.d, sp.rot || 0);
  const base = [fp.FL, fp.FR, fp.BR, fp.BL];
  const sh = (k: number): W[] => base.map(([x, y]) => [x + (sp.h * k * 0.92 + 2.2 * k), y - sp.h * k * 0.1 - 0.4 * k] as W);
  const outer = hull([...base.map(([x, y]) => P(cam, x, y)), ...sh(1.25).map(([x, y]) => P(cam, x, y))]);
  const inner = hull([...base.map(([x, y]) => P(cam, x, y)), ...sh(0.85).map(([x, y]) => P(cam, x, y))]);
  return <g pointerEvents="none">
    <polygon points={q(...outer)} fill="#2a1c10" opacity=".13" />
    <polygon points={q(...inner)} fill="#2a1c10" opacity=".16" />
  </g>;
}

/** якорь для camera move: центр фасада на 55% высоты */
export function bldAnchor(cam: Cam, sp: BldSpec): { x: number; y: number } {
  const fp = footprint(sp.c, sp.w, sp.d, sp.rot || 0);
  const m: W = [(fp.FL[0] + fp.FR[0]) / 2 - fp.v[0] * 0, (fp.FL[1] + fp.FR[1]) / 2];
  const p = P(cam, m[0], m[1]);
  return { x: p.x, y: p.y - liftPx(cam, sp.h * 0.55, m[1]) };
}

/* ---------------- стена: полосы + аффинный контент ---------------- */
function Wall({ cam, p0, p1, h, fill, shade, clip, content, contentW, contentH, tex }: {
  cam: Cam; p0: W; p1: W; h: number; fill: string; shade?: string;
  clip: string; content?: React.ReactNode; contentW: number; contentH: number; tex?: TexKind;
}) {
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const N = Math.max(2, Math.min(7, Math.round(len / 3.2)));
  const strips = [];
  const cA = P(cam, p0[0], p0[1]), cB = P(cam, p1[0], p1[1]);
  const cAt = { x: cA.x, y: cA.y - liftPx(cam, h, p0[1]) }, cBt = { x: cB.x, y: cB.y - liftPx(cam, h, p1[1]) };
  const baseQuad = <polygon points={q(cA, cB, cBt, cAt)} fill={fill} />;
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const a: W = [p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0];
    const b: W = [p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1];
    const A = P(cam, a[0], a[1]), B = P(cam, b[0], b[1]);
    const At = { x: A.x, y: A.y - liftPx(cam, h, a[1]) };
    const Bt = { x: B.x, y: B.y - liftPx(cam, h, b[1]) };
    const x0 = t0 * contentW, sw = contentW / N;
    const mid0 = { x: (A.x + At.x) / 2, y: (A.y + At.y) / 2 };
    const mid1 = { x: (B.x + Bt.x) / 2, y: (B.y + Bt.y) / 2 };
    const e1 = { x: (mid1.x - mid0.x) / sw, y: (mid1.y - mid0.y) / sw };
    const e2 = { x: (A.x - At.x) / contentH, y: (A.y - At.y) / contentH };
    const e0 = { x: mid0.x - x0 * e1.x - (contentH / 2) * e2.x, y: mid0.y - x0 * e1.y - (contentH / 2) * e2.y };
    strips.push(
      <g key={i} clipPath={`url(#${clip}-${i})`}>
        <polygon points={q(A, B, Bt, At)} fill={fill} />
        {shade && <polygon points={q(A, B, Bt, At)} fill={shade} />}
        {tex && <g transform={`matrix(${e1.x} ${e1.y} ${e2.x} ${e2.y} ${e0.x} ${e0.y})`}>
          <Tex kind={tex} x1={x0} yt={0} w={sw + 1} h={contentH} /></g>}
        {content && <g transform={`matrix(${e1.x} ${e1.y} ${e2.x} ${e2.y} ${e0.x} ${e0.y})`}>{content}</g>}
      </g>
    );
  }
  return <g>
    {baseQuad}
    {shade && <polygon points={q(cA, cB, cBt, cAt)} fill={shade} />}
    <defs>{Array.from({ length: N }).map((_, i) => {
      const t0 = i / N, t1 = (i + 1) / N;
      const a: W = [p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0];
      const b: W = [p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1];
      const A = P(cam, a[0], a[1]), B = P(cam, b[0], b[1]);
      const At = { x: A.x, y: A.y - liftPx(cam, h, a[1]) };
      const Bt = { x: B.x, y: B.y - liftPx(cam, h, b[1]) };
      return <clipPath key={i} id={`${clip}-${i}`}><polygon points={q(A, B, Bt, At)} /></clipPath>;
    })}</defs>
    {strips}
  </g>;
}

/* ---------------- содержимое боковины ---------------- */
function sideContent(sp: BldSpec, locked: boolean): { node: React.ReactNode; w: number; h: number } {
  const w = sp.d * FSS, h = sp.h * FSS;
  const floors = Math.max(1, Math.round(sp.h / 6));
  const cols = Math.max(1, Math.round(sp.d / 5));
  const vs: WinV[] = Array.isArray(sp.sideWin) ? sp.sideWin : ['dark', 'curtain', 'lit', 'dark'];
  const wins = [];
  for (let f = 0; f < floors; f++) {
    for (let cIx = 0; cIx < cols; cIx++) {
      const wx = (cIx + 0.5) * (w / cols) - 9;
      const wy = h - (f + 1) * (h / floors) + h / floors * 0.24;
      wins.push(<Win key={`${f}-${cIx}`} x={wx} y={wy} w={18} h={24} frame="#2c2116"
        v={locked ? 'shut' : vs[(f * cols + cIx) % vs.length]} />);
    }
  }
  return {
    node: <g>
      {wins}
      <rect x={0} y={h - 5} width={w} height={5} fill="rgba(24,14,6,.3)" />
      <rect x={0} y={0} width={w} height={4} fill="rgba(255,240,200,.10)" />
    </g>, w, h,
  };
}

/* ================================================================== */
let uidSeq = 0;
export function Bld({ cam, sp }: { cam: Cam; sp: BldSpec }) {
  const uid = sp.uid || `b${uidSeq++}`;
  const rot = sp.rot || 0;
  const fp = footprint(sp.c, sp.w, sp.d, rot);
  const ov = sp.ov ?? 0.7;
  const rh = sp.rh ?? 4;
  const { e, c } = cornersOf(cam, fp, ov, fp.u, fp.v);
  const [EFL, EFR, EBR, EBL] = e.map(cn => liftC(cam, cn, sp.h));       // карниз (свес)
  const [FLb, FRb, BRb, BLb] = c;                                       // низ стен (экран)
  const h = sp.h;

  /* видимость стен: ребро ближе к камере, чем центроид footprint */
  const centY = (FLb.p.y + FRb.p.y + BRb.p.y + BLb.p.y) / 4;
  const walls: { key: string; p0: W; p1: W; lit: boolean; front: boolean }[] = [];
  const edgeMidY = (a: Corner, b: Corner) => (a.p.y + b.p.y) / 2;
  if (edgeMidY(FLb, FRb) > centY - 0.5) walls.push({ key: 'f', p0: fp.FL, p1: fp.FR, lit: true, front: true });
  if (edgeMidY(FRb, BRb) > centY - 0.5) walls.push({ key: 'r', p0: fp.FR, p1: fp.BR, lit: false, front: false });
  if (edgeMidY(BLb, BRb) > centY - 0.5) walls.push({ key: 'b', p0: fp.BL, p1: fp.BR, lit: false, front: false });
  if (edgeMidY(FLb, BLb) > centY - 0.5) walls.push({ key: 'l', p0: fp.FL, p1: fp.BL, lit: true, front: false });
  /* порядок отрисовки стен: дальние первыми */
  walls.sort((A, B) => {
    const dA = (alongDepth(A.p0, A.p1)), dB = (alongDepth(B.p0, B.p1));
    return dB - dA;
  });
  function alongDepth(p0: W, p1: W) { return (p0[1] + p1[1]) / 2; }

  const sideCol = (lit: boolean) => lit ? (sp.sideLit || mixCol(sp.side, '#ffd98a', 0.14)) : sp.side;
  const sideShade = (lit: boolean) => lit ? 'rgba(255,217,138,.07)' : 'rgba(20,12,6,.28)';

  /* ---------- крыши ---------- */
  const locked = !!sp.locked;
  const roofLit = sp.roofLit || mixCol(sp.roofCol, '#ffd98a', 0.22);
  const roofDark = mixCol(sp.roofCol, '#241a12', 0.25);
  let roofNode: React.ReactNode = null;
  const ridge = sp.ridge || 'u';
  const liftW = (p: W, hh: number) => { const s = P(cam, p[0], p[1]); return { x: s.x, y: s.y - liftPx(cam, hh, p[1]) }; };
  const wU = fp.u, wV = fp.v;
  const shift = (p: W, su: number, sv: number): W => [p[0] + wU[0] * su + wV[0] * sv, p[1] + wU[1] * su + wV[1] * sv];

  if (sp.roof === 'flat') {
    const pp = 0.85; // парапет
    const cap = (a: Corner, b: Corner) => {
      const A0 = liftC(cam, a, h), B0 = liftC(cam, b, h);
      const A1 = liftC(cam, a, h + pp), B1 = liftC(cam, b, h + pp);
      return q(A1, B1, B0, A0);
    };
    roofNode = <g>
      <polygon points={q(EFL, EFR, EBR, EBL)} fill={sp.roofCol} />
      <polygon points={q(EFL, EFR, EBR, EBL)} fill="url(#c-rooftop)" opacity=".5" />
      {/* внутренняя тень у ближнего парапета */}
      {(() => {
        const A0 = liftC(cam, e[0], h), B0 = liftC(cam, e[1], h);
        const A1 = liftC(cam, e[0], h - 0.1), B1 = liftC(cam, e[1], h - 0.1);
        return <polygon points={q(A1, B1, { x: B0.x, y: B0.y + 7 }, { x: A0.x, y: A0.y + 7 })} fill="#241a10" opacity=".18" />;
      })()}
      <polygon points={cap(e[0], e[1])} fill={mixCol(sp.roofCol, '#ffe9b0', 0.4)} />
      <polygon points={cap(e[3], e[0])} fill={mixCol(sp.roofCol, '#ffe9b0', 0.18)} />
      <polygon points={cap(e[1], e[2])} fill={mixCol(sp.roofCol, '#241a12', 0.18)} />
      <polygon points={cap(e[2], e[3])} fill={mixCol(sp.roofCol, '#241a12', 0.3)} />
    </g>;
  } else if (sp.roof === 'hip') {
    const ins = Math.min(sp.w / 2 - 1.2, sp.d / 2);
    const R1 = liftW(shift(fp.FL, sp.w / 2 - ins, sp.d / 2), h + rh);
    const R2 = liftW(shift(fp.FR, -(sp.w / 2 - ins), sp.d / 2), h + rh);
    roofNode = <g>
      <polygon points={q(EBL, EBR, R2, R1)} fill={roofDark} />
      <polygon points={q(EFL, EBL, R1)} fill={mixCol(roofLit, sp.sideLit || sp.side, 0.25)} />
      <polygon points={q(EFR, EBR, R2)} fill={mixCol(sp.roofCol, '#241a12', 0.35)} />
      <polygon points={q(EFL, EFR, R2, R1)} fill={roofLit} />
      <path d={`M${R1.x} ${R1.y} L${R2.x} ${R2.y}`} stroke="rgba(30,18,8,.4)" strokeWidth="2" />
      <path d={`M${EFL.x} ${EFL.y} L${EFR.x} ${EFR.y}`} stroke="rgba(30,18,8,.3)" strokeWidth="2" />
    </g>;
  } else if (ridge === 'u') {
    /* конёк вдоль фасада: скаты вперёд/назад, щипцы на боковинах */
    const R1 = liftW(shift(fp.FL, -ov, sp.d / 2), h + rh);
    const R2 = liftW(shift(fp.FR, ov, sp.d / 2), h + rh);
    roofNode = <g>
      <polygon points={q(EBL, EBR, R2, R1)} fill={roofDark} />
      {/* щипцовые треугольники боковых стен */}
      <polygon points={q(EFL, EBL, R1)} fill={sideCol(true)} />
      <polygon points={q(EFL, EBL, R1)} fill="url(#c-facadewarm)" opacity=".6" />
      <polygon points={q(EFR, EBR, R2)} fill={sideCol(false)} />
      <polygon points={q(EFL, EFR, R2, R1)} fill={roofLit} />
      <path d={`M${R1.x} ${R1.y} L${R2.x} ${R2.y}`} stroke="rgba(30,18,8,.45)" strokeWidth="2.2" />
      <path d={`M${EFL.x} ${EFL.y} L${EFR.x} ${EFR.y}`} stroke="rgba(30,18,8,.3)" strokeWidth="2" />
      {/* водосток по переднему карнизу */}
    </g>;
  } else {
    /* конёк в глубину: фронтальный щипец, два ската влево/вправо */
    const midF = shift(fp.FL, sp.w / 2, -ov);
    const midB = shift(fp.FL, sp.w / 2, sp.d + ov);
    const Rf = liftW(midF, h + rh);
    const Rb = liftW(midB, h + rh);
    const FLt = liftC(cam, c[0], h), FRt = liftC(cam, c[1], h);
    const gx = (FLt.x + FRt.x + Rf.x) / 3, gy = (FLt.y + FRt.y + Rf.y) / 3;
    const gw = Math.abs(FRt.x - FLt.x) * 0.13;
    roofNode = <g>
      {/* щипец фасада */}
      <polygon points={q(FLt, FRt, Rf)} fill={sp.face} />
      <polygon points={q(FLt, FRt, Rf)} fill="url(#c-facadewarm)" />
      {sp.gableWin !== false && <g>
        <rect x={gx - gw / 2} y={gy - gw * 0.62} width={gw} height={gw * 1.15} rx={1.5} fill="#3a2c1d" />
        <rect x={gx - gw / 2 + 2} y={gy - gw * 0.62 + 2} width={gw - 4} height={gw * 1.15 - 4}
          fill={locked ? '#39485a' : '#ffd98a'} opacity={locked ? 1 : .85} />
      </g>}
      <polygon points={q(EFR, Rf, Rb, EBR)} fill={roofDark} />
      <polygon points={q(EFL, Rf, Rb, EBL)} fill={roofLit} />
      <path d={`M${Rf.x} ${Rf.y} L${Rb.x} ${Rb.y}`} stroke="rgba(30,18,8,.45)" strokeWidth="2.2" />
      <path d={`M${EFL.x} ${EFL.y} L${EFR.x} ${EFR.y}`} stroke="rgba(30,18,8,.28)" strokeWidth="1.8" />
    </g>;
  }

  /* ---------- размещение на крыше ---------- */
  const roofHAt = (u: number, v: number): number => {
    if (sp.roof === 'flat') return h;
    if (sp.roof === 'hip') {
      const k = Math.min(u, sp.w - u, v, sp.d - v, Math.min(sp.w, sp.d) / 2);
      return h + rh * Math.min(1, k / (Math.min(sp.w / 2, sp.d / 2)));
    }
    if (ridge === 'u') return h + rh * (1 - Math.abs(v / sp.d - 0.5) * 2);
    return h + rh * (1 - Math.abs(u / sp.w - 0.5) * 2);
  };
  const roofAt: RoofAt = (u, v, hh = 0) => {
    const p = shift(fp.FL, u, v);
    const s = P(cam, p[0], p[1]);
    return { x: s.x, y: s.y - liftPx(cam, roofHAt(u, v) + hh, p[1]), s: s.s };
  };

  const facW = sp.w * FS, facH = sp.h * FS;

  return <g>
    {walls.map(wall => wall.front
      ? <Wall key={wall.key} cam={cam} p0={wall.p0} p1={wall.p1} h={h} fill={sp.face}
        clip={`cf-${uid}`} content={sp.facade} contentW={facW} contentH={facH} tex={sp.tex} />
      : <Wall key={wall.key} cam={cam} p0={wall.p0} p1={wall.p1} h={h} fill={sideCol(wall.lit)}
        shade={sideShade(wall.lit)} clip={`cs-${uid}-${wall.key}`}
        content={sideContent(sp, locked).node} contentW={sp.d * FSS} contentH={sp.h * FSS} tex={sp.tex === 'wood' || sp.tex === 'brick' ? sp.tex : undefined} />)}
    {/* тёплый вечерний свет на фасаде + цоколь */}
    {(() => {
      const fw = walls.find(x => x.front);
      if (!fw) return null;
      const A = P(cam, fw.p0[0], fw.p0[1]), B = P(cam, fw.p1[0], fw.p1[1]);
      const At = { x: A.x, y: A.y - liftPx(cam, h, fw.p0[1]) }, Bt = { x: B.x, y: B.y - liftPx(cam, h, fw.p1[1]) };
      return <g pointerEvents="none">
        <polygon points={q(A, B, Bt, At)} fill="url(#c-facadewarm)" opacity=".8" style={{ mixBlendMode: 'overlay' } as any} />
        <polygon points={q(A, B, { x: B.x, y: B.y - 4 }, { x: A.x, y: A.y - 4 })} fill="rgba(30,18,8,.25)" />
      </g>;
    })()}
    {roofNode}
    {sp.onRoof?.(roofAt)}
  </g>;
}
