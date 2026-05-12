import type { Section, SectionKind } from '../pdf/document/types';

const KIND_LABEL: Record<SectionKind, string> = {
  title: 'Title',
  thanks: 'Thanks',
  information: 'Information',
  pattern: 'Pattern',
  photos: 'Photos',
  special: 'Special Stitches',
  text: 'Text',
  pagebreak: '— page break —',
};

interface Props {
  sections: Section[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (kind: SectionKind) => void;
  onRemove: (id: string) => void;
}

const KIND_OPTIONS: SectionKind[] = ['title', 'thanks', 'information', 'pattern', 'photos', 'special', 'text', 'pagebreak'];

export function SectionOutline({ sections, selectedId, onSelect, onAdd, onRemove }: Props) {
  return (
    <aside
      style={{
        width: 220,
        background: '#f4f1ea',
        borderRight: '1px solid #b8a87a',
        padding: 12,
        overflow: 'auto',
        height: '100%',
        fontFamily: 'Georgia, serif',
        color: '#3a2f1d',
      }}
    >
      <h3 style={{ fontStyle: 'italic', margin: '0 0 8px 0', fontSize: 14 }}>Outline</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sections.map((s, i) => (
          <li
            key={s.id}
            style={{
              padding: '6px 8px',
              marginBottom: 3,
              background: s.id === selectedId ? '#fffcef' : 'transparent',
              border: s.id === selectedId ? '1px solid #d4831a' : '1px solid transparent',
              borderRadius: 3,
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => onSelect(s.id)}
          >
            <span style={{ flex: 1 }}>
              {i + 1}. {KIND_LABEL[s.kind]}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(s.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#7a6347', cursor: 'pointer' }}
              title="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: '#5a4730', fontStyle: 'italic' }}>+ add section</summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
          {KIND_OPTIONS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onAdd(k)}
              style={{
                textAlign: 'left',
                padding: '4px 8px',
                background: '#fafaf7',
                border: '1px solid #b8a87a',
                borderRadius: 3,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </details>
    </aside>
  );
}
