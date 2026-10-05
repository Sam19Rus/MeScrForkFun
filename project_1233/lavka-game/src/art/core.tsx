/* core.tsx — фундамент визуальной системы «Лавки»: палитра, общие градиенты/материалы,
   светильники, иконки. Единый язык: тёплый ретро-интерьер, мягкий свет слева-сверху,
   формы лепятся тоном (без жирных контуров), материалы различимы (дерево/металл/стекло/ткань).
   Все градиенты монтируются ОДИН раз (ArtGlobalDefs) и доступны любому inline-SVG документа. */
import React from 'react';

/* ================= ПАЗЛИТРА ================= */
export const PAL = {
  ink: '#241a12', ink2: '#1a120b', bark: '#3a2c1d', bark2: '#4a3620', bark3: '#57432c',
  woodL: '#c8a97e', woodM: '#a67c52', woodD: '#6e4f33', woodDD: '#5a4632',
  paper: '#efe3cc', paper2: '#e3d3b3', paper3: '#cbb896',
  brassL: '#f2d788', brass: '#d9b23f', brassD: '#8a6c1e',
  oxblood: '#5a1c12', oxblood2: '#7c2a1c', oxblood3: '#93392a',
  teal: '#4f6a6a', tealD: '#33484a', tealL: '#87a5a2',
  sage: '#6e7f56', sageD: '#4f6a3f', sageL: '#93a878',
  skin1: '#e8c9a8', skin2: '#f0d5b8', skin3: '#dcb08c', skin4: '#f2dcc4',
  warm: '#ffe9a3', warm2: '#ffd97a',
  rust: '#8a4a24', rustL: '#a85c2c',
  steel: '#9a948a', steelL: '#c9c4b8', steelD: '#5d584c',
  glass: '#cfe0e0', glassD: '#9ab8b8',
  red: '#b5533c', green: '#7a9a5a', blue: '#5a7a9a',
} as const;

