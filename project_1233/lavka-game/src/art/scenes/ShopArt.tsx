/* ShopArt.tsx — ЛАВКА: «моё место». Уютное помещение с глубиной и прогрессом.
   Слева направо: пробковая доска заказов → дверь с колокольчиком → полки стеллажа →
   окно на улицу (с проходящими силуэтами) → витрина-колонна → прилавок с кассой.
   Прогресс лавки виден в мире: level 2 добавляет витрину, ковёр и шторы; level 3 —
   второй ярус полок, картины и растения. Слоты предметов совпадают с SHOP_SLOTS/FIXTURE_SPOTS. */
import React from 'react';

export const SHOP_SLOTS: { x: number; y: number }[] = [
  { x: 47.5, y: 33 }, { x: 53.5, y: 33 }, { x: 59.5, y: 33 }, { x: 65.5, y: 33 }, { x: 71.5, y: 33 },
  { x: 47.5, y: 51 }, { x: 53.5, y: 51 }, { x: 59.5, y: 51 }, { x: 65.5, y: 51 }, { x: 71.5, y: 51 },
  { x: 80, y: 66 }, { x: 22, y: 63 },
];
export const FIXTURE_SPOTS: Record<string, { x: number; y: number; s: number }> = {
  radiola: { x: 74, y: 62, s: 64 },
  cuckoo: { x: 88, y: 14, s: 74 },
  sewing: { x: 64, y: 78, s: 84 },
  watch: { x: 90, y: 58, s: 44 },
};
export const VITRINE_SPOT = { x: 89.5, y: 55, s: 46 };

