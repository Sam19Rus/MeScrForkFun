/* sfx.js — микро-звуки на WebAudio (без файлов): 5 сигналов. Кнопка mute в dev-панели/настройках. */
window.SFX = (function () {
  let ctx = null, muted = false;
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return ctx; }
  function tone(freq, dur, type, vol, slide) {
    const c = ac(); if (!c || muted) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
    g.gain.value = vol || 0.15;
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  return {
    toggleMute() { muted = !muted; return muted; },
    isMuted() { return muted; },
    click()   { tone(520, 0.06, 'triangle', 0.08); },
    coins()   { tone(880, 0.09, 'triangle', 0.12); setTimeout(() => tone(1320, 0.12, 'triangle', 0.10), 70); },
    creak()   { tone(120, 0.25, 'sawtooth', 0.05, 90); },
    reveal()  { tone(660, 0.15, 'sine', 0.10, 990); setTimeout(() => tone(990, 0.2, 'sine', 0.09), 120); },
    legendary(){ [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sine', 0.12), i * 130)); },
    scrub()   { tone(200 + Math.random() * 120, 0.03, 'square', 0.02); }
  };
})();
