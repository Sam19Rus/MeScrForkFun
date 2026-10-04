/* telemetry.js — event-bus, ring-buffer 5000, CSV-экспорт (спека A.9) */
window.Telemetry = (function () {
  const BUF_MAX = 5000;
  const buf = [];
  const sessionStart = Date.now();
  let hiddenAt = null;

  function log(event, params) {
    buf.push({ t: Date.now() - sessionStart, iso: new Date().toISOString(), event, params: params || {} });
    if (buf.length > BUF_MAX) buf.shift();
    if (window.DEV) console.debug('[tel]', event, params || '');
  }

  function sessionSeconds() {
    let s = (Date.now() - sessionStart) / 1000;
    return Math.round(s);
  }

  // учёты «активного» времени (паузы вкладки не считаем)
  let activeMs = 0, lastActive = Date.now();
  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.hidden) { activeMs += now - lastActive; log('tab_hidden', { after_s: sessionSeconds() }); }
    else { lastActive = now; log('tab_shown', {}); }
  });
  setInterval(() => { if (!document.hidden) activeMs += 1000; }, 1000);
  window.addEventListener('pagehide', () => log('session_end', { total_s: sessionSeconds(), active_s: Math.round(activeMs / 1000) }));

  function exportCSV() {
    const rows = [['t_ms', 'iso', 'event', 'params_json']];
    buf.forEach(e => rows.push([e.t, e.iso, e.event, JSON.stringify(e.params).replace(/"/g, '""')]));
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lavka_telemetry_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    log('csv_exported', { rows: buf.length });
  }

  function counters() {
    const c = { boxes: 0, sold: 0, kept: 0, dups: 0, restores: 0, restore_skips: 0, rv_calls: 0, inter_calls: 0, bailouts: 0 };
    buf.forEach(e => {
      if (e.event === 'box_opened') c.boxes++;
      if (e.event === 'decision' && e.params.choice === 'sell') c.sold++;
      if (e.event === 'decision' && e.params.choice === 'keep') c.kept++;
      if (e.event === 'box_opened' && e.params.dup) c.dups++;
      if (e.event === 'restore_complete') c.restores++;
      if (e.event === 'restore_complete' && e.params.auto) c.restore_skips++;
      if (e.event === 'ad_rewarded_call') c.rv_calls++;
      if (e.event === 'ad_interstitial_call') c.inter_calls++;
      if (e.event === 'bailout') c.bailouts++;
    });
    c.session_s = sessionSeconds();
    return c;
  }

  return { log, exportCSV, counters, sessionSeconds, buffer: () => buf.slice() };
})();
