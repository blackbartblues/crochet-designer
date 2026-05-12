import { Page, Text, View } from '@react-pdf/renderer';
import type { TitleSection, PdfDocumentMeta } from '../document/types';
import { pdfTheme } from '../theme';

interface Props {
  section: TitleSection;
  meta: PdfDocumentMeta;
}

export function TitlePage({ section, meta }: Props) {
  const title = (section.title ?? meta.title).en || (section.title ?? meta.title).pl;
  const year = section.showYear ? new Date(meta.designedAt).getFullYear() : null;
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
          {title}
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
          design by {meta.author || 'unknown'}
        </Text>
        {year !== null && (
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
        )}
      </View>
    </Page>
  );
}
