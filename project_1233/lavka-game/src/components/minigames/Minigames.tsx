/* Minigames.tsx — мини-игры реставрации.
   EraseGame — порт canvas-очистки из lavka2-vp/js/restore.js (clean/polish);
   MosaicGame — порт сборки черепков 3×3;
   RepairGame — новая: замена узла/детали (быстрое интерактивное действие);
   CalibrateGame — новая: ловля стрелки в зелёной зоне.
   Все возвращают perf (0..1) — качество выполнения операции. */
import React, { useEffect, useRef, useState } from 'react';
import { Telemetry } from '../../game/telemetry';
import { SFX } from '../../game/sfx';
import { CONFIG } from '../../game/data/config';
import { Btn } from '../ui/Basics';

export function spriteUrl(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ================= очистка / полировка (стирание слоя) =================
   ВАЖНО (фикс бага «не смог отчистить»): грязь живёт ТОЛЬКО в зоне предмета
   (центральный квадрат ITEM×ITEM), и sampler меряет чистоту ТОЛЬКО этой зоны.
   Раньше грязь рисовалась на весь canvas 480×480, а порог «Готово» (minProgress=60%)
   считался от всей площади: игрок, оттерев предмет (≈50% площади), физически не мог
   активировать кнопку. Экономика не изменена: порог и качество — как в модели v4. */
export function EraseGame({ itemSvg, type, fast, onDone }: {
  itemSvg: string; type: 'clean' | 'polish'; fast?: boolean;
  onDone: (perf: number) => void;
}) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [erased, setErased] = useState(0);
  const st = useRef({ painting: false, initial: 1, erased: 0, imgReady: false, img: null as HTMLImageElement | null, timer: 0, lastX: 0, lastY: 0 });
  const W = 480, H = 480;
  const ITEM = 340;                       // сторона спрайта предмета (как в redraw)
  const OX = (W - ITEM) / 2, OY = (H - ITEM) / 2; // начало зоны предмета

  const dirtRef = useRef<HTMLCanvasElement | null>(null);
  const samplerRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = cvRef.current!;
    const ctx = cv.getContext('2d')!;
    const dirt = document.createElement('canvas'); dirt.width = W; dirt.height = H; dirtRef.current = dirt;
    const dctx = dirt.getContext('2d')!;
    const sampler = document.createElement('canvas'); sampler.width = 48; sampler.height = 48; samplerRef.current = sampler;
    const sctx = sampler.getContext('2d')!;

    const dirtColors = type === 'polish'
      ? ['rgba(120,124,128,.85)', 'rgba(90,96,102,.8)', 'rgba(150,152,150,.6)']
      : ['rgba(74,54,32,.92)', 'rgba(96,72,44,.85)', 'rgba(58,44,29,.9)', 'rgba(120,95,60,.7)'];

    const img = new Image();
    img.onload = () => { st.current.img = img; st.current.imgReady = true; drawDirt(); redraw(); };
    img.onerror = () => { drawDirt(); redraw(); };
    img.src = spriteUrl(itemSvg);

    function redraw() {
      ctx.clearRect(0, 0, W, H);
      if (st.current.img) ctx.drawImage(st.current.img, OX, OY, ITEM, ITEM);
      ctx.drawImage(dirt, 0, 0);
    }
    function drawDirt() {
      dctx.clearRect(0, 0, W, H);
      const blobs = fast ? 70 : 170;
      for (let i = 0; i < blobs; i++) {
        // грязь — только в зоне предмета (небольшой вылет за край допустим, sampler его не считает)
        const x = OX + Math.random() * ITEM, y = OY + Math.random() * ITEM, r = 14 + Math.random() * 46;
        const g = dctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, dirtColors[i % dirtColors.length]); g.addColorStop(1, 'rgba(0,0,0,0)');
        dctx.fillStyle = g;
        dctx.beginPath(); dctx.arc(x, y, r, 0, 7); dctx.fill();
      }
      const blobs2 = fast ? 25 : 60;
      for (let i = 0; i < blobs2; i++) {
        const x = W / 2 + (Math.random() * 260 - 130), y = H / 2 + (Math.random() * 260 - 130);
        dctx.fillStyle = type === 'polish' ? 'rgba(110,115,120,.5)' : 'rgba(60,45,28,.55)';
        dctx.beginPath(); dctx.arc(x, y, 10 + Math.random() * 26, 0, 7); dctx.fill();
      }
      sample(true);
    }
    function sample(init?: boolean) {
      sctx.clearRect(0, 0, 48, 48);
      // меряем чистоту ТОЛЬКО зоны предмета: «отмыл предмет» == «можешь финишить»
      sctx.drawImage(dirt, OX, OY, ITEM, ITEM, 0, 0, 48, 48);
      let opaque = 0;
      try {
        const d = sctx.getImageData(0, 0, 48, 48).data;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 28) opaque++;
      } catch { opaque = init ? 2304 : 0; }
      if (init) st.current.initial = Math.max(1, opaque);
      st.current.erased = Math.max(0, Math.min(1, 1 - opaque / st.current.initial));
      setErased(st.current.erased);
    }
    function eraseDot(px: number, py: number) {
      dctx.globalCompositeOperation = 'destination-out';
      // кисть крупнее и «злее» прежней: ядро полного снятия ~0.65r (раньше ~0.4r из-за спада градиента)
      const r = type === 'polish' ? 44 : 40;
      const g = dctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.65, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath(); dctx.arc(px, py, r, 0, 7); dctx.fill();
      dctx.globalCompositeOperation = 'source-over';
    }
    function eraseAt(x: number, y: number) {
      const rect = cv.getBoundingClientRect();
      const px = (x - rect.left) / rect.width * W, py = (y - rect.top) / rect.height * H;
      // интерполяция между событиями pointer: быстрые движения/свайпы не оставляют пропусков
      const dx = px - st.current.lastX, dy = py - st.current.lastY;
      const dist = Math.hypot(dx, dy);
      const steps = st.current.lastX && dist > 8 ? Math.min(24, Math.ceil(dist / 8)) : 0;
      for (let i = 1; i <= steps; i++) eraseDot(st.current.lastX + dx * i / steps, st.current.lastY + dy * i / steps);
      eraseDot(px, py);
      st.current.lastX = px; st.current.lastY = py;
      redraw();
      if (Math.random() < .25) SFX.scrub();
    }
    const down = (e: PointerEvent) => {
      st.current.painting = true;
      const rect = cv.getBoundingClientRect();
      st.current.lastX = (e.clientX - rect.left) / rect.width * W;
      st.current.lastY = (e.clientY - rect.top) / rect.height * H;
      try { cv.setPointerCapture(e.pointerId); } catch { /* noop */ }
      eraseAt(e.clientX, e.clientY);
    };
    const move = (e: PointerEvent) => { if (st.current.painting) eraseAt(e.clientX, e.clientY); };
    const up = () => { st.current.painting = false; st.current.lastX = 0; st.current.lastY = 0; sample(); };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    st.current.timer = window.setInterval(() => sample(), 300);
    return () => {
      clearInterval(st.current.timer);
      cv.removeEventListener('pointerdown', down);
      cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up);
      cv.removeEventListener('pointercancel', up);
    };
  }, [itemSvg, type, fast]);

  const canFinish = erased >= CONFIG.restore.minProgress;
  const q = erased <= CONFIG.restore.qFrom ? 0 : Math.min(1, (erased - CONFIG.restore.qFrom) / (CONFIG.restore.qTo - CONFIG.restore.qFrom));

  return (
    <div className="mg-panel">
      <div className="mg-title">{type === 'polish' ? 'Полировка' : 'Очистка'}</div>
      <div className="mg-hint">{type === 'polish'
        ? 'Круговыми движениями снимите патину — верните блеск!'
        : 'Сотрите грязь тряпкой. Чем чище, тем дороже.'}</div>
      <canvas ref={cvRef} id="restoreCanvas" width={W} height={H} />
      <div className="qbar erase-bar">
        <div style={{ width: Math.round(erased * 100) + '%' }} />
        <span className="erase-mark" style={{ left: Math.round(CONFIG.restore.minProgress * 100) + '%' }} />
      </div>
      <div className="mg-hint">
        Отмыто: <b>{Math.round(erased * 100)}%</b>{canFinish ? ' — можно финишить' : ` — нужно ≥${Math.round(CONFIG.restore.minProgress * 100)}%`}
        {q > 0 && <> · качество слоя {Math.round(q * 100)}%</>}
      </div>
      <div className="btn-row">
        <Btn variant="gold" disabled={!canFinish} onClick={() => { SFX.click(); sample0(); onDone(st.current.erased); }}>Готово</Btn>
        {!canFinish && <span className="hint" style={{ alignSelf: 'center' }}>трите грязь на предмете — прогресс выше</span>}
      </div>
    </div>
  );

  /** снять финальный замер перед onDone (не из устаревшего состояния) */
  function sample0() {
    const dirt = dirtRef.current, sampler = samplerRef.current;
    if (!dirt || !sampler) return;
    const sctx = sampler.getContext('2d')!;
    sctx.clearRect(0, 0, 48, 48);
    sctx.drawImage(dirt, OX, OY, ITEM, ITEM, 0, 0, 48, 48);
    let opaque = 0;
    try {
      const d = sctx.getImageData(0, 0, 48, 48).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 28) opaque++;
    } catch { opaque = 0; }
    st.current.erased = Math.max(0, Math.min(1, 1 - opaque / st.current.initial));
  }
}

