import { pdf } from '@react-pdf/renderer';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import type { Pattern } from '../domain/graph/types';
import { PatternDocument } from './PatternDocument';
import { suggestPdfFilename } from './filename';

export type ExportResult =
  | { kind: 'ok'; path: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

/** Generate and save the PDF. Shows a Tauri save dialog. */
export async function exportPatternPdf(pattern: Pattern): Promise<ExportResult> {
  try {
    const picked = await saveDialog({
      title: 'Save PDF',
      defaultPath: suggestPdfFilename(pattern),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!picked) return { kind: 'cancelled' };

    const blob = await pdf(<PatternDocument pattern={pattern} />).toBlob();
    const buffer = await blob.arrayBuffer();
    await writeFile(picked, new Uint8Array(buffer));
    return { kind: 'ok', path: picked };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: 'error', message };
  }
}

export { suggestPdfFilename };
