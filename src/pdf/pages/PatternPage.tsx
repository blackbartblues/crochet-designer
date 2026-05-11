import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { PhotoFigure } from '../components/PhotoFigure';
import { generateInstructions } from '../../instructions/generate';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function PatternPage({ pattern }: Props) {
  const instructions = generateInstructions(pattern);
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>PATTERN</Heading>
      <View style={{ marginTop: pdfTheme.spacing.section }}>
        {instructions.map((ins) => (
          <View key={ins.round} style={{ marginBottom: pdfTheme.spacing.section }}>
            <Text
              style={{
                fontFamily: pdfTheme.fonts.accent,
                fontSize: 13,
                color: pdfTheme.colors.inkSoft,
              }}
            >
              {ins.round === 0 ? 'Round 1' : `Round ${ins.round + 1}`}
            </Text>
            <Text
              style={{
                fontFamily: pdfTheme.fonts.body,
                fontSize: 11,
                color: pdfTheme.colors.ink,
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              {ins.textEn}
            </Text>
          </View>
        ))}
      </View>

      {pattern.photos.length > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: pdfTheme.colors.rule, marginVertical: 16 }} />
          {pattern.photos.slice(0, 3).map((p) => (
            <PhotoFigure
              key={p.id}
              photo={p}
              caption={p.captionByLanguage?.en ?? p.captionByLanguage?.pl}
              width={300}
            />
          ))}
        </>
      )}
    </Page>
  );
}