/* ================= ГЛОБАЛЬНЫЕ DEFS ================= */
export function ArtGlobalDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        {/* дерево: тёплая доска с вертикальным градиентом */}
        <linearGradient id="g-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8a97e" /><stop offset=".45" stopColor="#a67c52" /><stop offset="1" stopColor="#6e4f33" />
        </linearGradient>
        <linearGradient id="g-wood-d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a67c52" /><stop offset=".5" stopColor="#6e4f33" /><stop offset="1" stopColor="#4a3620" />
        </linearGradient>
        <linearGradient id="g-wood-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c8a97e" /><stop offset=".5" stopColor="#a67c52" /><stop offset="1" stopColor="#7c5a3a" />
        </linearGradient>
        {/* латунь / золото */}
        <linearGradient id="g-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2d788" /><stop offset=".4" stopColor="#d9b23f" /><stop offset=".75" stopColor="#a8842a" /><stop offset="1" stopColor="#8a6c1e" />
        </linearGradient>
        <linearGradient id="g-brass-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6c1e" /><stop offset=".3" stopColor="#f2d788" /><stop offset=".55" stopColor="#d9b23f" /><stop offset="1" stopColor="#8a6c1e" />
        </linearGradient>
        {/* металл стальной */}
        <linearGradient id="g-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8d4c8" /><stop offset=".35" stopColor="#a8a298" /><stop offset=".7" stopColor="#7a7568" /><stop offset="1" stopColor="#5d584c" />
        </linearGradient>
        <linearGradient id="g-steel-d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d887c" /><stop offset=".5" stopColor="#5d584c" /><stop offset="1" stopColor="#3a3630" />
        </linearGradient>
        {/* стекло */}
        <linearGradient id="g-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e8f4f4" stopOpacity=".95" /><stop offset=".5" stopColor="#b8d0d0" stopOpacity=".8" /><stop offset="1" stopColor="#8fb0b0" stopOpacity=".9" />
        </linearGradient>
        {/* ткань / бумага */}
        <linearGradient id="g-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4ead4" /><stop offset="1" stopColor="#d9c9a8" />
        </linearGradient>
        <linearGradient id="g-oxblood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93392a" /><stop offset=".5" stopColor="#6e2418" /><stop offset="1" stopColor="#4a1610" />
        </linearGradient>
        {/* небо города */}
        <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb4c8" /><stop offset=".55" stopColor="#d8c8a8" /><stop offset="1" stopColor="#f0d8b0" />
        </linearGradient>
        <linearGradient id="g-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4a5a" /><stop offset=".6" stopColor="#7a6a5a" /><stop offset="1" stopColor="#c8a878" />
        </linearGradient>
        {/* свет лампы (конус) */}
        <radialGradient id="g-lampglow" cx=".5" cy=".42" r=".62">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".5" /><stop offset=".55" stopColor="#ffd97a" stopOpacity=".16" /><stop offset="1" stopColor="#ffd97a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".34" /><stop offset="1" stopColor="#ffe9a3" stopOpacity="0" />
        </linearGradient>
        {/* виньетка тепла комнаты */}
        <radialGradient id="g-roomwarm" cx=".5" cy=".38" r=".85">
          <stop offset="0" stopColor="#ffdf9e" stopOpacity=".14" /><stop offset=".6" stopColor="#ffdf9e" stopOpacity=".04" /><stop offset="1" stopColor="#000" stopOpacity=".28" />
        </radialGradient>
        {/* кирпич */}
        <pattern id="p-brick" width="56" height="32" patternUnits="userSpaceOnUse">
          <rect width="56" height="32" fill="#6e4a38" />
          <path d="M0 0h56M0 16h56M0 32h56" stroke="#5a3a2c" strokeWidth="2.4" />
          <path d="M14 0v16M42 16v16" stroke="#5a3a2c" strokeWidth="2.4" />
          <rect x="2" y="3" width="10" height="11" fill="#7a5240" opacity=".5" />
          <rect x="30" y="19" width="10" height="11" fill="#664434" opacity=".5" />
        </pattern>
        {/* доски пола */}
        <pattern id="p-floor" width="120" height="26" patternUnits="userSpaceOnUse">
          <rect width="120" height="26" fill="#8a6a48" />
          <path d="M0 0h120M0 13h120" stroke="#6e4f33" strokeWidth="2" />
          <path d="M30 0v13M90 13v13" stroke="#6e4f33" strokeWidth="2" />
          <rect x="0" y="2" width="120" height="3" fill="#a67c52" opacity=".35" />
        </pattern>
        <pattern id="p-floor-d" width="120" height="26" patternUnits="userSpaceOnUse">
          <rect width="120" height="26" fill="#5d4630" />
          <path d="M0 0h120M0 13h120" stroke="#4a3620" strokeWidth="2" />
          <path d="M30 0v13M90 13v13" stroke="#4a3620" strokeWidth="2" />
          <rect x="0" y="2" width="120" height="3" fill="#7c5a3a" opacity=".3" />
        </pattern>
        {/* обои в полоску (лавка) */}
        <pattern id="p-wallpaper" width="36" height="36" patternUnits="userSpaceOnUse">
          <rect width="36" height="36" fill="#7a5f42" />
          <rect x="0" width="12" height="36" fill="#86684a" />
          <rect x="24" width="4" height="36" fill="#6e5438" />
        </pattern>
        {/* плитка тротуара */}
        <pattern id="p-pave" width="46" height="22" patternUnits="userSpaceOnUse">
          <rect width="46" height="22" fill="#b0a288" />
          <path d="M0 0h46M0 11h46M12 0v11M34 11v11" stroke="#9a8c72" strokeWidth="2" />
        </pattern>
        <filter id="f-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id="f-soft2" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
    </svg>
  );
}

