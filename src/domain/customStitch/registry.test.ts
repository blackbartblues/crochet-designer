import { describe, it, expect } from 'vitest';
import {
  addCustomStitch,
  removeCustomStitch,
  findByShortCode,
  isShortCodeAvailable,
  finalizeDraft,
} from './registry';
import { EMPTY_DRAFT } from './types';
import type { CustomStitch } from '../graph/types';

function existing(): CustomStitch {
  return {
    id: 'cs-1',
    shortCode: 'HC',
    nameByLanguage: { pl: 'Pęczek kapturowy', en: 'Hood cluster' },
    symbol: { kind: 'svgPath', path: 'M0 0' },
  };
}

describe('customStitch/registry', () => {
  it('addCustomStitch appends to the list', () => {
    const list: CustomStitch[] = [];
    const stitch = existing();
    const next = addCustomStitch(list, stitch);
    expect(next).toHaveLength(1);
    expect(next[0]).toBe(stitch);
    expect(list).toHaveLength(0); // immutable
  });

  it('removeCustomStitch filters by id', () => {
    const a = existing();
    const b = { ...existing(), id: 'cs-2', shortCode: 'XY' };
    const next = removeCustomStitch([a, b], 'cs-1');
    expect(next).toEqual([b]);
  });

  it('findByShortCode is case-insensitive', () => {
    const list = [existing()];
    expect(findByShortCode(list, 'hc')?.id).toBe('cs-1');
    expect(findByShortCode(list, 'HC')?.id).toBe('cs-1');
    expect(findByShortCode(list, 'ZZ')).toBeUndefined();
  });

  it('isShortCodeAvailable rejects collisions with custom stitches', () => {
    const list = [existing()];
    expect(isShortCodeAvailable(list, 'HC')).toBe(false);
    expect(isShortCodeAvailable(list, 'hc')).toBe(false);
    expect(isShortCodeAvailable(list, 'NEW')).toBe(true);
  });

  it('isShortCodeAvailable rejects built-in stitch shortcodes', () => {
    expect(isShortCodeAvailable([], 'sc')).toBe(false);
    expect(isShortCodeAvailable([], 'DC')).toBe(false);
    expect(isShortCodeAvailable([], 'ch')).toBe(false);
  });

  it('finalizeDraft returns a CustomStitch when valid', () => {
    const draft = {
      ...EMPTY_DRAFT,
      shortCode: 'HC',
      namePl: 'Pęczek',
      nameEn: 'Hood',
      symbolPresetId: 'shell',
    };
    const result = finalizeDraft(draft);
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.value.shortCode).toBe('HC');
      expect(result.value.nameByLanguage).toEqual({ pl: 'Pęczek', en: 'Hood' });
      expect(result.value.symbol).toEqual({ kind: 'preset', presetId: 'shell' });
      expect(result.value.id).toBeTruthy();
    }
  });

  it('finalizeDraft returns errors on bad input', () => {
    const empty = finalizeDraft(EMPTY_DRAFT);
    expect(empty.kind).toBe('error');
  });

  it('finalizeDraft rejects shortCode with non-letters or wrong length', () => {
    const draft = {
      ...EMPTY_DRAFT,
      shortCode: 'A1',
      namePl: 'X',
      nameEn: 'X',
      symbolPresetId: 'x',
    };
    expect(finalizeDraft(draft).kind).toBe('error');
  });
});
