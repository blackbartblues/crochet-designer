import type { CustomStitch } from '../graph/types';

/** Draft state used by the creation modal — fields populated incrementally. */
export interface CustomStitchDraft {
  shortCode: string;
  namePl: string;
  nameEn: string;
  descriptionPl: string;
  descriptionEn: string;
  symbolPresetId?: string;
  symbolSvgPath?: string;
}

export const EMPTY_DRAFT: CustomStitchDraft = {
  shortCode: '',
  namePl: '',
  nameEn: '',
  descriptionPl: '',
  descriptionEn: '',
};

export type FinalizedCustomStitch = CustomStitch;
