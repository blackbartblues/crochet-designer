import type { Pattern, Photo, CustomStitch } from '../../domain/graph/types';

export type SectionId = string;

export interface PdfDocumentMeta {
  title: { pl: string; en: string };
  author: string;
  language: 'pl' | 'en' | 'pl-en';
  copyrightLine?: string;
  socialTag?: string;
  designedAt: string;
}

export interface TitleSection {
  id: SectionId;
  kind: 'title';
  title?: { pl: string; en: string };
  heroPhotoId?: string;
  showYear: boolean;
}

export interface ThanksSection {
  id: SectionId;
  kind: 'thanks';
  message: string;
  copyrightOverride?: string;
}

export interface InformationSection {
  id: SectionId;
  kind: 'information';
  yarn: { brand?: string; weight?: string; fiber?: string; meterage?: string };
  hook: string;
  gauge: { stitches: number; rows: number; squareCm: number };
  termsSystem: 'US' | 'UK';
  notes?: string;
}

export interface PatternSection {
  id: SectionId;
  kind: 'pattern';
  heading: string;
  pattern: Pattern;
}

export interface PhotosSection {
  id: SectionId;
  kind: 'photos';
  heading: string;
  photos: Photo[];
  caption?: string;
}

export interface SpecialStitchesSection {
  id: SectionId;
  kind: 'special';
  heading: string;
  entries: Array<{ stitch: CustomStitch; photos: Photo[] }>;
}

export interface TextSection {
  id: SectionId;
  kind: 'text';
  heading?: string;
  body: string;
}

export interface PageBreakSection {
  id: SectionId;
  kind: 'pagebreak';
}

export type Section =
  | TitleSection
  | ThanksSection
  | InformationSection
  | PatternSection
  | PhotosSection
  | SpecialStitchesSection
  | TextSection
  | PageBreakSection;

export type SectionKind = Section['kind'];

export interface PdfDocument {
  schemaVersion: 1;
  meta: PdfDocumentMeta;
  sections: Section[];
}

export function isPatternSection(s: Section): s is PatternSection {
  return s.kind === 'pattern';
}

export function isPhotosSection(s: Section): s is PhotosSection {
  return s.kind === 'photos';
}

export function isSpecialSection(s: Section): s is SpecialStitchesSection {
  return s.kind === 'special';
}
