/* CityArt.tsx — обёртка города: публичный API прежний (CityArt, cityBuildings),
   вся карта живёт в src/art/city/* (kit, people, buildings, CityMap). */
import React from 'react';
import { CityMapDesktop, CityMapPortrait, cityAnchors, CityAnchor } from '../city/CityMap';

export type { CityAnchor };
export { cityAnchors };

/** Якоря интерактивных зданий в координатах арт-пространства (для camera move). */
export function cityBuildings(portrait: boolean): CityAnchor[] {
  return cityAnchors(portrait);
}

export function CityArt({ lockedIds, onSelect, portrait = false }: {
  lockedIds: Set<string>;
  onSelect: (id: string, el: SVGGElement | null) => void;
  portrait?: boolean;
}) {
  return (
    <svg className="city-svg" viewBox={portrait ? '0 0 800 1400' : '0 0 1600 900'}
      preserveAspectRatio="xMidYMid slice"
      onClick={e => {
        const g = (e.target as Element).closest('.building');
        if (g) onSelect(g.getAttribute('data-id')!, g as unknown as SVGGElement);
      }}>
      {portrait ? <CityMapPortrait lockedIds={lockedIds} /> : <CityMapDesktop lockedIds={lockedIds} />}
    </svg>
  );
}
