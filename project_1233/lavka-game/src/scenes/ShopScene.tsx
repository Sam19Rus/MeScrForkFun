/* ShopScene.tsx — ФИЗИЧЕСКАЯ лавка: интерьер, полки с предметами, витрина, фикстуры,
   доска заказов (карточки-«пинны»), рабочий стол, покупатель дня, развитие лавки.
   Альбом — коллекция с визуальными наборами. */
import React, { useMemo } from 'react';
import { game } from '../app/store';
import { ShopArt, SHOP_SLOTS, FIXTURE_SPOTS, VITRINE_SPOT } from '../art/scenes/ShopArt';
import { ItemSprite } from '../components/art/ItemSprite';
import { NpcFigure } from '../components/art/NpcFigure';
import { Btn } from '../components/ui/Basics';
import { Icon, PartIcon } from '../art/core';
import { Portrait } from '../art/chars';
import { CONFIG } from '../game/data/config';
import { CATS, FACES, NPCS, SETS } from '../game/data/world';
import { ITEMS, ITEMS_BY_ID } from '../game/data/items';
import { PARTS } from '../game/data/parts';
import { Goals } from '../game/systems/goals';
import { OrdersSystem } from '../game/systems/orders';
import type { PartId, Save } from '../game/types';

/* позиции карточек заказов задаёт .order-board (CSS) */

function ownedList(save: Save) {
  return Object.keys(save.owned)
    .map(id => ({ id, v: save.owned[id] }))
    .filter(e => e.v !== 'fixture' && e.v !== 'vitrine')
    .sort((a, b) => ((a.v as any).day || 0) - ((b.v as any).day || 0));
}