/* ================= сборка черепков (мозаика 3×3) ================= */
export function MosaicGame({ itemSvg, itemId, onDone }: { itemSvg: string; itemId: string; onDone: (perf: number) => void }) {
  const N = 3;
  const total = N * N;
  const [pre] = useState(() => new Set([0, 4, 8]));
  const [order] = useState(() => [...Array(total).keys()].filter(i => ![0, 4, 8].includes(i)).sort(() => Math.random() - 0.5));
  const [placedMap, setPlacedMap] = useState<Record<number, number>>(() => ({ 0: 0, 4: 4, 8: 8 }));
  const [sel, setSel] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const url = spriteUrl(itemSvg);

  const tileStyle = (i: number): React.CSSProperties => {
    const r = Math.floor(i / N), c = i % N;
    return { backgroundPosition: `${-c * 100}% ${-r * 100}%`, backgroundSize: `${N * 100}% ${N * 100}%`, backgroundImage: `url('${url}')` };
  };

  const placed = Object.keys(placedMap).length;

  function cellClick(ci: number) {
    if (sel == null || placedMap[ci] != null) return;
    if (ci === sel) {
      SFX.click();
      const next = { ...placedMap, [ci]: sel };
      setPlacedMap(next);
      setSel(null);
      if (Object.keys(next).length === total) setTimeout(() => onDone(1), 250);
    } else {
      SFX.creak();
      setShake(ci);
      setTimeout(() => setShake(null), 360);
      Telemetry.log('restore_misplace', { item: itemId });
    }
  }

  return (
    <div className="mg-panel">
      <div className="mg-title">Сборка</div>
      <div className="mg-hint">Соберите предмет из черепков: выберите фрагмент внизу, затем ячейку.</div>
      <div className="asm-board">
        {Array.from({ length: total }).map((_, ci) => (
          <div key={ci} className={`asm-cell ${placedMap[ci] != null ? 'done' : ''} ${shake === ci ? 'shake' : ''}`}
            onClick={() => cellClick(ci)}>
            {placedMap[ci] != null && <div className="tile" style={tileStyle(placedMap[ci])} />}
          </div>
        ))}
      </div>
      <div className="asm-tray">
        {order.filter(i => !Object.values(placedMap).includes(i)).map(i => (
          <div key={i} className={`tray-tile ${sel === i ? 'sel' : ''}`} onClick={() => { SFX.click(); setSel(i); }}>
            <div className="tile" style={tileStyle(i)} />
          </div>
        ))}
      </div>
      <div className="mg-hint">Собрано: {placed}/{total}</div>
    </div>
  );
}

