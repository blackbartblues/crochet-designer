import { Page, Text, View } from '@react-pdf/renderer';
import type { Pattern } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { AbbreviationsTable } from '../components/AbbreviationsTable';
import { pdfTheme } from '../theme';

interface Props {
  pattern: Pattern;
}

export function InformationPage({ pattern }: Props) {
  return (
    <Page
      size="A4"
      style={{
        backgroundColor: pdfTheme.colors.paper,
        padding: 64,
        flexDirection: 'column',
      }}
    >
      <Heading>INFORMATION</Heading>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 16 }}>
          US terms
        </Text>
      </View>

      <View style={{ marginVertical: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Yarn
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {pattern.meta.yarn.brand ?? '—'} ·{' '}
          {pattern.meta.yarn.weight ?? '—'} ·{' '}
          {pattern.meta.yarn.fiber ?? '—'}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Hook
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {pattern.meta.hook}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Gauge
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {pattern.meta.gauge.stitches} st × {pattern.meta.gauge.rows} rows ={' '}
          {pattern.meta.gauge.squareCm}×{pattern.meta.gauge.squareCm} cm
        </Text>
      </View>

      <Heading kind="section">Abbreviations</Heading>
      <AbbreviationsTable pattern={pattern} />
    </Page>
  );
}
