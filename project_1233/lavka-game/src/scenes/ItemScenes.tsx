/* ItemScenes.tsx — цепочка предмета:
   UnboxScene — вскрытие упаковки (анимация, предмет «в грязи»);
   WorkbenchScene — осмотр дефектов + реставрация (операции, запчасти, мини-игры, стратегии);
   AppraisalScene — до/после + оценка находки;
   DecisionScene — заказ / NPC-оффер / продажа / коллекция / фикстура / витрина / разборка;
   DealScene — результат сделки + FTUE-урок. */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { game } from '../app/store';
import { ItemSprite } from '../components/art/ItemSprite';
import { Icon, PartIcon } from '../art/core';
import { WorkshopArt } from '../art/scenes/WorkshopArt';
import { Btn, Face, Badge } from '../components/ui/Basics';
import { EraseGame, MosaicGame, RepairGame, CalibrateGame } from '../components/minigames/Minigames';
import { CONFIG } from '../game/data/config';
import { FACES, FIXTURES, NPCS, PACK_SVG, SETS } from '../game/data/world';
import { ITEMS_BY_ID } from '../game/data/items';
import { DEFECTS, PARTS } from '../game/data/parts';
import * as E from '../game/economy';
import { Goals } from '../game/systems/goals';
import { OrdersSystem } from '../game/systems/orders';
import { RestorationSystem } from '../game/systems/restoration';
import type { DefectInst, PartId } from '../game/types';

const condText = (c: number) => c < 0.85 ? 'потрёпанное' : c > 1.12 ? 'отличное' : 'обычное';

const DEFECT_ICON: Record<string, 'cloth' | 'wrench' | 'hammer' | 'gear' | 'key' | 'bulb' | 'clock'> = {
  dirt: 'cloth', dust: 'cloth', rust: 'wrench', scratches: 'cloth', worn: 'cloth',
  crack: 'hammer', broken_mech: 'gear', missing_part: 'key', consumable: 'bulb', calibration: 'clock',
};

/* ================= вскрытие ================= */
export function UnboxScene() {
  const s = game.getSnapshot();
  const lot = s.lot!;
  const item = ITEMS_BY_ID[lot.itemId];
  const [stage, setStage] = useState<'shake' | 'open'>('shake');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('open'), 1500);
    timers.current.push(t1);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  function advance() { game.unboxContinue(); }

  const dust = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    left: 35 + ((i * 37) % 30), top: 40 + ((i * 53) % 18),
    delay: (i * 0.11).toFixed(2), dur: (1.1 + (i % 5) * 0.22).toFixed(2)
  })), []);

  return (
    <div className="scene unbox-scene" onClick={stage === 'open' ? advance : () => setStage('open')}>
      <UnboxArt />
      <div className="unbox-stage">
        <div className={`unbox-rays ${stage === 'open' ? 'on' : ''}`} />
        <div className={`unbox-pack ${stage === 'open' ? 'opened' : ''}`}
          dangerouslySetInnerHTML={{ __html: PACK_SVG[lot.packId] || PACK_SVG.crate }} />
        {stage === 'open' && dust.map((d, i) => (
          <span key={i} className="dust-p" style={{
            left: d.left + '%', top: d.top + '%',
            animation: `sparkUp ${d.dur}s ${d.delay}s ease-out forwards`
          }} />
        ))}
        <div className={`unbox-item ${stage === 'open' ? 'show' : ''}`}>
          <ItemSprite id={item.id} svg={item.svg} defects={lot.defects} seed={lot.seed}
            className={item.rarity === 'legend' ? 'r-legend-glow' : item.rarity === 'epic' ? 'r-epic-glow' : ''} />
        </div>
        {stage === 'open' && (
          <div className="unbox-caption">
            {item.name} <span className="dim" style={{ fontSize: 14 }}>· состояние {condText(lot.cond)}</span>
          </div>
        )}
      </div>
      <div className="unbox-skip">{stage === 'open' ? 'нажмите — отнести на верстак' : 'нажмите, чтобы вскрыть'}</div>
    </div>
  );
}