export function ShopArt({ level }: { level: number }) {
  return (
    <svg className="shop-bg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sh-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6a4a" /><stop offset=".7" stopColor="#7a5c40" /><stop offset="1" stopColor="#5c4530" />
        </linearGradient>
        <linearGradient id="sh-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6a48" /><stop offset="1" stopColor="#57432c" />
        </linearGradient>
        <linearGradient id="sh-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8c4d4" /><stop offset=".7" stopColor="#e8d8b8" /><stop offset="1" stopColor="#d8c8a8" />
        </linearGradient>
        <radialGradient id="sh-lamp" cx=".5" cy=".35" r=".65">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".4" /><stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sh-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".26" /><stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </linearGradient>
        <pattern id="sh-stripe" width="42" height="42" patternUnits="userSpaceOnUse">
          <rect width="42" height="42" fill="#7a5c40" />
          <rect width="14" height="42" fill="#86684a" />
          <rect x="28" width="5" height="42" fill="#6e5438" />
        </pattern>
      </defs>

      {/* ================= стены и пол ================= */}
      <rect width="1600" height="900" fill="url(#sh-wall)" />
      <rect width="1600" height="620" fill="url(#sh-stripe)" opacity=".85" />
      <rect y="608" width="1600" height="14" fill="#57432c" />
      <rect y="622" width="1600" height="278" fill="url(#sh-floor)" />
      {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${i * 140} 622 L${i * 160 - 80} 900`} stroke="#4a3620" strokeWidth="3" opacity=".5" />)}
      {[680, 750, 830].map(y => <path key={y} d={`M0 ${y} h1600`} stroke="#4a3620" strokeWidth="2.4" opacity=".4" />)}
      {/* потолочный карниз */}
      <rect width="1600" height="26" fill="#4a3620" />
      <rect y="26" width="1600" height="8" fill="#8a6a48" opacity=".6" />

      {/* ================= доска заказов (пробковая) ================= */}
      <g transform="translate(157 176)">
        <rect x="-10" y="-10" width="381" height="254" rx="8" fill="#57432c" />
        <rect width="361" height="234" rx="5" fill="#b09a72" />
        <rect width="361" height="234" rx="5" fill="none" stroke="#8a7452" strokeWidth="3" />
        {Array.from({ length: 40 }).map((_, i) => <circle key={i} cx={(i * 97) % 355 + 4} cy={(i * 61) % 226 + 4} r="1.6" fill="#9a8462" opacity=".7" />)}
        <text x="180" y="-18" textAnchor="middle" fontSize="20" fontFamily="Georgia, serif" fill="#e3d3b3" letterSpacing="3">ДОСКА ЗАКАЗОВ</text>
        {/* старые заметки и карандаш */}
        <g transform="translate(300 40) rotate(6)"><rect x="-22" y="-16" width="44" height="34" rx="2" fill="#e8e0cc" opacity=".8" /><path d="M-14 -6 h28 M-14 2 h20" stroke="#9a8a70" strokeWidth="1.6" /><circle cx="0" cy="-12" r="3" fill="#b5533c" /></g>
        <g transform="translate(40 190) rotate(-5)"><rect x="-24" y="-14" width="48" height="30" rx="2" fill="#e3d3b3" opacity=".75" /><circle cx="0" cy="-10" r="3" fill="#4f6a6a" /></g>
      </g>

      {/* ================= дверь с колокольчиком ================= */}
      <g transform="translate(560 250)">
        <rect x="-14" y="-14" width="168" height="464" rx="6" fill="#4a3620" />
        <rect width="140" height="450" rx="4" fill="#6e4f33" />
        <rect x="14" y="20" width="112" height="150" rx="4" fill="url(#g-glass)" opacity=".8" />
        <path d="M70 20 v150 M14 95 h112" stroke="#4a3620" strokeWidth="5" />
        <path d="M20 30 q20 -6 40 0" stroke="#fff" strokeWidth="4" fill="none" opacity=".4" />
        <rect x="14" y="196" width="112" height="104" rx="4" fill="none" stroke="#4a3620" strokeWidth="4" opacity=".8" />
        <rect x="14" y="320" width="112" height="104" rx="4" fill="none" stroke="#4a3620" strokeWidth="4" opacity=".8" />
        <circle cx="122" cy="250" r="6" fill="url(#g-brass)" />
        {/* табличка «открыто» */}
        <g transform="translate(70 120) rotate(-3)">
          <rect x="-40" y="-16" width="80" height="32" rx="5" fill="#241a12" stroke="#d9b23f" strokeWidth="2" />
          <text textAnchor="middle" y="6" fontSize="15" fontFamily="Georgia, serif" fill="#f2d788" letterSpacing="2">ОТКРЫТО</text>
          <path d="M0 -16 v-10" stroke="#8a6c1e" strokeWidth="2" />
        </g>
        {/* колокольчик */}
        <g transform="translate(112 -2)">
          <path d="M0 0 v8" stroke="#8a6c1e" strokeWidth="2.4" />
          <path d="M-9 16 q9 -14 18 0 z" fill="url(#g-brass)" />
          <circle cx="0" cy="18" r="2.4" fill="#8a6c1e" />
        </g>
        {/* коврик у двери */}
        <path d="M-20 450 h180 l14 22 h-208z" fill="#7c2a1c" />
        <path d="M-6 458 h152" stroke="#93392a" strokeWidth="3" />
      </g>

      {/* ================= стеллаж с полками ================= */}
      <g>
        {/* ярус 1 (всегда) */}
        <g transform="translate(720 305)">
          <rect x="-16" y="0" width="452" height="14" rx="4" fill="url(#g-wood)" />
          <rect x="-16" y="14" width="452" height="6" fill="#57432c" />
          {[20, 220, 410].map(x => <path key={x} d={`M${x} 20 l10 26 h-20z`} fill="#57432c" />)}
        </g>
        {/* ярус 2 (level 2+) */}
        {level >= 2 && (
          <g transform="translate(720 467)">
            <rect x="-16" y="0" width="452" height="14" rx="4" fill="url(#g-wood)" />
            <rect x="-16" y="14" width="452" height="6" fill="#57432c" />
            {[20, 220, 410].map(x => <path key={x} d={`M${x} 20 l10 26 h-20z`} fill="#57432c" />)}
          </g>
        )}
        {/* боковины стеллажа */}
        <rect x="696" y="270" width="14" height="250" fill="#57432c" />
        <rect x="1160" y="270" width="14" height="250" fill="#57432c" />
      </g>

      {/* ================= окно на улицу ================= */}
      <g transform="translate(1184 170)">
        <rect x="-12" y="-12" width="184" height="354" rx="6" fill="#4a3620" />
        <rect width="160" height="330" rx="3" fill="url(#sh-win)" />
        {/* улица за окном: дом напротив + силуэты прохожих */}
        <g clipPath="url(#sh-winclip)">
          <clipPath id="sh-winclip"><rect width="160" height="330" rx="3" /></clipPath>
          <path d="M0 250 h160 v80 h-160z" fill="#c8b898" />
          <g transform="translate(30 250)">
            <rect x="-30" y="-70" width="60" height="70" fill="#4f6a6a" />
            <path d="M-34 -70 l34 -22 34 22z" fill="#3f5656" />
            <rect x="-14" y="-52" width="28" height="20" fill="#cfe0e0" opacity=".8" />
          </g>
          <g transform="translate(110 250)">
            <rect x="-26" y="-56" width="52" height="56" fill="#8a5a44" />
            <path d="M-30 -56 l30 -18 30 18z" fill="#6e4234" />
            <rect x="-10" y="-40" width="20" height="16" fill="#ffe9a3" opacity=".85" />
          </g>
          <g className="win-walk"><g transform="translate(0 246) scale(.5)"><WinSil /></g></g>
          <g className="win-walk2"><g transform="translate(0 250) scale(.42)"><WinSil flip /></g></g>
          {/* солнце и дерево */}
          <circle cx="128" cy="46" r="16" fill="#fff2c0" opacity=".85" />
          <path d="M14 250 v-40 q0 -18 14 -22 q14 4 14 22 v40z" fill="#6e8a56" opacity=".8" />
        </g>
        <path d="M80 0 v330 M0 110 h160 M0 220 h160" stroke="#4a3620" strokeWidth="6" />
        <path d="M8 16 q18 -8 36 0" stroke="#fff" strokeWidth="4" fill="none" opacity=".35" />
        {/* шторы (level 2+) */}
        {level >= 2 && <>
          <path d="M-12 -12 q30 40 22 180 q-4 70 -22 100z" fill="#8a4a3c" />
          <path d="M172 -12 q-30 40 -22 180 q4 70 22 100z" fill="#8a4a3c" />
          <path d="M-8 60 q14 30 10 90 M168 60 q-14 30 -10 90" stroke="#6e3a2e" strokeWidth="4" fill="none" />
        </>}
        {/* подоконник с растением */}
        <rect x="-20" y="330" width="200" height="14" rx="4" fill="url(#g-wood)" />
        <g transform="translate(140 330)">
          <path d="M-12 0 h24 l-4 20 h-16z" fill="#b5533c" />
          <path d="M0 -2 q-10 -14 -4 -24 q8 4 6 22 M0 -2 q10 -14 4 -24 q-8 4 -6 22 M0 -4 v-20" stroke="#6e8a56" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* ================= витрина-колонна (level 2+) ================= */}
      {level >= 2 && (
        <g transform="translate(1376 360)">
          <rect x="-8" y="-8" width="128" height="286" rx="6" fill="#4a3620" />
          <rect width="112" height="270" rx="4" fill="#2c2117" />
          <rect x="6" y="6" width="100" height="258" rx="3" fill="url(#g-glass)" opacity=".28" />
          {[70, 140, 210].map(y => <rect key={y} x="6" y={y} width="100" height="6" fill="#8a6a48" />)}
          <path d="M12 12 q20 -6 40 0" stroke="#fff" strokeWidth="3" fill="none" opacity=".3" />
          <path d="M-12 278 h136 l8 16 h-152z" fill="#57432c" />
          <path d="M0 -8 h112 l-6 -14 h-100z" fill="#57432c" />
        </g>
      )}

      {/* ================= прилавок с кассой ================= */}
      <g transform="translate(1056 594)">
        <rect x="-16" y="0" width="480" height="20" rx="6" fill="url(#g-wood)" />
        <rect x="-8" y="20" width="464" height="180" fill="#6e4f33" />
        <path d="M-8 60 h464 M-8 110 h464" stroke="#57432c" strokeWidth="4" opacity=".8" />
        {Array.from({ length: 7 }).map((_, i) => <rect key={i} x={16 + i * 64} y="32" width="40" height="156" rx="4" fill="none" stroke="#57432c" strokeWidth="3" opacity=".7" />)}
        <rect x="-16" y="-6" width="480" height="10" rx="4" fill="#c8a97e" opacity=".7" />
        {/* касса */}
        <g transform="translate(180 -10)">
          <rect x="-46" y="-58" width="92" height="58" rx="6" fill="#3a3630" />
          <rect x="-38" y="-50" width="76" height="26" rx="3" fill="#e3d3b3" />
          <path d="M-30 -42 h60 M-30 -34 h44" stroke="#8a7a5a" strokeWidth="2.4" />
          {Array.from({ length: 5 }).map((_, i) => <circle key={i} cx={-28 + i * 14} cy="-14" r="4.4" fill="url(#g-brass)" />)}
          <path d="M-46 -58 q46 -18 92 0" fill="#2c2a24" />
          <rect x="30" y="-76" width="18" height="20" rx="3" fill="#e3d3b3" />
          <path d="M34 -70 h10 M34 -64 h10" stroke="#8a7a5a" strokeWidth="1.6" />
        </g>
        {/* счёты */}
        <g transform="translate(330 -8) rotate(-4)">
          <rect x="-40" y="-26" width="80" height="26" rx="4" fill="#57432c" />
          {[0, 1, 2].map(r => <path key={r} d={`M-34 ${-19 + r * 7} h68`} stroke="#8a6a48" strokeWidth="2.4" />)}
          {[0, 1, 2].map(r => Array.from({ length: 6 }).map((_, i) => (
            <circle key={`${r}-${i}`} cx={-28 + i * 8 + (r === 1 ? 14 : 0)} cy={-19 + r * 7} r="3.2" fill={i % 2 ? '#b5533c' : '#d9b23f'} />
          )))}
        </g>
        {/* растение на прилавке */}
        <g transform="translate(20 -6)">
          <path d="M-12 0 h24 l-4 18 h-16z" fill="#4f6a6a" />
          <path d="M0 -2 q-12 -12 -6 -26 q10 4 8 24 M0 -2 q12 -12 6 -26 q-10 4 -8 24 M0 -6 v-18" stroke="#6e8a56" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      </g>
      {/* полочка для часов справа */}
      <g transform="translate(1440 522)">
        <rect x="-34" y="0" width="68" height="10" rx="3" fill="url(#g-wood)" />
        <path d="M-24 10 l6 16 M24 10 l-6 16" stroke="#57432c" strokeWidth="4" />
      </g>

      {/* ================= декор: часы, картины, лампы ================= */}
      <g transform="translate(640 128)">
        <circle r="34" fill="url(#g-wood-d)" />
        <circle r="27" fill="url(#g-dialface)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <path key={i} d={`M${Math.cos(a) * 21} ${Math.sin(a) * 21} l${Math.cos(a) * 4} ${Math.sin(a) * 4}`} stroke="#5a4632" strokeWidth="2" />;
        })}
        <path d="M0 0 L0 -16" stroke="#3a2c1d" strokeWidth="3.4" strokeLinecap="round" className="clock-min" />
        <path d="M0 0 L11 6" stroke="#3a2c1d" strokeWidth="2.6" strokeLinecap="round" />
        <circle r="3" fill="#5a4632" />
        <path d="M-34 0 q-6 40 6 54 M34 0 q6 40 -6 54" stroke="#8a6c1e" strokeWidth="3" fill="none" opacity=".7" />
        <path d="M0 34 v26" stroke="#8a6c1e" strokeWidth="2.6" />
        <circle cx="0" cy="66" r="7" fill="url(#g-brass)" />
      </g>
      {level >= 3 && <>
        <g transform="translate(480 120) rotate(-2)">
          <rect x="-40" y="-50" width="80" height="100" rx="4" fill="url(#g-brass)" />
          <rect x="-33" y="-43" width="66" height="86" fill="#3f4a5a" />
          <path d="M-33 10 q16 -20 30 -6 q16 -22 36 -2 v41 h-66z" fill="#5a6a7a" />
          <circle cx="14" cy="-20" r="7" fill="#e8d8a8" opacity=".85" />
        </g>
        <g transform="translate(940 120) rotate(2)">
          <rect x="-34" y="-42" width="68" height="84" rx="4" fill="url(#g-brass)" />
          <rect x="-27" y="-35" width="54" height="70" fill="#5a4632" />
          <path d="M-16 8 q10 -22 22 -8 q8 -12 16 -2 v30 h-38z" fill="#8a6a48" />
        </g>
      </>}
      {/* лампы */}
      {[[360, 150], [900, 130]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} 0)`}>
          <path d={`M0 0 v${y - 40}`} stroke="#241a12" strokeWidth="5" />
          <g transform={`translate(0 ${y})`} className="lamp-sway" style={{ animationDelay: `${i * 1.3}s`, transformOrigin: '0px -40px' }}>
            <path d="M-34 26 q34 -34 68 0 z" fill="#b5533c" />
            <path d="M-34 26 q34 10 68 0" stroke="#7c3a2a" strokeWidth="3" fill="none" />
            <circle cx="0" cy="30" r="9" fill="#ffe9a3" />
            <circle cx="0" cy="40" r="90" fill="url(#sh-lamp)" />
            <path d="M-52 40 L-96 320 h192 L52 40z" fill="url(#sh-cone)" />
          </g>
        </g>
      ))}

      {/* ================= стол слева (рабочая зона лавки) ================= */}
      <g transform="translate(192 567)">
        <rect x="-10" y="0" width="340" height="18" rx="5" fill="url(#g-wood)" />
        <rect x="6" y="18" width="20" height="150" fill="#57432c" />
        <rect x="294" y="18" width="20" height="150" fill="#57432c" />
        <rect x="6" y="110" width="308" height="10" fill="#57432c" opacity=".8" />
        {/* самовар-декор и стопка книг */}
        <g transform="translate(60 -4)">
          <rect x="-30" y="-16" width="60" height="16" rx="3" fill="#7c3a2e" />
          <rect x="-26" y="-30" width="52" height="14" rx="3" fill="#3f4a5a" />
          <rect x="-22" y="-42" width="44" height="12" rx="3" fill="#6e7f56" />
        </g>
      </g>

      {/* ================= ковёр (level 2+) ================= */}
      {level >= 2 && (
        <g transform="translate(760 800)">
          <ellipse rx="300" ry="62" fill="#7c2a1c" />
          <ellipse rx="252" ry="48" fill="none" stroke="#d9b23f" strokeWidth="4" opacity=".55" />
          <ellipse rx="180" ry="32" fill="none" stroke="#93392a" strokeWidth="6" opacity=".8" />
          <ellipse rx="90" ry="16" fill="#93392a" opacity=".7" />
        </g>
      )}

      {/* ================= передний план ================= */}
      <g transform="translate(0 900)">
        <path d="M-20 -70 q160 -26 300 0 v90 h-300z" fill="#241a10" />
        <path d="M-20 -70 q160 -26 300 0" stroke="#57432c" strokeWidth="4" fill="none" opacity=".7" />
        {/* гроссбух и чай */}
        <g transform="translate(120 -52) rotate(-4)">
          <rect x="-60" y="-14" width="120" height="28" rx="4" fill="#d9c9a8" />
          <path d="M0 -14 v28" stroke="#a89878" strokeWidth="2.4" />
          <path d="M-48 -5 h36 M-48 3 h28 M12 -5 h36 M12 3 h24" stroke="#8a7a5a" strokeWidth="1.8" />
        </g>
        <g transform="translate(238 -46)">
          <path d="M-14 0 h28 v18 q-14 6 -28 0z" fill="#efe3cc" />
          <path d="M14 3 q10 2 8 10 q-2 6 -8 4" stroke="#efe3cc" strokeWidth="3.4" fill="none" />
          <path d="M-6 -6 q2 -6 0 -10 M4 -6 q2 -6 0 -10" stroke="#c8b898" strokeWidth="2" fill="none" className="steam" />
        </g>
      </g>
      {/* растение-силуэт справа снизу */}
      <g transform="translate(1560 900)" opacity=".95">
        <path d="M-30 0 q-6 -60 10 -96 q26 20 26 96z" fill="#2c3524" />
        <path d="M-16 -60 q-34 -18 -40 -52 q30 2 44 34z" fill="#37422c" />
        <path d="M0 -80 q30 -22 34 -54 q-28 4 -40 36z" fill="#37422c" />
        <path d="M-34 0 h68 l-8 26 h-52z" fill="#5a2820" />
      </g>

      <rect width="1600" height="900" fill="url(#g-roomwarm)" pointerEvents="none" />
    </svg>
  );
}

