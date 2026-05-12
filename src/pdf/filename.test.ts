import { describe, it, expect } from 'vitest';
import { suggestPdfFilename } from './filename';
import { emptyPdfDocument } from './document/build';

describe('suggestPdfFilename', () => {
  it('returns a sanitized filename derived from the title', () => {
    const d = emptyPdfDocument({ title: { pl: 'Wzór mamy', en: 'Mama Pattern' }, author: 'M' });
    const name = suggestPdfFilename(d);
    expect(name.toLowerCase()).toContain('mama');
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('falls back when title is empty', () => {
    const d = emptyPdfDocument({ title: { pl: '', en: '' }, author: '' });
    const name = suggestPdfFilename(d);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('strips dangerous filesystem characters', () => {
    const d = emptyPdfDocument({ title: { pl: 'a/b?c*d', en: 'a/b?c*d' }, author: '' });
    const name = suggestPdfFilename(d);
    expect(name).not.toMatch(/[<>:"/\\|?*]/);
  });
});
