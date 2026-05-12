import { create } from 'zustand';
import { produce } from 'immer';
import type { PdfDocument, PdfDocumentMeta, Section, SectionId } from '../pdf/document/types';

interface PdfDocumentState {
  document: PdfDocument | null;
  selectedSectionId: SectionId | null;
  setDocument(d: PdfDocument | null): void;
  addSection(s: Section): void;
  removeSection(id: SectionId): void;
  updateSection(s: Section): void;
  moveSection(id: SectionId, toIndex: number): void;
  selectSection(id: SectionId | null): void;
  updateMeta(patch: Partial<PdfDocumentMeta>): void;
  reset(): void;
}

export const usePdfDocumentStore = create<PdfDocumentState>((set) => ({
  document: null,
  selectedSectionId: null,

  setDocument(d) {
    set({ document: d, selectedSectionId: d?.sections[0]?.id ?? null });
  },

  addSection(s) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        draft.document.sections.push(s);
        draft.selectedSectionId = s.id;
      }),
    );
  },

  removeSection(id) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        draft.document.sections = draft.document.sections.filter((s) => s.id !== id);
        if (draft.selectedSectionId === id) draft.selectedSectionId = null;
      }),
    );
  },

  updateSection(s) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        const idx = draft.document.sections.findIndex((x) => x.id === s.id);
        if (idx >= 0) draft.document.sections[idx] = s;
      }),
    );
  },

  moveSection(id, toIndex) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        const from = draft.document.sections.findIndex((s) => s.id === id);
        if (from < 0 || toIndex < 0 || toIndex >= draft.document.sections.length) return;
        const [removed] = draft.document.sections.splice(from, 1);
        if (removed) draft.document.sections.splice(toIndex, 0, removed);
      }),
    );
  },

  selectSection(id) {
    set({ selectedSectionId: id });
  },

  updateMeta(patch) {
    set((st) =>
      produce(st, (draft) => {
        if (!draft.document) return;
        Object.assign(draft.document.meta, patch);
      }),
    );
  },

  reset() {
    set({ document: null, selectedSectionId: null });
  },
}));
