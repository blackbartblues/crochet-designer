import { describe, it, expect, beforeEach } from 'vitest';
import { usePdfDocumentStore } from './pdfDocumentStore';
import { emptyPdfDocument, newSection } from '../pdf/document/build';

describe('pdfDocumentStore', () => {
  beforeEach(() => {
    usePdfDocumentStore.getState().reset();
  });

  it('starts with no document', () => {
    expect(usePdfDocumentStore.getState().document).toBeNull();
  });

  it('setDocument stores a document', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    expect(usePdfDocumentStore.getState().document?.schemaVersion).toBe(1);
  });

  it('addSection appends a new section', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const initialCount = d.sections.length;
    usePdfDocumentStore.getState().addSection(newSection('text'));
    expect(usePdfDocumentStore.getState().document!.sections).toHaveLength(initialCount + 1);
  });

  it('removeSection filters by id', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const idToRemove = d.sections[0]!.id;
    usePdfDocumentStore.getState().removeSection(idToRemove);
    const after = usePdfDocumentStore.getState().document!;
    expect(after.sections.find((s) => s.id === idToRemove)).toBeUndefined();
  });

  it('updateSection replaces the section by id', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const text = newSection('text');
    usePdfDocumentStore.getState().addSection(text);
    if (text.kind !== 'text') throw new Error();
    usePdfDocumentStore.getState().updateSection({ ...text, body: 'hello' });
    const after = usePdfDocumentStore.getState().document!.sections.find((s) => s.id === text.id);
    expect(after?.kind).toBe('text');
    if (after?.kind === 'text') expect(after.body).toBe('hello');
  });

  it('moveSection swaps positions', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    const firstId = d.sections[0]!.id;
    const secondId = d.sections[1]!.id;
    usePdfDocumentStore.getState().moveSection(firstId, 1);
    const after = usePdfDocumentStore.getState().document!.sections;
    expect(after[0]!.id).toBe(secondId);
    expect(after[1]!.id).toBe(firstId);
  });

  it('selectSection updates selectedSectionId', () => {
    usePdfDocumentStore.getState().selectSection('s-1');
    expect(usePdfDocumentStore.getState().selectedSectionId).toBe('s-1');
  });

  it('updateMeta merges metadata', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    usePdfDocumentStore.getState().updateMeta({ author: 'Mama' });
    expect(usePdfDocumentStore.getState().document!.meta.author).toBe('Mama');
  });

  it('reset clears the store', () => {
    const d = emptyPdfDocument({ title: { pl: 'X', en: 'X' }, author: 'a' });
    usePdfDocumentStore.getState().setDocument(d);
    usePdfDocumentStore.getState().reset();
    expect(usePdfDocumentStore.getState().document).toBeNull();
  });
});
