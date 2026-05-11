import type { Pattern } from '../domain/graph/types';

export function suggestPdfFilename(pattern: Pattern): string {
  const raw = (pattern.meta.title.en || pattern.meta.title.pl || 'pattern').trim();
  const safe = raw.replace(/[<>:"/\\|?*\x00-\x1f]+/g, '').slice(0, 80) || 'pattern';
  return `${safe}.pdf`;
}
