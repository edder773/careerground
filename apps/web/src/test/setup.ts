import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

function ensureLocalStorage() {
  try {
    window.localStorage.setItem('__cg_storage_probe__', '1');
    window.localStorage.removeItem('__cg_storage_probe__');
    return;
  } catch {
    const values = new Map<string, string>();
    const storage: Storage = {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, String(value)),
    };
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
    Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  }
}

ensureLocalStorage();
beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());
