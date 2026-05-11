import { describe, it, expect } from 'vitest';
import { PatternDocument } from './PatternDocument';

describe('PatternDocument', () => {
  it('exports a function component', () => {
    expect(typeof PatternDocument).toBe('function');
  });
});
