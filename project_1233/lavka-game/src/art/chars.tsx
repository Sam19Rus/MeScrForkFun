/* chars.tsx — НОВАЯ система персонажей «Лавки».
   Стиль: иллюстрированная стилизация, пропорции ~1:5, формы лепятся тоном (ключевой свет
   слева-сверху, тень справа), силуэты уникальны: Аркадий — котелок и трость, Зинаида —
   платок и сумочка, Пётр — кепка и фартук часовщика, Нина — пучок и шаль.
   Эмоции = лицо (брови/глаза/рот) + поза (наклон корпуса, головы) + жест (плечо/локоть) +
   реквизит (табличка ставки, трость, сумочка). Переходы — CSS transform на суставах. */
import React from 'react';
import { NPCS } from '../game/data/world';
import type { NpcEmotion, NpcId } from '../game/types';

/* ---------------- таблица поз ---------------- */
interface Pose {
  shL: number; elL: number; shR: number; elR: number;
  head: number; lean: number; mouth: Mouth; brows: Brows; eyes: Eyes;
}
type Mouth = 'flat' | 'smile' | 'big' | 'shout' | 'down' | 'smirk' | 'open';
type Brows = 'flat' | 'up' | 'down' | 'sad';
type Eyes = 'open' | 'narrow' | 'closed' | 'happy' | 'half';

const POSE: Record<NpcEmotion, Pose> = {
  idle:  { shL: 10, elL: 8,   shR: -10, elR: -8,  head: 0,  lean: 0,  mouth: 'flat',  brows: 'flat', eyes: 'open' },
  think: { shL: 12, elL: 14,  shR: -34, elR: -96, head: 7,  lean: 2,  mouth: 'flat',  brows: 'sad',  eyes: 'narrow' },
  bid:   { shL: 12, elL: 10,  shR: -168, elR: -14, head: -3, lean: -3, mouth: 'open',  brows: 'up',   eyes: 'open' },
  lead:  { shL: 16, elL: 22,  shR: -28, elR: -104, head: -6, lean: -2, mouth: 'smirk', brows: 'flat', eyes: 'narrow' },
  pass:  { shL: 12, elL: 12,  shR: -96, elR: -28, head: 12, lean: 3,  mouth: 'flat',  brows: 'sad',  eyes: 'closed' },
  angry: { shL: 16, elL: 42,  shR: -20, elR: -52, head: -5, lean: -5, mouth: 'shout', brows: 'down', eyes: 'narrow' },
  happy: { shL: -138, elL: -18, shR: 138, elR: 18, head: -3, lean: -2, mouth: 'big',   brows: 'up',   eyes: 'happy' },
  sad:   { shL: 6,  elL: 10,  shR: -6,  elR: -10, head: 13, lean: 4,  mouth: 'down',  brows: 'sad',  eyes: 'half' },
};

/* реквизит в правой/левой кисти по эмоции */
function handProp(id: NpcId, emo: NpcEmotion, hand: 'L' | 'R') {
  if (hand === 'R' && emo === 'bid')
    return <g><rect x="-6" y="-4" width="12" height="17" rx="2.5" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1.4" /><text x="0" y="8.5" fontSize="9" textAnchor="middle" fill="#4a3610" fontWeight="bold" fontFamily="Georgia">+</text></g>;
  if (hand === 'L' && id === 'arkady' && (emo === 'idle' || emo === 'sad' || emo === 'pass' || emo === 'think'))
    return <g><path d="M0 4 V46" stroke="#5a4632" strokeWidth="3.4" strokeLinecap="round" /><circle cx="0" cy="4" r="3.6" fill="url(#g-brass)" /></g>;
  if (hand === 'L' && id === 'zinaida' && emo !== 'happy' && emo !== 'bid')
    return <g><path d="M0 6 v6" stroke="#4a3620" strokeWidth="2" /><path d="M-8 12 q8 -6 16 0 l2 14 q-10 4 -20 0 z" fill="#6e4f33" stroke="#4a3620" strokeWidth="1.6" /><path d="M-8 12 h18" stroke="#4a3620" strokeWidth="1.4" /></g>;
  if (hand === 'L' && id === 'nina' && (emo === 'idle' || emo === 'think'))
    return <g><path d="M0 5 v5" stroke="#5d4f6e" strokeWidth="2" /><path d="M-7 10 q7 -5 14 0 l1.5 11 q-8.5 3.5 -17 0 z" fill="#7a6a8f" stroke="#5d4f6e" strokeWidth="1.5" /><circle cx="0" cy="15" r="1.6" fill="#d9b23f" /></g>;
  if (hand === 'R' && id === 'petr' && emo === 'think')
    return <g><circle cx="0" cy="-2" r="7" fill="url(#g-glass)" stroke="url(#g-brass)" strokeWidth="2.4" /><path d="M0 5 v6" stroke="#8a6c1e" strokeWidth="2" /></g>;
  return null;
}

