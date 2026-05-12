import { describe, it, expect } from 'vitest';
import { buildPhotoFromBase64 } from './importer';

describe('buildPhotoFromBase64', () => {
  it('produces a Photo with inline storage and given dimensions', () => {
    const p = buildPhotoFromBase64({
      base64: 'ABC',
      width: 100,
      height: 80,
      mime: 'image/jpeg',
    });
    expect(p.storage.kind).toBe('inline');
    if (p.storage.kind === 'inline') {
      expect(p.storage.base64).toBe('ABC');
      expect(p.storage.mime).toBe('image/jpeg');
    }
    expect(p.width).toBe(100);
    expect(p.height).toBe(80);
    expect(p.id).toBeTruthy();
  });
});
