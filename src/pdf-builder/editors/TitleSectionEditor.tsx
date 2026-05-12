import type { TitleSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: TitleSection;
}

export function TitleSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  const updateMeta = usePdfDocumentStore((s) => s.updateMeta);
  const doc = usePdfDocumentStore((s) => s.document);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 520 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Title page</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Title (English)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.title.en ?? ''}
          onChange={(e) => updateMeta({ title: { pl: doc?.meta.title.pl ?? '', en: e.target.value } })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Title (Polish)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.title.pl ?? ''}
          onChange={(e) => updateMeta({ title: { pl: e.target.value, en: doc?.meta.title.en ?? '' } })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Author
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.author ?? ''}
          onChange={(e) => updateMeta({ author: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <input
          type="checkbox"
          checked={section.showYear}
          onChange={(e) => update({ ...section, showYear: e.target.checked })}
        />{' '}
        Show year on the title page
      </label>
    </div>
  );
}
