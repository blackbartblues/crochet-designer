import { writeFile } from '@tauri-apps/plugin-fs';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { documentDir, join } from '@tauri-apps/api/path';
import type { Pattern } from '../domain/pattern';
import {
  STITCHES,
  isBuiltInStitch,
  isCustomStitch,
  type AnyStitchKey,
  type BuiltInStitchKey,
  type CustomStitchKey,
  type CustomStitchMeta,
} from '../domain/stitches';
import type { ColorId, YarnColor } from '../domain/colors';
import { isDarkHex } from '../domain/colors';
import { PatternFileError } from '../domain/validation';

const EXT = 'xlsx';
const FILTERS = [{ name: 'Arkusz Excel', extensions: [EXT] }];
const APP_FOLDER = 'Wzornik';

export type ExportResult =
  | { kind: 'ok'; path: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; error: PatternFileError };

function describeError(err: unknown): string {
  if (err == null) return 'nieznany błąd';
  if (err instanceof Error) return err.message || err.name || String(err);
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '')
    .trim()
    .slice(0, 80) || 'wzor';
}

/** Convert "#RRGGBB" → "FFRRGGBB" (exceljs ARGB format). */
function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '').toUpperCase();
  return `FF${clean}`;
}

/**
 * Build the Excel workbook in memory and return its bytes.
 * Exposed separately from the file-save flow so tests can verify content.
 */
