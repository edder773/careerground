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
      'auth_sessions',
      'auth_identities',
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
         'scheduler_leases', 'auth_identities', 'auth_sessions'
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
        'auth_identities',
        'auth_sessions',
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

  it('reconstructs an empty personal notes schema when a legacy runtime database omitted it', async () => {
    await run(db, 'DROP TABLE note_revisions');
    await run(db, 'DROP TABLE notes');

    await ensureRuntimeSchema(db);

    const tables = await all<{ name: string }>(
      db,
      `SELECT name FROM sqlite_schema
       WHERE type = 'table' AND name IN ('notes', 'note_revisions')`,
    );
    const indexes = await all<{ name: string }>(
      db,
      `SELECT name FROM sqlite_schema
       WHERE type = 'index' AND name IN (
         'idx_notes_user_updated', 'idx_note_revisions_note_revision'
       )`,
    );
    expect(tables.map((table) => table.name).sort()).toEqual(['note_revisions', 'notes']);
    expect(indexes.map((index) => index.name).sort()).toEqual([
      'idx_note_revisions_note_revision',
      'idx_notes_user_updated',
    ]);
  });
});

describe('Sites production migration baseline', () => {
  it('applies 0016-0017, purges personal test data, and preserves common catalogs', async () => {
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
      copyFileSync(
        join('drizzle', '0017_google_auth.sql'),
        join(forwardDirectory, '0017_google_auth.sql'),
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
        authTables: number;
        legacyIdentityColumns: number;
        users: number;
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
                (SELECT COUNT(*) FROM sqlite_schema
                  WHERE type = 'table' AND name IN ('auth_identities', 'auth_sessions')) AS authTables,
                (SELECT COUNT(*) FROM pragma_table_info('users')
                  WHERE name = 'site_user_id') AS legacyIdentityColumns,
                (SELECT COUNT(*) FROM users) AS users,
                (SELECT checksum FROM app_schema_migrations
                  WHERE version = '0017_google_auth') AS checksum`,
      );

      expect(schema).toEqual({
        questions: countBefore?.count,
        learningColumns: 2,
        publishedColumn: 1,
        notificationIndex: 1,
        authTables: 2,
        legacyIdentityColumns: 0,
        users: 0,
        checksum: 'sha256:afec76f25cfd954b51857912fa78d1b29d7daff92497ab095e559e7aa2abaf60',
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
  });
});
