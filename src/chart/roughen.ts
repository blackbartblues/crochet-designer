import type { Options as RoughOptions } from 'roughjs/bin/core';

export const ROUGHNESS = 1.2;
export const BOWING = 0.8;

/** Deterministic 31-bit integer hash for a string (used as Rough.js seed). */
export function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0);
}

export function makeRoughOptions(seedSource: string): RoughOptions {
  return {
    roughness: ROUGHNESS,
    bowing: BOWING,
    seed: hashSeed(seedSource),
    stroke: '#3a2f1d',
    strokeWidth: 1.0,
  };
}
