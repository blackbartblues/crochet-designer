import type { PdfDocument } from './document/types';

export function suggestPdfFilename(doc: PdfDocument): string {
  const raw = (doc.meta.title.en || doc.meta.title.pl || 'pattern').trim();
  const safe = raw.replace(/[<>:"/\\|?*\x00-\x1f]+/g, '').slice(0, 80) || 'pattern';
  return `${safe}.pdf`;
}
