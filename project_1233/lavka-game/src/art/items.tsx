/* items.tsx — НОВЫЙ предметный арт «Лавки»: каждый предмет — узнаваемая вещь с объёмом,
   материалами и конструктивными деталями (не пиктограмма). Дефекты встроены физически:
   нет детали → детали реально нет (видна шейка/гнездо); сломан механизм → узел выглядит
   сломанным; трещина/грязь/ржавчина/царапины — слои, обрезанные по силуэту вещи.
   Координаты: viewBox 0 0 200 200, предмет стоит на «полу» y≈172. */
import React, { useMemo } from 'react';
import { mulberry32 } from '../game/rng';
import type { DefectInst } from '../game/types';

interface Ctx { hasPart: boolean; broken: boolean; calib: boolean; }
interface ItemArtDef { d: (c: Ctx) => React.ReactNode; sil?: string; mech?: [number, number]; dial?: [number, number, number]; }

const W = 'url(#g-wood)', WD = 'url(#g-wood-d)', BR = 'url(#g-brass)', ST = 'url(#g-steel)',
  SD = 'url(#g-steel-d)', GL = 'url(#g-glass)', BK = 'url(#g-bak)', EN = 'url(#g-enamel)',
  VL = 'url(#g-velvet)', LE = 'url(#g-leather)', DF = 'url(#g-dialface)', BL = 'url(#g-blacklac)';

const Sh = ({ cx = 100, cy = 172, rx = 52, o = .38 }: { cx?: number; cy?: number; rx?: number; o?: number }) =>
  <ellipse cx={cx} cy={cy} rx={rx} ry={rx * .16} fill="#140d07" opacity={o} filter="url(#f-soft)" />;
const Hi = ({ d, o = .3 }: { d: string; o?: number }) => <path d={d} fill="#fff6d8" opacity={o} />;

