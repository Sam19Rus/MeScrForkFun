/* systems.js — AuctionSystem, NPCBidderSystem, ClueSystem, OrdersSystem,
   GoalsSystem (сеты/лавка/витрина/фикстуры), PostAuctionResultSystem.
   Чистая логика без DOM — сцены в game.js только отображают состояния. */

/* ================= GoalsSystem (сеты, лавка, витрина, фикстуры) ================= */
window.Goals = (function () {
  function setOwned(save, setId) {
    const set = window.SETS[setId];
    const ids = window.ITEMS.filter(i => i.set === setId).map(i => i.id);
    return ids.filter(id => save.owned[id]).length;
  }
  function setTotal(setId) { return window.ITEMS.filter(i => i.set === setId).length; }
  function setActive(save, setId) { return setOwned(save, setId) >= window.SETS[setId].need; }
  function setsDoneCount(save, threshold) {
    return Object.keys(window.SETS).filter(s => setOwned(save, s) >= (threshold || window.SETS[s].need)).length;
  }
  function shopLevel(save) { return save.shopLevel || 1; }
  function canUpgrade(save) {
    const L = shopLevel(save), next = window.CONFIG.shop[L + 1];
    if (!next) return null;
    const reqs = [];
    if (save.coins < next.cost) reqs.push(`монеты ${save.coins}/${next.cost}`);
    if ((save.stats.ordersDone || 0) < next.ordersDone) reqs.push(`заказы ${save.stats.ordersDone || 0}/${next.ordersDone}`);
    const setsOk = setsDoneCount(save, next.setsAt) >= next.setsNeeded;
    const altOk = !!(next.altOrdersDone && (save.stats.ordersDone || 0) >= next.altOrdersDone);
    if (!setsOk && !altOk) reqs.push(`наборы (≥${next.setsAt} предм.) ${setsDoneCount(save, next.setsAt)}/${next.setsNeeded}${next.altOrdersDone ? ` ИЛИ ${next.altOrdersDone} выполненных заказов (${save.stats.ordersDone || 0})` : ''}`);
    return reqs.length ? { ok: false, reqs, next } : { ok: true, next };
  }
  function upgrade(save) {
    const c = canUpgrade(save);
    if (!c || !c.ok) return false;
    save.coins -= c.next.cost; save.shopLevel = shopLevel(save) + 1;
    return true;
  }
  function sellMultiplier(save) {
    let m = 1;
    (save.fixtures || []).forEach(fid => {
      const f = window.FIXTURES.find(x => x.item === fid);
      if (f && f.effect.sellAll) m *= f.effect.sellAll;
    });
    if (setActive(save, 'home')) {
      const e = window.SETS.home.effect;
      // применяется к категории — проверяется в saleValueForItem
    }
    (save.vitrine || []).forEach(() => { m *= 1.08; });
    return m;
  }
  function sellMultiplierForItem(save, item) {
    let m = sellMultiplier(save);
    if (item.cat === 'home' && setActive(save, 'home')) m *= window.SETS.home.effect.mult;
    return m;
  }
  function installFixture(save, itemId) {
    const f = window.FIXTURES.find(x => x.item === itemId);
    if (!f || save.owned[itemId] !== 'fixture' && !save.owned[itemId]) return false;
    if ((save.fixtures || []).includes(itemId)) return false;
    save.fixtures = save.fixtures || []; save.fixtures.push(itemId);
    return true;
  }
  function vitrinePut(save, itemId) {
    const slots = window.CONFIG.shop[shopLevel(save)].vitrine || 0;
    save.vitrine = save.vitrine || [];
    if (save.vitrine.length >= slots) return false;
    save.vitrine.push(itemId); return true;
  }
  function dividend(save) {
    const D = window.CONFIG.dailyDividend;
    return D.base + D.perSetDone * setsDoneCount(save);
  }
  function orderSlots(save) { return window.CONFIG.shop[shopLevel(save)].orders; }
  function houses(save) { return window.CONFIG.shop[shopLevel(save)].houses; }
  function freeClues(save, house) {
    let n = window.HOUSES[house].clueFree;
    if (window.CONFIG.shop[shopLevel(save)].extraClue) n += 1;
    return n;
  }
  return { setOwned, setTotal, setActive, setsDoneCount, shopLevel, canUpgrade, upgrade,
           sellMultiplier, sellMultiplierForItem, installFixture, vitrinePut, dividend,
           orderSlots, houses, freeClues };
})();

