import type { CellContent } from '../../domain/pattern';
import type { YarnColor } from '../../domain/colors';
import type { CustomStitchMeta } from '../../domain/stitches';
import { STITCHES, isCustomStitch, isBuiltInStitch } from '../../domain/stitches';
import { isValidLibrarySymbolId } from '../../domain/symbolLibrary';
import { isDarkHex } from '../../domain/colors';

interface GridCellProps {
  cell: CellContent;
  color: YarnColor | undefined;
  isCursor: boolean;
  /** Lookup of custom stitches in the active pattern, by key. */
  customStitchMap: Map<string, CustomStitchMeta>;
  onClick?: () => void;
}

export function GridCell({
  cell,
  color,
  isCursor,
  customStitchMap,
  onClick,
}: GridCellProps) {
  const classes = ['cell'];
  if (isCursor) classes.push('is-cursor');

  const dark = color ? isDarkHex(color.hex) : false;
  if (dark) classes.push('dark');

  const style = color ? { background: color.hex } : undefined;

  let symbolNode: React.ReactNode = null;
  let ariaLabel = 'puste oczko';
  if (cell) {
    if (isBuiltInStitch(cell.stitch)) {
      symbolNode = (
        <svg>
          <use href={`#${STITCHES[cell.stitch].symbolId}`} />
        </svg>
      );
      ariaLabel = `${cell.stitch} ${color?.name ?? ''}`;
    } else if (isCustomStitch(cell.stitch)) {
      const meta = customStitchMap.get(cell.stitch);
      if (meta) {
        if (meta.symbolRef && isValidLibrarySymbolId(meta.symbolRef)) {
          symbolNode = (
            <svg>
              <use href={`#${meta.symbolRef}`} />
            </svg>
          );
        } else {
          // Fallback: letter-in-circle.
          symbolNode = (
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <text
                x="12"
                y="13"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="var(--font-mono, monospace)"
                fontWeight="600"
                fill="currentColor"
              >
                {meta.code.slice(0, 3).toUpperCase()}
              </text>
            </svg>
          );
        }
        ariaLabel = `${meta.code} ${color?.name ?? ''}`;
      }
    }
  }

  return (
    <button
      type="button"
      className={classes.join(' ')}
      style={style}
      onClick={onClick}
      tabIndex={-1}
      aria-label={ariaLabel}
    >
      {symbolNode}
    </button>
  );
}
