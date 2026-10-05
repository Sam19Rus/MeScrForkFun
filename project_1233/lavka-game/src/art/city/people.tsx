/* people.tsx — горожане: единый силуэт-стиль, вариативность походок/поз/одежды.
   Движение по улице — CSS (cw-*), шаги/руки — переиспользуют pLegA/pLegB/pBob. */
import React from 'react';
import { GroundShadow, Bike } from './kit';

const SKIN = ['#e8c9a8', '#f0d5b8', '#dcb08c', '#c89878'];
const COAT = ['#4f6a6a', '#8a4a3c', '#6e7f56', '#5a5f7a', '#7a5a44', '#3f5a52', '#8a6a3c', '#684a5a'];
const LEG = ['#3a3128', '#2c251e', '#40382e', '#33302a'];

export type Pose = 'walk' | 'stand' | 'carry' | 'sweep' | 'look' | 'crouch' | 'sit';

/* голова с вариациями: 0 кепка, 1 берет+шарф, 2 платок, 3 волосы, 4 фуражка, 5 шляпа */
function Head({ v, skin, tilt = 0, k = 1 }: { v: number; skin: string; tilt?: number; k?: number }) {
  return <g transform={`translate(0 -58) rotate(${tilt}) scale(${k})`}>
    <circle r={7.4} fill={skin} />
    <path d="M2.4 -7 q5.4 2.4 5 7.6 q0 4.6 -3 7 q4.6 -1.6 5 -7 q.5 -6.2 -7 -7.6z" fill="rgba(20,12,6,.18)" />
    {v === 0 && <><path d="M-7.4 -1.6 q0 -7 7.4 -7 q7.4 0 7.4 7 q-3.8 -2.4 -7.4 -2.4 q-3.6 0 -7.4 2.4z" fill="#3f4a5a" />
      <path d="M-8.2 -1 q4.6 -2 10.8 -1 q3 .5 5 1.8 q-.5 1.4 -2 1.2 q-6.2 -1.5 -12.4 0 q-1.5 .2 -2 -2z" fill="#2c3542" /></>}
    {v === 1 && <><path d="M-7.8 -1 q-1 -8 7.8 -8 q8.8 0 7.8 8 q-.5 2.6 -1.4 3.6 q-.5 -6 -6.4 -6 q-5.9 0 -6.4 6 q-.9 -1 -1.4 -3.6z" fill="#8a4a3c" />
      <path d="M-5 5 q-2.4 3 -.8 4.6 q1.6 1.2 3 -.5 M5 5 q2.4 3 .8 4.6 q-1.6 1.2 -3 -.5" fill="#8a4a3c" /></>}
    {v === 2 && <><path d="M-7.6 -1.4 q0 -7.4 7.6 -7.4 q7.6 0 7.6 7.4 l-1.6 8.4 h-3 l1 -8 h-9.2 l1 8 h-3z" fill="#b0653c" />
      <circle cx="0" cy="-8.4" r="1.6" fill="#8a4a2c" /></>}
    {v === 3 && <path d="M-7.4 -1 q0 -7.4 7.4 -7.4 q7.4 0 7.4 7.4 q-2.6 -3.4 -7.4 -3.4 q-4.8 0 -7.4 3.4z" fill="#4a3626" />}
    {v === 4 && <><path d="M-7.2 -2 q0 -6.6 7.2 -6.6 q7.2 0 7.2 6.6z" fill="#46523c" />
      <rect x="-7.8" y="-2.6" width="15.6" height="2.4" rx="1.2" fill="#37422e" /><circle cx="0" cy="-8.8" r="1.4" fill="#37422e" /></>}
    {v === 5 && <><path d="M-6.4 -3 q0 -6 6.4 -6 q6.4 0 6.4 6z" fill="#6e5638" />
      <path d="M-9.4 -3 h18.8 l-1 2.4 h-16.8z" fill="#5a4628" /></>}
    <circle cx="-2.6" cy=".6" r=".95" fill="#3a2c1d" /><circle cx="2.8" cy=".6" r=".95" fill="#3a2c1d" />
    <path d="M-1.4 4 q2 1.4 3.8 0" stroke="#3a2c1d" strokeWidth="1" fill="none" strokeLinecap="round" />
  </g>;
}

