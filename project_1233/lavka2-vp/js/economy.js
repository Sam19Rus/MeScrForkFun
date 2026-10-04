/* economy.js — оценка стоимости, NPC-потолки, шаги торгов, выплаты, бонусы.
   Единственный источник экономических решений. Данные — только CONFIG/ITEMS. */
window.Economy = (function () {

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const uni = (rnd, a, b) => a + rnd() * (b - a);
  const r5 = (v) => Math.max(5, Math.round(v / 5) * 5);

  /* ---- лот ---- */
  function rollCondition(rnd) { return +uni(rnd, ...window.CONFIG.lot.conditionRange).toFixed(2); }
  function baseValue(item, rnd) { return Math.round(uni(rnd, item.value[0], item.value[1])); }
  function trueValue(base, cond) { return Math.round(base * cond); }
  function startPrice(tV, house, rnd) {
    const f = house.startFrac || window.CONFIG.lot.startFracDefault;
    return r5(tV * uni(rnd, f[0], f[1]));
  }
  function increment(price) {
    const L = window.CONFIG.lot;
    return Math.max(L.minIncrement, r5(price * L.incrementFrac));
  }

  /* ---- NPC-потолок ставки (конечные автоматы в systems.js) ---- */
  function npcCap(npcDef, item, tV, rnd, override) {
    if (override != null) return Math.round(tV * override);
    const loves = npcDef.loves && npcDef.loves.includes(item.cat);
    const range = npcDef.cap.any ? npcDef.cap.any : (loves ? npcDef.cap.love : npcDef.cap.other);
    if (!range || (range[0] === 0 && range[1] === 0)) return 0; // Пётр не торгуется за чужое
    const noise = 1 + uni(rnd, -1, 1) * window.CONFIG.npc.capNoise;
    return Math.max(0, Math.round(tV * uni(rnd, range[0], range[1]) * noise));
  }
  function npcWants(npcDef, item) {
    if (!npcDef.loves) return true; // Зинаида/Нина берут всё (в пределах кэпа)
    return npcDef.loves.includes(item.cat);
  }

  /* ---- улики и оценка игрока ---- */
  function uncertainty(cluesViewed, save) {
    const C = window.CONFIG.clue;
    let narrow = C.narrowPerClue;
    if (save && save.fixtures && save.fixtures.includes('watch')) narrow *= 1.35;     // часы в витрине
    let baseU = C.baseU;
    if (save && window.Goals && window.Goals.setActive(save, "clocks")) baseU *= 0.75; // сет «Мастер»
    return 1 + (baseU - 1) * Math.pow(1 - narrow, cluesViewed);
  }
  function estimateRange(tV, u) { return [Math.max(5, Math.round(tV / u)), Math.round(tV * u)]; }
  function bandOf(v) {
    const b = window.CONFIG.estimateBands;
    for (let i = 0; i < b.length; i++) if (v >= b[i][0] && v < b[i][1]) return i;
    return b.length - 1;
  }
  function bandLabel(i) {
    const b = window.CONFIG.estimateBands[i];
    return b[1] >= 999999 ? `${b[0]}+` : `${b[0]}–${b[1]}`;
  }

  /* ---- реставрация (модель v4) ---- */
  function qualityFromProgress(p) {
    const R = window.CONFIG.restore;
    if (p <= R.qFrom) return 0;
    return Math.min(1, (p - R.qFrom) / (R.qTo - R.qFrom));
  }
  function priceMultiplier(q) { return 0.6 + 0.6 * q; }

  /* ---- продажа / заказы / бонусы ---- */
  function saleValue(tV, q, save) {
    let m = priceMultiplier(q);
    if (save) {
      m *= (window.Goals ? window.Goals.sellMultiplier(save) : 1);            // витрина + фикстуры + сеты
      if ((save.fixtures || []).includes("sewing")) {
        const floor = window.CONFIG.restore.qualityFloorBonus || 0.15;
        m = Math.max(m, 0.6 + 0.6 * floor + 0.35);
      }
    }
    return Math.round(tV * m);
  }
  function orderPayout(order, saleV, save) {
    const mult = window.CONFIG.economy.orderMult[order.mult];
    let m = mult;
    if (save && window.Goals && window.Goals.setActive(save, 'tech') && order.want.cat === 'tech') m *= 1.5;
    return Math.round(saleV * m);
  }
  function keepValue(sale) { return Math.round(sale * window.CONFIG.economy.keep_refund); }
  function dupValue(sale) { return Math.round(sale * window.CONFIG.economy.dup_fraction); }

  /* ---- EV-справки для dev-панели ---- */
  function expectedTrueValue(catPool, condAvg) {
    const avg = catPool.reduce((s, it) => s + (it.value[0] + it.value[1]) / 2, 0) / catPool.length;
    return avg * (condAvg || 1.0);
  }

  return { mulberry32, uni, r5, rollCondition, baseValue, trueValue, startPrice, increment,
           npcCap, npcWants, uncertainty, estimateRange, bandOf, bandLabel,
           qualityFromProgress, priceMultiplier, saleValue, orderPayout, keepValue, dupValue,
           expectedTrueValue };
})();
