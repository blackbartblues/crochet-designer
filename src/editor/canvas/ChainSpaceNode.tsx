import { Handle, Position } from 'reactflow';
import { editorTheme } from '../theme';

export interface ChainSpaceNodeData {
  label?: string;
}

interface Props {
  id: string;
  selected: boolean;
  data: ChainSpaceNodeData;
}

export function ChainSpaceNode({ selected, data }: Props) {
  return (
    <div
      data-testid="chain-space-node"
      data-selected={selected ? 'true' : 'false'}
      style={{
        width: 56,
        height: 26,
        borderRadius: 4,
        background: editorTheme.color.paper,
        border: `1px dashed ${editorTheme.color.inkSoft}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: editorTheme.font.body,
        color: editorTheme.color.inkSoft,
        fontStyle: 'italic',
        fontSize: 10,
        position: 'relative',
      }}
    >
      <span>{data.label ?? 'ch-sp'}</span>
      <Handle type="target" position={Position.Top} id="in" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="anchor" style={handleStyle} />
    </div>
  );
}

const handleStyle = {
  width: 5,
  height: 5,
  background: editorTheme.color.inkSoft,
  border: `1px solid ${editorTheme.color.paper}`,
};
