import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GraphEditorShell } from './GraphEditorShell';
import { usePatternGraphStore } from '../stores/patternGraphStore';
import { emptyPatternV3 } from '../domain/graph/build';

describe('GraphEditorShell', () => {
  beforeEach(() => {
    usePatternGraphStore.getState().reset();
  });

  it('renders the top toolbar with editor brand', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    render(<GraphEditorShell />);
    expect(screen.getByText(/crochet-designer/i)).toBeInTheDocument();
  });

  it('renders palette and inspector when pattern is loaded', () => {
    const p = emptyPatternV3({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePatternGraphStore.getState().setPattern(p);
    render(<GraphEditorShell />);
    expect(screen.getByText('sc')).toBeInTheDocument();
    expect(screen.getByText(/inspector/i)).toBeInTheDocument();
  });

  it('renders an empty state when no pattern is loaded', () => {
    render(<GraphEditorShell />);
    expect(screen.getByText(/load or create a pattern/i)).toBeInTheDocument();
  });
});
