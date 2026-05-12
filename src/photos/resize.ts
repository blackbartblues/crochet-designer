export interface ResizedDims {
  width: number;
  height: number;
}

export function computeResizedDimensions(
  width: number,
  height: number,
  maxEdge: number,
): ResizedDims {
  if (width <= maxEdge && height <= maxEdge) {
    return { width, height };
  }

  const longEdge = Math.max(width, height);
  const ratio = maxEdge / longEdge;

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function resizeImageToBase64(
  source: HTMLImageElement,
  maxEdge: number,
  quality: number,
): Promise<{ base64: string; width: number; height: number }> {
  const dims = computeResizedDimensions(
    source.naturalWidth,
    source.naturalHeight,
    maxEdge,
  );

  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  ctx.drawImage(source, 0, 0, dims.width, dims.height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

  return { base64, width: dims.width, height: dims.height };
}
