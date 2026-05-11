import { describe, it, expect } from 'vitest';
import { PatternPage } from './PatternPage';
import { LegendPage } from './LegendPage';

describe('Pattern + Legend pages', () => {
  it('PatternPage is a function component', () => {
    expect(typeof PatternPage).toBe('function');
  });
  it('LegendPage is a function component', () => {
    expect(typeof LegendPage).toBe('function');
  });
});
