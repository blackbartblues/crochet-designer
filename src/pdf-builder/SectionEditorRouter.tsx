import type { Section } from '../pdf/document/types';

interface Props {
  section: Section | null;
}

export function SectionEditorRouter({ section }: Props) {
  if (!section) {
    return (
      <div style={{ padding: 24, fontStyle: 'italic', color: '#7a6347', fontFamily: 'Georgia, serif' }}>
        Select a section from the outline to edit it.
      </div>
    );
  }
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d' }}>
      <h2 style={{ margin: '0 0 12px 0', fontStyle: 'italic' }}>
        Editor: {section.kind}
      </h2>
      <p style={{ color: '#7a6347', fontSize: 13 }}>
        The specific editor for "{section.kind}" sections is implemented in subsequent tasks.
      </p>
    </div>
  );
}
