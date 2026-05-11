import { z } from 'zod';
import type { Pattern } from './pattern';
import type { Pattern as PatternV3 } from './graph/types';
import { STITCH_ORDER, STITCHES, isCustomStitch } from './stitches';
import { isValidLibrarySymbolId } from './symbolLibrary';
import { patternSchemaV3 } from './graph/schema';
import { migrateV2ToV3 } from './graph/migration';

const STITCH_KEYS = ['ch', 'slst', 'sc', 'hdc', 'dc', 'tr', 'dtr', 'inc', 'dec'] as const;
const BUILT_IN_KEY_SET = new Set<string>(STITCH_KEYS);

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const CUSTOM_KEY_RE = /^custom:[A-Za-z0-9-]+$/;
const ANY_STITCH_KEY_RE = new RegExp(
  `^(${STITCH_KEYS.join('|')}|custom:[A-Za-z0-9-]+)$`,
);
const CUSTOM_CODE_RE = /^[A-Za-z]{1,3}$/;

const cellSchema = z
  .object({
    stitch: z.string().regex(ANY_STITCH_KEY_RE, 'invalid stitch key'),
    colorId: z.string().min(1),
  })
  .nullable();

const yarnColorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hex: z.string().regex(HEX_RE, 'invalid hex color'),
  isBase: z.boolean(),
});

const rowSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(['rtl', 'ltr']),
  cells: z.array(cellSchema).min(1),
});

const customStitchMetaSchema = z.object({
  key: z.string().regex(CUSTOM_KEY_RE, 'invalid custom stitch key'),
  code: z.string().regex(CUSTOM_CODE_RE, 'code must be 1–3 letters'),
  labelPl: z.string().optional(),
  labelEn: z.string().optional(),
  symbolRef: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
});

const patternSchemaV2 = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  schemaVersion: z.literal(2),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  colors: z
    .array(yarnColorSchema)
    .min(1)
    .refine(
      (colors) => colors[0]?.isBase === true,
      { message: 'colors[0] must be the base color (isBase: true)' },
    )
    .refine(
      (colors) => colors.slice(1).every((c) => !c.isBase),
      { message: 'only colors[0] may have isBase: true' },
    ),
  rows: z.array(rowSchema).min(1),
  displayMode: z.enum(['symbol', 'code', 'both']),
  customStitches: z.array(customStitchMetaSchema).default([]),
});

/**
 * Legacy v1 schema — accepted at parse time, then migrated to v2.
 * Kept narrow so anything truly malformed still fails.
 */
const patternSchemaV1 = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  schemaVersion: z.literal(1),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  colors: z.array(yarnColorSchema).min(1),
  rows: z.array(
    z.object({
      id: z.string().min(1),
      direction: z.enum(['rtl', 'ltr']),
      cells: z
        .array(
          z
            .object({
              stitch: z.enum(STITCH_KEYS),
              colorId: z.string().min(1),
            })
            .nullable(),
        )
        .min(1),
    }),
  ).min(1),
  displayMode: z.enum(['symbol', 'code', 'both']),
});

export class PatternFileError extends Error {
  constructor(public readonly reason: string, public readonly details?: unknown) {
    super(reason);
    this.name = 'PatternFileError';
  }
}

/** Migrate a v1 pattern object to v2 (pure: returns a new object). */
function migrateV1ToV2(v1: z.infer<typeof patternSchemaV1>): Pattern {
  return {
    ...v1,
    schemaVersion: 2,
    customStitches: [],
  };
}

/**
 * Cross-field validation that the Zod schema can't easily express:
 * - all rows have the same width
 * - every cell.colorId references colors[]
 * - every custom stitch key/code is unique within the pattern and doesn't collide with built-ins
 * - every custom symbolRef references a known library symbol
 * - every cell that points at a custom: key has a matching customStitches entry
 *
 * Mutates `pattern` only when cleaning orphaned custom-stitch references
 * (returns the count of cleared cells via the optional `report`).
 */
