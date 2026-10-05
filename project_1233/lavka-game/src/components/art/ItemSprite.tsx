/* ItemSprite.tsx — спрайт предмета + слой дефектов (грязь/пыль/ржавчина/царапины/трещины/
   отсутствующая деталь и т.д.). Дефекты рисуются детерминированно по seed лота;
   решённые дефекты плавно исчезают (до/после видно прямо на предмете). */
import React, { useMemo } from 'react';
import { mulberry32 } from '../../game/rng';
import { ItemArt, hasItemArt } from '../../art/items';
import type { DefectInst } from '../../game/types';

export const DEFECT_ICONS: Record<string, string> = {
  dirt: '🟤', dust: '🌫️', rust: '🟠', scratches: '🪒', worn: '🧽',
  crack: '💔', broken_mech: '⚙️', missing_part: '❓', consumable: '🔋', calibration: '🎯'
};

interface OverlayProps { defects: DefectInst[]; seed: number; }

function DefectOverlay({ defects, seed }: OverlayProps) {
  const groups = useMemo(() => {
    const rnd = mulberry32(seed || 7);
    const out: React.ReactNode[] = [];
    defects.forEach((d, di) => {
      const cls = `defect-g${d.resolved ? ' off' : ''}`;
      const R = (a: number, b: number) => a + rnd() * (b - a);
      let inner: React.ReactNode = null;
      switch (d.id) {
        case 'dirt':
          inner = <g opacity=".82">
            {[0, 1, 2, 3].map(i => (
              <ellipse key={i} cx={R(60, 140)} cy={R(70, 150)} rx={R(14, 30)} ry={R(10, 22)}
                fill={i % 2 ? '#4a3620' : '#5c452c'} opacity={R(.5, .8)} transform={`rotate(${R(-30, 30)} 100 100)`} />
            ))}
          </g>;
          break;
        case 'dust':
          inner = <g opacity=".65">
            <ellipse cx="100" cy="104" rx="66" ry="58" fill="#9a937f" opacity=".34" />
            {Array.from({ length: 26 }).map((_, i) => (
              <circle key={i} cx={R(40, 160)} cy={R(46, 164)} r={R(1, 2.6)} fill="#cfc7ae" opacity={R(.3, .7)} />
            ))}
          </g>;
          break;
        case 'rust':
          inner = <g opacity=".8">
            {[0, 1, 2].map(i => (
              <g key={i}>
                <circle cx={R(58, 142)} cy={R(70, 146)} r={R(8, 15)} fill="#8a4a24" opacity=".75" />
                <circle cx={R(58, 142)} cy={R(70, 146)} r={R(4, 9)} fill="#a85c2c" opacity=".8" />
              </g>
            ))}
          </g>;
          break;
        case 'scratches':
          inner = <g stroke="#e8e2d0" strokeWidth="1.6" opacity=".75" fill="none" strokeLinecap="round">
            {Array.from({ length: 5 }).map((_, i) => {
              const x = R(50, 140), y = R(56, 148), l = R(14, 34), a = R(-0.9, 0.9);
              return <path key={i} d={`M${x} ${y} l${Math.cos(a) * l} ${Math.sin(a) * l}`} />;
            })}
          </g>;
          break;
        case 'worn':
          inner = <g opacity=".55">
            <ellipse cx={R(66, 96)} cy={R(60, 90)} rx={R(20, 34)} ry={R(12, 20)} fill="#d8cdb2" opacity=".5" />
            <ellipse cx={R(104, 138)} cy={R(112, 148)} rx={R(18, 30)} ry={R(10, 18)} fill="#cfc2a4" opacity=".45" />
          </g>;
          break;
        case 'crack':
          inner = <g stroke="#241a12" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".9">
            {(() => {
              const x0 = R(56, 90), y0 = R(48, 70);
              let d = `M${x0} ${y0}`;
              let x = x0, y = y0;
              for (let s = 0; s < 5; s++) { x += R(8, 20); y += R(6, 18); d += ` L${x.toFixed(0)} ${y.toFixed(0)}`; }
              return <>
                <path d={d} />
                <path d={`M${(x0 + 22).toFixed(0)} ${(y0 + 26).toFixed(0)} l${R(-14, -6).toFixed(0)} ${R(8, 16).toFixed(0)}`} strokeWidth="2" />
              </>;
            })()}
          </g>;
          break;
        case 'broken_mech':
          inner = <g transform={`translate(${R(118, 146)}, ${R(40, 62)})`}>
            <circle r="15" fill="#1d140c" opacity=".85" />
            <g stroke="#8d887c" strokeWidth="3" fill="none">
              <circle r="9" />
              <path d="M0 -12 v4 M0 12 v-4 M-12 0 h4 M12 0 h-4 M-8.5 -8.5 l3 3 M8.5 8.5 l-3 -3 M8.5 -8.5 l-3 3 M-8.5 8.5 l3 -3" />
            </g>
            <path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke="#b5533c" strokeWidth="3.4" strokeLinecap="round" />
          </g>;
          break;
        case 'missing_part':
          inner = <g transform={`translate(${R(120, 150)}, ${R(96, 128)})`}>
            <circle r="17" fill="#1d140c" opacity=".55" stroke="#efe3cc" strokeWidth="2.4" strokeDasharray="5 5" />
            <text textAnchor="middle" dy="7" fontSize="20" fill="#efe3cc" fontFamily="Georgia" fontWeight="bold">?</text>
          </g>;
          break;
        case 'consumable':
          inner = <g transform={`translate(${R(40, 62)}, ${R(132, 156)})`}>
            <path d="M0 -14 L14 10 L-14 10 Z" fill="#1d140c" opacity=".85" stroke="#d9b23f" strokeWidth="2" />
            <text textAnchor="middle" dy="6" fontSize="14" fill="#d9b23f" fontWeight="bold">!</text>
          </g>;
          break;
        case 'calibration':
          inner = <g stroke="#cfe0e0" strokeWidth="2.4" fill="none" opacity=".8">
            <path d={`M${R(48, 66)} ${R(150, 164)} q10 -8 20 0 q10 8 20 0 q10 -8 20 0`} />
            <path d={`M${R(96, 116)} ${R(148, 162)} l10 -12 M${R(96, 116)} ${R(148, 162)} l-4 -14`} strokeWidth="2" />
          </g>;
          break;
      }
      out.push(<g key={di} className={cls}>{inner}</g>);
    });
    return out;
  }, [defects, seed]);

  return (
    <div className="defect-layer">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">{groups}</svg>
    </div>
  );
}

export function ItemSprite({ svg, id, size, defects, seed, dirty, className, style }: {
  svg: string;
  id?: string;
  size?: number | string;
  defects?: DefectInst[];
  seed?: number;
  dirty?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (id && hasItemArt(id)) {
    return <ItemArt id={id} size={size} defects={defects} seed={seed} dirty={dirty} className={className} style={style} />;
  }
  const w = size ?? '100%';
  return (
    <div className={`sprite-box ${dirty ? 'sprite-dirty' : ''} ${className || ''}`}
      style={{ width: w, height: w, aspectRatio: '1', ...style }}>
      <div style={{ width: '100%', height: '100%', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
      {defects && defects.length > 0 && <DefectOverlay defects={defects} seed={seed || 1} />}
    </div>
  );
}
