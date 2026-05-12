import { useEffect } from 'react';
import type { PatternSection } from '../../pdf/document/types';
import { usePdfDocumentStore } from '../../stores/pdfDocumentStore';
import { usePatternGraphStore } from '../../stores/patternGraphStore';
import { GraphEditorShell } from '../../editor/GraphEditorShell';

interface Props {
  section: PatternSection;
}

export function PatternSectionEditor({ section }: Props) {
  const updateSection = usePdfDocumentStore((s) => s.updateSection);

  // On mount / section change: push section.pattern into graph store.
  // On unmount: sync current store state back to section.
  useEffect(() => {
    usePatternGraphStore.getState().setPattern(section.pattern);
    return () => {
      const current = usePatternGraphStore.getState().pattern;
      if (current) {
        updateSection({ ...section, pattern: current });
      }
      usePatternGraphStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  // Continuously sync back so the live preview stays current.
  const livePattern = usePatternGraphStore((s) => s.pattern);
  useEffect(() => {
    if (livePattern && livePattern !== section.pattern) {
      updateSection({ ...section, pattern: livePattern });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePattern]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #b8a87a', background: '#fafaf7', fontFamily: 'Georgia, serif', color: '#3a2f1d' }}>
        <input
          style={{ background: 'transparent', border: 'none', fontSize: 16, fontStyle: 'italic', width: '60%' }}
          value={section.heading}
          onChange={(e) => updateSection({ ...section, heading: e.target.value })}
          placeholder="Section heading (e.g. Pattern, Body, Sleeves)"
        />
      </div>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <GraphEditorShell />
      </div>
    </div>
  );
}
