/* telemetry.ts — event-bus, ring-buffer 5000, CSV-экспорт.
   Порт из lavka2-vp/js/telemetry.js: те же имена событий (спецификация заказчика),
   работает и headless (тесты) — DOM-слушатели под guard. */

export interface TelemetryEvent {
  t: number;
  iso: string;
  event: string;
  params: Record<string, unknown>;
}

const BUF_MAX = 5000;
const buf: TelemetryEvent[] = [];
const sessionStart = Date.now();
let activeMs = 0;
let lastActive = Date.now();
let devMode = false;

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.hidden) { activeMs += now - lastActive; Telemetry.log('tab_hidden', { after_s: Telemetry.sessionSeconds() }); }
    else { lastActive = now; Telemetry.log('tab_shown', {}); }
  });
  setInterval(() => { if (!document.hidden) activeMs += 1000; }, 1000);
  window.addEventListener('pagehide', () => Telemetry.log('session_end', { total_s: Telemetry.sessionSeconds(), active_s: Math.round(activeMs / 1000) }));
}

export const Telemetry = {
  setDev(v: boolean) { devMode = v; },
  log(event: string, params?: Record<string, unknown>) {
    buf.push({ t: Date.now() - sessionStart, iso: new Date().toISOString(), event, params: params || {} });
    if (buf.length > BUF_MAX) buf.shift();
    if (devMode && typeof console !== 'undefined') console.debug('[tel]', event, params || '');
  },
  sessionSeconds(): number {
    return Math.round((Date.now() - sessionStart) / 1000);
  },
  buffer(): TelemetryEvent[] {
    return buf.slice();
  },
  exportCSV() {
    if (typeof document === 'undefined') return;
    const rows: (string | number)[][] = [['t_ms', 'iso', 'event', 'params_json']];
    buf.forEach(e => rows.push([e.t, e.iso, e.event, JSON.stringify(e.params)]));
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lavka_telemetry_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    Telemetry.log('csv_exported', { rows: buf.length });
  },
  counters() {
    const c = { won: 0, sold: 0, kept: 0, dups: 0, restores: 0, restore_skips: 0, rv_calls: 0, inter_calls: 0, bailouts: 0 };
    buf.forEach(e => {
      const P = e.params as any;
      if (e.event === 'auction_won') c.won++;
      if (e.event === 'decision' && P.choice === 'sell') c.sold++;
      if (e.event === 'decision' && P.choice === 'keep') c.kept++;
      if (e.event === 'decision' && P.choice === 'dup_autosell') c.dups++;
      if (e.event === 'item_restored') c.restores++;
      if (e.event === 'item_restored' && P.auto) c.restore_skips++;
      if (e.event === 'ad_rewarded_call') c.rv_calls++;
      if (e.event === 'ad_interstitial_call') c.inter_calls++;
      if (e.event === 'bailout') c.bailouts++;
    });
    (c as any).session_s = Telemetry.sessionSeconds();
    return c;
  },
  /** метрики dev-панели (порт main.js metrics() + новые: запчасти, стратегии реставрации) */
  metrics() {
    const m = {
      wins: 0, losses: 0, marginSum: 0, estN: 0, estOk: 0, estDiffSum: 0, motivated: 0,
      bids: 0, passes: 0, playerMaxSum: 0, playerMaxN: 0, rv: 0, inter: 0, clues: 0,
      bailouts: 0, auctions: 0, sold: 0, kept: 0, disassembled: 0, npcOffers: 0,
      partsCoins: 0, restoreStrategies: { asis: 0, quick: 0, full: 0, custom: 0 } as Record<string, number>,
      ims: { order: 0, set: 0, improvement: 0, resale: 0, collection: 0, other: 0 } as Record<string, number>,
      bidsPerAuction: 0, avgPlayerMax: null as number | null, winRate: null as number | null,
      estAccuracy: null as number | null, estAvgDiff: null as string | null,
      sellNowRate: null as number | null, imsTotal: 0, imsScore: null as number | null,
      avgGapToNextAuction: null as number | null, avgMargin: null as number | null
    };
    const times = { dayEnds: [] as number[], auctionStarts: [] as number[] };
    buf.forEach(e => {
      const P = e.params as any;
      switch (e.event) {
        case 'auction_started': m.auctions++; times.auctionStarts.push(e.t); break;
        case 'day_end': times.dayEnds.push(e.t); break;
        case 'auction_won':
          m.wins++; m.marginSum += (P.margin || 0); if (P.motivated) m.motivated++;
          if (P.playerMax != null) { m.playerMaxSum += P.playerMax; m.playerMaxN++; }
          break;
        case 'auction_lost':
          m.losses++;
          if (P.playerMax) { m.playerMaxSum += P.playerMax; m.playerMaxN++; }
          break;
        case 'estimate_resolved': m.estN++; if (P.ok) m.estOk++; if (P.diff != null) m.estDiffSum += Math.abs(P.diff); break;
        case 'bid_raised': m.bids++; break;
        case 'bid_stopped': m.passes++; break;
        case 'item_sold': m.sold++; if (P.to && P.to !== 'market' && P.to !== 'dup') m.npcOffers += (String(P.to).startsWith('npc_') ? 1 : 0); break;
        case 'item_kept': m.kept++; break;
        case 'donor_disassembled': m.disassembled++; break;
        case 'part_bought': m.partsCoins += (P.coins || 0); break;
        case 'restore_strategy': if (m.restoreStrategies[P.strategy] != null) m.restoreStrategies[P.strategy]++; break;
        case 'decision': if (P.motivation && m.ims[P.motivation] != null) m.ims[P.motivation]++; break;
        case 'ad_rewarded_call': m.rv++; break;
        case 'ad_interstitial_call': m.inter++; break;
        case 'clue_opened': if (P.paid) m.clues++; break;
        case 'bailout': m.bailouts++; break;
      }
    });
    const gaps: number[] = [];
    times.dayEnds.forEach(t => { const nx = times.auctionStarts.find(a => a > t); if (nx != null) gaps.push(Math.round((nx - t) / 1000)); });
    m.avgGapToNextAuction = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
    m.bidsPerAuction = m.auctions ? +(m.bids / m.auctions).toFixed(1) : 0;
    m.avgPlayerMax = m.playerMaxN ? Math.round(m.playerMaxSum / m.playerMaxN) : null;
    m.winRate = (m.wins + m.losses) ? Math.round(100 * m.wins / (m.wins + m.losses)) : null;
    m.avgMargin = m.wins ? Math.round(m.marginSum / m.wins) : null;
    m.estAccuracy = m.estN ? Math.round(100 * m.estOk / m.estN) : null;
    m.estAvgDiff = m.estN ? Math.round(100 * m.estDiffSum / m.estN) + '%' : null;
    m.sellNowRate = (m.sold + m.kept) ? Math.round(100 * m.sold / (m.sold + m.kept)) : null;
    const imsTotal = Object.values(m.ims).reduce((a, b) => a + b, 0);
    m.imsTotal = imsTotal;
    m.imsScore = imsTotal ? Math.round(100 * (m.ims.order + m.ims.set + m.ims.improvement + m.ims.resale) / imsTotal) : null;
    return m;
  }
};
