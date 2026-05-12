import { newId } from '../../utils/id';
import { emptyPatternV3 } from '../../domain/graph/build';
import type {
  PdfDocument,
  PdfDocumentMeta,
  Section,
  SectionKind,
  TitleSection,
  ThanksSection,
  InformationSection,
  PatternSection,
  PhotosSection,
  SpecialStitchesSection,
  TextSection,
  PageBreakSection,
} from './types';

export interface EmptyPdfDocumentInput {
  title: { pl: string; en: string };
  author: string;
  language?: PdfDocumentMeta['language'];
}

export function newSection(kind: SectionKind): Section {
  const id = newId();
  switch (kind) {
    case 'title':
      return { id, kind, showYear: true } as TitleSection;
    case 'thanks':
      return {
        id,
        kind,
        message:
          "Thank you for supporting my small business. I hope you'll enjoy this pattern as much as I did making it.",
      } as ThanksSection;
    case 'information':
      return {
        id,
        kind,
        yarn: {},
        hook: '3 mm',
        gauge: { stitches: 5, rows: 11, squareCm: 10 },
        termsSystem: 'US',
      } as InformationSection;
    case 'pattern': {
      const pattern = emptyPatternV3({
        title: { pl: 'Pattern', en: 'Pattern' },
        author: '',
        language: 'pl',
      });
      return {
        id,
        kind,
        heading: 'Pattern',
        pattern: { ...pattern, shape: 'radial' },
      } as PatternSection;
    }
    case 'photos':
      return {
        id,
        kind,
        heading: 'Process photos',
        photos: [],
      } as PhotosSection;
    case 'special':
      return {
        id,
        kind,
        heading: 'Special Stitches',
        entries: [],
      } as SpecialStitchesSection;
    case 'text':
      return { id, kind, body: '' } as TextSection;
    case 'pagebreak':
      return { id, kind } as PageBreakSection;
  }
}

export function defaultStarterSections(): Section[] {
  return [
    newSection('title'),
    newSection('thanks'),
    newSection('information'),
    newSection('pattern'),
    newSection('special'),
    newSection('photos'),
  ];
}

export function emptyPdfDocument(input: EmptyPdfDocumentInput): PdfDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    meta: {
      title: input.title,
      author: input.author,
      language: input.language ?? 'pl',
      designedAt: now,
    },
    sections: defaultStarterSections(),
  };
}
