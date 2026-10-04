/* main.js — bootstrap + dev-панель (?dev=1) + Gate 0 режим (?gate0) */
(function () {
  const params = new URLSearchParams(location.search);
  window.DEV = params.get('dev') === '1';
  const gate0 = params.has('gate0');

  function buildDevPanel() {
    const p = document.getElementById('devpanel');
    p.classList.remove('hidden');
    function refresh() {
      const c = window.Telemetry.counters();
      const s = window.Game.getSave ? window.Game.getSave() : null;
      const ev = window.Economy.expectedValue('T1').toFixed(0);
      p.innerHTML = `
        <b>DEV · ${window.CONFIG.meta.version}</b><br>
        сессия: ${c.session_s}s · scene: ${window.Game.getScene ? window.Game.getScene() : '?'}<br>
        ящики: ${c.boxes} · продано: ${c.sold} · оставлено: ${c.kept} · дубли: ${c.dups}<br>
        реставрации: ${c.restores} (авто: ${c.restore_skips}) · RV: ${c.rv_calls} · inter: ${c.inter_calls}<br>
        bailouts: ${c.bailouts} · монеты: ${s ? s.coins : '?'} · pity: ${s ? s.pity : '?'}<br>
        EV(T1)=${ev} (цена ~${window.CONFIG.tiers.T1.cost})<br>
        <button id="d_csv">CSV экспорт</button>
        <button id="d_mute">звук</button>
        <button id="d_reset">сброс сейва</button>
        <button id="d_gate0">gate0</button>`;
      document.getElementById('d_csv').onclick = () => window.Telemetry.exportCSV();
      document.getElementById('d_mute').onclick = () => { const m = window.SFX.toggleMute(); window.Telemetry.log('mute', { muted: m }); };
      document.getElementById('d_reset').onclick = async () => { await window.SDK.clearSave(); location.href = location.pathname + '?dev=1'; };
      document.getElementById('d_gate0').onclick = () => { location.href = location.pathname + '?gate0&dev=1'; };
    }
    refresh(); setInterval(refresh, 1000);
  }

  async function boot() {
    await window.SDK.ready();
    if (window.DEV) buildDevPanel();
    window.Telemetry.log('boot', { dev: window.DEV, gate0, items: window.ITEMS.length, version: window.CONFIG.meta.version });
    await window.Game.start({ gate0 });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
