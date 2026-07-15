import crypto from "crypto";

/**
 * Deterministically derives a pseudo-random float in [0, 1) from a seed
 * string. Using a deterministic seed (address + chainId + agent name)
 * means repeated calls for the same target return consistent mock
 * results instead of random noise on every request - closer to how a
 * real verification provider would behave.
 */
export function seededFloat(seed: string): number {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const slice = hash.slice(0, 8);
  const intVal = parseInt(slice, 16);
  return intVal / 0xffffffff;
}

export function seededChoice<T>(seed: string, options: T[]): T {
  const f = seededFloat(seed);
  const index = Math.floor(f * options.length) % options.length;
  return options[index];
}

export function seededInRange(seed: string, min: number, max: number): number {
  const f = seededFloat(seed);
  return min + f * (max - min);
}