/* ================= ClueSystem ================= */
window.ClueSystem = (function () {
  const COND_HINTS_BAD = ['«Следы влаги на упаковке»', '«Угол коробки примят»', '«Пахнет пылью и подвалом»'];
  const COND_HINTS_GOOD = ['«Упаковка на удивление целая»', '«Хранили бережно»', '«Почти не пользовались»'];
  function build(lot, nFree) {
    const it = lot.item, clues = [];
    clues.push({ kind: 'cat', text: `Категория на глаз: ${window.CATS[it.cat].icon} ${window.CATS[it.cat].name}` });
    clues.push({ kind: 'era', text: `Эпоха/происхождение: ${window.CONFIG.eras[it.cat]}` });
    if (lot.photo) clues.push({ kind: 'photo', text: 'Частичное фото: в щель упаковки видно фрагмент', sprite: true });
    clues.push({ kind: 'material', text: `Материал: ${it.clues.material}` });
    clues.push({ kind: 'weight', text: `Вес: ${it.clues.weight}` });
    clues.push({ kind: 'seller', text: `Слова продавца: ${it.clues.seller}` });
    if (it.clues.marking && it.clues.marking !== 'нет') clues.push({ kind: 'marking', text: `Маркировка: ${it.clues.marking}` });
    clues.push({ kind: 'cond', text: lot.cond < 0.85 ? COND_HINTS_BAD[(lot.seedN || 0) % COND_HINTS_BAD.length]
                                  : lot.cond > 1.12 ? COND_HINTS_GOOD[(lot.seedN || 0) % COND_HINTS_GOOD.length]
                                  : '«Состояние обычное, бывшее в употреблении»' });
    // перемешиваем детерминированно и помечаем бесплатные
    const rnd = window.Economy.mulberry32(lot.seed);
    clues.sort(() => rnd() - 0.5);
    clues.forEach((c, i) => { c.free = i < nFree; });
    return clues;
  }
  return { build };
})();

