/* AuctionHallArt.tsx — ЭТАЛОННАЯ СЦЕНА: аукционный зал (visual quality pass).
   Композиция из трёх слоёв, которые сцена собирает в одном svg-пространстве 1600×900:
     AuctionHallBack  — фон и средний план до участников (архитектура, окна, люстры,
                        подиум ведущего, пьедестал лота под софитом, ковёр);
     HallSeatTables   — столы участников (рисуются ПОВЕРХ фигур, чтобы фигуры стояли за ними);
     AuctionHallFront — передний план (кулисы-шторы, силиэты голов, стол игрока), свет.
   Свет: тёплый от люстр + холодные сумерки из окон + направленный софит на лот.
   Portrait: компоновка сужается до среза 330..1270 (viewBox ставит сцена). */
import React from 'react';

/* якоря композиции */
export function hallSeats(portrait: boolean) {
  return portrait
    ? [{ x: 640, y: 762, s: 1.05 }, { x: 962, y: 762, s: 1.05 }, { x: 618, y: 642, s: .78 }, { x: 984, y: 642, s: .78 }]
    : [{ x: 252, y: 662, s: 1.28 }, { x: 1348, y: 662, s: 1.28 }, { x: 575, y: 545, s: .85 }, { x: 1065, y: 545, s: .85 }];
}
export const lotPos = (portrait: boolean) => portrait ? { x: 800, y: 612, s: .9 } : { x: 430, y: 540, s: 1.05 };
export const aucPos = (portrait: boolean) => portrait ? { x: 800, y: 400 } : { x: 800, y: 470 };

const DEFS = (
  <defs>
    <linearGradient id="ah-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#4a3626" /><stop offset=".55" stopColor="#5c4530" /><stop offset="1" stopColor="#3a2b1c" />
    </linearGradient>
    <linearGradient id="ah-wains" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6e5138" /><stop offset="1" stopColor="#4a3624" />
    </linearGradient>
    <linearGradient id="ah-win" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2e3e52" /><stop offset=".5" stopColor="#5a6a7a" /><stop offset=".82" stopColor="#c8a878" /><stop offset="1" stopColor="#e8c898" />
    </linearGradient>
    <linearGradient id="ah-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6e5138" /><stop offset="1" stopColor="#40301f" />
    </linearGradient>
    <linearGradient id="ah-carpet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#7c2a1c" /><stop offset="1" stopColor="#5a1c12" />
    </linearGradient>
    <radialGradient id="ah-spot" cx=".5" cy=".08" r=".95">
      <stop offset="0" stopColor="#ffe9a3" stopOpacity=".55" /><stop offset=".45" stopColor="#ffd97a" stopOpacity=".17" /><stop offset="1" stopColor="#ffd97a" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="ah-chand" cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="#ffe9a3" stopOpacity=".5" /><stop offset=".6" stopColor="#ffd97a" stopOpacity=".13" /><stop offset="1" stopColor="#ffd97a" stopOpacity="0" />
    </radialGradient>
    <linearGradient id="ah-curtain" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#4a1610" /><stop offset=".5" stopColor="#7c2a1c" /><stop offset="1" stopColor="#5a1c12" />
    </linearGradient>
  </defs>
);

