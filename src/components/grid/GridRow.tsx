import { GridCell } from './GridCell';
import { RowDirectionToggle } from './RowDirectionToggle';
import type { Row } from '../../domain/pattern';
import type { YarnColor, ColorId } from '../../domain/colors';
import type { CustomStitchMeta } from '../../domain/stitches';

interface GridRowProps {
  row: Row;
  rowIndex: number;
  rowNumber: number;
  cols: number;
  /** Lookup map id → color, includes the base color. */
  colorMap: Map<ColorId, YarnColor>;
  /** Lookup of custom stitches by key (for rendering custom symbols). */
  customStitchMap: Map<string, CustomStitchMeta>;
  /** 0-indexed; null/undefined when cursor is on a different row. */
  cursorCol?: number;
  isCursorRow: boolean;
  onPaintCell?: (row: number, col: number) => void;
  onToggleDirection?: (row: number) => void;
}

export function GridRow({
  row,
  rowIndex,
  rowNumber,
  cols,
  colorMap,
  customStitchMap,
  cursorCol,
  isCursorRow,
  onPaintCell,
  onToggleDirection,
}: GridRowProps) {
  let stitchCount = 0;
  for (const c of row.cells) if (c) stitchCount++;

  return (
    <div className="grid-row">
      <div className={`row-number${isCursorRow ? ' is-pulse' : ''}`}>{rowNumber}</div>

      <div className="row-cells">
        {row.cells.map((cell, idx) => (
          <GridCell
            key={idx}
            cell={cell}
            color={cell ? colorMap.get(cell.colorId) : undefined}
            customStitchMap={customStitchMap}
            isCursor={isCursorRow && cursorCol === idx}
            {...(onPaintCell ? { onClick: () => onPaintCell(rowIndex, idx) } : {})}
          />
        ))}
      </div>

      <RowDirectionToggle
        direction={row.direction}
        {...(onToggleDirection ? { onToggle: () => onToggleDirection(rowIndex) } : {})}
      />

      <span className="row-stitches-count">
        {stitchCount}/{cols}
      </span>
    </div>
  );
}
