/* economy.js — роллы лотов, стоимости, качество реставрации, EV, pity-счётчик.
   Единственный источник экономических решений (данные — только из CONFIG/ITEMS). */
window.Economy = (function () {

  /* детерминированный PRNG (mulberry32) — для тестов и воспроизводимых сидов */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rollRarity(tier, rnd) {
    const p = window.CONFIG.tiers[tier].p;
    const r = rnd(); let acc = 0;
    for (const key of ['junk', 'common', 'rare', 'epic', 'legend']) {
      acc += p[key];
      if (r <= acc) return key;
    }
    return 'legend';
  }

  function rollItem(rarity, rnd) {
    const pool = window.ITEMS_BY_RARITY[rarity];
    return pool[Math.floor(rnd() * pool.length)];
  }

  function lotPrice(tier, rnd) {
    const t = window.CONFIG.tiers[tier];
    const spread = t.costSpread || 0;
    return Math.round(t.cost * (1 + (rnd() * 2 - 1) * spread));
  }

  function baseValue(item, rnd) {
    const [lo, hi] = item.value;
    return Math.round(lo + rnd() * (hi - lo));
  }

  /* прогресс очистки p → качество q → множитель цены 0.6–1.2 (модель v4: m = 0.6 + 0.6q) */
  function qualityFromProgress(p) {
    const { qFrom, qTo } = window.CONFIG.restore;
    if (p <= qFrom) return 0;
    const q = Math.min(1, (p - qFrom) / (qTo - qFrom));
    return q;
  }
  function priceMultiplier(q) { return 0.6 + 0.6 * q; }

  function saleValue(base, q) { return Math.round(base * priceMultiplier(q)); }
  function keepValue(sale) { return Math.round(sale * window.CONFIG.economy.keep_refund); }
  function dupValue(sale) { return Math.round(sale * window.CONFIG.economy.dup_fraction); }

  /* EV яруса (для тестов и dev-панели) */
  function expectedValue(tier, restoreMult) {
    const m = restoreMult === undefined ? 0.97 : restoreMult;
    const p = window.CONFIG.tiers[tier].p;
    let ev = 0;
    for (const [r, pr] of Object.entries(p)) {
      const vals = window.ITEMS_BY_RARITY[r];
      if (!vals.length) continue;
      const avg = vals.reduce((s, it) => s + (it.value[0] + it.value[1]) / 2, 0) / vals.length;
      ev += pr * avg;
    }
    return ev * m;
  }

  return { mulberry32, rollRarity, rollItem, lotPrice, baseValue,
           qualityFromProgress, priceMultiplier, saleValue, keepValue, dupValue, expectedValue };
})();
