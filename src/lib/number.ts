/** Clamp into `[min, max]`; a non-finite value becomes `min`. */
export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(Math.max(Number.isFinite(value) ? value : min, min), max);
