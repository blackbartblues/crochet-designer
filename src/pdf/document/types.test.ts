import { describe, it, expectTypeOf } from 'vitest';
import type {
  PdfDocument,
  SectionKind,
  TitleSection,
  PatternSection,
} from './types';

describe('PdfDocument types', () => {
  it('PdfDocument has schemaVersion 1', () => {
    expectTypeOf<PdfDocument['schemaVersion']>().toEqualTypeOf<1>();
  });

  it('Section is a tagged union with the expected kinds', () => {
    type K = SectionKind;
    expectTypeOf<K>().toEqualTypeOf<
      'title' | 'thanks' | 'information' | 'pattern' | 'photos' | 'special' | 'text' | 'pagebreak'
    >();
  });

  it('TitleSection carries the expected data', () => {
    expectTypeOf<TitleSection['kind']>().toEqualTypeOf<'title'>();
    expectTypeOf<TitleSection['title']>().toEqualTypeOf<{ pl: string; en: string } | undefined>();
  });

  it('PatternSection embeds a Pattern', () => {
    expectTypeOf<PatternSection['kind']>().toEqualTypeOf<'pattern'>();
    expectTypeOf<PatternSection['pattern']>().not.toBeUndefined();
  });
});
