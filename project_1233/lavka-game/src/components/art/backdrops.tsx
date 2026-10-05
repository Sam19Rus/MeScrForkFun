/* backdrops.tsx — фоновые SVG-декорации сцен: карта города, интерьер лавки,
   аукционный зал, магазин запчастей. Один фон = один <svg> (дёшево для DOM),
   интерактив — поверх (HTML), «жизнь» — CSS-анимации отдельных групп. */
import React from 'react';
import { CITY_BUILDINGS } from '../../game/data/parts';
import type { BuildingDef } from '../../game/types';

/* ================= КАРТА ГОРОДА ================= */

function BuildingArt({ b, locked }: { b: BuildingDef; locked: boolean }) {
  const W = (b.w / 100) * 1000;      // ширина в единицах viewBox
  const X = (b.x / 100) * 1000;
  const Y = (b.y / 100) * 620;
  const cx = X + W / 2;
  const h = W * 0.82;
  const bodyY = Y - h;
  const common = { transform: `translate(${X} ${bodyY})` };
  void common;

  const facade = (() => {
    switch (b.art) {
      case 'shop': return <g>
        <rect x="0" y={h * 0.28} width={W} height={h * 0.72} rx="4" fill="#a67c52" stroke="#5a4632" strokeWidth="3" />
        <path d={`M-10 ${h * 0.3} L${W / 2} -6 L${W + 10} ${h * 0.3} Z`} fill="#7c5a3a" stroke="#4a3620" strokeWidth="3" />
        <rect x={W * 0.14} y={h * 0.44} width={W * 0.3} height={h * 0.28} rx="3" fill="#ffe9a3" stroke="#5a4632" strokeWidth="3" />
        <path d={`M${W * 0.14} ${h * 0.58} h${W * 0.3} M${W * 0.29} ${h * 0.44} v${h * 0.28}`} stroke="#c8a05a" strokeWidth="2" />
        <rect x={W * 0.56} y={h * 0.5} width={W * 0.28} height={h * 0.5} rx="3" fill="#6e4f33" stroke="#4a3620" strokeWidth="3" />
        <circle cx={W * 0.79} cy={h * 0.76} r="3.4" fill="#d9b23f" />
        <path d={`M${W * 0.1} ${h * 0.4} h${W * 0.38}`} stroke="#b5533c" strokeWidth="6" strokeLinecap="round" />
        <rect x={W * 0.72} y={-h * 0.14} width={W * 0.12} height={h * 0.2} fill="#5a4632" />
        <g className="smoke-puff"><circle cx={W * 0.78} cy={-h * 0.16} r="6" fill="#d8d0c0" /></g>
        <g className="smoke-puff" style={{ animationDelay: '1.1s' }}><circle cx={W * 0.8} cy={-h * 0.2} r="5" fill="#d8d0c0" /></g>
        <g className="smoke-puff" style={{ animationDelay: '2.2s' }}><circle cx={W * 0.76} cy={-h * 0.18} r="4" fill="#d8d0c0" /></g>
      </g>;
      case 'warehouse': return <g>
        <path d={`M0 ${h} L0 ${h * 0.3} Q${W / 2} ${-h * 0.12} ${W} ${h * 0.3} L${W} ${h} Z`} fill="#7a7568" stroke="#4a463c" strokeWidth="3" />
        <rect x={W * 0.3} y={h * 0.42} width={W * 0.4} height={h * 0.58} rx="3" fill="#4a463c" stroke="#33302a" strokeWidth="3" />
        <path d={`M${W * 0.3} ${h * 0.52} h${W * 0.4} M${W * 0.3} ${h * 0.62} h${W * 0.4} M${W * 0.3} ${h * 0.72} h${W * 0.4}`} stroke="#5d584c" strokeWidth="3" />
        <rect x={W * 0.08} y={h * 0.34} width={W * 0.14} height={h * 0.14} fill="#33302a" rx="2" />
        <rect x={W * 0.78} y={h * 0.34} width={W * 0.14} height={h * 0.14} fill="#33302a" rx="2" />
        <rect x={-W * 0.12} y={h * 0.72} width={W * 0.18} height={W * 0.16} rx="2" fill="#a67c52" stroke="#5a4632" strokeWidth="2.5" />
        <rect x={-W * 0.06} y={h * 0.58} width={W * 0.13} height={W * 0.13} rx="2" fill="#c8a97e" stroke="#5a4632" strokeWidth="2.5" />
      </g>;
      case 'estate': return <g>
        <rect x="0" y={h * 0.3} width={W} height={h * 0.7} fill="#e3d3b3" stroke="#8a7a5a" strokeWidth="3" />
        <path d={`M-8 ${h * 0.3} L${W / 2} ${-h * 0.04} L${W + 8} ${h * 0.3} Z`} fill="#8a5a44" stroke="#5a3a2a" strokeWidth="3" />
        <path d={`M${W * 0.18} ${h * 0.24} h${W * 0.64}`} stroke="#cfc0a0" strokeWidth="4" />
        {[0.16, 0.38, 0.6, 0.8].map((px, i) => (
          <rect key={i} x={W * px - 4} y={h * 0.32} width="9" height={h * 0.66} fill="#f2e8d0" stroke="#b0a080" strokeWidth="2" />
        ))}
        <rect x={W * 0.42} y={h * 0.6} width={W * 0.16} height={h * 0.4} rx="2" fill="#6e4f33" stroke="#4a3620" strokeWidth="2.5" />
        <path d={`M${-W * 0.06} ${h} h${W * 1.12}`} stroke="#b0a080" strokeWidth="6" />
      </g>;
      case 'garage': return <g>
        <rect x="0" y={h * 0.18} width={W} height={h * 0.82} rx="3" fill="#8a5a44" stroke="#5a3a2a" strokeWidth="3" />
        <path d={`M0 ${h * 0.18} Q${W / 2} ${h * 0.02} ${W} ${h * 0.18}`} fill="#6e4234" stroke="#5a3a2a" strokeWidth="3" />
        <rect x={W * 0.14} y={h * 0.42} width={W * 0.56} height={h * 0.58} rx="3" fill="#5d584c" stroke="#33302a" strokeWidth="3" />
        {[0.5, 0.58, 0.66, 0.74, 0.82, 0.9].map((py, i) => (
          <path key={i} d={`M${W * 0.14} ${h * py} h${W * 0.56}`} stroke="#4a463c" strokeWidth="2.5" />
        ))}
        <rect x={W * 0.76} y={h * 0.44} width={W * 0.16} height={h * 0.2} rx="2" fill="#33302a" />
        <ellipse cx={W * 0.1} cy={h * 1.0} rx={W * 0.14} ry="6" fill="#2a2620" opacity=".65" />
        <circle cx={W * 0.86} cy={h * 0.92} r={W * 0.07} fill="none" stroke="#2a2620" strokeWidth="6" />
      </g>;
      case 'parts': return <g>
        <rect x="0" y={h * 0.3} width={W} height={h * 0.7} rx="4" fill="#4f6a6a" stroke="#33484a" strokeWidth="3" />
        <path d={`M-6 ${h * 0.32} L${W / 2} ${h * 0.02} L${W + 6} ${h * 0.32} Z`} fill="#3f5656" stroke="#2c3e3e" strokeWidth="3" />
        <rect x={W * 0.12} y={h * 0.46} width={W * 0.44} height={h * 0.26} rx="3" fill="#cfe0e0" stroke="#33484a" strokeWidth="3" />
        <path d={`M${W * 0.2} ${h * 0.64} q${W * 0.07} -${h * 0.08} ${W * 0.14} 0 q${W * 0.07} ${h * 0.06} ${W * 0.14} -${h * 0.02}`} stroke="#8d887c" strokeWidth="2.5" fill="none" />
        <rect x={W * 0.64} y={h * 0.5} width={W * 0.24} height={h * 0.5} rx="3" fill="#33484a" />
        <circle cx={W * 0.83} cy={h * 0.76} r="3" fill="#d9b23f" />
        <g transform={`translate(${W * 0.24} ${h * 0.1})`}>
          <circle r={W * 0.1} fill="none" stroke="#d9b23f" strokeWidth="5" />
          <circle r={W * 0.04} fill="#d9b23f" />
          {[0, 60, 120, 180, 240, 300].map(a => (
            <rect key={a} x="-3" y={-W * 0.13} width="6" height="7" fill="#d9b23f" transform={`rotate(${a})`} />
          ))}
        </g>
      </g>;
    }
  })();

  return (
    <g transform={`translate(${X} ${bodyY})`} className={`building ${locked ? 'locked' : ''}`} data-id={b.id}>
      {facade}
      {/* вывеска */}
      <rect x={W * 0.16} y={h * 0.02} width={W * 0.68} height={h * 0.16} rx="5" fill="#241a12" stroke="#d9b23f" strokeWidth="2" opacity=".94" />
      <text className="b-sign" x={W / 2} y={h * 0.135} textAnchor="middle">{b.sign}</text>
      {/* табличка названия */}
      <rect x={W * 0.06} y={h + 6} width={W * 0.88} height="22" rx="8" fill="#241a12dd" />
      <text className="b-label" x={W / 2} y={h + 21.5} textAnchor="middle" fill="#efe3cc">{b.name}</text>
      {locked && <g transform={`translate(${W / 2} ${h * 0.5})`}>
        <rect x="-13" y="-6" width="26" height="20" rx="4" fill="#d9b23f" stroke="#8a6c1e" strokeWidth="2" />
        <path d="M-7 -6 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="#8a6c1e" strokeWidth="3.4" />
        <circle cx="0" cy="4" r="3" fill="#5a4632" />
      </g>}
    </g>
  );
}

