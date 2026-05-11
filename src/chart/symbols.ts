import type { BuiltinStitchType, CustomStitch } from '../domain/graph/types';

export interface SymbolGlyph {
  text: string;
  width: number;
  height: number;
}

const BUILTIN_GLYPHS: Record<BuiltinStitchType, SymbolGlyph> = {
  ch: { text: '∞', width: 16, height: 12 },
  sl_st: { text: '•', width: 8, height: 8 },
  sc: { text: '×', width: 14, height: 14 },
  hdc: { text: 'Ŧ', width: 14, height: 18 },
  dc: { text: '⊤', width: 14, height: 20 },
  tr: { text: '⊤', width: 14, height: 24 },
  gr_st: { text: '≣', width: 16, height: 20 },
  magic_ring: { text: '○', width: 18, height: 18 },
  fasten_off: { text: '↗', width: 14, height: 14 },
};

export function symbolForBuiltin(type: BuiltinStitchType): SymbolGlyph {
  return BUILTIN_GLYPHS[type];
}

export function symbolForCustom(stitch: CustomStitch): SymbolGlyph {
  return {
    text: stitch.shortCode,
    width: 18,
    height: 18,
  };
}