/* ---------------- лицо ---------------- */
function FaceParts({ p, id }: { p: Pose; id: NpcId | string }) {
  const ink = '#3a2c1d';
  const brow = (() => {
    switch (p.brows) {
      case 'up': return <g stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none"><path d="M-11 -9 q4 -3.5 8 -2" /><path d="M3 -11 q4 -1.5 8 2" /></g>;
      case 'down': return <g stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none"><path d="M-11 -10 l8 4" /><path d="M11 -10 l-8 4" /></g>;
      case 'sad': return <g stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none"><path d="M-11 -6 l8 -3" /><path d="M11 -6 l-8 -3" /></g>;
      default: return <g stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none"><path d="M-11 -8 q4 -1.6 8 -0.6" /><path d="M3 -8.6 q4 -1 8 0.6" /></g>;
    }
  })();
  const eye = (cx: number) => {
    switch (p.eyes) {
      case 'closed': return <path d={`M${cx - 4} -1 q4 3 8 0`} stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 'happy': return <path d={`M${cx - 4} 0 q4 -4 8 0`} stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      case 'narrow': return <g><path d={`M${cx - 4} -1.4 h8`} stroke={ink} strokeWidth="2.4" strokeLinecap="round" /><circle cx={cx + 0.6} cy="0.4" r="1.7" fill={ink} /></g>;
      case 'half': return <g><ellipse cx={cx} cy="0" rx="3.7" ry="2" fill="#fff" opacity=".9" /><circle cx={cx + 0.4} cy="0.6" r="1.8" fill={ink} /><path d={`M${cx - 4} -1.6 q4 -2 8 0`} stroke={ink} strokeWidth="1.6" fill="none" /></g>;
      default: return <g><ellipse cx={cx} cy="-0.5" rx="3.9" ry="3" fill="#fff" opacity=".95" /><circle cx={cx + 0.5} cy="-0.2" r="2" fill={ink} /><circle cx={cx - 0.4} cy="-1.2" r="0.7" fill="#fff" /></g>;
    }
  };
  const mouth = (() => {
    switch (p.mouth) {
      case 'smile': return <path d="M-6 9 q6 5 12 0" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      case 'big': return <g><path d="M-7 8 q7 9 14 0 z" fill="#6e2418" /><path d="M-4.5 8.6 q4.5 2.6 9 0" fill="#fff" opacity=".85" /></g>;
      case 'open': return <g><ellipse cx="0" cy="10" rx="4.4" ry="3.4" fill="#6e2418" /><path d="M-3 8.4 q3 1.6 6 0" fill="#fff" opacity=".8" /></g>;
      case 'shout': return <g><ellipse cx="0" cy="10.5" rx="5" ry="4.2" fill="#5a1c12" /><path d="M-3.4 8.6 q3.4 2 6.8 0" fill="#fff" opacity=".85" /></g>;
      case 'down': return <path d="M-5.5 11.5 q5.5 -5 11 0" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      case 'smirk': return <path d="M-5 9.5 q4 3.4 10 -1" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
      default: return <path d="M-5 9.6 q5 2.4 10 0" stroke={ink} strokeWidth="2.1" fill="none" strokeLinecap="round" />;
    }
  })();
  const blush = (p.mouth === 'big' || p.mouth === 'smile') && (id === 'zinaida' || id === 'nina');
  return <g>
    {brow}{eye(-7.4)}{eye(7.4)}{mouth}
    {/* нос: мягкая тень-клинышек */}
    <path d="M0 1.5 q1.6 3 -0.4 4.4" stroke="#c99a76" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".8" />
    {blush && <g opacity=".4"><circle cx="-11" cy="5" r="3.4" fill="#d98a72" /><circle cx="11" cy="5" r="3.4" fill="#d98a72" /></g>}
  </g>;
}

