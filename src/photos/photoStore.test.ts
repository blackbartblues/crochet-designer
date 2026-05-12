import { describe, it, expect, beforeEach } from 'vitest';
import { usePhotoStore } from './photoStore';

const samplePhoto = {
  id: 'p-1',
  storage: { kind: 'inline' as const, base64: 'XYZ', mime: 'image/jpeg' },
  width: 100,
  height: 100,
  bytes: 1024,
};

describe('photoStore', () => {
  beforeEach(() => {
    usePhotoStore.getState().reset();
  });

  it('starts empty', () => {
    expect(usePhotoStore.getState().photos).toEqual([]);
  });

  it('addPhoto appends', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    expect(usePhotoStore.getState().photos).toHaveLength(1);
  });

  it('removePhoto filters by id', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    usePhotoStore.getState().removePhoto('p-1');
    expect(usePhotoStore.getState().photos).toEqual([]);
  });

  it('getPhoto returns by id', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    expect(usePhotoStore.getState().getPhoto('p-1')).toEqual(samplePhoto);
    expect(usePhotoStore.getState().getPhoto('nope')).toBeUndefined();
  });

  it('reset clears the store', () => {
    usePhotoStore.getState().addPhoto(samplePhoto);
    usePhotoStore.getState().reset();
    expect(usePhotoStore.getState().photos).toEqual([]);
  });
});
