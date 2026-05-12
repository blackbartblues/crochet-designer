import type { ThanksSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';

interface Props {
  section: ThanksSection;
}

export function ThanksSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  const updateMeta = usePdfDocumentStore((s) => s.updateMeta);
  const doc = usePdfDocumentStore((s) => s.document);
  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 520 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Thanks / Copyright</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Thank you message
        <textarea
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4, minHeight: 80, fontFamily: 'inherit' }}
          value={section.message}
          onChange={(e) => update({ ...section, message: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Copyright line (override)
        <textarea
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4, minHeight: 60, fontFamily: 'inherit' }}
          value={section.copyrightOverride ?? ''}
          onChange={(e) => update({ ...section, copyrightOverride: e.target.value || undefined })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Social tag (@handle or #hashtag)
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={doc?.meta.socialTag ?? ''}
          onChange={(e) => updateMeta({ socialTag: e.target.value || undefined })}
        />
      </label>
    </div>
  );
}
