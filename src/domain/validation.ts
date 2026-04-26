import { z } from 'zod';
import type { Pattern } from './pattern';

const STITCH_KEYS = ['ch', 'slst', 'sc', 'hdc', 'dc', 'tr', 'dtr', 'inc', 'dec'] as const;

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const cellSchema = z
  .object({
    stitch: z.enum(STITCH_KEYS),
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

const patternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  schemaVersion: z.literal(1),
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
});

export class PatternFileError extends Error {
  constructor(public readonly reason: string, public readonly details?: unknown) {
    super(reason);
    this.name = 'PatternFileError';
  }
}

/**
 * Parse and validate a JSON string as a Pattern.
 * Throws PatternFileError on any failure.
 */
export function parsePatternJson(json: string): Pattern {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new PatternFileError('Plik nie jest poprawnym JSON-em.', err);
  }

  const result = patternSchema.safeParse(raw);
  if (!result.success) {
    throw new PatternFileError('Nieprawidłowy format pliku wzoru.', result.error.issues);
  }

  // Defense-in-depth: enforce row width uniformity (schema can't easily express this).
  const cols = result.data.rows[0]!.cells.length;
  for (const row of result.data.rows) {
    if (row.cells.length !== cols) {
      throw new PatternFileError('Wiersze mają różne długości — plik uszkodzony.');
    }
  }

  // Verify every cell colorId exists in colors[]
  const colorIds = new Set(result.data.colors.map((c) => c.id));
  for (const row of result.data.rows) {
    for (const cell of row.cells) {
      if (cell && !colorIds.has(cell.colorId)) {
        throw new PatternFileError(`Komórka odwołuje się do nieistniejącego koloru: ${cell.colorId}`);
      }
    }
  }

  return result.data;
}

/** Serialize a Pattern to a pretty-printed JSON string suitable for `.wzor` files. */
export function serializePattern(pattern: Pattern): string {
  return JSON.stringify(pattern, null, 2);
}