export function Person({ v = 0, pose = 'stand', s = 1, flip = false, still = false, child = false, elder = false, noShadow = false }: {
  v?: number; pose?: Pose; s?: number; flip?: boolean; still?: boolean; child?: boolean; elder?: boolean; noShadow?: boolean;
}) {
  const coat = COAT[v % COAT.length], skin = SKIN[v % SKIN.length], leg = LEG[v % LEG.length];
  const walking = pose === 'walk' || pose === 'carry' || pose === 'sweep';
  const cls = still ? '' : 'passer2';
  const bodyK = child ? 0.82 : elder ? 0.97 : 1;
  const headK = child ? 1.28 : 1;
  return <g transform={`translate(0 0) scale(${flip ? -s : s} ${s})`} className={cls}>
    {!noShadow && <GroundShadow x={0} y={1} rx={9.5} ry={2.6} o={.3} />}
    <g transform={`scale(${bodyK})`}>
    <g className="p-bob" transform={elder ? 'rotate(5 0 -28)' : undefined}>
      {/* ноги */}
      {pose === 'crouch' ? <>
        <path d="M0 -26 q-8 6 -8 14 l0 12" stroke={leg} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M0 -26 q6 8 6 14 l1 12" stroke={leg} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M-10 0 h8 M4 0 h8" stroke="#241a12" strokeWidth="3.4" strokeLinecap="round" />
      </> : pose === 'sit' ? <>
        <path d="M0 -28 q10 2 12 10 l2 8" stroke={leg} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M0 -28 q8 6 10 12 l1 6" stroke={leg} strokeWidth="6" fill="none" strokeLinecap="round" />
      </> : <>
        <g className="p-legA" style={{ transformOrigin: '0px -28px' }}>
          <path d="M0 -28 q-1 12 -1.6 20 l-.8 7" stroke={leg} strokeWidth="5.6" fill="none" strokeLinecap="round" />
          <path d="M-4.6 -1.6 h7 q1.6 2.4 -.8 3 h-7z" fill="#241a12" />
        </g>
        <g className="p-legB" style={{ transformOrigin: '0px -28px' }}>
          <path d="M0 -28 q1 12 1.6 20 l.8 7" stroke={leg} strokeWidth="5.6" fill="none" strokeLinecap="round" />
          <path d="M.6 -1.6 h7 q1.6 2.4 -.8 3 h-7z" fill="#1a120b" />
        </g>
      </>}
      {/* корпус */}
      <path d={pose === 'crouch' ? 'M-7 -44 Q0 -48 7 -44 L10 -24 L-8 -24 Z'
        : pose === 'sit' ? 'M-7 -50 Q0 -54 7 -50 L9 -26 L-9 -26 Z'
          : 'M-7.6 -50 Q0 -54 7.6 -50 L10 -27 L-10 -27 Z'} fill={coat} />
      <path d="M2 -52 q5 2.6 6 6 l2.6 20 h-6.6z" fill="rgba(20,12,6,.22)" />
      {v % 3 === 0 && <path d="M-9 -34 h18" stroke="rgba(240,220,170,.5)" strokeWidth="2.2" />}
      {/* руки */}
      {pose === 'carry' ? <>
        <path d="M-6 -48 q4 8 8 10" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M6 -48 q-2 8 -4 10" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
        <g transform="translate(4 -36)">
          <rect x="-9" y="-9" width="20" height="17" rx="2" fill="#a67c52" stroke="#5a4632" strokeWidth="1.8" />
          <path d="M-9 -9 l20 17 M11 -9 l-20 17" stroke="#c8a97e" strokeWidth="1.8" />
        </g>
      </> : pose === 'sweep' ? <>
        <path d="M-6 -48 q2 10 6 14" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M6 -48 q0 10 -2 14" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
        <g className="sweep-m" style={{ transformOrigin: '4px -34px' }}>
          <path d="M4 -34 l14 26" stroke="#8a6a48" strokeWidth="3.4" />
          <path d="M15 8 q3 8 0 10 q6 -2 8 -8z" fill="#c8a97e" />
          <path d="M14 10 l8 8 M18 8 l4 10" stroke="#a68a5c" strokeWidth="2" />
        </g>
      </> : pose === 'look' ? <>
        <path d="M-6 -48 q-2 10 -1 16" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
        <g className="look-arm" style={{ transformOrigin: '6px -48px' }}>
          <path d="M6 -48 q8 -4 12 -10" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="19" cy="-59" r="2.6" fill={skin} />
        </g>
      </> : pose === 'crouch' ? <>
        <path d="M-4 -42 q6 8 12 10" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="9" cy="-31" r="2.6" fill={skin} />
      </> : <>
        <g className="p-armA" style={{ transformOrigin: '-6px -48px' }}>
          <path d="M-6 -48 q-2 9 -1 15" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="-6.6" cy="-32" r="2.6" fill={skin} />
        </g>
        <g className="p-armB" style={{ transformOrigin: '6px -48px' }}>
          <path d="M6 -48 q2 9 1 15" stroke={coat} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="6.6" cy="-32" r="2.6" fill={skin} />
          {v % 4 === 1 && pose === 'walk' && <g transform="translate(7 -31)"><path d="M0 1 v2.6" stroke="#4a3620" strokeWidth="1.2" />
            <path d="M-4 3.4 q4 -3 8 0 l.8 7 q-4.8 2 -9.6 0z" fill="#6e4f33" /></g>}
          {v % 5 === 2 && pose === 'stand' && <path d="M6.6 -32 q4 6 2 12" stroke="#4a3620" strokeWidth="2.4" fill="none" />}
        </g>
      </>}
      <Head v={v % 6} skin={skin} tilt={pose === 'look' ? -8 : pose === 'crouch' ? 10 : 0} k={headK} />
      {elder && <path d="M9 -30 q3 14 2 30" stroke="#6e5638" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
    </g>
    </g>
  </g>;
}

/* идущий горожанин: внешнее движение по улице + ориентация */
export function Walker({ v = 0, y = 0, s = 1, mode = 'cross', dur = 60, delay = 0, from = -90, to = 1690 }: {
  v?: number; y?: number; s?: number; mode?: 'cross' | 'alt' | 'slow'; dur?: number; delay?: number; from?: number; to?: number;
}) {
  const anim = mode === 'alt' ? 'cwAlt' : 'cwR';
  const flipAnim = mode === 'alt' ? 'cwFlip' : undefined;
  const rev = mode !== 'alt' && from > to;
  const step = mode === 'slow' ? '1.05s' : mode === 'alt' ? '.8s' : '.66s';
  return <g className="cw" style={{ animationName: anim, animationDuration: `${dur}s`, animationDelay: `${delay}s`, ['--from' as any]: `${from}px`, ['--to' as any]: `${to}px` }}>
    <g transform={`translate(0 ${y}) scale(${s})`} style={step ? { ['--step' as any]: step } : undefined}>
      {/* вечернее солнце слева: длинная тень вправо + контактная тень */}
      <path d="M-7 0 q7 -2.6 14 0 l26 5.5 q-18 4.4 -40 -1z" fill="#241a10" opacity=".15" />
      <ellipse cx="2" cy="0" rx="9" ry="2.6" fill="#241a10" opacity=".2" />
      <g className={flipAnim ? 'cw-f' : ''} style={flipAnim ? { animationDuration: `${dur}s`, animationDelay: `${delay}s` } : undefined}>
        <Person v={v} pose="walk" flip={rev} />
      </g>
    </g>
  </g>;
}

/* ================= вид спереди / сзади (¾) =================
   Для траекторий, уходящих в глубину экрана: нельзя всё время
   смотреть строго влево. Тот же силуэтный стиль, те же палитры. */
function HeadBack({ v, k = 1 }: { v: number; k?: number }) {
  const HAIR = ['#3f4a5a', '#8a4a3c', '#b0653c', '#4a3626', '#46523c', '#6e5638'][v % 6];
  return <g transform={`translate(0 -58) scale(${k})`}>
    <circle r={7.4} fill={HAIR} />
    <circle r={7.4} fill="rgba(20,12,6,.22)" />
    {v === 2 && <path d="M-6 3 q6 4 12 0 l1.4 3 q-7.4 4.6 -14.8 0z" fill="#96502e" />}
    {v === 5 && <path d="M-9.4 -1 h18.8 l-1 2.4 h-16.8z" fill="#4a3a20" />}
    {v === 0 && <path d="M-7.6 1.4 q7.6 3 15.2 0 v2 q-7.6 3 -15.2 0z" fill="#2c3542" />}
  </g>;
}
export function PersonFB({ v = 0, view = 'front', child = false, elder = false, s = 1, pose = 'walk' }: {
  v?: number; view: 'front' | 'back'; child?: boolean; elder?: boolean; s?: number; pose?: 'walk' | 'stand';
}) {
  const coat = COAT[v % COAT.length], skin = SKIN[v % SKIN.length], leg = LEG[v % LEG.length];
  const bodyK = child ? 0.82 : elder ? 0.97 : 1;
  const headK = child ? 1.28 : 1;
  const stand = pose === 'stand';
  return <g transform={`scale(${s})`}>
    <g transform={`scale(${bodyK})`}>
      <g className={stand ? '' : 'p-bob'} transform={elder ? 'rotate(4 0 -28)' : undefined}>
        {/* ноги */}
        <g className={stand ? '' : 'p-legA'} style={{ transformOrigin: '-3.2px -26px' }}>
          <path d="M-3.2 -26 q-.6 12 -1 19 l-.4 6" stroke={leg} strokeWidth="5.2" fill="none" strokeLinecap="round" />
          <path d="M-7.4 -1.4 h7 q1.4 2.2 -.8 2.8 h-6.8z" fill="#241a12" />
        </g>
        <g className={stand ? '' : 'p-legB'} style={{ transformOrigin: '3.2px -26px' }}>
          <path d="M3.2 -26 q.6 12 1 19 l.4 6" stroke={leg} strokeWidth="5.2" fill="none" strokeLinecap="round" />
          <path d="M.6 -1.4 h7 q1.4 2.2 -.8 2.8 h-6.8z" fill="#1a120b" />
        </g>
        {/* корпус */}
        <path d="M-8.4 -48 Q0 -52.6 8.4 -48 L10 -25 L-10 -25 Z" fill={coat} />
        {view === 'back'
          ? <><path d="M0 -50 v24" stroke="rgba(20,12,6,.25)" strokeWidth="1.6" />
            <path d="M-8.4 -48 Q0 -44 8.4 -48" stroke="rgba(20,12,6,.2)" strokeWidth="2" fill="none" /></>
          : <><path d="M-2.4 -50 L0 -44 L2.4 -50 Q0 -51.6 -2.4 -50" fill={skin} opacity=".9" />
            <circle cx="0" cy="-40" r="1.1" fill="rgba(240,225,180,.6)" /><circle cx="0" cy="-33" r="1.1" fill="rgba(240,225,180,.6)" />
            <path d="M8.4 -48 L10 -25 L4 -25 L5 -48z" fill="rgba(20,12,6,.16)" /></>}
        {v % 3 === 0 && <path d="M-9.2 -32 h18.4" stroke="rgba(240,220,170,.5)" strokeWidth="2.2" />}
        {/* руки */}
        <g className={stand ? '' : 'p-armA'} style={{ transformOrigin: '-7.4px -46px' }}>
          <path d="M-7.4 -46 q-2.2 9 -1.6 15" stroke={coat} strokeWidth="4.8" fill="none" strokeLinecap="round" />
          <circle cx="-8.6" cy="-30" r="2.5" fill={skin} />
        </g>
        <g className={stand ? '' : 'p-armB'} style={{ transformOrigin: '7.4px -46px' }}>
          <path d="M7.4 -46 q2.2 9 1.6 15" stroke={coat} strokeWidth="4.8" fill="none" strokeLinecap="round" />
          <circle cx="8.6" cy="-30" r="2.5" fill={skin} />
          {view === 'front' && v % 4 === 1 && <g transform="translate(9 -30)"><path d="M0 1 v2.4" stroke="#4a3620" strokeWidth="1.1" />
            <path d="M-3.6 3 q3.6 -2.6 7.2 0 l.7 6 q-4.3 1.8 -8.6 0z" fill="#6e4f33" /></g>}
        </g>
        {view === 'front' ? <Head v={v % 6} skin={skin} k={headK} /> : <HeadBack v={v % 6} k={headK} />}
      </g>
    </g>
  </g>;
}

/* ================= велосипедист ================= */
export function Cyclist({ v = 0 }: { v?: number }) {
  const coat = COAT[v % COAT.length], skin = SKIN[v % SKIN.length], leg = LEG[v % LEG.length];
  return <g>
    {/* ноги за рамой: педалируют */}
    <g className="pedalA" style={{ transformOrigin: '-7px -34px' }}>
      <path d="M-7 -34 q4 8 5 14 l3 6" stroke={leg} strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
    <Bike x={0} y={0} col="#7c2a1c" />
    <g className="pedalB" style={{ transformOrigin: '-7px -34px' }}>
      <path d="M-7 -34 q5 8 6 13 l4 7" stroke={mixDark(leg)} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M1 -15 l6 2" stroke="#241a12" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g className="pedal-crank" style={{ transformOrigin: '0px -13px' }}>
      <path d="M0 -13 l6 4 M0 -13 l-6 -4" stroke="#2a2620" strokeWidth="2.4" />
      <path d="M4.6 -8.4 h4 M-8.6 -17.6 h4" stroke="#241a12" strokeWidth="2.6" strokeLinecap="round" />
    </g>
    {/* корпус: наклон вперёд */}
    <path d="M-8 -36 Q-2 -50 10 -52 L13 -45 Q2 -42 -2 -33 Z" fill={coat} />
    <path d="M10 -52 q5 -1.6 8 .6 l-4 4.6z" fill={coat} />
    {/* рука к рулю */}
    <path d="M9 -50 q7 6 10 12" stroke={coat} strokeWidth="4.4" fill="none" strokeLinecap="round" />
    <circle cx="19.6" cy="-37" r="2.4" fill={skin} />
    {/* голова + кепка */}
    <g transform="translate(13 -58)">
      <circle r={6.4} fill={skin} />
      <path d="M-6.4 -1.4 q0 -6 6.4 -6 q6.4 0 6.4 6 q-3.4 -2 -6.4 -2 q-3 0 -6.4 2z" fill="#3f4a5a" />
      <path d="M4 -2 q6 -1 8.4 1.4 q-3 1 -8.4 .4z" fill="#2c3542" />
      <circle cx="2.4" cy=".8" r=".9" fill="#3a2c1d" />
    </g>
  </g>;
}
function mixDark(c: string) { return c; }