export function CityMapArt({ lockedIds, onSelect }: {
  lockedIds: Set<string>;
  onSelect: (id: string, el: SVGGElement | null) => void;
}) {
  return (
    <svg className="city-svg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice"
      onClick={e => {
        const g = (e.target as Element).closest('.building');
        if (g) onSelect(g.getAttribute('data-id')!, g as unknown as SVGGElement);
      }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9ab8c8" /><stop offset="1" stopColor="#e8d8b8" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a9a6a" /><stop offset="1" stopColor="#6e7f56" />
        </linearGradient>
      </defs>
      <rect width="1000" height="230" fill="url(#sky)" />
      <circle cx="840" cy="70" r="34" fill="#ffe9a3" opacity=".9" />
      <rect y="210" width="1000" height="410" fill="url(#ground)" />
      {/* дорога */}
      <path d="M-20 470 Q240 440 500 470 T1020 460 L1020 560 Q700 540 500 560 T-20 550 Z" fill="#c9b48a" />
      <path d="M-20 508 Q240 482 500 512 T1020 505" stroke="#e8dcc0" strokeWidth="5" strokeDasharray="26 22" fill="none" opacity=".75" />
      {/* тропинки к зданиям */}
      <path d="M180 560 Q185 500 190 470" stroke="#b8a47c" strokeWidth="16" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M500 560 Q510 400 515 330" stroke="#b8a47c" strokeWidth="16" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M820 540 Q810 470 800 440" stroke="#b8a47c" strokeWidth="16" fill="none" strokeLinecap="round" opacity=".8" />
      <path d="M160 300 Q170 260 175 250" stroke="#b8a47c" strokeWidth="12" fill="none" strokeLinecap="round" opacity=".7" />
      <path d="M510 560 Q515 520 520 500" stroke="#b8a47c" strokeWidth="12" fill="none" strokeLinecap="round" opacity=".7" />
      {/* облака */}
      <g className="cloud" style={{ animationDuration: '70s' }} opacity=".85">
        <ellipse cx="120" cy="60" rx="52" ry="17" fill="#fff" opacity=".8" />
        <ellipse cx="160" cy="52" rx="34" ry="13" fill="#fff" opacity=".8" />
      </g>
      <g className="cloud" style={{ animationDuration: '110s', animationDelay: '-40s' }} opacity=".7">
        <ellipse cx="420" cy="94" rx="44" ry="14" fill="#fff" opacity=".8" />
      </g>
      {/* деревья */}
      {[[60, 300], [330, 250], [640, 230], [930, 300], [30, 560], [960, 580]].map(([tx, ty], i) => (
        <g key={i} transform={`translate(${tx} ${ty})`}>
          <rect x="-5" y="0" width="10" height="34" rx="3" fill="#6e4f33" />
          <circle cx="0" cy="-14" r="26" fill="#5c7a4a" />
          <circle cx="-14" cy="-2" r="16" fill="#6e8a56" />
          <circle cx="14" cy="-4" r="15" fill="#4f6a3f" />
        </g>
      ))}
      {/* фонарь */}
      <g transform="translate(620 420)">
        <rect x="-3" y="-70" width="6" height="70" fill="#33302a" />
        <circle cx="0" cy="-78" r="9" fill="#ffe9a3" stroke="#33302a" strokeWidth="3" />
      </g>
      {/* прохожие */}
      <g className="passer" style={{ animationDuration: '26s' }}>
        <g transform="translate(0 486)">
          <circle cx="0" cy="-26" r="7" fill="#e8c9a8" />
          <rect x="-7" y="-20" width="14" height="22" rx="5" fill="#6a7f9a" />
          <path d="M-4 2 v8 M4 2 v8" stroke="#33302a" strokeWidth="4" />
        </g>
      </g>
      <g className="passer rev" style={{ animationDuration: '34s', animationDelay: '-12s' }}>
        <g transform="translate(0 530)">
          <circle cx="0" cy="-24" r="6.5" fill="#f0d5b8" />
          <path d="M-8 -18 L8 -18 L11 4 L-11 4 Z" fill="#9a5a4a" />
          <path d="M-3 4 v7 M3 4 v7" stroke="#33302a" strokeWidth="3.6" />
        </g>
      </g>
      {/* голуби */}
      <g transform="translate(300 545)">
        <ellipse rx="7" ry="5" fill="#7a8088" /><circle cx="6" cy="-4" r="3" fill="#8a9098" />
        <path d="M-7 0 q-5 -4 -8 1" stroke="#5d636a" strokeWidth="2" fill="none" />
      </g>
      <g transform="translate(340 552)">
        <ellipse rx="6" ry="4.4" fill="#6e747c" /><circle cx="-5" cy="-3.6" r="2.6" fill="#7a8088" />
      </g>
      {/* здания (сортировка по y для глубины) */}
      {[...CITY_BUILDINGS].sort((a, b) => a.y - b.y).map(b => (
        <BuildingArt key={b.id} b={b} locked={lockedIds.has(b.id)} />
      ))}
    </svg>
  );
}

/* ================= ИНТЕРЬЕР ЛАВКИ ================= */

export const SHOP_SLOTS: { x: number; y: number }[] = [
  // полки (стеллаж центр-право): два яруса
  { x: 47.5, y: 33 }, { x: 53.5, y: 33 }, { x: 59.5, y: 33 }, { x: 65.5, y: 33 }, { x: 71.5, y: 33 },
  { x: 47.5, y: 51 }, { x: 53.5, y: 51 }, { x: 59.5, y: 51 }, { x: 65.5, y: 51 }, { x: 71.5, y: 51 },
  // прилавок (мелочь) и стол
  { x: 80, y: 66 }, { x: 22, y: 63 }
];
export const FIXTURE_SPOTS: Record<string, { x: number; y: number; s: number }> = {
  radiola: { x: 74, y: 62, s: 64 },
  cuckoo: { x: 88, y: 14, s: 74 },
  sewing: { x: 64, y: 78, s: 84 },
  watch: { x: 90, y: 58, s: 44 }
};
export const VITRINE_SPOT = { x: 89.5, y: 55, s: 46 };

export function ShopInterior({ level }: { level: number }) {
  return (
    <svg className="shop-bg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="wallp" width="46" height="46" patternUnits="userSpaceOnUse">
          <rect width="46" height="46" fill="#4a3a28" />
          <rect x="0" width="14" height="46" fill="#453527" />
        </pattern>
        <radialGradient id="lampGlow" cx="50%" cy="0%" r="90%">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".34" />
          <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="440" fill="url(#wallp)" />
      <rect y="60" width="1000" height="8" fill="#5a4632" />
      {/* пол */}
      <rect y="430" width="1000" height="190" fill="#6e4f33" />
      {[455, 485, 515, 545, 575, 605].map((fy, i) => (
        <path key={i} d={`M0 ${fy} H1000`} stroke="#5a3f28" strokeWidth="3" />
      ))}
      {[120, 340, 560, 780].map((fx, i) => (
        <path key={i} d={`M${fx + i * 40} 430 V620`} stroke="#5a3f28" strokeWidth="2" opacity=".5" />
      ))}
      {/* ковёр */}
      <ellipse cx="500" cy="540" rx="220" ry="52" fill="#8a3c2c" opacity=".9" />
      <ellipse cx="500" cy="540" rx="180" ry="40" fill="none" stroke="#c98a5a" strokeWidth="4" opacity=".7" />
      <ellipse cx="500" cy="540" rx="120" ry="26" fill="none" stroke="#c98a5a" strokeWidth="3" opacity=".5" />
      {/* дверь (в город) */}
      <g>
        <rect x="292" y="180" width="130" height="255" rx="6" fill="#5a4632" />
        <rect x="302" y="192" width="110" height="243" rx="4" fill="#7c5a3a" />
        <rect x="316" y="206" width="82" height="90" rx="3" fill="#cfe0e0" opacity=".9" />
        <path d="M316 250 h82 M357 206 v90" stroke="#8d887c" strokeWidth="3" />
        <circle cx="400" cy="330" r="6" fill="#d9b23f" />
        <path d="M302 192 q55 -14 110 0" fill="#6e4f33" />
      </g>
      {/* верстак слева */}
      <g>
        <rect x="40" y="380" width="240" height="18" rx="4" fill="#a67c52" stroke="#5a4632" strokeWidth="3" />
        <rect x="56" y="398" width="16" height="120" fill="#6e4f33" />
        <rect x="248" y="398" width="16" height="120" fill="#6e4f33" />
        <rect x="56" y="470" width="208" height="10" fill="#5a4632" />
        {/* тиски */}
        <rect x="70" y="356" width="44" height="24" rx="3" fill="#5d584c" stroke="#33302a" strokeWidth="2.5" />
        <rect x="118" y="362" width="14" height="12" fill="#8d887c" />
        {/* лампа */}
        <path d="M232 380 V300" stroke="#33302a" strokeWidth="5" />
        <path d="M204 300 q28 -30 56 0 z" fill="#b5533c" stroke="#7c3a2a" strokeWidth="3" />
        <circle cx="232" cy="304" r="7" fill="#ffe9a3" />
        <ellipse cx="200" cy="390" rx="180" ry="150" fill="url(#lampGlow)" pointerEvents="none" />
        {/* инструменты на стеной */}
        <g stroke="#8d887c" strokeWidth="4" strokeLinecap="round" opacity=".9">
          <path d="M80 300 l0 44 M74 300 h12" />
          <path d="M120 296 q10 22 0 46" fill="none" />
          <circle cx="160" cy="318" r="12" fill="none" />
          <path d="M200 300 l-8 42 M200 300 l8 42" />
        </g>
      </g>
      {/* стеллаж (центр-право) */}
      <g>
        <rect x="440" y="120" width="320" height="14" rx="3" fill="#a67c52" stroke="#5a4632" strokeWidth="2.5" />
        <rect x="440" y="290" width="320" height="14" rx="3" fill="#a67c52" stroke="#5a4632" strokeWidth="2.5" />
        <rect x="446" y="134" width="10" height="156" fill="#6e4f33" />
        <rect x="744" y="134" width="10" height="156" fill="#6e4f33" />
      </g>
      {/* доска заказов (пробковая) */}
      <g>
        <rect x="96" y="118" width="230" height="160" rx="8" fill="#a08054" stroke="#6e4f33" strokeWidth="6" />
        <rect x="108" y="130" width="206" height="136" rx="4" fill="#b89468" />
        <circle cx="211" cy="112" r="4" fill="#8d887c" />
      </g>
      {/* прилавок справа */}
      <g>
        <rect x="660" y="400" width="330" height="26" rx="5" fill="#c8a97e" stroke="#5a4632" strokeWidth="3" />
        <rect x="672" y="426" width="306" height="150" fill="#8a6a48" />
        <path d="M672 456 h306 M672 496 h306 M672 536 h306" stroke="#6e4f33" strokeWidth="4" />
        {/* касса */}
        <rect x="700" y="356" width="64" height="44" rx="6" fill="#5d584c" stroke="#33302a" strokeWidth="3" />
        <rect x="708" y="342" width="48" height="16" rx="3" fill="#d9b23f" stroke="#8a6c1e" strokeWidth="2" />
        <circle cx="716" cy="374" r="4" fill="#cfc7ae" /><circle cx="732" cy="374" r="4" fill="#cfc7ae" /><circle cx="748" cy="374" r="4" fill="#cfc7ae" />
      </g>
      {/* витрина (стеклянная, ур.2+) */}
      {level >= 2 && <g>
        <rect x="836" y="300" width="140" height="106" rx="6" fill="#cfe0e0" opacity=".22" />
        <rect x="836" y="300" width="140" height="106" rx="6" fill="none" stroke="#d9b23f" strokeWidth="3" opacity=".8" />
        <path d="M906 300 v106" stroke="#d9b23f" strokeWidth="2" opacity=".5" />
      </g>}
      {/* картины на стене */}
      <g>
        <rect x="800" y="120" width="72" height="54" rx="4" fill="#3a2c1d" stroke="#d9b23f" strokeWidth="4" />
        <path d="M808 158 l18 -20 l14 14 l10 -8 l14 14 v10 h-56 z" fill="#6e7f6a" />
        <circle cx="856" cy="136" r="6" fill="#ffe9a3" />
      </g>
      {/* бра */}
      {[[440, 90], [620, 90]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${bx} ${by})`}>
          <path d="M0 0 v22" stroke="#33302a" strokeWidth="4" />
          <path d="M-14 34 q14 -18 28 0 z" fill="#d9b23f" />
          <circle cx="0" cy="30" r="6" fill="#ffe9a3" />
          <circle cx="0" cy="34" r="30" fill="#ffe9a3" opacity=".1" />
        </g>
      ))}
    </svg>
  );
}

/* ================= АУКЦИОННЫЙ ЗАЛ ================= */

export function AuctionHall({ close }: { close?: boolean }) {
  return (
    <svg className="hall-bg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="hglow" cx="50%" cy="30%" r="75%">
          <stop offset="0" stopColor="#6a4a2a" stopOpacity=".55" />
          <stop offset="1" stopColor="#1c1410" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="curtain" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6e2418" /><stop offset=".5" stopColor="#8a3c2c" /><stop offset="1" stopColor="#5a1c12" />
        </linearGradient>
      </defs>
      <rect width="1000" height="620" fill="#241a12" />
      <rect width="1000" height="620" fill="url(#hglow)" />
      {/* панели стен */}
      <rect y="0" width="1000" height="70" fill="#1d140c" />
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <rect key={i} x={i * 150 + 30} y="90" width="90" height="180" rx="6" fill="none" stroke="#3a2c1d" strokeWidth="4" />
      ))}
      {/* шторы */}
      <path d="M0 0 q60 40 40 300 q-8 90 -40 140 Z" fill="url(#curtain)" />
      <path d="M1000 0 q-60 40 -40 300 q8 90 40 140 Z" fill="url(#curtain)" />
      <path d="M40 60 q-24 20 -30 40 M960 60 q24 20 30 40" stroke="#d9b23f" strokeWidth="5" fill="none" />
      {/* люстры */}
      {[[260, 40], [500, 30], [740, 40]].map(([lx, ly], i) => (
        <g key={i} transform={`translate(${lx} ${ly})`}>
          <path d="M0 0 v26" stroke="#8a6c1e" strokeWidth="3" />
          <path d="M-26 40 q26 -20 52 0 l-8 12 h-36 z" fill="#d9b23f" />
          <circle cx="-14" cy="34" r="4" fill="#ffe9a3" /><circle cx="0" cy="30" r="4.6" fill="#ffe9a3" /><circle cx="14" cy="34" r="4" fill="#ffe9a3" />
          <circle cx="0" cy="40" r="46" fill="#ffe9a3" opacity=".07" />
        </g>
      ))}
      {/* баннер */}
      <g transform="translate(500 108)">
        <rect x="-150" y="-26" width="300" height="52" rx="8" fill="#5a1c12" stroke="#d9b23f" strokeWidth="3" />
        <text textAnchor="middle" dy="9" fontSize="30" fontFamily="Georgia" fill="#ffe9a3" letterSpacing="6">АУКЦИОН</text>
      </g>
      {/* сцена/подиум */}
      <g>
        <rect x="250" y={close ? 330 : 360} width="500" height={close ? 110 : 90} rx="8" fill="#4a3620" stroke="#33261a" strokeWidth="4" />
        <rect x="250" y={close ? 330 : 360} width="500" height="16" rx="6" fill="#6e4f33" />
        {/* стол лота */}
        <rect x="410" y={close ? 250 : 290} width="180" height={close ? 86 : 76} rx="6" fill="#7c5a3a" stroke="#4a3620" strokeWidth="4" />
        <rect x="400" y={close ? 242 : 282} width="200" height="16" rx="6" fill="#a67c52" stroke="#5a4632" strokeWidth="3" />
        <path d={`M420 ${close ? 290 : 330} h160`} stroke="#5a4632" strokeWidth="3" />
      </g>
      {/* места публики (силуэты) */}
      <g opacity=".9">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <g key={i} transform={`translate(${90 + i * 165} 560)`}>
            <rect x="-46" y="-14" width="92" height="70" rx="10" fill="#2c2117" />
            <rect x="-40" y="-20" width="80" height="14" rx="6" fill="#3a2c1d" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ================= ВЕРСТАК (фон сцены реставрации) ================= */

export function WorkbenchInterior() {
  return (
    <svg className="shop-bg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="wbLamp" cx="28%" cy="32%" r="70%">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".3" />
          <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="620" fill="#241a12" />
      <rect width="1000" height="430" fill="#3a2c1d" />
      {/* кирпичная стена */}
      {Array.from({ length: 7 }).map((_, r) => (
        <g key={r} opacity=".5">
          <path d={`M0 ${40 + r * 56} H1000`} stroke="#2c2115" strokeWidth="3" />
          {Array.from({ length: 10 }).map((_, c) => (
            <path key={c} d={`M${c * 100 + (r % 2 ? 50 : 0)} ${40 + r * 56} v56`} stroke="#2c2115" strokeWidth="3" />
          ))}
        </g>
      ))}
      {/* перфопанель с инструментом */}
      <g transform="translate(90 90)">
        <rect width="230" height="170" rx="8" fill="#4a3a28" stroke="#2c2115" strokeWidth="5" />
        <g stroke="#8d887c" strokeWidth="5" strokeLinecap="round">
          <path d="M40 40 v60 M32 40 h16" />
          <path d="M90 36 q16 34 0 66" fill="none" />
          <path d="M140 40 l-10 62 M140 40 l10 62" />
          <path d="M190 44 v52 M182 96 h16" />
        </g>
        <circle cx="70" cy="130" r="16" fill="none" stroke="#b9b2a4" strokeWidth="5" />
        <circle cx="150" cy="132" r="11" fill="none" stroke="#b9b2a4" strokeWidth="4" />
        <rect x="176" y="118" width="34" height="24" rx="4" fill="#8a5a44" stroke="#5a3a2a" strokeWidth="3" />
      </g>
      {/* полка с банками */}
      <g transform="translate(620 110)">
        <rect width="300" height="12" rx="3" fill="#a67c52" stroke="#5a4632" strokeWidth="2.5" />
        {[0, 1, 2, 3].map(i => (
          <g key={i} transform={`translate(${24 + i * 72} -34)`}>
            <rect width="34" height="34" rx="5" fill={['#cfe0e0', '#d9b23f', '#b5533c', '#9fdc9f'][i]} opacity=".85" stroke="#5a4632" strokeWidth="2.5" />
            <rect x="4" y="-6" width="26" height="8" rx="2" fill="#8d887c" />
          </g>
        ))}
      </g>
      {/* стол верстака */}
      <rect x="120" y="430" width="760" height="26" rx="6" fill="#a67c52" stroke="#5a4632" strokeWidth="3" />
      <rect x="150" y="456" width="26" height="150" fill="#6e4f33" />
      <rect x="820" y="456" width="26" height="150" fill="#6e4f33" />
      <rect x="150" y="540" width="696" height="12" fill="#5a4632" />
      {/* тиски слева */}
      <g transform="translate(180 396)">
        <rect width="64" height="34" rx="4" fill="#5d584c" stroke="#33302a" strokeWidth="3" />
        <rect x="68" y="8" width="18" height="16" fill="#8d887c" />
        <circle cx="86" cy="16" r="6" fill="#b9b2a4" />
      </g>
      {/* лампа над предметом */}
      <g transform="translate(272 118)">
        <path d="M0 -118 v164" stroke="#241a12" strokeWidth="6" />
        <path d="M-40 46 q40 -34 80 0 z" fill="#b5533c" stroke="#7c3a2a" strokeWidth="4" />
        <circle cx="0" cy="52" r="9" fill="#ffe9a3" />
      </g>
      <rect width="1000" height="620" fill="url(#wbLamp)" pointerEvents="none" />
      {/* тряпка и кисть на столе */}
      <g transform="translate(690 404)">
        <path d="M0 26 q22 -14 46 0 q-10 10 -24 10 q-14 0 -22 -10" fill="#cfc7ae" opacity=".9" />
        <rect x="60" y="4" width="10" height="26" rx="3" fill="#8a6a48" transform="rotate(18 65 17)" />
        <rect x="64" y="-8" width="12" height="14" rx="3" fill="#5d584c" transform="rotate(18 70 -1)" />
      </g>
    </svg>
  );
}

/* ================= МАГАЗИН ЗАПЧАСТЕЙ ================= */

export function PartsInterior() {
  return (
    <svg className="shop-bg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="bulbGlow" cx="50%" cy="20%" r="70%">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".28" />
          <stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="440" fill="#3f4a4a" />
      <rect y="440" width="1000" height="180" fill="#4a4238" />
      <path d="M0 470 H1000 M0 520 H1000 M0 570 H1000" stroke="#3a342c" strokeWidth="3" />
      <rect width="1000" height="620" fill="url(#bulbGlow)" pointerEvents="none" />
      {/* лампочка */}
      <g transform="translate(500 0)">
        <path d="M0 0 v56" stroke="#241a12" strokeWidth="4" />
        <circle cy="70" r="14" fill="#ffe9a3" stroke="#d9b23f" strokeWidth="3" />
      </g>
      {/* перфопанель с инструментом слева */}
      <g>
        <rect x="40" y="90" width="260" height="220" rx="8" fill="#5d584c" stroke="#33302a" strokeWidth="4" />
        {Array.from({ length: 24 }).map((_, i) => (
          <circle key={i} cx={62 + (i % 6) * 44} cy={112 + Math.floor(i / 6) * 52} r="4" fill="#33302a" />
        ))}
        <g stroke="#b9b2a4" strokeWidth="6" strokeLinecap="round">
          <path d="M80 140 v56 M72 140 h16" />
          <path d="M140 140 q14 30 0 60" fill="none" />
          <path d="M200 140 l-10 60 M200 140 l10 60" />
        </g>
        <circle cx="260" cy="170" r="18" fill="none" stroke="#b9b2a4" strokeWidth="6" />
        <path d="M100 240 l40 0 M100 256 l40 0" stroke="#8d887c" strokeWidth="5" />
        <rect x="180" y="230" width="70" height="36" rx="5" fill="#8a5a44" stroke="#5a3a2a" strokeWidth="3" />
      </g>
      {/* полки с банками справа */}
      <g>
        {[120, 220, 320].map((sy, r) => (
          <g key={r}>
            <rect x="620" y={sy} width="340" height="12" rx="3" fill="#8a6a48" stroke="#5a4632" strokeWidth="2.5" />
            {[0, 1, 2, 3, 4].map(i => (
              <g key={i} transform={`translate(${648 + i * 66} ${sy - 34})`}>
                <rect x="0" y="0" width="34" height="34" rx="5" fill={['#cfe0e0', '#d9b23f', '#b5533c', '#9fdc9f', '#cfc7ae'][i]} opacity=".85" stroke="#5a4632" strokeWidth="2.5" />
                <rect x="4" y="-6" width="26" height="8" rx="2" fill="#8d887c" />
              </g>
            ))}
          </g>
        ))}
      </g>
      {/* прилавок */}
      <g>
        <rect x="180" y="420" width="640" height="26" rx="6" fill="#c8a97e" stroke="#5a4632" strokeWidth="3" />
        <rect x="196" y="446" width="608" height="130" fill="#8a6a48" />
        <path d="M196 486 h608 M196 526 h608" stroke="#6e4f33" strokeWidth="4" />
        {/* спящий кот */}
        <g transform="translate(700 400)">
          <ellipse rx="46" ry="18" fill="#5d584c" />
          <circle cx="-34" cy="-8" r="15" fill="#5d584c" />
          <path d="M-44 -18 l-4 -12 l12 6 M-26 -20 l6 -12 l6 10" fill="#5d584c" />
          <path d="M44 -6 q22 -4 18 12" stroke="#5d584c" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M-40 -6 q4 3 8 0" stroke="#241a12" strokeWidth="2" fill="none" />
          <text x="-16" y="-26" fontSize="14" fill="#cfc7ae" opacity=".7">z z</text>
        </g>
        {/* вывеска */}
        <rect x="330" y="30" width="340" height="58" rx="10" fill="#241a12" stroke="#d9b23f" strokeWidth="3" />
        <text x="500" y="68" textAnchor="middle" fontSize="26" fontFamily="Georgia" fill="#ffe9a3">ЗАПЧАСТИ «У ШПУЛЯ»</text>
      </g>
    </svg>
  );
}
