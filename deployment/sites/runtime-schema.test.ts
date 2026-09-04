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
      requiredTableCount: 16,
      requiredIndexCount: 5,
    });
    await expect(ensureRuntimeSchema(db)).resolves.toMatchObject({ ready: true });
  });

  it('removes every retired product table and search index', async () => {
    const retired = await db
      .prepare(
        `SELECT name FROM sqlite_schema
          WHERE type IN ('table', 'trigger')
            AND (name IN (
              'users', 'auth_sessions', 'auth_identities', 'collections', 'collection_items',
              'problem_progress', 'daily_challenge_participations', 'solutions',
              'solution_revisions', 'solution_reactions', 'solution_comments', 'saved_jobs',
              'learning_sources', 'learning_units', 'flashcards', 'learning_questions',
              'learning_progress', 'learning_review_events', 'learning_question_attempts',
              'notifications', 'request_rate_limits', 'audit_logs', 'import_previews',
              'job_source_snapshots', 'job_source_snapshot_items', 'scheduler_leases'
            ) OR name LIKE 'workspace_search%' OR name LIKE '%_search_%')`,
      )
      .all<{ name: string }>();

    expect(retired.results).toEqual([]);
    await expect(inspectRuntimeSchema(db)).resolves.toMatchObject({ ready: true });
  });

  it('rejects a missing active table or index', async () => {
    await run(db, 'DROP TABLE slack_digest_items');
    await expect(inspectRuntimeSchema(db)).resolves.toMatchObject({
      ready: false,
      requiredTableCount: 15,
    });

    db.close();
    db = new LocalD1();
    await run(db, 'DROP INDEX idx_coding_problems_track_level_position');
    await expect(inspectRuntimeSchema(db)).resolves.toMatchObject({
      ready: false,
      requiredIndexCount: 4,
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