export async function buildWorkbookBuffer(pattern: Pattern): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')).default ?? (await import('exceljs'));
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Wzornik Szydełkowy';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ===== Sheet 1: Pattern =====
  const sheet = workbook.addWorksheet('Pattern', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 4 }],
  });

  const cols = pattern.rows[0]?.cells.length ?? 0;

  // Title row
  sheet.mergeCells(1, 1, 1, Math.max(2, cols + 1));
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = pattern.name;
  titleCell.font = { name: 'Calibri', size: 16, bold: true };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.getRow(1).height = 24;

  // Dimensions row
  sheet.mergeCells(2, 1, 2, Math.max(2, cols + 1));
  const dimCell = sheet.getCell(2, 1);
  dimCell.value = `${cols} × ${pattern.rows.length} stitches`;
  dimCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF8A7B6E' } };

  // Column header row (row 4): "Row" in A4, then 1..cols in B..
  const headerRow = sheet.getRow(4);
  headerRow.getCell(1).value = 'Row';
  headerRow.getCell(1).font = { bold: true };
  headerRow.getCell(1).alignment = { horizontal: 'center' };
  for (let c = 0; c < cols; c++) {
    const cell = headerRow.getCell(c + 2);
    cell.value = c + 1;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
  }
  headerRow.height = 16;

  // Lookup colors by id
  const colorMap = new Map<ColorId, YarnColor>();
  for (const c of pattern.colors) colorMap.set(c.id, c);

  // Data rows starting at row 5
  pattern.rows.forEach((row, rowIdx) => {
    const r = sheet.getRow(5 + rowIdx);
    // Row number in column A
    r.getCell(1).value = rowIdx + 1;
    r.getCell(1).font = { bold: true };
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    row.cells.forEach((cell, colIdx) => {
      const xCell = r.getCell(colIdx + 2);
      xCell.alignment = { horizontal: 'center', vertical: 'middle' };
      xCell.border = {
        top: { style: 'thin', color: { argb: 'FFE8DCC4' } },
        left: { style: 'thin', color: { argb: 'FFE8DCC4' } },
        bottom: { style: 'thin', color: { argb: 'FFE8DCC4' } },
        right: { style: 'thin', color: { argb: 'FFE8DCC4' } },
      };
      if (cell) {
        const color = colorMap.get(cell.colorId);
        if (color) {
          xCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: hexToArgb(color.hex) },
          };
        }
        let code = '?';
        if (isBuiltInStitch(cell.stitch)) {
          code = STITCHES[cell.stitch].code;
        } else if (isCustomStitch(cell.stitch)) {
          const custom = pattern.customStitches.find((c) => c.key === cell.stitch);
          code = custom?.code ?? '?';
        }
        xCell.value = code;
        xCell.font = {
          bold: true,
          color: { argb: color && isDarkHex(color.hex) ? 'FFFFFCF6' : 'FF2A1F18' },
        };
      }
    });

    r.height = 22;
  });

  // Column widths: A narrow for row numbers, B+ uniform
  sheet.getColumn(1).width = 8;
  for (let c = 2; c <= cols + 1; c++) {
    sheet.getColumn(c).width = 5;
  }

  // ===== Sheet 2: Legend =====
  const legend = workbook.addWorksheet('Legend');

  // Color legend
  const colorHeader = legend.getRow(1);
  colorHeader.values = ['Name', 'Hex', 'Stitch count', 'Swatch'];
  colorHeader.font = { bold: true };
  colorHeader.alignment = { horizontal: 'left' };

  // Count cells per color id
  const colorCounts = new Map<ColorId, number>();
  for (const row of pattern.rows) {
    for (const cell of row.cells) {
      if (cell) colorCounts.set(cell.colorId, (colorCounts.get(cell.colorId) ?? 0) + 1);
    }
  }

  pattern.colors.forEach((color, idx) => {
    const r = legend.getRow(2 + idx);
    r.getCell(1).value = color.name + (color.isBase ? ' (base)' : '');
    r.getCell(2).value = color.hex.toUpperCase();
    r.getCell(2).font = { name: 'Consolas', size: 10 };
    r.getCell(3).value = colorCounts.get(color.id) ?? 0;
    r.getCell(3).alignment = { horizontal: 'right' };
    const sample = r.getCell(4);
    sample.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: hexToArgb(color.hex) },
    };
    sample.border = {
      top: { style: 'thin', color: { argb: 'FFC8B89D' } },
      left: { style: 'thin', color: { argb: 'FFC8B89D' } },
      bottom: { style: 'thin', color: { argb: 'FFC8B89D' } },
      right: { style: 'thin', color: { argb: 'FFC8B89D' } },
    };
  });

  legend.getColumn(1).width = 24;
  legend.getColumn(2).width = 12;
  legend.getColumn(3).width = 14;
  legend.getColumn(4).width = 10;

  // Spacer
  const stitchHeaderRowIdx = 2 + pattern.colors.length + 2;

  // Stitch legend — only stitches actually used.
  // Split into built-in and custom buckets so the legend can label them clearly.
  const usedBuiltIn = new Set<BuiltInStitchKey>();
  const usedCustom = new Set<CustomStitchKey>();
  for (const row of pattern.rows) {
    for (const cell of row.cells) {
      if (!cell) continue;
      const key: AnyStitchKey = cell.stitch;
      if (isBuiltInStitch(key)) usedBuiltIn.add(key);
      else if (isCustomStitch(key)) usedCustom.add(key);
    }
  }

  let cursorRow = stitchHeaderRowIdx;
  if (usedBuiltIn.size > 0) {
    const stitchHeader = legend.getRow(cursorRow);
    stitchHeader.values = ['Code', 'English name', 'Polish name'];
    stitchHeader.font = { bold: true };
    cursorRow++;

    for (const key of usedBuiltIn) {
      const meta = STITCHES[key];
      const r = legend.getRow(cursorRow);
      r.getCell(1).value = meta.code;
      r.getCell(1).font = { name: 'Consolas', size: 11, bold: true };
      r.getCell(2).value = meta.labelEn;
      r.getCell(3).value = meta.labelPl;
      cursorRow++;
    }
  }

  if (usedCustom.size > 0) {
    cursorRow++; // spacer
    const banner = legend.getRow(cursorRow);
    banner.getCell(1).value = 'Custom stitches / Niestandardowe sploty';
    banner.font = { bold: true, italic: true, color: { argb: 'FF8A4F2D' } };
    cursorRow++;

    const header = legend.getRow(cursorRow);
    header.values = ['Code', 'English name', 'Polish name', 'Note'];
    header.font = { bold: true };
    cursorRow++;

    const customMap = new Map<CustomStitchKey, CustomStitchMeta>();
    for (const cs of pattern.customStitches) customMap.set(cs.key, cs);

    for (const key of usedCustom) {
      const meta = customMap.get(key);
      if (!meta) continue;
      const r = legend.getRow(cursorRow);
      r.getCell(1).value = meta.code;
      r.getCell(1).font = { name: 'Consolas', size: 11, bold: true };
      r.getCell(2).value = meta.labelEn ?? '';
      r.getCell(3).value = meta.labelPl ?? '';
      r.getCell(4).value = 'User-defined — see pattern notes';
      r.getCell(4).font = { italic: true, color: { argb: 'FF8A7B6E' } };
      cursorRow++;
    }
  }

  const buf = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

async function defaultExportDir(override?: string | null): Promise<string> {
  if (override) return override;
  const docs = await documentDir();
  return join(docs, APP_FOLDER);
}

/**
 * Show a save dialog and write the workbook to the chosen path.
 */
export async function exportPatternToXlsx(
  pattern: Pattern,
  defaultDirOverride?: string | null,
): Promise<ExportResult> {
  let target: string;
  try {
    const defaultDir = await defaultExportDir(defaultDirOverride);
    const defaultPath = await join(defaultDir, `${sanitizeFileName(pattern.name)}.${EXT}`);
    const picked = await saveDialog({
      title: 'Eksport do Excel',
      defaultPath,
      filters: FILTERS,
    });
    if (!picked) return { kind: 'cancelled' };
    target = picked;
  } catch (err) {
    return { kind: 'error', error: new PatternFileError(`Błąd dialogu zapisu: ${describeError(err)}`, err) };
  }

  try {
    const bytes = await buildWorkbookBuffer(pattern);
    await writeFile(target, bytes);
    return { kind: 'ok', path: target };
  } catch (err) {
    return {
      kind: 'error',
      error: new PatternFileError(`Eksport nie powiódł się: ${describeError(err)}`, err),
    };
  }
}
