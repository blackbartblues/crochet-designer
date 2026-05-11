import { describe, it, expect } from 'vitest';
import { suggestPdfFilename } from './filename';
import { emptyPatternV3 } from '../domain/graph/build';

describe('suggestPdfFilename', () => {
  it('returns a sanitized filename derived from the title', () => {
    const p = emptyPatternV3({ title: { pl: 'Wzór mamy', en: 'Mama Pattern' }, author: 'M' });
    const name = suggestPdfFilename(p);
    expect(name.toLowerCase()).toContain('mama');
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('falls back when title is empty', () => {
    const p = emptyPatternV3({ title: { pl: '', en: '' }, author: '' });
    const name = suggestPdfFilename(p);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('strips dangerous filesystem characters', () => {
    const p = emptyPatternV3({ title: { pl: 'a/b?c*d', en: 'a/b?c*d' }, author: '' });
    const name = suggestPdfFilename(p);
    expect(name).not.toMatch(/[<>:"/\\|?*]/);
  });
});
