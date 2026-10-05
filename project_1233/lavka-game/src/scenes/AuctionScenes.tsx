/* AuctionScenes.tsx — зал аукциона (visual quality pass):
   сцена строится ОДНИМ svg-пространством 1600×900 (фон + персонажи + лот в общих
   координатах), поэтому композиция не расслаивается; UI (цена, кнопки, модалки) — поверх.
   Portrait: viewBox сужается до центрального среза, столы и участники перекомпонуются. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { game } from '../app/store';
import { AuctionHallBack, AuctionHallFront, HallSeatTables, hallSeats, lotPos, aucPos } from '../art/scenes/AuctionHallArt';
import { NpcFigure, Auctioneer } from '../art/chars';
import { Btn, Modal, Badge } from '../components/ui/Basics';
import { Icon } from '../art/core';
import { CONFIG } from '../game/data/config';
import { HOUSES, NPCS, PACK_SVG } from '../game/data/world';
import { ITEMS_BY_ID } from '../game/data/items';
import * as E from '../game/economy';
import type { LotInst, NpcId } from '../game/types';

const packName = (id: string) => (CONFIG.packs.find(p => p.id === id) || { name: 'Ящик' }).name;

/* вложенный svg-ящик с явным размером (иначе nested svg растягивается на весь viewport) */
const packNested = (packId: string, w: number) =>
  (PACK_SVG[packId] || PACK_SVG.crate).replace('<svg ', `<svg width="${w}" height="${w}" `);

function usePortrait() {
  const [p, setP] = useState(() => window.matchMedia('(orientation: portrait)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const fn = () => setP(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return p;
}

/* перевод координат сцены (1600×900 / срез 940) в % экрана для HTML-оверлеев */
function useSceneMap(portrait: boolean) {
  const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight - 46 });
  useEffect(() => {
    const fn = () => setDim({ w: window.innerWidth, h: window.innerHeight - 46 });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  const W = portrait ? 940 : 1600, H = 900;
  const A = dim.w / Math.max(1, dim.h);
  const scale = Math.max(dim.w / W, dim.h / H);
  const Vw = dim.w / scale, Vh = dim.h / scale;
  const x0 = (W - Vw) / 2 + (portrait ? 330 : 0), y0 = (H - Vh) / 2;
  return (x: number, y: number) => ({ left: `${((x - x0) / Vw) * 100}%`, top: `${((y - y0) / Vh) * 100}%` });
}

/* перенос слов для SVG-реплик */
function wrapText(s: string, max = 18): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  words.forEach(w => {
    if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  });
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 3);
}

