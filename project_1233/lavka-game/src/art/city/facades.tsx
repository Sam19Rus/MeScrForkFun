/* facades.tsx — фасады зданий в локальных координатах стены:
   X: 0..w·FS слева направо, Y: 0..h·FS от карниза вниз до земли (Y=h·FS — цоколь/земля).
   Контент отображается на перспективную стену полосами (см. blocks.tsx),
   поэтому здесь можно рисовать «как раньше» — плоско, но с честным светом. */
import React from 'react';
import { Win, Door, SignBoard, WinV } from './kit';
import { ClosedSign } from './blocks';

const F = 'Georgia, serif';

/* ================= ЛАВКА (герой) — 260×180 (w26 h18) ================= */
export function shopF(locked: boolean) {
  return <g>
    {/* второй этаж */}
    <Win x={34} y={16} w={26} h={34} v={locked ? 'shut' : 'curtain'} frame="#5a4632" />
    <Win x={104} y={16} w={26} h={34} v={locked ? 'shut' : 'lit'} frame="#5a4632" />
    <Win x={174} y={16} w={26} h={34} v={locked ? 'shut' : 'flower'} frame="#5a4632" />
    <rect x={0} y={56} width={260} height={6} fill="#8a6a48" />
    <rect x={0} y={62} width={260} height={3} fill="rgba(30,18,8,.25)" />
    {/* вывеска */}
    <SignBoard x={72} y={80} w={112} h={26} text="ЛАВКА" fs={15} />
    {/* витрина */}
    <rect x={16} y={94} width={118} height={70} rx={4} fill="#2c3542" />
    <rect x={21} y={99} width={108} height={60} rx={3} fill={locked ? '#39485a' : '#54402a'} />
    {!locked && <rect x={21} y={99} width={108} height={60} rx={3} fill="url(#c-winglow)" opacity=".5" />}
    {!locked && <>
      <g transform="translate(46 126)"><circle r={10} fill="#d9b23f" /><circle r={7} fill="#efe3cc" />
        <path d="M0 0 v-4.6 M0 0 l3 2" stroke="#5a4632" strokeWidth="1.4" /></g>
      <g transform="translate(80 128)"><path d="M-7 7 q-3 -11 7 -13 q10 2 7 13z" fill="#b08968" /></g>
      <g transform="translate(108 130)"><rect x="-7" y="-6" width="15" height="12" rx="3" fill="#4f6a6a" /><circle cx="0" cy="-1.4" r="3.2" fill="#cfe0e0" /></g>
      <path d="M21 142 h108" stroke="#5a4632" strokeWidth="2.6" />
    </>}
    {locked && <path d="M21 99 l108 60 M129 99 l-108 60" stroke="#a08054" strokeWidth="6" strokeLinecap="round" />}
    {/* подоконная планка + кот */}
    <rect x={14} y={160} width={122} height={6} fill="#6e4f33" />
    {!locked && <g transform="translate(104 158)">
      <ellipse rx={9} ry={5} fill="#5d584c" /><circle cx="-7" cy="-3.6" r="4.2" fill="#5d584c" />
      <path d="M-10 -6.4 l-1.4 -4 3.4 2 M-4.6 -7 l.8 -4 2.8 3.2" fill="#5d584c" />
      <path d="M8 -1.4 q6.4 0 4.8 5.6" stroke="#5d584c" strokeWidth="2.8" fill="none" strokeLinecap="round" className="cat-tail" />
    </g>}
    {/* навес */}
    <path d="M8 90 h134 l6 16 h-146z" fill={locked ? '#7a6a5a' : '#b5533c'} />
    {Array.from({ length: 8 }).map((_, i) => i % 2 ? null : <polygon key={i}
      points={`${8 + i * 16.75},90 ${8 + i * 16.75 + 8.4},90 ${8 + i * 16.75 + 6.2},106 ${8 + i * 16.75 - 2.2},106`} fill="#efe3cc" opacity=".92" />)}
    <path d="M2 106 h146" stroke="#7c3a2a" strokeWidth="3.2" />
    {/* дверь */}
    <Door x={170} y={180} w={42} h={86} col="#6e4630" open={!locked} boarded={locked} />
    <rect x={160} y={172} width={62} height={8} rx={3} fill="#8a7a5a" />
    <rect x={156} y={177} width={70} height={6} rx={2} fill="#7c6a4c" />
    <rect x={163} y={166} width={56} height={7} rx={3} fill="#7c2a1c" opacity=".85" />
    {/* качающийся самовар */}
    <g className="swing-sign" style={{ transformOrigin: '243px 42px' }}>
      <path d="M243 42 v8" stroke="#3a2c1d" strokeWidth="3" />
      <rect x={226} y={50} width={34} height={31} rx={4} fill="#2c2117" stroke="#d9b23f" strokeWidth="1.8" />
      <g transform="translate(243 66)">
        <path d="M-6 -8 q-3 6.4 -1.4 11 q1.4 4.6 7.4 4.6 q6 0 7.4 -4.6 q1.6 -4.6 -1.4 -11z" fill="#d9b23f" />
        <path d="M-7.4 -4.4 q-4.6 1.4 -3.8 6.2 M7.4 -4.4 q4.6 1.4 3.8 6.2" stroke="#d9b23f" strokeWidth="2" fill="none" />
      </g>
    </g>
    <path d="M243 42 h14" stroke="#3a2c1d" strokeWidth="3" />
    {/* доска объявлений */}
    <g transform="translate(236 128)"><rect x={-10} y={-18} width={21} height={30} rx={2} fill="#6e5638" />
      <rect x={-7.6} y={-14.4} width={16} height={10} fill="#e3d3b3" transform="rotate(-2)" />
      <rect x={-7.6} y={-1.6} width={16} height={9} fill="#d8c8a8" transform="rotate(1.6)" /></g>
    {/* цоколь */}
    <rect x={0} y={170} width={260} height={10} fill="#5a4632" opacity=".55" />
    {locked && <g transform="translate(130 180)"><ClosedSign /></g>}
  </g>;
}

