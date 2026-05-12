import { describe, it, expect } from 'vitest';
import { TitleSectionEditor } from './TitleSectionEditor';
import { ThanksSectionEditor } from './ThanksSectionEditor';
import { InformationSectionEditor } from './InformationSectionEditor';

describe('simple editors', () => {
  it('export function components', () => {
    expect(typeof TitleSectionEditor).toBe('function');
    expect(typeof ThanksSectionEditor).toBe('function');
    expect(typeof InformationSectionEditor).toBe('function');
  });
});
