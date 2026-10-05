/* sfx.ts — микро-звуки WebAudio (синтез, без файлов). Порт из lavka2-vp/js/sfx.js.
   Headless-safe: в node все вызовы — no-op. */

let ctx: AudioContext | null = null;
let muted = false;
const hasAudio = typeof window !== 'undefined' && !!(window.AudioContext || (window as any).webkitAudioContext);

function ac(): AudioContext | null {
  if (!hasAudio) return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
  }
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, slide?: number) {
  const c = ac();
  if (!c || muted) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
  g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}

export const SFX = {
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
  click()   { tone(520, 0.06, 'triangle', 0.08); },
  coins()   { tone(880, 0.09, 'triangle', 0.12); setTimeout(() => tone(1320, 0.12, 'triangle', 0.10), 70); },
  creak()   { tone(120, 0.25, 'sawtooth', 0.05, 90); },
  reveal()  { tone(660, 0.15, 'sine', 0.10, 990); setTimeout(() => tone(990, 0.2, 'sine', 0.09), 120); },
  legendary() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sine', 0.12), i * 130)); },
  scrub()   { tone(200 + Math.random() * 120, 0.03, 'square', 0.02); },
  /* новые для живой сцены */
  gavel()   { tone(160, 0.12, 'square', 0.14, 80); setTimeout(() => tone(90, 0.2, 'sawtooth', 0.10, 60), 60); },
  crowd()   { tone(300 + Math.random() * 100, 0.18, 'sine', 0.04); },
  ding()    { tone(1568, 0.3, 'sine', 0.07); setTimeout(() => tone(2093, 0.35, 'sine', 0.05), 80); },
  error()   { tone(200, 0.15, 'sawtooth', 0.06, 150); }
};