/* фон вскрытия: стол под лампой в тёмной комнате */
function UnboxArt() {
  return (
    <svg className="unbox-bg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ub-room" cx=".5" cy=".42" r=".75">
          <stop offset="0" stopColor="#4a3626" /><stop offset=".7" stopColor="#241a12" /><stop offset="1" stopColor="#17100a" />
        </radialGradient>
        <linearGradient id="ub-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity=".3" /><stop offset="1" stopColor="#ffe9a3" stopOpacity=".03" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#ub-room)" />
      <path d="M0 430 h800 v170 H0z" fill="#3a2c1d" />
      {Array.from({ length: 8 }).map((_, i) => <path key={i} d={`M${i * 110} 430 L${i * 130 - 60} 600`} stroke="#241a12" strokeWidth="3" opacity=".6" />)}
      {/* стол */}
      <rect x="180" y="392" width="440" height="20" rx="6" fill="url(#g-wood)" />
      <rect x="200" y="412" width="22" height="120" fill="#57432c" />
      <rect x="578" y="412" width="22" height="120" fill="#57432c" />
      <rect x="200" y="470" width="400" height="10" fill="#4a3620" opacity=".8" />
      {/* лампа */}
      <path d="M400 0 v96" stroke="#1a120b" strokeWidth="6" />
      <path d="M356 128 q44 -40 88 0z" fill="#b5533c" />
      <path d="M356 128 q44 12 88 0" stroke="#7c3a2a" strokeWidth="3" fill="none" />
      <circle cx="400" cy="132" r="10" fill="#ffe9a3" />
      <circle cx="400" cy="150" r="110" fill="url(#g-lampglow)" />
      <path d="M352 138 L250 396 h300 L448 138z" fill="url(#ub-cone)" />
      {/* табурет и коробка сбоку */}
      <g transform="translate(120 470)"><rect x="-26" y="0" width="52" height="10" rx="4" fill="#6e4f33" /><path d="M-20 10 l-4 60 M20 10 l4 60" stroke="#57432c" strokeWidth="7" /></g>
      <g transform="translate(680 452)"><rect x="-34" y="-30" width="68" height="52" rx="4" fill="#8a6a48" stroke="#5a4632" strokeWidth="2.6" /><path d="M-34 -12 h68" stroke="#5a4632" strokeWidth="2.4" /></g>
      <rect width="800" height="600" fill="url(#g-roomwarm)" pointerEvents="none" />
    </svg>
  );
}

