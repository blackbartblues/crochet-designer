import type { Photo } from '../domain/graph/types';

export interface PhotoVariants {
  preview: { base64: string; width: number; height: number };
  print: { base64: string; width: number; height: number };
}

export interface ImportResult {
  photo: Photo;
  variants: PhotoVariants;
}

export const PREVIEW_MAX_EDGE = 800;
export const PRINT_MAX_EDGE = 3000;
