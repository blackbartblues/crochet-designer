import { useEffect } from 'react';
import { GraphEditorShell } from '../editor/GraphEditorShell';
import { useDocumentStore } from '../stores/documentStore';
import { usePatternGraphStore } from '../stores/patternGraphStore';

export function GraphEditorView() {
  const pattern = useDocumentStore((s) => s.graphPattern);
  const setStorePattern = usePatternGraphStore((s) => s.setPattern);

  useEffect(() => {
    if (pattern) {
      setStorePattern(pattern);
    }
  }, [pattern, setStorePattern]);

  return <GraphEditorShell />;
}
