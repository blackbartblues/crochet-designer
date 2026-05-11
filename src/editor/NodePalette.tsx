import type { CustomStitch, Color, StitchTypeRef, BuiltinStitchType } from '../domain/graph/types';
import { editorTheme } from './theme';

const BUILTIN_TYPES: Array<{ type: BuiltinStitchType; label: string; symbol: string }> = [
  { type: 'magic_ring', label: 'ring', symbol: '○' },
  { type: 'ch',         label: 'ch',   symbol: '∞' },
  { type: 'sl_st',      label: 'sl',   symbol: '•' },
  { type: 'sc',         label: 'sc',   symbol: '×' },
  { type: 'hdc',        label: 'hdc',  symbol: 'Ŧ' },
  { type: 'dc',         label: 'dc',   symbol: '⊤' },
  { type: 'tr',         label: 'tr',   symbol: '⊤' },
  { type: 'gr_st',      label: 'gr',   symbol: '≣' },
  { type: 'fasten_off', label: 'off',  symbol: '↗' },
];

interface Props {
  onSelect: (typeRef: StitchTypeRef) => void;
  onAddCustom: () => void;
  customStitches: ReadonlyArray<CustomStitch>;
  colors: ReadonlyArray<Color>;
}

const tileStyle = {
  background: editorTheme.color.paperHi,
  border: `1px solid ${editorTheme.color.rule}`,
  borderRadius: editorTheme.radius.s,
  padding: '6px 8px',
  marginBottom: 3,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: editorTheme.color.ink,
  fontFamily: editorTheme.font.body,
} as const;

export function NodePalette({ onSelect, onAddCustom, customStitches, colors }: Props) {
  return (
    <aside
      style={{
        width: 120,
        background: editorTheme.color.paper,
        borderRight: `1px solid ${editorTheme.color.rule}`,
        padding: 10,
        overflow: 'auto',
        height: '100%',
      }}
    >
      <h3 style={{ fontStyle: 'italic', color: editorTheme.color.inkSoft, fontSize: 12, margin: '0 0 6px 0' }}>
        Sploty
      </h3>
      {BUILTIN_TYPES.map(({ type, label, symbol }) => (
        <button
          key={type}
          type="button"
          style={{ ...tileStyle, width: '100%' }}
          onClick={() => onSelect({ kind: 'builtin', type })}
        >
          <span style={{ fontSize: 14 }}>{symbol}</span>
          <span>{label}</span>
        </button>
      ))}

      <h3 style={{ fontStyle: 'italic', color: editorTheme.color.inkSoft, fontSize: 12, margin: '14px 0 6px 0' }}>
        Custom
      </h3>
      {customStitches.map((c) => (
        <button
          key={c.id}
          type="button"
          style={{ ...tileStyle, width: '100%' }}
          onClick={() => onSelect({ kind: 'custom', id: c.id })}
        >
          <span style={{ fontStyle: 'italic' }}>{c.shortCode}</span>
        </button>
      ))}
      <button
        type="button"
        style={{
          ...tileStyle,
          width: '100%',
          background: 'transparent',
          color: editorTheme.color.inkSoft,
          textAlign: 'center',
          justifyContent: 'center',
        }}
        onClick={onAddCustom}
      >
        + custom
      </button>

      {colors.length > 0 && (
        <>
          <h3 style={{ fontStyle: 'italic', color: editorTheme.color.inkSoft, fontSize: 12, margin: '14px 0 6px 0' }}>
            Kolory
          </h3>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {colors.map((c) => (
              <div
                key={c.id}
                title={c.nameByLanguage?.pl ?? c.id}
                style={{
                  width: 18,
                  height: 18,
                  background: c.hex,
                  border: `1px solid ${editorTheme.color.inkSoft}`,
                  borderRadius: editorTheme.radius.s,
                }}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
