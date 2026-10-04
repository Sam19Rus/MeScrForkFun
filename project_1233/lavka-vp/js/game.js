/* game.js — FSM + сцены + мини-игра реставрации + альбом + UI (MVP-A)
   Состояния: BOOT → INTRO → AUCTION → OPENING → RESTORE → APPRAISAL → DECISION → RESULT → AUCTION
   Альбом — оверлей из AUCTION. ?gate0 → standalone-проверка мини-игры (Gate 0). */
window.Game = (function () {
  const T = window.Telemetry, E = window.Economy, C = () => window.CONFIG;
  let app, save = null, scene = 'BOOT';
  let rnd = E.mulberry32((Date.now() ^ 0x9e3779b9) >>> 0);
  let lots = [], current = null;          // current: {lot, item, dup, base}
  let restore = null;                      // {q, progress, ms, auto}
  let toAuctionCount = 0;
  let gate0 = false;

  /* ---------- утилиты DOM ---------- */
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  function toast(msg, ms) {
    const t = el('div', 'toast', msg); document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 2200);
  }
  function coinFly(n) {
    const wallet = document.querySelector('.wallet'); if (!wallet) return;
    const r = wallet.getBoundingClientRect();
    for (let i = 0; i < Math.min(n, 7); i++) {
      const c = el('div', 'coin-fly');
      c.style.left = (window.innerWidth / 2 + (Math.random() * 120 - 60)) + 'px';
      c.style.top = (window.innerHeight / 2 + (Math.random() * 80 - 40)) + 'px';
      document.body.appendChild(c);
      requestAnimationFrame(() => {
        c.style.transition = 'all .7s cubic-bezier(.3,.8,.4,1)';
        c.style.left = (r.left + 8) + 'px'; c.style.top = (r.top + 8) + 'px'; c.style.opacity = '.3';
      });
      setTimeout(() => c.remove(), 800);
    }
  }

  /* ---------- сохранение ---------- */
  function newSave() {
    return {
      v: 1, coins: C().start_coins, owned: {}, pity: 0, ftueStep: 0,
      stats: { boxes: 0, sold: 0, kept: 0, dups: 0, best: 0 },
      autoRestore: { date: '', count: 0 }
    };
  }
  async function persist() { await window.SDK.save(save); }
  function today() { return new Date().toISOString().slice(0, 10); }

  /* ---------- экран-каркас ---------- */
  function screen(titleHtml) {
    app.innerHTML = '';
    const s = el('div', 'screen');
    const top = el('div', 'topbar');
    const wal = el('div', 'wallet', `<span class="coin"></span><span id="coins">${save.coins}</span>`);
    top.appendChild(wal);
    if (titleHtml) top.appendChild(el('div', '', titleHtml));
    const right = el('div', 'row');
    const albumBtn = el('button', 'topbtn', 'Альбом'); albumBtn.onclick = () => { SFX.click(); renderAlbum(); };
    right.appendChild(albumBtn);
    top.appendChild(right);
    s.appendChild(top);
    const content = el('div', 'content');
    s.appendChild(content);
    app.appendChild(s);
    return { screen: s, content, wallet: wal };
  }
  function setCoins(v) {
    save.coins = Math.max(0, Math.round(v));
    const n = document.getElementById('coins'); if (n) n.textContent = save.coins;
  }

  /* ---------- INTRO ---------- */
  function renderIntro() {
    scene = 'INTRO';
    app.innerHTML = '';
    const s = el('div', 'screen');
    const content = el('div', 'content'); content.style.justifyContent = 'center';
    content.appendChild(el('div', 'intro-card', `
      <h2>Лавка древностей</h2>
      <p>Вам досталась лавка дяди Августина. На складе — ящики, которые никто не открывал годами.</p>
      <p>Снаружи — пыль. Внутри, говорят, попадаются настоящие редкости.</p>`));
    const b = el('button', 'btn big', 'Открыть первый ящик — бесплатно');
    b.onclick = () => { SFX.click(); T.log('ftue_step', { step: 'intro_done' }); goAuction(); };
    content.appendChild(b);
    content.appendChild(el('div', 'footer-note', `${C().meta.name} · вертикальный прототип ${C().meta.version}`));
    s.appendChild(content); app.appendChild(s);
    T.log('screen_intro', {});
  }

  /* ---------- AUCTION ---------- */
  function genLots() {
    lots = [];
    const ftue = C().ftue;
    if (save.ftueStep < ftue.scripted.length) {
      const sc = ftue.scripted[save.ftueStep];
      const item = window.ITEMS_BY_ID[sc.item];
      lots.push({ tier: 'T1', price: (save.ftueStep === 0 && ftue.firstLotFree) ? 0 : E.lotPrice('T1', rnd), scripted: sc, item });
      return; // в FTUE — один крупный лот, без отвлечения
    }
    for (let i = 0; i < 3; i++) {
      lots.push({ tier: 'T1', price: E.lotPrice('T1', rnd), scripted: null });
    }
  }
  function goAuction(fromResult) {
    scene = 'AUCTION';
    // анти-тупик (телеметрия bailout — индикатор дефицита экономики)
    const minPrice = Math.round(C().tiers.T1.cost * (1 - (C().tiers.T1.costSpread || 0)));
    if (save.stats.boxes > 0 && save.coins < C().bailout.threshold) {
      setCoins(save.coins + C().bailout.amount);
      T.log('bailout', { coins: save.coins, amount: C().bailout.amount });
      toast(`Сосед одолжил монет: +${C().bailout.amount}`);
    }
    genLots();
    const { content } = screen('Аукцион');
    content.appendChild(el('div', 'title', save.ftueStep < C().ftue.scripted.length ? 'Склад лавки' : 'Утренний аукцион'));
    content.appendChild(el('div', 'hint', 'Выберите ящик. Что внутри — неизвестно. Иногда там хлам, а иногда — история.'));
    const wrap = el('div', 'lots');
    lots.forEach((lot, idx) => {
      const card = el('div', 'lot' + (lot.price > save.coins ? ' cant' : ''));
      const eraName = lot.scripted ? C().eraLabels[lot.item.era] : 'Категория: ?';
      card.innerHTML = `
        ${lot.price === 0 ? '<div class="free-tag">Бесплатно</div>' : ''}
        <div class="box">${window.CRATE_SVG}</div>
        <div class="lname">Тайный ящик<br><small style="color:#8d6e4c">${eraName}</small></div>
        <div class="price">${lot.price === 0 ? 'подарок дяди' : `<span class="coin" style="width:18px;height:18px"></span>${lot.price}`}</div>`;
      card.onclick = () => buyLot(idx);
      wrap.appendChild(card);
    });
    content.appendChild(wrap);
    if (save.ftueStep >= C().ftue.scripted.length) {
      content.appendChild(el('div', 'hint', `<small>Баланс лавки: <b>${save.coins}</b> · В альбоме: <b>${Object.keys(save.owned).length}/${window.ITEMS.length}</b></small>`));
    }
    T.log('screen_auction', { coins: save.coins, lots: lots.map(l => l.price), ftue: save.ftueStep });
    persist();
  }

  async function buyLot(idx) {
    const lot = lots[idx];
    if (!lot) return;
    if (lot.price > save.coins) { toast('Не хватает монет. Продайте что-нибудь из находок позже.'); SFX.click(); return; }
    setCoins(save.coins - lot.price);
    T.log('lot_bought', { price: lot.price, tier: lot.tier, ftue: !!lot.scripted });
    // ролл содержимого
    let item, rarity;
    if (lot.scripted) { item = lot.scripted.item ? window.ITEMS_BY_ID[lot.scripted.item] : E.rollItem(lot.scripted.rarity, rnd); rarity = item.rarity; }
    else { rarity = E.rollRarity(lot.tier, rnd); item = E.rollItem(rarity, rnd); }
    const dup = !!save.owned[item.id];
    save.pity = (rarity === 'legend') ? 0 : save.pity + 1;   // pity считается, но не применяется (MVP-A)
    save.stats.boxes++;
    current = { lot, item, rarity, dup, base: E.baseValue(item, rnd) };
    T.log('box_opened', { item: item.id, rarity, dup, pity: save.pity, price: lot.price });
    SFX.creak();
    renderOpening();
  }

  /* ---------- OPENING ---------- */
  function renderOpening() {
    scene = 'OPENING';
    app.innerHTML = '';
    const s = el('div', 'screen');
    const stage = el('div', 'opening-stage');
    const rays = el('div', 'rays');
    const crate = el('div', 'crate', window.CRATE_SVG);
    const reveal = el('div', 'reveal-item');
    stage.appendChild(rays); stage.appendChild(crate); stage.appendChild(reveal);
    const hint = el('div', 'skip-hint', 'нажмите, чтобы не ждать');
    stage.appendChild(hint);
    s.appendChild(stage); app.appendChild(s);

    const dirtyStyle = 'filter:brightness(.5) sepia(.9) saturate(.6) contrast(.9);';
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      stage.onclick = null;
      renderRestore();
    };
    // пыль
    for (let i = 0; i < 18; i++) {
      const d = el('div', 'dust');
      d.style.left = (35 + Math.random() * 30) + '%'; d.style.top = (40 + Math.random() * 20) + '%';
      stage.appendChild(d);
      d.animate([
        { transform: 'translate(0,0) scale(1)', opacity: .9 },
        { transform: `translate(${(Math.random() * 220 - 110)}px, ${-(60 + Math.random() * 160)}px) scale(.3)`, opacity: 0 }
      ], { duration: 1200 + Math.random() * 900, delay: 300 + i * 60, easing: 'ease-out' });
    }
    crate.classList.add('shake');
    const t1 = setTimeout(() => { crate.classList.remove('shake'); }, 1600);
    const t2 = setTimeout(() => { rays.classList.add('on'); }, 1500);
    const t3 = setTimeout(() => {
      crate.style.transition = 'all .4s'; crate.style.opacity = '0'; crate.style.transform = 'scale(.6) translateY(30px)';
      reveal.innerHTML = current.item.svg;
      reveal.firstElementChild.setAttribute('style', dirtyStyle + 'width:100%;height:100%;');
      requestAnimationFrame(() => reveal.classList.add('show'));
      if (current.rarity === 'legend') SFX.legendary(); else SFX.reveal();
    }, 2100);
    const t4 = setTimeout(finish, 3600);
    stage.onclick = finish;
    T.log('screen_opening', { item: current.item.id });
  }

  /* ---------- RESTORE (canvas-очистка) ---------- */
  function renderRestore(forceItem) {
    scene = 'RESTORE';
    const item = forceItem || current.item;
    app.innerHTML = '';
    const s = el('div', 'screen');
    const wrap = el('div', 'restore-wrap');
    wrap.appendChild(el('div', 'title', 'Реставрация'));
    wrap.appendChild(el('div', 'hint', 'Водите пальцем или мышью — сотрите грязь. Чем чище, тем дороже.'));
    const cv = el('canvas'); cv.id = 'restoreCanvas';
    wrap.appendChild(cv);
    const qbar = el('div', 'qbar'); const qfill = el('div'); qbar.appendChild(qfill);
    wrap.appendChild(qbar);
    const qLabel = el('div', 'hint', 'Качество: —');
    wrap.appendChild(qLabel);
    const tools = el('div', 'restore-tools');
    const doneBtn = el('button', 'btn', 'Готово'); doneBtn.disabled = true;
    const autoBtn = el('button', 'btn secondary', 'Идеально (реклама)');
    tools.appendChild(doneBtn); tools.appendChild(autoBtn);
    wrap.appendChild(tools);
    s.appendChild(wrap); app.appendChild(s);

    const W = 480, H = 480;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const dirt = document.createElement('canvas'); dirt.width = W; dirt.height = H;
    const dctx = dirt.getContext('2d');
    const sampler = document.createElement('canvas'); sampler.width = 48; sampler.height = 48;
    const sctx = sampler.getContext('2d');

    const img = new Image();
    let imgReady = false, initialDirt = 0, erased = 0, painting = false;
    const t0 = Date.now();
    let finished = false, auto = false;

    img.onload = () => { imgReady = true; drawDirt(); redraw(); sample(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(item.svg);

    function drawItem() {
      const size = 340;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, (W - size) / 2, (H - size) / 2, size, size);
    }
    function drawDirt() {
      dctx.clearRect(0, 0, W, H);
      const colors = ['rgba(74,54,32,.92)', 'rgba(96,72,44,.85)', 'rgba(58,44,29,.9)', 'rgba(120,95,60,.7)'];
      for (let i = 0; i < 170; i++) {
        const x = 40 + Math.random() * (W - 80), y = 40 + Math.random() * (H - 80);
        const r = 14 + Math.random() * 46;
        const g = dctx.createRadialGradient(x, y, 0, x, y, r);
        const c = colors[(Math.random() * colors.length) | 0];
        g.addColorStop(0, c); g.addColorStop(1, 'rgba(74,54,32,0)');
        dctx.fillStyle = g; dctx.beginPath(); dctx.arc(x, y, r, 0, 7); dctx.fill();
      }
      // центральная область (предмет) грязнее
      for (let i = 0; i < 60; i++) {
        const x = W / 2 + (Math.random() * 260 - 130), y = H / 2 + (Math.random() * 260 - 130);
        dctx.fillStyle = 'rgba(60,45,28,.55)';
        dctx.beginPath(); dctx.arc(x, y, 10 + Math.random() * 26, 0, 7); dctx.fill();
      }
      sample(true);
    }
    function redraw() { if (!imgReady) return; drawItem(); ctx.drawImage(dirt, 0, 0); }
    function sample(init) {
      sctx.clearRect(0, 0, 48, 48);
      sctx.drawImage(dirt, 0, 0, 48, 48);
      const d = sctx.getImageData(0, 0, 48, 48).data;
      let opaque = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 28) opaque++;
      if (init) initialDirt = Math.max(1, opaque);
      erased = Math.max(0, Math.min(1, 1 - opaque / initialDirt));
      const q = E.qualityFromProgress(erased);
      qfill.style.width = Math.round(q * 100) + '%';
      qLabel.textContent = 'Качество: ' + (q <= 0 ? '—' : Math.round(E.priceMultiplier(q) * 100) + '% цены');
      doneBtn.disabled = erased < C().restore.minProgress;
      return q;
    }
    function eraseAt(x, y) {
      const rect = cv.getBoundingClientRect();
      const px = (x - rect.left) / rect.width * W, py = (y - rect.top) / rect.height * H;
      dctx.globalCompositeOperation = 'destination-out';
      const r = 30;
      const g = dctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g;
      dctx.beginPath(); dctx.arc(px, py, r, 0, 7); dctx.fill();
      dctx.globalCompositeOperation = 'source-over';
      redraw();
      if (Math.random() < .3) SFX.scrub();
    }
    cv.addEventListener('pointerdown', e => { painting = true; cv.setPointerCapture(e.pointerId); eraseAt(e.clientX, e.clientY); });
    cv.addEventListener('pointermove', e => { if (painting) eraseAt(e.clientX, e.clientY); });
    cv.addEventListener('pointerup', () => { painting = false; sample(); });
    cv.addEventListener('pointercancel', () => { painting = false; sample(); });
    const sampleTimer = setInterval(() => sample(), 300);

    function complete(isAuto, qOverride) {
      if (finished) return; finished = true;
      clearInterval(sampleTimer);
      const q = (qOverride != null) ? qOverride : Math.max(E.qualityFromProgress(erased), 0.35);
      const ms = Date.now() - t0;
      restore = { q, progress: erased, ms, auto: !!isAuto };
      T.log('restore_complete', { item: item.id, quality: +q.toFixed(3), progress: +erased.toFixed(3), ms, auto: !!isAuto });
      if (gate0 && !current) { // standalone Gate 0: повтор
        toast(`Качество ${Math.round(E.priceMultiplier(q) * 100)}% · ${Math.round(ms / 1000)} с. Ещё раз?`);
        setTimeout(() => renderRestore(window.ITEMS[(Math.random() * window.ITEMS.length) | 0]), 600);
        return;
      }
      renderAppraisal();
    }
    doneBtn.onclick = () => { SFX.click(); sample(); complete(false); };
    autoBtn.onclick = async () => {
      if (save.autoRestore.date !== today()) save.autoRestore = { date: today(), count: 0 };
      if (save.autoRestore.count >= C().ads.rewarded.auto_restore.limitPerDay) { toast('Лимит «идеальной реставрации» на сегодня (3)'); return; }
      const ok = await window.SDK.rewarded('auto_restore');
      if (ok) { save.autoRestore.count++; auto = true; complete(true, C().restore.autoQuality); }
    };
    T.log('screen_restore', { item: item.id });
  }

  /* ---------- APPRAISAL ---------- */
  function renderAppraisal() {
    scene = 'APPRAISAL';
    const { item, base } = current;
    const sale = E.saleValue(base, restore.q);
    current.sale = sale;
    const { content } = screen('Оценка');
    const card = el('div', 'item-card r-' + item.rarity);
    card.innerHTML = `
      <div class="sprite">${item.svg}</div>
      <div class="badge ${item.rarity}">${C().rarityLabels[item.rarity]}</div>
      <div class="iname">${item.name}</div>
      <div class="hint" style="color:#8d6e4c">${C().eraLabels[item.era]}</div>
      <div class="story">${item.story}</div>
      <div class="calc">база ${base} × качество ${Math.round(E.priceMultiplier(restore.q) * 100)}% = <b>${sale}</b> <span class="coin" style="width:18px;height:18px"></span></div>`;
    content.appendChild(card);
    const b = el('button', 'btn big', 'Решить судьбу находки');
    b.onclick = () => { SFX.click(); renderDecision(); };
    content.appendChild(b);
    T.log('screen_appraisal', { item: item.id, rarity: item.rarity, sale });
  }

  /* ---------- DECISION (продать/оставить) — проверяем H4 ---------- */
  function renderDecision() {
    scene = 'DECISION';
    const { item, sale, dup } = current;
    if (dup) { // дубликат — авто-продажа (спека A.10)
      const v = E.dupValue(sale);
      current.autoSold = v;
      const { content } = screen('Дубликат');
      content.appendChild(el('div', 'item-card r-' + item.rarity, `
        <div class="sprite">${item.svg}</div>
        <div class="iname">${item.name}</div>
        <div class="story">Такой уже стоит у вас на полке. Коллекционеры заплатят ${v} монет — продано автоматически.</div>`));
      const b = el('button', 'btn big', `Забрать ${v}`);
      b.onclick = () => { SFX.coins(); coinFly(5); setCoins(save.coins + v); save.stats.dups++; T.log('decision', { choice: 'dup_autosell', item: item.id, value: v }); finishRound('dup', v); };
      content.appendChild(b);
      T.log('screen_decision', { item: item.id, dup: true });
      return;
    }
    const keep = E.keepValue(sale);
    scene = 'DECISION';
    const { content } = screen('Решение');
    content.appendChild(el('div', 'item-card r-' + item.rarity, `
      <div class="sprite" style="width:120px;height:120px">${item.svg}</div>
      <div class="iname">${item.name}</div>
      <div class="story">Продать — и получить всю цену. Оставить — и получить комиссию коллекционера (35%), но ячейка альбома и прогресс сета останутся у вас навсегда.</div>`));
    const row = el('div', 'row');
    const sellBtn = el('button', 'btn gold', `Продать за ${sale}`);
    const keepBtn = el('button', 'btn secondary', `Оставить (+${keep})`);
    sellBtn.onclick = () => { SFX.coins(); coinFly(6); setCoins(save.coins + sale); save.stats.sold++; save.stats.best = Math.max(save.stats.best, sale); T.log('decision', { choice: 'sell', item: item.id, rarity: item.rarity, value: sale }); current.choice = 'sell'; current.delta = sale; finishRound('sell', sale); };
    keepBtn.onclick = () => { SFX.reveal(); coinFly(3); setCoins(save.coins + keep); save.stats.kept++; save.owned[item.id] = { q: +restore.q.toFixed(3) }; T.log('decision', { choice: 'keep', item: item.id, rarity: item.rarity, value: keep }); current.choice = 'keep'; current.delta = keep; finishRound('keep', keep); };
    row.appendChild(sellBtn); row.appendChild(keepBtn);
    content.appendChild(row);
    T.log('screen_decision', { item: item.id, dup: false, sale, keep });
  }

  /* ---------- RESULT ---------- */
  function finishRound(kind, delta) {
    scene = 'RESULT';
    persist();
    const { content } = screen('Итог');
    const msg = kind === 'keep'
      ? `<div class="result-big delta-keep">+${delta} <small>(комиссия)</small></div><div class="hint">«${current.item.name}» занял место в альбоме.</div>`
      : kind === 'dup'
        ? `<div class="result-big delta-plus">+${delta}</div><div class="hint">Дубликат ушёл коллекционерам.</div>`
        : `<div class="result-big delta-plus">+${delta}</div><div class="hint">Сделка закрыта. Выручка в кассе лавки.</div>`;
    content.appendChild(el('div', 'item-card', `
      <div style="width:110px;height:110px">${current.item.svg}</div>
      ${msg}
      <div class="hint"><small>Баланс: <b>${save.coins}</b> · Альбом: <b>${Object.keys(save.owned).length}/${window.ITEMS.length}</b> · Ящиков открыто: <b>${save.stats.boxes}</b></small></div>`));
    // FTUE-подсказки
    if (save.ftueStep === 1 && kind === 'sell') content.appendChild(el('div', 'hint', 'Монеты звенят — хватит на новый ящик. Редкое многие оставляют: сеты альбома повышают доход.'));
    if (save.ftueStep === 2 && current.item.rarity === 'junk') content.appendChild(el('div', 'hint', 'Правило простое: хлам — в монеты, редкое — в коллекцию.'));
    save.ftueStep = Math.min(save.ftueStep + 1, 99);
    const b = el('button', 'btn big', 'На аукцион →');
    b.onclick = () => {
      SFX.click();
      toAuctionCount++;
      if (toAuctionCount % C().ads.interstitial.result_to_auction.every === 0) {
        window.SDK.interstitial('result_to_auction'); // mock: только лог
      }
      if (gate0) { renderRestore(window.ITEMS[(Math.random() * window.ITEMS.length) | 0]); return; }
      goAuction(true);
    };
    content.appendChild(b);
    persist();
    T.log('screen_result', { kind, delta, coins: save.coins, album: Object.keys(save.owned).length });
  }

  /* ---------- ALBUM ---------- */
  function renderAlbum() {
    scene = 'ALBUM';
    const back = scene;
    app.innerHTML = '';
    const s = el('div', 'screen');
    const top = el('div', 'topbar');
    const closeBtn = el('button', 'topbtn', '← Назад');
    closeBtn.onclick = () => { SFX.click(); goAuction(); };
    top.appendChild(closeBtn);
    top.appendChild(el('div', 'title', 'Альбом коллекционера'));
    top.appendChild(el('div', 'wallet', `<span class="coin"></span><span>${save.coins}</span>`));
    s.appendChild(top);
    const content = el('div', 'content');
    let totalOwned = 0;
    Object.keys(C().eraLabels).forEach(era => {
      const items = window.ITEMS.filter(i => i.era === era);
      const owned = items.filter(i => save.owned[i.id]).length;
      totalOwned += owned;
      const block = el('div', 'era-block');
      block.appendChild(el('div', 'era-title', `<span>${C().eraLabels[era]}</span><span>${owned}/${items.length}</span>`));
      const cells = el('div', 'cells');
      items.forEach(it => {
        const own = save.owned[it.id];
        const cell = el('div', 'cell' + (own ? ' owned' : '') + (own ? ' ' + it.rarity + '-glow' : ''));
        if (own) {
          cell.innerHTML = `<div class="mini">${it.svg}</div>`;
          cell.title = it.name;
        } else {
          cell.innerHTML = `<div class="mini" style="filter:brightness(0) opacity(.28)">${it.svg}</div>`;
        }
        cell.onclick = () => toast(own ? `${it.name} · качество ${Math.round(own.q * 100)}%` : 'Пока пусто. Может быть, в следующем ящике?');
        cells.appendChild(cell);
      });
      block.appendChild(cells);
      content.appendChild(block);
    });
    content.appendChild(el('div', 'hint', `<small>Собрано ${totalOwned}/${window.ITEMS.length}. В MVP-B сеты эпох дают постоянный бонус к доходу.</small>`));
    s.appendChild(content); app.appendChild(s);
    T.log('screen_album', { owned: totalOwned });
  }

  /* ---------- BOOT ---------- */
  async function start(opts) {
    app = document.getElementById('app');
    gate0 = !!(opts && opts.gate0);
    const loaded = await window.SDK.load();
    if (loaded && loaded.v === 1) save = loaded; else save = newSave();
    T.log('session_start', { fresh: !loaded, coins: save.coins, boxes: save.stats.boxes, gate0 });
    window.addEventListener('pagehide', () => persist());
    if (gate0) { renderRestore(window.ITEMS[(Math.random() * window.ITEMS.length) | 0]); return; }
    if (save.stats.boxes === 0 && save.ftueStep === 0) renderIntro();
    else goAuction();
  }

  return { start, getSave: () => save, getScene: () => scene, goAuction, renderRestore, setCoinsDebug: setCoins };
})();
