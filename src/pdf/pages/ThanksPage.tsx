import { Page, Text, View } from '@react-pdf/renderer';
import type { ThanksSection, PdfDocumentMeta } from '../document/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

interface Props {
  section: ThanksSection;
  meta: PdfDocumentMeta;
}

export function ThanksPage({ section, meta }: Props) {
  const copyright =
    section.copyrightOverride ??
    meta.copyrightLine ??
    `© ${new Date(meta.designedAt).getFullYear()} ${meta.author}. This pattern is for private use only. It's not allowed to copy, sell or distribute in any way, either wholly or in part.`;
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
          {section.message}
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
          {copyright}
        </Text>
        {meta.socialTag && (
          <Text
            style={{
              fontFamily: pdfTheme.fonts.accent,
              fontSize: 10,
              color: pdfTheme.colors.inkSoft,
              marginTop: 24,
            }}
          >
            tag {meta.socialTag}
          </Text>
        )}
      </View>
    </Page>
  );
}
