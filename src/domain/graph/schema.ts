import { z } from 'zod';
import type { Pattern } from './types';

const builtinStitchTypeSchema = z.enum([
  'ch',
  'sl_st',
  'sc',
  'hdc',
  'dc',
  'tr',
  'gr_st',
  'magic_ring',
  'fasten_off',
]);

const stitchTypeRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('builtin'), type: builtinStitchTypeSchema }),
  z.object({ kind: z.literal('custom'), id: z.string().min(1) }),
]);

const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

const attachmentsSchema = z.object({
  photoIds: z.array(z.string().min(1)),
  note: z.string().optional(),
});

// Shared i18n schemas: both languages optional in tags/captions, both required in titles.
const optionalI18nSchema = z
  .object({ pl: z.string(), en: z.string() })
  .partial()
  .optional();

const requiredI18nSchema = z.object({ pl: z.string(), en: z.string() });

const stitchSchema = z.object({
  id: z.string().min(1),
  typeRef: stitchTypeRefSchema,
  colorRef: z.string().min(1).optional(),
  round: z.number().int().nonnegative().optional(),
  position: positionSchema.optional(),
  attachments: attachmentsSchema.optional(),
});

const anchorTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stitch'), id: z.string().min(1) }),
  z.object({
    kind: z.literal('chain_space'),
    betweenA: z.string().min(1),
    betweenB: z.string().min(1),
  }),
  z.object({ kind: z.literal('magic_ring') }),
  z.object({
    kind: z.literal('turning_chain'),
    ofStitch: z.string().min(1),
  }),
]);

const edgeSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.string().min(1),
    kind: z.literal('anchor'),
    from: z.string().min(1),
    to: anchorTargetSchema,
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('yarn_flow'),
    from: z.string().min(1),
    to: z.string().min(1),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal('join'),
    stitch: z.string().min(1),
    targets: z.array(z.string().min(1)).min(1),
  }),
]);

const colorSchema = z.object({
  id: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  nameByLanguage: optionalI18nSchema,
});

const photoSchema = z.object({
  id: z.string().min(1),
  storage: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('inline'),
      base64: z.string().min(1),
      mime: z.string().min(1),
    }),
    z.object({ kind: z.literal('path'), path: z.string().min(1) }),
  ]),
  captionByLanguage: optionalI18nSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
});

const customStitchSchema = z.object({
  id: z.string().min(1),
  shortCode: z.string().regex(/^[A-Za-z]{1,3}$/),
  nameByLanguage: requiredI18nSchema,
  description: requiredI18nSchema.optional(),
  symbol: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('preset'), presetId: z.string().min(1) }),
    z.object({ kind: z.literal('svgPath'), path: z.string().min(1) }),
  ]),
  subGraph: z
    .object({ stitches: z.array(stitchSchema), edges: z.array(edgeSchema) })
    .optional(),
});

const roundSchema = z.object({
  index: z.number().int().nonnegative(),
  stitchIds: z.array(z.string().min(1)),
  noteByLanguage: optionalI18nSchema,
});

const pdfSectionSchema = z.object({
  kind: z.enum([
    'title',
    'thanks',
    'information',
    'pattern',
    'customization',
    'legend',
    'finishing',
  ]),
  enabled: z.boolean(),
  overrides: z.record(z.string(), z.unknown()).optional(),
});

const metaSchema = z.object({
  title: requiredI18nSchema,
  author: z.string(),
  designedAt: z.string(),
  yarn: z.object({
    brand: z.string().optional(),
    weight: z.string().optional(),
    fiber: z.string().optional(),
    meterage: z.string().optional(),
  }),
  hook: z.string(),
  gauge: z.object({
    stitches: z.number(),
    rows: z.number(),
    squareCm: z.number(),
  }),
  language: z.enum(['pl', 'en', 'pl-en']),
  copyrightLine: z.string().optional(),
  socialTag: z.string().optional(),
});

const legacyGridSchema = z.object({
  rows: z.number().int().nonnegative(),
  cols: z.number().int().nonnegative(),
  cells: z.array(z.object({ stitchId: z.string().min(1).nullable() })),
});

export const patternSchemaV3 = z.object({
  schemaVersion: z.literal(3),
  shape: z.enum(['rectangular', 'radial', 'freeform']),
  meta: metaSchema,
  colors: z.array(colorSchema).min(1),
  stitches: z.array(stitchSchema),
  edges: z.array(edgeSchema),
  rounds: z.array(roundSchema),
  customStitches: z.array(customStitchSchema),
  photos: z.array(photoSchema),
  pdfSections: z.array(pdfSectionSchema),
  legacyGrid: legacyGridSchema.optional(),
});

export function serializePatternV3(pattern: Pattern): string {
  return JSON.stringify(patternSchemaV3.parse(pattern), null, 2);
}

// The cast is intentional: Zod's inferred type widens optional fields and
// loses literal narrowing on discriminated unions, so callers prefer the
// hand-written Pattern type. The runtime shape after parse is guaranteed
// equivalent — Zod validates structurally.
export function parsePatternV3Raw(raw: unknown): Pattern {
  return patternSchemaV3.parse(raw) as Pattern;
}
