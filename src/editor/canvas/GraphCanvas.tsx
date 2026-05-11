import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { StitchNode } from './StitchNode';
import { ChainSpaceNode } from './ChainSpaceNode';
import { AnchorEdge } from './edges/AnchorEdge';
import { YarnFlowEdge } from './edges/YarnFlowEdge';
import { JoinEdge } from './edges/JoinEdge';
import { patternToReactFlow } from './graphMapping';
import { editorTheme } from '../theme';
import { usePatternGraphStore } from '../../stores/patternGraphStore';

const nodeTypes: NodeTypes = {
  stitch: StitchNode,
  chainSpace: ChainSpaceNode,
};

const edgeTypes: EdgeTypes = {
  anchor: AnchorEdge,
  yarn_flow: YarnFlowEdge,
  join: JoinEdge,
};

interface Props {
  onNodeClick?: (stitchId: string) => void;
}

export function GraphCanvas({ onNodeClick }: Props) {
  const pattern = usePatternGraphStore((s) => s.pattern);
  const updatePos = usePatternGraphStore((s) => s.updateStitchPosition);
  const { nodes, edges } = useMemo(
    () => (pattern ? patternToReactFlow(pattern) : { nodes: [], edges: [] }),
    [pattern],
  );

  return (
    <div style={{ width: '100%', height: '100%', background: editorTheme.color.paper }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_e, node) => onNodeClick?.(node.id)}
        onNodeDragStop={(_e, node) => updatePos(node.id, node.position)}
        fitView
      >
        <Background gap={24} size={1} color={editorTheme.color.rule} />
        <Controls position="bottom-left" />
        <MiniMap position="bottom-right" pannable zoomable />
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <marker id="anchor-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L7,4 L0,8" fill="none" stroke={editorTheme.color.rule} strokeWidth="1" />
            </marker>
            <marker id="yarn-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L7,4 L0,8" fill="none" stroke={editorTheme.color.yarnFlow} strokeWidth="1" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>
    </div>
  );
}
