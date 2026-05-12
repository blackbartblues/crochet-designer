import { useMemo } from 'react';
import type { Pattern, StitchId } from '../domain/graph/types';
import { validateGraph } from '../domain/validation/graph';
import { editorTheme } from './theme';
import { readImageFile, buildPhotoFromBase64 } from '../photos/importer';
import { usePhotoStore } from '../photos/photoStore';
import { usePatternGraphStore } from '../stores/patternGraphStore';

interface Props {
  pattern: Pattern;
  selectedStitchId: StitchId | null;
}

export function Inspector({ pattern, selectedStitchId }: Props) {
  const stitch = useMemo(
    () => pattern.stitches.find((s) => s.id === selectedStitchId) ?? null,
    [pattern, selectedStitchId],
  );

  const issuesForStitch = useMemo(() => {
    if (!stitch) return [];
    return validateGraph(pattern).filter((i) => i.stitchId === stitch.id);
  }, [pattern, stitch]);

  return (
    <aside
      style={{
        width: 220,
        background: editorTheme.color.paperHi,
        borderLeft: `1px solid ${editorTheme.color.rule}`,
        padding: editorTheme.spacing.m,
        fontSize: 12,
        color: editorTheme.color.ink,
        fontFamily: editorTheme.font.body,
        height: '100%',
        overflow: 'auto',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontStyle: 'italic', color: editorTheme.color.inkSoft }}>Inspector</h3>
      {!stitch ? (
        <div style={{ color: editorTheme.color.inkSoft, fontStyle: 'italic' }}>no stitch selected</div>
      ) : (
        <>
          <div><strong>Type:</strong> {stitch.typeRef.kind === 'builtin' ? stitch.typeRef.type : `custom: ${stitch.typeRef.id}`}</div>
          {stitch.round !== undefined && <div><strong>Round:</strong> Round {stitch.round}</div>}
          {stitch.colorRef && <div><strong>Color:</strong> {stitch.colorRef}</div>}
          {stitch.position && (
            <div><strong>Pos:</strong> ({Math.round(stitch.position.x)}, {Math.round(stitch.position.y)})</div>
          )}
          {stitch.attachments?.photoIds && stitch.attachments.photoIds.length > 0 && (
            <div><strong>Photos:</strong> {stitch.attachments.photoIds.length}</div>
          )}
          <div style={{ marginTop: 10 }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id={`photo-upload-${stitch.id}`}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const data = await readImageFile(file);
                const photo = buildPhotoFromBase64(data);
                usePhotoStore.getState().addPhoto(photo);
                const current = usePatternGraphStore.getState().pattern;
                if (!current) return;
                const updatedStitches = current.stitches.map((s) =>
                  s.id === stitch.id
                    ? {
                        ...s,
                        attachments: {
                          ...s.attachments,
                          photoIds: [...(s.attachments?.photoIds ?? []), photo.id],
                        },
                      }
                    : s,
                );
                const updatedPhotos = [...current.photos, photo];
                usePatternGraphStore.getState().setPattern({
                  ...current,
                  stitches: updatedStitches,
                  photos: updatedPhotos,
                });
                e.target.value = '';
              }}
            />
            <label
              htmlFor={`photo-upload-${stitch.id}`}
              style={{
                cursor: 'pointer',
                color: editorTheme.color.inkSoft,
                fontStyle: 'italic',
                fontSize: 11,
              }}
            >
              + attach photo
            </label>
          </div>
          {stitch.attachments?.note && (
            <div style={{ marginTop: 6, padding: 6, background: editorTheme.color.accentHi, fontStyle: 'italic' }}>
              {stitch.attachments.note}
            </div>
          )}
          {issuesForStitch.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: '0 0 4px 0', fontStyle: 'italic', color: editorTheme.color.inkSoft }}>Walidator</h4>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {issuesForStitch.map((i, idx) => (
                  <li key={idx} style={{ color: i.severity === 'critical' ? editorTheme.color.accent : editorTheme.color.inkSoft }}>
                    {i.kind}: {i.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
