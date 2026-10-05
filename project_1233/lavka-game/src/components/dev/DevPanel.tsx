/* DevPanel.tsx — dev-режим (?dev=1): метрики телеметрии (включая IMS), CSV-экспорт
   + быстрые действия: деньги, запчасти, предметы, уровни, день, реставрация,
   форс конкретного аукциона/лота, скорость, сброс. */
import React, { useEffect, useState } from 'react';
import { game, useGame } from '../../app/store';
import { Telemetry } from '../../game/telemetry';
import { SFX } from '../../game/sfx';
import { SDK } from '../../game/sdk';
import { CONFIG } from '../../game/data/config';
import { ITEMS } from '../../game/data/items';
import { HOUSES } from '../../game/data/world';
import type { HouseId, PartId } from '../../game/types';

const ALL_PARTS: Record<PartId, number> = {
  universal: 3, electronic: 3, mechanical: 3, polish: 3, knob: 2, belt: 2, pendulum: 2, lens: 2
};

export function DevPanel() {
  const s = useGame();
  // свёрнут по умолчанию на ЛЮБОЙ ширине: открытая панель перекрывала кнопки
  // операций в правой колонке верстака (playtest с ?dev=1 страдал первым)
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const [forceHouse, setForceHouse] = useState<HouseId>('city');
  const [forceItem, setForceItem] = useState<string>('radio');

  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const m = Telemetry.metrics();
  const c = Telemetry.counters() as any;
  const last = Telemetry.buffer().slice(-8).reverse();

  if (!open) {
    return <button className="icon-btn dev-toggle" onClick={() => setOpen(true)}>DEV</button>;
  }

  return (
    <div className="devpanel">
      <b>DEV · {CONFIG.meta.version}</b> · сессия {c.session_s}s
      <button style={{ float: 'right' }} onClick={() => setOpen(false)}>×</button>
      <br />
      день: {s.save.day} · монеты: {s.save.coins} · лавка ур.{s.save.shopLevel} · фаза: {s.phase}<br />
      аукционов: {m.auctions} · ставок/аукцион: {m.bidsPerAuction} · пасов: {m.passes}<br />
      выигрыш лотов: {m.winRate != null ? m.winRate + '%' : '—'} ({m.wins}W/{m.losses}L) · ср.маржа {m.avgMargin ?? '—'}<br />
      ср.макс.ставка: {m.avgPlayerMax ?? '—'} ₽ · пауза день→аукцион: {m.avgGapToNextAuction ?? '—'}s<br />
      точность оценок: {m.estAccuracy != null ? m.estAccuracy + '%' : '—'} (ср.|ошибка| {m.estAvgDiff || '—'})<br />
      <b>IMS: {m.imsScore != null ? m.imsScore + '%' : '—'}</b>
      <span style={{ opacity: .75 }}>
        {' '}(заказ {m.ims.order}/сет {m.ims.set}/улучш {m.ims.improvement}/перепрод {m.ims.resale}/колл {m.ims.collection}/прочее {m.ims.other})
      </span><br />
      сразу продают: {m.sellNowRate != null ? m.sellNowRate + '%' : '—'} · заказы: {s.save.stats.ordersDone} · разборок: {m.disassembled}<br />
      стратегии: as-is {m.restoreStrategies.asis} / quick {m.restoreStrategies.quick} / full {m.restoreStrategies.full} / custom {m.restoreStrategies.custom}<br />
      на запчасти монет: {m.partsCoins} · RV: {m.rv} · inter: {m.inter} · платные улики: {m.clues} · bailouts: {m.bailouts}
      <hr style={{ borderColor: '#333', margin: '6px 0' }} />
      <button onClick={() => game.devGrant(500)}>+500 ₽</button>
      <button onClick={() => game.devGrant(0, ALL_PARTS)}>+запчасти</button>
      <button onClick={() => game.devUnlockAll()}>открыть всё</button>
      <button onClick={() => game.devNextDay()}>день+1</button>
      <button onClick={() => game.devFinishRestore()}>реставрация ✓</button>
      <button onClick={() => Telemetry.exportCSV()}>CSV</button>
      <button onClick={() => { SFX.toggleMute(); force(x => x + 1); }}>звук {SFX.isMuted() ? 'off' : 'on'}</button>
      <button onClick={async () => { await SDK.clearSave(); location.reload(); }}>сброс</button>
      <br />
      <select value={forceItem} onChange={e => setForceItem(e.target.value)} style={{ marginTop: 4 }}>
        {ITEMS.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
      </select>
      <select value={forceHouse} onChange={e => setForceHouse(e.target.value as HouseId)}>
        {(Object.keys(HOUSES) as HouseId[]).map(h => <option key={h} value={h}>{HOUSES[h].name}</option>)}
      </select>
      <button onClick={() => game.devForceDay(forceHouse, forceItem)}>тест-аукцион</button>
      <hr style={{ borderColor: '#333', margin: '6px 0' }} />
      <div style={{ opacity: .7, fontSize: 10 }}>
        {last.map((e, i) => <div key={i}>{Math.round(e.t / 1000)}s {e.event}</div>)}
      </div>
    </div>
  );
}
