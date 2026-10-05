/* TopBar.tsx — кошелёк, день, место, звук. Минимален: сначала объект и действие, потом информация. */
import React, { useEffect, useRef, useState } from 'react';
import { game } from '../../app/store';
import { SFX } from '../../game/sfx';
import { HOUSES } from '../../game/data/world';

const TITLES: Record<string, string> = {
  intro: '', shop: 'Лавка', city: 'Город', parts: 'Запчасти «У Шпуля»',
  hall: 'Аукцион', bidding: 'Торги', unbox: 'Находка', workbench: 'Верстак',
  appraisal: 'Оценка', decision: 'Решение', deal: 'Сделка', loss: 'Лот ушёл',
  dayResult: 'Итоги дня', album: 'Альбом'
};

export function TopBar() {
  const s = game.getSnapshot();
  const [muted, setMuted] = useState(SFX.isMuted());
  const [bump, setBump] = useState(false);
  const prevCoins = useRef(s.save.coins);

  useEffect(() => {
    if (s.save.coins !== prevCoins.current) {
      prevCoins.current = s.save.coins;
      setBump(true);
      const t = setTimeout(() => setBump(false), 380);
      return () => clearTimeout(t);
    }
  }, [s.save.coins]);

  const hide = s.phase === 'intro' || s.phase === 'unbox';
  if (hide) return null;

  let title = TITLES[s.phase] || '';
  if ((s.phase === 'hall' || s.phase === 'bidding' || s.phase === 'loss') && s.day) title = HOUSES[s.day.houseId].name;

  return (
    <div className="topbar">
      <div className={`wallet ${bump ? 'bump' : ''}`}>
        <span className="coin" />
        <span id="coins">{s.save.coins}</span>
      </div>
      {title && <div className="top-title">{title}</div>}
      <div className="spacer" />
      <div className="day-chip">День {s.save.day}</div>
      <button className="icon-btn" title="звук"
        onClick={() => setMuted(SFX.toggleMute())}>
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
