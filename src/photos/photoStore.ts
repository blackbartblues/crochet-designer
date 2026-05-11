import { create } from 'zustand';
import type { Photo, PhotoId } from '../domain/graph/types';

interface PhotoStore {
  photos: Photo[];
  addPhoto(photo: Photo): void;
  removePhoto(id: PhotoId): void;
  getPhoto(id: PhotoId): Photo | undefined;
  reset(): void;
}

export const usePhotoStore = create<PhotoStore>((set, get) => ({
  photos: [],

  addPhoto(photo) {
    set((s) => ({ photos: [...s.photos, photo] }));
  },

  removePhoto(id) {
    set((s) => ({ photos: s.photos.filter((p) => p.id !== id) }));
  },

  getPhoto(id) {
    return get().photos.find((p) => p.id === id);
  },

  reset() {
    set({ photos: [] });
  },
}));