/* ---------------- головы ---------------- */
function Head({ id, p }: { id: NpcId; p: Pose }) {
  const skin = { arkady: '#e8c9a8', zinaida: '#f0d5b8', petr: '#dcb08c', nina: '#f2dcc4' }[id];
  const skinSh = { arkady: '#c9a184', zinaida: '#d8b394', petr: '#bd8f6c', nina: '#d8b89c' }[id];
  void p;
  switch (id) {
    case 'arkady': return <g>
      <ellipse cx="0" cy="0" rx="16.5" ry="19.5" fill={skin} />
      <path d="M6 -18 q11 6 10 20 q0 12 -8 17 q10 -2 12 -18 q1 -14 -14 -19z" fill={skinSh} opacity=".55" />
      {/* бакенбарды + усы */}
      <path d="M-16 -4 q-2 8 1 12 l3 -1 q-2 -6 -1 -11z" fill="#4a4038" />
      <path d="M16 -4 q2 8 -1 12 l-3 -1 q2 -6 1 -11z" fill="#4a4038" />
      <path d="M-6 6.5 q3 -2.4 6 0 q3 -2.4 6 0 q-2 2.6 -6 1.6 q-4 1 -6 -1.6z" fill="#4a4038" />
      {/* котелок */}
      <g><path d="M-15 -8 q0 -16 15 -16 q15 0 15 16 z" fill="#33302a" /><path d="M-15 -8 q0 -16 15 -16 q4 0 7 1.6 q-12 1 -13 14.4z" fill="#4a463c" opacity=".8" /><path d="M-20 -7.5 q20 -5 40 0 q-2 3.6 -6 3.4 q-14 -2.6 -28 0 q-4 .2 -6 -3.4z" fill="#24221c" /><path d="M-15 -10.5 h30" stroke="#5a1c12" strokeWidth="2.6" /></g>
      {/* пенсне на цепочке */}
      <g opacity=".9"><circle cx="-7.4" cy="-0.5" r="4.6" fill="url(#g-glass)" stroke="#8a6c1e" strokeWidth="1.2" /><circle cx="7.4" cy="-0.5" r="4.6" fill="url(#g-glass)" stroke="#8a6c1e" strokeWidth="1.2" /><path d="M-2.8 -0.5 h5.6" stroke="#8a6c1e" strokeWidth="1.2" /><path d="M11.8 0 q4 6 2 10" stroke="#8a6c1e" strokeWidth="1" fill="none" /></g>
      {/* воротник */}
      <path d="M-10 16 q10 6 20 0 l-2 6 q-8 4 -16 0z" fill="#efe3cc" />
    </g>;
    case 'zinaida': return <g>
      <ellipse cx="0" cy="0.5" rx="18.5" ry="18.5" fill={skin} />
      <path d="M7 -17 q12 7 11 19 q0 10 -7 15 q10 -3 11 -16 q1 -13 -15 -18z" fill={skinSh} opacity=".5" />
      {/* платок */}
      <path d="M-19 -2 q-2 -20 19 -20 q21 0 19 20 q-1 6 -3 8 q-1 -14 -16 -14 q-15 0 -16 14 q-2 -2 -3 -8z" fill="#8a4a3c" />
      <path d="M-19 -2 q-2 -20 19 -20 q6 0 10 1.4 q-16 2 -17 18.6z" fill="#a05a48" opacity=".8" />
      <path d="M-16 4 q-6 8 -2 12 q4 3 8 -1 M16 4 q6 8 2 12 q-4 3 -8 -1" fill="#8a4a3c" />
      <path d="M-2 16 q2 4 0 6 q-2 -2 -2 -6z" fill="#6e3a2e" />
      <path d="M-14 -6 q6 -8 14 -8 M-16 0 q2 -4 4 -6" stroke="#c88a76" strokeWidth="1.4" fill="none" opacity=".7" />
      {/* круглые очки */}
      <g><circle cx="-7.6" cy="-0.5" r="5.4" fill="url(#g-glass)" stroke="#5a4632" strokeWidth="1.6" /><circle cx="7.6" cy="-0.5" r="5.4" fill="url(#g-glass)" stroke="#5a4632" strokeWidth="1.6" /><path d="M-2.2 -0.5 h4.4" stroke="#5a4632" strokeWidth="1.6" /></g>
      {/* родинка + серьга */}
      <circle cx="12" cy="7" r="1.1" fill="#8a6a48" />
      <circle cx="-17" cy="6" r="1.6" fill="url(#g-brass)" />
    </g>;
    case 'petr': return <g>
      <ellipse cx="0" cy="0" rx="17.5" ry="19" fill={skin} />
      <path d="M6 -17 q12 6 11 19 q0 11 -7 16 q10 -3 11 -17 q1 -13 -15 -18z" fill={skinSh} opacity=".55" />
      {/* борода клином */}
      <path d="M-13 4 q-1 12 13 15 q14 -3 13 -15 q-3 8 -13 9 q-10 -1 -13 -9z" fill="#6e6258" />
      <path d="M-13 4 q-1 12 13 15 l0 -3 q-10 -2 -11 -12z" fill="#7d7166" opacity=".8" />
      {/* кепка */}
      <path d="M-17 -6 q0 -14 17 -14 q17 0 17 14 q-8 -4 -17 -4 q-9 0 -17 4z" fill="#3f4a5a" />
      <path d="M-17 -6 q0 -14 17 -14 q5 0 8 1 q-13 2 -14 13z" fill="#556074" opacity=".8" />
      <path d="M-19 -5.5 q10 -4 24 -2 q8 1 12 4 q-1 2.6 -4 2.4 q-14 -3 -28 0 q-3 .2 -4 -4.4z" fill="#2c3542" />
      {/* часовная лупа на правом глазу */}
      <g><circle cx="7.6" cy="-0.5" r="5" fill="url(#g-glass)" stroke="url(#g-brass)" strokeWidth="2.2" /><path d="M11 3 q3 5 1 9" stroke="#8a6c1e" strokeWidth="1.2" fill="none" /></g>
    </g>;
    default: return <g>
      <ellipse cx="0" cy="0.5" rx="17.5" ry="18" fill={skin} />
      <path d="M6 -16 q12 6 11 18 q0 10 -7 15 q10 -3 11 -16 q1 -12 -15 -17z" fill={skinSh} opacity=".5" />
      {/* седой пучок + чёлка */}
      <circle cx="0" cy="-19" r="7.5" fill="#cfc7ae" />
      <circle cx="-1.6" cy="-20.6" r="3" fill="#e0dac6" opacity=".9" />
      <path d="M-17 -4 q-1 -14 17 -14 q18 0 17 14 q-4 -8 -9 -9 q1 3 -1 5 q-3 -6 -6 -6 q1 3 0 5 q-4 -6 -8 -5 q-6 1 -10 10z" fill="#cfc7ae" />
      <path d="M-17 -4 q-1 -14 17 -14 q4 0 7 .8 q-14 2 -15 13.2z" fill="#e0dac6" opacity=".8" />
      {/* половинчатые очки */}
      <g opacity=".95"><path d="M-12 0.5 a5 5 0 0 0 10 0 z" fill="url(#g-glass)" stroke="#8a6c1e" strokeWidth="1.3" /><path d="M2 0.5 a5 5 0 0 0 10 0 z" fill="url(#g-glass)" stroke="#8a6c1e" strokeWidth="1.3" /><path d="M-2 0.5 h4" stroke="#8a6c1e" strokeWidth="1.3" /></g>
      {/* кружевной воротник */}
      <path d="M-11 15 q11 7 22 0 q-1 5 -4 6 q-2 -2 -3 1 q-2 -3 -4 0 q-2 -3 -4 0 q-1 -3 -3 -1 q-3 -1 -4 -6z" fill="#efe3cc" />
    </g>;
  }
}

