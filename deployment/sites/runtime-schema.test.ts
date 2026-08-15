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
    await run(db, "DELETE FROM app_schema_migrations WHERE version = '0018_sloppy_leech'");
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

    const removedNotes = await first<{ tables: number; items: number; constraints: number }>(
      db,
      `SELECT
         (SELECT COUNT(*) FROM sqlite_schema
           WHERE type = 'table' AND name IN ('notes', 'note_revisions')) AS tables,
         (SELECT COUNT(*) FROM collection_items WHERE item_type = 'NOTE') AS items,
         (SELECT COUNT(*) FROM sqlite_schema
           WHERE type = 'table' AND name = 'collection_items' AND sql LIKE '%''NOTE''%') AS constraints`,
    );
    expect(removedNotes).toEqual({ tables: 0, items: 0, constraints: 0 });

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
  it('applies the packaged forward migrations after the existing 0016 schema without replaying history', async () => {
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
      for (const migration of migrations.filter((file) => Number(file.slice(0, 4)) < 17)) {
        copyFileSync(join('drizzle', migration), join(baselineDirectory, migration));
      }
      copyFileSync(
        join('drizzle', '0017_marvelous_blockbuster.sql'),
        join(forwardDirectory, '0017_marvelous_blockbuster.sql'),
      );
      copyFileSync(
        join('drizzle', '0018_sloppy_leech.sql'),
        join(forwardDirectory, '0018_sloppy_leech.sql'),
      );

      const baseline = new LocalD1(databasePath, baselineDirectory);
      await run(
        baseline,
        `INSERT INTO users
          (id, site_user_id, email, display_name, role, is_active, preferred_language,
           ranking_opt_in, comment_notifications, deadline_notifications, review_notifications,
           created_at, updated_at)
         VALUES ('note-owner', 'note-owner', 'note-owner@example.test', 'Note Owner',
                 'MEMBER', 1, 'javascript', 1, 1, 1, 1, '2026-08-15', '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO collections
          (id, user_id, name, icon, color, position, created_at, updated_at)
         VALUES ('note-folder', 'note-owner', '기존 노트 폴더', 'folder', 'amber', 0,
                 '2026-08-15', '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO notes
          (id, user_id, title, markdown, visibility, current_rev, created_at, updated_at)
         VALUES ('note-to-delete', 'note-owner', '삭제 대상', '백업하지 않을 원문',
                 'PRIVATE', 1, '2026-08-15', '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO note_revisions (id, note_id, revision, markdown, created_at)
         VALUES ('note-revision-to-delete', 'note-to-delete', 1, '백업하지 않을 원문',
                 '2026-08-15')`,
      );
      await run(
        baseline,
        `INSERT INTO collection_items
          (id, collection_id, item_type, target_id, label, position, created_at)
         VALUES ('note-item-to-delete', 'note-folder', 'NOTE', 'note-to-delete', '삭제 대상', 0,
                 '2026-08-15')`,
      );
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
        feedIndex: number;
        categoryIndex: number;
        removedNoteTables: number;
        noteItems: number;
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
                (SELECT COUNT(*) FROM pragma_index_list('jobs')
                  WHERE name = 'idx_jobs_feed_collected_id') AS feedIndex,
                (SELECT COUNT(*) FROM pragma_index_list('jobs')
                  WHERE name = 'idx_jobs_active_category') AS categoryIndex,
                (SELECT COUNT(*) FROM sqlite_schema
                  WHERE type = 'table' AND name IN ('notes', 'note_revisions')) AS removedNoteTables,
                (SELECT COUNT(*) FROM collection_items WHERE item_type = 'NOTE') AS noteItems,
                (SELECT checksum FROM app_schema_migrations
                  WHERE version = '0018_sloppy_leech') AS checksum`,
      );

      expect(schema).toEqual({
        questions: countBefore?.count,
        learningColumns: 2,
        publishedColumn: 1,
        notificationIndex: 1,
        feedIndex: 1,
        categoryIndex: 1,
        removedNoteTables: 0,
        noteItems: 0,
        checksum: 'sha256:86c1de85559a9b51e959bf7c423ad8a9e9afd3586ad672c2ec32da009057fe4b',
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