function WinSil({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 60 104" width="60" height="104" className="passer2" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <g className="p-bob" opacity=".55">
        <g className="p-legA" style={{ transformOrigin: '30px 62px' }}><path d="M30 62 q-1 16 -2 26 l-1 9" stroke="#5c4f38" strokeWidth="7" fill="none" strokeLinecap="round" /></g>
        <g className="p-legB" style={{ transformOrigin: '30px 62px' }}><path d="M30 62 q1 16 2 26 l1 9" stroke="#4a4030" strokeWidth="7" fill="none" strokeLinecap="round" /></g>
        <path d="M22 34 Q30 29 38 34 L41 66 L19 66 Z" fill="#6e5f42" />
        <g className="p-armA" style={{ transformOrigin: '24px 38px' }}><path d="M24 38 q-2 12 -1 20" stroke="#6e5f42" strokeWidth="6" fill="none" strokeLinecap="round" /></g>
        <g className="p-armB" style={{ transformOrigin: '36px 38px' }}><path d="M36 38 q2 12 1 20" stroke="#6e5f42" strokeWidth="6" fill="none" strokeLinecap="round" /></g>
        <circle cx="30" cy="22" r="9.6" fill="#8a7a5a" />
        <path d="M20 20 q10 -8 20 0 q-4 -8 -10 -8 q-6 0 -10 8z" fill="#5c4f38" />
      </g>
    </svg>
  );
}
