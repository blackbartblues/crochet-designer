import React from 'react';
import type { Pattern } from '../domain/graph/types';
import { symbolForBuiltin, symbolForCustom } from './symbols';

const PADDING = 32;
const VIEWBOX_MIN = 200;

export function renderRadialChart(pattern: Pattern): React.JSX.Element {
  const positioned = pattern.stitches.filter((s) => s.position);
  if (positioned.length === 0) {
    return <svg width={VIEWBOX_MIN} height={VIEWBOX_MIN} viewBox={`0 0 ${VIEWBOX_MIN} ${VIEWBOX_MIN}`} />;
  }

  const xs = positioned.map((s) => s.position!.x);
  const ys = positioned.map((s) => s.position!.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const maxY = Math.max(...ys) + PADDING;
  const w = Math.max(maxX - minX, VIEWBOX_MIN);
  const h = Math.max(maxY - minY, VIEWBOX_MIN);

  function glyph(stitch: typeof positioned[number]): string {
    if (stitch.typeRef.kind === 'builtin') {
      return symbolForBuiltin(stitch.typeRef.type).text;
    }
    const cs = pattern.customStitches.find((c) => c.id === (stitch.typeRef as Extract<typeof stitch.typeRef, { kind: 'custom' }>).id);
    return cs ? symbolForCustom(cs).text : '?';
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox={`${minX} ${minY} ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {positioned.map((s) => (
        <text
          key={s.id}
          x={s.position!.x}
          y={s.position!.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#3a2f1d"
          fontSize={16}
        >
          {glyph(s)}
        </text>
      ))}
    </svg>
  );
}
