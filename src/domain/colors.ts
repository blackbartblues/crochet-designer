/**
 * Yarn color domain.
 * The first color in any pattern is always the BASE color (locked, non-deletable).
 */

export type ColorId = string;

export interface YarnColor {
  id: ColorId;
  name: string;
  /** Hex string with leading #, uppercase, e.g. "#F5EDE0" */
  hex: string;
  /** True only for the locked base color. Pattern always has exactly one base. */
  isBase: boolean;
}

/** The base color sentinel — used as colors[0] in every pattern. */
export const BASE_COLOR: YarnColor = {
  id: 'base',
  name: 'Kremowy',
  hex: '#F5EDE0',
  isBase: true,
};

/** Default starter palette used when creating a new pattern. */
export const DEFAULT_PALETTE: readonly YarnColor[] = [
  BASE_COLOR,
  { id: 'pink',     name: 'Pudrowy róż',  hex: '#E8B4B8', isBase: false },
  { id: 'rose',     name: 'Bordo',        hex: '#C97B84', isBase: false },
  { id: 'sage',     name: 'Szałwia',      hex: '#A8B89C', isBase: false },
  { id: 'mustard',  name: 'Musztardowy',  hex: '#C9A961', isBase: false },
  { id: 'lavender', name: 'Lawenda',      hex: '#B8A8D4', isBase: false },
];

/** Heuristic: should the stitch symbol render in inverse color on this background? */
export function isDarkHex(hex: string): boolean {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return false;
  const r = parseInt(m[1] ?? '00', 16);
  const g = parseInt(m[2] ?? '00', 16);
  const b = parseInt(m[3] ?? '00', 16);
  // Standard relative luminance approximation
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.5;
}
