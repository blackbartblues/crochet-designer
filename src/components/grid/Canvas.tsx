import { Grid } from './Grid';
import type { Pattern, Cursor } from '../../domain/pattern';

interface CanvasProps {
  pattern: Pattern;
  cursor: Cursor | null;
  onPaintCell?: (row: number, col: number) => void;
  onToggleRowDirection?: (row: number) => void;
  onNewRow?: () => void;
}

export function Canvas({ pattern, cursor, onPaintCell, onToggleRowDirection, onNewRow }: CanvasProps) {
  return (
    <main className="canvas-wrap">
      <Grid
        pattern={pattern}
        cursor={cursor}
        {...(onPaintCell ? { onPaintCell } : {})}
        {...(onToggleRowDirection ? { onToggleRowDirection } : {})}
        {...(onNewRow ? { onNewRow } : {})}
      />
    </main>
  );
}
