import { describe, it, expect } from 'vitest';
import { PdfPreviewView } from './PdfPreviewView';

describe('PdfPreviewView', () => {
  it('exports a function component', () => {
    expect(typeof PdfPreviewView).toBe('function');
  });
});
