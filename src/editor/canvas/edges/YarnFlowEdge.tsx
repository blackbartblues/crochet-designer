import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow';
import { editorTheme } from '../../theme';

export function YarnFlowEdge(props: EdgeProps) {
  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  });
  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: editorTheme.color.yarnFlow,
        strokeWidth: 1.4,
        strokeDasharray: '5 4',
      }}
      markerEnd="url(#yarn-arrow)"
    />
  );
}