/* ---------------- тела ---------------- */
function Body({ id }: { id: NpcId }) {
  const coat = NPCS[id].look.coat;
  const shade = 'rgba(20,12,6,.28)';
  const light = 'rgba(255,240,200,.22)';
  switch (id) {
    case 'arkady': return <g>
      {/* длинный сюртук */}
      <path d="M42 96 Q60 88 78 96 L84 128 L80 176 L40 176 L36 128 Z" fill={coat} />
      <path d="M66 92 q10 4 12 10 l6 26 -4 48 h-14z" fill={shade} />
      <path d="M42 96 q-4 4 -6 12 l-2 20 3 48 h6z" fill={light} />
      {/* лацканы + бабочка */}
      <path d="M52 96 L60 118 L56 96 Z" fill="#efe3cc" /><path d="M68 96 L60 118 L64 96 Z" fill="#e3d3b3" />
      <path d="M53 100 q7 6 14 0 q-2 8 -7 8 q-5 0 -7 -8" fill="#5a1c12" />
      <path d="M60 118 v54" stroke="#2c2117" strokeWidth="1.6" opacity=".5" />
      <circle cx="63.5" cy="130" r="1.5" fill="#d9b23f" /><circle cx="63.5" cy="142" r="1.5" fill="#d9b23f" />
      {/* ботинки */}
      <path d="M46 176 q-2 8 2 9 h10 q3 -1 1 -9z" fill="#241a12" /><path d="M62 176 q-2 8 2 9 h10 q3 -1 1 -9z" fill="#241a12" />
    </g>;
    case 'zinaida': return <g>
      {/* платье-трапеция */}
      <path d="M42 96 Q60 88 78 96 L92 178 L28 178 Z" fill={coat} />
      <path d="M68 92 q10 5 13 12 l11 74 h-16z" fill={shade} />
      <path d="M42 96 q-5 5 -8 13 l-8 69 h8z" fill={light} />
      {/* шаль на плечах */}
      <path d="M40 96 q20 14 40 0 q-4 12 -10 16 q-10 6 -20 0 q-6 -4 -10 -16z" fill="#efe3cc" opacity=".92" />
      <path d="M44 104 q16 10 32 0" stroke="#c8b090" strokeWidth="1.4" fill="none" />
      {/* брошь + пуговицы */}
      <circle cx="60" cy="112" r="3.2" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1" />
      <circle cx="60" cy="128" r="2" fill="#5a3a2a" /><circle cx="60" cy="140" r="2" fill="#5a3a2a" /><circle cx="60" cy="152" r="2" fill="#5a3a2a" />
      <path d="M34 178 h52" stroke="#5a3a2a" strokeWidth="3" opacity=".6" />
      <path d="M44 178 q-1 7 3 8 h8 M68 178 q-1 7 3 8 h8" fill="#3a2c1d" />
    </g>;
    case 'petr': return <g>
      {/* сутулые плечи + рубашка */}
      <path d="M40 98 Q60 88 80 98 L86 140 L82 176 L38 176 L34 140 Z" fill={coat} />
      <path d="M68 94 q10 5 12 12 l6 34 -4 36 h-14z" fill={shade} />
      <path d="M40 98 q-4 5 -6 12 l-2 30 4 36 h6z" fill={light} />
      {/* кожаный фартук */}
      <path d="M46 104 L74 104 L80 176 L40 176 Z" fill="#8a6a48" />
      <path d="M66 104 h8 l6 72 h-12z" fill="rgba(20,12,6,.22)" />
      <path d="M46 104 Q60 96 74 104" stroke="#5c4f38" strokeWidth="3.4" fill="none" />
      <rect x="50" y="132" width="20" height="14" rx="2.5" fill="#6e5f42" opacity=".85" />
      <path d="M50 139 h20" stroke="#5c4f38" strokeWidth="1.4" />
      {/* цепочка часов */}
      <path d="M52 118 q8 8 16 2" stroke="#d9b23f" strokeWidth="1.8" fill="none" />
      <circle cx="68" cy="120" r="3.4" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="1" />
      {/* ботинки */}
      <path d="M44 176 q-2 8 2 9 h10 q3 -1 1 -9z" fill="#2c2117" /><path d="M62 176 q-2 8 2 9 h10 q3 -1 1 -9z" fill="#2c2117" />
    </g>;
    default: return <g>
      {/* круглая фигура в шали */}
      <path d="M42 98 Q60 90 78 98 L88 150 Q84 178 60 178 Q36 178 32 150 Z" fill={NPCS.nina.look.coat} />
      <path d="M68 94 q10 6 12 14 l8 42 q-2 20 -18 26z" fill={shade} />
      <path d="M42 98 q-5 6 -8 14 l-4 38 q2 20 16 26z" fill={light} />
      {/* вязаная шаль с бахромой */}
      <path d="M40 98 q20 16 40 0 q0 16 -8 24 q-12 8 -24 0 q-8 -8 -8 -24z" fill="#c9b7d9" />
      <path d="M44 108 q16 12 32 0 M46 116 q14 10 28 0" stroke="#a894bc" strokeWidth="1.6" fill="none" />
      {[46, 52, 58, 64, 70, 76].map(x => <path key={x} d={`M${x} 124 v6`} stroke="#a894bc" strokeWidth="1.6" />)}
      <circle cx="50" cy="112" r="1.6" fill="#efe3cc" /><circle cx="70" cy="112" r="1.6" fill="#efe3cc" /><circle cx="60" cy="120" r="1.6" fill="#efe3cc" />
      <path d="M48 178 q-1 6 3 7 h8 M64 178 q-1 6 3 7 h8" fill="#3a2c1d" />
    </g>;
  }
}

