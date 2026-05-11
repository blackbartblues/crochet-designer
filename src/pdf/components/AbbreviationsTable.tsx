import { Text, View } from '@react-pdf/renderer';
import type { Pattern, BuiltinStitchType } from '../../domain/graph/types';
import { pdfTheme } from '../theme';

const EN_ABBREV: Record<BuiltinStitchType, { abbrev: string; full: string }> = {
  ch: { abbrev: 'ch', full: 'chain' },
  sl_st: { abbrev: 'sl st', full: 'slip stitch' },
  sc: { abbrev: 'sc', full: 'single crochet' },
  hdc: { abbrev: 'hdc', full: 'half double crochet' },
  dc: { abbrev: 'dc', full: 'double crochet' },
  tr: { abbrev: 'tr', full: 'treble crochet' },
  gr_st: { abbrev: 'gr st', full: 'granny stitch (3 dc in same st)' },
  magic_ring: { abbrev: 'mr', full: 'magic ring' },
  fasten_off: { abbrev: 'fo', full: 'fasten off' },
};

interface AbbreviationsTableProps {
  pattern: Pattern;
}

export function AbbreviationsTable({ pattern }: AbbreviationsTableProps) {
  const usedTypes = new Set<BuiltinStitchType>();
  for (const s of pattern.stitches) {
    if (s.typeRef.kind === 'builtin') usedTypes.add(s.typeRef.type);
  }
  const entries = [...usedTypes].map((t) => ({ key: t, ...EN_ABBREV[t] }));
  return (
    <View style={{ marginVertical: pdfTheme.spacing.section }}>
      {entries.map((e) => (
        <View key={e.key} style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text
            style={{
              fontFamily: pdfTheme.fonts.body,
              fontSize: 10,
              color: pdfTheme.colors.ink,
              width: 60,
            }}
          >
            {e.abbrev}
          </Text>
          <Text
            style={{
              fontFamily: pdfTheme.fonts.body,
              fontSize: 10,
              color: pdfTheme.colors.inkSoft,
            }}
          >
            = {e.full}
          </Text>
        </View>
      ))}
      {pattern.customStitches.map((c) => (
        <View key={c.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text
            style={{
              fontFamily: pdfTheme.fonts.body,
              fontSize: 10,
              color: pdfTheme.colors.accent,
              width: 60,
            }}
          >
            {c.shortCode}
          </Text>
          <Text
            style={{
              fontFamily: pdfTheme.fonts.body,
              fontSize: 10,
              color: pdfTheme.colors.inkSoft,
            }}
          >
            = {c.nameByLanguage.en}
          </Text>
        </View>
      ))}
    </View>
  );
}
