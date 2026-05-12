import { describe, it, expect } from 'vitest';
import {
  emptyPdfDocument,
  newSection,
  defaultStarterSections,
} from './build';

describe('PdfDocument builders', () => {
  it('emptyPdfDocument returns schemaVersion 1 with defaults', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    expect(d.schemaVersion).toBe(1);
    expect(d.meta.title.pl).toBe('X');
    expect(d.meta.language).toBe('pl');
    expect(d.sections.length).toBeGreaterThan(0);
  });

  it('defaultStarterSections includes title, thanks, info, pattern', () => {
    const kinds = defaultStarterSections().map((s) => s.kind);
    expect(kinds).toContain('title');
    expect(kinds).toContain('thanks');
    expect(kinds).toContain('information');
    expect(kinds).toContain('pattern');
  });

  it('newSection produces a section with a unique id and correct kind', () => {
    const a = newSection('text');
    const b = newSection('text');
    expect(a.kind).toBe('text');
    expect(a.id).not.toBe(b.id);
  });

  it('newSection for pattern includes an empty Pattern v3 with shape radial', () => {
    const s = newSection('pattern');
    if (s.kind !== 'pattern') throw new Error('wrong kind');
    expect(s.pattern.schemaVersion).toBe(3);
    expect(s.pattern.shape).toBe('radial');
  });
});
