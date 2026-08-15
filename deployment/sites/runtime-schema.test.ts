import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

describe('Sites production migration baseline', () => {
  it('applies the packaged 0016 migration after the existing 0015 schema without replaying history', async () => {
    const root = mkdtempSync(join(tmpdir(), 'careerground-sites-migration-'));
    const baselineDirectory = join(root, 'baseline');
    const forwardDirectory = join(root, 'forward');
    const databasePath = join(root, 'production-baseline.sqlite');
    mkdirSync(baselineDirectory);
    mkdirSync(forwardDirectory);

    try {
      const migrations = readdirSync('drizzle')
        .filter((file) => /^\d{4}_.+\.sql$/.test(file))
        .sort();
      for (const migration of migrations.filter((file) => Number(file.slice(0, 4)) < 16)) {
        copyFileSync(join('drizzle', migration), join(baselineDirectory, migration));
      }
      copyFileSync(
        join('drizzle', '0016_full_audit_hardening.sql'),
        join(forwardDirectory, '0016_full_audit_hardening.sql'),
      );

      const baseline = new LocalD1(databasePath, baselineDirectory);
      const countBefore = await first<{ count: number }>(
        baseline,
        'SELECT COUNT(*) AS count FROM learning_questions',
      );
      baseline.close();

      const upgraded = new LocalD1(databasePath, forwardDirectory);
      const schema = await first<{
        questions: number;
        learningColumns: number;
        publishedColumn: number;
        notificationIndex: number;
        checksum: string;
      }>(
        upgraded,
        `SELECT (SELECT COUNT(*) FROM learning_questions) AS questions,
                (SELECT COUNT(*) FROM pragma_table_info('learning_questions')
                  WHERE name IN ('type', 'choices')) AS learningColumns,
                (SELECT COUNT(*) FROM pragma_table_info('jobs')
                  WHERE name = 'published_at') AS publishedColumn,
                (SELECT COUNT(*) FROM pragma_index_list('notifications')
                  WHERE name = 'idx_notifications_user_read_expiry_created') AS notificationIndex,
                (SELECT checksum FROM app_schema_migrations
                  WHERE version = '0016_full_audit_hardening') AS checksum`,
      );

      expect(schema).toEqual({
        questions: countBefore?.count,
        learningColumns: 2,
        publishedColumn: 1,
        notificationIndex: 1,
        checksum: 'sha256:69fa089214693f323703a327d853996d67129c136f80b8997cfc79a4a43b797d',
      });
      await expect(
        run(
          upgraded,
          `INSERT INTO learning_questions
             (id, unit_id, prompt, answer, type, choices, created_at)
           SELECT 'invalid-type', id, 'prompt', 'answer', 'INVALID', '[]', created_at
             FROM learning_units LIMIT 1`,
        ),
      ).rejects.toThrow(/CHECK constraint failed/);
      upgraded.close();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 15_000);
});
