import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPatternAsV3FromPath } from './fileIo';
import { emptyPatternV3 } from '../domain/graph/build';
import { serializePatternV3 } from '../domain/graph/schema';

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  mkdir: vi.fn(),
  BaseDirectory: { Document: 0 },
}));

vi.mock('@tauri-apps/api/path', () => ({
  documentDir: vi.fn(() => '/docs'),
  join: vi.fn((...parts: string[]) => parts.join('/')),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

describe('fileIo (v3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadPatternAsV3FromPath returns a v3 pattern from a v3 file', async () => {
    const fs = await import('@tauri-apps/plugin-fs');
    const v3 = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    vi.mocked(fs.readTextFile).mockResolvedValueOnce(serializePatternV3(v3));

    const result = await loadPatternAsV3FromPath('/path.wzor');
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.pattern.schemaVersion).toBe(3);
    }
  });

  it('loadPatternAsV3FromPath migrates a v2 file', async () => {
    const fs = await import('@tauri-apps/plugin-fs');
    const v2 = {
      id: 'p',
      name: 'X',
      schemaVersion: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      colors: [
        { id: 'c0', name: 'base', hex: '#ffffff', isBase: true },
      ],
      rows: [
        { id: 'r0', direction: 'rtl', cells: [{ stitch: 'sc', colorId: 'c0' }] },
      ],
      displayMode: 'symbol',
      customStitches: [],
    };
    vi.mocked(fs.readTextFile).mockResolvedValueOnce(JSON.stringify(v2));

    const result = await loadPatternAsV3FromPath('/legacy.wzor');
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.pattern.schemaVersion).toBe(3);
      expect(result.value.pattern.stitches.length).toBeGreaterThan(0);
    }
  });
});
