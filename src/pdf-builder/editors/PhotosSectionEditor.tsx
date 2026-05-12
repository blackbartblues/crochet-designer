import { useRef } from 'react';
import type { PhotosSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';
import { readImageFile, buildPhotoFromBase64 } from '../../photos/importer';

interface Props {
  section: PhotosSection;
}

export function PhotosSectionEditor({ section }: Props) {
  const update = usePdfDocumentStore((s) => s.updateSection);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    const newPhotos = [];
    for (const f of Array.from(files)) {
      const data = await readImageFile(f);
      newPhotos.push(buildPhotoFromBase64(data));
    }
    update({ ...section, photos: [...section.photos, ...newPhotos] });
  }

  return (
    <div style={{ padding: 24, fontFamily: 'Georgia, serif', color: '#3a2f1d', maxWidth: 700 }}>
      <h2 style={{ margin: '0 0 16px 0', fontStyle: 'italic' }}>Photos</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Heading
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.heading}
          onChange={(e) => update({ ...section, heading: e.target.value })}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Caption
        <input
          style={{ display: 'block', width: '100%', padding: 6, marginTop: 4 }}
          value={section.caption ?? ''}
          onChange={(e) => update({ ...section, caption: e.target.value || undefined })}
        />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginTop: 16 }}>
        {section.photos.map((p) => (
          <div key={p.id} style={{ border: '1px solid #b8a87a', padding: 4, position: 'relative' }}>
            {p.storage.kind === 'inline' && (
              <img
                src={`data:${p.storage.mime};base64,${p.storage.base64}`}
                alt=""
                style={{ width: '100%', height: 100, objectFit: 'cover' }}
              />
            )}
            <button
              type="button"
              onClick={() => update({ ...section, photos: section.photos.filter((x) => x.id !== p.id) })}
              style={{ position: 'absolute', top: 4, right: 4, background: '#fff', border: '1px solid #d4831a', borderRadius: 3, cursor: 'pointer' }}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => void handleUpload(e.target.files)}
      />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        style={{ marginTop: 16, padding: '8px 16px', background: '#5a4730', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
      >
        + Upload photos
      </button>
    </div>
  );
}