/* ================= ХЕЛПЕРЫ ФОРМ ================= */
/** мягкая контактная тень под объектом */
export const GroundShadow = ({ cx, cy, rx, ry, o = 0.35 }: { cx: number; cy: number; rx: number; ry: number; o?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#140d07" opacity={o} filter="url(#f-soft)" />
);

/** блик слева-сверху (ключевой свет) */
export const KeyLight = ({ d, o = 0.28 }: { d: string; o?: number }) => (
  <path d={d} fill="#fff4d0" opacity={o} />
);

/* ================= ИКОНКИ (вместо emoji) ================= */
type IconName =
  | 'coin' | 'hammer' | 'box' | 'wrench' | 'cloth' | 'gear' | 'star' | 'lock' | 'book'
  | 'door' | 'lens' | 'cart' | 'tag' | 'home' | 'spark' | 'note' | 'bag' | 'arrowL' | 'arrowR'
  | 'eye' | 'film' | 'check' | 'cross' | 'bulb' | 'key' | 'clock' | 'cup' | 'knob' | 'belt' | 'pendulum';

export function Icon({ n, s = 16, c = 'currentColor' }: { n: IconName; s?: number; c?: string }) {
  const P = (d: string, extra?: React.SVGProps<SVGPathElement>) => <path d={d} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...extra} />;
  const body = (() => {
    switch (n) {
      case 'coin': return <><circle cx="12" cy="12" r="9" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.6" /><circle cx="12" cy="12" r="5.4" fill="none" stroke="#8a6c1e" strokeWidth="1.2" opacity=".7" /><path d="M9.6 12h4.8M12 9.6v4.8" stroke="#8a6c1e" strokeWidth="1.4" /></>;
      case 'hammer': return <>{P('M13.5 10.5 5 19')}<rect x="12" y="4" width="9" height="6.4" rx="2" fill="url(#g-wood)" stroke="#4a3620" strokeWidth="1.4" transform="rotate(-8 16 7)" /><path d="M12.6 10.2l2.6 2.6" stroke="#4a3620" strokeWidth="2.4" /></>;
      case 'box': return <>{P('M3.5 8.5 12 4.5l8.5 4v7L12 19.5l-8.5-4z')}<path d="M3.5 8.5 12 12.5l8.5-4M12 12.5v7" stroke={c} strokeWidth="1.6" /></>;
      case 'wrench': return P('M20 6.5a4.6 4.6 0 0 1-6.2 5.6L7 19a2.2 2.2 0 0 1-3.1-3.1l6.9-6.8A4.6 4.6 0 0 1 16.4 3l-2.6 2.6.7 2.8 2.8.7z');
      case 'cloth': return <>{P('M4 8q4-3 8 0t8 0')}<path d="M4 8v8q4 3 8 0t8 0V8" stroke={c} strokeWidth="2" fill="none" strokeLinejoin="round" /><path d="M8 10.5v6M14 10.5v6" stroke={c} strokeWidth="1.4" opacity=".6" /></>;
      case 'gear': return <><circle cx="12" cy="12" r="3.4" fill="none" stroke={c} strokeWidth="2" />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <rect key={a} x="10.9" y="2.6" width="2.2" height="4" rx="1" fill={c} transform={`rotate(${a} 12 12)`} />)}</>;
      case 'star': return <path d="M12 3.6l2.5 5.2 5.7.7-4.2 3.9 1.1 5.6-5.1-2.8-5.1 2.8 1.1-5.6-4.2-3.9 5.7-.7z" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.2" strokeLinejoin="round" />;
      case 'lock': return <><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.4" />{P('M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5')}<circle cx="12" cy="15" r="1.6" fill="#5a4632" /></>;
      case 'book': return <>{P('M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z')}<path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" stroke={c} strokeWidth="2" /><path d="M8 7h8M8 10.5h6" stroke={c} strokeWidth="1.5" opacity=".7" /></>;
      case 'door': return <>{P('M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21')}<path d="M3.5 21h17" stroke={c} strokeWidth="2" /><circle cx="14.8" cy="12.4" r="1.3" fill={c} /></>;
      case 'lens': return <><circle cx="10.5" cy="10.5" r="6.2" fill="url(#g-glass)" stroke={c} strokeWidth="2.2" />{P('M15.2 15.2 20.5 20.5')}<path d="M7.6 8.4a4 4 0 0 1 3-1.6" stroke="#fff" strokeWidth="1.6" opacity=".8" /></>;
      case 'cart': return <>{P('M3.5 4.5h2.4l2.6 10.6h9.2l2.3-8H7')}<circle cx="9.5" cy="19" r="1.7" fill={c} /><circle cx="16.5" cy="19" r="1.7" fill={c} /></>;
      case 'tag': return <>{P('M12.6 3.6H20v7.4L11 20a2 2 0 0 1-2.8 0l-4.6-4.6a2 2 0 0 1 0-2.8z')}<circle cx="16.2" cy="7.4" r="1.6" fill={c} /></>;
      case 'home': return <>{P('M4 11 12 4l8 7')}<path d="M6.5 9.8V20h11V9.8" stroke={c} strokeWidth="2" strokeLinejoin="round" /><path d="M10 20v-5.5h4V20" stroke={c} strokeWidth="1.8" /></>;
      case 'spark': return <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" fill={c} opacity=".9" />;
      case 'note': return <>{P('M6 3.5h9l4 4V20.5H6z')}<path d="M9 9h6M9 12.5h6M9 16h4" stroke={c} strokeWidth="1.6" /></>;
      case 'bag': return <>{P('M5 8.5h14l-1.2 11.5H6.2z')}<path d="M8.6 8.5V7a3.4 3.4 0 0 1 6.8 0v1.5" stroke={c} strokeWidth="2" /></>;
      case 'arrowL': return P('M14.5 5.5 8 12l6.5 6.5');
      case 'arrowR': return P('M9.5 5.5 16 12l-6.5 6.5');
      case 'eye': return <>{P('M2.8 12S6.5 5.8 12 5.8 21.2 12 21.2 12 17.5 18.2 12 18.2 2.8 12 2.8 12z')}<circle cx="12" cy="12" r="2.8" fill={c} /></>;
      case 'film': return <>{P('M3.5 6.5h17v11h-17z')}<path d="M7 6.5v11M17 6.5v11M3.5 10h3.5M3.5 14h3.5M17 10h3.5M17 14h3.5" stroke={c} strokeWidth="1.5" /><circle cx="12" cy="12" r="2.6" fill="none" stroke={c} strokeWidth="1.6" /></>;
      case 'check': return P('M5 12.5 10 17.5 19 7');
      case 'cross': return P('M6.5 6.5l11 11M17.5 6.5l-11 11');
      case 'bulb': return <><circle cx="12" cy="10" r="5.6" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.3" />{P('M10 17.5h4M10.6 20h2.8')}<path d="M12 7.2v3.4" stroke="#fff" strokeWidth="1.4" opacity=".8" /></>;
      case 'key': return <><circle cx="8" cy="8" r="4" fill="none" stroke={c} strokeWidth="2.2" />{P('M10.8 10.8 19.5 19.5M16 16l2.4-2.4M13.4 13.4l2-2')} </>;
      case 'clock': return <><circle cx="12" cy="12" r="8.4" fill="url(#g-paper)" stroke={c} strokeWidth="2" />{P('M12 7v5.4l3.4 2')}<path d="M12 3.6v1.4M20.4 12H19M12 20.4V19M3.6 12H5" stroke={c} strokeWidth="1.6" /></>;
      case 'knob': return <><circle cx="12" cy="12" r="7.4" fill="url(#g-bak)" stroke="#1a120b" strokeWidth="1.6" /><circle cx="12" cy="12" r="3.6" fill="#241a16" /><path d="M12 6.6v3.4" stroke="#c8b090" strokeWidth="1.8" /><circle cx="9.6" cy="9.6" r="1.2" fill="#fff" opacity=".5" /></>;
      case 'belt': return <><circle cx="12" cy="12" r="7.6" fill="none" stroke="#3a2c1d" strokeWidth="3.4" /><circle cx="12" cy="12" r="7.6" fill="none" stroke="#5c452c" strokeWidth="1.4" /></>;
      case 'pendulum': return <>{P('M12 3.5v9')}<circle cx="12" cy="16.4" r="4.6" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.4" /><path d="M10 15 q2 -1.6 4 0" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".6" /></>;
      case 'cup': return <>{P('M5 8h11v6.5a4.5 4.5 0 0 1-4.5 4.5H9.5A4.5 4.5 0 0 1 5 14.5z')}<path d="M16 9.5h2.2a2.6 2.6 0 0 1 0 5.2H16" stroke={c} strokeWidth="1.8" /><path d="M8.4 5.4c0-1.2 1-1.4 1-2.4M12 5.4c0-1.2 1-1.4 1-2.4" stroke={c} strokeWidth="1.5" opacity=".7" /></>;
    }
  })();
  return <svg viewBox="0 0 24 24" width={s} height={s} style={{ flex: '0 0 auto', display: 'inline-block', verticalAlign: '-2px' }} aria-hidden>{body}</svg>;
}