function Bubble({ x, y, text, w = 190 }: { x: number; y: number; text: string; w?: number }) {
  const lines = wrapText(text, 20);
  const h = lines.length * 20 + 16;
  return (
    <g className="svg-bubble" transform={`translate(${x} ${y})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} rx="10" fill="#efe3cc" stroke="#b0a488" strokeWidth="1.6" />
      <path d="M-8 0 l8 10 l8 -10z" fill="#efe3cc" />
      {lines.map((l, i) => (
        <text key={i} textAnchor="middle" y={-h + 22 + i * 20} fontSize="15" fontStyle="italic" fill="#3a2c1d" fontFamily="system-ui, sans-serif">{l}</text>
      ))}
    </g>
  );
}

/* ================= осмотр лотов ================= */
export function HallScene() {
  const s = game.getSnapshot();
  const day = s.day!;
  const house = HOUSES[day.houseId];
  const save = s.save;
  const portrait = usePortrait();
  const modalLot = s.inspectIdx != null ? day.lots[s.inspectIdx] : null;
  const seats = hallSeats(portrait);
  const lot = lotPos(portrait);
  const map = useSceneMap(portrait);

  const roster = useMemo(() => {
    const ids = new Set<NpcId>();
    day.lots.forEach(l => l.npcs.forEach(b => ids.add(b.id)));
    return [...ids];
  }, [day.lots]);

  return (
    <div className="scene hall-scene">
      <svg className="hall-bg" viewBox={portrait ? '330 0 940 900' : '0 0 1600 900'} preserveAspectRatio="xMidYMid slice">
        <AuctionHallBack mode="inspect" portrait={portrait} />
        {/* участники и ящики (desktop — в сцене) */}
        {!portrait && roster.map((id, i) => {
          const t = seats[i % seats.length];
          return (
            <g key={id} transform={`translate(${t.x - 60 * t.s} ${t.y - 192 * t.s}) scale(${t.s})`} className="npc-in-scene">
              <NpcFigure id={id} emo={i === 0 ? 'think' : 'idle'} size={120} />
            </g>
          );
        })}
        {!portrait && day.lots.map((l, i) => {
          const t = seats[i % seats.length];
          return (
            <g key={l.id} className="lot-in-scene" transform={`translate(${t.x - 55 * t.s} ${t.y - 16 - 110 * t.s}) scale(${t.s})`}
              onClick={() => game.openLotModal(i)} style={{ cursor: 'pointer' }}>
              <g dangerouslySetInnerHTML={{ __html: packNested(l.packId, 110) }} />
              {l.estimated && <circle cx="88" cy="14" r="11" fill="url(#g-brass)" stroke="#8a6c1e" strokeWidth="2" />}
              {l.estimated && <path d="M83 14 l4 4 l7 -8" stroke="#4a3610" strokeWidth="2.6" fill="none" />}
            </g>
          );
        })}
        <HallSeatTables portrait={portrait} count={Math.max(day.lots.length, roster.length)} />
        {/* ведущий у подиума */}
        <g transform={`translate(${aucPos(portrait).x - 115} ${aucPos(portrait).y - 168}) scale(1.15)`}>
          <Auctioneer size={200} />
        </g>
        <AuctionHallFront mode="inspect" portrait={portrait} />
      </svg>

      <div className="hall-layer">
        {portrait && (
          <div className="hall-figures">
            {roster.map((id, i) => {
              const t = seats[i % seats.length];
              const pos = map(t.x + 34, t.y + 8);
              return (
                <div key={id} className="hseat" style={{ left: pos.left, top: pos.top }}>
                  <NpcFigure id={id} emo={i === 0 ? 'think' : 'idle'} size={84} />
                </div>
              );
            })}
            {day.lots.map((l, i) => {
              const t = seats[i % seats.length];
              const pos = map(t.x - 34, t.y - 6);
              return (
                <div key={l.id} className="hcrate" style={{ left: pos.left, top: pos.top }} onClick={() => game.openLotModal(i)}>
                  <div style={{ width: 74, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: PACK_SVG[l.packId] || PACK_SVG.crate }} />
                </div>
              );
            })}
          </div>
        )}
        <div className="scene-head center hall-head">
          <div className="title">{house.name}</div>
          <div className="subtitle">Осмотр перед торгами: изучите улики и прикиньте цену. Точная оценка — +{CONFIG.clue.estimateReward} ₽</div>
        </div>
        {/* таблички лотов под ящиками */}
        <div className="hall-lot-tags">
          {day.lots.map((l, i) => {
            const t = seats[i % seats.length];
            const badges = game.lotBadges(l);
            const pos = map(t.x, t.y);
            return (
              <button className={`lot-tag ${l.estimated ? 'estimated' : ''}`} key={l.id}
                style={{ left: pos.left, top: `calc(${pos.top} + 12px)` }}
                onClick={() => game.openLotModal(i)}>
                <span className="lt-n">Лот {i + 1}</span>
                <span className="lt-s">старт ~{l.start} ₽</span>
                <span className="lt-b">{badges.slice(0, 1).map((b, bi) => <Badge key={bi} cls={b.cls}>{b.text}</Badge>)}</span>
              </button>
            );
          })}
        </div>
        <div className="bid-controls hall-controls">
          <Btn big variant="gold" onClick={() => game.startBidding()}><Icon n="hammer" s={18} /> Начать торги</Btn>
          <Btn variant="secondary" onClick={() => game.leaveHall()}><Icon n="arrowL" s={16} /> В город</Btn>
        </div>
      </div>
      {modalLot && s.inspectIdx != null && <LotModal lot={modalLot} idx={s.inspectIdx} />}
    </div>
  );
}

function LotModal({ lot, idx }: { lot: LotInst; idx: number }) {
  const item = ITEMS_BY_ID[lot.itemId];
  const range = game.estimateRangeFor(lot);
  const viewed = (lot.clues || []).filter((c, ci) => c.free || ci < lot.revealedClues).length;
  const paidLeft = (lot.clues || []).filter((c, ci) => !c.free && ci >= lot.revealedClues).length;
  const badges = game.lotBadges(lot);

  return (
    <Modal onClose={() => game.closeLotModal()}>
      <div className="title" style={{ fontSize: 20 }}>Лот {idx + 1} · {packName(lot.packId)}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '6px 0 10px' }}>
        <div style={{ width: 92, height: 92, lineHeight: 0, flex: '0 0 auto' }} dangerouslySetInnerHTML={{ __html: PACK_SVG[lot.packId] || PACK_SVG.crate }} />
        <div>
          <div style={{ fontSize: 14 }}>Старт: <b style={{ color: 'var(--gold)' }}>~{lot.start} ₽</b></div>
          <div className="hint">{item.clues.seller}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
            {badges.map((b, i) => <Badge key={i} cls={b.cls}>{b.text}</Badge>)}
          </div>
        </div>
      </div>
      {(lot.clues || []).map((c, ci) => {
        const visible = c.free || ci < lot.revealedClues;
        return visible ? (
          <div className="clue" key={ci}>
            <Icon n="lens" s={15} /> {c.text}
            {c.sprite && lot.photo && (
              <div style={{ width: 84, height: 84, marginTop: 6, filter: 'brightness(.7) sepia(.5)', lineHeight: 0 }}
                dangerouslySetInnerHTML={{ __html: item.svg }} />
            )}
          </div>
        ) : <div className="clue hidden-clue" key={ci}>▒▒▒ платная улика</div>;
      })}
      {paidLeft > 0 && (
        <Btn variant="secondary" small style={{ marginBottom: 8 }} onClick={() => game.buyExtraClue()}>
          <Icon n="eye" s={14} /> Ещё улика (реклама, {Math.max(0, CONFIG.ads.rewarded.extra_clue - game.cluesPaidToday())}/{CONFIG.ads.rewarded.extra_clue} сегодня)
        </Btn>
      )}
      <div className="est-range">Ваш диапазон по уликам: <b>{range[0]}–{range[1]} ₽</b> <small>(улик: {viewed})</small></div>
      <div className="hint">Ваша оценка (для статистики и +{CONFIG.economy.estimateReward} ₽ за точность):</div>
      <div className="bands">
        {CONFIG.estimateBands.map((b, bi) => (
          <Btn key={bi} className={`band ${lot.estimateBand === bi ? 'sel' : ''}`}
            variant={lot.estimateBand === bi ? 'gold' : 'primary'}
            onClick={() => game.submitEstimate(bi)}>
            {E.bandLabel(bi)}
          </Btn>
        ))}
      </div>
      <Btn variant="secondary" onClick={() => game.closeLotModal()}>Закрыть</Btn>
    </Modal>
  );
}

/* ================= живые торги ================= */
export function BiddingScene() {
  const s = game.getSnapshot();
  const lot = s.lot!;
  const view = s.auction;
  const save = s.save;
  const portrait = usePortrait();
  const badges = game.lotBadges(lot);
  const priceRef = useRef<SVGGElement>(null);
  const prevPrice = useRef(view ? view.price : 0);
  const [tipShown, setTipShown] = useState(false);
  const seats = hallSeats(portrait);
  const lp = lotPos(portrait);
  const ap = aucPos(portrait);
  const map = useSceneMap(portrait);

  useEffect(() => {
    if (!view) return;
    if (view.price !== prevPrice.current) {
      prevPrice.current = view.price;
      const el = priceRef.current;
      if (el) { el.classList.remove('pop'); el.getBoundingClientRect(); el.classList.add('pop'); }
    }
  }, [view && view.price]);

  useEffect(() => {
    if (save.day === 1 && !save.tips?.bid) { setTipShown(true); game.markBidTip(); }
  }, []);

  if (!view) return null;
  const now = Date.now();

  return (
    <div className={`scene hall-scene ${view.gavel ? 'gavel-flash' : ''}`}>
      <svg className="hall-bg" viewBox={portrait ? '330 0 940 900' : '0 0 1600 900'} preserveAspectRatio="xMidYMid slice">
        <AuctionHallBack mode="bid" portrait={portrait} />
        {/* лот на пьедестале под софитом */}
        <g className="lot-on-podium" transform={`translate(${lp.x - 66 * lp.s} ${lp.y - 8 - 132 * lp.s}) scale(${lp.s})`}>
          <g dangerouslySetInnerHTML={{ __html: packNested(lot.packId, 132) }} />
        </g>
        {/* ведущий за подиумом */}
        <g transform={`translate(${ap.x - 115} ${ap.y - 168}) scale(1.15)`} className={view.gavel ? 'auc-strike' : ''}>
          <Auctioneer strike={view.gavel} size={200} />
        </g>
        {/* участники за столами (desktop — в сцене) */}
        {!portrait && lot.npcs.map((b, i) => {
          const nv = view.npcs[b.id];
          if (!nv) return null;
          const t = seats[i % seats.length];
          const bubble = nv.bubble && now < nv.bubbleUntil ? nv.bubble : null;
          return (
            <g key={b.id} className={`seat-g ${!nv.active ? 'out' : ''} ${nv.leader ? 'leader' : ''}`}
              transform={`translate(${t.x - 60 * t.s} ${t.y - 192 * t.s}) scale(${t.s})`}>
              {bubble && <Bubble x={60} y={-4} text={bubble} />}
              <NpcFigure id={b.id} emo={nv.emotion} size={120} />
            </g>
          );
        })}
        <HallSeatTables portrait={portrait} count={lot.npcs.length} />
        {/* таблички статуса на столах (desktop) */}
        {!portrait && lot.npcs.map((b, i) => {
          const nv = view.npcs[b.id];
          if (!nv) return null;
          const t = seats[i % seats.length];
          return (
            <g key={b.id} transform={`translate(${t.x} ${t.y + 6 * t.s}) scale(${t.s})`} className={`seat-g ${!nv.active ? 'out' : ''}`}>
              <rect x="-56" y="0" width="112" height="32" rx="9" fill="#1d140cd9" stroke={nv.leader ? '#d9b23f' : '#57432c'} strokeWidth="1.6" />
              <text textAnchor="middle" y="14" fontSize="13" fill="#efe3cc" fontWeight="bold" fontFamily="system-ui, sans-serif">{NPCS[b.id].name}{nv.wants && NPCS[b.id].loves ? ' ♥' : ''}</text>
              <text textAnchor="middle" y="27" fontSize="11" fill={nv.leader ? '#e8b93f' : '#9a8a70'} fontFamily="system-ui, sans-serif">
                {!nv.active ? 'пас' : nv.leader ? `лидер: ${nv.lastBid}` : (nv.lastBid ? `до ${nv.lastBid}` : 'думает…')}
              </text>
            </g>
          );
        })}
        <AuctionHallFront mode="bid" portrait={portrait} />
        {/* табло цены */}
        <g transform="translate(800 232)">
          <g ref={priceRef} className="price-plaque">
            <rect x="-150" y="-46" width="300" height="86" rx="12" fill="#241a12" stroke="#8a6c1e" strokeWidth="3" />
            <rect x="-142" y="-38" width="284" height="70" rx="9" fill="none" stroke="#57432c" strokeWidth="2" />
            <text textAnchor="middle" y="-2" fontSize="42" fontFamily="Georgia, serif" fill="#e8b93f" fontWeight="bold">{view.price} ₽</text>
            <text textAnchor="middle" y="24" fontSize="14" fill="#9a8a70" fontFamily="system-ui, sans-serif">{lot.price ? `шаг ${view.step} ₽` : 'стартовая цена'}</text>
          </g>
        </g>
      </svg>

      <div className="bid-stage">
        {portrait && (
          <div className="hall-figures">
            {lot.npcs.map((b, i) => {
              const nv = view.npcs[b.id];
              if (!nv) return null;
              const t = seats[i % seats.length];
              const pos = map(t.x, t.y + 8);
              const bubble = nv.bubble && now < nv.bubbleUntil ? nv.bubble : null;
              return (
                <div key={b.id} className={`hseat ${!nv.active ? 'out' : ''} ${nv.leader ? 'leader' : ''}`} style={{ left: pos.left, top: pos.top }}>
                  {bubble && <div className="bubble">«{bubble}»</div>}
                  <NpcFigure id={b.id} emo={nv.emotion} size={92} />
                  <div className="hseat-plate" style={{ borderColor: nv.leader ? '#d9b23f' : undefined }}>
                    <b>{NPCS[b.id].name}{nv.wants && NPCS[b.id].loves ? ' ♥' : ''}</b>
                    <span style={{ color: nv.leader ? '#e8b93f' : undefined }}>
                      {!nv.active ? 'пас' : nv.leader ? `лидер: ${nv.lastBid}` : (nv.lastBid ? `до ${nv.lastBid}` : 'думает…')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="bid-log">
          {view.log.slice(-3).map((x, i) => <div key={i}>— {x}</div>)}
        </div>
        <div className="bid-controls">
          {!view.resolved && view.playerTurn && !view.isLeader && (
            view.canAfford ? (
              <>
                <Btn big variant="gold" onClick={() => game.playerBid()}><Icon n="hammer" s={18} /> Поднять до {view.nextPrice} ₽</Btn>
                <Btn big variant="secondary" onClick={() => game.playerPass()}>Пас</Btn>
              </>
            ) : (
              <>
                <div className="you-hint">Не хватает монет на ставку — придётся пасовать</div>
                <Btn variant="secondary" onClick={() => game.playerPass()}>Пас</Btn>
              </>
            )
          )}
          {!view.resolved && view.playerTurn && view.isLeader && (
            <div className="you-hint">Вы — лидер. Соперники думают…</div>
          )}
          {!view.resolved && !view.playerTurn && view.playerIn && (
            <div className="you-hint dim">Торги идут…</div>
          )}
          {!view.resolved && !view.playerIn && (
            <div className="you-hint">Вы пасуете — смотрите, как торгуются другие</div>
          )}
          {view.resolved && view.winner === 'player' && (
            <div className="you-hint" style={{ color: 'var(--gold)' }}><Icon n="hammer" s={15} /> Молоток! Лот ваш за {view.price} ₽</div>
          )}
        </div>
        {tipShown && (
          <div className="lesson-card bid-lesson">
            <Icon n="bulb" s={16} /> Поднимайте ставку или пасуйте. У каждого соперника свой предел цены — угадывайте его по словам и повадкам и не переплачивайте.
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= экран проигрыша ================= */
export function LossScene() {
  const s = game.getSnapshot();
  const loss = s.loss!;
  const lot = s.lot!;
  const def = lot.winner ? (NPCS as any)[lot.winner] : null;
  const item = ITEMS_BY_ID[lot.itemId];
  const portrait = usePortrait();
  return (
    <div className="scene hall-scene">
      <svg className="hall-bg" viewBox={portrait ? '330 0 940 900' : '0 0 1600 900'} preserveAspectRatio="xMidYMid slice">
        <AuctionHallBack mode="inspect" portrait={portrait} />
        <AuctionHallFront mode="inspect" portrait={portrait} />
      </svg>
      <div className="result-scene hall-layer">
        <div className="item-card-big" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {def && <div style={{ width: 72, flex: '0 0 auto', marginTop: -18 }}><NpcFigure id={lot.winner as NpcId} emo="happy" size={64} /></div>}
            <div>
              <div className="item-name" style={{ margin: 0 }}>{def ? `${def.name} забрал лот` : loss.title}</div>
              {def && <div className="hint">{def.role}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '10px 0' }}>
            <div style={{ width: 64, height: 64, flex: '0 0 auto' }} dangerouslySetInnerHTML={{ __html: item.svg }} />
            <div>
              <b>{item.name}</b>
              <div className="hint">ушёл за {lot.price} ₽ · настоящая стоимость: {lot.trueValue} ₽</div>
            </div>
          </div>
          <div className="item-story" style={{ textAlign: 'left' }}>
            {loss.lines.map((x, i) => <div key={i}>— {x}</div>)}
          </div>
          {loss.estOk != null && (
            <div className="hint" style={{ marginTop: 8 }}>
              {loss.estOk
                ? <>Ваша оценка ({loss.estBandLabel}) верна: <b style={{ color: '#a8d0a0' }}>+{loss.estReward} ₽</b></>
                : <>Оценка ({loss.estBandLabel}) мимо: правда была {E.bandLabel(E.bandOf(lot.trueValue))}</>}
            </div>
          )}
          <div className="btn-row" style={{ marginTop: 14, justifyContent: 'flex-start' }}>
            <Btn big onClick={() => game.lossContinue()}>Следующий лот →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
