// Seeded pseudo-randomness. Every roll flows through here so runs are
// deterministic and testable. Luck tilts the odds; nothing else does.

/** mulberry32: tiny, fast, seedable. Returns [nextState, value in [0,1)]. */
export function nextRandom(state: number): [number, number] {
  const t = (state + 0x6d2b79f5) | 0;
  let x = Math.imul(t ^ (t >>> 15), 1 | t);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  const value = ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  return [t, value];
}

/** Turn any seed (number or string) into a stable 32-bit integer. */
export function seedFrom(input: number | string): number {
  if (typeof input === "number") return input | 0;
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * A success roll tilted by luck.
 * luck 50 is neutral; higher pushes the odds up, lower down, scaled by luckWeight.
 * Returns [nextRngState, success, effectiveChance].
 */
export function luckyChance(
  rngState: number,
  baseChance: number,
  luck: number,
  luckWeight = 0.4,
): [number, boolean, number] {
  const tilt = ((luck - 50) / 50) * luckWeight; // -luckWeight..+luckWeight
  const chance = clamp01(baseChance + tilt);
  const [next, roll] = nextRandom(rngState);
  return [next, roll < chance, chance];
}