/* ---------------- рука ---------------- */
function Arm({ side, coat, sh, el, prop }: { side: 'L' | 'R'; coat: string; sh: number; el: number; prop: React.ReactNode }) {
  const x = side === 'L' ? 42 : 78;
  return (
    <g className={`arm-${side === 'L' ? 'l' : 'r'}`} style={{ transform: `rotate(${sh}deg)`, transformBox: 'fill-box', transformOrigin: '50% 0%', transition: 'transform .28s cubic-bezier(.3,.8,.3,1)' }}>
      <path d={`M${x} 100 q${side === 'L' ? -3 : 3} 12 -1 24`} stroke={coat} strokeWidth="10" fill="none" strokeLinecap="round" />
      <g style={{ transform: `rotate(${el}deg)`, transformBox: 'fill-box', transformOrigin: '50% 0%', transition: 'transform .28s cubic-bezier(.3,.8,.3,1)' }}>
        <path d={`M${x - 1} 124 q${side === 'L' ? -2 : 2} 12 0 22`} stroke={coat} strokeWidth="9" fill="none" strokeLinecap="round" />
        <circle cx={x - 1} cy="148" r="5.4" fill="#e8c9a8" />
        <g transform={`translate(${x - 1} 150)`}>{prop}</g>
      </g>
    </g>
  );
}

/* ---------------- фигура NPC ---------------- */
export function NpcFigure({ id, emo = 'idle', size = 110, className = '' }: {
  id: NpcId; emo?: NpcEmotion; size?: number; className?: string;
}) {
  const p = POSE[emo] || POSE.idle;
  const coat = NPCS[id].look.coat;
  return (
    <svg viewBox="0 0 120 200" width={size} height={size * 200 / 120}
      className={`npc2 npc-${id} emo-${emo} ${className}`} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="188" rx="30" ry="5.5" fill="#140d07" opacity=".38" filter="url(#f-soft)" />
      <g className="body-g" style={{ transform: `rotate(${p.lean}deg)`, transformBox: 'fill-box', transformOrigin: '50% 100%', transition: 'transform .3s' }}>
        <Arm side="L" coat={coat} sh={p.shL} el={p.elL} prop={handProp(id, emo, 'L')} />
        <Body id={id} />
        <Arm side="R" coat={coat} sh={p.shR} el={p.elR} prop={handProp(id, emo, 'R')} />
      </g>
      <g className="head-g" style={{ transform: `rotate(${p.head}deg) translate(0px, ${emo === 'sad' || emo === 'pass' ? 2 : 0}px)`, transformBox: 'fill-box', transformOrigin: '50% 92%', transition: 'transform .3s' }}>
        <path d="M54 74 h12 v10 h-12z" fill="#c9a184" />
        <g transform="translate(60 56)"><Head id={id} p={p} /><FaceParts p={p} id={id} /></g>
      </g>
    </svg>
  );
}

