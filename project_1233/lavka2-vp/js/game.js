/* game.js — «Лавка 2.0: Аукцион»: FSM + сцены + движок торгов.
   Поток дня: morning(лавка) → houseSelect → inspect(лоты+улики+оценка) → bidding(по лотам)
   → [выигрыш: opening → restore → appraisal → decision] / [проигрыш: learning-экран]
   → dayResult → morning. FTUE: день 1 — скриптованные лоты и заказ Иваныча. */
window.Game = (function () {
  const T = window.Telemetry, E = window.Economy, C = () => window.CONFIG;
  const G = window.Goals, OS = window.OrdersSystem, AS = window.AuctionSystem, RS = window.ResultSystem;
  let app, save, rnd;
  let day = null;                 // {houseId, lots, idx, dayStartCoins, estDay:{n,ok}, wins, losses}
  let lot = null;                 // текущий лот в пайплайне
  let speed = 550;                // задержки торгов (ms); ?speed=fast → 30
  let playerResolve = null;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms * (speed / 550)));
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  function toast(msg, ms) { const t = el('div', 'toast', msg); document.body.appendChild(t); setTimeout(() => t.remove(), ms || 2400); }
  function coinFly(n) {
    const w = document.querySelector('.wallet'); if (!w) return;
    const r = w.getBoundingClientRect();
    for (let i = 0; i < Math.min(n || 5, 7); i++) {
      const c = el('div', 'coin-fly');
      c.style.left = (innerWidth / 2 + (Math.random() * 120 - 60)) + 'px';
      c.style.top = (innerHeight / 2 + (Math.random() * 80 - 40)) + 'px';
      document.body.appendChild(c);
      requestAnimationFrame(() => { c.style.transition = 'all .7s'; c.style.left = (r.left + 8) + 'px'; c.style.top = (r.top + 8) + 'px'; c.style.opacity = '.3'; });
      setTimeout(() => c.remove(), 800);
    }
  }
  function setCoins(v) { save.coins = Math.max(0, Math.round(v)); const n = document.getElementById('coins'); if (n) n.textContent = save.coins; }

  /* ================= save ================= */
  function newSave() {
    return { v: 2, day: 1, coins: C().start_coins, owned: {}, fixtures: [], vitrine: [],
      orders: [], shopLevel: 1, lastDivDay: 0, pity: 0,
      stats: { wins: 0, losses: 0, sold: 0, kept: 0, ordersDone: 0, ordersExpired: 0, dup: 0, best: 0, motivated: 0 },
      est: { submitted: 0, correct: 0 },
      autoRestore: { date: '', count: 0 }, ftue: { done: false } };
  }
  const persist = () => window.SDK.save(save);
  const today = () => new Date().toISOString().slice(0, 10);

  /* ================= каркас экрана ================= */
  function screen(titleText) {
    app.innerHTML = '';
    const s = el('div', 'screen');
    const top = el('div', 'topbar');
    top.appendChild(el('div', 'wallet', `<span class="coin"></span><span id="coins">${save.coins}</span>`));
    if (titleText) top.appendChild(el('div', 'top-title', titleText));
    top.appendChild(el('div', 'day-chip', `День ${save.day}`));
    s.appendChild(top);
    const content = el('div', 'content'); s.appendChild(content);
    app.appendChild(s);
    return content;
  }

  /* ================= MORNING (лавка-хаб) ================= */
  function renderMorning(first) {
    // дневные начисления
    if (save.lastDivDay < save.day) {
      const div = G.dividend(save);
      setCoins(save.coins + div);
      save.lastDivDay = save.day;
      T.log('dividend', { day: save.day, amount: div });
      setTimeout(() => toast(`Утренняя выручка лавки: +${div} ₽ (витрина и наборы работают)`), 300);
    }
    if (!first && save.coins < C().bailout.threshold) {
      setCoins(save.coins + C().bailout.amount);
      T.log('bailout', { day: save.day, coins: save.coins });
      setTimeout(() => toast(`Сосед одолжил монет: +${C().bailout.amount}`), 900);
    }
    OS.ensureBoard(save, rnd);

    const content = screen('Лавка');
    content.appendChild(el('div', 'title', C().shop[save.shopLevel].name));

    // заказы
    content.appendChild(el('div', 'sec-title', '📋 Доска заказов'));
    const ob = el('div', 'orders');
    if (!(save.orders || []).length) ob.appendChild(el('div', 'hint', 'Сегодня никто не заходил…'));
    (save.orders || []).forEach(o => {
      const daysLeft = o.id === 'ftue' ? 1 : o.deadline - save.day;
      const card = el('div', 'order-card',
        `<div class="face">${window.FACES[o.face] || ''}</div>
         <div class="o-body"><b>${o.who}</b>: «${o.text}»<br>
         <span class="o-want">Ищет: ${OS.wantLabel(o.want)}</span> ·
         <span class="o-pay">выплата ×${C().economy.orderMult[o.mult]}${G.setActive(save,'tech')&&o.want.cat==='tech'?' (×1.5 сет)':''}</span> ·
         <span class="o-days">${o.id==='ftue'?'сегодня':'осталось ' + daysLeft + ' дн.'}</span></div>`);
      ob.appendChild(card);
    });
    content.appendChild(ob);

    // наборы
    content.appendChild(el('div', 'sec-title', '🏆 Наборы коллекции'));
    const sb = el('div', 'sets-row');
    Object.keys(window.SETS).forEach(sid => {
      const st = window.SETS[sid], got = G.setOwned(save, sid);
      const active = got >= st.need;
      sb.appendChild(el('div', 'set-chip' + (active ? ' done' : ''),
        `<b>${st.name}</b><br>${got}/${st.need}${active ? ' ✓' : ''}<br><small>${st.bonus}</small>`));
    });
    content.appendChild(sb);

    // лавка/фикстуры/витрина
    const up = G.canUpgrade(save);
    if (up) {
      const card = el('div', 'shop-card',
        `<b>Развитие лавки → «${up.next.name}»</b><br>
         <small>${up.ok ? 'Всё готово к открытию!' : 'Нужно: ' + up.reqs.join('; ')}</small><br>
         <small class="dim">Откроет: ${up.next.houses.length > G.houses(save).length ? 'новый аукцион, ' : ''}${up.next.orders} заказов, витрина ${up.next.vitrine}</small>`);
      if (up.ok) {
        const b = el('button', 'btn gold', `Открыть за ${up.next.cost}`);
        b.onclick = () => { SFX.legendary(); G.upgrade(save); persist(); T.log('shop_upgraded', { level: save.shopLevel }); T.log('goal_completed', { type: 'shop', level: save.shopLevel }); renderMorning(true); };
        card.appendChild(b);
      }
      content.appendChild(card);
    }
    const fx = el('div', 'fixtures-row');
    fx.appendChild(el('div', 'fix-box', `<b>В лавке стоит:</b> ${(save.fixtures || []).map(f => window.FIXTURES.find(x => x.item === f)).filter(Boolean).map(f => f.name).join(', ') || 'пока пусто'}`));
    const slots = C().shop[save.shopLevel].vitrine || 0;
    fx.appendChild(el('div', 'fix-box', `<b>Витрина (${(save.vitrine||[]).length}/${slots}):</b> ${slots ? (save.vitrine || []).map(v => window.ITEMS_BY_ID[v]?.name || v).join(', ') || 'легенда даёт +8% к продажам' : 'откроется на ур. 2'}`));
    content.appendChild(fx);

    const row = el('div', 'row');
    const ab = el('button', 'btn secondary', '📖 Альбом');
    ab.onclick = () => { SFX.click(); renderAlbum(); };
    const go = el('button', 'btn big', '🔨 На аукцион →');
    go.onclick = () => {
      SFX.click();
      day = { dayStartCoins: save.coins, wins: 0, losses: 0, estDay: { n: 0, ok: 0 } };
      if (save.day % C().ads.interstitial.morning_to_auction.every === 0) window.SDK.interstitial('morning_to_auction');
      if (!save.ftue.done) { startFTUEDay(); } else { renderHouseSelect(); }
    };
    row.appendChild(ab); row.appendChild(go);
    content.appendChild(row);
    content.appendChild(el('div', 'footer-note', `${C().meta.name} · ${C().meta.version} · монет: ${save.coins} · альбом: ${Object.keys(save.owned).length}/${window.ITEMS.length}`));
    persist();
    T.log('screen_morning', { day: save.day, coins: save.coins, orders: (save.orders||[]).length });
  }

  /* ================= выбор аукциона ================= */
  function renderHouseSelect() {
    const content = screen('Куда едем?');
    content.appendChild(el('div', 'title', 'Утренние аукционы'));
    content.appendChild(el('div', 'hint', 'У каждого дома свои лоты, цены и число бесплатных улик'));
    G.houses(save).forEach(hid => {
      const h = window.HOUSES[hid];
      const card = el('div', 'house-card',
        `<b>${h.name}</b> — лотов: ${h.lots}, бесплатных улик: ${G.freeClues(save, hid)}<br><small>${h.desc}</small>`);
      const b = el('button', 'btn', 'Поехать');
      b.onclick = () => { SFX.click(); beginDay(hid, false); };
      card.appendChild(b);
      content.appendChild(card);
    });
  }

  let sessionAuctions = 0;
  function beginDay(houseId, isFTUE) {
    day.lots = isFTUE ? AS.buildFTUEDay(save).lots : AS.buildDay(save, houseId, rnd).lots;
    day.houseId = houseId; day.idx = 0;
    sessionAuctions++;
    T.log('auction_started', { house: houseId, day: save.day, n: sessionAuctions, ftue: !!isFTUE });
    if (sessionAuctions > 1) T.log('next_auction_started', { day: save.day, n: sessionAuctions });
    renderInspect();
  }
  function startFTUEDay() {
    if (!(save.orders || []).some(o => o.id === 'ftue')) {
      save.orders.unshift(OS.instantiate({ ...C().ftue.order, mult: 'cat' }, save.day, 0));
    }
    T.log('ftue_step', { step: 'day1_start' });
    beginDay('city', true);
  }

  /* ================= осмотр лотов ================= */
  function lotBadges(l) {
    const badges = [];
    const ord = OS.matching(save, l.item);
    if (ord) badges.push(`<span class="badge-order">📋 заказ: ${ord.who} ×${C().economy.orderMult[ord.mult]}</span>`);
    if (l.item.set && !save.owned[l.item.id]) badges.push(`<span class="badge-set">🏆 набор «${window.SETS[l.item.set].name}» ${G.setOwned(save, l.item.set)}/${window.SETS[l.item.set].need}</span>`);
    if (l.item.fixture && !(save.fixtures || []).includes(l.item.fixture)) {
      const f = window.FIXTURES.find(x => x.item === l.item.id);
      badges.push(`<span class="badge-fix">🔧 можно установить: ${f.desc}</span>`);
    }
    if (l.item.rarity === 'legend' && (save.vitrine||[]).length < (C().shop[save.shopLevel].vitrine||0)) badges.push(`<span class="badge-fix">✨ витрина +8%</span>`);
    return badges.join(' ');
  }

  function renderInspect() {
    const content = screen(`Аукцион: ${window.HOUSES[day.houseId].name}`);
    content.appendChild(el('div', 'title', 'Осмотр лотов'));
    content.appendChild(el('div', 'hint', 'Изучите улики и прикиньте цену ДО торгов. Точная оценка — +25 ₽'));
    const list = el('div', 'lots-list');
    day.lots.forEach((l, i) => {
      const row = el('div', 'lot-row' + (l.estimated ? ' estimated' : ''),
        `<div class="crate-mini">${window.CRATE_SVG}</div>
         <div class="lot-info"><b>Лот ${i + 1}</b> · <span class="pack-chip">${l.pack ? l.pack.name : 'Ящик'}</span>старт ~${l.start} ₽<br>
         <small>${(l.clues.find(c => c.free) || {}).text || ''}</small><br>${lotBadges(l)}</div>
         <div class="lot-act">${l.estimated ? `<span class="est-mark">${E.bandLabel(l.estimateBand)}</span>` : ''}</div>`);
      row.onclick = () => openLotModal(i);
      list.appendChild(row);
    });
    content.appendChild(list);
    const go = el('button', 'btn big gold', '🔔 Начать торги');
    go.onclick = () => { SFX.click(); day.idx = 0; nextLotFlow(); };
    content.appendChild(go);
    T.log('screen_inspect', { lots: day.lots.length, house: day.houseId });
  }

  function openLotModal(i) {
    const l = day.lots[i];
    const ov = el('div', 'modal-ov');
    const m = el('div', 'modal');
    m.appendChild(el('div', 'title', `Лот ${i + 1}`));
    const cluesBox = el('div', 'clues');
    l._clueLogged = l._clueLogged || {};
    l.clues.forEach((c, ci) => {
      const visible = c.free || ci < l.revealedClues;
      if (visible) {
        const d = el('div', 'clue', `🔎 ${c.text}`);
        if (c.sprite) d.appendChild(el('div', 'photo-hint', l.item.svg));
        cluesBox.appendChild(d);
        if (!l._clueLogged[ci]) { l._clueLogged[ci] = true; T.log('clue_opened', { lot: l.id, kind: c.kind, paid: !c.free }); }
      } else cluesBox.appendChild(el('div', 'clue hidden-clue', '▒▒▒ платная улика'));
    });
    m.appendChild(cluesBox);
    const paidLeft = l.clues.filter((c, ci) => !c.free && ci >= l.revealedClues).length;
    if (paidLeft > 0) {
      const pb = el('button', 'btn secondary', `👁 Ещё улика (реклама, ${C().ads.rewarded.extra_clue}/день)`);
      pb.onclick = async () => {
        const used = countPaidToday();
        if (used >= C().ads.rewarded.extra_clue) { toast('Лимит платных улик на сегодня'); return; }
        const ok = await window.SDK.rewarded('extra_clue');
        if (ok) { l.revealedClues = l.clues.filter(c => c.free).length + used + 1; T.log('clue_revealed', { lot: l.id }); closeModal(); openLotModal(i); }
      };
      m.appendChild(pb);
    }
    // диапазон оценки по просмотренным уликам
    const viewed = l.clues.filter((c, ci) => c.free || ci < l.revealedClues).length;
    const u = E.uncertainty(viewed, save);
    const [lo, hi] = E.estimateRange(l.trueValue, u);
    m.appendChild(el('div', 'est-range', `Ваш диапазон по уликам: <b>${lo}–${hi} ₽</b> <small>(улик: ${viewed})</small>`));
    m.appendChild(el('div', 'hint', 'Ваша оценка (для статистики и +25 ₽ за точность):'));
    const bands = el('div', 'bands');
    C().estimateBands.forEach((b, bi) => {
      const bb = el('button', 'btn band' + (l.estimateBand === bi ? ' sel' : ''), E.bandLabel(bi));
      bb.onclick = () => {
        l.estimateBand = bi; l.estimated = true;
        if (!l.estLogged) { l.estLogged = true; save.est.submitted++; T.log('estimate_submitted', { lot: l.id, band: bi, range: [lo, hi] }); }
        SFX.click(); closeModal(); renderInspect();
      };
      bands.appendChild(bb);
    });
    m.appendChild(bands);
    const close = el('button', 'btn secondary', 'Закрыть');
    close.onclick = closeModal;
    m.appendChild(close);
    ov.appendChild(m); ov.onclick = (e) => { if (e.target === ov) closeModal(); };
    app.appendChild(ov);
    function closeModal() { ov.remove(); }
    T.log('lot_inspected', { lot: l.id, clues: viewed });
  }
  function countPaidToday() {
    return T.buffer().filter(e => e.event === 'clue_revealed').length; // упрощённо: за сессию
  }

  /* ================= движок торгов ================= */
  function nextBidPrice(l) { return l.price === 0 ? l.start : l.price + E.increment(l.price); }
  function bandDiff(band, trueV) {
    const b = C().estimateBands[band];
    const mid = b[1] >= 999999 ? b[0] * 1.5 : (b[0] + b[1]) / 2;
    return +((mid - trueV) / trueV).toFixed(2);
  }

  function renderBidding(l) {
    const content = screen('Торги');
    content.appendChild(el('div', 'bid-lot',
      `<div class="crate-mini">${window.CRATE_SVG}</div>
       <div><b>Лот ${day.idx}/${day.lots.length}</b> ${lotBadges(l)}<br>
       <small>Ваша оценка: ${l.estimateBand != null ? E.bandLabel(l.estimateBand) : 'не дана'}</small></div>`));
    if (save.day === 1 && !(save.tips && save.tips.bid)) {
      save.tips = Object.assign({}, save.tips, { bid: true });
      content.appendChild(el('div', 'hint', '💡 Поднимайте ставку или пасуйте. У каждого соперника свой предел цены — угадывайте его по словам и повадкам и не переплачивайте.'));
    }
    const npcsRow = el('div', 'npcs');
    l.npcs.forEach(b => {
      const def = window.NPCS[b.id];
      const wants = def.loves ? def.loves.includes(l.item.cat) : true;
      npcsRow.appendChild(el('div', 'npc' + (!b.active ? ' out' : '') + (l.high === b.id ? ' leader' : ''),
        `<div class="face sm">${window.FACES[def.face]}</div>
         <b>${def.name}</b><br><small>${def.role}</small>${wants && def.loves ? '<br><span class="heart">♥ нравится</span>' : ''}
         <div class="npc-state">${!b.active ? 'пас' : l.high === b.id ? 'лидер: ' + b.lastBid : (b.lastBid ? 'до ' + b.lastBid : 'думает…')}</div>`));
    });
    content.appendChild(npcsRow);
    content.appendChild(el('div', 'price-line', `Текущая цена: <b id="bidPrice">${l.price || l.start}</b> ₽ ${l.price ? `<small>(шаг ${E.increment(l.price)})</small>` : '<small>(стартовая)</small>'}`));
    const logBox = el('div', 'bid-log'); logBox.id = 'bidLog';
    (l.log || []).slice(-6).forEach(x => logBox.appendChild(el('div', '', x)));
    content.appendChild(logBox);
    const btns = el('div', 'row'); btns.id = 'bidBtns';
    content.appendChild(btns);
    l._ui = { npcsRow, logBox, btns, content };
  }
  function showBubble(l, npcId, text) {
    if (!l._ui) return;
    const idx = l.npcs.findIndex(b => b.id === npcId);
    const node = l._ui.npcsRow.children[idx]; if (!node) return;
    const old = node.querySelector('.bubble'); if (old) old.remove();
    const b = el('div', 'bubble', '«' + text + '»');
    node.appendChild(b);
    setTimeout(() => b.remove(), 2600);
  }
  function updateBidUI(l) {
    if (!l._ui) return renderBidding(l);
    const { npcsRow, logBox, btns, content } = l._ui;
    const priceEl = content.querySelector('#bidPrice');
    if (priceEl) { priceEl.textContent = l.price || l.start; priceEl.classList.remove('pop'); void priceEl.offsetWidth; priceEl.classList.add('pop'); }
    const pl = content.querySelector('.price-line small');
    if (pl) pl.textContent = l.price ? `(шаг ${E.increment(l.price)})` : '(стартовая)';
    l.npcs.forEach((b, i) => {
      const node = npcsRow.children[i]; if (!node) return;
      const def = window.NPCS[b.id];
      node.className = 'npc' + (!b.active ? ' out' : '') + (l.high === b.id ? ' leader' : '');
      node.querySelector('.npc-state').textContent = !b.active ? 'пас' : l.high === b.id ? 'лидер: ' + b.lastBid : (b.lastBid ? 'до ' + b.lastBid : 'думает…');
    });
    logBox.innerHTML = '';
    (l.log || []).slice(-6).forEach(x => logBox.appendChild(el('div', '', x)));
    btns.innerHTML = '';
    if (l.playerIn && !l._resolved) {
      const nb = nextBidPrice(l);
      if (l.high === 'player') {
        btns.appendChild(el('div', 'hint', 'Вы — лидер. Соперники думают…'));
      } else if (nb > save.coins) {
        btns.appendChild(el('div', 'hint', 'Не хватает монет на ставку — придётся пасовать'));
        const p = el('button', 'btn secondary', 'Пас'); p.onclick = () => playerAct(l, 'pass'); btns.appendChild(p);
      } else {
        const r = el('button', 'btn gold', `Поднять до ${nb} ₽`); r.onclick = () => playerAct(l, 'raise'); btns.appendChild(r);
        const p = el('button', 'btn secondary', 'Пас'); p.onclick = () => playerAct(l, 'pass'); btns.appendChild(p);
      }
    }
  }
  function playerAct(l, act) { if (playerResolve) { const r = playerResolve; playerResolve = null; r(act); } }
  function waitPlayer() { return new Promise(res => { playerResolve = res; }); }
  function bidLog(l, msg) { l.log.push(msg); }

  async function runBidding(l) {
    l.price = 0; l.high = null; l.playerIn = true; l._resolved = false;
    l.npcs.forEach(b => { b.active = b.cap > 0 && (b.cap >= l.start * 0.75 || Math.random() < 0.6); b.lastBid = 0; b.waits = 0; });
    renderBidding(l);
    T.log('bid_started', { lot: l.id, start: l.start, npcs: l.npcs.filter(b=>b.active).map(b=>b.id) });
    let guard = 0;
    while (guard++ < 60) {
      // ход игрока
      if (l.playerIn && l.high !== 'player') {
        const nb = nextBidPrice(l);
        if (nb > save.coins) {
          bidLog(l, 'Вы: не хватает монет — пас'); l.playerIn = false;
          l.playerMax = l.playerMax || l.price;
          T.log('bid_stopped', { lot: l.id, reason: 'no_coins', price: l.price, playerMax: l.playerMax });
        } else {
          updateBidUI(l);
          const act = await waitPlayer();
          if (act === 'raise') {
            l.price = nb; l.high = 'player'; l.playerEverBid = true; l.playerMax = nb;
            l.rounds = (l.rounds || 0) + 1;
            bidLog(l, `Вы: ${nb} ₽`);
            T.log('bid_raised', { lot: l.id, amount: nb, round: l.rounds });
            SFX.click();
          } else {
            l.playerIn = false;
            l.playerMax = l.playerMax || l.price;
            bidLog(l, `Вы: пас (остановились на ${l.playerMax} ₽)`);
            T.log('bid_stopped', { lot: l.id, reason: 'choice', price: l.price, playerMax: l.playerMax });
          }
        }
        updateBidUI(l); await sleep(speed * 0.6);
      }
      // ходы NPC
      let anyoneBid = false;
      for (const b of l.npcs) {
        if (!b.active) continue;
        if (l.high === b.id) continue;
        const dec = AS.npcDecide(b, l);
        const def = window.NPCS[b.id];
        if (dec.action === 'bid') {
          l.price = dec.amount; l.high = b.id; b.lastBid = dec.amount;
          bidLog(l, `${def.name}: ${dec.amount} ₽ — «${dec.phrase}»`);
          SFX.click(); anyoneBid = true;
          updateBidUI(l); showBubble(l, b.id, dec.phrase); await sleep(speed);
          if (l.playerIn) break; // возвращаем ход игроку
        } else if (dec.action === 'pass') {
          b.active = false;
          bidLog(l, `${def.name}: пас`);
          T.log('npc_pass', { lot: l.id, npc: b.id, at: l.price });
          updateBidUI(l); await sleep(speed * 0.5);
        } else { // wait
          b.waits = (b.waits || 0) + 1;
          if (b.waits > 2) { b.active = false; bidLog(l, `${def.name}: пас (передумал)`); }
          await sleep(speed * 0.4);
        }
      }
      const left = l.npcs.filter(b => b.active && l.high !== b.id).length;
      // конец: игрок-лидер и активных соперников нет
      if (l.high === 'player' && l.npcs.filter(b => b.active).length === 0) { l.winner = 'player'; break; }
      if (l.high === 'player' && left === 0) { l.winner = 'player'; break; }
      // конец: игрок выбыл, остался один (или ноль) NPC
      if (!l.playerIn) {
        const activeNpcs = l.npcs.filter(b => b.active);
        if (activeNpcs.length === 0) { l.winner = l.high; break; }
        if (activeNpcs.length === 1 && l.high === activeNpcs[0].id) { l.winner = l.high; break; }
        if (!anyoneBid && l.price === 0 && activeNpcs.every(b => !b.active)) { l.winner = null; break; }
      }
      if (l.price === 0 && !l.playerIn && !anyoneBid) { l.winner = null; break; }
    }
    l._resolved = true;
    if (l.winner === 'player') {
      setCoins(save.coins - l.price);
      l.margin = l.trueValue - l.price;
      save.stats.wins++;
      const ord = OS.matching(save, l.item);
      const motivated = !!(ord || (l.item.set && !save.owned[l.item.id]) || l.item.fixture);
      if (motivated) save.stats.motivated++;
      T.log('auction_won', { lot: l.id, price: l.price, true: l.trueValue, margin: l.margin, order: ord ? ord.id : null, motivated, playerMax: l.playerMax });
      bidLog(l, `🔨 Молоток! Лот ваш за ${l.price} ₽`);
      updateBidUI(l); SFX.coins();
      const scr = document.querySelector('.screen'); if (scr) { scr.classList.add('gavel'); setTimeout(() => scr.classList.remove('gavel'), 700); }
      await sleep(speed);
      lot = l; renderOpening();
    } else {
      if (l.winner) {
        const b = l.npcs.find(x => x.id === l.winner) || { id: l.winner };
        l.price = Math.max(l.price, b.lastBid || l.start);
      }
      save.stats.losses++; day.losses++;
      T.log('auction_lost', { lot: l.id, winner: l.winner, price: l.price, true: l.trueValue, band: l.estimateBand, playerMax: l.playerMax || 0 });
      await renderLossScreen(l);
    }
  }

  async function renderLossScreen(l) {
    const content = screen('Лот ушёл');
    if (!l.winner) {
      content.appendChild(el('div', 'item-card',
        `<div class="iname">Лот не ушёл</div>
         <div class="story">— Никто не стал брать: стартовая цена оказалась выше аппетита публики. Такое тоже рынок.<br>— Настоящая стоимость была: ${l.trueValue} ₽.</div>`));
      if (l.estimateBand != null) {
        const ok = E.bandOf(l.trueValue) === l.estimateBand;
        day.estDay.n++; if (ok) { day.estDay.ok++; save.est.correct++; setCoins(save.coins + C().economy.estimateReward); }
        content.appendChild(el('div', 'hint', ok ? `✅ Точная оценка: +${C().economy.estimateReward} ₽` : 'Оценка мимо — сверьтесь с правдой выше.'));
      }
      persist();
      const nb = el('button', 'btn big', 'Следующий лот →');
      nb.onclick = () => { SFX.click(); nextLotFlow(); };
      content.appendChild(nb);
      return;
    }
    const lines = l.playerEverBid === false ? RS.watchLines(l) : RS.lossLines(l, { band: l.estimateBand, playerMax: l.playerMax });
    const def = l.winner ? window.NPCS[l.winner] : null;
    content.appendChild(el('div', 'item-card',
      `${def ? `<div class="face">${window.FACES[def.face]}</div>` : ''}
       <div class="iname">${def ? def.name + ' забрал лот' : 'Лот не ушёл — никто не стал брать'}</div>
       <div class="story">${lines.map(x => '— ' + x).join('<br>')}</div>`));
    // награда за точную оценку
    if (l.estimateBand != null && l.winner) {
      const ok = E.bandOf(l.trueValue) === l.estimateBand;
      day.estDay.n++; if (ok) day.estDay.ok++;
      if (ok) { setCoins(save.coins + C().economy.estimateReward); save.est.correct++;
        content.appendChild(el('div', 'hint', `✅ Ваша оценка (${E.bandLabel(l.estimateBand)}) верна: +${C().economy.estimateReward} ₽`)); SFX.coins(); }
      else content.appendChild(el('div', 'hint', `Оценка (${E.bandLabel(l.estimateBand)}) мимо: правда была ${E.bandLabel(E.bandOf(l.trueValue))}`));
      T.log('estimate_resolved', { lot: l.id, ok, band: l.estimateBand, true: l.trueValue, diff: bandDiff(l.estimateBand, l.trueValue) });
    }
    persist();
    const b = el('button', 'btn big', 'Следующий лот →');
    b.onclick = () => { SFX.click(); nextLotFlow(); };
    content.appendChild(b);
    await sleep(10);
  }

  function nextLotFlow() {
    if (day.idx >= day.lots.length) { renderDayResult(); return; }
    const l = day.lots[day.idx]; day.idx++;
    runBidding(l);
  }

  /* ================= вскрытие → реставрация → оценка → решение ================= */
  function renderOpening() {
    const l = lot;
    app.innerHTML = '';
    const s = el('div', 'screen');
    const stage = el('div', 'opening-stage');
    const rays = el('div', 'rays');
    const crate = el('div', 'crate shake', window.CRATE_SVG);
    const reveal = el('div', 'reveal-item');
    stage.appendChild(rays); stage.appendChild(crate); stage.appendChild(reveal);
    stage.appendChild(el('div', 'skip-hint', 'нажмите, чтобы не ждать'));
    s.appendChild(stage); app.appendChild(s);
    let done = false;
    const finish = () => { if (done) return; done = true; [t1,t2,t3,t4].forEach(clearTimeout); stage.onclick = null; renderRestoreScene(); };
    for (let i = 0; i < 14; i++) {
      const d = el('div', 'dust');
      d.style.left = (35 + Math.random() * 30) + '%'; d.style.top = (40 + Math.random() * 20) + '%';
      stage.appendChild(d);
      d.animate ? d.animate([{ transform: 'translate(0,0)', opacity: .9 }, { transform: `translate(${Math.random()*200-100}px, ${-(60+Math.random()*150)}px)`, opacity: 0 }], { duration: 1100 + Math.random()*800, delay: 200 + i*50 }) : null;
    }
    const t1 = setTimeout(() => crate.classList.remove('shake'), 1500);
    const t2 = setTimeout(() => rays.classList.add('on'), 1400);
    const t3 = setTimeout(() => {
      crate.style.transition = 'all .4s'; crate.style.opacity = '0';
      reveal.innerHTML = l.item.svg;
      const sv = reveal.firstElementChild; if (sv) sv.setAttribute('style', 'filter:brightness(.5) sepia(.9);width:100%;height:100%');
      requestAnimationFrame(() => reveal.classList.add('show'));
      l.item.rarity === 'legend' ? SFX.legendary() : SFX.reveal();
    }, 2000);
    const t4 = setTimeout(finish, 3400);
    stage.onclick = finish;
    T.log('item_revealed', { item: l.item.id, rarity: l.item.rarity, cond: l.cond, lot: l.id });
  }

  function renderRestoreScene() {
    const l = lot;
    const host = el('div', 'screen'); app.innerHTML = ''; app.appendChild(host);
    const fast = (l.item.value[1] <= 30);
    window.Restore.play(host, l.item, l.item.restore, {
      fast,
      onDone: (q, ms, auto) => { l.q = q; l.restoreMs = ms; l.autoRestore = auto; renderAppraisal(); }
    });
  }

  function renderAppraisal() {
    const l = lot;
    const sale2 = Math.round(l.trueValue * E.priceMultiplier(l.q) * G.sellMultiplierForItem(save, l.item));
    l.sale = sale2;
    const content = screen('Оценка находки');
    const condTxt = l.cond < 0.85 ? 'потрёпанное' : l.cond > 1.12 ? 'отличное' : 'обычное';
    content.appendChild(el('div', 'item-card r-' + l.item.rarity,
      `<div class="sprite">${l.item.svg}</div>
       <div class="badge ${l.item.rarity}">${rarityLabel(l.item.rarity)}</div>
       <div class="iname">${l.item.name}</div>
       <div class="story">${l.item.story}</div>
       <div class="calc">база ${l.base} × состояние ${l.cond} (${condTxt}) × реставрация ${Math.round(E.priceMultiplier(l.q)*100)}% = <b>${l.sale}</b> ₽</div>`));
    if (l.estimateBand != null) {
      const ok = E.bandOf(l.trueValue) === l.estimateBand;
      day.estDay.n++; if (ok) { day.estDay.ok++; save.est.correct++; setCoins(save.coins + C().economy.estimateReward); }
      content.appendChild(el('div', 'hint', ok ? `✅ Точная оценка: +${C().economy.estimateReward} ₽` : `Оценка мимо: вы ставили ${E.bandLabel(l.estimateBand)}, правда — ${E.bandLabel(E.bandOf(l.trueValue))}`));
      T.log('estimate_resolved', { lot: l.id, ok, band: l.estimateBand, true: l.trueValue, diff: bandDiff(l.estimateBand, l.trueValue) });
    }
    const b = el('button', 'btn big', 'Что делать с находкой?');
    b.onclick = () => { SFX.click(); renderDecision(); };
    content.appendChild(b);
    persist();
    T.log('screen_appraisal', { item: l.item.id, sale: l.sale, margin: l.sale - l.price });
  }
  function rarityLabel(r) { return { junk: 'Хлам', common: 'Обычный', rare: 'Редкий', epic: 'Эпический', legend: 'Легендарный' }[r]; }

  function renderDecision() {
    const l = lot;
    const dup = !!save.owned[l.item.id];
    const content = screen(dup ? 'Дубликат' : 'Решение');
    if (dup) {
      const v = E.dupValue(l.sale);
      content.appendChild(el('div', 'item-card',
        `<div class="sprite" style="width:120px;height:120px">${l.item.svg}</div>
         <div class="story">Такое уже есть в лавке. Коллекционеры берут дубликат за ${v} ₽.</div>`));
      const b = el('button', 'btn big', `Продать дубликат за ${v}`);
      b.onclick = () => { setCoins(save.coins + v); save.stats.dup++; SFX.coins(); coinFly(5);
        T.log('decision', { choice: 'dup_autosell', item: l.item.id, value: v, motivation: 'other' });
        T.log('item_sold', { item: l.item.id, value: v, to: 'dup' });
        lot.delta = v; lot.kind = 'dup'; afterDecision(); };
      content.appendChild(b); persist(); return;
    }
    const ord = OS.matching(save, l.item);
    const keep = E.keepValue(l.sale);
    const fixtureDef = l.item.fixture ? window.FIXTURES.find(f => f.item === l.item.id) : null;
    const canFixture = fixtureDef && !(save.fixtures || []).includes(fixtureDef.item);
    const vitrineSlots = C().shop[save.shopLevel].vitrine || 0;
    const canVitrine = l.item.rarity === 'legend' && (save.vitrine || []).length < vitrineSlots;

    const hints = [];
    if (ord) hints.push(`📋 <b>${ord.who}</b> ждёт именно такое: выплата <b>${E.orderPayout(ord, l.sale, save)} ₽</b> (×${C().economy.orderMult[ord.mult]})${l.item.set ? ' — но предмет из набора!' : ''}`);
    if (canFixture) hints.push(`🔧 Можно установить в лавке: <b>${fixtureDef.name}</b> — ${fixtureDef.desc} (навсегда)`);
    if (canVitrine) hints.push('✨ Витрина: легендарный экспонат даст +8% ко всем продажам');
    if (l.item.set && !ord) hints.push(`🏆 В набор «${window.SETS[l.item.set].name}» (${G.setOwned(save, l.item.set)}/${window.SETS[l.item.set].need})`);
    content.appendChild(el('div', 'item-card r-' + l.item.rarity,
      `<div class="sprite" style="width:110px;height:110px">${l.item.svg}</div>
       <div class="iname">${l.item.name} · ${l.sale} ₽</div>
       <div class="story">${hints.join('<br>') || 'Свободная продажа или полка коллекции.'}</div>`));
    const row = el('div', 'decision-grid');
    if (ord) {
      const pay = E.orderPayout(ord, l.sale, save);
      const ob = el('button', 'btn gold', `📋 Отдать ${ord.whoDat || ord.who} за ${pay}`);
      ob.onclick = () => { setCoins(save.coins + pay); OS.complete(save, ord.id); SFX.legendary(); coinFly(7);
        T.log('decision', { choice: 'order', item: l.item.id, order: ord.id, value: pay, motivation: 'order' });
        T.log('item_sold', { item: l.item.id, value: pay, to: ord.id });
        T.log('goal_completed', { type: 'order', id: ord.id, payout: pay });
        lot.delta = pay; lot.kind = 'order'; toast(`Заказ закрыт! ${ord.who} доволен.`); afterDecision(); };
      row.appendChild(ob);
    }
    const sb = el('button', 'btn', `Продать за ${l.sale}`);
    sb.onclick = () => { setCoins(save.coins + l.sale); save.stats.sold++; save.stats.best = Math.max(save.stats.best, l.sale); SFX.coins(); coinFly(6);
      T.log('decision', { choice: 'sell', item: l.item.id, value: l.sale, margin: l.sale - l.price, motivation: 'resale' });
      T.log('item_sold', { item: l.item.id, value: l.sale, to: 'market', margin: l.sale - l.price });
      lot.delta = l.sale; lot.kind = 'sell'; afterDecision(); };
    row.appendChild(sb);
    const kb = el('button', 'btn secondary', `В коллекцию (+${keep})`);
    kb.onclick = () => { const setInProgress = l.item.set && G.setOwned(save, l.item.set) < window.SETS[l.item.set].need;
      setCoins(save.coins + keep); save.stats.kept++; save.owned[l.item.id] = { q: +l.q.toFixed(2) }; SFX.reveal(); coinFly(3);
      const motiv = setInProgress ? 'set' : 'collection';
      T.log('decision', { choice: 'keep', item: l.item.id, value: keep, motivation: motiv });
      T.log('item_kept', { item: l.item.id, motivation: motiv });
      if (l.item.set && G.setOwned(save, l.item.set) === window.SETS[l.item.set].need) {
        save.setDone = save.setDone || {};
        if (!save.setDone[l.item.set]) {
          save.setDone[l.item.set] = true;
          T.log('goal_completed', { type: 'set', set: l.item.set });
          toast(`🏆 Набор «${window.SETS[l.item.set].name}» собран! ${window.SETS[l.item.set].bonus}`);
        }
      }
      lot.delta = keep; lot.kind = 'keep'; afterDecision(); };
    row.appendChild(kb);
    if (canFixture) {
      const fb = el('button', 'btn secondary', `🔧 Установить: ${fixtureDef.name}`);
      fb.onclick = () => { save.owned[l.item.id] = 'fixture'; G.installFixture(save, l.item.id); SFX.reveal();
        T.log('fixture_installed', { item: l.item.id });
        T.log('goal_completed', { type: 'improvement', kind: 'fixture', item: l.item.id });
        lot.delta = 0; lot.kind = 'fixture'; toast(`${fixtureDef.name}: ${fixtureDef.desc}`); afterDecision(); };
      row.appendChild(fb);
    }
    if (canVitrine) {
      const vb = el('button', 'btn secondary', '✨ В витрину (+8% продаж)');
      vb.onclick = () => { save.owned[l.item.id] = 'vitrine'; G.vitrinePut(save, l.item.id); SFX.legendary();
        T.log('vitrine_put', { item: l.item.id });
      T.log('goal_completed', { type: 'improvement', kind: 'vitrine', item: l.item.id });
        lot.delta = 0; lot.kind = 'vitrine'; afterDecision(); };
      row.appendChild(vb);
    }
    content.appendChild(row);
    T.log('screen_decision', { item: l.item.id, dup: false, hasOrder: !!ord, sale: l.sale });
    persist();
  }

  function afterDecision() {
    day.wins++;
    persist();
    const content = screen('Сделка');
    const msgs = { sell: `Продано за ${lot.delta} ₽ (куплен за ${lot.price} — прибыль ${lot.delta - lot.price >= 0 ? '+' : ''}${lot.delta - lot.price})`,
      order: `Заказ выполнен: +${lot.delta} ₽`, keep: 'Предмет занял место в альбоме', dup: `Дубликат продан: +${lot.delta} ₽`,
      fixture: 'Мастер прикрутил экспонат на место — лавка стала чуточку лучше', vitrine: 'Витрина сияет: +8% ко всем продажам навсегда' };
    content.appendChild(el('div', 'item-card',
      `<div style="width:100px;height:100px">${lot.item.svg}</div>
       <div class="result-big delta-plus">${msgs[lot.kind]}</div>
       <div class="hint"><small>Монеты: <b>${save.coins}</b> · Альбом: <b>${Object.keys(save.owned).length}/${window.ITEMS.length}</b></small></div>`));
    const b = el('button', 'btn big', 'К торгам →');
    b.onclick = () => { SFX.click(); nextLotFlow(); };
    content.appendChild(b);
    if (!save.ftue.done && lot.kind === 'order') {
      save.ftue.done = true; persist();
      content.appendChild(el('div', 'hint', '💡 Вот и весь секрет: на аукционе покупаете дёшево — заказы и наборы делают находки дорогими. Завтра лавка откроется по-взрослому.'));
      T.log('ftue_step', { step: 'first_order_done' });
    }
  }

  /* ================= итоги дня ================= */
  function renderDayResult() {
    const content = screen('Итоги дня');
    const profit = save.coins - day.dayStartCoins;
    const acc = day.estDay.n ? Math.round(100 * day.estDay.ok / day.estDay.n) : null;
    content.appendChild(el('div', 'item-card',
      `<div class="title" style="color:#4a3620">День ${save.day} закрыт</div>
       <div class="result-big ${profit >= 0 ? 'delta-plus' : ''}">${profit >= 0 ? '+' : ''}${profit} ₽</div>
       <div class="story">
         Выиграно лотов: ${day.wins} · ушло соперникам: ${day.losses}<br>
         ${acc != null ? `Точность оценок дня: ${acc}% (${day.estDay.ok}/${day.estDay.n})<br>` : ''}
         Всего заказов выполнено: ${save.stats.ordersDone} · баланс: ${save.coins} ₽
       </div>`));
    if (acc != null && day.estDay.n >= 2) content.appendChild(el('div', 'hint', acc >= 60 ? '👁 Глаз-алмаз: вы всё точнее оцениваете лоты — соперникам пора напрячься.' : 'Совет: читайте все улики до ставки — точная оценка приносит и деньги, и знание рынка.'));
    const b = el('button', 'btn big', 'Спать → новый день');
    b.onclick = () => { SFX.click(); window.SDK.interstitial('day_result'); endDay(); };
    content.appendChild(b);
    T.log('day_end', { day: save.day, profit, wins: day.wins, losses: day.lots.length - day.wins, est_ok: day.estDay.ok, est_n: day.estDay.n, coins: save.coins });
    persist();
  }

  function endDay() {
    if (save.day === 1) save.ftue.done = true;
    const expired = OS.tickDay(save);
    expired.forEach(o => { save.stats.ordersExpired++; T.log('order_expired', { id: o.id }); });
    if (expired.length) toast(`Заказ(ы) истекли: ${expired.map(o => o.who).join(', ')}`);
    save.day++;
    persist();
    renderMorning(false);
  }

  /* ================= альбом ================= */
  function renderAlbum() {
    const content = screen('Альбом');
    const setGroups = { tech: [], clocks: [], home: [], free: [] };
    window.ITEMS.forEach(i => setGroups[i.cat].push(i));
    const titles = { tech: 'Советская электроника (набор)', clocks: 'Мастер и приборы (набор)', home: 'Уютный дом (набор)', free: 'Разности' };
    Object.keys(setGroups).forEach(cat => {
      const owned = setGroups[cat].filter(i => save.owned[i.id]).length;
      content.appendChild(el('div', 'sec-title', `${window.CATS[cat].icon} ${titles[cat]} — ${owned}/${setGroups[cat].length}`));
      const cells = el('div', 'cells');
      setGroups[cat].forEach(it => {
        const own = save.owned[it.id];
        const cell = el('div', 'cell' + (own ? ' owned ' + it.rarity + '-glow' : ''));
        cell.innerHTML = own
          ? `<div class="mini">${it.svg}</div><small>${own === 'fixture' ? '🔧' : own === 'vitrine' ? '✨' : ''}</small>`
          : `<div class="mini" style="filter:brightness(0) opacity(.25)">${it.svg}</div>`;
        cell.onclick = () => toast(own ? it.name + (typeof own === 'object' ? ` · качество ${Math.round(own.q * 100)}%` : '') : 'Пока не найдено');
        cells.appendChild(cell);
      });
      content.appendChild(cells);
    });
    const back = el('button', 'btn big', '← В лавку');
    back.onclick = () => { SFX.click(); renderMorning(true); };
    content.appendChild(back);
  }

  /* ================= boot ================= */
  function ensureFTUEOrder() {
    if (!save.ftue.done && save.day === 1 && !(save.orders || []).some(o => o.id === 'ftue')) {
      save.orders = [OS.instantiate({ ...C().ftue.order, mult: 'cat' }, save.day, 0), ...(save.orders || [])];
    }
  }
  async function start(opts) {
    app = document.getElementById('app');
    if (opts && opts.speed) speed = opts.speed;
    rnd = E.mulberry32((Date.now() ^ 0x5eed) >>> 0);
    const loaded = await window.SDK.load();
    save = (loaded && loaded.v === 2) ? loaded : newSave();
    T.log('session_start', { fresh: !loaded, day: save.day, coins: save.coins });
    window.addEventListener('pagehide', persist);
    ensureFTUEOrder();
    if (!save.ftue.done && save.day === 1 && save.stats.wins === 0) {
      renderIntro();
    } else {
      OS.ensureBoard(save, rnd);
      renderMorning(true);
    }
  }

  function renderIntro() {
    app.innerHTML = '';
    const s = el('div', 'screen');
    const c = el('div', 'content'); c.style.justifyContent = 'center';
    c.appendChild(el('div', 'intro-card',
      `<h2>Лавка 2.0: Аукцион</h2>
       <p>Вам досталась лавка дяди Августина: пыльные стеллажи, долговая книга и репутация «того самого места, где находят чудеса».</p>
       <p>Утром в дверь постучали. Иванычу срочно нужна ретротехника — и он готов платить втрое.</p>
       <p><b>План на день прост:</b> на аукционе высмотреть лот подешевле, выторговать его, привести в порядок — и отдать тому, кто заплатит больше.</p>`));
    const b = el('button', 'btn big', 'Открыть лавку');
    b.onclick = () => { SFX.click(); T.log('ftue_step', { step: 'intro_done' }); OS.ensureBoard(save, rnd); renderMorning(true); };
    c.appendChild(b);
    c.appendChild(el('div', 'footer-note', `${C().meta.name} · прототип ${C().meta.version}`));
    s.appendChild(c); app.appendChild(s);
  }

  return { start, getSave: () => save, setSpeed: (v) => { speed = v; },
           _debug: { renderMorning, beginDay, runBidding, get dayCtx() { return day; }, get lot() { return lot; } } };
})();
