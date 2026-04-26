interface ColumnHeaderProps {
  cols: number;
  /** Optional 1-indexed column to highlight (e.g., cursor column). */
  highlightCol?: number;
}

export function ColumnHeader({ cols, highlightCol }: ColumnHeaderProps) {
  const numbers: number[] = [];
  for (let c = 1; c <= cols; c++) numbers.push(c);

  return (
    <div className="column-numbers-row">
      {numbers.map((c) => (
        <div key={c} className={`col-num${c === highlightCol ? ' is-pulse' : ''}`}>
          {c}
        </div>
      ))}
    </div>
  );
}