/* ---------- мелкие общие детали ---------- */
const Dial = ({ x, y, r, calib, ticks = 8 }: { x: number; y: number; r: number; calib: boolean; ticks?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={DF} stroke="#8a6c1e" strokeWidth="1.6" />
    {Array.from({ length: ticks }).map((_, i) => {
      const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
      return <path key={i} d={`M${x + Math.cos(a) * r * .78} ${y + Math.sin(a) * r * .78} L${x + Math.cos(a) * r * .92} ${y + Math.sin(a) * r * .92}`} stroke="#5a4632" strokeWidth="1.4" />;
    })}
    <path d={calib ? `M${x} ${y} L${x - r * .62} ${y + r * .5}` : `M${x} ${y} L${x + r * .1} ${y - r * .72}`} stroke="#8a2c1c" strokeWidth="2" strokeLinecap="round" />
    <circle cx={x} cy={y} r={r * .12} fill="#5a4632" />
  </g>
);
const Knob = ({ x, y, r = 6 }: { x: number; y: number; r?: number }) => (
  <g><circle cx={x} cy={y} r={r} fill={BK} stroke="#1a120b" strokeWidth="1" /><circle cx={x} cy={y} r={r * .55} fill="#241a16" /><path d={`M${x} ${y - r * .7} v${r * .5}`} stroke="#c8b090" strokeWidth="1.4" /><circle cx={x - r * .3} cy={y - r * .35} r={r * .18} fill="#fff" opacity=".5" /></g>
);
const Grille = ({ x, y, w, h, n = 5 }: { x: number; y: number; w: number; h: number; n?: number }) => (
  <g opacity=".85">{Array.from({ length: n }).map((_, i) => <path key={i} d={`M${x} ${y + (i + .5) * h / n} h${w}`} stroke="#3a2c1d" strokeWidth="2.2" opacity=".55" />)}</g>
);

/* ---------- реестр предметов ---------- */
const REG: Record<string, ItemArtDef> = {
  phone: {
    sil: 'M52 96 q48 -18 96 0 l6 62 q-54 16 -108 0 z M46 78 q54 -26 108 0 l-4 16 q-50 -20 -100 0 z',
    d: c => <g>
      <Sh rx={56} />
      {/* корпус-трапеция (бакелит) */}
      <path d="M56 100 q44 -16 88 0 l8 58 q-52 14 -104 0 z" fill={BK} />
      <path d="M120 92 q20 3 24 8 l8 58 q-14 4 -30 5 z" fill="rgba(0,0,0,.3)" />
      <Hi d="M60 102 q20 -8 40 -9 l-2 8 q-18 1 -34 8 z" o={.18} />
      {/* дискоый набор */}
      <circle cx="100" cy="128" r="24" fill={EN} stroke="#8a7a5a" strokeWidth="1.6" />
      <circle cx="100" cy="128" r="18.5" fill="none" stroke="#b0a488" strokeWidth="1.2" />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2.4;
        return <circle key={i} cx={100 + Math.cos(a) * 14.5} cy={128 + Math.sin(a) * 14.5} r="3.1" fill="#3a2c1d" opacity=".85" />;
      })}
      <circle cx="100" cy="128" r="6" fill={BK} />
      <path d="M122 116 q6 8 2 18" stroke={BR} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* вилка-трубка на рычаге */}
      <path d="M52 92 q48 -30 96 0" stroke={BK} strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M52 92 q48 -30 96 0" stroke="rgba(255,246,216,.16)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="94" rx="11" ry="8.5" fill={BK} transform="rotate(-24 50 94)" />
      <ellipse cx="150" cy="94" rx="11" ry="8.5" fill={BK} transform="rotate(24 150 94)" />
      <ellipse cx="48" cy="92" rx="5" ry="3.6" fill="#5a463c" transform="rotate(-24 48 92)" />
      {/* рычаг-кронштейн */}
      <path d="M64 96 q4 -10 12 -12 M136 96 q-4 -10 -12 -12" stroke="#241a16" strokeWidth="5" fill="none" />
      {/* шнур */}
      <path d="M148 150 q14 2 12 10 q-2 7 -12 5 q8 4 4 9" stroke="#241a16" strokeWidth="3" fill="none" strokeLinecap="round" />
      {!c.broken ? <circle cx="100" cy="128" r="24" fill="none" stroke="rgba(255,246,216,.25)" strokeWidth="1.4" /> :
        <g><path d="M84 118 l10 8 -6 4 12 8" stroke="#1a120b" strokeWidth="2.2" fill="none" /><circle cx="100" cy="128" r="24" fill="rgba(20,12,6,.25)" /></g>}
    </g>
  },
  camera: {
    sil: 'M40 78 h120 v78 h-120 z',
    d: c => <g>
      <Sh rx={58} />
      {/* корпус: кожа + стальная пластина */}
      <rect x="40" y="84" width="120" height="70" rx="9" fill={LE} />
      <path d="M40 96 h120 v46 h-120z" fill="#4f3a26" />
      {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M44 ${100 + i * 7} h112`} stroke="#38291a" strokeWidth="1" opacity=".5" />)}
      <rect x="40" y="78" width="120" height="16" rx="6" fill={ST} />
      <Hi d="M44 80 h112 v4 h-112z" o={.5} />
      {/* видоискатель + кнопки */}
      <rect x="86" y="68" width="28" height="12" rx="3" fill={SD} />
      <rect x="90" y="71" width="20" height="6" rx="2" fill={GL} />
      <rect x="52" y="70" width="14" height="9" rx="3" fill={SD} /><rect x="134" y="70" width="14" height="9" rx="3" fill={SD} />
      <circle cx="59" cy="68" r="4.5" fill={ST} /><circle cx="141" cy="68" r="4.5" fill={ST} />
      {/* объектив */}
      <circle cx="100" cy="120" r="30" fill={SD} />
      <circle cx="100" cy="120" r="25" fill={BR} />
      <circle cx="100" cy="120" r="19" fill="#1a1a20" />
      <circle cx="100" cy="120" r="14" fill="#2a2a3a" />
      <path d="M90 112 q6 -6 14 -4" stroke="#cfe0e0" strokeWidth="3" fill="none" opacity=".8" strokeLinecap="round" />
      <circle cx="106" cy="126" r="3" fill="#cfe0e0" opacity=".35" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <path key={i} d={`M${100 + Math.cos(a) * 25} ${120 + Math.sin(a) * 25} l${Math.cos(a) * 2.4} ${Math.sin(a) * 2.4}`} stroke="#8a6c1e" strokeWidth="1.4" />;
      })}
      {/* ремешковые ушки + гравировка */}
      <circle cx="44" cy="92" r="3.4" fill={BR} /><circle cx="156" cy="92" r="3.4" fill={BR} />
      <path d="M126 140 h22" stroke="#c8b090" strokeWidth="2" opacity=".7" />
      <path d="M126 145 h14" stroke="#c8b090" strokeWidth="1.4" opacity=".5" />
      {c.broken && <g><path d="M112 106 l8 10 -5 5 9 9" stroke="#0e0e12" strokeWidth="2.4" fill="none" /><circle cx="100" cy="120" r="14" fill="rgba(10,10,14,.6)" /></g>}
    </g>
  },
  reel: {
    sil: 'M38 62 h124 v96 h-124 z',
    d: c => <g>
      <Sh rx={62} />
      <rect x="38" y="62" width="124" height="96" rx="8" fill={W} />
      <rect x="38" y="62" width="124" height="96" rx="8" fill="none" stroke="#4a3620" strokeWidth="2" />
      <Hi d="M42 66 h30 v88 h-8 q-14 -44 -22 -88z" o={.14} />
      <path d="M132 62 h30 v96 h-22 q-4 -48 -8 -96z" fill="rgba(20,12,6,.22)" />
      {/* панель */}
      <rect x="46" y="70" width="108" height="62" rx="5" fill="#c8b090" />
      <rect x="46" y="70" width="108" height="62" rx="5" fill="none" stroke="#8a6c1e" strokeWidth="1.4" />
      {/* катушки */}
      {[72, 128].map((cx, i) => (
        <g key={cx} transform={`translate(${cx} 96)`} className={i === 1 && c.broken ? 'reel-broken' : ''}>
          <circle r="21" fill="#e3d9c0" stroke="#8a7a5a" strokeWidth="2" />
          <circle r="15" fill={i === 1 && c.broken ? '#6e6258' : '#4f3a26'} />
          {[0, 120, 240].map(a => <path key={a} d={`M0 -19 L0 -7`} stroke="#8a7a5a" strokeWidth="5" transform={`rotate(${a + (c.broken && i === 1 ? 40 : 0)})`} />)}
          <circle r="4.5" fill={ST} />
          {c.broken && i === 1 && <path d="M-14 -10 l9 7 -4 5 11 8" stroke="#241a12" strokeWidth="2" fill="none" />}
        </g>
      ))}
      <path d="M72 117 q28 12 56 0" stroke="#3a2c1d" strokeWidth="2.4" fill="none" />
      {/* VU-стрелка и кнопки */}
      <rect x="88" y="138" width="24" height="12" rx="3" fill={DF} stroke="#8a6c1e" strokeWidth="1.2" />
      <path d={c.calib ? 'M100 148 l-8 -6' : 'M100 148 l2 -8'} stroke="#8a2c1c" strokeWidth="1.6" />
      {[58, 70, 130, 142].map(x => <rect key={x} x={x - 5} y="138" width="10" height="12" rx="2.5" fill={SD} />)}
      <path d="M46 132 h108" stroke="#8a6c1e" strokeWidth="1.2" opacity=".6" />
    </g>
  },
  radiola: {
    sil: 'M34 58 h132 v104 h-132 z',
    d: c => <g>
      <Sh rx={66} />
      {/* корпус-консоль */}
      <rect x="34" y="58" width="132" height="100" rx="7" fill={W} />
      <rect x="34" y="58" width="132" height="100" rx="7" fill="none" stroke="#4a3620" strokeWidth="2.4" />
      <path d="M140 58 h26 v100 h-20 q-2 -50 -6 -100z" fill="rgba(20,12,6,.24)" />
      <Hi d="M38 62 h26 v92 h-6 q-10 -46 -20 -92z" o={.13} />
      {/* откидная крышка */}
      <path d="M34 58 l10 -14 h112 l10 14z" fill={WD} />
      <path d="M44 44 h112" stroke="#c8a97e" strokeWidth="2" opacity=".7" />
      {/* шкала-дуга */}
      <path d="M52 74 q48 -14 96 0 v16 q-48 -12 -96 0z" fill={DF} stroke="#8a6c1e" strokeWidth="1.6" />
      <path d="M58 80 q42 -11 84 0" stroke="#5a4632" strokeWidth="1.2" fill="none" />
      <path d={c.calib ? 'M100 88 l-26 -6' : 'M100 88 l6 -10'} stroke="#8a2c1c" strokeWidth="2" />
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${58 + i * 10.5} ${77 + Math.abs(4 - i) * 0.9} v4`} stroke="#5a4632" strokeWidth="1.2" />)}
      {/* тканевая решётка */}
      <rect x="52" y="96" width="96" height="34" rx="4" fill="#b09a72" />
      {Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M56 ${100 + i * 4.4} h88`} stroke="#8a7452" strokeWidth="1.6" />)}
      {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${58 + i * 7.6} 98 v30`} stroke="#8a7452" strokeWidth="1.2" opacity=".7" />)}
      {/* ручки + ножки */}
      <Knob x={64} y={142} r={7} /><Knob x={136} y={142} r={7} />
      <rect x="88" y="138" width="24" height="9" rx="3" fill={BK} />
      <path d="M42 158 l-4 12 M158 158 l4 12" stroke="#4a3620" strokeWidth="6" strokeLinecap="round" />
      {c.broken && <g><rect x="52" y="96" width="96" height="34" rx="4" fill="rgba(20,12,6,.35)" /><path d="M60 102 l14 12 -6 6 16 10" stroke="#1a120b" strokeWidth="2.2" fill="none" /></g>}
    </g>
  },
  player: {
    sil: 'M40 92 h120 v60 h-120 z',
    d: c => <g>
      <Sh rx={60} />
      <rect x="40" y="104" width="120" height="48" rx="6" fill={W} />
      <path d="M136 104 h24 v48 h-18 q-2 -24 -6 -48z" fill="rgba(20,12,6,.22)" />
      <rect x="40" y="98" width="120" height="10" rx="4" fill={WD} />
      {/* блин с пластинкой */}
      <ellipse cx="92" cy="98" rx="44" ry="13" fill={SD} />
      <ellipse cx="92" cy="95" rx="40" ry="11.5" fill="#1a1a1e" />
      <ellipse cx="92" cy="95" rx="40" ry="11.5" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="1" />
      {[30, 22, 14].map(r => <ellipse key={r} cx="92" cy="95" rx={r} ry={r * .29} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="1" />)}
      <ellipse cx="92" cy="95" rx="11" ry="3.4" fill="#8a2c1c" />
      <ellipse cx="92" cy="95" rx="2" ry="0.8" fill="#e3d9c0" />
      {/* тонарм */}
      <circle cx="142" cy="96" r="7" fill={ST} />
      <path d={c.broken ? 'M142 96 q-14 -10 -22 -2' : 'M142 96 q-18 2 -34 -1'} stroke={ST} strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x={c.broken ? 112 : 102} y={c.broken ? 88 : 92} width="10" height="6" rx="2" fill={SD} transform={c.broken ? 'rotate(-30 117 91)' : undefined} />
      {/* ручка-вертушка */}
      <path d="M160 122 q14 2 12 12" stroke={BR} strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="172" cy="136" r="4" fill={BR} />
      <Knob x={56} y={132} r={6} /><Knob x={74} y={132} r={6} />
      <path d="M46 152 h108" stroke="#4a3620" strokeWidth="2" opacity=".6" />
    </g>
  },
  typewriter: {
    sil: 'M36 84 h128 v70 h-128 z',
    d: c => <g>
      <Sh rx={64} />
      <path d="M44 108 h112 l8 44 H36 z" fill={BL} />
      <path d="M128 108 h28 l8 44 h-26z" fill="rgba(0,0,0,.35)" />
      <Hi d="M48 112 h40 l-4 36 h-10 q-14 -18 -26 -36z" o={.12} />
      {/* каретка + валик + бумага */}
      <rect x="48" y="86" width="104" height="14" rx="6" fill={SD} />
      <circle cx="46" cy="93" r="8" fill={ST} /><circle cx="154" cy="93" r="8" fill={ST} />
      <path d="M74 86 q26 -26 52 0 v-24 q-26 -8 -52 0z" fill="#f2ecd8" />
      <path d="M80 68 h40 M80 74 h34" stroke="#9a8a70" strokeWidth="1.6" />
      {/* клавиши */}
      {[0, 1, 2].map(r => (
        <g key={r}>{Array.from({ length: 10 - r }).map((_, i) => (
          <circle key={i} cx={58 + r * 5 + i * 9.6} cy={124 + r * 9} r="3.6" fill="#e3d9c0" stroke="#3a3a3e" strokeWidth="1.2" />
        ))}</g>
      ))}
      <rect x="78" y="150" width="44" height="6" rx="3" fill="#e3d9c0" stroke="#3a3a3e" strokeWidth="1.2" />
      {/* сегменты */}
      <path d="M84 108 q16 -12 32 0" stroke="#26262a" strokeWidth="3" fill="none" />
      {c.broken && <path d="M92 100 l6 8 -4 3 8 6" stroke="#0e0e12" strokeWidth="2" fill="none" />}
    </g>
  },
  cplayer: {
    sil: 'M42 84 h116 v64 h-116 z',
    d: c => <g>
      <Sh rx={56} />
      <rect x="42" y="84" width="116" height="64" rx="8" fill={EN} />
      <path d="M130 84 h28 v64 h-22 q-2 -32 -6 -64z" fill="rgba(20,12,6,.18)" />
      <rect x="42" y="84" width="116" height="64" rx="8" fill="none" stroke="#8a7a5a" strokeWidth="1.6" />
      {/* кассетное окно */}
      <rect x="58" y="94" width="60" height="30" rx="4" fill="#2c2c30" />
      <rect x="62" y="98" width="52" height="22" rx="3" fill="#3a3a40" />
      {[74, 102].map(cx => <g key={cx}><circle cx={cx} cy="109" r="7" fill="#e3d9c0" /><circle cx={cx} cy="109" r="2.6" fill="#3a3a40" />{[0, 90, 180, 270].map(a => <path key={a} d={`M${cx} 103 v3`} stroke="#3a3a40" strokeWidth="1.6" transform={`rotate(${a} ${cx} 109)`} />)}</g>)}
      <path d="M82 109 h12" stroke="#6e5f42" strokeWidth="3" />
      {/* динамик */}
      {[0, 1, 2, 3].map(i => <circle key={i} cx={136 + (i % 2) * 9} cy={100 + Math.floor(i / 2) * 9} r="2" fill="#8a7a5a" />)}
      {[0, 1, 2, 3].map(i => <circle key={i} cx={136 + (i % 2) * 9} cy={122 + Math.floor(i / 2) * 9} r="2" fill="#8a7a5a" />)}
      {/* кнопки */}
      {[62, 74, 86, 98, 110].map((x, i) => <rect key={x} x={x} y="132" width="9" height="8" rx="2" fill={i === 2 ? SD : BK} />)}
      <path d="M50 90 h8" stroke="#8a2c1c" strokeWidth="2.4" />
      {c.broken && <g><rect x="58" y="94" width="60" height="30" rx="4" fill="rgba(20,12,6,.4)" /><path d="M64 100 l10 8 -5 5 12 8" stroke="#101014" strokeWidth="2" fill="none" /></g>}
    </g>
  },
  console: {
    sil: 'M44 92 h112 v52 h-112 z',
    d: c => <g>
      <Sh rx={54} />
      <rect x="44" y="92" width="112" height="52" rx="7" fill="#c8b898" />
      <path d="M128 92 h28 v52 h-22 q-2 -26 -6 -52z" fill="rgba(20,12,6,.18)" />
      <rect x="44" y="92" width="112" height="12" rx="6" fill={WD} />
      <rect x="70" y="98" width="60" height="7" rx="3" fill="#1a120b" />
      <Knob x={58} y={122} r={7} /><Knob x={142} y={122} r={7} />
      <rect x="84" y="116" width="32" height="14" rx="3" fill={SD} />
      <path d="M90 123 h20" stroke="#3a3630" strokeWidth="2" />
      {/* пульт на проводе */}
      <path d="M150 140 q18 6 14 18" stroke="#241a12" strokeWidth="2.6" fill="none" />
      <rect x="152" y="154" width="26" height="14" rx="4" fill={WD} />
      <circle cx="160" cy="161" r="3.4" fill="#8a2c1c" /><rect x="168" y="157" width="6" height="8" rx="2" fill={BK} />
      <path d="M52 138 h30" stroke="#8a2c1c" strokeWidth="2.4" opacity=".8" />
      {c.broken && <g><circle cx="100" cy="123" r="10" fill="rgba(20,12,6,.4)" /><path d="M94 118 l6 6 -3 4 8 6" stroke="#101014" strokeWidth="2" fill="none" /></g>}
    </g>
  },
  watch: {
    sil: 'M62 46 h76 v116 h-76 z',
    d: c => <g>
      <Sh cx={100} cy={168} rx={40} />
      {/* цепочка */}
      <path d="M118 52 q34 10 30 44 q-3 26 -26 30" stroke={BR} strokeWidth="3.4" fill="none" strokeLinecap="round" />
      {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={120 + i * 4.4} cy={54 + i * 5.4 + (i > 4 ? (i - 4) * 3 : 0)} r="1.6" fill="#f2d788" opacity=".8" />)}
      {/* ушко + завод */}
      <path d="M92 44 q8 -10 16 0" stroke={BR} strokeWidth="4" fill="none" />
      <rect x="96" y="40" width="8" height="8" rx="2" fill={BR} />
      <circle cx="100" cy="38" r="5" fill={BR} stroke="#8a6c1e" strokeWidth="1.2" />
      {/* корпус */}
      <circle cx="100" cy="104" r="52" fill={BR} />
      <circle cx="100" cy="104" r="52" fill="none" stroke="#8a6c1e" strokeWidth="2" />
      <path d="M64 70 a52 52 0 0 1 40 -18" stroke="#f2d788" strokeWidth="5" fill="none" opacity=".7" strokeLinecap="round" />
      <circle cx="100" cy="104" r="44" fill={DF} />
      <circle cx="100" cy="104" r="44" fill="none" stroke="#8a7a5a" strokeWidth="1.4" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return <path key={i} d={`M${100 + Math.cos(a) * 36} ${104 + Math.sin(a) * 36} L${100 + Math.cos(a) * 41} ${104 + Math.sin(a) * 41}`} stroke="#5a4632" strokeWidth={i % 3 === 0 ? 3 : 1.6} />;
      })}
      <path d="M100 104 L100 76" stroke="#3a2c1d" strokeWidth="3.6" strokeLinecap="round" transform={c.broken ? 'rotate(140 100 104)' : undefined} />
      <path d="M100 104 L122 116" stroke="#3a2c1d" strokeWidth="2.8" strokeLinecap="round" transform={c.broken ? 'rotate(-70 100 104)' : undefined} />
      <path d={c.calib ? 'M100 104 L82 122' : 'M100 104 L108 88'} stroke="#8a2c1c" strokeWidth="1.6" />
      <circle cx="100" cy="104" r="4" fill={BR} stroke="#8a6c1e" strokeWidth="1" />
      <path d="M84 88 q8 -8 18 -8" stroke="#fff" strokeWidth="3" fill="none" opacity=".5" strokeLinecap="round" />
      <path d="M78 128 q22 10 44 0" stroke="#8a6c1e" strokeWidth="1.4" fill="none" opacity=".7" />
    </g>
  },
  cuckoo: {
    sil: 'M56 40 h88 v126 h-88 z',
    d: c => <g>
      <Sh rx={46} />
      {/* домик */}
      <path d="M62 78 L100 44 L138 78 z" fill={WD} />
      <path d="M56 80 L100 40 L144 80 l-6 4 -38 -34 -38 34z" fill="#4a3620" />
      <rect x="66" y="80" width="68" height="84" rx="4" fill={W} />
      <path d="M116 80 h18 v84 h-14 q-2 -42 -4 -84z" fill="rgba(20,12,6,.22)" />
      {/* резные листья */}
      <path d="M70 84 q-8 10 0 18 q8 -8 0 -18z M130 84 q8 10 0 18 q-8 -8 0 -18z" fill="#5c4f38" />
      {/* дверца кукушки */}
      <rect x="90" y="88" width="20" height="16" rx="2" fill={WD} stroke="#4a3620" strokeWidth="1.6" />
      {!c.broken && <path d="M96 96 q4 -6 8 0 q-4 4 -8 0z" fill="#8a6c1e" />}
      {/* циферблат */}
      <circle cx="100" cy="126" r="20" fill={DF} stroke="#4a3620" strokeWidth="2.4" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d={`M${100 + Math.cos(a) * 15} ${126 + Math.sin(a) * 15} l${Math.cos(a) * 3} ${Math.sin(a) * 3}`} stroke="#5a4632" strokeWidth="1.6" />;
      })}
      <path d="M100 126 L100 112" stroke="#3a2c1d" strokeWidth="2.6" strokeLinecap="round" transform={c.broken ? 'rotate(120 100 126)' : undefined} />
      <path d="M100 126 L110 132" stroke="#3a2c1d" strokeWidth="2" strokeLinecap="round" />
      {/* цепи с гирями */}
      <path d="M84 164 v22 M116 164 v30" stroke="#8a6c1e" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M80 186 q4 -6 8 0 l-1 14 q-3 3 -6 0z" fill={c.broken ? SD : BR} />
      <path d="M112 194 q4 -6 8 0 l-1 12 q-3 3 -6 0z" fill={BR} />
    </g>
  },
  alarm: {
    sil: 'M56 52 h88 v112 h-88 z',
    d: c => <g>
      <Sh rx={42} />
      {/* ножки */}
      <path d="M76 152 l-8 16 M124 152 l8 16" stroke="#5a4632" strokeWidth="5" strokeLinecap="round" />
      {/* корпус */}
      <circle cx="100" cy="104" r="48" fill="#b5533c" />
      <circle cx="100" cy="104" r="48" fill="none" stroke="#7c3a2a" strokeWidth="2.4" />
      <path d="M66 72 a48 48 0 0 1 30 -16" stroke="#d88a72" strokeWidth="5" fill="none" opacity=".6" strokeLinecap="round" />
      <circle cx="100" cy="104" r="39" fill={DF} />
      <circle cx="100" cy="104" r="39" fill="none" stroke="#b0a488" strokeWidth="1.4" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return <path key={i} d={`M${100 + Math.cos(a) * 31} ${104 + Math.sin(a) * 31} L${100 + Math.cos(a) * 36} ${104 + Math.sin(a) * 36}`} stroke="#5a4632" strokeWidth={i % 3 === 0 ? 2.6 : 1.4} />;
      })}
      <path d="M100 104 L92 82" stroke="#3a2c1d" strokeWidth="3.2" strokeLinecap="round" transform={c.broken ? 'rotate(160 100 104)' : undefined} />
      <path d="M100 104 L118 112" stroke="#3a2c1d" strokeWidth="2.6" strokeLinecap="round" />
      <path d={c.calib ? 'M100 104 L84 118' : 'M100 104 L104 90'} stroke="#8a2c1c" strokeWidth="1.6" />
      <circle cx="100" cy="104" r="3.4" fill="#b5533c" />
      {/* кнопка + ушки */}
      <rect x="94" y="48" width="12" height="8" rx="3" fill={SD} />
      <path d="M70 62 q-8 -8 -2 -12 M130 62 q8 -8 2 -12" stroke="#7c3a2a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M84 90 q7 -7 15 -7" stroke="#fff" strokeWidth="2.6" fill="none" opacity=".55" strokeLinecap="round" />
    </g>
  },
  scales: {
    sil: 'M40 44 h120 v124 h-120 z',
    d: c => <g>
      <Sh rx={44} />
      <path d="M78 164 h44 l6 8 H72z" fill={WD} />
      <rect x="96" y="70" width="8" height="96" rx="3" fill={BR} />
      <path d="M98 74 q-4 40 0 88" stroke="#f2d788" strokeWidth="2" fill="none" opacity=".6" />
      {/* коромысло */}
      <g transform={c.broken ? 'rotate(9 100 70)' : undefined}>
        <rect x="44" y="66" width="112" height="7" rx="3.5" fill={BR} />
        <circle cx="100" cy="69" r="6" fill={BR} stroke="#8a6c1e" strokeWidth="1.4" />
        <path d="M100 62 v-8" stroke={BR} strokeWidth="3" />
        <circle cx="100" cy="52" r="4" fill={BR} />
        {/* подвесы + чаши */}
        {[50, 150].map(x => <g key={x}>
          <path d={`M${x} 73 l-10 34 M${x} 73 l10 34 M${x} 73 v34`} stroke="#8a6c1e" strokeWidth="1.6" />
          <path d={`M${x - 18} 108 q18 14 36 0 q-4 10 -18 10 q-14 0 -18 -10z`} fill={BR} />
          <path d={`M${x - 18} 108 q18 8 36 0`} stroke="#f2d788" strokeWidth="1.6" fill="none" opacity=".7" />
        </g>)}
      </g>
      {/* стрелка-указатель */}
      <path d={c.calib ? 'M100 76 l-10 20' : 'M100 76 v20'} stroke="#8a2c1c" strokeWidth="2" />
      <rect x="88" y="150" width="24" height="10" rx="3" fill={BR} stroke="#8a6c1e" strokeWidth="1.2" />
    </g>
  },
  compass: {
    sil: 'M52 60 h96 v96 h-96 z',
    d: c => <g>
      <Sh rx={46} />
      {/* тренога */}
      <path d="M84 148 l-14 22 M116 148 l14 22 M100 150 v22" stroke="#5c4f38" strokeWidth="4.4" strokeLinecap="round" />
      {/* корпус */}
      <circle cx="100" cy="108" r="44" fill={BR} />
      <circle cx="100" cy="108" r="44" fill="none" stroke="#8a6c1e" strokeWidth="2.2" />
      <path d="M70 78 a44 44 0 0 1 26 -14" stroke="#f2d788" strokeWidth="4.4" fill="none" opacity=".7" strokeLinecap="round" />
      <circle cx="100" cy="108" r="36" fill="#2c3542" />
      <circle cx="100" cy="108" r="36" fill="none" stroke="#f2d788" strokeWidth="1.2" opacity=".6" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <path key={i} d={`M${100 + Math.cos(a) * 30} ${108 + Math.sin(a) * 30} l${Math.cos(a) * 4.6} ${Math.sin(a) * 4.6}`} stroke="#e3d9c0" strokeWidth={i % 4 === 0 ? 2.2 : 1.1} />;
      })}
      <path d="M100 84 l5 24 -5 4 -5 -4z" fill="#b5533c" transform={c.broken ? 'rotate(120 100 108)' : c.calib ? 'rotate(-38 100 108)' : undefined} />
      <path d="M100 132 l-5 -24 5 -4 5 4z" fill="#e3d9c0" transform={c.broken ? 'rotate(120 100 108)' : c.calib ? 'rotate(-38 100 108)' : undefined} />
      <circle cx="100" cy="108" r="3.4" fill={BR} />
      {/* стекло-блик */}
      <path d="M76 92 q10 -12 26 -12" stroke="#fff" strokeWidth="3.4" fill="none" opacity=".4" strokeLinecap="round" />
      <rect x="94" y="60" width="12" height="7" rx="3" fill={BR} />
    </g>
  },
  sewing: {
    sil: 'M40 60 h124 v106 h-124 z',
    d: c => <g>
      <Sh rx={62} />
      {/* деревянная подставка */}
      <rect x="40" y="150" width="124" height="14" rx="4" fill={WD} />
      <path d="M40 150 h124 v4 h-124z" fill="#c8a97e" opacity=".5" />
      {/* корпус чёрный с золотом */}
      <path d="M56 150 v-34 q0 -14 14 -14 h58 q14 0 14 14 v10 q0 8 -8 8 h-46 q-8 0 -8 8 v8z" fill={BL} />
      <path d="M120 102 q14 0 14 14 v10 q0 8 -8 8 h-10z" fill="rgba(0,0,0,.4)" />
      <Hi d="M60 116 q0 -10 10 -10 h20 l-4 6 h-14 q-8 0 -8 8z" o={.16} />
      {/* золотая вязь */}
      <path d="M66 128 q8 -8 16 0 q8 8 16 0 M104 112 q6 -6 12 0" stroke="#d9b23f" strokeWidth="1.8" fill="none" opacity=".85" />
      <path d="M70 140 q10 -6 20 0" stroke="#d9b23f" strokeWidth="1.4" fill="none" opacity=".6" />
      {/* маховик */}
      <circle cx="140" cy="118" r="12" fill={SD} />
      <circle cx="140" cy="118" r="6" fill={ST} />
      {[0, 90, 180, 270].map(a => <path key={a} d="M140 108 v6" stroke="#3a3630" strokeWidth="2.4" transform={`rotate(${a} 140 118)`} />)}
      {/* игла + лапка */}
      <rect x="76" y="132" width="7" height="14" rx="2" fill={ST} />
      <path d="M79.5 146 v8" stroke={ST} strokeWidth="2" />
      <path d="M72 150 h16" stroke={SD} strokeWidth="3" />
      {c.broken && <g><circle cx="140" cy="118" r="12" fill="rgba(20,12,6,.45)" /><path d="M134 112 l6 6 -3 4 7 6" stroke="#0e0e12" strokeWidth="2" fill="none" /></g>}
    </g>
  },
  binoculars: {
    sil: 'M56 66 h88 v86 h-88 z',
    d: c => <g>
      <Sh rx={44} />
      {/* два ствола */}
      {[78, 122].map(cx => <g key={cx}>
        <path d={`M${cx - 15} 78 q15 -10 30 0 l4 62 q-19 10 -38 0z`} fill={BL} />
        <path d={`M${cx - 15} 78 q15 -10 30 0 l1 14 q-16 -8 -32 0z`} fill="#3a3a3e" />
        <ellipse cx={cx} cy="142" rx="19" ry="7" fill={SD} />
        <ellipse cx={cx} cy="140" rx="15" ry="5.4" fill="#2a2a3a" />
        <path d={`M${cx - 8} 138 q4 -3 9 -2`} stroke="#cfe0e0" strokeWidth="2" fill="none" opacity=".7" />
        <ellipse cx={cx} cy="76" rx="11" ry="4.6" fill={SD} />
        {/* перламутровые вставки */}
        <path d={`M${cx - 12} 96 q12 -6 24 0 l1 18 q-13 -6 -26 0z`} fill="#e8e2d4" opacity=".9" />
        <path d={`M${cx - 10} 100 q10 -4 20 0`} stroke="#b8b0a0" strokeWidth="1.2" fill="none" />
      </g>)}
      {/* мост + колесо */}
      <rect x="92" y="92" width="16" height="26" rx="4" fill={SD} />
      <rect x="96" y="84" width="8" height="10" rx="3" fill={BR} />
      {[0, 1, 2].map(i => <path key={i} d={`M96 ${86 + i * 3} h8`} stroke="#8a6c1e" strokeWidth="1.2" />)}
      {c.broken && <g><path d="M112 96 l8 10 -5 5 9 9" stroke="#0e0e12" strokeWidth="2.2" fill="none" /><ellipse cx="122" cy="140" rx="15" ry="5.4" fill="rgba(10,10,14,.7)" /></g>}
    </g>
  },
  samovar: {
    sil: 'M62 44 h76 v126 h-76 z',
    d: c => <g>
      <Sh rx={40} />
      {/* основание */}
      <path d="M78 156 q22 10 44 0 l4 10 q-26 10 -52 0z" fill={BR} />
      <path d="M84 148 h32 v10 h-32z" fill="#a8842a" />
      {/* тело-ваза */}
      <path d="M82 74 q-10 22 -6 44 q4 22 24 26 q20 -4 24 -26 q4 -22 -6 -44z" fill={BR} />
      <path d="M108 74 q10 22 6 44 q-3 18 -16 24 q16 -2 20 -24 q4 -22 -6 -44z" fill="rgba(90,50,10,.45)" />
      <Hi d="M86 80 q-6 20 -3 38 q2 12 10 18 q-10 -14 -10 -30 q0 -14 3 -26z" o={.5} />
      {/* шейка + корона */}
      <rect x="90" y="62" width="20" height="14" rx="3" fill="#a8842a" />
      <path d="M86 62 q14 -12 28 0 z" fill={BR} />
      <path d="M92 50 q8 -10 16 0 l-2 6 h-12z" fill={BR} />
      <circle cx="100" cy="46" r="4.4" fill={BR} stroke="#8a6c1e" strokeWidth="1.2" />
      {/* ручки */}
      <path d="M80 88 q-14 4 -12 16 q1 8 10 10 M120 88 q14 4 12 16 q-1 8 -10 10" stroke={BR} strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* краник */}
      <path d="M100 140 v8" stroke="#a8842a" strokeWidth="6" />
      <path d="M92 148 q8 8 16 0 l-2 10 q-6 4 -12 0z" fill={BR} />
      <circle cx="100" cy="146" r="3.4" fill="#8a6c1e" />
      <path d="M88 146 h-8 M112 146 h8" stroke="#8a6c1e" strokeWidth="3" strokeLinecap="round" />
      {c.broken && <g><path d="M88 100 l8 10 -5 6 10 10" stroke="#5a3a10" strokeWidth="2.4" fill="none" /><circle cx="100" cy="146" r="5" fill="rgba(60,30,8,.6)" /></g>}
    </g>
  },
  kerosene: {
    sil: 'M64 40 h72 v130 h-72 z',
    d: c => <g>
      <Sh rx={34} />
      {/* резервуар-стекло */}
      <path d="M74 128 q-6 -18 6 -26 h40 q12 8 6 26 q-4 16 -26 16 q-22 0 -26 -16z" fill={GL} opacity=".9" />
      <path d="M78 118 q22 10 44 0 l-2 12 q-20 8 -40 0z" fill="#d9b23f" opacity=".35" />
      <Hi d="M80 108 q-3 10 0 20 q1 6 5 10 q-6 -12 -3 -30z" o={.6} />
      {/* горелка */}
      <rect x="88" y="92" width="24" height="12" rx="3" fill={BR} />
      <circle cx="116" cy="98" r="4.4" fill={BR} stroke="#8a6c1e" strokeWidth="1.2" />
      <path d="M120 98 h6" stroke="#8a6c1e" strokeWidth="2.4" />
      {/* стекло-цилиндр */}
      <path d="M90 92 q-6 -22 4 -34 q6 -7 12 0 q10 12 4 34z" fill={GL} opacity=".55" />
      <path d="M93 88 q-4 -18 3 -28" stroke="#fff" strokeWidth="2" fill="none" opacity=".6" />
      <path d="M96 60 q4 -6 8 0" stroke="#cfe0e0" strokeWidth="2" fill="none" opacity=".7" />
      {/* фитиль-колпачок */}
      <path d="M96 58 q4 -8 8 0z" fill={SD} />
      {c.broken && <path d="M92 70 l6 8 -4 5 8 8" stroke="#9ab8b8" strokeWidth="2" fill="none" opacity=".9" />}
    </g>
  },
  iron: {
    sil: 'M48 84 h104 v66 h-104 z',
    d: c => <g>
      <Sh rx={52} />
      {/* подошва */}
      <path d="M50 140 q50 14 100 0 l-4 10 q-46 12 -92 0z" fill={ST} />
      <path d="M54 146 q46 10 92 0" stroke="#fff" strokeWidth="2" fill="none" opacity=".5" />
      {/* корпус-чугун */}
      <path d="M54 140 q-4 -26 16 -34 q30 -10 60 0 q20 8 16 34z" fill={SD} />
      <path d="M112 106 q18 8 14 34 h-16z" fill="rgba(0,0,0,.35)" />
      <Hi d="M62 116 q10 -8 26 -9 l-3 7 q-13 1 -20 8z" o={.3} />
      {/* ручка */}
      <path d="M70 104 q0 -18 30 -18 q30 0 30 18" stroke={WD} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M70 104 q0 -18 30 -18 q30 0 30 18" stroke="#c8a97e" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".5" />
      <path d="M78 104 v-6 M122 104 v-6" stroke={SD} strokeWidth="5" />
      {/* носик */}
      <path d="M54 138 q-8 -6 -6 -14 q6 2 10 8z" fill={SD} />
      {c.broken && <g><path d="M84 118 l8 8 -4 5 10 8" stroke="#24221c" strokeWidth="2.4" fill="none" /><circle cx="100" cy="126" r="7" fill="rgba(20,12,6,.4)" /></g>}
    </g>
  },
  spindle: {
    sil: 'M40 44 h124 v124 h-124 z',
    d: c => <g>
      <Sh rx={58} />
      {/* стол-доска */}
      <path d="M44 150 h112 l6 12 H38z" fill={WD} />
      <rect x="52" y="160" width="10" height="12" fill="#4a3620" /><rect x="138" y="160" width="10" height="12" fill="#4a3620" />
      {/* колесо */}
      <circle cx="76" cy="112" r="34" fill="none" stroke={W} strokeWidth="7" />
      <circle cx="76" cy="112" r="34" fill="none" stroke="#4a3620" strokeWidth="1.6" />
      {[0, 45, 90, 135].map(a => <path key={a} d="M76 80 v64" stroke={W} strokeWidth="4" transform={`rotate(${a + (c.broken ? 18 : 0)} 76 112)`} />)}
      <circle cx="76" cy="112" r="6" fill={WD} />
      {c.broken && <path d="M76 80 v26" stroke="#241a12" strokeWidth="3" transform="rotate(24 76 112)" />}
      {/* привод */}
      <path d="M104 100 q22 4 30 18 q-10 10 -30 8" stroke="#8a7a5a" strokeWidth="2" fill="none" />
      {/* стойка + веретено */}
      <path d="M126 148 v-40 q0 -8 8 -8 h14" stroke={WD} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M148 108 h18" stroke={ST} strokeWidth="4" strokeLinecap="round" />
      {/* кудель */}
      <path d="M132 96 q-6 -22 6 -34 q10 8 8 34z" fill="#c8b898" />
      <path d="M134 88 q4 -14 8 -18 M138 92 q3 -12 6 -16" stroke="#a89878" strokeWidth="1.6" fill="none" />
      <path d="M130 98 h16" stroke="#8a4a3c" strokeWidth="3" />
      {/* педаль */}
      <path d="M96 162 l10 10 h18" stroke={WD} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  },
  sugar: {
    sil: 'M56 60 h88 v96 h-88 z',
    d: c => <g>
      <Sh rx={42} />
      {/* ножка */}
      <path d="M86 150 q14 8 28 0 l4 8 q-18 8 -36 0z" fill={EN} />
      <path d="M92 142 h16 v10 h-16z" fill="#d8ceb4" />
      {/* тело */}
      <path d="M66 104 q-4 26 14 36 q20 8 40 0 q18 -10 14 -36z" fill={EN} />
      <path d="M116 104 q6 26 -8 36 q14 -4 18 -18 q3 -10 2 -18z" fill="rgba(20,12,6,.14)" />
      <Hi d="M72 110 q-2 18 10 28 q-14 -6 -16 -28z" o={.55} />
      {/* роспись */}
      <path d="M84 122 q6 -8 12 0 q6 8 12 0" stroke="#4a6a8a" strokeWidth="2.4" fill="none" />
      <circle cx="90" cy="130" r="2.4" fill="#4a6a8a" /><circle cx="110" cy="130" r="2.4" fill="#4a6a8a" />
      <path d="M96 126 q4 -4 8 0 q-4 4 -8 0z" fill="#8a4a3c" />
      {/* ручки */}
      <path d="M66 110 q-10 2 -8 12 q1 6 8 8 M134 110 q10 2 8 12 q-1 6 -8 8" stroke={EN} strokeWidth="5" fill="none" />
      {/* крышка */}
      <path d="M64 104 q36 -14 72 0 q-36 10 -72 0z" fill="#e8e0cc" />
      <path d="M70 98 q30 -18 60 0 q-30 -6 -60 0z" fill={EN} />
      <path d="M96 84 q4 -8 8 0 q2 6 -4 8 q-6 -2 -4 -8z" fill={BR} />
      {c.broken && <path d="M78 112 l7 9 -4 5 9 9" stroke="#9a917c" strokeWidth="2.2" fill="none" />}
    </g>
  },
  photoalbum: {
    sil: 'M48 62 h104 v92 h-104 z',
    d: c => <g>
      <Sh rx={52} />
      {/* страницы */}
      <rect x="52" y="70" width="98" height="80" rx="3" fill="#e8e0cc" />
      {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M${150} ${74 + i * 3} h4`} stroke="#c8bc9e" strokeWidth="2" />)}
      {/* бархатная крышка */}
      <rect x="48" y="62" width="100" height="86" rx="5" fill={VL} />
      <rect x="48" y="62" width="100" height="86" rx="5" fill="none" stroke="#3f1c16" strokeWidth="2" />
      <path d="M132 62 h16 v86 h-12 q-2 -43 -4 -86z" fill="rgba(0,0,0,.3)" />
      <Hi d="M54 68 h26 v74 h-6 q-10 -37 -20 -74z" o={.1} />
      {/* тиснение */}
      <rect x="62" y="76" width="72" height="58" rx="3" fill="none" stroke="#d9b23f" strokeWidth="1.8" opacity=".8" />
      <rect x="68" y="82" width="60" height="46" rx="2" fill="none" stroke="#d9b23f" strokeWidth="1" opacity=".5" />
      <path d="M84 100 q14 -10 28 0 q-6 14 -14 16 q-8 -2 -14 -16z" fill="#d9b23f" opacity=".85" />
      <path d="M98 100 v16 M92 106 h12" stroke="#8a6c1e" strokeWidth="1.2" opacity=".7" />
      {/* уголки + застёжка */}
      <path d="M48 62 l14 0 -14 14z M148 62 l-14 0 14 14z M48 148 l14 0 -14 -14z M148 148 l-14 0 14 -14z" fill={BR} />
      <rect x="146" y="98" width="10" height="14" rx="3" fill={BR} />
      {c.broken && <path d="M70 84 l10 10 -5 6 12 10" stroke="#2c1210" strokeWidth="2.2" fill="none" />}
    </g>
  },
  books: {
    sil: 'M44 66 h112 v96 h-112 z',
    d: c => <g>
      <Sh rx={56} />
      {/* нижний том */}
      <rect x="46" y="132" width="108" height="26" rx="3" fill="#5a6a5a" />
      <rect x="46" y="132" width="108" height="5" fill="#e8e0cc" />
      <path d="M52 140 h96 M52 148 h80" stroke="#3f4a3f" strokeWidth="1.6" opacity=".7" />
      <rect x="46" y="132" width="12" height="26" fill="#48584a" />
      {/* средний */}
      <rect x="54" y="102" width="94" height="26" rx="3" fill="#7c3a2e" />
      <rect x="54" y="102" width="94" height="5" fill="#e8e0cc" />
      <path d="M62 112 h78 M62 120 h60" stroke="#5a2820" strokeWidth="1.6" opacity=".8" />
      <rect x="54" y="102" width="11" height="26" fill="#632e24" />
      <path d="M70 108 h60" stroke="#d9b23f" strokeWidth="1.6" opacity=".8" />
      {/* верхний */}
      <rect x="62" y="74" width="80" height="24" rx="3" fill="#3f4a5a" />
      <rect x="62" y="74" width="80" height="4.6" fill="#e8e0cc" />
      <rect x="62" y="74" width="10" height="24" fill="#333d4a" />
      <path d="M78 82 h50 M78 89 h36" stroke="#d9b23f" strokeWidth="1.5" opacity=".85" />
      {/* закладка */}
      <path d="M120 98 v14 l4 -4 4 4 v-14z" fill="#b5533c" />
      {c.broken && <path d="M70 108 l8 8 -4 5 10 8" stroke="#3a1c16" strokeWidth="2" fill="none" />}
    </g>
  },
  podstakannik: {
    sil: 'M62 56 h76 v108 h-76 z',
    d: c => <g>
      <Sh rx={34} />
      {/* стакан с чаем */}
      <path d="M80 66 h40 l-4 62 h-32z" fill={GL} opacity=".55" />
      <path d="M82 84 h36 l-3 44 h-30z" fill="#8a4a24" opacity=".75" />
      <path d="M84 68 q-2 20 0 40" stroke="#fff" strokeWidth="2.4" fill="none" opacity=".55" />
      <ellipse cx="100" cy="66" rx="20" ry="5" fill="#e8f4f4" opacity=".8" />
      {/* корпус подстаканника */}
      <path d="M78 92 h44 l-3 40 h-38z" fill={BR} />
      <path d="M110 92 h12 l-3 40 h-10z" fill="rgba(90,50,10,.45)" />
      <path d="M80 100 h40 M81 112 h38" stroke="#f2d788" strokeWidth="1.4" opacity=".6" />
      <path d="M86 104 q7 -6 14 0 q7 6 14 0" stroke="#8a6c1e" strokeWidth="1.6" fill="none" />
      {/* ручка */}
      <path d="M122 98 q16 4 14 18 q-2 12 -16 14" stroke={BR} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M122 98 q16 4 14 18 q-2 12 -16 14" stroke="#f2d788" strokeWidth="1.8" fill="none" opacity=".5" />
      {/* дно */}
      <path d="M76 132 q24 10 48 0 l2 8 q-26 10 -52 0z" fill="#a8842a" />
      {c.broken && <path d="M88 98 l7 9 -4 5 9 8" stroke="#5a3a10" strokeWidth="2.2" fill="none" />}
    </g>
  },
  jug: {
    sil: 'M68 56 h64 v108 h-64 z',
    d: c => <g>
      <Sh rx={32} />
      <path d="M84 64 q-4 10 -8 16 q-10 16 -8 40 q2 30 32 32 q30 -2 32 -32 q2 -24 -8 -40 q-4 -6 -8 -16z" fill="#b08968" />
      <path d="M112 68 q10 16 12 36 q2 26 -18 34 q22 -4 24 -32 q2 -22 -10 -38z" fill="rgba(20,12,6,.2)" />
      <Hi d="M84 84 q-6 18 -4 36 q1 12 8 18 q-8 -16 -6 -34 q1 -12 2 -20z" o={.35} />
      {/* глазурь */}
      <path d="M76 96 q24 10 48 0 l2 14 q-26 10 -52 0z" fill="#7c9a8a" opacity=".8" />
      <path d="M80 102 q20 8 40 0" stroke="#5c7a6a" strokeWidth="1.6" fill="none" />
      {/* горло + ручка */}
      <path d="M84 64 q16 -8 32 0 l-2 8 q-14 -6 -28 0z" fill="#9a7658" />
      <path d="M116 76 q14 6 12 22 q-1 10 -10 14" stroke="#b08968" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* скол (физический) */}
      <path d="M78 128 q6 -8 12 -2 q-2 8 -10 8z" fill="#d8cdb8" />
      <path d="M78 128 q6 -8 12 -2" stroke="#8a6a48" strokeWidth="1.6" fill="none" />
    </g>
  },
  horseshoe: {
    sil: 'M56 52 h88 v104 h-88 z',
    d: () => <g>
      <Sh rx={40} />
      <path d="M64 150 q-14 -50 6 -78 q14 -18 30 -18 q16 0 30 18 q20 28 6 78 l-16 -4 q10 -42 -4 -64 q-8 -12 -16 -12 q-8 0 -16 12 q-14 22 -4 64z" fill={SD} />
      <path d="M64 150 q-14 -50 6 -78 q8 -11 18 -15 q-12 8 -18 20 q-16 30 -4 73z" fill="rgba(255,255,255,.14)" />
      {/* ржавчина */}
      <circle cx="76" cy="96" r="7" fill="#8a4a24" opacity=".7" /><circle cx="80" cy="100" r="4" fill="#a85c2c" opacity=".8" />
      <circle cx="122" cy="120" r="8" fill="#8a4a24" opacity=".65" /><circle cx="118" cy="116" r="4.4" fill="#a85c2c" opacity=".8" />
      <circle cx="100" cy="62" r="6" fill="#8a4a24" opacity=".6" />
      {/* отверстия */}
      {[[72, 132], [70, 112], [78, 84], [100, 68], [122, 84], [130, 112], [128, 132]].map(([x, y], i) => <rect key={i} x={x - 2.4} y={y - 3.4} width="4.8" height="6.8" rx="1.6" fill="#24221c" transform={`rotate(${i * 8 - 24} ${x} ${y})`} />)}
    </g>
  },
  valenok: {
    sil: 'M68 48 h72 v116 h-72 z',
    d: () => <g>
      <Sh rx={40} />
      <path d="M84 56 q-6 40 -2 62 q-14 6 -16 22 q-1 14 14 16 q26 3 44 -2 q10 -3 8 -14 q-2 -10 -14 -14 q-8 -3 -10 -12 q-4 -26 -2 -58z" fill="url(#g-felt)" />
      <path d="M104 56 q2 34 4 58 q2 9 10 12 q12 4 14 14 q1 6 -3 10 q10 -4 8 -14 q-2 -10 -14 -14 q-8 -3 -10 -12 q-4 -26 -2 -58z" fill="rgba(20,12,6,.22)" />
      <Hi d="M86 62 q-4 34 -1 54 q-6 4 -10 10 q2 -10 6 -12 q-3 -22 1 -52z" o={.3} />
      {/* шов + отворот */}
      <path d="M84 60 q10 6 20 0" stroke="#5d584c" strokeWidth="2.4" fill="none" />
      <path d="M70 128 q22 -8 44 4" stroke="#5d584c" strokeWidth="2" strokeDasharray="4 3" fill="none" />
      <path d="M66 148 q30 8 62 0" stroke="#5d584c" strokeWidth="2.4" fill="none" />
      {/* заплатка */}
      <path d="M92 96 q8 -4 12 2 q2 8 -6 10 q-8 1 -6 -12z" fill="#7a7568" stroke="#5d584c" strokeWidth="1.4" strokeDasharray="3 2" />
    </g>
  },
  buttons: {
    sil: 'M56 76 h88 v80 h-88 z',
    d: () => <g>
      <Sh rx={44} />
      {/* жестянка */}
      <path d="M60 92 h80 v56 q-40 10 -80 0z" fill={SD} />
      <ellipse cx="100" cy="92" rx="40" ry="10" fill={ST} />
      <ellipse cx="100" cy="92" rx="34" ry="7.4" fill="#8d887c" />
      <path d="M62 104 h76" stroke="#fff" strokeWidth="2" opacity=".35" />
      {/* этикетка */}
      <rect x="70" y="108" width="60" height="26" rx="3" fill="#e8e0cc" />
      <path d="M76 116 h48 M76 122 h36 M76 128 h42" stroke="#8a7a5a" strokeWidth="1.8" />
      <circle cx="120" cy="121" r="6" fill="#b5533c" opacity=".85" />
      {/* пуговицы россыпью */}
      {[[64, 156, 7, '#b5533c'], [82, 162, 6, '#4f6a6a'], [102, 158, 8, '#d9b23f'], [124, 162, 6, '#efe3cc'], [140, 154, 7, '#7a6a8f']].map(([x, y, r, c], i) => (
        <g key={i}><circle cx={x as number} cy={y as number} r={r as number} fill={c as string} stroke="rgba(20,12,6,.4)" strokeWidth="1.2" />
          <circle cx={(x as number) - 2} cy={(y as number) - 1} r="1.1" fill="#3a2c1d" /><circle cx={(x as number) + 2} cy={(y as number) - 1} r="1.1" fill="#3a2c1d" />
          <circle cx={(x as number) - 2} cy={(y as number) + 2} r="1.1" fill="#3a2c1d" /><circle cx={(x as number) + 2} cy={(y as number) + 2} r="1.1" fill="#3a2c1d" /></g>
      ))}
    </g>
  },
  vhs: {
    sil: 'M40 78 h120 v64 h-120 z',
    d: c => <g>
      <Sh rx={56} />
      <rect x="40" y="78" width="120" height="64" rx="5" fill="#26262a" />
      <rect x="40" y="78" width="120" height="64" rx="5" fill="none" stroke="#141416" strokeWidth="2" />
      <Hi d="M44 82 h50 v8 h-46 q-2 20 -4 40z" o={.1} />
      {/* окно с лентой */}
      <rect x="56" y="92" width="88" height="26" rx="3" fill="#141416" />
      {[76, 124].map(cx => <g key={cx}><circle cx={cx} cy="105" r="9.5" fill="#e3d9c0" opacity=".9" /><circle cx={cx} cy="105" r="3.4" fill="#26262a" />{[0, 120, 240].map(a => <path key={a} d={`M${cx} 97 v4`} stroke="#26262a" strokeWidth="2" transform={`rotate(${a} ${cx} 105)`} />)}</g>)}
      <path d="M86 105 h28" stroke="#3a2c26" strokeWidth="4" />
      {/* этикетка */}
      <rect x="56" y="124" width="60" height="12" rx="2" fill="#e8e0cc" />
      <path d="M60 130 h40" stroke="#8a7a5a" strokeWidth="1.6" />
      <path d="M126 124 h18 v12 h-18z" fill="#b5533c" opacity=".8" />
      {c.broken && <g><path d="M70 96 l8 8 -4 4 10 8" stroke="#0a0a0c" strokeWidth="2" fill="none" /><path d="M96 105 q8 -6 16 0" stroke="#5a463c" strokeWidth="2.4" fill="none" /></g>}
    </g>
  },
  mirror: {
    sil: 'M60 44 h80 v120 h-80 z',
    d: c => <g>
      <Sh rx={34} />
      {/* ручка */}
      <path d="M96 132 q-4 20 0 30 q4 6 8 0 q4 -10 0 -30z" fill={WD} />
      <path d="M98 140 q2 12 0 20" stroke="#c8a97e" strokeWidth="1.6" fill="none" opacity=".6" />
      <circle cx="100" cy="164" r="4" fill={BR} />
      {/* оправа */}
      <ellipse cx="100" cy="88" rx="40" ry="46" fill={BR} />
      <ellipse cx="100" cy="88" rx="40" ry="46" fill="none" stroke="#8a6c1e" strokeWidth="2" />
      <path d="M72 56 a40 46 0 0 1 24 -14" stroke="#f2d788" strokeWidth="4" fill="none" opacity=".7" strokeLinecap="round" />
      <ellipse cx="100" cy="88" rx="32" ry="38" fill={GL} />
      <path d="M82 66 q10 -12 24 -10" stroke="#fff" strokeWidth="4" fill="none" opacity=".65" strokeLinecap="round" />
      <path d="M86 108 q8 8 20 6" stroke="#fff" strokeWidth="2" fill="none" opacity=".35" />
      {/* узор оправы */}
      <path d="M100 40 q-6 -8 0 -12 q6 4 0 12z M64 88 q-8 -4 -8 -10 q8 0 8 10z M136 88 q8 -4 8 -10 q-8 0 -8 10z" fill="#a8842a" />
      {c.broken && <g stroke="#5d7878" strokeWidth="2.2" fill="none" opacity=".95">
        <path d="M84 62 l12 16 -6 8 14 14 -4 10" /><path d="M96 78 l-12 10 M100 92 l16 8 M104 100 l-8 14" strokeWidth="1.6" />
      </g>}
    </g>
  },
  pins: {
    sil: 'M52 84 h96 v68 h-96 z',
    d: () => <g>
      <Sh rx={46} />
      {/* подушечка */}
      <path d="M56 116 q-4 -26 44 -28 q48 2 44 28 q-3 26 -44 28 q-41 -2 -44 -28z" fill="#8a4a3c" />
      <path d="M100 88 q44 2 42 28 q-2 20 -30 26 q26 -10 26 -28 q0 -20 -38 -26z" fill="rgba(20,12,6,.25)" />
      <Hi d="M64 104 q10 -12 30 -12 q-18 4 -24 14 q-4 8 -2 16 q-6 -8 -4 -18z" o={.25} />
      <path d="M60 116 q40 12 80 0" stroke="#6e3a2e" strokeWidth="1.6" fill="none" />
      {/* значки */}
      {[[76, 104, '#d9b23f', 8], [100, 98, '#4f6a6a', 9], [124, 106, '#efe3cc', 7], [88, 122, '#b5533c', 7], [112, 124, '#7a6a8f', 8]].map(([x, y, c, r], i) => (
        <g key={i}>
          <circle cx={x as number} cy={y as number} r={r as number} fill={c as string} stroke="rgba(20,12,6,.45)" strokeWidth="1.4" />
          <circle cx={(x as number) - (r as number) * .3} cy={(y as number) - (r as number) * .35} r={(r as number) * .3} fill="#fff" opacity=".5" />
          <path d={`M${(x as number) - 3} ${(y as number)} h6`} stroke="rgba(20,12,6,.5)" strokeWidth="1.4" />
        </g>
      ))}
      {/* булавка воткнута */}
      <path d="M132 92 l10 -14" stroke={ST} strokeWidth="2" />
      <circle cx="143" cy="76" r="3.4" fill="#b5533c" />
    </g>
  },
  thermo: {
    sil: 'M70 44 h60 v124 h-60 z',
    d: c => <g>
      <Sh rx={28} />
      {/* корпус */}
      <rect x="76" y="72" width="48" height="92" rx="10" fill={ST} />
      <path d="M108 72 h16 v92 h-12z" fill="rgba(20,12,6,.25)" />
      <Hi d="M80 78 h8 v80 h-6 q-4 -40 -2 -80z" o={.5} />
      {/* крышка-чашка */}
      <path d="M74 56 h52 v14 q-26 8 -52 0z" fill="#b5533c" />
      <ellipse cx="100" cy="56" rx="26" ry="6" fill="#93392a" />
      <ellipse cx="100" cy="55" rx="20" ry="4" fill="#7c2a1c" />
      {/* пояс + ремень */}
      <rect x="76" y="104" width="48" height="10" fill="#4f3a26" />
      <path d="M124 108 q14 4 12 20 q-1 12 -12 16" stroke="#4f3a26" strokeWidth="4" fill="none" />
      <rect x="94" y="102" width="12" height="14" rx="2" fill={BR} />
      <path d="M80 148 h40" stroke="#8d887c" strokeWidth="2" opacity=".7" />
      {c.broken && <g><path d="M86 84 l8 10 -4 5 9 9" stroke="#5d584c" strokeWidth="2.2" fill="none" /><path d="M76 128 q24 8 48 0" stroke="#5d584c" strokeWidth="2" fill="none" /></g>}
    </g>
  },
  fishing: {
    sil: 'M40 40 h124 v124 h-124 z',
    d: c => <g>
      <Sh rx={50} />
      {/* удилище по диагонали */}
      <path d="M52 160 L148 48" stroke="#b08968" strokeWidth="5" strokeLinecap="round" />
      <path d="M52 160 L148 48" stroke="#d8b898" strokeWidth="1.8" strokeLinecap="round" opacity=".7" />
      {/* секции-стыки */}
      {[0.25, 0.5, 0.75].map(t => <rect key={t} x={52 + 96 * t - 3} y={160 - 112 * t - 4} width="7" height="9" rx="2" fill="#4f3a26" transform={`rotate(-49 ${52 + 96 * t} ${160 - 112 * t})`} />)}
      {/* кольца */}
      {[0.35, 0.6, 0.85].map(t => <circle key={t} cx={52 + 96 * t + 5} cy={160 - 112 * t + 4} r="3.4" fill="none" stroke={SD} strokeWidth="1.8" />)}
      {/* ручка пробка */}
      <path d="M48 164 l14 -16" stroke="#c8a97e" strokeWidth="9" strokeLinecap="round" />
      {/* катушка */}
      <circle cx="70" cy="142" r="12" fill={SD} />
      <circle cx="70" cy="142" r="6" fill={ST} />
      <circle cx="70" cy="142" r="2" fill="#3a3630" />
      <path d="M78 148 l6 6" stroke={SD} strokeWidth="3" strokeLinecap="round" />
      <circle cx="84" cy="154" r="3" fill={BK} />
      {c.broken && <path d="M112 90 l6 8 -8 6" stroke="#5c4f38" strokeWidth="2.4" fill="none" />}
      {/* леска */}
      <path d="M148 48 q10 16 -2 26" stroke="#cfe0e0" strokeWidth="1.2" fill="none" opacity=".7" />
    </g>
  },
  guitar: {
    sil: 'M44 36 h112 v132 h-112 z',
    d: c => <g>
      <Sh rx={44} />
      {/* гриф */}
      <rect x="94" y="36" width="12" height="70" rx="3" fill={WD} />
      {[44, 54, 64, 74, 84, 94].map(y => <path key={y} d={`M94 ${y} h12`} stroke="#c8a97e" strokeWidth="1.4" />)}
      {/* голова */}
      <path d="M92 36 h16 v-4 q4 -6 0 -10 h-16 q-4 4 0 10z" fill={BK} />
      {[[90, 26], [90, 32], [110, 26], [110, 32]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" fill={BR} />)}
      {/* корпус-восьмёрка */}
      <path d="M100 100 q-30 -6 -38 16 q-7 20 8 34 q14 13 30 13 q16 0 30 -13 q15 -14 8 -34 q-8 -22 -38 -16z" fill={W} />
      <path d="M118 102 q16 6 20 22 q5 18 -8 30 q-8 8 -18 10 q14 -4 20 -14 q10 -16 4 -30 q-5 -13 -18 -18z" fill="rgba(20,12,6,.25)" />
      <Hi d="M74 108 q-8 8 -8 20 q0 10 6 18 q-10 -12 -6 -26 q2 -8 8 -12z" o={.3} />
      {/* розетка */}
      <circle cx="100" cy="126" r="13" fill="#241a12" />
      <circle cx="100" cy="126" r="16" fill="none" stroke="#4a3620" strokeWidth="2.4" />
      <circle cx="100" cy="126" r="18.5" fill="none" stroke="#d9b23f" strokeWidth="1.2" opacity=".7" />
      {/* струны + подставка */}
      {[-4, -1.4, 1.4, 4].map(dx => <path key={dx} d={`M${100 + dx * .6} 36 L${100 + dx} 150`} stroke="#e3d9c0" strokeWidth={dx === -4 || dx === 4 ? 1 : 0.8} opacity=".85" />)}
      <rect x="88" y="148" width="24" height="6" rx="2" fill={BK} />
      {c.broken && <g><path d="M96 120 l4 6 -3 4 5 6" stroke="#0e0a06" strokeWidth="1.8" fill="none" /><path d="M100 100 l2 50" stroke="#0e0a06" strokeWidth="1.2" opacity=".8" /></g>}
    </g>
  },
  chess: {
    sil: 'M40 84 h120 v76 h-120 z',
    d: c => <g>
      <Sh rx={58} />
      {/* доска в перспективе */}
      <path d="M48 128 h104 l10 28 H38z" fill={WD} />
      <path d="M52 130 h96 l8 22 H44z" fill="#e3d9c0" />
      {Array.from({ length: 4 }).map((_, r) => Array.from({ length: 8 }).map((_, i) =>
        (i + r) % 2 === 0 ? null :
          <path key={`${r}-${i}`} d={`M${52 + i * 12 + r * 2} ${130 + r * 5.5} h12 l2 5.5 h-12z`} fill="#5a4632" />))}
      {/* фигуры */}
      <g transform="translate(70 108)">
        <path d="M-6 20 q6 4 12 0 l-2 -12 q-4 -3 -8 0z" fill="#efe3cc" stroke="#b0a488" strokeWidth="1.2" />
        <path d="M-4 8 q4 -3 8 0 l1 -6 q-5 -3 -10 0z" fill="#efe3cc" stroke="#b0a488" strokeWidth="1.2" />
        <path d="M0 -4 v6 M-3 -1 h6" stroke="#b0a488" strokeWidth="2" />
      </g>
      <g transform="translate(104 112)">
        <path d="M-6 18 q6 4 12 0 l-2 -10 q-4 -3 -8 0z" fill="#3a2c1d" />
        <path d="M-4 8 q4 -3 8 0 l0 -5 q-4 -4 -8 0z" fill="#3a2c1d" />
        <circle cx="0" cy="-1" r="3.4" fill="#3a2c1d" />
      </g>
      <g transform="translate(132 118)">
        <path d="M-5 14 q5 3 10 0 l-1.6 -8 q-3.4 -2 -6.8 0z" fill="#efe3cc" stroke="#b0a488" strokeWidth="1.1" />
        <circle cx="0" cy="2" r="3.4" fill="#efe3cc" stroke="#b0a488" strokeWidth="1.1" />
      </g>
      {/* открытая крышка-коробка */}
      <path d="M48 128 l-6 -34 h104 l6 34z" fill={WD} opacity=".0" />
      <path d="M152 128 l8 -30 q1 -6 -5 -6 h-20" stroke={WD} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".9" />
      {c.broken && <path d="M60 140 l10 8 -5 5 12 8" stroke="#3a2c1d" strokeWidth="2" fill="none" />}
    </g>
  },
  pet: {
    sil: 'M64 60 h72 v96 h-72 z',
    d: c => <g>
      <Sh rx={32} />
      {/* корпус-кирпичик */}
      <path d="M70 70 q30 -12 60 0 l6 74 q-36 12 -72 0z" fill="#b5533c" />
      <path d="M116 66 q14 4 14 8 l6 70 q-8 4 -16 5z" fill="rgba(20,12,6,.25)" />
      <Hi d="M76 74 q12 -5 24 -5 l-2 8 q-10 0 -20 5z" o={.3} />
      {/* экран */}
      <rect x="80" y="82" width="40" height="30" rx="4" fill="#9ab89a" />
      <rect x="80" y="82" width="40" height="30" rx="4" fill="none" stroke="#7c3a2a" strokeWidth="2.4" />
      <rect x="84" y="86" width="32" height="22" rx="2" fill="#b8d0b0" />
      {/* пиксель-питомец */}
      {[[94, 96], [98, 96], [102, 96], [92, 100], [104, 100], [94, 104], [98, 104], [102, 104], [98, 92]].map(([x, y], i) => <rect key={i} x={x} y={y} width="3.4" height="3.4" fill="#3a4a3a" />)}
      {c.broken ? <path d="M86 88 l8 8 -4 4 9 8" stroke="#5a6a5a" strokeWidth="1.8" fill="none" /> :
        <g>{[[90, 92], [106, 92]].map(([x, y], i) => <rect key={i} x={x} y={y} width="2.6" height="2.6" fill="#3a4a3a" opacity=".7" />)}</g>}
      {/* кнопки */}
      {[88, 100, 112].map((x, i) => <circle key={x} cx={x} cy="126" r="5.4" fill={i === 1 ? '#efe3cc' : BK} stroke="#7c3a2a" strokeWidth="1.6" />)}
      <path d="M84 140 h32" stroke="#7c3a2a" strokeWidth="2" opacity=".7" />
      {/* цепочка-брелок */}
      <path d="M132 74 q10 -6 14 2" stroke={BR} strokeWidth="2.4" fill="none" />
      <circle cx="148" cy="78" r="4" fill="none" stroke={BR} strokeWidth="2.4" />
    </g>
  },
};

/* ---------- публичный компонент ---------- */
let uidc = 0;
export function ItemArt({ id, defects, seed = 1, size, className = '', style, dirty }: {
  id: string; defects?: DefectInst[]; seed?: number; size?: number | string; className?: string; style?: React.CSSProperties; dirty?: boolean;
}) {
  const def = REG[id];
  const uid = useMemo(() => `sil${(uidc++).toString(36)}`, []);
  const act = (defects || []).filter(d => !d.resolved);
  const ctx: Ctx = {
    hasPart: !act.some(d => d.id === 'missing_part'),
    broken: act.some(d => d.id === 'broken_mech'),
    calib: act.some(d => d.id === 'calibration'),
  };
  const surf = (defects || []).filter(d => ['dirt', 'dust', 'rust', 'scratches', 'worn', 'crack'].includes(d.id));
  const w = size ?? '100%';
  return (
    <div className={`itemart ${dirty ? 'sprite-dirty' : ''} ${className}`} style={{ width: w, height: w, aspectRatio: '1', position: 'relative', ...style }}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {def ? def.d(ctx) : <g><Sh /><rect x="56" y="64" width="88" height="100" rx="10" fill={W} /><rect x="70" y="84" width="60" height="40" rx="6" fill={DF} /></g>}
        {surf.length > 0 && <>
          {def?.sil && <clipPath id={uid}><path d={def.sil} /></clipPath>}
          <g clipPath={`url(#${uid})`}>
            <SurfaceInline defects={surf} seed={seed} />
          </g>
        </>}
        {/* физическая «нет детали»: гнездо + пунктир-подсказка */}
        {def && !ctx.hasPart && <MissingMark id={id} />}
        {/* сломанный механизм (общий маркер, если у предмета нет своего) */}
        {ctx.broken && def?.mech && <g transform={`translate(${def.mech[0]} ${def.mech[1]})`} className="defect-g">
          <circle r="13" fill="#1d140c" opacity=".8" />
          <g stroke="#8d887c" strokeWidth="2.6" fill="none"><circle r="8" /><path d="M0 -11 v3 M0 11 v-3 M-11 0 h3 M11 0 h-3" /></g>
          <path d="M-8 -8 L8 8 M8 -8 L-8 8" stroke="#b5533c" strokeWidth="3" strokeLinecap="round" />
        </g>}
      </svg>
    </div>
  );
}

