import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { run } from './d1.js';
import { LocalD1 } from './local-d1.js';
import {
  ensureRuntimeSchema,
  EXPECTED_SCHEMA_VERSION,
  inspectRuntimeSchema,
} from './runtime-schema.js';

describe('active D1 runtime schema', () => {
  let db: LocalD1;

  beforeEach(() => {
    db = new LocalD1();
  });

  afterEach(() => db.close());

  it('accepts the current active catalog and automation schema', async () => {
    const state = await inspectRuntimeSchema(db);
    expect(state).toEqual({
      ready: true,
      expectedVersion: EXPECTED_SCHEMA_VERSION,
      appliedVersion: EXPECTED_SCHEMA_VERSION,
      requiredTableCount: 15,
      requiredIndexCount: 4,
    });
    await expect(ensureRuntimeSchema(db)).resolves.toMatchObject({ ready: true });
  });

  it('does not depend on retired auth, learning or collection tables', async () => {
    for (const table of [
      'auth_sessions',
      'auth_identities',
      'learning_question_attempts',
      'learning_review_events',
      'learning_progress',
      'learning_questions',
      'flashcards',
      'learning_units',
      'learning_sources',
      'collection_items',
      'collections',
      'notifications',
      'solution_comments',
      'solution_reactions',
      'solution_revisions',
      'solutions',
    ]) {
      await run(db, `DROP TABLE IF EXISTS ${table}`);
    }

    await expect(inspectRuntimeSchema(db)).resolves.toMatchObject({ ready: true });
  });

  it('rejects a missing active table or index', async () => {
    await run(db, 'DROP TABLE slack_digest_items');
    await expect(inspectRuntimeSchema(db)).resolves.toMatchObject({
      ready: false,
      requiredTableCount: 14,
    });

    db.close();
    db = new LocalD1();
    await run(db, 'DROP INDEX idx_coding_problems_track_level_position');
    await expect(inspectRuntimeSchema(db)).resolves.toMatchObject({
      ready: false,
      requiredIndexCount: 3,
    });
  });

  it('rejects an invalid migration ledger without mutating data', async () => {
    const countBefore = await db.prepare('SELECT COUNT(*) AS count FROM jobs').first();
    await run(db, 'DELETE FROM app_schema_migrations WHERE version = ?', EXPECTED_SCHEMA_VERSION);

    await expect(inspectRuntimeSchema(db)).resolves.toMatchObject({
      ready: false,
      appliedVersion: null,
    });
    const countAfter = await db.prepare('SELECT COUNT(*) AS count FROM jobs').first();
    expect(countAfter).toEqual(countBefore);
  });
});
