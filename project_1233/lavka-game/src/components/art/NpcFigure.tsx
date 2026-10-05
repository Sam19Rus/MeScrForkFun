/* NpcFigure.tsx — стилизованный персонаж: тело (по архетипу) + лицо (FACES из данных)
   + слой эмоций (брови/рука/наклон). Эмоции переключаются CSS-классом emo-*.
   Один NPC = один маленький SVG, анимируются только transform'ы — дёшево для DOM. */
import React from 'react';
import { FACES, NPCS } from '../../game/data/world';
import type { NpcEmotion, NpcId } from '../../game/types';

const SKIN: Record<string, string> = {
  arkady: '#e8c9a8', zinaida: '#f0d5b8', petr: '#e0b894', nina: '#f2dcc4'
};

function faceInner(faceKey: string): string {
  const raw = FACES[faceKey] || '';
  return raw.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function Body({ npc, id }: { npc: (typeof NPCS)[NpcId]; id: NpcId }) {
  const { coat, accent, body } = npc.look;
  switch (body) {
    case 'suit': // Аркадий: пиджак + бабочка + котелок
      return <g>
        <path d="M34 92 Q60 82 86 92 L92 158 L28 158 Z" fill={coat} />
        <path d="M52 92 L60 116 L68 92 L60 98 Z" fill="#efe3cc" />
        <path d="M54 100 q6 5 12 0 q-2 7 -6 7 q-4 0 -6 -7" fill={accent} />
        <path d="M46 118 v34 M74 118 v34" stroke="#2c2117" strokeWidth="2" opacity=".4" />
        <rect x="42" y="150" width="36" height="10" rx="4" fill="#241a12" />
      </g>;
    case 'dress': // Зинаида: платье + платок на плечах + калькулятор
      return <g>
        <path d="M36 92 Q60 84 84 92 L96 160 L24 160 Z" fill={coat} />
        <path d="M36 92 Q60 104 84 92 Q70 100 60 112 Q50 100 36 92" fill={accent} opacity=".9" />
        <circle cx="60" cy="126" r="3.4" fill={accent} /><circle cx="60" cy="140" r="3.4" fill={accent} />
        <rect x="72" y="128" width="16" height="22" rx="3" fill="#3a3f45" stroke="#8d887c" strokeWidth="1.5" />
        <path d="M75 133 h10 M75 138 h10 M75 143 h10" stroke="#9fdc9f" strokeWidth="1.2" />
      </g>;
    case 'apron': // Пётр: фартук часовщика + лупа на шее
      return <g>
        <path d="M36 92 Q60 84 84 92 L90 158 L30 158 Z" fill={coat} />
        <path d="M44 100 L76 100 L80 158 L40 158 Z" fill="#8a7a5a" />
        <path d="M44 100 Q60 92 76 100" stroke="#5c4f38" strokeWidth="3" fill="none" />
        <circle cx="60" cy="120" r="8" fill="none" stroke="#d9b23f" strokeWidth="2.4" />
        <path d="M66 126 l8 8" stroke="#d9b23f" strokeWidth="2.4" />
        <rect x="46" y="136" width="28" height="14" rx="3" fill="#6e5f42" opacity=".7" />
      </g>;
    default: // Нина: шаль
      return <g>
        <path d="M34 94 Q60 84 86 94 L94 158 L26 158 Z" fill={coat} />
        <path d="M34 94 Q60 112 86 94 Q88 108 78 122 Q60 132 42 122 Q32 108 34 94" fill={accent} />
        <circle cx="48" cy="112" r="2.6" fill="#efe3cc" opacity=".8" /><circle cx="72" cy="112" r="2.6" fill="#efe3cc" opacity=".8" />
        <circle cx="60" cy="124" r="2.6" fill="#efe3cc" opacity=".8" />
        <path d="M40 140 q20 8 40 0" stroke="#5d4f6e" strokeWidth="3" fill="none" />
      </g>;
  }
}

function EmoLayer({ id, emo }: { id: NpcId; emo: NpcEmotion }) {
  // накладки на лицо в координатах фигуры (голова: центр 60,44; r≈26)
  const skin = SKIN[id];
  void skin;
  switch (emo) {
    case 'angry':
      return <g stroke="#5a3020" strokeWidth="2.6" strokeLinecap="round">
        <path d="M47 34 l9 4 M73 34 l-9 4" />
        <path d="M53 56 q7 -4 14 0" fill="none" />
        {id === 'arkady' && <path d="M44 26 q6 -5 12 -3" stroke="#b5533c" strokeWidth="2" fill="none" />}
      </g>;
    case 'happy':
    case 'lead':
      return <g>
        <path d="M52 52 q8 7 16 0" stroke="#5a3020" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="46" cy="50" r="3.4" fill="#d98a72" opacity=".5" />
        <circle cx="74" cy="50" r="3.4" fill="#d98a72" opacity=".5" />
      </g>;
    case 'sad':
    case 'pass':
      return <g stroke="#5a3020" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M48 35 l8 3 M72 35 l-8 3" />
        <path d="M53 57 q7 -5 14 0" />
      </g>;
    case 'think':
      return <g fill="#5a3020" opacity=".85">
        <circle cx="76" cy="30" r="2" /><circle cx="81" cy="24" r="2.8" /><circle cx="87" cy="17" r="3.6" fill="none" stroke="#5a3020" strokeWidth="1.6" />
      </g>;
    case 'bid':
      return <g stroke="#5a3020" strokeWidth="2.4" strokeLinecap="round">
        <path d="M48 34 h9 M63 34 h9" />
      </g>;
    default:
      return null;
  }
}

export function NpcFigure({ id, emo = 'idle', size = 110, className = '' }: {
  id: NpcId; emo?: NpcEmotion; size?: number; className?: string;
}) {
  const npc = NPCS[id];
  const skin = SKIN[id];
  return (
    <svg viewBox="0 0 120 170" width={size} className={`npc-fig emo-${emo} ${className}`}
      xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="163" rx="38" ry="6" fill="#000" opacity=".3" />
      <g className="body-g">
        {/* левая рука (статичная) */}
        <path d="M34 96 Q26 120 30 142" stroke={npc.look.coat} strokeWidth="11" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="144" r="6" fill={skin} />
        <Body npc={npc} id={id} />
        {/* правая рука (поднимается при ставке) */}
        <g className="arm-r">
          <path d="M86 96 Q94 120 90 142" stroke={npc.look.coat} strokeWidth="11" fill="none" strokeLinecap="round" />
          <circle cx="90" cy="144" r="6" fill={skin} />
        </g>
      </g>
      <g className="head-g">
        <circle cx="60" cy="44" r="26" fill={skin} />
        <g transform="translate(60,44) scale(0.372) translate(-100,-100)"
          dangerouslySetInnerHTML={{ __html: faceInner(npc.face) }} />
        <EmoLayer id={id} emo={emo} />
        {emo === 'bid' && <g>
          <rect x="88" y="8" width="16" height="12" rx="2" fill="#d9b23f" transform="rotate(12 96 14)" />
          <text x="96" y="17" fontSize="8" textAnchor="middle" fill="#3a2c1d" fontWeight="bold" transform="rotate(12 96 14)">+1</text>
        </g>}
      </g>
    </svg>
  );
}

/** ведущий аукциона (нейтральный персонаж с молотком) */
export function Auctioneer({ strike, size = 120 }: { strike?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 160 170" width={size} className={`auctioneer ${strike ? 'strike' : ''}`}
      xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M50 96 Q80 84 110 96 L118 160 L42 160 Z" fill="#4a3620" />
        <path d="M68 96 L80 118 L92 96 L80 104 Z" fill="#efe3cc" />
        <path d="M70 104 q10 7 20 0 q-3 10 -10 10 q-7 0 -10 -10" fill="#8a2c1c" />
      </g>
      <circle cx="80" cy="52" r="26" fill="#e8c9a8" />
      <path d="M54 46 q26 -22 52 0 q-8 -30 -26 -30 q-18 0 -26 30" fill="#3a3f45" />
      <circle cx="71" cy="52" r="9" fill="none" stroke="#8d887c" strokeWidth="2.4" />
      <circle cx="89" cy="52" r="9" fill="none" stroke="#8d887c" strokeWidth="2.4" />
      <path d="M80 52 h0" stroke="#8d887c" strokeWidth="2.4" />
      <circle cx="71" cy="52" r="2.4" fill="#3a2c1d" /><circle cx="89" cy="52" r="2.4" fill="#3a2c1d" />
      <path d="M72 68 q8 5 16 0" stroke="#5a3020" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M60 74 q20 14 40 0" stroke="#8d887c" strokeWidth="4" fill="none" />
      {/* рука с молотком */}
      <g className="gavel-arm">
        <path d="M112 100 Q132 104 136 88" stroke="#4a3620" strokeWidth="11" fill="none" strokeLinecap="round" />
        <circle cx="137" cy="86" r="6" fill="#e8c9a8" />
        <rect x="130" y="60" width="8" height="26" rx="3" fill="#8a6a48" />
        <rect x="122" y="52" width="24" height="13" rx="4" fill="#6e4f33" stroke="#4a3620" strokeWidth="2" />
      </g>
    </svg>
  );
}
