import { describe, it, expect } from 'vitest';
import { TitlePage } from './TitlePage';
import { ThanksPage } from './ThanksPage';
import { InformationPage } from './InformationPage';

describe('PDF pages', () => {
  it('TitlePage is a function component', () => {
    expect(typeof TitlePage).toBe('function');
  });
  it('ThanksPage is a function component', () => {
    expect(typeof ThanksPage).toBe('function');
  });
  it('InformationPage is a function component', () => {
    expect(typeof InformationPage).toBe('function');
  });
});
