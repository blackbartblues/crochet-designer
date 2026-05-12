import { Handle, Position } from 'reactflow';
import { editorTheme } from '../theme';

export interface StitchNodeData {
  label: string;
  symbol: string;
  color?: string;
  isSelected?: boolean;
}

interface Props {
  id: string;
  selected: boolean;
  data: StitchNodeData;
}

const SIZE = 44;

export function StitchNode({ selected, data }: Props) {
  const borderColor = selected ? editorTheme.color.accent : editorTheme.color.inkSoft;
  const background = data.color ?? editorTheme.color.paperHi;
  return (
    <div
      data-testid="stitch-node"
      data-selected={selected ? 'true' : 'false'}
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background,
        border: `${selected ? 2 : 1.2}px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: editorTheme.font.body,
        color: editorTheme.color.ink,
        boxShadow: selected ? `0 0 0 3px ${editorTheme.color.accentHi}` : 'none',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 16, lineHeight: 1 }}>{data.symbol}</div>
      <div style={{ fontSize: 9, lineHeight: 1, marginTop: 2, color: editorTheme.color.inkSoft }}>
        {data.label}
      </div>
      <Handle type="target" position={Position.Top} id="in" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="out" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="anchor" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="anchored-by" style={handleStyle} />
    </div>
  );
}

const handleStyle = {
  width: 6,
  height: 6,
  background: editorTheme.color.inkSoft,
  border: `1px solid ${editorTheme.color.paperHi}`,
};
