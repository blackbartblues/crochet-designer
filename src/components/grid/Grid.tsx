import { useTranslation } from 'react-i18next';
import { Icon } from '../primitives/Icon';
import { ColumnHeader } from './ColumnHeader';
import { GridRow } from './GridRow';
import type { Pattern, Cursor } from '../../domain/pattern';
import type { ColorId, YarnColor } from '../../domain/colors';

interface GridProps {
  pattern: Pattern;
  cursor: Cursor | null;
  onPaintCell?: (row: number, col: number) => void;
  onToggleRowDirection?: (row: number) => void;
  onNewRow?: () => void;
}

export function Grid({ pattern, cursor, onPaintCell, onToggleRowDirection, onNewRow }: GridProps) {
  const { t } = useTranslation();
  const colorMap = new Map<ColorId, YarnColor>();
  for (const c of pattern.colors) colorMap.set(c.id, c);

  const cols = pattern.rows[0]?.cells.length ?? 0;

  return (
    <div className="canvas">
      <ColumnHeader cols={cols} {...(cursor ? { highlightCol: cursor.col + 1 } : {})} />

      <div className="grid-region">
        {pattern.rows.map((row, idx) => {
          const isCursorRow = cursor?.row === idx;
          return (
            <GridRow
              key={row.id}
              row={row}
              rowIndex={idx}
              rowNumber={idx + 1}
              cols={cols}
              colorMap={colorMap}
              isCursorRow={isCursorRow}
              {...(isCursorRow && cursor ? { cursorCol: cursor.col } : {})}
              {...(onPaintCell ? { onPaintCell } : {})}
              {...(onToggleRowDirection ? { onToggleDirection: onToggleRowDirection } : {})}
            />
          );
        })}
      </div>

      <button className="new-row-hint" onClick={onNewRow}>
        <Icon name="ui-corner-down" size="sm" />
        {t('grid.addRow')} <span className="kbd">Enter</span>
      </button>
    </div>
  );
}
