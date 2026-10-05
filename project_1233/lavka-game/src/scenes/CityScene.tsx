/* CityScene.tsx — город-диорама: район с перспективой, жизнью и camera move к зданию.
   PartsScene.tsx — магазин запчастей «У Шпуля» (интерьер переработан отдельно). */
import React, { useMemo, useRef, useState } from 'react';
import { game } from '../app/store';
import { CityArt, cityBuildings } from '../art/scenes/CityArt';
import { PartsArt } from '../art/scenes/PartsArt';
import { Btn } from '../components/ui/Basics';
import { Icon, PartIcon } from '../art/core';
import { CITY_BUILDINGS, PARTS, BASIC_PARTS, SPECIAL_PARTS } from '../game/data/parts';
import { CONFIG } from '../game/data/config';
import { Goals } from '../game/systems/goals';
import { OrdersSystem } from '../game/systems/orders';
import { RestorationSystem } from '../game/systems/restoration';
import type { PartId } from '../game/types';

function usePortrait() {
  const [p, setP] = useState(() => window.matchMedia('(orientation: portrait)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const fn = () => setP(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return p;
}

/* арт-координаты → проценты экрана (svg slice): для transform-origin camera move */
function useArtMap(portrait: boolean) {
  const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight - 46 });
  React.useEffect(() => {
    const fn = () => setDim({ w: window.innerWidth, h: window.innerHeight - 46 });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  const W = portrait ? 800 : 1600, H = portrait ? 1400 : 900;
  const scale = Math.max(dim.w / W, dim.h / H);
  const Vw = dim.w / scale, Vh = dim.h / scale;
  const x0 = (W - Vw) / 2, y0 = (H - Vh) / 2;
  return (x: number, y: number) => ({ x: ((x - x0) / Vw) * 100, y: ((y - y0) / Vh) * 100 });
}

export function CityScene() {
  const s = game.getSnapshot();
  const save = s.save;
  const portrait = usePortrait();
  const [zooming, setZooming] = useState<string | null>(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const artMap = useArtMap(portrait);
  const qp = useMemo(() => new URLSearchParams(location.search), []);
  const noui = qp.get('noui') === '1';
  const slowzoom = qp.get('slowzoom') === '1'; // dev-QA: замедленный camera move для скриншотов
  const holdzoom = qp.get('zoompause') === '1'; // dev-QA: стоп-кадр в середине camera move
  const lockedIds = useMemo(() => {
    const set = new Set<string>();
    CITY_BUILDINGS.forEach(b => {
      if (b.house && !Goals.houseUnlocked(save, b.house)) set.add(b.id);
      else if (b.unlockLevel > Goals.shopLevel(save)) set.add(b.id);
    });
    return set;
  }, [save.shopLevel]);

  const goal = useMemo(() => {
    const orders = save.orders || [];
    if (!orders.length) return null;
    const o = [...orders].sort((a, b) => CONFIG.economy.orderMult[b.mult] - CONFIG.economy.orderMult[a.mult])[0];
    return `${o.who}: ${OrdersSystem.wantLabel(o.want)} — выплата ×${CONFIG.economy.orderMult[o.mult]}`;
  }, [save.orders]);

  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef(0);
  const panRef = useRef<HTMLDivElement | null>(null);
  function select(id: string) {
    if (zooming) return;
    if (lockedIds.has(id)) { game.enterBuilding(id); return; }
    const a = cityBuildings(portrait).find(b => b.id === id);
    if (a) setOrigin(artMap(a.x, a.y - 60));
    setZooming(id);
    /* camera move: raf-драйв трансформации (детерминировано на слабых устройствах) */
    const dur = slowzoom ? 1600 : 480;
    const t0 = performance.now();
    const tick = (t: number) => {
      const kr = Math.min(1, (t - t0) / dur);
      const k = holdzoom ? Math.min(kr, .62) : kr;
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const pan = panRef.current;
      if (pan) {
        pan.style.transform = `scale(${1 + 1.4 * e})`;
        pan.style.opacity = String(k < .78 ? 1 : 1 - (k - .78) / .22);
      }
      if (holdzoom) { if (kr < 1) rafRef.current = requestAnimationFrame(tick); return; }
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
      else { setZooming(null); game.enterBuilding(id); }
    };
    rafRef.current = requestAnimationFrame(tick);
    zoomTimer.current = setTimeout(() => { }, 0);
  }
  React.useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className={`scene city-scene ${zooming ? 'zoom-in' : ''} ${zooming && slowzoom ? 'zoom-slow' : ''} ${noui ? 'noui' : ''}`}>
      <div ref={panRef} className="city-pan" style={{ ['--zx' as any]: `${origin.x}%`, ['--zy' as any]: `${origin.y}%` }}>
        <CityArt lockedIds={lockedIds} onSelect={select} portrait={portrait} />
      </div>
      <div className="city-goal-chip">
        {goal ? <><Icon n="note" s={14} /> <b>Цель дня:</b> {goal}</> : <>Свободный день: ищите лоты для наборов и перепродажи</>}
      </div>
    </div>
  );
}

export function PartsScene() {
  const s = game.getSnapshot();
  const save = s.save;
  const specials = useMemo(() => RestorationSystem.shopSpecialsToday(save.day), [save.day]);
  const fromWorkbench = !!s.lot;

  function buy(p: PartId, n: number) { game.buyPart(p, n); }

  const card = (p: PartId, special: boolean) => (
    <div className={`part-card ${special ? 'special' : ''}`} key={p}>
      <div className="p-icon"><PartIcon p={p} s={22} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="p-name">{PARTS[p].name}</div>
        <div className="p-desc">{PARTS[p].desc}</div>
        <div className="p-have">в наличии: {save.parts[p] || 0} · {PARTS[p].price} ₽</div>
      </div>
      <div className="part-buy">
        <Btn small variant="gold" disabled={save.coins < PARTS[p].price} onClick={() => buy(p, 1)}>Купить</Btn>
        {!special && <Btn small variant="secondary" disabled={save.coins < PARTS[p].price * 5} onClick={() => buy(p, 5)}>×5</Btn>}
      </div>
    </div>
  );

  return (
    <div className="scene parts-scene">
      <PartsArt />
      <div className="shop-layer parts-layer">
        <div className="panel parts-panel">
          <div className="title" style={{ fontSize: 22 }}>Прилавок Шпуля</div>
          <div className="hint" style={{ marginBottom: 10 }}>
            Базовые детали — всегда. Особые — что удалось достать сегодня.
            Особые детали часто дешевле выторговать на аукционе в лотах-донорах
          </div>
          <div className="parts-grid">
            {BASIC_PARTS.map(p => card(p, false))}
          </div>
          <div className="subtitle" style={{ margin: '12px 0 6px', fontFamily: 'var(--font)', fontSize: 16 }}>Сегодня в ассортименте</div>
          <div className="parts-grid">
            {specials.length ? specials.map(p => card(p, true)) : <div className="hint">Сегодня особых деталей нет — загляните завтра.</div>}
            {specials.length < SPECIAL_PARTS.length && (
              <div className="hint" style={{ alignSelf: 'center' }}>
                Остальные особые ({SPECIAL_PARTS.filter(p => !specials.includes(p)).map(p => PARTS[p].name).join(', ')}) — ищите доноров на торгах
              </div>
            )}
          </div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <Btn big onClick={() => game.leaveParts()}><Icon n="arrowL" s={16} /> {fromWorkbench ? 'К верстаку' : 'Назад'}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
