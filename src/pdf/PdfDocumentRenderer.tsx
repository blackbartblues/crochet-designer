import { Document } from '@react-pdf/renderer';
import type { PdfDocument } from './document/types';
import type { BuiltinStitchType, CustomStitch } from '../domain/graph/types';
import { TitlePage } from './pages/TitlePage';
import { ThanksPage } from './pages/ThanksPage';
import { InformationPage } from './pages/InformationPage';
import { PatternPage } from './pages/PatternPage';
import { LegendPage } from './pages/LegendPage';

interface Props {
  document: PdfDocument;
}

function collectStitchData(document: PdfDocument): {
  usedStitchTypes: BuiltinStitchType[];
  customStitches: CustomStitch[];
} {
  const types = new Set<BuiltinStitchType>();
  const customById = new Map<string, CustomStitch>();
  for (const s of document.sections) {
    if (s.kind === 'pattern') {
      for (const st of s.pattern.stitches) {
        if (st.typeRef.kind === 'builtin') types.add(st.typeRef.type);
      }
      for (const cs of s.pattern.customStitches) customById.set(cs.id, cs);
    }
    if (s.kind === 'special') {
      for (const e of s.entries) customById.set(e.stitch.id, e.stitch);
    }
  }
  return { usedStitchTypes: [...types], customStitches: [...customById.values()] };
}

export function PdfDocumentRenderer({ document }: Props) {
  const { usedStitchTypes, customStitches } = collectStitchData(document);
  return (
    <Document>
      {document.sections.map((s) => {
        switch (s.kind) {
          case 'title':
            return <TitlePage key={s.id} section={s} meta={document.meta} />;
          case 'thanks':
            return <ThanksPage key={s.id} section={s} meta={document.meta} />;
          case 'information':
            return (
              <InformationPage
                key={s.id}
                section={s}
                meta={document.meta}
                usedStitchTypes={usedStitchTypes}
                customStitches={customStitches}
              />
            );
          case 'pattern':
            return <PatternPage key={s.id} section={s} />;
          case 'special':
            return customStitches.length > 0 ? <LegendPage key={s.id} customStitches={customStitches} /> : null;
          default:
            return null;
        }
      })}
    </Document>
  );
}
