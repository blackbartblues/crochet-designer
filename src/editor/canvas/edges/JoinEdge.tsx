import { BaseEdge, getStraightPath, type EdgeProps } from 'reactflow';
import { editorTheme } from '../../theme';

export function JoinEdge(props: EdgeProps) {
  const [path] = getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: editorTheme.color.accent,
        strokeWidth: 1.3,
        strokeDasharray: '2 4',
      }}
    />
  );
}
