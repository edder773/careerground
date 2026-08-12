import { describe, expect, it } from 'vitest';
import { collectionDepth, wouldCreateCollectionCycle } from './collection-domain.js';

describe('collection tree policies', () => {
  const parents = new Map<string, string | null>([
    ['root', null],
    ['child', 'root'],
    ['grandchild', 'child'],
  ]);

  it('prevents moving a collection under its descendant', () => {
    expect(wouldCreateCollectionCycle('root', 'grandchild', parents)).toBe(true);
  });

  it('calculates nesting depth for the two-level UI policy', () => {
    expect(collectionDepth('child', parents)).toBe(2);
    expect(collectionDepth('root', parents)).toBe(1);
  });
});
