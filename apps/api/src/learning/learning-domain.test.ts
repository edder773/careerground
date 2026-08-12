import { describe, expect, it } from 'vitest';
import { dueAtFrom, nextReview } from './learning-domain.js';

describe('spaced repetition', () => {
  it('resets a failed review to one day', () => {
    expect(nextReview({ repetitionCount: 4, intervalDays: 20 }, 2)).toEqual({
      repetitionCount: 0,
      intervalDays: 1,
    });
  });

  it('grows intervals only after successful recall', () => {
    expect(nextReview({ repetitionCount: 0, intervalDays: 1 }, 4)).toEqual({
      repetitionCount: 1,
      intervalDays: 1,
    });
    expect(nextReview({ repetitionCount: 1, intervalDays: 1 }, 4)).toEqual({
      repetitionCount: 2,
      intervalDays: 3,
    });
    expect(dueAtFrom(new Date('2026-08-12T00:00:00Z'), 3).toISOString()).toBe(
      '2026-08-15T00:00:00.000Z',
    );
  });
});
