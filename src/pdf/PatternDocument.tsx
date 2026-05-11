import { Document } from '@react-pdf/renderer';
import type { Pattern } from '../domain/graph/types';
import { TitlePage } from './pages/TitlePage';
import { ThanksPage } from './pages/ThanksPage';
import { InformationPage } from './pages/InformationPage';
import { PatternPage } from './pages/PatternPage';
import { LegendPage } from './pages/LegendPage';

interface Props {
  pattern: Pattern;
}

export function PatternDocument({ pattern }: Props) {
  const enabled = new Set(
    pattern.pdfSections.filter((s) => s.enabled).map((s) => s.kind),
  );
  return (
    <Document>
      {enabled.has('title') && <TitlePage pattern={pattern} />}
      {enabled.has('thanks') && <ThanksPage pattern={pattern} />}
      {enabled.has('information') && <InformationPage pattern={pattern} />}
      {enabled.has('pattern') && <PatternPage pattern={pattern} />}
      {enabled.has('legend') && pattern.customStitches.length > 0 && (
        <LegendPage pattern={pattern} />
      )}
    </Document>
  );
}