/* ================= СКЛАД / АУКЦИОН — 300×210 (w30 h21) ================= */
export function warehouseF(locked: boolean) {
  return <g>
    {/* верхний ряд продухов */}
    {[36, 92, 148, 204, 252].map((x, i) => <Win key={x} x={x - 9} y={24} w={18} h={15} v={locked ? 'dark' : i % 2 ? 'lit' : 'dark'} frame="#3a2418" />)}
    <SignBoard x={150} y={62} w={180} h={26} text="АУКЦИОН · СКЛАД" fs={12.5} />
    {/* арочные окна */}
    <Win x={26} y={96} w={30} h={44} v={locked ? 'shut' : 'lit'} frame="#3a2418" arc />
    <Win x={244} y={96} w={30} h={44} v={locked ? 'shut' : 'lit'} frame="#3a2418" arc />
    {/* арочные ворота */}
    <path d="M102 210 v-64 a48 42 0 0 1 96 0 v64z" fill="#4a3620" />
    <path d="M102 210 v-64 a48 42 0 0 1 96 0 v64" fill="none" stroke="#33261a" strokeWidth="4" />
    <path d="M108 210 v-62 a42 37 0 0 1 84 0 v62z" fill={locked ? '#33261a' : '#5a4228'} />
    <path d="M108 160 l84 46 M192 160 l-84 46" stroke="#6e4f33" strokeWidth="6" />
    <path d="M150 122 v88" stroke="#33261a" strokeWidth="4" />
    {locked && <path d="M100 158 h100 M100 190 h100" stroke="#a08054" strokeWidth="9" strokeLinecap="round" />}
    {/* фонари у ворот */}
    {[[86, 128], [214, 128]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <path d="M0 -10 v10" stroke="#2c2117" strokeWidth="2.6" />
      <circle r="5" fill={locked ? '#8a8a7a' : '#ffe9a3'} stroke="#2c2117" strokeWidth="1.6" />
      {!locked && <circle r="12" fill="url(#c-lamp)" opacity=".7" />}
    </g>)}
    {/* афиша сегодняшних торгов */}
    {!locked && <g transform="translate(252 160) rotate(2)">
      <rect x={-19} y={-25} width={38} height={50} rx={3} fill="#e3d3b3" stroke="#8a6c1e" strokeWidth="2" />
      <text x={0} y={-8} textAnchor="middle" fontSize={9} fontFamily={F} fill="#5a1c12" letterSpacing="1">АУКЦИОН</text>
      <text x={0} y={5} textAnchor="middle" fontSize={7.6} fontFamily={F} fill="#3a2c1d">сегодня</text>
      <text x={0} y={15} textAnchor="middle" fontSize={7.6} fontFamily={F} fill="#3a2c1d">18:00</text>
    </g>}
    <rect x={0} y={200} width={300} height={10} fill="#33261a" opacity=".5" />
    {locked && <g transform="translate(150 210)"><ClosedSign /></g>}
  </g>;
}

