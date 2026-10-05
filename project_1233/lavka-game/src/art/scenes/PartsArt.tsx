/* PartsArt.tsx — магазин запчастей «У Шпуля» в общем визуальном языке:
   дощатые стены, прилавок со стеклянной витриной деталей, полки с банками и коробками,
   весы, гиря, кот на прилавке, тёплая лампа. Передний план — край прилавка с инструментом. */
import React from 'react';

export function PartsArt() {
  return (
    <svg className="shop-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pt-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f5656" /><stop offset=".7" stopColor="#33484a" /><stop offset="1" stopColor="#2c3e3e" />
        </linearGradient>
        <linearGradient id="pt-plank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f6a6a" /><stop offset="1" stopColor="#3f5656" />
        </linearGradient>
        <radialGradient id="pt-lamp" cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".42" /><stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* стены досками */}
      <rect width="1600" height="900" fill="url(#pt-wall)" />
      {Array.from({ length: 16 }).map((_, i) => <rect key={i} x={i * 100} y="0" width="96" height="620" fill="url(#pt-plank)" opacity={i % 2 ? .5 : .8} />)}
      {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M${i * 100} 0 v620`} stroke="#2c3e3e" strokeWidth="3" opacity=".8" />)}
      <rect y="608" width="1600" height="14" fill="#22303a" />
      <rect y="622" width="1600" height="278" fill="url(#p-floor-d)" />
      <rect width="1600" height="30" fill="#22303a" />

      {/* вывеска */}
      <g transform="translate(800 96)">
        <path d="M-320 -40 h640 v80 h-640z" fill="#241a12" stroke="#d9b23f" strokeWidth="3" />
        <path d="M-320 -40 l-26 40 26 40z M320 -40 l26 40 -26 40z" fill="#1a120b" />
        <text textAnchor="middle" dy="14" fontSize="40" fontFamily="Georgia, serif" fill="#f2d788" letterSpacing="6">ЗАПЧАСТИ «У ШПУЛЯ»</text>
        <path d="M-260 52 q260 18 520 0" stroke="#8a6c1e" strokeWidth="3" fill="none" opacity=".7" />
      </g>

      {/* перфопанель с инструментом слева */}
      <g transform="translate(110 190)">
        <rect x="-14" y="-14" width="360" height="260" rx="10" fill="#3a4a4a" stroke="#22303a" strokeWidth="6" />
        <rect width="332" height="232" rx="6" fill="#4f6a6a" />
        {Array.from({ length: 48 }).map((_, i) => <circle key={i} cx={(i % 8) * 42 + 20} cy={Math.floor(i / 8) * 38 + 18} r="2.4" fill="#22303a" opacity=".8" />)}
        <g strokeLinecap="round">
          <path d="M60 40 v84 M46 40 h28" stroke="#b9b2a4" strokeWidth="8" />
          <path d="M130 36 q22 44 0 88" stroke="#b9b2a4" strokeWidth="7" fill="none" />
          <path d="M200 40 l-14 84 M200 40 l14 84" stroke="#b9b2a4" strokeWidth="7" />
          <circle cx="270" cy="70" r="22" fill="none" stroke="#b9b2a4" strokeWidth="7" />
          <rect x="80" y="160" width="60" height="36" rx="6" fill="#8a5a44" stroke="#5a3a2a" strokeWidth="3" />
          <path d="M170 178 h60 M170 190 h44" stroke="#b9b2a4" strokeWidth="6" />
        </g>
      </g>

      {/* полки с банками и коробками справа */}
      <g transform="translate(1050 200)">
        {[0, 1, 2].map(r => (
          <g key={r} transform={`translate(0 ${r * 120})`}>
            <rect x="-12" y="0" width="470" height="14" rx="4" fill="url(#g-wood)" />
            <path d="M-12 14 h470 l-6 10 h-458z" fill="#57432c" />
            {[0, 1, 2, 3, 4].map(i => (
              <g key={i} transform={`translate(${30 + i * 92} 0)`}>
                {i % 2 === 0 ? (
                  <g>
                    <rect x="-24" y="-46" width="48" height="46" rx="6" fill={['#cfe0e0', '#d9b23f', '#b5533c', '#9fdc9f', '#cfc7ae'][i]} opacity=".85" stroke="#22303a" strokeWidth="2.6" />
                    <rect x="-17" y="-54" width="34" height="10" rx="3" fill="#8d887c" />
                    <rect x="-17" y="-32" width="34" height="16" rx="2" fill="#e3d3b3" opacity=".9" />
                    <path d="M-12 -25 h24 M-12 -20 h16" stroke="#8a7a5a" strokeWidth="1.6" />
                  </g>
                ) : (
                  <g>
                    <rect x="-28" y="-40" width="56" height="40" rx="4" fill="#8a6a48" stroke="#5a4632" strokeWidth="2.6" />
                    <path d="M-28 -26 h56" stroke="#5a4632" strokeWidth="2.2" />
                    <path d="M-16 -34 h20" stroke="#e3d3b3" strokeWidth="2.4" opacity=".8" />
                  </g>
                )}
              </g>
            ))}
          </g>
        ))}
      </g>

      {/* весы и гиря на заднем прилавке */}
      <g transform="translate(760 470)">
        <rect x="-140" y="0" width="280" height="16" rx="5" fill="url(#g-wood)" />
        <rect x="-126" y="16" width="252" height="120" fill="#57432c" />
        <g transform="translate(-60 -6)">
          <rect x="-4" y="-52" width="8" height="52" fill="url(#g-brass)" />
          <rect x="-52" y="-56" width="104" height="7" rx="3.5" fill="url(#g-brass)" />
          {[-46, 46].map(x => <g key={x}><path d={`M${x} -50 l-9 30 M${x} -50 l9 30 M${x} -50 v30`} stroke="#8a6c1e" strokeWidth="1.6" /><path d={`M${x - 16} -20 q16 12 32 0 q-4 9 -16 9 q-12 0 -16 -9z`} fill="url(#g-brass)" /></g>)}
          <circle cx="0" cy="-56" r="5" fill="url(#g-brass)" />
        </g>
        <g transform="translate(60 -14)">
          <path d="M-12 14 q12 6 24 0 l-3 -22 q-9 -5 -18 0z" fill="#3a3630" />
          <rect x="-4" y="-16" width="8" height="8" rx="2" fill="#3a3630" />
        </g>
      </g>

      {/* главный прилавок с витриной деталей */}
      <g transform="translate(300 620)">
        <rect x="-20" y="0" width="1040" height="22" rx="6" fill="url(#g-wood)" />
        <rect x="-10" y="22" width="1020" height="170" fill="#6e4f33" />
        <path d="M-10 64 h1020 M-10 116 h1020" stroke="#57432c" strokeWidth="4" opacity=".8" />
        {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={20 + i * 126} y="34" width="96" height="146" rx="4" fill="none" stroke="#57432c" strokeWidth="3" opacity=".7" />)}
        {/* стеклянная витрина на прилавке */}
        <g transform="translate(180 -108)">
          <rect x="-10" y="-10" width="620" height="118" rx="6" fill="#22303a" />
          <rect width="600" height="98" rx="4" fill="url(#g-glass)" opacity=".3" />
          <path d="M8 8 q40 -10 80 0" stroke="#fff" strokeWidth="3" fill="none" opacity=".35" />
          {[0, 1, 2, 3, 4, 5].map(i => (
            <g key={i} transform={`translate(${50 + i * 100} 62)`}>
              <rect x="-30" y="-8" width="60" height="10" rx="3" fill="#8a6a48" />
              {i === 0 && <g><circle r="14" fill="none" stroke="#8d887c" strokeWidth="5" /><circle r="4" fill="#8d887c" /></g>}
              {i === 1 && <g><rect x="-16" y="-24" width="32" height="18" rx="4" fill="#b5533c" /><path d="M-10 -28 h20" stroke="#8d887c" strokeWidth="3" /></g>}
              {i === 2 && <g><path d="M-14 0 q14 -26 28 0z" fill="#d9b23f" /><circle cx="0" cy="-6" r="4" fill="#8a6c1e" /></g>}
              {i === 3 && <g><rect x="-18" y="-20" width="36" height="14" rx="6" fill="#3a3630" /><circle cx="-10" cy="-6" r="4" fill="#8d887c" /><circle cx="10" cy="-6" r="4" fill="#8d887c" /></g>}
              {i === 4 && <g><path d="M0 -26 v26" stroke="#b9b2a4" strokeWidth="4" /><circle cx="0" cy="-26" r="7" fill="#cfe0e0" stroke="#8d887c" strokeWidth="2.4" /></g>}
              {i === 5 && <g><rect x="-14" y="-22" width="28" height="22" rx="4" fill="#4f6a6a" /><path d="M-8 -14 h16 M-8 -8 h10" stroke="#cfe0e0" strokeWidth="2" /></g>}
            </g>
          ))}
          <path d="M0 98 h600" stroke="#8a6a48" strokeWidth="4" />
        </g>
        {/* кот на прилавке */}
        <g transform="translate(900 -22)">
          <ellipse rx="36" ry="15" fill="#5d584c" />
          <circle cx="-27" cy="-7" r="12" fill="#5d584c" />
          <path d="M-35 -14 l-3 -10 9 5 M-22 -16 l2 -10 7 8" fill="#5d584c" />
          <path d="M34 -3 q16 -2 13 9" stroke="#5d584c" strokeWidth="5.4" fill="none" strokeLinecap="round" className="cat-tail" />
          <path d="M-31 -7 q3 2.4 6 0" stroke="#1a120b" strokeWidth="1.4" fill="none" />
        </g>
      </g>

      {/* лампы */}
      {[[500, 150], [1100, 140]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} 0)`}>
          <path d={`M0 0 v${y - 34}`} stroke="#1a120b" strokeWidth="5" />
          <g transform={`translate(0 ${y})`} className="lamp-sway" style={{ animationDelay: `${i * 1.1}s`, transformOrigin: '0px -34px' }}>
            <path d="M-30 22 q30 -30 60 0z" fill="#d9b23f" />
            <circle cx="0" cy="26" r="9" fill="#ffe9a3" />
            <circle cx="0" cy="36" r="100" fill="url(#pt-lamp)" />
          </g>
        </g>
      ))}

      {/* передний план: ящики с деталями */}
      <g transform="translate(120 900)">
        <path d="M-140 -90 h280 v90 h-280z" fill="#22303a" />
        <g transform="translate(-40 -90)">
          <rect x="-46" y="-40" width="92" height="40" rx="4" fill="#8a6a48" stroke="#5a4632" strokeWidth="3" />
          <path d="M-46 -26 h92" stroke="#5a4632" strokeWidth="2.4" />
          <circle cx="-16" cy="-46" r="8" fill="none" stroke="#8d887c" strokeWidth="4" />
          <rect x="6" y="-56" width="22" height="14" rx="3" fill="#b5533c" />
        </g>
        <g transform="translate(70 -90)">
          <rect x="-38" y="-32" width="76" height="32" rx="4" fill="#a67c52" stroke="#5a4632" strokeWidth="2.6" />
          <path d="M-38 -18 h76" stroke="#5a4632" strokeWidth="2.2" />
          <path d="M-20 -40 q10 -8 20 0" stroke="#d9b23f" strokeWidth="3" fill="none" />
        </g>
      </g>

      <rect width="1600" height="900" fill="url(#g-roomwarm)" pointerEvents="none" />
    </svg>
  );
}
