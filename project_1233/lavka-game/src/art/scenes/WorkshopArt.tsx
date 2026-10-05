/* WorkshopArt.tsx — МАСТЕРСКАЯ: место, где реально ремонтируют.
   Кирпич с копотью, перфопанель с инструментом и нарисованными контурами, полки с банками,
   тяжёлый верстак с тисками, articul-лампа над рабочим местом (световой конус на предмет),
   следы использования: стружка, потёртости, чертежи. Передний план: край верстака с инструментом. */
import React from 'react';

export function WorkshopArt({ portrait = false }: { portrait?: boolean }) {
  return (
    <svg className="shop-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wb-air" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2117" /><stop offset=".6" stopColor="#3a2c1d" /><stop offset="1" stopColor="#241a12" />
        </linearGradient>
        <linearGradient id="wb-bench" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b08968" /><stop offset=".2" stopColor="#8a6a48" /><stop offset="1" stopColor="#57432c" />
        </linearGradient>
        <radialGradient id="wb-lampglow" cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".5" /><stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wb-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".34" /><stop offset="1" stopColor="#ffe9a3" stopOpacity=".02" />
        </linearGradient>
        <linearGradient id="wb-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4a5a" /><stop offset="1" stopColor="#c8a878" />
        </linearGradient>
      </defs>

      {/* воздух и кирпич */}
      <rect width="1600" height="900" fill="url(#wb-air)" />
      <rect width="1600" height="640" fill="url(#p-brick)" opacity=".55" />
      <rect width="1600" height="640" fill="url(#wb-air)" opacity=".35" />
      {/* копоть под потолком */}
      <rect width="1600" height="90" fill="#1a120b" opacity=".8" />
      <path d="M0 90 q400 26 800 10 q400 -16 800 8 v-20 H0z" fill="#1a120b" opacity=".5" />
      {/* балки */}
      {[200, 700, 1200].map(x => <rect key={x} x={x} y="0" width="26" height="120" fill="#241a10" opacity=".8" />)}
      <rect y="112" width="1600" height="14" fill="#241a10" opacity=".8" />

      {/* окно с сумерками */}
      <g transform="translate(1240 150)">
        <rect x="-10" y="-10" width="240" height="190" rx="6" fill="#241a10" />
        <rect width="220" height="170" rx="3" fill="url(#wb-dusk)" opacity=".9" />
        <path d="M0 130 l30 -22 26 18 34 -26 30 22 34 -18 36 24 30 -16 v58 H0z" fill="#232c38" opacity=".8" />
        <circle cx="176" cy="40" r="12" fill="#f2e8c8" opacity=".75" />
        <path d="M110 0 v170 M0 85 h220" stroke="#241a10" strokeWidth="7" />
        <path d="M10 14 q26 -8 52 0" stroke="#c8d8e8" strokeWidth="3.4" fill="none" opacity=".3" />
        <rect x="-16" y="180" width="252" height="12" rx="4" fill="#57432c" />
        {/* банка на подоконнике */}
        <g transform="translate(40 180)"><rect x="-12" y="-26" width="24" height="26" rx="4" fill="#cfe0e0" opacity=".7" /><rect x="-9" y="-30" width="18" height="6" rx="2" fill="#8d887c" /><rect x="-8" y="-16" width="16" height="12" fill="#b5533c" opacity=".7" /></g>
      </g>

      {/* перфопанель с инструментом */}
      <g transform="translate(120 140)">
        <rect x="-14" y="-14" width="420" height="300" rx="10" fill="#4a3a28" stroke="#2c2115" strokeWidth="6" />
        <rect width="392" height="272" rx="6" fill="#5c4a34" />
        {Array.from({ length: 60 }).map((_, i) => <circle key={i} cx={(i % 10) * 40 + 16} cy={Math.floor(i / 10) * 44 + 20} r="2.6" fill="#3a2c1d" opacity=".8" />)}
        {/* нарисованные контуры мест */}
        <g stroke="#3a2c1d" strokeWidth="2.4" fill="none" opacity=".55">
          <path d="M60 40 v96 M44 40 h32" />
          <path d="M140 36 q26 50 0 100" />
          <path d="M220 40 l-16 96 M220 40 l16 96" />
          <path d="M300 44 v80 M288 124 h24" />
          <circle cx="80" cy="200" r="30" />
          <circle cx="180" cy="204" r="22" />
        </g>
        {/* сам инструмент */}
        <g strokeLinecap="round">
          <path d="M60 40 v96 M44 40 h32" stroke="#b9b2a4" strokeWidth="9" />
          <path d="M140 36 q26 50 0 100" stroke="#b9b2a4" strokeWidth="8" fill="none" />
          <path d="M220 40 l-16 96 M220 40 l16 96" stroke="#b9b2a4" strokeWidth="8" />
          <path d="M300 44 v80 M288 124 h24" stroke="#b9b2a4" strokeWidth="8" />
          <circle cx="80" cy="200" r="26" fill="none" stroke="#b9b2a4" strokeWidth="8" />
          <circle cx="180" cy="204" r="18" fill="none" stroke="#b9b2a4" strokeWidth="7" />
          <rect x="250" y="180" width="60" height="40" rx="6" fill="#8a5a44" stroke="#5a3a2a" strokeWidth="3" />
          <path d="M262 190 h36 M262 200 h36 M262 210 h24" stroke="#5a3a2a" strokeWidth="3" />
        </g>
        {/* пила поверх */}
        <g transform="translate(330 90) rotate(8)">
          <path d="M0 0 h60 l6 6 -6 6 6 6 -6 6 6 6 -6 6 h-60z" fill="#b9b2a4" />
          <rect x="-26" y="-4" width="28" height="16" rx="6" fill="#6e4f33" />
        </g>
      </g>

      {/* полки с банками справа */}
      <g transform={`translate(${portrait ? 980 : 900} 170)`}>
        {[0, 1].map(r => (
          <g key={r} transform={`translate(0 ${r * 110})`}>
            <rect x="-10" y="0" width="320" height="14" rx="4" fill="url(#g-wood)" />
            <path d="M-10 14 h320 l-6 10 h-308z" fill="#57432c" />
            {[0, 1, 2, 3].map(i => (
              <g key={i} transform={`translate(${26 + i * 76} 0)`}>
                <rect x="-20" y="-40" width="40" height="40" rx="6" fill={['#cfe0e0', '#d9b23f', '#b5533c', '#9fdc9f'][i]} opacity=".8" stroke="#3a2c1d" strokeWidth="2.4" />
                <rect x="-14" y="-48" width="28" height="9" rx="3" fill="#8d887c" />
                <rect x="-14" y="-28" width="28" height="14" rx="2" fill="#e3d3b3" opacity=".85" />
                <path d="M-10 -22 h20 M-10 -17 h14" stroke="#8a7a5a" strokeWidth="1.6" />
              </g>
            ))}
          </g>
        ))}
      </g>

      {/* чертежи на стене */}
      <g transform={`translate(${portrait ? 660 : 640} 210) rotate(-2)`}>
        <rect x="-70" y="-50" width="140" height="100" rx="3" fill="#d9c9a8" opacity=".9" />
        <circle cx="-20" cy="-10" r="22" fill="none" stroke="#5a7a9a" strokeWidth="2.4" />
        <path d="M-20 -32 v44 M-42 -10 h44" stroke="#5a7a9a" strokeWidth="1.6" />
        <path d="M14 -30 h44 M14 -18 h36 M14 -6 h44 M14 6 h28" stroke="#5a7a9a" strokeWidth="2" />
        <circle cx="0" cy="-50" r="4" fill="#b5533c" />
      </g>

      {/* ================= верстак ================= */}
      <g transform="translate(0 620)">
        {/* столешница */}
        <rect x="60" y="0" width="1480" height="34" rx="8" fill="url(#wb-bench)" />
        <rect x="60" y="0" width="1480" height="8" rx="4" fill="#c8a97e" opacity=".55" />
        {/* потёртости и пятна */}
        <ellipse cx="420" cy="18" rx="90" ry="7" fill="#4a3620" opacity=".35" />
        <ellipse cx="1120" cy="20" rx="120" ry="8" fill="#4a3620" opacity=".3" />
        <path d="M700 10 q60 6 120 0" stroke="#4a3620" strokeWidth="3" fill="none" opacity=".4" />
        {/* тумба с ящиками */}
        <rect x="1180" y="34" width="330" height="246" fill="#57432c" />
        {[0, 1, 2].map(r => (
          <g key={r} transform={`translate(1196 ${50 + r * 78})`}>
            <rect width="298" height="66" rx="5" fill="#6e4f33" stroke="#4a3620" strokeWidth="3" />
            <rect x="118" y="26" width="62" height="12" rx="5" fill="url(#g-brass)" />
            <path d="M8 8 h282" stroke="#4a3620" strokeWidth="2" opacity=".6" />
          </g>
        ))}
        {/* ножки и царга */}
        <rect x="120" y="34" width="34" height="246" fill="#57432c" />
        <rect x="700" y="34" width="30" height="246" fill="#57432c" />
        <rect x="120" y="150" width="610" height="16" fill="#4a3620" />
        {/* нижняя полка с ящиком */}
        <rect x="150" y="210" width="520" height="14" fill="#57432c" />
        <g transform="translate(240 210)"><rect x="-40" y="-34" width="80" height="34" rx="4" fill="#8a6a48" stroke="#5a4632" strokeWidth="2.6" /><path d="M-40 -17 h80" stroke="#5a4632" strokeWidth="2.2" /></g>
        <g transform="translate(420 210)"><rect x="-34" y="-28" width="68" height="28" rx="4" fill="#4f6a6a" stroke="#33484a" strokeWidth="2.4" /></g>
      </g>

      {/* тиски слева */}
      <g transform="translate(150 560)">
        <rect x="-10" y="26" width="120" height="40" rx="6" fill="#5d584c" />
        <rect x="-10" y="10" width="70" height="20" rx="4" fill="#7a7568" />
        <rect x="66" y="6" width="26" height="28" rx="4" fill="#8d887c" />
        <path d="M92 18 h34" stroke="#b9b2a4" strokeWidth="7" strokeLinecap="round" />
        <circle cx="130" cy="18" r="7" fill="#b9b2a4" />
        <path d="M0 26 h60" stroke="#3a3630" strokeWidth="3" />
      </g>

      {/* articul-лампа над рабочим местом */}
      <g transform={`translate(${portrait ? 800 : 430} 0)`}>
        <rect x="-8" y="0" width="16" height="26" rx="4" fill="#24221c" />
        <path d="M0 24 L-60 150 L40 260" stroke="#24221c" strokeWidth="10" fill="none" strokeLinecap="round" />
        <circle cx="-60" cy="150" r="9" fill="#3a3630" /><circle cx="0" cy="24" r="9" fill="#3a3630" />
        <g transform="translate(40 260) rotate(18)" className="lamp-sway" style={{ transformOrigin: '0px 0px' }}>
          <path d="M-46 34 q46 -40 92 0 z" fill="#b5533c" />
          <path d="M-46 34 q46 12 92 0" stroke="#7c3a2a" strokeWidth="3.4" fill="none" />
          <circle cx="0" cy="38" r="11" fill="#ffe9a3" />
          <circle cx="0" cy="52" r="120" fill="url(#wb-lampglow)" />
          <path d="M-60 44 L-150 360 h300 L60 44z" fill="url(#wb-cone)" />
        </g>
      </g>

      {/* ================= передний план: инструмент на верстаке ================= */}
      <g transform="translate(0 620)">
        {/* отвёртки и ключ */}
        <g transform="translate(880 8) rotate(-6)">
          <rect x="-46" y="-5" width="52" height="10" rx="4" fill="#b5533c" />
          <rect x="6" y="-2.6" width="58" height="5.2" rx="2" fill="#b9b2a4" />
        </g>
        <g transform="translate(980 14) rotate(4)">
          <rect x="-40" y="-4.6" width="46" height="9.2" rx="4" fill="#4f6a6a" />
          <rect x="6" y="-2.4" width="52" height="4.8" rx="2" fill="#b9b2a4" />
        </g>
        <g transform="translate(1080 10) rotate(-14)">
          <path d="M-40 0 q-12 -10 -4 -20 q10 -6 14 4 l8 16 q14 4 10 16 q-6 10 -16 4z" fill="#8d887c" />
          <rect x="-16" y="-4" width="70" height="9" rx="4" fill="#8d887c" />
        </g>
        {/* тряпка и банка полироли */}
        <g transform="translate(620 6)">
          <path d="M-40 0 q20 -14 44 -4 q22 8 12 16 q-30 10 -56 -2z" fill="#cfc7ae" opacity=".9" />
          <path d="M-24 -2 q16 -6 32 0" stroke="#b0a890" strokeWidth="2.4" fill="none" />
        </g>
        <g transform="translate(700 -6)">
          <rect x="-16" y="-30" width="32" height="30" rx="5" fill="#d9b23f" stroke="#8a6c1e" strokeWidth="2.4" />
          <rect x="-11" y="-36" width="22" height="7" rx="2" fill="#8d887c" />
          <rect x="-11" y="-22" width="22" height="12" rx="2" fill="#efe3cc" />
          <path d="M-7 -17 h14" stroke="#8a7a5a" strokeWidth="1.6" />
        </g>
        {/* стружка */}
        <path d="M520 16 q8 -10 16 0 q8 10 16 0 M560 20 q6 -8 12 0" stroke="#c8a97e" strokeWidth="2.4" fill="none" opacity=".8" />
        {/* лупа на струбцине */}
        <g transform="translate(1130 -4)">
          <rect x="-6" y="-8" width="12" height="14" rx="3" fill="#3a3630" />
          <path d="M0 -8 q-4 -26 18 -34" stroke="#3a3630" strokeWidth="6" fill="none" />
          <circle cx="24" cy="-46" r="20" fill="url(#g-glass)" stroke="url(#g-brass)" strokeWidth="5" />
          <path d="M14 -54 q6 -6 14 -4" stroke="#fff" strokeWidth="3" fill="none" opacity=".7" />
        </g>
      </g>

      {/* кошка на тумбе (живость) */}
      <g transform="translate(1340 596)">
        <ellipse rx="40" ry="16" fill="#4a4238" />
        <circle cx="-30" cy="-8" r="13" fill="#4a4238" />
        <path d="M-38 -16 l-3 -10 9 5 M-24 -18 l2 -10 7 8" fill="#4a4238" />
        <path d="M38 -4 q18 -2 15 10" stroke="#4a4238" strokeWidth="6" fill="none" strokeLinecap="round" className="cat-tail" />
        <path d="M-34 -8 q3 2.6 6 0" stroke="#1a120b" strokeWidth="1.4" fill="none" />
        <text x="-6" y="-22" fontSize="15" fill="#cfc7ae" opacity=".55" fontFamily="Georgia, serif">z z</text>
      </g>

      <rect width="1600" height="900" fill="url(#g-roomwarm)" pointerEvents="none" />
    </svg>
  );
}
