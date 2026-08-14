import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { all, first, run } from './d1.js';
import { LocalD1 } from './local-d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

describe('Sites runtime schema', () => {
  let db: LocalD1;

  beforeEach(async () => {
    db = new LocalD1();
    await run(db, 'DROP TABLE workspace_search');
    for (const table of [
      'job_source_snapshot_items',
      'job_source_snapshots',
      'job_tech_stacks',
      'learning_question_attempts',
      'learning_review_events',
      'scheduler_leases',
    ]) {
      await run(db, `DROP TABLE ${table}`);
    }
    await run(db, 'DROP TABLE learning_progress');
    await run(
      db,
      `CREATE TABLE learning_progress (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        unit_id text NOT NULL,
        completed integer DEFAULT 0 NOT NULL,
        understanding integer,
        last_studied_at text,
        next_review_at text,
        repetition_count integer DEFAULT 0 NOT NULL,
        interval_days integer DEFAULT 1 NOT NULL,
        updated_at text NOT NULL
      )`,
    );
  });

  afterEach(() => db.close());

  it('upgrades the legacy production shape and backfills searchable shared data idempotently', async () => {
    await ensureRuntimeSchema(db);
    const tables = await all<{ name: string }>(
      db,
      `SELECT name FROM sqlite_schema
       WHERE type IN ('table', 'view') AND name IN (
         'workspace_search', 'job_source_snapshot_items', 'job_source_snapshots',
         'job_tech_stacks', 'learning_question_attempts', 'learning_review_events',
         'scheduler_leases'
       )`,
    );
    expect(new Set(tables.map((table) => table.name))).toEqual(
      new Set([
        'workspace_search',
        'job_source_snapshot_items',
        'job_source_snapshots',
        'job_tech_stacks',
        'learning_question_attempts',
        'learning_review_events',
        'scheduler_leases',
      ]),
    );

    const progressColumns = await all<{ name: string }>(db, 'PRAGMA table_info(learning_progress)');
    expect(progressColumns.map((column) => column.name)).toEqual(
      expect.arrayContaining(['review_version', 'completed_at', 'mastered_at']),
    );

    const searchCountBefore = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM workspace_search',
    );
    expect(Number(searchCountBefore?.count)).toBeGreaterThan(0);
    const backendResults = await all<{ kind: string }>(
      db,
      `SELECT kind FROM workspace_search WHERE workspace_search MATCH '"백엔드"*'`,
    );
    expect(backendResults.some((result) => result.kind === 'jobs')).toBe(true);

    await ensureRuntimeSchema(db);
    const searchCountAfter = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM workspace_search',
    );
    expect(searchCountAfter?.count).toBe(searchCountBefore?.count);
  });
});
