import { describe, expect, it } from 'vitest';
import { myersDiff } from './myers-diff';

describe('myersDiff', () => {
  it('preserves duplicate lines while identifying the shortest insertion and removal script', () => {
    expect(myersDiff('a\nrepeat\nrepeat\nc', 'a\nrepeat\nnew\nrepeat')).toEqual([
      { type: 'same', value: 'a' },
      { type: 'same', value: 'repeat' },
      { type: 'added', value: 'new' },
      { type: 'same', value: 'repeat' },
      { type: 'removed', value: 'c' },
    ]);
  });
});
