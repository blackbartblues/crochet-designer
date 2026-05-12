import { describe, it, expect } from 'vitest';
import { Heading } from './Heading';
import { AbbreviationsTable } from './AbbreviationsTable';

describe('PDF base components', () => {
  it('Heading exports a function component', () => {
    expect(typeof Heading).toBe('function');
  });
  it('AbbreviationsTable exports a function component', () => {
    expect(typeof AbbreviationsTable).toBe('function');
  });
});