/* ================= замена узла/детали (быстрое действие) ================= */
export function RepairGame({ itemSvg, partName, partIcon, seed, onDone }: {
  itemSvg: string; partName: string; partIcon: string; seed: number;
  onDone: (perf: number) => void;
}) {
  const [hits, setHits] = useState(0);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number }[]>([]);
  const need = 3;
  const pos = { x: 30 + (seed % 40), y: 28 + ((seed * 7) % 40) };

  function hit(e: React.MouseEvent) {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const id = Date.now() + Math.random();
    setSparks(s => [...s, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setSparks(s => s.filter(sp => sp.id !== id)), 600);
    SFX.creak();
    setHits(h => {
      const nh = h + 1;
      if (nh >= need) setTimeout(() => { SFX.reveal(); onDone(0.95); }, 450);
      return nh;
    });
  }

  return (
    <div className="mg-panel">
      <div className="mg-title">Замена: {partName}</div>
      <div className="mg-hint">Открутите старый узел ({need} нажатия) и поставьте новую деталь.</div>
      <div className="repair-stage">
        <div style={{ width: '100%', height: '100%', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: itemSvg }} />
        <div className={`repair-spot ${hits >= need ? 'ok' : ''}`}
          style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)' }}
          onClick={hits < need ? hit : undefined}>
          {hits >= need ? <span>{partIcon}</span> : '🔧'}
        </div>
        {sparks.map(s => <span key={s.id} className="spark" style={{ left: s.x, top: s.y }}>✨</span>)}
      </div>
      <div className="qbar"><div style={{ width: Math.round((hits / need) * 100) + '%' }} /></div>
      <div className="mg-hint">{hits >= need ? `«${partName}» встала на место — как родная.` : `Осталось нажатий: ${need - hits}`}</div>
    </div>
  );
}