/* ================= AuctionSystem ================= */
window.AuctionSystem = (function () {
  const E = window.Economy;

  function pickItem(house, rnd) {
    const pool = window.ITEMS.filter(it => {
      if (it.rarity === 'junk' && house.pool.junkCut && rnd() < house.pool.junkCut) return false;
      return true;
    });
    // boost категорий дома
    let weighted = [];
    pool.forEach(it => {
      const w = (house.pool.boost && house.pool.boost.includes(it.cat)) ? 3 : 1;
      for (let i = 0; i < w; i++) weighted.push(it);
    });
    return weighted[Math.floor(rnd() * weighted.length)];
  }

  function buildLot(house, rnd, dayN, idx) {
    const item = pickItem(house, rnd);
    const packs = window.CONFIG.packs;
    const pack = packs[Math.floor(rnd() * packs.length)];
    let cond = E.rollCondition(rnd);
    if (pack.condWide) cond = +Math.max(0.55, Math.min(1.45, cond + (rnd() - 0.5) * 0.4)).toFixed(2);
    if (pack.condNarrow) cond = +Math.max(0.85, Math.min(1.2, cond)).toFixed(2);
    const base = E.baseValue(item, rnd);
    const tV = E.trueValue(base, cond);
    return {
      id: `d${dayN}_l${idx}`, item, base, cond, trueValue: tV, pack, photo: !!house.photo,
      start: E.startPrice(tV, house, rnd), seed: (dayN * 977 + idx * 31 + base) >>> 0, seedN: idx,
      clues: null, revealedClues: 0, estimateBand: null,
      npcs: [], price: 0, winner: null, log: []
    };
  }

  function buildDay(save, houseId, rnd) {
    const house = window.HOUSES[houseId];
    const lots = [];
    for (let i = 0; i < house.lots; i++) lots.push(buildLot(house, rnd, save.day, i));
    // NPC-состав
    const ids = Object.keys(window.NPCS);
    let pool = ids.slice();
    if (houseId === 'estate') pool = ['arkady', 'petr', 'zinaida', rnd() < 0.5 ? 'nina' : 'zinaida'];
    if (houseId === 'special') pool = ids;
    const chosen = [...new Set(pool)].slice(0, houseId === 'city' ? 3 : 4);
    lots.forEach(lot => {
      lot.npcs = chosen.map(id => {
        const def = window.NPCS[id];
        const wants = window.Economy.npcWants(def, lot.item);
        const cap = wants ? E.npcCap(def, lot.item, lot.trueValue, rnd) : 0;
        return { id, cap, active: cap > lot.start * 0.6, lastBid: 0 };
      }).filter(b => b.active);
    });
    // clues
    const nFree = window.Goals.freeClues(save, houseId);
    lots.forEach(lot => { lot.clues = window.ClueSystem.build(lot, Math.max(1, nFree + (lot.pack.clues || 0))); });
    return { houseId, lots };
  }

  function buildFTUEDay(save) {
    const rnd = E.mulberry32(777);
    const house = window.HOUSES['city'];
    const lots = window.CONFIG.ftue.lots.map((spec, i) => {
      const item = window.ITEMS_BY_ID[spec.item];
      const cond = spec.cond;
      const base = Math.round((item.value[0] + item.value[1]) / 2);
      const tV = E.trueValue(base, cond);
      const lot = { id: `ftue_l${i}`, item, base, cond, trueValue: tV,
        pack: window.CONFIG.packs[i % window.CONFIG.packs.length], photo: false,
        start: E.startPrice(tV, house, rnd), seed: 1000 + i, seedN: i,
        clues: null, revealedClues: 0, estimateBand: null, npcs: [], price: 0, winner: null, log: [] };
      lot.npcs = (spec.npcs || []).map(id => {
        const def = window.NPCS[id];
        const cap = spec.capMultOverride != null
          ? E.npcCap(def, item, tV, rnd, spec.capMultOverride)
          : E.npcCap(def, item, tV, rnd);
        return { id, cap, active: cap > lot.start * 0.6, lastBid: 0 };
      }).filter(b => b.active);
      lot.clues = window.ClueSystem.build(lot, Math.max(1, 2 + (lot.pack.clues || 0)));
      return lot;
    });
    return { houseId: 'city', lots };
  }

  /* ---- NPCBidderSystem: ход NPC ---- */
  function npcDecide(bidder, lot) {
    const def = window.NPCS[bidder.id];
    const inc = E.increment(Math.max(lot.price, lot.start));
    const next = Math.max(lot.price + inc, lot.start);
    if (next > bidder.cap) return { action: 'pass', phrase: def.pass[0] };
    // агрессия: иногда пасует раньше (блеф-пас), но ниже кэпа всё равно вернётся
    if (def.aggression < 1 && Math.random() > def.aggression + 0.25) return { action: 'wait' };
    return { action: 'bid', amount: next, phrase: def.bid[Math.floor(Math.random() * def.bid.length)] };
  }

  return { buildDay, buildFTUEDay, buildLot, pickItem, npcDecide };
})();

/* ================= OrdersSystem ================= */
window.OrdersSystem = (function () {
  function rollOne(save, rnd, excludeIds) {
    const active = (save.orders || []).map(o => o.id);
    const pool = window.ORDER_TEMPLATES.filter(t =>
      !excludeIds.includes(t.id) && !active.includes(t.id) &&
      !(t.notWith && t.notWith.some(x => active.includes(x))));
    return pool[Math.floor(rnd() * pool.length)];
  }
  const FLAVORS = [
    'Кстати, вещь должна быть с историей.', 'Заберу сам, я рядом живу.', 'Ищу это уже третий месяц.',
    'Если состояние хорошее — накину сверху.', 'Хлам не предлагать.', 'Сроки поджимают, по-настоящему.'
  ];
  function instantiate(tpl, day, extraDays) {
    const d = tpl.days + (extraDays || 0);
    const flavor = tpl.id === 'ftue' ? '' : ' ' + FLAVORS[Math.floor(Math.random() * FLAVORS.length)];
    return { id: tpl.id, who: tpl.who, whoDat: tpl.whoDat || tpl.who, face: tpl.face, want: tpl.want, mult: tpl.mult,
             text: tpl.text + flavor, deadline: day + d, days: d };
  }
  function ensureBoard(save, rnd) {
    save.orders = save.orders || [];
    const slots = window.Goals.orderSlots(save);
    const extra = (save.fixtures || []).includes('cuckoo') ? 1 : 0;
    while (save.orders.length < slots) {
      const tpl = rollOne(save, rnd, save.orders.map(o => o.id));
      if (!tpl) break;
      save.orders.push(instantiate(tpl, save.day, extra));
    }
  }
  function matching(save, item) {
    const orders = save.orders || [];
    // приоритет: конкретный предмет > категория > редкость; наибольшая выплата вперёд
    const matches = orders.filter(o =>
      (o.want.item && o.want.item === item.id) ||
      (o.want.cat && o.want.cat === item.cat) ||
      (o.want.rarity && item.rarity === o.want.rarity) ||
      (o.want.rarity === 'epic' && item.rarity === 'legend'));
    const score = o => (o.want.item ? 3 : o.want.cat ? 2 : 1);
    matches.sort((a, b) => score(b) - score(a));
    return matches[0] || null;
  }
  function complete(save, orderId) {
    save.orders = (save.orders || []).filter(o => o.id !== orderId);
    save.stats.ordersDone = (save.stats.ordersDone || 0) + 1;
  }
  function tickDay(save) {
    const expired = [];
    save.orders = (save.orders || []).filter(o => {
      if (o.id === 'ftue') return save.day < 2; // FTUE-заказ живёт до конца дня 2
      if (save.day > o.deadline) { expired.push(o); return false; }
      return true;
    });
    return expired;
  }
  function wantLabel(want) {
    if (want.item) return window.ITEMS_BY_ID[want.item].name;
    if (want.cat) return `любое: ${window.CATS[want.cat].name}`;
    if (want.rarity) return `редкость: ${window.CONFIG.rarityLabels ? window.CONFIG.rarityLabels[want.rarity] : want.rarity}`;
    return '?';
  }
  return { ensureBoard, matching, complete, tickDay, wantLabel, instantiate };
})();

