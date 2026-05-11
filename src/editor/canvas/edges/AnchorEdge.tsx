import { BaseEdge, getSmoothStepPath, type EdgeProps } from 'reactflow';
import { editorTheme } from '../../theme';

export function AnchorEdge(props: EdgeProps) {
  const [path] = getSmoothStepPath({
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
        stroke: editorTheme.color.rule,
        strokeWidth: 1.5,
      }}
      markerEnd="url(#anchor-arrow)"
    />
  );
}
