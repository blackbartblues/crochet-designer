import { describe, it, expect } from 'vitest';

describe('Phase 3 dependencies', () => {
  it('roughjs imports', async () => {
    const r = await import('roughjs');
    expect(typeof r.default).toBeTruthy();
  });

  it('@react-pdf/renderer imports', async () => {
    const p = await import('@react-pdf/renderer');
    expect(p.Document).toBeDefined();
    expect(p.Page).toBeDefined();
  });
});
