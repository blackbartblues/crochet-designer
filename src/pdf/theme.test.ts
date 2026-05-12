import { describe, it, expect } from 'vitest';
import { pdfTheme } from './theme';

describe('pdfTheme', () => {
  it('exposes color tokens', () => {
    expect(pdfTheme.colors.paper).toMatch(/^#/);
    expect(pdfTheme.colors.ink).toMatch(/^#/);
    expect(pdfTheme.colors.accent).toMatch(/^#/);
  });

  it('exposes font family strings', () => {
    expect(typeof pdfTheme.fonts.body).toBe('string');
    expect(typeof pdfTheme.fonts.display).toBe('string');
  });

  it('exposes spacing tokens', () => {
    expect(pdfTheme.spacing.page).toBeGreaterThan(0);
  });
});
