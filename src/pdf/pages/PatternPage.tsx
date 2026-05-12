import { Page, Text, View } from '@react-pdf/renderer';
import type { PatternSection } from '../document/types';
import { Heading } from '../components/Heading';
import { generateInstructions } from '../../instructions/generate';
import { pdfTheme } from '../theme';

interface Props {
  section: PatternSection;
}

export function PatternPage({ section }: Props) {
  const instructions = generateInstructions(section.pattern);
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>{section.heading.toUpperCase()}</Heading>
      <View style={{ marginTop: pdfTheme.spacing.section }}>
        {instructions.map((ins) => (
          <View key={ins.round} style={{ marginBottom: pdfTheme.spacing.section }}>
            <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 13, color: pdfTheme.colors.inkSoft }}>
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
    </Page>
  );
}
