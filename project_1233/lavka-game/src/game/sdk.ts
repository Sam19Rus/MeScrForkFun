/* sdk.ts — интерфейс платформенного SDK + MockSDK.
   Сигнатуры совпадают с будущим YandexSDK (MVP-B): замена без переписывания сцен.
   Headless-safe: в node сохранения живут в памяти. */
import { CONFIG } from './data/config';
import { Telemetry } from './telemetry';

export interface ISDK {
  isMock: boolean;
  ready(): Promise<void>;
  rewarded(point: string): Promise<boolean>;
  interstitial(place: string): Promise<boolean>;
  save(data: unknown): Promise<void>;
  load(): Promise<any>;
  clearSave(): Promise<void>;
  leaderboardSubmit(name: string, score: number): Promise<void>;
  requestReview(): Promise<void>;
}

const memoryStore = new Map<string, string>();
const hasLocalStorage = typeof localStorage !== 'undefined';

export const MockSDK: ISDK = {
  isMock: true,
  async ready() { Telemetry.log('sdk_ready', { mock: true }); },

  /* rewarded: мгновенная «награда» + лог точки. В MVP-B: ysdk.adv.showRewardedVideo */
  async rewarded(point: string) {
    Telemetry.log('ad_rewarded_call', { point, mock: true });
    await new Promise(r => setTimeout(r, 250));
    Telemetry.log('ad_rewarded_complete', { point, mock: true });
    return true;
  },

  /* interstitial: только лог (частотой управляет платформа) */
  async interstitial(place: string) {
    Telemetry.log('ad_interstitial_call', { place, mock: true });
    return false;
  },

  async save(data: unknown) {
    try {
      const s = JSON.stringify(data);
      if (hasLocalStorage) localStorage.setItem(CONFIG.meta.saveKey, s);
      else memoryStore.set(CONFIG.meta.saveKey, s);
    } catch (e) { console.warn('save failed', e); }
  },
  async load() {
    try {
      const raw = hasLocalStorage ? localStorage.getItem(CONFIG.meta.saveKey) : memoryStore.get(CONFIG.meta.saveKey) || null;
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  async clearSave() {
    if (hasLocalStorage) localStorage.removeItem(CONFIG.meta.saveKey);
    memoryStore.delete(CONFIG.meta.saveKey);
  },
  async leaderboardSubmit(name: string, score: number) { Telemetry.log('leaderboard_stub', { name, score }); },
  async requestReview() { Telemetry.log('review_stub', {}); }
};

export let SDK: ISDK = MockSDK;
export function setSDK(sdk: ISDK) { SDK = sdk; }
