import { describe, expect, it } from 'vitest';
import { validationStatus } from './validation-status.js';

describe('validation evidence status', () => {
  it('uses the final explicit exit code instead of an earlier passed token', () => {
    expect(validationStatus('12 passed\nTest failed\nexit code: 1')).toBe('failed');
    expect(validationStatus('warning: previous failure\nexit code: 0')).toBe('passed');
  });

  it('falls back conservatively when an exit code is absent', () => {
    expect(validationStatus('7 passed')).toBe('passed');
    expect(validationStatus('Test failed')).toBe('failed');
    expect(validationStatus('command output only')).toBe('not-run');
  });
});
