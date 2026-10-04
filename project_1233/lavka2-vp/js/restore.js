/* restore.js — мини-игры реставрации: clean / polish (canvas-очистка), assemble (мозаика черепков).
   API: Restore.play(host, item, type, {onDone(q, ms, auto), speed}) → { auto() }
   Качество → Economy.qualityFromProgress (модель v4, валидирована симуляцией). */
window.Restore = (function () {
  const E = window.Economy;

  function imgFromSvg(svg, cb) {
    const img = new Image();
    img.onload = () => cb(img);
    img.onerror = () => cb(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------- clean / polish: стирание слоя ---------- */
  function eraseGame(host, item, type, opts) {
    const W = 480, H = 480;
    const wrap = document.createElement('div'); wrap.className = 'restore-wrap';
    wrap.innerHTML = `<div class="title">${type === 'polish' ? 'Полировка' : 'Очистка'}</div>
      <div class="hint">${type === 'polish' ? 'Круговыми движениями снимите патину — не поцарапайте!' : 'Сотрите грязь. Чем чище, тем дороже.'}</div>`;
    const cv = document.createElement('canvas'); cv.id = 'restoreCanvas'; cv.width = W; cv.height = H;
    wrap.appendChild(cv);
    const qbar = document.createElement('div'); qbar.className = 'qbar';
    const qfill = document.createElement('div'); qbar.appendChild(qfill); wrap.appendChild(qbar);
    const qLabel = document.createElement('div'); qLabel.className = 'hint'; qLabel.textContent = 'Качество: —';
    wrap.appendChild(qLabel);
    const tools = document.createElement('div'); tools.className = 'restore-tools';
    const doneBtn = document.createElement('button'); doneBtn.className = 'btn'; doneBtn.textContent = 'Готово'; doneBtn.disabled = true;
    const autoBtn = document.createElement('button'); autoBtn.className = 'btn secondary'; autoBtn.textContent = 'Идеально (реклама)';
    tools.appendChild(doneBtn); tools.appendChild(autoBtn);
    if (opts.fast) {
      const quickBtn = document.createElement('button'); quickBtn.className = 'btn secondary';
      quickBtn.textContent = 'Быстро обтереть (хлам же)';
      quickBtn.onclick = () => { SFX.click(); quickDone(); };
      tools.appendChild(quickBtn);
    }
    wrap.appendChild(tools);
    host.innerHTML = ''; host.appendChild(wrap);

    const ctx = cv.getContext('2d');
    const dirt = document.createElement('canvas'); dirt.width = W; dirt.height = H;
    const dctx = dirt.getContext('2d');
    const sampler = document.createElement('canvas'); sampler.width = 48; sampler.height = 48;
    const sctx = sampler.getContext('2d');
    let imgReady = false, initial = 1, erased = 0, painting = false, finished = false;
    const t0 = Date.now();

    const dirtColors = type === 'polish'
      ? ['rgba(120,124,128,.85)', 'rgba(90,96,102,.8)', 'rgba(150,152,150,.6)']
      : ['rgba(74,54,32,.92)', 'rgba(96,72,44,.85)', 'rgba(58,44,29,.9)', 'rgba(120,95,60,.7)'];

    function redraw() {
      if (!imgReady) return;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(opts.img, (W - 340) / 2, (H - 340) / 2, 340, 340);
      ctx.drawImage(dirt, 0, 0);
    }
    function drawDirt() {
      if (!dctx) return;
      dctx.clearRect(0, 0, W, H);
      const blobs = opts.fast ? 70 : 170;
      for (let i = 0; i < blobs; i++) {
        const x = 40 + Math.random() * (W - 80), y = 40 + Math.random() * (H - 80), r = 14 + Math.random() * 46;
        try {
          const g = dctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, dirtColors[i % dirtColors.length]); g.addColorStop(1, 'rgba(0,0,0,0)');
          dctx.fillStyle = g;
        } catch (e) { dctx.fillStyle = dirtColors[i % dirtColors.length]; }
        dctx.beginPath(); dctx.arc(x, y, r, 0, 7); dctx.fill();
      }
      const blobs2 = opts.fast ? 25 : 60;
      for (let i = 0; i < blobs2; i++) {
        const x = W / 2 + (Math.random() * 260 - 130), y = H / 2 + (Math.random() * 260 - 130);
        dctx.fillStyle = type === 'polish' ? 'rgba(110,115,120,.5)' : 'rgba(60,45,28,.55)';
        dctx.beginPath(); dctx.arc(x, y, 10 + Math.random() * 26, 0, 7); dctx.fill();
      }
      sample(true);
    }
    function sample(init) {
      if (!sctx) return;
      sctx.clearRect(0, 0, 48, 48);
      sctx.drawImage(dirt, 0, 0, 48, 48);
      let opaque = 0;
      try {
        const d = sctx.getImageData(0, 0, 48, 48).data;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 28) opaque++;
      } catch (e) { opaque = init ? 2304 : 0; } // headless-фолбэк
      if (init) initial = Math.max(1, opaque);
      erased = Math.max(0, Math.min(1, 1 - opaque / initial));
      const q = E.qualityFromProgress(erased);
      qfill.style.width = Math.round(q * 100) + '%';
      qLabel.textContent = 'Качество: ' + (q <= 0 ? '—' : Math.round(E.priceMultiplier(q) * 100) + '% цены');
      doneBtn.disabled = erased < window.CONFIG.restore.minProgress;
    }
    function eraseAt(x, y) {
      const rect = cv.getBoundingClientRect();
      const px = (x - rect.left) / rect.width * W, py = (y - rect.top) / rect.height * H;
      dctx.globalCompositeOperation = 'destination-out';
      const r = type === 'polish' ? 34 : 30;
      try {
        const g = dctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        dctx.fillStyle = g;
      } catch (e) { dctx.fillStyle = 'rgba(0,0,0,1)'; }
      dctx.beginPath(); dctx.arc(px, py, r, 0, 7); dctx.fill();
      dctx.globalCompositeOperation = 'source-over';
      redraw();
      if (Math.random() < .25) SFX.scrub();
    }
    cv.addEventListener('pointerdown', e => { painting = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} eraseAt(e.clientX, e.clientY); });
    cv.addEventListener('pointermove', e => { if (painting) eraseAt(e.clientX, e.clientY); });
    cv.addEventListener('pointerup', () => { painting = false; sample(); });
    cv.addEventListener('pointercancel', () => { painting = false; sample(); });
    const timer = setInterval(sample, 300);

    function quickDone() {
      if (finished) return; finished = true;
      clearInterval(timer);
      const q = 0.75;
      window.Telemetry.log('item_restored', { item: item.id, type, quality: q, ms: Date.now() - t0, auto: false, quick: true });
      opts.onDone(q, Date.now() - t0, false);
    }
    function complete(auto) {
      if (finished) return; finished = true;
      clearInterval(timer);
      const q = auto ? window.CONFIG.restore.autoQuality : Math.max(E.qualityFromProgress(erased), 0.35);
      window.Telemetry.log('item_restored', { item: item.id, type, quality: +q.toFixed(3), ms: Date.now() - t0, auto: !!auto });
      opts.onDone(q, Date.now() - t0, !!auto);
    }
    doneBtn.onclick = () => { SFX.click(); sample(); complete(false); };
    autoBtn.onclick = async () => {
      const ok = await window.SDK.rewarded('auto_restore');
      if (ok) complete(true);
    };
    if (opts.img) { imgReady = true; drawDirt(); redraw(); }
    return { auto: () => complete(true) };
  }

  /* ---------- assemble: мозаика черепков ---------- */
  function assembleGame(host, item, opts) {
    const wrap = document.createElement('div'); wrap.className = 'restore-wrap';
    wrap.innerHTML = `<div class="title">Сборка</div><div class="hint">Соберите предмет из черепков: выберите деталь, затем ячейку.</div>`;
    const N = 3; // 3×3
    const board = document.createElement('div'); board.className = 'asm-board';
    const tray = document.createElement('div'); tray.className = 'asm-tray';
    wrap.appendChild(board); wrap.appendChild(tray);
    const qLabel = document.createElement('div'); qLabel.className = 'hint'; wrap.appendChild(qLabel);
    const tools = document.createElement('div'); tools.className = 'restore-tools';
    const autoBtn = document.createElement('button'); autoBtn.className = 'btn secondary'; autoBtn.textContent = 'Идеально (реклама)';
    tools.appendChild(autoBtn); wrap.appendChild(tools);
    host.innerHTML = ''; host.appendChild(wrap);

    const cells = [];
    let placed = 0, finished = false, selected = null;
    const total = N * N;
    const prePlaced = new Set([0, 4, 8]); // три уже на месте
    placed = prePlaced.size;
    const t0 = Date.now();

    function q() { return placed / total; }
    function upd() { qLabel.textContent = `Собрано: ${placed}/${total} · качество ${Math.round(q() * 100)}%`; }

    for (let i = 0; i < total; i++) {
      const c = document.createElement('div'); c.className = 'asm-cell'; c.dataset.i = i;
      if (prePlaced.has(i)) { c.classList.add('done'); c.innerHTML = tileHtml(i); placed && 0; }
      c.onclick = () => {
        if (selected == null || c.classList.contains('done')) return;
        if (+c.dataset.i === selected.i) { // верно
          c.classList.add('done'); c.innerHTML = tileHtml(selected.i);
          placed++; SFX.click(); upd();
          tray.querySelector(`[data-t="${selected.t}"]`)?.remove();
          selected = null;
          if (placed === total) complete(false);
        } else { c.classList.add('shake'); setTimeout(() => c.classList.remove('shake'), 350); SFX.creak();
          window.Telemetry.log('restore_misplace', { item: item.id }); }
      };
      board.appendChild(c); cells.push(c);
    }
    function tileHtml(i) {
      const r = Math.floor(i / N), col = i % N;
      return `<div class="tile" style="background-position:${-col * 100}% ${-r * 100}%;background-size:${N * 100}% ${N * 100}%;background-image:url('${spriteUrl(item)}')"></div>`;
    }
    const order = [...Array(total).keys()].filter(i => !prePlaced.has(i)).sort(() => Math.random() - 0.5);
    order.forEach((i, t) => {
      const d = document.createElement('div'); d.className = 'tray-tile'; d.dataset.t = t; d.innerHTML = tileHtml(i);
      d.onclick = () => {
        tray.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel'); selected = { i, t };
      };
      tray.appendChild(d);
    });
    upd();

    function quickDone() {
      if (finished) return; finished = true;
      clearInterval(timer);
      const q = 0.75;
      window.Telemetry.log('item_restored', { item: item.id, type, quality: q, ms: Date.now() - t0, auto: false, quick: true });
      opts.onDone(q, Date.now() - t0, false);
    }
    function complete(auto) {
      if (finished) return; finished = true;
      const qq = auto ? window.CONFIG.restore.autoQuality : Math.max(q(), 0.35);
      window.Telemetry.log('item_restored', { item: item.id, type: 'assemble', quality: +qq.toFixed(3), ms: Date.now() - t0, auto: !!auto });
      opts.onDone(qq, Date.now() - t0, !!auto);
    }
    autoBtn.onclick = async () => { const ok = await window.SDK.rewarded('auto_restore'); if (ok) complete(true); };
    return { auto: () => complete(true) };
  }

  function spriteUrl(item) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(item.svg);
  }

  function play(host, item, type, opts) {
    if (type === 'assemble') return assembleGame(host, item, opts);
    let started = false;
    const start = (img) => {
      if (started) return; started = true;
      opts.img = img || null;
      opts._handle = eraseGame(host, item, type, opts);
    };
    imgFromSvg(item.svg, (img) => start(img));
    setTimeout(() => start(null), 250); // headless/медленная загрузка — стартуем в любом случае
    return { auto: () => { if (opts._handle) opts._handle.auto(); else opts.onDone(window.CONFIG.restore.autoQuality, 0, true); } };
  }

  return { play, spriteUrl };
})();
