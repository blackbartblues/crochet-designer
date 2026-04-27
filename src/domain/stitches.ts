/**
 * CYC crochet stitch definitions + custom (user-defined) stitches.
 *
 * Built-in stitches: STITCH_ORDER drives palette display order and 1-9 keyboard shortcut indices.
 * Custom stitches are per-pattern (stored in the .wzor file) and may reference a symbol from
 * the rich symbol library (see symbolLibrary.ts), or display as a letter-in-circle fallback.
 */

import { newId } from '../utils/id';

export type BuiltInStitchKey = 'ch' | 'slst' | 'sc' | 'hdc' | 'dc' | 'tr' | 'dtr' | 'inc' | 'dec';

/**
 * Backwards-compatible alias. Existing call sites can keep using StitchKey;
 * new code that needs to accept custom keys should use AnyStitchKey.
 */
export type StitchKey = BuiltInStitchKey;

/** Branded string used in cells when referring to a custom stitch. */
export type CustomStitchKey = `custom:${string}`;

export type AnyStitchKey = BuiltInStitchKey | CustomStitchKey;

export interface StitchMeta {
  key: BuiltInStitchKey;
  /** US notation short code (e.g., "sc", "sl st") */
  code: string;
  /** SVG sprite symbol id (e.g., "sym-sc") */
  symbolId: string;
  /** Polish full name */
  labelPl: string;
  /** English full name (US) */
  labelEn: string;
}

/**
 * A user-defined stitch belonging to a single pattern.
 * `key` is an internal identifier (never shown to the user).
 * `code` is the visible short text label (1–3 ASCII letters).
 * `symbolRef` optionally references a symbol from the symbolLibrary;
 * when absent, the renderer falls back to a letter-in-circle.
 */
export interface CustomStitchMeta {
  key: CustomStitchKey;
  code: string;
  labelPl?: string;
  labelEn?: string;
  /** Reference to a sprite symbol (id, e.g. "lib-fpdc") from the symbol library. */
  symbolRef?: string;
  /** ISO timestamp; used to keep palette order stable across sessions. */
  createdAt: string;
}

export const STITCH_ORDER: readonly BuiltInStitchKey[] = [
  'ch', 'slst', 'sc', 'hdc', 'dc', 'tr', 'dtr', 'inc', 'dec',
] as const;

export const STITCHES: Record<BuiltInStitchKey, StitchMeta> = {
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

// ============================================================
// Type guards
// ============================================================

const BUILT_IN_KEYS: ReadonlySet<string> = new Set<string>(STITCH_ORDER);

export function isBuiltInStitch(key: string): key is BuiltInStitchKey {
  return BUILT_IN_KEYS.has(key);
}

export function isCustomStitch(key: string): key is CustomStitchKey {
  return key.startsWith('custom:') && key.length > 'custom:'.length;
}

// ============================================================
// Custom stitch helpers
// ============================================================

/**
 * Generate a fresh internal key for a new custom stitch.
 * Uses the project-wide id generator and prefixes with "custom:".
 */
export function generateCustomStitchKey(): CustomStitchKey {
  // Take a short slice for readability; collision is checked at insert time anyway.
  const id = newId().replace(/-/g, '').slice(0, 12);
  return `custom:${id}`;
}

/** Code validation rules: 1–3 ASCII letters, case-insensitive uniqueness. */
const CUSTOM_CODE_RE = /^[A-Za-z]{1,3}$/;

export type CodeValidation =
  | { ok: true; normalizedCompare: string }
  | { ok: false; reason: 'empty' | 'format' | 'collidesBuiltIn' | 'collidesCustom'; conflict?: string };

/**
 * Validate a candidate `code` for a new (or renamed) custom stitch.
 * Compare is case-insensitive and whitespace-insensitive.
 *
 * @param code   Candidate code, as typed by the user.
 * @param customs Existing custom stitches in the pattern.
 * @param ignoreKey Optional: skip a specific custom key when checking duplicates (used for edit).
 */
export function validateCustomCode(
  code: string,
  customs: readonly CustomStitchMeta[],
  ignoreKey?: CustomStitchKey,
): CodeValidation {
  const trimmed = code.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'empty' };
  if (!CUSTOM_CODE_RE.test(trimmed)) return { ok: false, reason: 'format' };

  const norm = (s: string): string => s.replace(/\s+/g, '').toLowerCase();
  const candidate = norm(trimmed);

  for (const k of STITCH_ORDER) {
    if (norm(STITCHES[k].code) === candidate) {
      return { ok: false, reason: 'collidesBuiltIn', conflict: STITCHES[k].code };
    }
  }

  for (const c of customs) {
    if (ignoreKey && c.key === ignoreKey) continue;
    if (norm(c.code) === candidate) {
      return { ok: false, reason: 'collidesCustom', conflict: c.code };
    }
  }

  return { ok: true, normalizedCompare: candidate };
}

/**
 * Resolve a stitch key (built-in or custom) to its display metadata.
 * Returns null if the key references a custom that doesn't exist in `customs`
 * (i.e., an orphaned reference).
 */
export function getStitchMeta(
  key: AnyStitchKey,
  customs: readonly CustomStitchMeta[],
): StitchMeta | CustomStitchMeta | null {
  if (isBuiltInStitch(key)) return STITCHES[key];
  if (isCustomStitch(key)) {
    return customs.find((c) => c.key === key) ?? null;
  }
  return null;
}

/** Display code for either built-in or custom stitch (used in 'code' display mode). */
export function getStitchCode(meta: StitchMeta | CustomStitchMeta): string {
  return meta.code;
}
