import { describe, it, expect } from 'vitest';
import { makeRoughOptions, hashSeed } from './roughen';

describe('roughen helpers', () => {
  it('hashSeed produces a stable integer per string', () => {
    expect(hashSeed('stitch-1')).toBe(hashSeed('stitch-1'));
    expect(hashSeed('stitch-1')).not.toBe(hashSeed('stitch-2'));
  });

  it('hashSeed returns a non-negative integer', () => {
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(hashSeed('abc'))).toBe(true);
  });

  it('makeRoughOptions includes the seed', () => {
    const opts = makeRoughOptions('stitch-7');
    expect(opts.seed).toBe(hashSeed('stitch-7'));
    expect(opts.roughness).toBeGreaterThan(0);
    expect(opts.bowing).toBeGreaterThanOrEqual(0);
  });
});