function SurfaceInline({ defects, seed }: { defects: DefectInst[]; seed: number }) {
  const rnd = mulberry32(seed || 7);
  const R = (a: number, b: number) => a + rnd() * (b - a);
  return <>{defects.map((d, i) => {
    switch (d.id) {
      case 'dirt': return <g key={i} className={`defect-g${d.resolved ? ' off' : ''}`} opacity=".8">
        {[0, 1, 2, 3, 4].map(k => <ellipse key={k} cx={R(58, 142)} cy={R(66, 152)} rx={R(16, 34)} ry={R(12, 24)} fill={k % 2 ? '#4a3620' : '#5c452c'} opacity={R(.45, .75)} transform={`rotate(${R(-30, 30)} 100 110)`} />)}
      </g>;
      case 'dust': return <g key={i} className={`defect-g${d.resolved ? ' off' : ''}`} opacity=".6">
        <ellipse cx="100" cy="108" rx="62" ry="56" fill="#9a937f" opacity=".3" />
        {Array.from({ length: 22 }).map((_, k) => <circle key={k} cx={R(46, 154)} cy={R(52, 160)} r={R(1, 2.4)} fill="#cfc7ae" opacity={R(.3, .7)} />)}
      </g>;
      case 'rust': return <g key={i} className={`defect-g${d.resolved ? ' off' : ''}`} opacity=".8">
        {[0, 1, 2].map(k => <g key={k}><circle cx={R(60, 140)} cy={R(72, 148)} r={R(9, 16)} fill="#8a4a24" opacity=".7" /><circle cx={R(62, 138)} cy={R(74, 146)} r={R(4, 8)} fill="#a85c2c" opacity=".85" /></g>)}
      </g>;
      case 'scratches': return <g key={i} className={`defect-g${d.resolved ? ' off' : ''}`} stroke="#efe8d6" strokeWidth="1.5" opacity=".7" fill="none" strokeLinecap="round">
        {Array.from({ length: 6 }).map((_, k) => { const x = R(54, 136), y = R(60, 150), l = R(12, 30), a = R(-.9, .9); return <path key={k} d={`M${x} ${y} l${Math.cos(a) * l} ${Math.sin(a) * l}`} />; })}
      </g>;
      case 'worn': return <g key={i} className={`defect-g${d.resolved ? ' off' : ''}`} opacity=".5">
        <ellipse cx={R(70, 96)} cy={R(66, 96)} rx={R(18, 30)} ry={R(10, 18)} fill="#d8cdb2" opacity=".55" />
        <ellipse cx={R(104, 134)} cy={R(112, 146)} rx={R(16, 26)} ry={R(9, 16)} fill="#cfc2a4" opacity=".5" />
      </g>;
      case 'crack': return <g key={i} className={`defect-g${d.resolved ? ' off' : ''}`} stroke="#241a12" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".9">
        {(() => { const x0 = R(60, 92), y0 = R(52, 74); let ds = `M${x0} ${y0}`; let x = x0, y = y0; for (let s2 = 0; s2 < 5; s2++) { x += R(8, 18); y += R(8, 18); ds += ` L${x.toFixed(0)} ${y.toFixed(0)}`; } return <path d={ds} />; })()}
      </g>;
      default: return null;
    }
  })}</>;
}

