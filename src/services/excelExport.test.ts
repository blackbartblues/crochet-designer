import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { buildWorkbookBuffer } from './excelExport';
import { createEmptyPattern } from '../domain/pattern';

async function readBack(bytes: Uint8Array): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  return wb;
}

describe('buildWorkbookBuffer', () => {
  it('produces a workbook with two sheets: Wzór + Legenda', async () => {
    const p = createEmptyPattern('Test', 4);
    const bytes = await buildWorkbookBuffer(p);
    const wb = await readBack(bytes);
    const names = wb.worksheets.map((s) => s.name);
    expect(names).toContain('Pattern');
    expect(names).toContain('Legend');
  });

  it('writes the pattern name in the title row (A1)', async () => {
    const p = createEmptyPattern('Mój szalik', 3);
    const wb = await readBack(await buildWorkbookBuffer(p));
    const sheet = wb.getWorksheet('Pattern');
    expect(sheet?.getCell('A1').value).toBe('Mój szalik');
  });

  it('places dimension info in row 2', async () => {
    const p = createEmptyPattern('T', 5);
    const wb = await readBack(await buildWorkbookBuffer(p));
    const sheet = wb.getWorksheet('Pattern');
    expect(String(sheet?.getCell('A2').value)).toContain('5 × 1 stitches');
  });

  it('writes column numbers 1..N starting in B4', async () => {
    const p = createEmptyPattern('T', 4);
    const wb = await readBack(await buildWorkbookBuffer(p));
    const sheet = wb.getWorksheet('Pattern');
    expect(sheet?.getCell('A4').value).toBe('Row');
    expect(sheet?.getCell('B4').value).toBe(1);
    expect(sheet?.getCell('E4').value).toBe(4);
  });

  it('writes row numbers in column A starting at row 5', async () => {
    const p = createEmptyPattern('T', 3);
    p.rows.push({ id: 'r2', direction: 'ltr', cells: [null, null, null] });
    const wb = await readBack(await buildWorkbookBuffer(p));
    const sheet = wb.getWorksheet('Pattern');
    expect(sheet?.getCell('A5').value).toBe(1);
    expect(sheet?.getCell('A6').value).toBe(2);
  });

  it('writes stitch code + fill color for filled cells', async () => {
    const p = createEmptyPattern('T', 3);
    p.rows[0]!.cells[0] = { stitch: 'sc', colorId: 'base' };
    p.rows[0]!.cells[2] = { stitch: 'dc', colorId: 'base' };
    const wb = await readBack(await buildWorkbookBuffer(p));
    const sheet = wb.getWorksheet('Pattern');
    // First filled cell: row 5 col B
    expect(sheet?.getCell('B5').value).toBe('sc');
    // Empty cell stays null
    expect(sheet?.getCell('C5').value).toBeNull();
    // Third filled cell
    expect(sheet?.getCell('D5').value).toBe('dc');
    // Verify fill color is applied (ARGB format with FF prefix)
    const fill = sheet?.getCell('B5').fill as ExcelJS.FillPattern | undefined;
    expect(fill?.type).toBe('pattern');
    expect((fill?.fgColor?.argb as string)?.toUpperCase()).toBe('FFF5EDE0');
  });

  it('legend lists every color used or available with its hex', async () => {
    const p = createEmptyPattern('T', 2);
    const wb = await readBack(await buildWorkbookBuffer(p));
    const legend = wb.getWorksheet('Legend');
    expect(legend?.getCell('A1').value).toBe('Name');
    // Base color appears in row 2
    expect(String(legend?.getCell('A2').value)).toContain('Kremowy');
    expect(legend?.getCell('B2').value).toBe('#F5EDE0');
  });

  it('legend stitch table only includes used stitches', async () => {
    const p = createEmptyPattern('T', 3);
    p.rows[0]!.cells[0] = { stitch: 'sc', colorId: 'base' };
    p.rows[0]!.cells[1] = { stitch: 'dc', colorId: 'base' };
    const wb = await readBack(await buildWorkbookBuffer(p));
    const legend = wb.getWorksheet('Legend');
    // Find the stitch header row by scanning column A for "Skrót"
    let stitchHeaderRow = -1;
    if (legend) {
      legend.eachRow((row, idx) => {
        if (row.getCell(1).value === 'Code') stitchHeaderRow = idx;
      });
    }
    expect(stitchHeaderRow).toBeGreaterThan(0);
    const codes: string[] = [];
    if (legend && stitchHeaderRow > 0) {
      for (let i = stitchHeaderRow + 1; i <= stitchHeaderRow + 10; i++) {
        const v = legend.getCell(i, 1).value;
        if (v) codes.push(String(v));
      }
    }
    expect(codes).toContain('sc');
    expect(codes).toContain('dc');
    expect(codes).not.toContain('hdc');
  });

  it('output is non-empty and parses cleanly', async () => {
    const p = createEmptyPattern('T', 5);
    const bytes = await buildWorkbookBuffer(p);
    expect(bytes.byteLength).toBeGreaterThan(2000);
    await expect(readBack(bytes)).resolves.toBeDefined();
  });
});