export function AuctionHallBack({ mode, portrait = false }: { mode: 'bid' | 'inspect'; portrait?: boolean }) {
  const bid = mode === 'bid';
  const lp = lotPos(portrait);
  const ap = aucPos(portrait);
  return (
    <g>
      {DEFS}
      {/* ================= ФОН: архитектура ================= */}
      <rect x="0" y="0" width="1600" height="900" fill="url(#ah-wall)" />
      <rect x="0" y="0" width="1600" height="86" fill="#2c2013" />
      <rect x="0" y="86" width="1600" height="16" fill="#8a6a48" opacity=".55" />
      <rect x="0" y="102" width="1600" height="6" fill="#241a10" opacity=".7" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <rect key={i} x={i * 210 + 60} y="0" width="26" height="86" fill="#241a10" opacity=".55" />)}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <g key={i} opacity=".5">
          <rect x={i * 178 + 24} y="150" width="130" height="250" rx="6" fill="none" stroke="#2c2013" strokeWidth="5" />
          <rect x={i * 178 + 40} y="166" width="98" height="218" rx="4" fill="none" stroke="#8a6a48" strokeWidth="2" opacity=".5" />
        </g>
      ))}
      <rect x="0" y="430" width="1600" height="150" fill="url(#ah-wains)" />
      <rect x="0" y="424" width="1600" height="10" fill="#8a6a48" opacity=".6" />
      {Array.from({ length: 20 }).map((_, i) => <rect key={i} x={i * 82 + 16} y="452" width="52" height="104" rx="4" fill="none" stroke="#3a2b1c" strokeWidth="4" opacity=".7" />)}

      {/* арочные окна с сумерками и силуэтом города */}
      {(portrait ? [560, 940] : [250, 740, 1230]).map((x, wi) => (
        <g key={wi}>
          <path d={`M${x} 400 v-190 q0 -70 70 -70 q70 0 70 70 v190z`} fill="url(#ah-win)" />
          <path d={`M${x} 400 v-26 l16 -10 12 8 14 -14 16 14 12 -8 18 12 22 -8 v32z`} fill="#232c38" opacity=".85" />
          <path d={`M${x + 34} 366 v-16 l5 -8 5 8 v16z M${x + 98} 362 v-20 h6 v20z`} fill="#232c38" opacity=".9" />
          <circle cx={x + 108} cy={196} r="10" fill="#f2e8c8" opacity=".8" />
          <path d={`M${x} 400 v-190 q0 -70 70 -70 q70 0 70 70 v190z`} fill="none" stroke="#2c2013" strokeWidth="9" />
          <path d={`M${x + 70} 140 v260 M${x} 260 h140 M${x} 330 h140`} stroke="#2c2013" strokeWidth="6" />
          <path d={`M${x + 12} 210 q20 -40 58 -44`} stroke="#c8d8e8" strokeWidth="4" fill="none" opacity=".25" />
          {!bid && <path d={`M${x + 6} 580 l-40 190 h210 l-40 -190z`} fill="#e8c898" opacity=".08" />}
        </g>
      ))}

      {/* баннер */}
      <g transform="translate(800 140)">
        <path d="M-170 -28 h340 v56 h-340z" fill="#5a1c12" />
        <path d="M-170 -28 l-22 28 22 28z M170 -28 l22 28 -22 28z" fill="#4a1610" />
        <path d="M-170 -28 h340 v7 h-340z" fill="#d9b23f" opacity=".8" />
        <path d="M-170 21 h340 v7 h-340z" fill="#d9b23f" opacity=".8" />
        <text textAnchor="middle" dy="12" fontSize="36" fontFamily="Georgia, serif" fill="#f2d788" letterSpacing="12">АУКЦИОН</text>
      </g>
      {/* картины */}
      {(portrait ? [] : [[545, 250], [1055, 250]]).map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x="-52" y="-62" width="104" height="124" rx="4" fill="url(#g-brass)" opacity=".9" />
          <rect x="-44" y="-54" width="88" height="108" fill="#2c3542" />
          <path d="M-44 20 q20 -26 40 -8 q22 -30 48 -4 v46 h-88z" fill="#3f4a5a" />
          <circle cx="18" cy="-26" r="9" fill="#e8d8a8" opacity=".8" />
        </g>
      ))}
      {/* двери */}
      <g transform={`translate(${portrait ? 1230 : 1470} 300)`}>
        <rect x="-86" y="-140" width="172" height="300" rx="6" fill="#3a2b1c" />
        <rect x="-74" y="-128" width="70" height="282" rx="4" fill="#57432c" />
        <rect x="4" y="-128" width="70" height="282" rx="4" fill="#4f3b26" />
        {[-74, 4].map(x => <g key={x}><rect x={x + 10} y={-116} width="50" height="120" rx="4" fill="none" stroke="#2c2013" strokeWidth="4" /><rect x={x + 10} y={16} width="50" height="120" rx="4" fill="none" stroke="#2c2013" strokeWidth="4" /></g>)}
        <circle cx="-12" cy="20" r="6" fill="url(#g-brass)" /><circle cx="12" cy="20" r="6" fill="url(#g-brass)" />
        <path d="M-96 -150 h192 v14 h-192z" fill="#8a6a48" opacity=".6" />
      </g>

      {/* люстры */}
      {(portrait ? [[640, 96], [960, 96]] : [[430, 96], [1130, 96]]).map(([x, y], i) => (
        <g key={i} className="ah-chand" style={{ animationDelay: `${i * 1.7}s`, transformOrigin: `${x}px 0px` }}>
          <path d={`M${x} 0 v${y - 40}`} stroke="#241a10" strokeWidth="5" />
          <circle cx={x} cy={y + 30} r="130" fill="url(#ah-chand)" />
          <g transform={`translate(${x} ${y})`}>
            <path d="M0 -40 v26" stroke="#8a6c1e" strokeWidth="5" />
            <path d="M-56 22 q56 -34 112 0 l-12 16 h-88z" fill="url(#g-brass)" />
            <path d="M-56 22 q56 20 112 0" stroke="#8a6c1e" strokeWidth="3" fill="none" />
            {[-44, -22, 0, 22, 44].map((cx, k) => (
              <g key={k}>
                <rect x={cx - 3} y={-4} width="6" height="18" rx="2" fill="#e8e0cc" />
                <path d={`M${cx} -4 q4 -8 0 -12 q-4 4 0 12z`} fill="#ffd97a" className="ah-flame" style={{ animationDelay: `${k * .37}s` }} />
              </g>
            ))}
            <circle cx="0" cy="46" r="7" fill="url(#g-brass)" />
          </g>
        </g>
      ))}

      {/* ================= ПОЛ ================= */}
      <path d="M0 580 h1600 v320 h-1600z" fill="url(#ah-floor)" />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${800 + (i - 4) * 60} 580 L${800 + (i - 4) * 260} 900`} stroke="#2c2013" strokeWidth="3" opacity=".5" />
      ))}
      {[620, 680, 760, 860].map(y => <path key={y} d={`M0 ${y} h1600`} stroke="#2c2013" strokeWidth="2.4" opacity=".4" />)}
      <path d={`M${ap.x - 160} 900 L${ap.x - 80} 588 h160 l80 312z`} fill="url(#ah-carpet)" />
      <path d={`M${ap.x - 144} 900 L${ap.x - 70} 592 h140 l74 308z`} fill="none" stroke="#d9b23f" strokeWidth="3" opacity=".5" />

      {/* ================= подиум ведущего ================= */}
      <g transform={`translate(${ap.x} ${ap.y}) scale(1.18)`}>
        <ellipse cx="0" cy="118" rx="190" ry="26" fill="#140d07" opacity=".4" filter="url(#f-soft)" />
        <path d="M-150 0 h300 l24 118 h-348z" fill="url(#g-wood-d)" />
        <path d="M-150 0 h300 l4 18 h-308z" fill="url(#g-wood)" />
        <path d="M-120 30 h240 v70 h-240z" fill="none" stroke="#2c2013" strokeWidth="5" opacity=".7" />
        <g transform="translate(0 64)">
          <circle r="26" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="2.4" />
          <circle r="21" fill="none" stroke="#8a6c1e" strokeWidth="1.4" opacity=".7" />
          <g transform="rotate(-24)" fill="#5a4632" opacity=".9">
            <rect x="-13" y="-9" width="26" height="10" rx="4" />
            <rect x="-2.4" y="1" width="4.8" height="16" rx="2" />
          </g>
        </g>
        <path d="M-162 -12 h324 l10 14 h-344z" fill="url(#g-wood)" />
        <g transform="translate(-96 -18) rotate(-5)">
          <rect x="-34" y="-12" width="68" height="16" rx="3" fill="#e8e0cc" />
          <path d="M0 -12 v16" stroke="#b0a488" strokeWidth="2" />
          <path d="M-26 -6 h18 M8 -6 h18" stroke="#9a8a70" strokeWidth="1.6" />
        </g>
        <rect x="72" y="-24" width="46" height="12" rx="5" fill="url(#g-wood)" stroke="#4a3620" strokeWidth="1.6" />
      </g>

      {/* ================= пьедестал лота + софит ================= */}
      <g transform={`translate(${lp.x} ${lp.y}) scale(${lp.s})`}>
        {bid && <path d="M-96 -470 L-150 60 h300 L96 -470z" fill="url(#ah-spot)" className="ah-cone" />}
        <ellipse cx="0" cy="96" rx="120" ry="18" fill="#140d07" opacity=".42" filter="url(#f-soft)" />
        <path d="M-84 0 h168 l14 96 h-196z" fill="#5a1c12" />
        <path d="M-84 0 h168 l3 14 h-174z" fill="#7c2a1c" />
        <path d="M-70 22 q70 18 140 0" stroke="#d9b23f" strokeWidth="2.4" fill="none" opacity=".55" />
        <path d="M-92 -12 h184 l8 14 h-200z" fill="url(#g-wood)" />
        {bid && Array.from({ length: 7 }).map((_, i) => (
          <circle key={i} className="ah-mote" style={{ animationDelay: `${i * .9}s` }} cx={-60 + i * 20} cy={-40 - (i % 3) * 30} r={1.8 + (i % 3)} fill="#ffe9a3" opacity=".5" />
        ))}
      </g>
    </g>
  );
}

/* столы участников — поверх фигур */
export function HallSeatTables({ portrait = false, from = 0, count = 4 }: { portrait?: boolean; from?: number; count?: number }) {
  return (
    <g>
      {hallSeats(portrait).slice(from, from + count).map((t, i0) => {
        const i = i0 + from;
        return (
          <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
            <ellipse cx="0" cy="64" rx="98" ry="15" fill="#140d07" opacity=".38" filter="url(#f-soft)" />
            <path d="M-86 0 h172 l10 62 h-192z" fill="url(#g-wood-d)" />
            <path d="M-86 0 h172 l3 12 h-178z" fill="url(#g-wood)" />
            <path d="M-70 0 q0 -10 12 -10 h116 q12 0 12 10z" fill="#5a1c12" />
            <g transform="translate(58 26)">
              <rect x="-16" y="-12" width="32" height="24" rx="4" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.6" />
              <text textAnchor="middle" dy="6" fontSize="17" fontFamily="Georgia, serif" fill="#4a3610" fontWeight="bold">{i + 1}</text>
            </g>
            <g transform="translate(-56 22)"><rect x="-8" y="-10" width="16" height="12" rx="3" fill="#2c2117" /><circle cx="0" cy="-12" r="3.4" fill="#8d887c" /></g>
          </g>
        );
      })}
    </g>
  );
}

export function AuctionHallFront({ mode, portrait = false }: { mode: 'bid' | 'inspect'; portrait?: boolean }) {
  const bid = mode === 'bid';
  const ap = aucPos(portrait);
  return (
    <g>
      {/* кулисы-шторы */}
      <path d="M0 0 h120 q-30 240 -18 470 q6 130 -34 240 L0 900z" fill="url(#ah-curtain)" />
      <path d="M28 0 q-16 250 -6 470 q5 120 -22 220" stroke="#93392a" strokeWidth="10" fill="none" opacity=".5" />
      <path d="M1600 0 h-120 q30 240 18 470 q-6 130 34 240 L1600 900z" fill="url(#ah-curtain)" />
      <path d="M1572 0 q16 250 6 470 q-5 120 22 220" stroke="#93392a" strokeWidth="10" fill="none" opacity=".5" />
      {/* подхваты с кистями */}
      <g>
        <path d="M92 286 q18 8 22 22" stroke="#d9b23f" strokeWidth="4" fill="none" />
        <path d="M112 306 q10 16 2 26 q-12 4 -14 -10z" fill="#d9b23f" />
        <path d="M1508 286 q-18 8 -22 22" stroke="#d9b23f" strokeWidth="4" fill="none" />
        <path d="M1488 306 q-10 16 -2 26 q12 4 14 -10z" fill="#d9b23f" />
      </g>

      {/* головы зрителей по углам */}
      <g fill="#1d140c" opacity=".92">
        <path d="M60 900 q-8 -86 44 -96 q52 -6 62 60 q4 22 2 36z" />
        <path d="M96 812 q30 -18 58 4" stroke="#140d07" strokeWidth="8" fill="none" />
        <path d="M1544 900 q10 -92 -46 -100 q-52 -4 -60 64 q-3 20 -1 36z" />
        <path d="M1462 816 q18 -22 52 -10" stroke="#140d07" strokeWidth="8" fill="none" />
        <path d="M84 806 q22 -26 52 -8 l6 12 q-32 -10 -58 4z" />
      </g>

      {/* стол игрока снизу */}
      <g>
        <path d="M180 900 q300 -52 620 -52 q320 0 620 52z" fill="#241a10" />
        <path d="M180 900 q300 -52 620 -52 q320 0 620 52z" fill="none" stroke="#57432c" strokeWidth="4" opacity=".6" />
        <path d="M240 882 q280 -40 560 -40 q280 0 560 40" stroke="#8a6a48" strokeWidth="3" fill="none" opacity=".35" />
        <g transform={`translate(${ap.x - 170} 858) rotate(-6)`}>
          <rect x="-30" y="-22" width="60" height="40" rx="6" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="2.4" />
          <text textAnchor="middle" dy="6" fontSize="24" fontFamily="Georgia, serif" fill="#4a3610" fontWeight="bold">№5</text>
          <rect x="-6" y="16" width="12" height="16" rx="3" fill="#8a6a48" />
        </g>
        <g transform={`translate(${ap.x + 70} 868) rotate(3)`}>
          <rect x="-56" y="-16" width="112" height="30" rx="4" fill="#d9c9a8" />
          <path d="M0 -16 v30" stroke="#a89878" strokeWidth="2.4" />
          <path d="M-44 -6 h32 M-44 2 h26 M12 -6 h32 M12 2 h24" stroke="#8a7a5a" strokeWidth="1.8" />
          <path d="M40 -22 q18 -14 30 -10 q-8 12 -22 14z" fill="#e8e0cc" stroke="#8a7a5a" strokeWidth="1.4" />
        </g>
        <g transform={`translate(${ap.x + 280} 874)`}>
          <ellipse cx="0" cy="0" rx="16" ry="6" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.4" />
          <ellipse cx="22" cy="4" rx="16" ry="6" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.4" />
          <ellipse cx="10" cy="-6" rx="16" ry="6" fill="#f2d788" stroke="#8a6c1e" strokeWidth="1.4" />
        </g>
      </g>

      <rect x="0" y="0" width="1600" height="900" fill="url(#g-roomwarm)" pointerEvents="none" />
      {bid && <rect x="0" y="0" width="1600" height="900" fill="#140d07" opacity=".18" pointerEvents="none" />}
    </g>
  );
}