/* гнездо отсутствующей детали — физически: пустая шейка + контур-призрак */
function MissingMark({ id }: { id: string }) {
  const A: Record<string, [number, number]> = {
    phone: [122, 116], camera: [100, 120], reel: [128, 96], radiola: [64, 142], player: [142, 96],
    typewriter: [46, 93], cplayer: [74, 109], console: [58, 122], watch: [100, 38], cuckoo: [84, 186],
    alarm: [94, 50], scales: [50, 108], compass: [100, 60], sewing: [140, 118], binoculars: [122, 140],
    samovar: [100, 146], kerosene: [116, 98], iron: [100, 88], spindle: [76, 112], sugar: [100, 86],
    photoalbum: [146, 98], books: [120, 98], podstakannik: [122, 112], jug: [116, 90], mirror: [100, 164],
    pins: [143, 76], thermo: [100, 56], fishing: [70, 142], guitar: [100, 126], chess: [104, 112], pet: [100, 126],
    horseshoe: [100, 60], valenok: [96, 100], buttons: [100, 92], vhs: [76, 105],
  };
  const [x, y] = A[id] || [128, 108];
  return <g className="defect-g missing-mark" transform={`translate(${x} ${y})`}>
    <circle r="15" fill="rgba(20,12,6,.28)" />
    <circle r="15" fill="none" stroke="#efe3cc" strokeWidth="2.2" strokeDasharray="5 5" opacity=".85" />
    <path d="M-5 -5 l10 10 M5 -5 l-10 10" stroke="#efe3cc" strokeWidth="2.2" opacity=".55" />
  </g>;
}

export const ITEM_ART_IDS = Object.keys(REG);
export const hasItemArt = (id: string) => !!REG[id];