/* ---------------- ведущий аукциона ---------------- */
export function Auctioneer({ strike, size = 120 }: { strike?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`auctioneer2 ${strike ? 'strike' : ''}`} xmlns="http://www.w3.org/2000/svg">
      <g className="auc-body">
        {/* жилет + рубашка */}
        <path d="M74 96 Q100 86 126 96 L132 150 L68 150 Z" fill="#5a1c12" />
        <path d="M112 92 q12 5 14 12 l6 46 h-16z" fill="rgba(20,12,6,.3)" />
        <path d="M88 96 L100 122 L94 96 Z" fill="#efe3cc" /><path d="M112 96 L100 122 L106 96 Z" fill="#e3d3b3" />
        <path d="M92 100 q8 7 16 0 q-3 9 -8 9 q-5 0 -8 -9" fill="#241a12" />
        <circle cx="100" cy="130" r="1.8" fill="#d9b23f" /><circle cx="100" cy="140" r="1.8" fill="#d9b23f" />
        {/* левая рука на гроссбухе */}
        <path d="M76 100 q-10 14 -6 30 q2 8 10 10" stroke="#5a1c12" strokeWidth="10" fill="none" strokeLinecap="round" />
        <circle cx="82" cy="141" r="5.4" fill="#e8c9a8" />
        {/* правая рука с молотком (бьёт по подушке на подиуме) */}
        <g className="gavel-arm2">
          <path d="M124 100 q16 4 18 16" stroke="#5a1c12" strokeWidth="10" fill="none" strokeLinecap="round" />
          <circle cx="142" cy="118" r="5.6" fill="#e8c9a8" />
          <g transform="translate(142 118) rotate(-52)">
            <rect x="-3" y="-4" width="6" height="26" rx="2.6" fill="url(#g-wood)" stroke="#4a3620" strokeWidth="1.2" />
            <rect x="-11" y="18" width="22" height="12" rx="4" fill="url(#g-wood-d)" stroke="#33261a" strokeWidth="1.4" />
            <path d="M-11 24 h22" stroke="#d9b23f" strokeWidth="1.6" opacity=".8" />
          </g>
        </g>
        {/* голова */}
        <path d="M94 76 h12 v10 h-12z" fill="#c9a184" />
        <g transform="translate(100 58)">
          <ellipse cx="0" cy="0" rx="17" ry="19.5" fill="#e8c9a8" />
          <path d="M6 -18 q12 6 11 20 q0 11 -7 16 q10 -3 11 -17 q1 -14 -15 -19z" fill="#c9a184" opacity=".55" />
          {/* зачёс */}
          <path d="M-17 -5 q-1 -15 17 -15 q18 0 17 15 q-5 -9 -12 -10 q2 3 0 5 q-5 -6 -11 -5 q-8 1 -11 15z" fill="#3a3f45" />
          <path d="M-17 -5 q-1 -15 17 -15 q5 0 8 1 q-14 2 -15 14z" fill="#565c66" opacity=".85" />
          <g stroke="#3a2c1d" strokeWidth="2.2" strokeLinecap="round" fill="none" className="auc-brows">
            <path d="M-11 -8 q4 -2 8 -0.6" /><path d="M3 -8.6 q4 -1.4 8 0.6" />
          </g>
          <g className="auc-eyes"><ellipse cx="-7.4" cy="-0.5" rx="3.8" ry="2.9" fill="#fff" /><circle cx="-6.9" cy="-0.2" r="1.9" fill="#3a2c1d" /><ellipse cx="7.4" cy="-0.5" rx="3.8" ry="2.9" fill="#fff" /><circle cx="7.9" cy="-0.2" r="1.9" fill="#3a2c1d" /></g>
          <path d="M0 1.5 q1.6 3 -0.4 4.4" stroke="#c99a76" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".8" />
          <path className="auc-mouth" d="M-5 9.6 q5 3 10 0" stroke="#3a2c1d" strokeWidth="2.1" fill="none" strokeLinecap="round" />
          {/* бакенбарды */}
          <path d="M-16 -3 q-1.6 7 .8 10 l2.6 -1 q-1.6 -5 -0.8 -9z" fill="#3a3f45" />
          <path d="M16 -3 q1.6 7 -0.8 10 l-2.6 -1 q1.6 -5 0.8 -9z" fill="#3a3f45" />
        </g>
      </g>
      {/* искра удара молотка (у подушки на подиуме сцены) */}
      <g className="gavel-hit" opacity="0">
        <path d="M150 126 l-6 -9 M155 125 l0 -10 M160 126 l6 -9" stroke="#ffe9a3" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* ---------------- прохожие (цикл ходьбы) ---------------- */
export function Passerby({ v = 0, flip = false, scale = 1 }: { v?: number; flip?: boolean; scale?: number }) {
  const skins = ['#e8c9a8', '#f0d5b8', '#dcb08c', '#e8c9a8'];
  const coats = ['#4f6a6a', '#8a4a3c', '#6e7f56', '#5a5a6a'];
  const coat = coats[v % 4], skin = skins[v % 4];
  return (
    <svg viewBox="0 0 60 104" width={60 * scale} height={104 * scale} className={`passer2 v${v % 4}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="100" rx="14" ry="3" fill="#140d07" opacity=".3" />
      <g className="p-bob">
        {/* ноги */}
        <g className="p-legA" style={{ transformOrigin: '30px 62px' }}>
          <path d="M30 62 q-1 16 -2 26 l-1 9" stroke="#3a3128" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M26 96 h9 q2 3 -1 3.6 h-9z" fill="#241a12" />
        </g>
        <g className="p-legB" style={{ transformOrigin: '30px 62px' }}>
          <path d="M30 62 q1 16 2 26 l1 9" stroke="#2c251e" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M32 96 h9 q2 3 -1 3.6 h-9z" fill="#1a120b" />
        </g>
        {/* корпус */}
        <path d="M22 34 Q30 29 38 34 L41 66 L19 66 Z" fill={coat} />
        <path d="M33 31 q6 3 7 7 l3 28 h-8z" fill="rgba(20,12,6,.25)" />
        {/* руки */}
        <g className="p-armA" style={{ transformOrigin: '24px 38px' }}>
          <path d="M24 38 q-2 12 -1 20" stroke={coat} strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="23" cy="59" r="3.4" fill={skin} />
        </g>
        <g className="p-armB" style={{ transformOrigin: '36px 38px' }}>
          <path d="M36 38 q2 12 1 20" stroke={coat} strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="37" cy="59" r="3.4" fill={skin} />
          {v % 4 === 1 && <g transform="translate(37 60)"><path d="M0 1 v3" stroke="#4a3620" strokeWidth="1.4" /><path d="M-5 4 q5 -4 10 0 l1 9 q-6 2.6 -12 0z" fill="#6e4f33" /></g>}
          {v % 4 === 2 && <rect x="30" y="40" width="12" height="15" rx="3" fill="#8a6a48" opacity=".9" />}
        </g>
        {/* голова + головной убор */}
        <g transform="translate(30 22)">
          <circle r="9.6" fill={skin} />
          <path d="M3 -9 q7 3 6.4 10 q0 6 -4 9 q6 -2 6.6 -9 q.6 -8 -9 -10z" fill="rgba(20,12,6,.2)" />
          {v % 4 === 0 && <><path d="M-9.6 -2 q0 -9 9.6 -9 q9.6 0 9.6 9 q-5 -3 -9.6 -3 q-4.6 0 -9.6 3z" fill="#3f4a5a" /><path d="M-10.6 -1.4 q6 -2.6 14 -1.4 q4 .6 6.4 2.4 q-.6 1.8 -2.6 1.6 q-8 -2 -16 0 q-2 .2 -2.6 -2.6z" fill="#2c3542" /></>}
          {v % 4 === 1 && <><path d="M-10 -1 q-1 -10 10 -10 q11 0 10 10 q-.6 3.4 -1.8 4.6 q-.6 -7.6 -8.2 -7.6 q-7.6 0 -8.2 7.6 q-1.2 -1.2 -1.8 -4.6z" fill="#8a4a3c" /><path d="M-6 6 q-3 4 -1 6 q2 1.6 4 -.6 M6 6 q3 4 1 6 q-2 1.6 -4 -.6" fill="#8a4a3c" /></>}
          {v % 4 === 2 && <><path d="M-9.6 -3 q0 -8 9.6 -8 q9.6 0 9.6 8z" fill="#6e7f56" /><rect x="-11" y="-4.6" width="22" height="3.4" rx="1.7" fill="#4f6a3f" /></>}
          {v % 4 === 3 && <><path d="M-9.6 -2 q-1 -9 9.6 -9 q10.6 0 9.6 9 q-3 -5 -6 -5.4 q1 2 0 3 q-2.6 -3.6 -6 -3 q-5 .8 -7.2 5.4z" fill="#cfc7ae" /></>}
          <circle cx="-3.4" cy="0.6" r="1.2" fill="#3a2c1d" /><circle cx="3.6" cy="0.6" r="1.2" fill="#3a2c1d" />
          <path d="M-2 5 q2.6 1.6 5 0" stroke="#3a2c1d" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/* ---------------- портреты (заказы, покупатели) ---------------- */
export function Portrait({ face, size = 44 }: { face: string; size?: number }) {
  const npc = (['arkady', 'zinaida', 'petr', 'nina'] as NpcId[]).includes(face as NpcId) ? face as NpcId : null;
  const p = POSE.idle;
  let inner: React.ReactNode;
  if (npc) {
    inner = <g transform="translate(50 46) scale(1.5)"><Head id={npc} p={p} /><FaceParts p={p} id={npc} /></g>;
  } else {
    const v = parseInt(face.replace(/\D/g, ''), 10) || 1;
    inner = <GenericHead v={v} />;
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="portrait2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="url(#g-paper)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#8a6c1e" strokeWidth="2.5" opacity=".7" />
      <path d="M18 92 q32 -26 64 0 z" fill="#6e5f42" opacity=".5" />
      {inner}
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(20,12,6,.35)" strokeWidth="5" opacity=".35" />
    </svg>
  );
}

function GenericHead({ v }: { v: number }) {
  const skins = ['#e0b894', '#f0d5b8', '#dcb08c', '#f2dcc4', '#e8c9a8'];
  const skin = skins[(v - 1) % 5];
  const face = <FaceParts p={{ ...POSE.idle, mouth: v === 2 ? 'smile' : 'flat' }} id={'g' + v} />;
  const g = (() => {
    switch ((v - 1) % 5) {
      case 0: return <g>{/* Иваныч: кепка, усы */}
        <path d="M-15 4 q-2 10 15 12 q17 -2 15 -12 q-4 7 -15 8 q-11 -1 -15 -8z" fill="#b0a898" />
        <path d="M-8 5 q4 -2.6 8 0 q4 -2.6 8 0 q-2 3 -8 2 q-6 1 -8 -2z" fill="#b0a898" />
        <path d="M-16 -6 q0 -13 16 -13 q16 0 16 13 q-7 -4 -16 -4 q-9 0 -16 4z" fill="#5a5a4a" />
        <path d="M-18 -5 q10 -3.6 22 -2 q7 1 12 3.6 q-.6 2.4 -3 2.2 q-13 -2.6 -27 0 q-2.4 .2 -4 -3.8z" fill="#44443a" />
      </g>;
      case 1: return <g>{/* Светлана: каре + берет */}
        <path d="M-17 -2 q-2 -16 17 -16 q19 0 17 16 l1 14 q-3 4 -6 2 q2 -10 -1 -14 q-11 -4 -22 0 q-3 4 -1 14 q-3 2 -6 -2z" fill="#5c4632" />
        <path d="M-14 -12 q10 -8 24 -3 q4 2 4 5 q-14 -6 -28 -2z" fill="#7a5c42" opacity=".8" />
        <ellipse cx="0" cy="-17" rx="12" ry="5.4" fill="#8a4a3c" transform="rotate(-8)" />
        <circle cx="8" cy="-20" r="2" fill="#6e3a2e" />
      </g>;
      case 2: return <g>{/* бородатый с очками */}
        <path d="M-14 2 q-2 13 14 15 q16 -2 14 -15 q-3 9 -14 10 q-11 -1 -14 -10z" fill="#6e6258" />
        <circle cx="-7.6" cy="-0.5" r="5" fill="url(#g-glass)" stroke="#3a2c1d" strokeWidth="1.6" />
        <circle cx="7.6" cy="-0.5" r="5" fill="url(#g-glass)" stroke="#3a2c1d" strokeWidth="1.6" />
        <path d="M-2.6 -0.5 h5.2" stroke="#3a2c1d" strokeWidth="1.6" />
        <path d="M-16 -6 q0 -12 16 -12 q16 0 16 12 q-8 -6 -16 -6 q-8 0 -16 6z" fill="#4a4038" />
      </g>;
      case 3: return <g>{/* дама в шляпке */}
        <path d="M-16 -4 q-1 -13 16 -13 q17 0 16 13 q-4 -7 -8 -8 q1 2 0 4 q-3 -5 -8 -4 q-6 1 -8 8 q-1 -2 0 -4 q-4 1 -8 8z" fill="#7a6a8f" />
        <ellipse cx="0" cy="-13" rx="21" ry="6" fill="#5d4f6e" transform="rotate(-4)" />
        <ellipse cx="0" cy="-17" rx="11" ry="7" fill="#7a6a8f" />
        <path d="M-11 -16 q11 -4 22 0" stroke="#d9b23f" strokeWidth="2" fill="none" />
        <circle cx="9" cy="-19" r="2.4" fill="#d9b23f" />
      </g>;
      default: return <g>{/* тётя Таня: платок */}
        <path d="M-18 -1 q-2 -18 18 -18 q20 0 18 18 q-.6 5 -2.4 7 q-.6 -12 -15.6 -12 q-15 0 -15.6 12 q-1.8 -2 -2.4 -7z" fill="#6e7f56" />
        <path d="M-15 4 q-5 7 -1.6 10.6 q3.4 2.6 7 -1 M15 4 q5 7 1.6 10.6 q-3.4 2.6 -7 -1" fill="#6e7f56" />
        <path d="M-13 -6 q6 -7 13 -7 M-15 0 q2 -4 4 -6" stroke="#93a878" strokeWidth="1.4" fill="none" opacity=".8" />
      </g>;
    }
  })();
  return <g transform="translate(50 46) scale(1.5)">
    <ellipse cx="0" cy="0.5" rx="17.5" ry="18.5" fill={skin} />
    <path d="M6 -17 q12 6 11 19 q0 11 -7 16 q10 -3 11 -17 q1 -13 -15 -18z" fill="rgba(20,12,6,.18)" />
    {g}{face}
  </g>;
}
