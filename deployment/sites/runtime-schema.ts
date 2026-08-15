import { all, first, run, type D1Database } from './d1.js';

const schemaPromises = new WeakMap<D1Database, Promise<void>>();
export const EXPECTED_SCHEMA_VERSION = '0017_marvelous_blockbuster';
export const EXPECTED_SCHEMA_CHECKSUM =
  'sha256:e2d828e1a606fe4991fdbbf71441265333188ecb79107f1ba7ce2fe44896ab32';

const ledgerSchema = `CREATE TABLE IF NOT EXISTS app_schema_migrations (
  version text PRIMARY KEY NOT NULL,
  checksum text NOT NULL,
  applied_at text NOT NULL
)`;

const additiveSchema = [
  `CREATE TABLE IF NOT EXISTS job_source_snapshots (
    id text PRIMARY KEY NOT NULL,
    source_name text NOT NULL,
    collected_at text NOT NULL,
    observed_count integer NOT NULL,
    expired_count integer DEFAULT 0 NOT NULL,
    import_batch_id text NOT NULL,
    created_at text NOT NULL,
    FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE CASCADE,
    CHECK(observed_count >= 0 AND expired_count >= 0)
  )`,
  `CREATE TABLE IF NOT EXISTS job_source_snapshot_items (
    snapshot_id text NOT NULL,
    job_id text NOT NULL,
    FOREIGN KEY (snapshot_id) REFERENCES job_source_snapshots(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS job_tech_stacks (
    job_id text NOT NULL,
    name text NOT NULL,
    created_at text NOT NULL,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CHECK(length(trim(name)) BETWEEN 1 AND 50)
  )`,
  `CREATE TABLE IF NOT EXISTS learning_question_attempts (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    question_id text NOT NULL,
    response text NOT NULL,
    correct integer NOT NULL,
    attempted_at text NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES learning_questions(id) ON DELETE CASCADE,
    CHECK(correct IN (0, 1))
  )`,
  `CREATE TABLE IF NOT EXISTS learning_review_events (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    unit_id text NOT NULL,
    sequence integer NOT NULL,
    rating integer NOT NULL,
    previous_interval_days integer NOT NULL,
    next_interval_days integer NOT NULL,
    next_review_at text NOT NULL,
    reviewed_at text NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES learning_units(id) ON DELETE CASCADE,
    CHECK(rating BETWEEN 1 AND 5),
    CHECK(previous_interval_days >= 1 AND next_interval_days >= 1)
  )`,
  `CREATE TABLE IF NOT EXISTS scheduler_leases (
    name text PRIMARY KEY NOT NULL,
    owner_id text NOT NULL,
    lease_until text NOT NULL,
    updated_at text NOT NULL
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_job_source_snapshots_batch_source ON job_source_snapshots(import_batch_id, source_name)',
  'CREATE INDEX IF NOT EXISTS idx_job_source_snapshots_source_collected ON job_source_snapshots(source_name, collected_at)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_job_source_snapshot_items_unique ON job_source_snapshot_items(snapshot_id, job_id)',
  'CREATE INDEX IF NOT EXISTS idx_job_source_snapshot_items_job ON job_source_snapshot_items(job_id)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_job_tech_stacks_job_name ON job_tech_stacks(job_id, name)',
  'CREATE INDEX IF NOT EXISTS idx_job_tech_stacks_name_job ON job_tech_stacks(name, job_id)',
  'CREATE INDEX IF NOT EXISTS idx_learning_question_attempts_user_question ON learning_question_attempts(user_id, question_id, attempted_at)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_review_events_sequence ON learning_review_events(user_id, unit_id, sequence)',
  'CREATE INDEX IF NOT EXISTS idx_learning_review_events_user_reviewed ON learning_review_events(user_id, reviewed_at)',
  'CREATE INDEX IF NOT EXISTS idx_notifications_user_read_expiry_created ON notifications(user_id, read_at, expires_at, created_at)',
] as const;

const searchTriggers = [
  `CREATE TRIGGER IF NOT EXISTS trg_collections_search_insert AFTER INSERT ON collections WHEN NEW.deleted_at IS NULL BEGIN
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    VALUES ('folders', NEW.id, NEW.user_id, NEW.name, '');
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_collections_search_update AFTER UPDATE ON collections BEGIN
    DELETE FROM workspace_search WHERE kind = 'folders' AND entity_id = OLD.id;
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    SELECT 'folders', NEW.id, NEW.user_id, NEW.name, '' WHERE NEW.deleted_at IS NULL;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_collections_search_delete AFTER DELETE ON collections BEGIN
    DELETE FROM workspace_search WHERE kind = 'folders' AND entity_id = OLD.id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_jobs_search_insert AFTER INSERT ON jobs BEGIN
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    SELECT 'jobs', NEW.id, '', NEW.company_name || ' ' || NEW.title,
           NEW.category || ' ' || NEW.region || ' ' || NEW.summary || ' ' || NEW.tech_stack
    WHERE NEW.status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
    INSERT OR IGNORE INTO job_tech_stacks(job_id, name, created_at)
    SELECT NEW.id, trim(CAST(value AS text)), NEW.updated_at FROM json_each(NEW.tech_stack)
    WHERE json_valid(NEW.tech_stack) AND length(trim(CAST(value AS text))) BETWEEN 1 AND 50;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_jobs_search_update AFTER UPDATE ON jobs BEGIN
    DELETE FROM workspace_search WHERE kind = 'jobs' AND entity_id = OLD.id;
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    SELECT 'jobs', NEW.id, '', NEW.company_name || ' ' || NEW.title,
           NEW.category || ' ' || NEW.region || ' ' || NEW.summary || ' ' || NEW.tech_stack
    WHERE NEW.status IN ('ACTIVE', 'DEADLINE_UNKNOWN');
    DELETE FROM job_tech_stacks WHERE job_id = NEW.id;
    INSERT OR IGNORE INTO job_tech_stacks(job_id, name, created_at)
    SELECT NEW.id, trim(CAST(value AS text)), NEW.updated_at FROM json_each(NEW.tech_stack)
    WHERE json_valid(NEW.tech_stack) AND length(trim(CAST(value AS text))) BETWEEN 1 AND 50;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_jobs_search_delete AFTER DELETE ON jobs BEGIN
    DELETE FROM workspace_search WHERE kind = 'jobs' AND entity_id = OLD.id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_problems_search_insert AFTER INSERT ON coding_problems WHEN NEW.active = 1 BEGIN
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    VALUES ('codingProblems', NEW.id, '', NEW.display_title, NEW.tags);
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_problems_search_update AFTER UPDATE ON coding_problems BEGIN
    DELETE FROM workspace_search WHERE kind = 'codingProblems' AND entity_id = OLD.id;
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    SELECT 'codingProblems', NEW.id, '', NEW.display_title, NEW.tags WHERE NEW.active = 1;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_problems_search_delete AFTER DELETE ON coding_problems BEGIN
    DELETE FROM workspace_search WHERE kind = 'codingProblems' AND entity_id = OLD.id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_solutions_search_insert AFTER INSERT ON solutions WHEN NEW.deleted_at IS NULL BEGIN
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    VALUES ('solutions', NEW.id, NEW.author_id, NEW.title, NEW.description || ' ' || NEW.lessons);
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_solutions_search_update AFTER UPDATE ON solutions BEGIN
    DELETE FROM workspace_search WHERE kind = 'solutions' AND entity_id = OLD.id;
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    SELECT 'solutions', NEW.id, NEW.author_id, NEW.title, NEW.description || ' ' || NEW.lessons
    WHERE NEW.deleted_at IS NULL;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_solutions_search_delete AFTER DELETE ON solutions BEGIN
    DELETE FROM workspace_search WHERE kind = 'solutions' AND entity_id = OLD.id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_learning_search_insert AFTER INSERT ON learning_units WHEN NEW.published = 1 BEGIN
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    SELECT 'learning', NEW.id, '', NEW.title, s.title || ' ' || NEW.summary || ' ' || NEW.concepts
    FROM learning_sources s WHERE s.id = NEW.source_id;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_learning_search_update AFTER UPDATE ON learning_units BEGIN
    DELETE FROM workspace_search WHERE kind = 'learning' AND entity_id = OLD.id;
    INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
    SELECT 'learning', NEW.id, '', NEW.title, s.title || ' ' || NEW.summary || ' ' || NEW.concepts
    FROM learning_sources s WHERE s.id = NEW.source_id AND NEW.published = 1;
  END`,
  `CREATE TRIGGER IF NOT EXISTS trg_learning_search_delete AFTER DELETE ON learning_units BEGIN
    DELETE FROM workspace_search WHERE kind = 'learning' AND entity_id = OLD.id;
  END`,
] as const;

const searchBackfill = [
  `INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
   SELECT 'folders', c.id, c.user_id, c.name, '' FROM collections c
   WHERE c.deleted_at IS NULL AND NOT EXISTS (
     SELECT 1 FROM workspace_search s WHERE s.kind = 'folders' AND s.entity_id = c.id
   )`,
  `INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
   SELECT 'jobs', j.id, '', j.company_name || ' ' || j.title,
          j.category || ' ' || j.region || ' ' || j.summary || ' ' || j.tech_stack
   FROM jobs j WHERE j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND NOT EXISTS (
     SELECT 1 FROM workspace_search s WHERE s.kind = 'jobs' AND s.entity_id = j.id
   )`,
  `INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
   SELECT 'codingProblems', p.id, '', p.display_title, p.tags FROM coding_problems p
   WHERE p.active = 1 AND NOT EXISTS (
     SELECT 1 FROM workspace_search s WHERE s.kind = 'codingProblems' AND s.entity_id = p.id
   )`,
  `INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
   SELECT 'solutions', so.id, so.author_id, so.title, so.description || ' ' || so.lessons
   FROM solutions so WHERE so.deleted_at IS NULL AND NOT EXISTS (
     SELECT 1 FROM workspace_search s WHERE s.kind = 'solutions' AND s.entity_id = so.id
   )`,
  `INSERT INTO workspace_search(kind, entity_id, owner_id, title, body)
   SELECT 'learning', u.id, '', u.title, s.title || ' ' || u.summary || ' ' || u.concepts
   FROM learning_units u JOIN learning_sources s ON s.id = u.source_id
   WHERE u.published = 1 AND NOT EXISTS (
     SELECT 1 FROM workspace_search ws WHERE ws.kind = 'learning' AND ws.entity_id = u.id
   )`,
  `INSERT OR IGNORE INTO job_tech_stacks(job_id, name, created_at)
   SELECT j.id, trim(CAST(value AS text)), j.updated_at FROM jobs j, json_each(j.tech_stack)
   WHERE json_valid(j.tech_stack) AND length(trim(CAST(value AS text))) BETWEEN 1 AND 50`,
] as const;

async function addLearningProgressColumns(db: D1Database) {
  const columns = await all<{ name: string }>(db, 'PRAGMA table_info(learning_progress)');
  const names = new Set(columns.map((column) => column.name));
  const missing = [
    [
      'review_version',
      'ALTER TABLE learning_progress ADD COLUMN review_version integer DEFAULT 0 NOT NULL',
    ],
    ['completed_at', 'ALTER TABLE learning_progress ADD COLUMN completed_at text'],
    ['mastered_at', 'ALTER TABLE learning_progress ADD COLUMN mastered_at text'],
  ] as const;
  for (const [name, sql] of missing) {
    if (names.has(name)) continue;
    try {
      await run(db, sql);
    } catch (error) {
      if (!String(error).toLowerCase().includes('duplicate column')) throw error;
    }
  }
}

async function addLearningQuestionColumns(db: D1Database) {
  const columns = await all<{ name: string }>(db, 'PRAGMA table_info(learning_questions)');
  const names = new Set(columns.map((column) => column.name));
  const missing = [
    ['type', "ALTER TABLE learning_questions ADD COLUMN type text DEFAULT 'SHORT_ANSWER' NOT NULL"],
    ['choices', "ALTER TABLE learning_questions ADD COLUMN choices text DEFAULT '[]' NOT NULL"],
  ] as const;
  for (const [name, sql] of missing) {
    if (names.has(name)) continue;
    try {
      await run(db, sql);
    } catch (error) {
      if (!String(error).toLowerCase().includes('duplicate column')) throw error;
    }
  }
}

async function addJobColumns(db: D1Database) {
  const columns = await all<{ name: string }>(db, 'PRAGMA table_info(jobs)');
  if (columns.some((column) => column.name === 'published_at')) return;
  try {
    await run(db, 'ALTER TABLE jobs ADD COLUMN published_at text');
  } catch (error) {
    if (!String(error).toLowerCase().includes('duplicate column')) throw error;
  }
}

export type RuntimeSchemaState = {
  ready: boolean;
  expectedVersion: string;
  appliedVersion: string | null;
  tableCount: number;
  triggerCount: number;
  progressColumnCount: number;
  questionColumnCount: number;
  jobColumnCount: number;
  removedNoteTableCount: number;
  removedNoteItemCount: number;
  removedNoteSearchCount: number;
  legacyNoteConstraintCount: number;
};

export async function inspectRuntimeSchema(db: D1Database): Promise<RuntimeSchemaState> {
  const state = await first<{
    tableCount: number;
    triggerCount: number;
    progressColumnCount: number;
    questionColumnCount: number;
    jobColumnCount: number;
    removedNoteTableCount: number;
    removedNoteItemCount: number;
    removedNoteSearchCount: number;
    legacyNoteConstraintCount: number;
  }>(
    db,
    `SELECT
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name IN (
           'app_schema_migrations', 'job_source_snapshot_items', 'job_source_snapshots',
           'job_tech_stacks', 'learning_question_attempts', 'learning_review_events',
           'scheduler_leases', 'workspace_search'
         )) AS tableCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'trigger' AND name GLOB 'trg_*_search_*') AS triggerCount,
       (SELECT COUNT(*) FROM pragma_table_info('learning_progress')
         WHERE name IN ('review_version', 'completed_at', 'mastered_at')) AS progressColumnCount,
       (SELECT COUNT(*) FROM pragma_table_info('learning_questions')
         WHERE name IN ('type', 'choices')) AS questionColumnCount,
       (SELECT COUNT(*) FROM pragma_table_info('jobs')
         WHERE name = 'published_at') AS jobColumnCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name IN ('notes', 'note_revisions')) AS removedNoteTableCount,
       (SELECT COUNT(*) FROM collection_items WHERE item_type = 'NOTE') AS removedNoteItemCount,
       (SELECT COUNT(*) FROM workspace_search WHERE kind = 'notes') AS removedNoteSearchCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name = 'collection_items' AND sql LIKE '%''NOTE''%')
         AS legacyNoteConstraintCount`,
  );
  const tableCount = Number(state?.tableCount || 0);
  const triggerCount = Number(state?.triggerCount || 0);
  const progressColumnCount = Number(state?.progressColumnCount || 0);
  const questionColumnCount = Number(state?.questionColumnCount || 0);
  const jobColumnCount = Number(state?.jobColumnCount || 0);
  const removedNoteTableCount = Number(state?.removedNoteTableCount || 0);
  const removedNoteItemCount = Number(state?.removedNoteItemCount || 0);
  const removedNoteSearchCount = Number(state?.removedNoteSearchCount || 0);
  const legacyNoteConstraintCount = Number(state?.legacyNoteConstraintCount || 0);
  const ledger =
    tableCount === 8
      ? await first<{ version: string; checksum: string }>(
          db,
          'SELECT version, checksum FROM app_schema_migrations WHERE version = ?',
          EXPECTED_SCHEMA_VERSION,
        )
      : null;
  const appliedVersion = ledger?.version || null;
  return {
    ready:
      tableCount === 8 &&
      triggerCount === 15 &&
      progressColumnCount === 3 &&
      questionColumnCount === 2 &&
      jobColumnCount === 1 &&
      removedNoteTableCount === 0 &&
      removedNoteItemCount === 0 &&
      removedNoteSearchCount === 0 &&
      legacyNoteConstraintCount === 0 &&
      appliedVersion === EXPECTED_SCHEMA_VERSION &&
      ledger?.checksum === EXPECTED_SCHEMA_CHECKSUM,
    expectedVersion: EXPECTED_SCHEMA_VERSION,
    appliedVersion,
    tableCount,
    triggerCount,
    progressColumnCount,
    questionColumnCount,
    jobColumnCount,
    removedNoteTableCount,
    removedNoteItemCount,
    removedNoteSearchCount,
    legacyNoteConstraintCount,
  };
}

async function expectedMigrationApplied(db: D1Database) {
  try {
    const row = await first<{ checksum: string }>(
      db,
      'SELECT checksum FROM app_schema_migrations WHERE version = ?',
      EXPECTED_SCHEMA_VERSION,
    );
    return row?.checksum === EXPECTED_SCHEMA_CHECKSUM;
  } catch (error) {
    if (String(error).toLowerCase().includes('no such table')) return false;
    throw error;
  }
}

async function removeNotesSchema(db: D1Database) {
  const tableState = await first<{ current: number; replacement: number }>(
    db,
    `SELECT
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name = 'collection_items') AS current,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name = '__new_collection_items_phase2') AS replacement`,
  );
  if (!Number(tableState?.current) && Number(tableState?.replacement)) {
    await run(db, 'ALTER TABLE __new_collection_items_phase2 RENAME TO collection_items');
    await db.batch([
      db.prepare(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_items_target ON collection_items(collection_id, item_type, target_id)',
      ),
      db.prepare(
        'CREATE INDEX IF NOT EXISTS idx_collection_items_position ON collection_items(collection_id, position)',
      ),
    ]);
  }

  await db.batch([
    db.prepare('DROP TRIGGER IF EXISTS trg_notes_search_insert'),
    db.prepare('DROP TRIGGER IF EXISTS trg_notes_search_update'),
    db.prepare('DROP TRIGGER IF EXISTS trg_notes_search_delete'),
    db.prepare("DELETE FROM workspace_search WHERE kind = 'notes'"),
    db.prepare("DELETE FROM collection_items WHERE item_type = 'NOTE'"),
    db.prepare('DROP TABLE IF EXISTS note_revisions'),
    db.prepare('DROP TABLE IF EXISTS notes'),
  ]);
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS __new_collection_items_phase2 (
      id text PRIMARY KEY NOT NULL,
      collection_id text NOT NULL,
      item_type text NOT NULL,
      target_id text NOT NULL,
      label text,
      position integer DEFAULT 0 NOT NULL,
      created_at text NOT NULL,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      CONSTRAINT chk_collection_items_type CHECK(
        item_type IN ('JOB_POSTING', 'CODING_PROBLEM', 'SOLUTION', 'LEARNING_UNIT', 'EXTERNAL_LINK')
      )
    )`,
  );
  await db.batch([
    db.prepare('DELETE FROM __new_collection_items_phase2'),
    db.prepare(`INSERT INTO __new_collection_items_phase2
      (id, collection_id, item_type, target_id, label, position, created_at)
      SELECT id, collection_id, item_type, target_id, label, position, created_at
        FROM collection_items`),
  ]);
  await run(db, 'DROP TABLE collection_items');
  await run(db, 'ALTER TABLE __new_collection_items_phase2 RENAME TO collection_items');
  await db.batch([
    db.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_items_target ON collection_items(collection_id, item_type, target_id)',
    ),
    db.prepare(
      'CREATE INDEX IF NOT EXISTS idx_collection_items_position ON collection_items(collection_id, position)',
    ),
  ]);
}