/* дополнительные материалы (дописано для предметного арта) */
export function ArtMaterialDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        <linearGradient id="g-bak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a463c" /><stop offset=".35" stopColor="#3a2c26" /><stop offset="1" stopColor="#241a16" />
        </linearGradient>
        <linearGradient id="g-enamel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6f0e0" /><stop offset=".6" stopColor="#e0d6be" /><stop offset="1" stopColor="#bdb298" />
        </linearGradient>
        <linearGradient id="g-velvet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c3a2e" /><stop offset=".5" stopColor="#5a2820" /><stop offset="1" stopColor="#3f1c16" />
        </linearGradient>
        <linearGradient id="g-leather" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e5238" /><stop offset=".5" stopColor="#4f3a26" /><stop offset="1" stopColor="#38291a" />
        </linearGradient>
        <linearGradient id="g-felt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a948a" /><stop offset="1" stopColor="#6e6a60" />
        </linearGradient>
        <linearGradient id="g-copper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d89868" /><stop offset=".5" stopColor="#b06a3a" /><stop offset="1" stopColor="#7c4a24" />
        </linearGradient>
        <radialGradient id="g-dialface" cx=".42" cy=".38" r=".8">
          <stop offset="0" stopColor="#f6f0e0" /><stop offset=".8" stopColor="#e3d9c0" /><stop offset="1" stopColor="#c8bc9e" />
        </radialGradient>
        <linearGradient id="g-blacklac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4a4e" /><stop offset=".3" stopColor="#26262a" /><stop offset="1" stopColor="#141416" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* иконка запчасти в едином стиле */
export function PartIcon({ p, s = 14 }: { p: string; s?: number }) {
  const m: Record<string, IconName> = {
    universal: 'wrench', electronic: 'bulb', mechanical: 'gear', polish: 'cloth',
    knob: 'knob', belt: 'belt', pendulum: 'pendulum', lens: 'lens',
  };
  return <Icon n={m[p] || 'gear'} s={s} />;
}
