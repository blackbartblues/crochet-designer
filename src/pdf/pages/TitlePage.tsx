import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function TitlePage({ pattern }: Props) {
  const year = new Date(pattern.meta.designedAt).getFullYear();
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.display,
            fontSize: 48,
            color: pdfTheme.colors.ink,
            letterSpacing: 3,
            textAlign: 'center',
          }}
        >
          {pattern.meta.title.en}
        </Text>
        <View style={{ width: 80, height: 1, backgroundColor: pdfTheme.colors.rule, marginVertical: 16 }} />
        <Text
          style={{
            fontFamily: pdfTheme.fonts.accent,
            fontSize: 14,
            color: pdfTheme.colors.inkSoft,
            letterSpacing: 2,
          }}
        >
          design by {pattern.meta.author || 'unknown'}
        </Text>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.body,
            fontSize: 10,
            color: pdfTheme.colors.inkSoft,
            marginTop: 6,
          }}
        >
          {year}
        </Text>
      </View>
    </Page>
  );
}