/* ================= верстак ================= */
export function WorkbenchScene() {
  const s = game.getSnapshot();
  const lot = s.lot!;
  const save = s.save;
  const item = ITEMS_BY_ID[lot.itemId];
  const ops = s.workbenchOps || [];
  const activeOp = s.activeOp;
  const [showBefore, setShowBefore] = useState(false);
  const defects = lot.defects || [];
  const p = RestorationSystem.progress(defects);
  const q = RestorationSystem.qualityFor(defects);
  const allDone = defects.every(d => d.resolved);
  const isJunk = item.value[1] <= 30;
  const beforeDefects: DefectInst[] = useMemo(
    () => defects.map(d => ({ ...d, resolved: false })),
    [defects.length]);

  return (
    <div className="scene wb-scene">
      <WorkshopArt portrait={window.matchMedia('(orientation: portrait)').matches} />
      <div className="scene-head" style={{ padding: '8px 14px 0', zIndex: 5 }}>
        <div className="title" style={{ fontSize: 20, margin: 0 }}><Icon n="wrench" s={17} /> Верстак: {item.name}</div>
        <div className="subtitle" style={{ margin: 0 }}>
          {allDone ? 'Всё решено — можно оценивать' : `Проблем найдено: ${defects.filter(d => !d.resolved).length} из ${defects.length}. Решите, сколько сил и деталей вкладывать.`}
        </div>
      </div>
      <div className="wb-layout">
        <div className="wb-left">
          <Btn small variant="secondary" className="ba-toggle"
            onClick={() => setShowBefore(v => !v)}>
            {showBefore ? 'Показать сейчас' : '👁 Как было'}
          </Btn>
          <div className="wb-item">
            <ItemSprite id={item.id} svg={item.svg} seed={lot.seed}
              defects={showBefore ? beforeDefects : defects} />
          </div>
          <div className="qmeter">
            <div className="bar cliff"><div className="fill" style={{ width: Math.round(p * 100) + '%' }} /></div>
            <div className="lbl">
              Прогресс {Math.round(p * 100)}% · качество {Math.round(q * 100)}% · множитель цены ×{(0.6 + 0.6 * q).toFixed(2)}
              {p <= CONFIG.restore.qFrom && p > 0 && <span style={{ color: 'var(--red)' }}> (нужно ≥60%, иначе как «без реставрации»)</span>}
            </div>
          </div>
        </div>
        <div className="wb-right">
          {/* дефекты */}
          {defects.map((d, i) => {
            const def = DEFECTS[d.id];
            const costParts = (Object.keys(d.cost) as PartId[]);
            return (
              <div className={`defect-card ${d.resolved ? 'done' : ''}`} key={i}>
                <div className="d-icon"><Icon n={DEFECT_ICON[d.id] || 'wrench'} s={18} /></div>
                <div style={{ minWidth: 0 }}>
                  <b>{d.id === 'missing_part' ? `Нет детали: ${d.partName}` : def.name} {d.resolved && '✓'}</b>
                  <div className="d-hint">{def.hint}</div>
                  {costParts.length > 0 && !d.resolved && (
                    <div className={`d-cost ${RestorationSystem.canAfford(save, d.cost) ? '' : 'missing'}`}>
                      нужно:{' '}{costParts.map((pid, k) => (
                        <span key={pid}>{k > 0 && ', '}<PartIcon p={pid} s={12} /> {d.part && d.id === 'missing_part' ? d.partName : PARTS[pid].name} ×{d.cost[pid]}</span>
                      ))}{' '}
                      {RestorationSystem.canAfford(save, d.cost) ? '' : '— нет в запасе!'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* операции */}
          {ops.length > 0 && <div className="subtitle" style={{ margin: '4px 0 0', fontFamily: 'var(--font)' }}>Операции</div>}
          {ops.map((op, i) => (
            <div className="op-card" key={i}>
              <div style={{ minWidth: 0 }}>
                <div className="op-name">{op.verb} <span className="dim" style={{ fontWeight: 400 }}>({op.name})</span></div>
                <div className="op-desc">{op.desc}{op.lockedBy ? ` · 🔒 ${op.lockedBy}` : ''}</div>
                {op.costCoins > 0 && (
                  <div className={`op-cost ${op.affordable ? '' : 'missing'}`}>
                    запчасти: {(Object.keys(op.cost) as PartId[]).map(pid => `${PARTS[pid].icon}×${op.cost[pid]}`).join(' ')}
                    {op.affordable ? '' : ' — не хватает'}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Btn small variant={op.affordable && !op.lockedBy ? 'gold' : 'secondary'}
                  disabled={op.lockedBy ? true : undefined}
                  onClick={() => op.affordable ? game.startOp(op) : game.goParts()}>
                  {op.affordable ? op.verb : <><Icon n="cart" s={14} /> К Шпулю</>}
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="wb-bottom">
        {isJunk && <Btn variant="secondary" onClick={() => game.quickWipe()}><Icon n="cloth" s={15} /> Быстро обтереть (хлам же)</Btn>}
        <Btn variant="danger" onClick={() => game.sellAsIs()}><Icon n="coin" s={15} /> Продать как есть (×0.6)</Btn>
        <Btn variant="secondary" onClick={() => game.autoRestoreAd()}><Icon n="film" s={15} /> Идеально (реклама{save.autoRestore.date === new Date().toISOString().slice(0, 10) ? `, ${save.autoRestore.count}/${CONFIG.ads.rewarded.auto_restore}` : ''})</Btn>
        <Btn big variant="gold" onClick={() => game.finishRestore()}>
          {allDone ? <><Icon n="spark" s={16} /> Оценить находку</> : 'Готово → Оценить'}
        </Btn>
      </div>

      {/* активная мини-игра */}
      {activeOp && (
        <div className="mg-overlay">
          {activeOp.minigame === 'erase' && (
            <EraseGame itemSvg={item.svg} type={activeOp.op === 'polish' ? 'polish' : 'clean'}
              fast={isJunk} onDone={perf => game.finishOp(perf)} />
          )}
          {activeOp.minigame === 'mosaic' && (
            <MosaicGame itemSvg={item.svg} itemId={item.id} onDone={perf => game.finishOp(perf)} />
          )}
          {activeOp.minigame === 'repair' && (
            <RepairGame itemSvg={item.svg} seed={lot.seed + activeOp.defects.length}
              partName={activeOp.defects[0].id === 'missing_part' ? (activeOp.defects[0].partName || 'деталь') : 'узел'}
              partIcon={activeOp.defects[0].id === 'missing_part' && activeOp.defects[0].part ? PARTS[activeOp.defects[0].part!].icon : '⚙️'}
              onDone={perf => game.finishOp(perf)} />
          )}
          {activeOp.minigame === 'calibrate' && (
            <CalibrateGame onDone={perf => game.finishOp(perf)} />
          )}
        </div>
      )}
    </div>
  );
}

/* ================= оценка находки ================= */
export function AppraisalScene() {
  const s = game.getSnapshot();
  const lot = s.lot!;
  const item = ITEMS_BY_ID[lot.itemId];
  const estOk = (lot as any)._estOk as boolean | undefined;
  return (
    <div className="scene result-scene">
      <div className={`item-card-big r-${item.rarity}`}>
        <div className="ba-compare">
          <div className="ba-side">
            <ItemSprite id={item.id} svg={item.svg} size={120} seed={lot.seed}
              defects={(lot.defects || []).map(d => ({ ...d, resolved: false }))} />
            <small>как нашли</small>
          </div>
          <div className="ba-arrow">→</div>
          <div className="ba-side">
            <ItemSprite id={item.id} svg={item.svg} size={120} seed={lot.seed}
              defects={lot.defects}
              className={item.rarity === 'legend' ? 'r-legend-glow' : ''} />
            <small>после работ</small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
          <span className={`badge r-${item.rarity}`}>{CONFIG.rarityLabels[item.rarity]}</span>
          <div className="item-name" style={{ margin: 0 }}>{item.name}</div>
        </div>
        <div className="item-story">{item.story}</div>
        <div className="calc-line">
          база {lot.base} × состояние {lot.cond} ({condText(lot.cond)}) × реставрация {Math.round(E.priceMultiplier(lot.q ?? 0) * 100)}% = <b>{lot.sale} ₽</b>
        </div>
        {lot.estimateBand != null && estOk != null && (
          <div className="hint">
            {estOk
              ? <>✅ Точная оценка ({E.bandLabel(lot.estimateBand)}): <b style={{ color: '#a8d0a0' }}>+{CONFIG.economy.estimateReward} ₽</b></>
              : <>Оценка мимо: вы ставили {E.bandLabel(lot.estimateBand)}, правда — {E.bandLabel(E.bandOf(lot.trueValue))}</>}
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 12 }}>
          <Btn big variant="gold" onClick={() => game.appraisalContinue()}>Что делать с находкой?</Btn>
        </div>
      </div>
    </div>
  );
}

/* ================= решение ================= */
export function DecisionScene() {
  const s = game.getSnapshot();
  const lot = s.lot!;
  const save = s.save;
  const item = ITEMS_BY_ID[lot.itemId];
  const dup = game.isDup();
  const ord = OrdersSystem.matching(save, item);
  const keep = E.keepValue(lot.sale || 0);
  const fixtureDef = item.fixture ? (FIXTURES.find(f => f.item === item.id) || null) : null;
  const vitrineSlots = CONFIG.shop[Goals.shopLevel(save)].vitrine || 0;
  const canVitrine = item.rarity === 'legend' && (save.vitrine || []).length < vitrineSlots && !dup;
  const offer = s.buyerOffer;
  const yieldP = item.yieldParts;

  if (dup) {
    const v = E.dupValue(lot.sale || 0);
    return (
      <div className="scene result-scene">
        <div className="item-card-big">
          <ItemSprite id={item.id} svg={item.svg} size={120} className="sprite-dirty" style={{ margin: '0 auto' }} />
          <div className="item-name">Такое уже есть в лавке</div>
          <div className="item-story">Коллекционеры берут дубликат за {v} ₽ — полка не резиновая.</div>
          <Btn big variant="gold" onClick={() => game.decideSellDup()}>Продать дубликат за {v} ₽</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="scene result-scene">
      <div className={`item-card-big r-${item.rarity}`} style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <ItemSprite id={item.id} svg={item.svg} size={100} defects={lot.defects} seed={lot.seed} />
          <div>
            <div className="item-name" style={{ margin: 0 }}>{item.name}</div>
            <div className="hint">рыночная цена сегодня: <b style={{ color: 'var(--gold)' }}>{lot.sale} ₽</b></div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
              {item.set && <Badge cls="set"><Icon n="star" s={11} /> набор «{SETS[item.set].name}» {Goals.setOwned(save, item.set)}/{SETS[item.set].need}</Badge>}
              {ord && <Badge cls="order"><Icon n="note" s={11} /> заказ {ord.who} ×{CONFIG.economy.orderMult[ord.mult]}</Badge>}
            </div>
          </div>
        </div>

        {/* NPC-оффер дня */}
        {offer && (
          <div className="npc-offer">
            <div className="face-sm"><Face svg={FACES[NPCS[offer.npc].face]} size={52} /></div>
            <div style={{ flex: 1 }}>
              <b>{offer.name} зашёл в лавку:</b> <i>«{offer.phrase}»</i>
              <div className="hint">Предлагает {offer.price} ₽ ({offer.premium > 1 ? '+' : ''}{Math.round((offer.premium - 1) * 100)}% к рынку)</div>
            </div>
            <Btn small variant="gold" onClick={() => game.decideNpcOffer()}>Отдать</Btn>
          </div>
        )}

        <div className="decision-grid">
          {ord && (
            <button className="btn gold wide" onClick={() => game.decideOrder(ord.id)}>
              <Icon n="note" s={15} /> Отдать {ord.whoDat} за {E.orderPayout(ord, lot.sale || 0, save)} ₽
            </button>
          )}
          <button className="btn" onClick={() => game.decideSell()}><Icon n="coin" s={15} /> Продать за {lot.sale} ₽</button>
          <button className="btn secondary" onClick={() => game.decideKeep()}><Icon n="home" s={15} /> В коллекцию (+{keep} ₽)</button>
          {fixtureDef && !(save.fixtures || []).includes(item.id) && (
            <button className="btn secondary" onClick={() => game.decideFixture()}><Icon n="wrench" s={15} /> Установить: {fixtureDef.name}</button>
          )}
          {canVitrine && (
            <button className="btn secondary" onClick={() => game.decideVitrine()}><Icon n="spark" s={15} /> В витрину (+8% продаж)</button>
          )}
          {yieldP && (
            <button className="btn secondary wide" onClick={() => game.decideDisassemble()}>
              <Icon n="wrench" s={15} /> Разобрать на запчасти:{' '}
              {(Object.keys(yieldP) as PartId[]).map(pid => <span key={pid}><PartIcon p={pid} s={12} /> {PARTS[pid].name} ×{yieldP[pid]} </span>)}
            </button>
          )}
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          Коллекция: предмет встанет на полку лавки — вы будете видеть его каждый день.
        </div>
      </div>
    </div>
  );
}

/* ================= сделка ================= */
export function DealScene() {
  const s = game.getSnapshot();
  const deal = s.deal!;
  const lot = s.lot!;
  const save = s.save;
  const item = ITEMS_BY_ID[deal.itemId];
  return (
    <div className="scene result-scene">
      <div className="item-card-big">
        <ItemSprite id={item.id} svg={item.svg} size={110} style={{ margin: '0 auto' }}
          className={item.rarity === 'legend' ? 'r-legend-glow' : ''} />
        <div className="result-big delta-plus">{deal.text}</div>
        <div className="hint">
          Монеты: <b>{save.coins}</b> · Полки лавки: <b>{Object.keys(save.owned).length}/{game.ITEMS.length}</b>
          {lot.price > 0 && deal.kind === 'sell' && <> · куплено за {lot.price} ₽</>}
        </div>
        {s.ftueStep === 'lesson' && (
          <div className="lesson-card">
            💡 Вот и весь секрет: на аукционе покупаете дёшево — заказы, наборы и нужные люди делают находки дорогими.
            А верстак и запчасти превращают хлам в ценность. Завтра лавка откроется по-взрослому.
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 14 }}>
          <Btn big variant="gold" onClick={() => game.dealContinue()}>К торгам →</Btn>
        </div>
      </div>
    </div>
  );
}