export function ShopScene() {
  const s = game.getSnapshot();
  const save = s.save;
  const level = Goals.shopLevel(save);
  const up = Goals.canUpgrade(save);
  const items = ITEMS_BY_ID;
  const owned = useMemo(() => ownedList(save), [save.owned, save.day]);
  const buyer = save.buyerToday ? NPCS[save.buyerToday.npc] : null;
  const slots = CONFIG.shop[level].vitrine || 0;

  return (
    <div className="scene shop-scene">
      <ShopArt level={level} />
      <div className="shop-layer">
        {/* доска заказов: карточки-«пинны» на пробковой доске */}
        <div className="order-board">
          {(save.orders || []).map((o, i) => {
            const daysLeft = o.id === 'ftue' ? 1 : o.deadline - save.day;
            return (
              <div className="order-pin paper-card" key={o.id}>
                <div className="order-head">
                  <div className="order-face"><Portrait face={o.face} size={34} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div className="order-who" style={{ fontSize: 12.5 }}>{o.who}</div>
                    <div style={{ fontSize: 10.5, color: '#6e5a3c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      ищет: {OrdersSystem.wantLabel(o.want)}
                    </div>
                  </div>
                </div>
                <div className="order-text" style={{ fontSize: 11 }}>{o.text}</div>
                <div className="order-meta" style={{ fontSize: 10.5 }}>
                  <span className="order-pay">×{CONFIG.economy.orderMult[o.mult]}{Goals.setActive(save, 'tech') && o.want.cat === 'tech' ? ' (+сет)' : ''}</span>
                  <span className={`order-days ${daysLeft <= 1 ? 'urgent' : ''}`}>{o.id === 'ftue' ? 'сегодня!' : `${daysLeft} дн.`}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* предметы на полках */}
        {owned.map((e, i) => {
          const spot = SHOP_SLOTS[i % SHOP_SLOTS.length];
          const it = items[e.id];
          if (!it) return null;
          return (
            <div className="shelf-item" key={e.id + '_' + i}
              style={{ left: `calc(${spot.x}% - 26px)`, top: `calc(${spot.y}% - 46px)` }}
              title={it.name}
              onClick={() => game.toast(`${it.name}${typeof e.v === 'object' ? ` · качество ${Math.round(e.v.q * 100)}%` : ''}`)}>
              <ItemSprite id={it.id} svg={it.svg} size={52} />
            </div>
          );
        })}

        {/* фикстуры — физически в интерьере */}
        {(save.fixtures || []).map(fid => {
          const spot = FIXTURE_SPOTS[fid];
          const it = items[fid];
          if (!spot || !it) return null;
          return (
            <div className="shelf-item" key={fid}
              style={{ left: `calc(${spot.x}% - ${spot.s / 2}px)`, top: `calc(${spot.y}% - ${spot.s / 2}px)`, width: spot.s, height: spot.s }}
              title={it.name}
              onClick={() => game.toast(it.name)}>
              <ItemSprite id={it.id} svg={it.svg} size={spot.s} />
            </div>
          );
        })}

        {/* витрина */}
        {level >= 2 && (save.vitrine || []).map((vid, i) => {
          const it = items[vid];
          if (!it) return null;
          return (
            <div className="shelf-item r-legend-glow" key={vid}
              style={{ left: `calc(${VITRINE_SPOT.x}% - ${VITRINE_SPOT.s / 2}px + ${i * 34}px)`, top: `calc(${VITRINE_SPOT.y}% - ${VITRINE_SPOT.s / 2}px)`, width: VITRINE_SPOT.s, height: VITRINE_SPOT.s }}
              onClick={() => game.toast(`${it.name} — жемчужина витрины (+8% продаж)`)}>
              <ItemSprite id={it.id} svg={it.svg} size={VITRINE_SPOT.s} />
            </div>
          );
        })}

        {/* покупатель дня */}
        {buyer && (
          <div className="buyer-stand" style={{ left: '60%', top: '48%' }}>
            <div className="bubble-static">{CONFIG.buyers[save.buyerToday!.npc]!.phrase}</div>
            <NpcFigure id={save.buyerToday!.npc} emo="idle" size={104} />
            <div className="npc-name">{buyer.name}</div>
          </div>
        )}

        {/* HUD слева снизу: развитие + наборы + запчасти */}
        <div className="shop-hud">
          {up && (
            <div className="panel" style={{ maxWidth: 300, padding: '8px 12px' }}>
              <b style={{ fontFamily: 'var(--font)', fontSize: 13.5 }}><Icon n="star" s={13} /> Развитие лавки → «{up.next.name}»</b>
              <div className="hint" style={{ margin: '3px 0 6px', fontSize: 12 }}>
                {up.ok ? 'Всё готово к открытию!' : 'Нужно: ' + (up.reqs || []).join('; ')}
              </div>
              {up.ok && <Btn variant="gold" small onClick={() => game.upgradeShop()}>Открыть за {up.next.cost} ₽</Btn>}
            </div>
          )}
          <div className="sets-strip">
            {(Object.keys(SETS) as (keyof typeof SETS)[]).map(sid => {
              const got = Goals.setOwned(save, sid);
              const need = SETS[sid].need;
              return (
                <div className={`set-plaque ${got >= need ? 'done' : ''}`} key={sid} title={SETS[sid].bonus}>
                  <Icon n="star" s={12} /> <b>{got}/{need}</b>{got >= need ? ' ✓' : ''}
                </div>
              );
            })}
          </div>
          <div className="parts-chip" onClick={() => game.goToCity()} title="В город — магазин запчастей">
            <Icon n="gear" s={13} /> Запчасти:{' '}
            {(Object.keys(save.parts) as PartId[]).filter(p => save.parts[p] > 0).map(p => <span key={p}><PartIcon p={p} s={12} />{save.parts[p]} </span>) || 'пусто'}
          </div>
          <div className="parts-chip" style={{ cursor: 'default' }}>
            <Icon n="home" s={13} /> {CONFIG.shop[level].name} · альбом {Object.keys(save.owned).length}/{ITEMS.length}
          </div>
        </div>

        {/* выход */}
        <div className="shop-exit">
          <Btn big variant="gold" onClick={() => game.goToCity()}><Icon n="door" s={18} /> В город</Btn>
        </div>
        <div className="shop-side-btns">
          <Btn variant="secondary" small onClick={() => game.openAlbum()}><Icon n="book" s={14} /> Альбом</Btn>
        </div>

        {/* FTUE-подсказка дня 1 */}
        {!save.ftue.done && save.day === 1 && (
          <>
            <div className="ftue-arrow" style={{ left: '46%', bottom: '70px' }}>⬇</div>
            <div className="city-goal-chip">
              <b>Иваныч ждёт ретротехнику!</b> В городе откройте <b>Городской склад</b> — там утренние торги.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= Альбом ================= */
export function AlbumScene() {
  const s = game.getSnapshot();
  const save = s.save;
  const titles: Record<string, string> = {
    tech: 'Советская электроника (набор)', clocks: 'Мастер и приборы (набор)',
    home: 'Уютный дом (набор)', free: 'Разности'
  };
  return (
    <div className="scene" style={{ overflowY: 'auto', padding: '14px 16px' }}>
      <div className="title">📖 Альбом лавки</div>
      <div className="subtitle">Коллекция и наборы. Предметы из наборов живут у вас на полках.</div>
      {(['tech', 'clocks', 'home', 'free'] as const).map(cat => {
        const catItems = ITEMS.filter(i => i.cat === cat);
        const ownedN = catItems.filter(i => save.owned[i.id]).length;
        const setId = cat === 'free' ? null : cat;
        return (
          <div className="album-sec" key={cat}>
            <div className="sec-title">{CATS[cat].icon} {titles[cat]} — {ownedN}/{catItems.length}</div>
            {setId && (
              <div className="set-progress">
                {ITEMS.filter(i => i.set === setId).map(it => (
                  <div className={`sp-item ${save.owned[it.id] ? 'have' : ''}`} key={it.id} title={it.name}>
                    <div style={{ width: '100%', height: '100%', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: it.svg }} />
                  </div>
                ))}
                <div className={`set-plaque ${Goals.setActive(save, setId) ? 'done' : ''}`} style={{ alignSelf: 'center', marginLeft: 8 }}>
                  {Goals.setOwned(save, setId)}/{SETS[setId].need}<br /><small>{SETS[setId].bonus}</small>
                </div>
              </div>
            )}
            <div className="album-grid">
              {catItems.map(it => {
                const own = save.owned[it.id];
                return (
                  <div className={`album-cell ${own ? 'owned r-' + it.rarity + '-glow' : ''}`} key={it.id}
                    onClick={() => game.toast(own ? `${it.name}${typeof own === 'object' ? ` · качество ${Math.round(own.q * 100)}%` : ''}` : 'Пока не найдено')}>
                    <ItemSprite id={it.id} svg={it.svg} size="100%" className={own ? '' : 'silhouette'} />
                    {own === 'fixture' && <span className="corner">🔧</span>}
                    {own === 'vitrine' && <span className="corner">✨</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{ padding: '10px 0 20px' }}>
        <Btn big onClick={() => game.closeAlbum()}>← В лавку</Btn>
      </div>
    </div>
  );
}
