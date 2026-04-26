import type { CellContent } from '../../domain/pattern';
import type { YarnColor } from '../../domain/colors';
import { STITCHES } from '../../domain/stitches';
import { isDarkHex } from '../../domain/colors';

interface GridCellProps {
  cell: CellContent;
  color: YarnColor | undefined;
  isCursor: boolean;
  onClick?: () => void;
}

export function GridCell({ cell, color, isCursor, onClick }: GridCellProps) {
  const classes = ['cell'];
  if (isCursor) classes.push('is-cursor');

  const dark = color ? isDarkHex(color.hex) : false;
  if (dark) classes.push('dark');

  const style = color ? { background: color.hex } : undefined;

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={style}
      onClick={onClick}
      tabIndex={-1}
      aria-label={cell ? `${cell.stitch} ${color?.name ?? ''}` : 'puste oczko'}
    >
      {cell && (
        <svg>
          <use href={`#${STITCHES[cell.stitch].symbolId}`} />
        </svg>
      )}
    </button>
  );
}
