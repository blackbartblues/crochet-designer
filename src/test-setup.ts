import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from './i18n';

beforeAll(async () => {
  // Mock ResizeObserver for ReactFlow and other components that use it.
  class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  (globalThis as any).ResizeObserver = MockResizeObserver;

  // Force Polish in tests so assertions on translated strings are deterministic.
  await i18n.changeLanguage('pl');
});

afterEach(() => {
  cleanup();
});
