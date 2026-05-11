import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function ThanksPage({ pattern }: Props) {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>THANKS</Heading>
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.body,
            fontSize: 12,
            color: pdfTheme.colors.ink,
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: 380,
          }}
        >
          Thank you for supporting my small business.
          {'\n'}I hope you'll enjoy this pattern as much as I did making it.
        </Text>
        <Text
          style={{
            fontFamily: pdfTheme.fonts.body,
            fontSize: 10,
            color: pdfTheme.colors.inkSoft,
            textAlign: 'center',
            marginTop: 32,
            maxWidth: 380,
            lineHeight: 1.5,
          }}
        >
          {pattern.meta.copyrightLine ??
            `© ${new Date(pattern.meta.designedAt).getFullYear()} ${pattern.meta.author}. This pattern is for private use only. It's not allowed to copy, sell or distribute in any way, either wholly or in part.`}
        </Text>
        {pattern.meta.socialTag && (
          <Text
            style={{
              fontFamily: pdfTheme.fonts.accent,
              fontSize: 10,
              color: pdfTheme.colors.inkSoft,
              marginTop: 24,
            }}
          >
            tag {pattern.meta.socialTag}
          </Text>
        )}
      </View>
    </Page>
  );
}
