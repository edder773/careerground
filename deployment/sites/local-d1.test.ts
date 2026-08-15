import { afterEach, describe, expect, it } from 'vitest';
import { LocalD1 } from './local-d1.js';

describe('LocalD1', () => {
  let db: LocalD1 | undefined;

  afterEach(() => db?.close());

  it('serializes concurrent batches on a shared database connection', async () => {
    db = new LocalD1();

    const [first, second] = await Promise.all([
      db.batch<{ value: number }>([db.prepare('SELECT 1 AS value')]),
      db.batch<{ value: number }>([db.prepare('SELECT 2 AS value')]),
    ]);

    expect(first[0]?.results).toEqual([{ value: 1 }]);
    expect(second[0]?.results).toEqual([{ value: 2 }]);
  });
});