/* ================= УСАДЬБА — 260×160 (w26 h16) ================= */
export function estateF(locked: boolean) {
  return <g>
    <text x={130} y={16} textAnchor="middle" fontSize={11} fontFamily={F} fill="#5a4632" letterSpacing="3.4">УСАДЬБА</text>
    {/* антаблемент */}
    <rect x={16} y={22} width={228} height={10} fill="#c8b898" />
    <rect x={16} y={32} width={228} height={4} fill="rgba(30,18,8,.18)" />
    {/* колонны */}
    {[40, 100, 160, 220].map(cx => <g key={cx}>
      <rect x={cx - 6} y={36} width={12} height={116} rx={2.4} fill="#efe3cc" stroke="#b0a488" strokeWidth="1.4" />
      <rect x={cx - 8.4} y={34} width={16.8} height={5} rx={1.6} fill="#c8b898" />
      <rect x={cx - 8.4} y={148} width={16.8} height={6} rx={1.6} fill="#c8b898" />
      <path d={`M${cx - 3} 40 v108`} stroke="rgba(120,100,70,.35)" strokeWidth="1.4" />
    </g>)}
    {/* арочные окна */}
    {[[62, 'curtain'], [122, 'lit'], [182, 'curtain']].map(([x, v], i) =>
      <Win key={i} x={x as number} y={62} w={24} h={40} arc v={locked ? 'shut' : v as WinV} frame="#a89878" />)}
    {/* дверь */}
    <path d="M112 154 v-40 a18 18 0 0 1 36 0 v40z" fill="#2a2018" />
    <path d="M115 154 v-38 a15 15 0 0 1 30 0 v38z" fill={locked ? '#3a2c1d' : '#4a3626'} />
    {!locked && <path d="M115 154 v-38 a15 15 0 0 1 30 0 v38z" fill="url(#c-doorwarm)" opacity=".8" />}
    {locked && <path d="M110 128 l40 -8 M110 144 l40 6" stroke="#a08054" strokeWidth="6" strokeLinecap="round" />}
    <path d="M130 116 v38" stroke="#2a2018" strokeWidth="2.4" />
    {/* фонари */}
    {[[96, 100], [164, 100]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <circle r="4" fill={locked ? '#8a8a7a' : '#ffe9a3'} stroke="#8a6c1e" strokeWidth="1.4" /></g>)}
    <rect x={96} y={154} width={68} height={6} fill="#b0a488" />
    {locked && <g transform="translate(130 165)"><ClosedSign /></g>}
  </g>;
}

