import type { Pattern, BuiltinStitchType } from '../domain/graph/types';
import type { RoundInstruction } from './types';

const PL_NAMES: Record<
  BuiltinStitchType,
  { singular: string; plural: string }
> = {
  ch: { singular: 'oczko powietrzne', plural: 'oczek powietrznych' },
  sl_st: { singular: 'oczko ścisłe', plural: 'oczek ścisłych' },
  sc: { singular: 'półsłupek', plural: 'półsłupków' },
  hdc: {
    singular: 'półsłupek z narzutem',
    plural: 'półsłupków z narzutem',
  },
  dc: { singular: 'słupek', plural: 'słupków' },
  tr: { singular: 'słupek podwójny', plural: 'słupków podwójnych' },
  gr_st: { singular: 'pęczek (gr st)', plural: 'pęczków (gr st)' },
  magic_ring: { singular: 'magic ring', plural: 'magic ring' },
  fasten_off: { singular: 'fasten off', plural: 'fasten off' },
};

const EN_NAMES: Record<
  BuiltinStitchType,
  { abbrev: string; full: string }
> = {
  ch: { abbrev: 'ch', full: 'chain' },
  sl_st: { abbrev: 'sl st', full: 'slip stitch' },
  sc: { abbrev: 'sc', full: 'single crochet' },
  hdc: { abbrev: 'hdc', full: 'half double crochet' },
  dc: { abbrev: 'dc', full: 'double crochet' },
  tr: { abbrev: 'tr', full: 'treble crochet' },
  gr_st: { abbrev: 'gr st', full: 'granny stitch' },
  magic_ring: { abbrev: 'mr', full: 'magic ring' },
  fasten_off: { abbrev: 'fo', full: 'fasten off' },
};

function dominantType(stitches: Pattern['stitches']): BuiltinStitchType | null {
  const counts = new Map<BuiltinStitchType, number>();
  for (const s of stitches) {
    if (s.typeRef.kind !== 'builtin') continue;
    counts.set(s.typeRef.type, (counts.get(s.typeRef.type) ?? 0) + 1);
  }
  let max = 0;
  let dom: BuiltinStitchType | null = null;
  for (const [t, n] of counts) {
    if (n > max) {
      max = n;
      dom = t;
    }
  }
  return dom;
}

export function generateInstructions(pattern: Pattern): RoundInstruction[] {
  const out: RoundInstruction[] = [];
  const byRound = new Map<number, Pattern['stitches']>();
  for (const s of pattern.stitches) {
    if (s.round === undefined) continue;
    const arr = byRound.get(s.round) ?? [];
    arr.push(s);
    byRound.set(s.round, arr);
  }

  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  for (const r of rounds) {
    const stitches = byRound.get(r)!;
    if (r === 0) {
      const hasMagicRing = stitches.some(
        (s) => s.typeRef.kind === 'builtin' && s.typeRef.type === 'magic_ring',
      );
      out.push({
        round: 0,
        textPl: hasMagicRing
          ? 'Rozpocznij magic ring.'
          : 'Rozpocznij łańcuszek bazowy.',
        textEn: hasMagicRing
          ? 'Start with a magic ring.'
          : 'Start with a foundation chain.',
        stitchCount: stitches.length,
      });
      continue;
    }
    const t = dominantType(stitches);
    if (!t) {
      out.push({
        round: r,
        textPl: `Runda ${r}.`,
        textEn: `Round ${r}.`,
        stitchCount: stitches.length,
      });
      continue;
    }
    const count = stitches.length;
    const pl = PL_NAMES[t];
    const en = EN_NAMES[t];
    out.push({
      round: r,
      textPl: `Runda ${r}: ${count} ${pl.plural}.`,
      textEn: `Round ${r}: ${count} ${en.abbrev}.`,
      stitchCount: count,
    });
  }
  return out;
}
