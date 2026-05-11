import { describe, it, expectTypeOf } from 'vitest';
import type {
  Stitch,
  Edge,
  AnchorTarget,
  Pattern,
  BuiltinStitchType,
  StitchTypeRef,
} from './types';

describe('graph/types', () => {
  it('exports a Pattern v3 with the expected shape', () => {
    expectTypeOf<Pattern['schemaVersion']>().toEqualTypeOf<3>();
    expectTypeOf<Pattern['shape']>().toEqualTypeOf<
      'rectangular' | 'radial' | 'freeform'
    >();
    expectTypeOf<Pattern['stitches']>().toEqualTypeOf<Stitch[]>();
    expectTypeOf<Pattern['edges']>().toEqualTypeOf<Edge[]>();
  });

  it('Edge is a discriminated union with three kinds', () => {
    type Kinds = Edge['kind'];
    expectTypeOf<Kinds>().toEqualTypeOf<'anchor' | 'yarn_flow' | 'join'>();
  });

  it('AnchorTarget has the four kinds defined in the spec', () => {
    type T = AnchorTarget['kind'];
    expectTypeOf<T>().toEqualTypeOf<
      'stitch' | 'chain_space' | 'magic_ring' | 'turning_chain'
    >();
  });

  it('BuiltinStitchType covers crochet primitives + meta types', () => {
    type B = BuiltinStitchType;
    expectTypeOf<B>().toEqualTypeOf<
      | 'ch'
      | 'sl_st'
      | 'sc'
      | 'hdc'
      | 'dc'
      | 'tr'
      | 'gr_st'
      | 'magic_ring'
      | 'fasten_off'
    >();
  });

  it('StitchTypeRef discriminates builtin and custom', () => {
    type T = StitchTypeRef['kind'];
    expectTypeOf<T>().toEqualTypeOf<'builtin' | 'custom'>();
  });
});
