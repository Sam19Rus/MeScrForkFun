/* sdk.js — ISDK интерфейс + MockSDK (MVP-A). Реальный YandexSDK подключается в MVP-B
   без переписывания сцен: те же имена методов (спека A.9). */
(function () {
  const SAVE_KEY = window.CONFIG.meta.saveKey;

  const MockSDK = {
    isMock: true,
    async ready() { window.Telemetry.log('sdk_ready', { mock: true }); },

    /* rewarded: мгновенная «награда» + лог точки. В MVP-B: ysdk.adv.showRewardedVideo */
    async rewarded(point) {
      window.Telemetry.log('ad_rewarded_call', { point, mock: true });
      await new Promise(r => setTimeout(r, 250));
      window.Telemetry.log('ad_rewarded_complete', { point, mock: true });
      return true;
    },

    /* interstitial: только лог (частотой в реальности управляет платформа).
       В MVP-B: gameplayAPI.stop() → showFullscreenAdv → gameplayAPI.start() */
    async interstitial(place) {
      window.Telemetry.log('ad_interstitial_call', { place, mock: true });
      return false; // wasShown=false — как при троттлинге платформой
    },

    async save(data) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { console.warn('save failed', e); }
    },
    async load() {
      try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; }
      catch (e) { return null; }
    },
    async clearSave() { localStorage.removeItem(SAVE_KEY); },

    async leaderboardSubmit(name, score) {
      window.Telemetry.log('leaderboard_stub', { name, score });
    },
    async requestReview() { window.Telemetry.log('review_stub', {}); }
  };

  window.SDK = MockSDK; // в MVP-B: window.SDK = detectYandex() ? YandexSDK : MockSDK;
})();