/* ================= настройка/калибровка (ловля стрелки) ================= */
export function CalibrateGame({ onDone }: { onDone: (perf: number) => void }) {
  const [pos, setPos] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [best, setBest] = useState(0);
  const [msg, setMsg] = useState('');
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const speedRef = useRef(0.9);
  const attemptsRef = useRef(0);
  const bestRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(50, t - last); last = t;
      posRef.current += dirRef.current * speedRef.current * (dt / 1000);
      if (posRef.current >= 1) { posRef.current = 1; dirRef.current = -1; }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1; }
      setPos(posRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function stop() {
    if (doneRef.current) return;
    // зелёная зона 0.32–0.48, центр 0.40
    const p = posRef.current;
    const inZone = p >= 0.32 && p <= 0.48;
    const perf = inZone ? Math.max(0.6, 1 - Math.abs(p - 0.4) * 2.2) : Math.max(0, 0.45 - Math.abs(p - 0.4));
    const na = attemptsRef.current + 1;
    attemptsRef.current = na; setAttempts(na);
    const nb = Math.max(bestRef.current, perf);
    bestRef.current = nb; setBest(nb);
    if (inZone) {
      SFX.ding();
      setMsg(`Точно в цель! Настройка: ${Math.round(perf * 100)}%`);
      doneRef.current = true;
      setTimeout(() => onDone(Math.max(perf, 0.75)), 500);
      return;
    }
    SFX.error();
    if (na >= 3) {
      doneRef.current = true;
      setMsg(`Лучшая попытка: ${Math.round(nb * 100)}% — сойдёт.`);
      setTimeout(() => onDone(Math.max(nb, 0.55)), 600);
    } else {
      setMsg(`Мимо… Попытка ${na}/3`);
      speedRef.current += 0.35;
    }
  }

  return (
    <div className="mg-panel">
      <div className="mg-title">Настройка механизма</div>
      <div className="mg-hint">Остановите стрелку в зелёной зоне. Попыток: {3 - attempts}.</div>
      <div className="cal-stage">
        <div className="cal-scale" />
        <div className="cal-needle" style={{ left: `calc(${pos * 100}% - 2px)` }} />
      </div>
      <div className="cal-result">{msg}</div>
      <div className="btn-row">
        <Btn variant="gold" disabled={doneRef.current} onClick={stop}>Стоп!</Btn>
      </div>
    </div>
  );
}
