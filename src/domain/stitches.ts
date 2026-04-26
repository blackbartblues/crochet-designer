/**
 * CYC crochet stitch definitions.
 * Order in STITCH_ORDER drives palette display order and 1-9 keyboard shortcut indices.
 */

export type StitchKey = 'ch' | 'slst' | 'sc' | 'hdc' | 'dc' | 'tr' | 'dtr' | 'inc' | 'dec';

export interface StitchMeta {
  key: StitchKey;
  /** US notation short code (e.g., "sc", "sl st") */
  code: string;
  /** SVG sprite symbol id (e.g., "sym-sc") */
  symbolId: string;
  /** Polish full name */
  labelPl: string;
  /** English full name (US) */
  labelEn: string;
}

export const STITCH_ORDER: readonly StitchKey[] = [
  'ch', 'slst', 'sc', 'hdc', 'dc', 'tr', 'dtr', 'inc', 'dec',
] as const;

export const STITCHES: Record<StitchKey, StitchMeta> = {
  ch:   { key: 'ch',   code: 'ch',    symbolId: 'sym-ch',   labelPl: 'łańcuszek',          labelEn: 'chain' },
  slst: { key: 'slst', code: 'sl st', symbolId: 'sym-slst', labelPl: 'oczko zamknięte',    labelEn: 'slip stitch' },
  sc:   { key: 'sc',   code: 'sc',    symbolId: 'sym-sc',   labelPl: 'półsłupek',          labelEn: 'single crochet' },
  hdc:  { key: 'hdc',  code: 'hdc',   symbolId: 'sym-hdc',  labelPl: 'półsłupek nawijany', labelEn: 'half double crochet' },
  dc:   { key: 'dc',   code: 'dc',    symbolId: 'sym-dc',   labelPl: 'słupek',             labelEn: 'double crochet' },
  tr:   { key: 'tr',   code: 'tr',    symbolId: 'sym-tr',   labelPl: 'słupek podwójny',    labelEn: 'treble crochet' },
  dtr:  { key: 'dtr',  code: 'dtr',   symbolId: 'sym-dtr',  labelPl: 'słupek potrójny',    labelEn: 'double treble' },
  inc:  { key: 'inc',  code: 'inc',   symbolId: 'sym-inc',  labelPl: 'przybranie',         labelEn: 'increase' },
  dec:  { key: 'dec',  code: 'dec',   symbolId: 'sym-dec',  labelPl: 'ubranie',            labelEn: 'decrease' },
};

export type DisplayMode = 'symbol' | 'code' | 'both';
