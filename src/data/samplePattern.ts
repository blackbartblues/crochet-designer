import type { Pattern, Cursor } from '../domain/pattern';
import { DEFAULT_PALETTE } from '../domain/colors';

/** Hardcoded sample for Phase 1 visual demo — replaced by Pattern store in Phase 2. */
export const SAMPLE_PATTERN: Pattern = {
  id: 'sample-szalik-bordowy',
  name: 'Szalik bordowy',
  schemaVersion: 2,
  customStitches: [],
  createdAt: '2026-04-26T19:00:00.000Z',
  updatedAt: '2026-04-26T19:43:00.000Z',
  displayMode: 'symbol',
  colors: [...DEFAULT_PALETTE],
  rows: [
    { id: 'r1', direction: 'rtl', cells: row(14, 'ch',  ['cream'.repeat(14).split('').map(() => 'cream')].flat() as string[]) },
    { id: 'r2', direction: 'ltr', cells: rowSc(14, ['cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream']) },
    { id: 'r3', direction: 'rtl', cells: rowSc(14, ['cream','cream','cream','rose','rose','cream','cream','cream','cream','cream','rose','rose','cream','cream']) },
    { id: 'r4', direction: 'ltr', cells: rowSc(14, ['cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream']) },
    { id: 'r5', direction: 'rtl', cells: rowSc(14, ['rose','cream','cream','rose','rose','cream','cream','rose','rose','cream','cream','rose','rose','cream']) },
    { id: 'r6', direction: 'ltr', cells: rowSc(14, ['cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream','cream']) },
    { id: 'r7', direction: 'rtl', cells: rowSc(14, ['cream','cream','mustard','mustard','mustard','cream','cream','cream','cream','mustard','mustard','mustard','cream','cream']) },
    { id: 'r8', direction: 'ltr', cells: [
      { stitch: 'sc', colorId: 'cream' },
      { stitch: 'sc', colorId: 'cream' },
      { stitch: 'sc', colorId: 'cream' },
      { stitch: 'sc', colorId: 'cream' },
      { stitch: 'sc', colorId: 'cream' },
      null, null, null, null, null, null, null, null, null,
    ] },
  ],
};

/** Cursor demo position — row 8, col 6 (1-indexed in UI). */
export const SAMPLE_CURSOR: Cursor = { row: 7, col: 5 };

// --- helpers ---

function rowSc(cols: number, colors: string[]) {
  const out: ({ stitch: 'sc'; colorId: string } | null)[] = [];
  for (let i = 0; i < cols; i++) {
    const c = colors[i] ?? 'cream';
    out.push({ stitch: 'sc', colorId: c });
  }
  return out;
}

function row(cols: number, stitch: 'ch', colors: string[]) {
  const out: ({ stitch: 'ch'; colorId: string } | null)[] = [];
  for (let i = 0; i < cols; i++) {
    const c = colors[i] ?? 'cream';
    out.push({ stitch, colorId: c });
  }
  return out;
}
