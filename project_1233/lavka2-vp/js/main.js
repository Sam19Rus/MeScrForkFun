/* main.js — bootstrap + dev-панель (?dev=1) + ?speed=fast для тестов */
(function () {
  const params = new URLSearchParams(location.search);
  window.DEV = params.get('dev') === '1';
  const fast = params.get('speed') === 'fast';

  function metrics() {
    const buf = window.Telemetry.buffer();
    const m = { wins: 0, losses: 0, marginSum: 0, estN: 0, estOk: 0, estDiffSum: 0, motivated: 0,
                bids: 0, passes: 0, playerMaxSum: 0, playerMaxN: 0, rv: 0, inter: 0, clues: 0,
                bailouts: 0, auctions: 0, sold: 0, kept: 0, ims: { order: 0, set: 0, improvement: 0, resale: 0, collection: 0, other: 0 } };
    const times = { dayEnds: [], auctionStarts: [] };
    buf.forEach(e => {
      const P = e.params || {};
      switch (e.event) {
        case 'auction_started': m.auctions++; times.auctionStarts.push(e.t); break;
        case 'day_end': times.dayEnds.push(e.t); break;
        case 'auction_won': m.wins++; m.marginSum += (P.margin || 0); if (P.motivated) m.motivated++;
          if (P.playerMax != null) { m.playerMaxSum += P.playerMax; m.playerMaxN++; } break;
        case 'auction_lost': m.losses++;
          if (P.playerMax) { m.playerMaxSum += P.playerMax; m.playerMaxN++; } break;
        case 'estimate_resolved': m.estN++; if (P.ok) m.estOk++; if (P.diff != null) m.estDiffSum += Math.abs(P.diff); break;
        case 'bid_raised': m.bids++; break;
        case 'bid_stopped': m.passes++; break;
        case 'item_sold': m.sold++; break;
        case 'item_kept': m.kept++; break;
        case 'decision': if (P.motivation && m.ims[P.motivation] != null) m.ims[P.motivation]++; break;
        case 'ad_rewarded_call': m.rv++; break;
        case 'ad_interstitial_call': m.inter++; break;
        case 'clue_opened': if (P.paid) m.clues++; break;
        case 'bailout': m.bailouts++; break;
      }
    });
    // среднее время между итогами дня и следующим аукционом
    let gaps = [];
    times.dayEnds.forEach(t => { const nx = times.auctionStarts.find(a => a > t); if (nx != null) gaps.push(Math.round((nx - t) / 1000)); });
    m.avgGapToNextAuction = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
    m.bidsPerAuction = m.auctions ? +(m.bids / m.auctions).toFixed(1) : 0;
    m.avgPlayerMax = m.playerMaxN ? Math.round(m.playerMaxSum / m.playerMaxN) : null;
    m.winRate = (m.wins + m.losses) ? Math.round(100 * m.wins / (m.wins + m.losses)) : null;
    m.estAccuracy = m.estN ? Math.round(100 * m.estOk / m.estN) : null;
    m.estAvgDiff = m.estN ? Math.round(100 * m.estDiffSum / m.estN) + '%' : null;
    m.sellNowRate = (m.sold + m.kept) ? Math.round(100 * m.sold / (m.sold + m.kept)) : null;
    const imsTotal = Object.values(m.ims).reduce((a, b) => a + b, 0);
    m.imsTotal = imsTotal;
    m.imsScore = imsTotal ? Math.round(100 * (m.ims.order + m.ims.set + m.ims.improvement + m.ims.resale) / imsTotal) : null;
    return m;
  }

  function buildDevPanel() {
    const p = document.getElementById('devpanel');
    p.classList.remove('hidden');
    function refresh() {
      const s = window.Game.getSave ? window.Game.getSave() : null;
      const m = metrics();
      const c = window.Telemetry.counters();
      p.innerHTML = `
        <b>DEV · ${window.CONFIG.meta.version}</b> · сессия ${c.session_s}s<br>
        день: ${s ? s.day : '?'} · монеты: ${s ? s.coins : '?'} · лавка ур.${s ? s.shopLevel : '?'}<br>
        аукционов за сессию: ${m.auctions} · ставок/аукцион: ${m.bidsPerAuction} · пасов: ${m.passes}<br>
        выигрыш лотов: ${m.winRate != null ? m.winRate + '%' : '—'} (${m.wins}W/${m.losses}L) · ср.маржа ${m.wins ? Math.round(m.marginSum / m.wins) : '—'}<br>
        ср.макс.ставка: ${m.avgPlayerMax != null ? m.avgPlayerMax + ' ₽' : '—'} · пауза день→аукцион: ${m.avgGapToNextAuction != null ? m.avgGapToNextAuction + 's' : '—'}<br>
        точность оценок: ${m.estAccuracy != null ? m.estAccuracy + '%' : '—'} (ср.|ошибка| ${m.estAvgDiff || '—'})<br>
        <b>Item Motivation Score: ${m.imsScore != null ? m.imsScore + '%' : '—'}</b>
          (заказ ${m.ims.order} / сет ${m.ims.set} / улучш. ${m.ims.improvement} / перепродажа ${m.ims.resale} / коллекция ${m.ims.collection} / прочее ${m.ims.other})<br>
        сразу продают: ${m.sellNowRate != null ? m.sellNowRate + '%' : '—'} · заказы всего: ${s ? s.stats.ordersDone : '?'}<br>
        RV: ${m.rv} · inter: ${m.inter} · платные улики: ${m.clues} · bailouts: ${m.bailouts}<br>
        <button id="d_csv">CSV</button><button id="d_mute">звук</button>
        <button id="d_reset">сброс</button><button id="d_speed">${fast ? 'slow' : 'fast'}</button>`;
      document.getElementById('d_csv').onclick = () => window.Telemetry.exportCSV();
      document.getElementById('d_mute').onclick = () => window.SFX.toggleMute();
      document.getElementById('d_reset').onclick = async () => { await window.SDK.clearSave(); location.reload(); };
      document.getElementById('d_speed').onclick = () => {
        const u = new URL(location.href);
        if (u.searchParams.get('speed') === 'fast') u.searchParams.delete('speed'); else u.searchParams.set('speed', 'fast');
        location.href = u.toString();
      };
    }
    refresh(); setInterval(refresh, 1000);
  }

  async function boot() {
    await window.SDK.ready();
    if (window.DEV) buildDevPanel();
    window.Telemetry.log('boot', { dev: window.DEV, fast, items: window.ITEMS.length, version: window.CONFIG.meta.version });
    await window.Game.start({ speed: fast ? 40 : 550 });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