async function applyRuntimeSchema(db: D1Database) {
  if (await expectedMigrationApplied(db)) return;

  await run(db, ledgerSchema);
  // Parent tables must exist before SQLite can prepare child-table statements.
  for (const sql of additiveSchema.slice(0, 6)) await run(db, sql);
  await db.batch(additiveSchema.slice(6).map((sql) => db.prepare(sql)));
  await addLearningProgressColumns(db);
  await addLearningQuestionColumns(db);
  await addJobColumns(db);
  await run(
    db,
    `CREATE VIRTUAL TABLE IF NOT EXISTS workspace_search USING fts5(
      kind UNINDEXED,
      entity_id UNINDEXED,
      owner_id UNINDEXED,
      title,
      body,
      tokenize = 'unicode61 remove_diacritics 2'
    )`,
  );
  await db.batch(searchBackfill.map((sql) => db.prepare(sql)));
  await db.batch(
    searchTriggers.map((sql) => {
      const name = sql.match(/CREATE TRIGGER IF NOT EXISTS ([^ ]+)/)?.[1];
      if (!name) throw new Error('검색 트리거 이름을 확인하지 못했습니다.');
      return db.prepare(`DROP TRIGGER IF EXISTS ${name}`);
    }),
  );
  await db.batch(searchTriggers.map((sql) => db.prepare(sql)));
  await removeNotesSchema(db);
  await run(
    db,
    `INSERT OR REPLACE INTO app_schema_migrations (version, checksum, applied_at)
     VALUES (?, ?, ?)`,
    EXPECTED_SCHEMA_VERSION,
    EXPECTED_SCHEMA_CHECKSUM,
    new Date().toISOString(),
  );
}

export function markRuntimeSchemaReady(db: D1Database) {
  schemaPromises.set(db, Promise.resolve());
}

export async function ensureRuntimeSchema(db: D1Database) {
  let promise = schemaPromises.get(db);
  if (!promise) {
    promise = applyRuntimeSchema(db);
    schemaPromises.set(db, promise);
  }
  try {
    await promise;
  } catch (error) {
    schemaPromises.delete(db);
    throw error;
  }
}
