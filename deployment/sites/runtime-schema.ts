import { first, type D1Database } from './d1.js';
import { EXPECTED_SCHEMA_CHECKSUM, EXPECTED_SCHEMA_VERSION } from './migration-authority.js';

const schemaPromises = new WeakMap<D1Database, Promise<void>>();
export { EXPECTED_SCHEMA_CHECKSUM, EXPECTED_SCHEMA_VERSION };

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
  authTableCount: number;
  legacyIdentityColumnCount: number;
  canonicalJobColumnCount: number;
  canonicalJobIndexCount: number;
  slackDeliveryTableCount: number;
};

export async function inspectRuntimeSchema(db: D1Database): Promise<RuntimeSchemaState> {
  const inventory = await first<{
    tableCount: number;
    workspaceSearchCount: number;
    collectionItemsCount: number;
  }>(
    db,
    `SELECT
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name IN (
           'app_schema_migrations', 'job_source_snapshot_items', 'job_source_snapshots',
           'job_tech_stacks', 'learning_question_attempts', 'learning_review_events',
           'scheduler_leases', 'workspace_search', 'auth_identities', 'auth_sessions'
         )) AS tableCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name = 'workspace_search') AS workspaceSearchCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name = 'collection_items') AS collectionItemsCount`,
  );
  if (!Number(inventory?.workspaceSearchCount) || !Number(inventory?.collectionItemsCount)) {
    return {
      ready: false,
      expectedVersion: EXPECTED_SCHEMA_VERSION,
      appliedVersion: null,
      tableCount: Number(inventory?.tableCount || 0),
      triggerCount: 0,
      progressColumnCount: 0,
      questionColumnCount: 0,
      jobColumnCount: 0,
      removedNoteTableCount: 0,
      removedNoteItemCount: 0,
      removedNoteSearchCount: 0,
      legacyNoteConstraintCount: 0,
      authTableCount: 0,
      legacyIdentityColumnCount: 0,
      canonicalJobColumnCount: 0,
      canonicalJobIndexCount: 0,
      slackDeliveryTableCount: 0,
    };
  }
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
    authTableCount: number;
    legacyIdentityColumnCount: number;
    canonicalJobColumnCount: number;
    canonicalJobIndexCount: number;
    slackDeliveryTableCount: number;
  }>(
    db,
    `SELECT
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name IN (
           'app_schema_migrations', 'job_source_snapshot_items', 'job_source_snapshots',
           'job_tech_stacks', 'learning_question_attempts', 'learning_review_events',
           'scheduler_leases', 'workspace_search', 'auth_identities', 'auth_sessions'
         )) AS tableCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'trigger' AND name GLOB 'trg_*_search_*') AS triggerCount,
       (SELECT COUNT(*) FROM pragma_table_info('learning_progress')
         WHERE name IN ('review_version', 'completed_at', 'mastered_at')) AS progressColumnCount,
       (SELECT COUNT(*) FROM pragma_table_info('learning_questions')
         WHERE name IN ('type', 'choices')) AS questionColumnCount,
       (SELECT COUNT(*) FROM pragma_table_info('jobs')
         WHERE name IN ('published_at', 'application_start_at')) AS jobColumnCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name IN ('notes', 'note_revisions')) AS removedNoteTableCount,
       (SELECT COUNT(*) FROM collection_items WHERE item_type = 'NOTE') AS removedNoteItemCount,
       (SELECT COUNT(*) FROM workspace_search WHERE kind = 'notes') AS removedNoteSearchCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name = 'collection_items' AND sql LIKE '%''NOTE''%')
         AS legacyNoteConstraintCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name IN ('auth_identities', 'auth_sessions')) AS authTableCount,
       (SELECT COUNT(*) FROM pragma_table_info('users')
         WHERE name = 'site_user_id') AS legacyIdentityColumnCount,
       (SELECT COUNT(*) FROM pragma_table_xinfo('jobs')
         WHERE name = 'canonical_key') AS canonicalJobColumnCount,
       (SELECT COUNT(*) FROM pragma_index_list('jobs')
         WHERE name = 'idx_jobs_canonical_key' AND [unique] = 1) AS canonicalJobIndexCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name = 'slack_digest_deliveries') AS slackDeliveryTableCount`,
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
  const authTableCount = Number(state?.authTableCount || 0);
  const legacyIdentityColumnCount = Number(state?.legacyIdentityColumnCount || 0);
  const canonicalJobColumnCount = Number(state?.canonicalJobColumnCount || 0);
  const canonicalJobIndexCount = Number(state?.canonicalJobIndexCount || 0);
  const slackDeliveryTableCount = Number(state?.slackDeliveryTableCount || 0);
  const ledger =
    tableCount === 10
      ? await first<{ version: string; checksum: string }>(
          db,
          'SELECT version, checksum FROM app_schema_migrations WHERE version = ?',
          EXPECTED_SCHEMA_VERSION,
        )
      : null;
  const appliedVersion = ledger?.version || null;
  return {
    ready:
      tableCount === 10 &&
      triggerCount === 15 &&
      progressColumnCount === 3 &&
      questionColumnCount === 2 &&
      jobColumnCount === 2 &&
      removedNoteTableCount === 0 &&
      removedNoteItemCount === 0 &&
      removedNoteSearchCount === 0 &&
      legacyNoteConstraintCount === 0 &&
      authTableCount === 2 &&
      canonicalJobColumnCount === 1 &&
      canonicalJobIndexCount === 1 &&
      slackDeliveryTableCount === 1 &&
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
    authTableCount,
    legacyIdentityColumnCount,
    canonicalJobColumnCount,
    canonicalJobIndexCount,
    slackDeliveryTableCount,
  };
}

export async function ensureRuntimeSchema(db: D1Database) {
  let promise = schemaPromises.get(db);
  if (!promise) {
    promise = inspectRuntimeSchema(db).then((state) => {
      if (state.ready) return;
      throw new Error(
        `D1 schema is not ready: expected=${state.expectedVersion} applied=${state.appliedVersion || 'none'}`,
      );
    });
    schemaPromises.set(db, promise);
  }
  try {
    await promise;
  } catch (error) {
    schemaPromises.delete(db);
    throw error;
  }
}
