import { Page, Text, View } from '@react-pdf/renderer';
import type { InformationSection, PdfDocumentMeta } from '../document/types';
import type { BuiltinStitchType, CustomStitch } from '../../domain/graph/types';
import { Heading } from '../components/Heading';
import { pdfTheme } from '../theme';

const EN_ABBREV: Record<BuiltinStitchType, { abbrev: string; full: string }> = {
  ch:          { abbrev: 'ch',    full: 'chain' },
  sl_st:       { abbrev: 'sl st', full: 'slip stitch' },
  sc:          { abbrev: 'sc',    full: 'single crochet' },
  hdc:         { abbrev: 'hdc',   full: 'half double crochet' },
  dc:          { abbrev: 'dc',    full: 'double crochet' },
  tr:          { abbrev: 'tr',    full: 'treble crochet' },
  gr_st:       { abbrev: 'gr st', full: 'granny stitch (3 dc in same st)' },
  magic_ring:  { abbrev: 'mr',    full: 'magic ring' },
  fasten_off:  { abbrev: 'fo',    full: 'fasten off' },
};

interface Props {
  section: InformationSection;
  meta: PdfDocumentMeta;
  usedStitchTypes: BuiltinStitchType[];
  customStitches: CustomStitch[];
}

export function InformationPage({ section, usedStitchTypes, customStitches }: Props) {
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
          {section.termsSystem} terms
        </Text>
      </View>

      <View style={{ marginVertical: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Yarn
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {section.yarn.brand ?? '—'} · {section.yarn.weight ?? '—'} · {section.yarn.fiber ?? '—'}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Hook
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {section.hook}
        </Text>
      </View>

      <View style={{ marginBottom: pdfTheme.spacing.section }}>
        <Text style={{ fontFamily: pdfTheme.fonts.accent, fontSize: 12, color: pdfTheme.colors.inkSoft, marginBottom: 4 }}>
          Gauge
        </Text>
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink }}>
          {section.gauge.stitches} st × {section.gauge.rows} rows = {section.gauge.squareCm}×{section.gauge.squareCm} cm
        </Text>
      </View>

      <Heading kind="section">Abbreviations</Heading>
      <View style={{ marginVertical: pdfTheme.spacing.section }}>
        {usedStitchTypes.map((t) => (
          <View key={t} style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink, width: 60 }}>
              {EN_ABBREV[t].abbrev}
            </Text>
            <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.inkSoft }}>
              = {EN_ABBREV[t].full}
            </Text>
          </View>
        ))}
        {customStitches.map((c) => (
          <View key={c.id} style={{ flexDirection: 'row', marginBottom: 4 }}>
            <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.accent, width: 60 }}>
              {c.shortCode}
            </Text>
            <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.inkSoft }}>
              = {c.nameByLanguage.en}
            </Text>
          </View>
        ))}
      </View>

      {section.notes && (
        <Text style={{ fontFamily: pdfTheme.fonts.body, fontSize: 10, color: pdfTheme.colors.ink, marginTop: 16 }}>
          {section.notes}
        </Text>
      )}
    </Page>
  );
}