/* ================= ГАРАЖ — 240×130 (w24 h13) ================= */
export function garageF(locked: boolean) {
  return <g>
    <SignBoard x={120} y={22} w={118} h={22} text="ГАРАЖ" fs={12} bg="#33422e" />
    {/* широкие ворота */}
    <rect x={28} y={38} width={144} height={92} rx={3} fill="#5d6a52" stroke="#37422e" strokeWidth="3" />
    {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M30 ${52 + i * 17} h140`} stroke="#46523c" strokeWidth="2.4" />)}
    <rect x={28} y={38} width={144} height={6} fill="rgba(255,240,200,.14)" />
    <circle cx={160} cy={88} r={3.4} fill="#2c2a24" />
    {locked && <>
      <path d="M24 62 l152 -10 M24 100 l152 8" stroke="#a08054" strokeWidth="8" strokeLinecap="round" />
      <g transform="translate(100 84)"><rect x={-8} y={-4} width={16} height={13} rx={2} fill="#d9b23f" stroke="#8a6c1e" strokeWidth="1.4" />
        <path d="M-4.4 -4 v-4 a4.4 4.4 0 0 1 8.8 0 v4" stroke="#8a6c1e" strokeWidth="2.4" fill="none" /></g>
    </>}
    {/* окошко с решёткой */}
    <rect x={190} y={52} width={36} height={32} rx={2} fill="#22303a" stroke="#37422e" strokeWidth="2.6" />
    <rect x={193} y={55} width={30} height={26} fill={locked ? '#39485a' : '#5d7a88'} opacity=".8" />
    <path d="M200 55 v26 M208 55 v26 M216 55 v26" stroke="#37422e" strokeWidth="2" />
    {/* плакат */}
    <g transform="translate(204 104)"><rect x={-13} y={-9} width={26} height={20} rx={2} fill="#e3d3b3" transform="rotate(-2)" />
      <path d="M-9 -4 h18 M-9 0 h14 M-9 4 h18" stroke="#8a4a32" strokeWidth="1.8" /></g>
    <rect x={0} y={122} width={240} height={8} fill="#2c2a1e" opacity=".5" />
    {locked && <g transform="translate(120 130)"><ClosedSign /></g>}
  </g>;
}

/* ================= ЗАПЧАСТИ — 170×130 (w17 h13) ================= */
export function partsF(locked: boolean) {
  return <g>
    <SignBoard x={85} y={20} w={128} h={22} text="ЗАПЧАСТИ" fs={12.5} bg="#22303a" />
    {/* витраж с шестерёнкой */}
    <rect x={14} y={40} width={86} height={64} rx={4} fill="#22303a" />
    <rect x={18} y={44} width={78} height={56} rx={3} fill={locked ? '#39485a' : '#54402a'} />
    {!locked && <rect x={18} y={44} width={78} height={56} rx={3} fill="url(#c-winglow)" opacity=".28" />}
    <g transform="translate(57 72)" opacity={locked ? .4 : .9}>
      <circle r={13} fill="none" stroke="#d9b23f" strokeWidth="4" />
      {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={-2.4} y={-17} width={4.8} height={6} rx={1.4} fill="#d9b23f" transform={`rotate(${i * 45})`} />)}
      <circle r={4.6} fill="#d9b23f" />
    </g>
    {!locked && <><rect x={22} y={86} width={70} height={3} fill="#5a4632" />
      <rect x={26} y={78} width={9} height={8} fill="#b5533c" /><rect x={78} y={76} width={10} height={10} fill="#4f6a6a" /></>}
    {locked && <path d="M18 44 l78 56 M96 44 l-78 56" stroke="#a08054" strokeWidth="5" strokeLinecap="round" />}
    {/* дверь */}
    <Door x={112} y={130} w={36} h={66} col="#33484a" open={!locked} boarded={locked} />
    <rect x={92} y={122} width={64} height={8} fill="#22303a" opacity=".55" />
    {/* ящик с инструментом у стены */}
    <g transform="translate(150 112)"><rect x={-11} y={-14} width={22} height={14} rx={2} fill="#8a4a32" />
      <path d="M-11 -8 h22" stroke="#5a2c1c" strokeWidth="1.8" /></g>
    {locked && <g transform="translate(85 138)"><ClosedSign /></g>}
  </g>;
}

/* ================= второстепенные ================= */
export function bakeryF() {
  return <g>
    <SignBoard x={85} y={18} w={110} h={20} text="БУЛОЧНАЯ" fs={10.5} bg="#5a2c1c" />
    <Win x={18} y={44} w={26} h={30} v="lit" frame="#6e4f33" />
    <Win x={120} y={44} w={26} h={30} v="curtain" frame="#6e4f33" />
    {/* витрина с хлебом */}
    <rect x={16} y={78} width={64} height={34} rx={3} fill="#2c3542" />
    <rect x={19} y={81} width={58} height={28} rx={2} fill="#54402a" />
    <rect x={19} y={81} width={58} height={28} rx={2} fill="url(#c-winglow)" opacity=".4" />
    <ellipse cx={34} cy={100} rx={7} ry={4.4} fill="#c8862c" /><ellipse cx={50} cy={101} rx={7} ry={4} fill="#b0742a" /><ellipse cx={64} cy={100} rx={6} ry={4.2} fill="#c8862c" />
    <Door x={112} y={120} w={30} h={58} col="#6e4f33" open awning="#8a4a32" />
    {/* крендель */}
    <g transform="translate(140 52)"><path d="M-8 4 q-8 -2 -6 -10 q2 -7 8 -5 q4 1 6 5 q2 -4 6 -5 q6 -2 8 5 q2 8 -6 10 q-8 2 -16 0z" fill="none" stroke="#c8862c" strokeWidth="4" /></g>
    <rect x={0} y={112} width={170} height={8} fill="#5a4632" opacity=".45" />
  </g>;
}
export function clockmakerF() {
  return <g>
    {/* часы-вывеска */}
    <g transform="translate(70 30)"><circle r={15} fill="#efe3cc" stroke="#3a2c1d" strokeWidth="2.6" />
      <path d="M0 0 v-8.6 M0 0 l5.6 3.4" stroke="#3a2c1d" strokeWidth="2" />
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={12 * Math.sin(i * Math.PI / 6)} cy={-12 * Math.cos(i * Math.PI / 6)} r=".9" fill="#5a4632" />)}</g>
    <Win x={20} y={56} w={22} h={26} v="lit" frame="#4a3620" />
    <Win x={98} y={56} w={22} h={26} v="dark" frame="#4a3620" />
    <Door x={70} y={130} w={26} h={52} col="#4a3620" open />
    <g transform="translate(116 104)"><circle r={7} fill="#d8c8a8" stroke="#3a2c1d" strokeWidth="1.8" /><path d="M0 0 v-4 M0 0 l2.6 1.6" stroke="#3a2c1d" strokeWidth="1.4" /></g>
    <rect x={0} y={122} width={140} height={8} fill="#37422e" opacity=".5" />
  </g>;
}
export function closedF() {
  return <g>
    <Win x={22} y={40} w={30} h={34} v="shut" frame="#57504a" />
    <Win x={94} y={40} w={30} h={34} v="shut" frame="#57504a" />
    <SignBoard x={73} y={20} w={92} h={18} text="· · · · ·" fs={11} bg="#4a4238" fg="#8a8072" />
    <Door x={73} y={110} w={26} h={52} col="#57504a" boarded />
    <g transform="translate(118 76) rotate(-4)"><rect x={-9} y={-12} width={18} height={24} fill="#d8c8a8" opacity=".8" />
      <path d="M-6 -7 h12 M-6 -2 h10 M-6 3 h12" stroke="#8a6c52" strokeWidth="1.6" /></g>
    <rect x={0} y={102} width={150} height={8} fill="#3a3630" opacity=".5" />
  </g>;
}
export function cafeF() {
  return <g>
    <SignBoard x={80} y={18} w={78} h={20} text="КАФЕ" fs={11.5} bg="#5a2c1c" />
    <rect x={14} y={44} width={92} height={52} rx={3} fill="#2c3542" />
    <rect x={18} y={48} width={84} height={44} rx={2} fill="#54402a" />
    <rect x={18} y={48} width={84} height={44} rx={2} fill="url(#c-winglow)" opacity=".45" />
    <path d="M60 48 v44" stroke="#2c3542" strokeWidth="3" />
    <g transform="translate(38 74)"><path d="M-5 0 a5 5 0 0 0 10 0z" fill="#efe3cc" /><path d="M0 0 v-8" stroke="#c8b898" strokeWidth="1.6" /></g>
    {/* навес */}
    <path d="M8 40 h104 l5 12 h-114z" fill="#8a4a32" />
    {Array.from({ length: 7 }).map((_, i) => i % 2 ? null : <polygon key={i} points={`${8 + i * 14.8},40 ${8 + i * 14.8 + 7.4},40 ${8 + i * 14.8 + 5.6},52 ${8 + i * 14.8 - 1.8},52`} fill="#efe3cc" opacity=".9" />)}
    <Door x={132} y={120} w={28} h={54} col="#5a4632" open />
    <rect x={0} y={112} width={160} height={8} fill="#5a4632" opacity=".45" />
  </g>;
}
/* башня с часами — 90×380 (w9 h38) */
export function towerF() {
  return <g>
    <rect x={10} y={330} width={70} height={50} fill="#9a8468" opacity=".5" />
    <Win x={34} y={300} w={22} h={34} v="dark" frame="#5a4632" arc />
    <Win x={34} y={226} w={22} h={34} v="dark" frame="#5a4632" arc />
    <path d="M8 190 h74 v8 h-74z M8 120 h74 v8 h-74z" fill="#8a7858" />
    {/* циферблат */}
    <g transform="translate(45 74)">
      <circle r={27} fill="#efe3cc" stroke="#5a4632" strokeWidth="4" />
      <circle r={22.4} fill="none" stroke="#c8b898" strokeWidth="1.4" />
      <path d="M0 0 v-14 M0 0 l9.6 6" stroke="#3a2c1d" strokeWidth="3" strokeLinecap="round" />
      {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={19.6 * Math.sin(i * Math.PI / 6)} cy={-19.6 * Math.cos(i * Math.PI / 6)} r={1.5} fill="#5a4632" />)}
    </g>
    <rect x={36} y={128} width={18} height={30} rx={8} fill="#5d5240" />
    <rect x={36} y={238} width={18} height={30} rx={8} fill="#5d5240" />
  </g>;
}
/* универсальный сеточный фасад (жилые/дальние дома) */
export function gridF(W: number, H: number, opt: { rows: number; cols: number; vs?: WinV[]; door?: boolean; frame?: string; shopfront?: boolean }) {
  {
    const { rows, cols, vs = ['curtain', 'lit', 'dark', 'flower'], frame = '#5d5240', door = true, shopfront = false } = opt;
    const top = H * (shopfront ? 0.42 : 0.1), bot = H * (door ? 0.62 : 0.86);
    const cellH = (bot - top) / rows;
    const nodes: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const ww = Math.min(30, W / cols * 0.44), hh = Math.min(34, cellH * 0.56);
      nodes.push(<Win key={`${r}${c}`} x={(c + 0.5) * (W / cols) - ww / 2} y={top + r * cellH + cellH * 0.22}
        w={ww} h={hh} v={vs[(r * cols + c) % vs.length]} frame={frame} />);
    }
    return <g>
      {nodes}
      {shopfront && <g>
        <rect x={W * 0.08} y={H * 0.5} width={W * 0.5} height={H * 0.34} rx={3} fill="#2c3542" />
        <rect x={W * 0.1} y={H * 0.53} width={W * 0.46} height={H * 0.28} rx={2} fill="#54402a" />
        <rect x={W * 0.1} y={H * 0.53} width={W * 0.46} height={H * 0.28} rx={2} fill="url(#c-winglow)" opacity=".35" />
      </g>}
      {door && <Door x={W * (shopfront ? 0.78 : 0.5)} y={H} w={Math.min(30, W * 0.16)} h={H * 0.3} col="#5a4632" />}
      <rect x={0} y={H - 7} width={W} height={7} fill="rgba(30,18,8,.28)" />
    </g>;
  };
}
