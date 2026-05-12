import { newId } from '../../utils/id';
import type { CustomStitch } from '../graph/types';
import type { CustomStitchDraft } from './types';

const BUILTIN_SHORTCODES = new Set([
  'ch', 'sl', 'ss', 'sc', 'hdc', 'dc', 'tr', 'dtr', 'trtr',
  'inc', 'dec', 'gr',
]);

export function addCustomStitch(
  list: ReadonlyArray<CustomStitch>,
  stitch: CustomStitch,
): CustomStitch[] {
  return [...list, stitch];
}

export function removeCustomStitch(
  list: ReadonlyArray<CustomStitch>,
  id: string,
): CustomStitch[] {
  return list.filter((c) => c.id !== id);
}

export function findByShortCode(
  list: ReadonlyArray<CustomStitch>,
  shortCode: string,
): CustomStitch | undefined {
  const norm = shortCode.toLowerCase();
  return list.find((c) => c.shortCode.toLowerCase() === norm);
}

export function isShortCodeAvailable(
  list: ReadonlyArray<CustomStitch>,
  shortCode: string,
): boolean {
  const norm = shortCode.toLowerCase();
  if (BUILTIN_SHORTCODES.has(norm)) return false;
  return !list.some((c) => c.shortCode.toLowerCase() === norm);
}

export type FinalizeResult =
  | { kind: 'ok'; value: CustomStitch }
  | { kind: 'error'; messages: string[] };

const SHORTCODE_RE = /^[A-Za-z]{1,3}$/;

export function finalizeDraft(draft: CustomStitchDraft): FinalizeResult {
  const errors: string[] = [];
  if (!SHORTCODE_RE.test(draft.shortCode)) {
    errors.push('shortCode must be 1–3 letters');
  }
  if (draft.namePl.trim() === '') errors.push('namePl is required');
  if (draft.nameEn.trim() === '') errors.push('nameEn is required');
  if (!draft.symbolPresetId && !draft.symbolSvgPath) {
    errors.push('symbol (presetId or svgPath) is required');
  }
  if (errors.length > 0) return { kind: 'error', messages: errors };

  const symbol = draft.symbolPresetId
    ? { kind: 'preset' as const, presetId: draft.symbolPresetId }
    : { kind: 'svgPath' as const, path: draft.symbolSvgPath! };

  const description =
    draft.descriptionPl.trim() || draft.descriptionEn.trim()
      ? { pl: draft.descriptionPl, en: draft.descriptionEn }
      : undefined;

  return {
    kind: 'ok',
    value: {
      id: newId(),
      shortCode: draft.shortCode,
      nameByLanguage: { pl: draft.namePl, en: draft.nameEn },
      description,
      symbol,
    },
  };
}
