import type { TextSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: TextSection;
}

export function TextSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Text block</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Heading (optional)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.heading ?? ''}
          onChange={(e) => update({ ...section, heading: e.target.value || undefined })}
        />
      </label>
      <label style={{ display: 'block' }}>
        Body
        <textarea
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4, minHeight: 200, fontFamily: 'inherit' }}
          value={section.body}
          onChange={(e) => update({ ...section, body: e.target.value })}
        />
      </label>
    </div>
  );
}