function enforceInvariants(
  pattern: Pattern,
  report?: { orphanedCellsCleared: number },
): void {
  // Row width uniformity
  const cols = pattern.rows[0]!.cells.length;
  for (const row of pattern.rows) {
    if (row.cells.length !== cols) {
      throw new PatternFileError('Wiersze mają różne długości — plik uszkodzony.');
    }
  }

  // Color references
  const colorIds = new Set(pattern.colors.map((c) => c.id));
  for (const row of pattern.rows) {
    for (const cell of row.cells) {
      if (cell && !colorIds.has(cell.colorId)) {
        throw new PatternFileError(`Komórka odwołuje się do nieistniejącego koloru: ${cell.colorId}`);
      }
    }
  }

  // Custom stitch uniqueness + collision with built-in
  const seenKeys = new Set<string>();
  const seenCodesNorm = new Set<string>();
  const builtInCodesNorm = new Set(STITCH_ORDER.map((k) => STITCHES[k].code.replace(/\s+/g, '').toLowerCase()));
  for (const c of pattern.customStitches) {
    if (seenKeys.has(c.key)) {
      throw new PatternFileError(`Zduplikowany klucz custom stitch: ${c.key}`);
    }
    seenKeys.add(c.key);

    const codeNorm = c.code.replace(/\s+/g, '').toLowerCase();
    if (builtInCodesNorm.has(codeNorm)) {
      throw new PatternFileError(`Skrót custom stitch koliduje z wbudowanym: ${c.code}`);
    }
    if (seenCodesNorm.has(codeNorm)) {
      throw new PatternFileError(`Zduplikowany skrót custom stitch: ${c.code}`);
    }
    seenCodesNorm.add(codeNorm);

    if (c.symbolRef !== undefined && !isValidLibrarySymbolId(c.symbolRef)) {
      // Don't throw — unknown symbolRef just means the renderer falls back to letter-in-circle.
      // We strip the field instead to keep the file canonical.
      // (Mutation kept inside the validator since the input is already a fresh parse result.)
      delete (c as { symbolRef?: string }).symbolRef;
    }
  }

  // Orphaned references in cells
  const customKeys = new Set(pattern.customStitches.map((c) => c.key));
  let cleared = 0;
  for (const row of pattern.rows) {
    for (let i = 0; i < row.cells.length; i++) {
      const cell = row.cells[i];
      if (!cell) continue;
      if (isCustomStitch(cell.stitch) && !customKeys.has(cell.stitch)) {
        row.cells[i] = null;
        cleared++;
      } else if (!isCustomStitch(cell.stitch) && !BUILT_IN_KEY_SET.has(cell.stitch)) {
        // Schema regex would have caught this, but defense in depth.
        throw new PatternFileError(`Komórka odwołuje się do nieznanego splotu: ${cell.stitch}`);
      }
    }
  }
  if (report) report.orphanedCellsCleared = cleared;
}

/**
 * Parse and validate a JSON string as a Pattern (always returns v2 shape).
 * Migrates v1 files transparently.
 * Throws PatternFileError on any failure.
 *
 * @param json    Raw file contents.
 * @param report  Optional out-parameter for non-fatal warnings (e.g. orphaned cells cleared).
 */
export function parsePatternJson(
  json: string,
  report?: { orphanedCellsCleared: number },
): Pattern {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new PatternFileError('Plik nie jest poprawnym JSON-em.', err);
  }

  // Try v2 first, then fall back to v1 (migrate).
  const v2Result = patternSchemaV2.safeParse(raw);
  let pattern: Pattern;
  if (v2Result.success) {
    // Zod widens cell.stitch to plain string (because of regex). Cast back to Pattern —
    // enforceInvariants below verifies every cell.stitch is either built-in or has a
    // matching customStitches entry, which is the runtime equivalent of AnyStitchKey.
    pattern = v2Result.data as unknown as Pattern;
  } else {
    const v1Result = patternSchemaV1.safeParse(raw);
    if (v1Result.success) {
      pattern = migrateV1ToV2(v1Result.data);
    } else {
      throw new PatternFileError('Nieprawidłowy format pliku wzoru.', {
        v2Errors: v2Result.error.issues,
        v1Errors: v1Result.error.issues,
      });
    }
  }

  enforceInvariants(pattern, report);
  return pattern;
}

/** Serialize a Pattern to a pretty-printed JSON string suitable for `.wzor` files. */
export function serializePattern(pattern: Pattern): string {
  return JSON.stringify(pattern, null, 2);
}

/**
 * Like `parsePatternJson` but returns a Pattern v3. Accepts v1, v2, and v3
 * payloads, migrating up as needed. Throws PatternFileError on any failure.
 */
export function parsePatternAsV3(json: string): PatternV3 {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new PatternFileError('Plik nie jest poprawnym JSON-em.', err);
  }

  // Try v3 first — most patterns going forward are v3.
  const v3Result = patternSchemaV3.safeParse(raw);
  if (v3Result.success) {
    return v3Result.data as PatternV3;
  }

  // Otherwise fall back to v2 (which itself handles v1).
  const v2 = parsePatternJson(json);
  return migrateV2ToV3(v2);
}