/* ================= PostAuctionResultSystem ================= */
window.ResultSystem = (function () {
  const E = window.Economy;
  const winnerDef = (lot) => {
    const wid = typeof lot.winner === 'string' ? lot.winner : (lot.winner && lot.winner.id);
    return window.NPCS[wid] || null;
  };
  function lossLines(lot, player) {
    const def = winnerDef(lot);
    const lines = [];
    if (def) lines.push(`${def.name} (${def.role}) забрал лот за ${lot.price} ₽.`);
    else lines.push(`Лот ушёл за ${lot.price} ₽.`);
    lines.push(`Настоящая стоимость: ${lot.trueValue} ₽. Ваша оценка: ${player.band != null ? E.bandLabel(player.band) : '—'}.`);
    const correct = player.band != null && E.bandOf(lot.trueValue) === player.band;
    if (player.playerMax != null) lines.push(`Вы остановились на ${player.playerMax} ₽.`);
    lines.push(correct ? 'Оценка верна — решение пасовать или биться было осознанным.'
                       : 'Оценка мимо: в следующий раз учтите улики точнее.');
    if (lot.price > lot.trueValue) lines.push(`Переплата ${lot.price - lot.trueValue} ₽ — ${def ? def.name : 'покупатель'} иногда горячится. Запомните это.`);
    if (def && def.loves && def.loves.includes(lot.item.cat))
      lines.push(`Подсказка: ${def.name} коллекционирует «${def.loves.map(c => window.CATS[c].name).join(', ')}» — за них он платит выше рынка.`);
    else if (def && def.cap && def.cap.any)
      lines.push(`Подсказка: ${def.name} никогда не платит больше ~${Math.round((def.cap.any[1]) * 100)}% стоимости — против него выгодно торговаться.`);
    return lines;
  }
  function watchLines(lot) {
    const def = winnerDef(lot);
    if (!def) return [`Лот забрал неизвестный покупатель за ${lot.price} ₽ (стоимость была ${lot.trueValue} ₽).`];
    return [`${def.name} забрал за ${lot.price} ₽ (стоимость была ${lot.trueValue} ₽).`,
            lot.price > lot.trueValue ? 'Кажется, он переплатил.' : 'Он купил выгодно — учитесь у него.'];
  }
  return { lossLines, watchLines };
})();

/* Алиасы по спецификации требований (#12) */
window.NPCBidderSystem = { decide: (bidder, lot) => window.AuctionSystem.npcDecide(bidder, lot) };
window.LotValuationSystem = {
  uncertainty: window.Economy.uncertainty, estimateRange: window.Economy.estimateRange,
  bandOf: window.Economy.bandOf, bandLabel: window.Economy.bandLabel
};
window.PostAuctionResultSystem = window.ResultSystem;
window.CollectionGoalSystem = window.Goals;
