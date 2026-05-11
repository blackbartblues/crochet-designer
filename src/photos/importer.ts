import { newId } from '../utils/id';
import type { Photo } from '../domain/graph/types';

export interface BuildPhotoInput {
  base64: string;
  width: number;
  height: number;
  mime: string;
}

export function buildPhotoFromBase64(input: BuildPhotoInput): Photo {
  const bytes = Math.floor((input.base64.length * 3) / 4);
  return {
    id: newId(),
    storage: { kind: 'inline', base64: input.base64, mime: input.mime },
    width: input.width,
    height: input.height,
    bytes,
  };
}

/** Read a File via FileReader and return base64 + dimensions. */
export async function readImageFile(
  file: File,
): Promise<{ base64: string; width: number; height: number; mime: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.split(',')[1] ?? '';
  const mime = file.type || 'image/jpeg';
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Image decode failed'));
    i.src = dataUrl;
  });
  return { base64, width: img.naturalWidth, height: img.naturalHeight, mime };
}
