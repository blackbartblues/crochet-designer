import { afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from './i18n';

beforeAll(async () => {
  // Force Polish in tests so assertions on translated strings are deterministic.
  await i18n.changeLanguage('pl');
});

afterEach(() => {
  cleanup();
});
