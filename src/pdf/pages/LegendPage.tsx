import { Page, Text, View } from '@react-pdf/renderer';
import type { CustomStitch } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

interface Props {
  customStitches: CustomStitch[];
}

export function LegendPage({ customStitches }: Props) {
  if (customStitches.length === 0) return null;
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>SPECIAL STITCHES</Heading>
      <View style={{ marginTop: pdfTheme.spacing.section }}>
        {customStitches.map((c) => (
          <View key={c.id} style={{ marginBottom: pdfTheme.spacing.section }}>
            <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 13, color: pdfTheme.colors.accent }}>
              {c.shortCode} — {c.nameByLanguage.en}
            </Text>
            {c.description && (
              <Text
                style={{
                  fontFamily: pdfTheme.fonts.body,
                  fontSize: 11,
                  color: pdfTheme.colors.ink,
                  marginTop: 4,
                  lineHeight: 1.6,
                }}
              >
                {c.description.en}
              </Text>
            )}
            <Text
              style={{
                fontFamily: pdfTheme.fonts.accent,
                fontSize: 10,
                color: pdfTheme.colors.inkSoft,
                marginTop: 6,
                fontStyle: 'italic',
              }}
            >
              PL: {c.nameByLanguage.pl}
              {c.description?.pl && ` — ${c.description.pl}`}
            </Text>
          </View>
        ))}
      </View>
    </Page>
  );
}
