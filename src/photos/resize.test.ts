import { describe, it, expect } from 'vitest';
import { computeResizedDimensions } from './resize';

describe('computeResizedDimensions', () => {
  it('returns input dimensions when already smaller than maxEdge', () => {
    expect(computeResizedDimensions(400, 300, 800)).toEqual({
      width: 400,
      height: 300,
    });
  });

  it('scales down by long edge when wider than tall', () => {
    const r = computeResizedDimensions(2000, 1000, 800);
    expect(r.width).toBe(800);
    expect(r.height).toBe(400);
  });

  it('scales down by long edge when taller than wide', () => {
    const r = computeResizedDimensions(1000, 2000, 800);
    expect(r.width).toBe(400);
    expect(r.height).toBe(800);
  });

  it('handles square images', () => {
    const r = computeResizedDimensions(1500, 1500, 800);
    expect(r.width).toBe(800);
    expect(r.height).toBe(800);
  });
});
