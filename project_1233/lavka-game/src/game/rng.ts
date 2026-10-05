/* rng.ts — детерминированный PRNG (mulberry32), перенесён из economy.js прототипа. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const uni = (rnd: () => number, a: number, b: number) => a + rnd() * (b - a);
export const r5 = (v: number) => Math.max(5, Math.round(v / 5) * 5);
export const pick = <T,>(rnd: () => number, arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
