import { first, type D1Database } from './d1.js';
import { EXPECTED_SCHEMA_CHECKSUM, EXPECTED_SCHEMA_VERSION } from './migration-authority.js';

const schemaPromises = new WeakMap<D1Database, Promise<RuntimeSchemaState>>();
export { EXPECTED_SCHEMA_CHECKSUM, EXPECTED_SCHEMA_VERSION };

const REQUIRED_TABLES = [
  'app_schema_migrations',
  'jobs',
  'job_tech_stacks',
  'coding_problems',
  'daily_challenges',
  'daily_challenge_settings',
  'import_batches',
  'slack_digest_deliveries',
  'slack_digest_items',
  'slack_digest_job_reservations',
  'workflow_runs',
  'workflow_staged_jobs',
  'workflow_publications',
  'workflow_pointers',
  'workflow_notifications',
  'workflow_publish_assertions',
] as const;

const REQUIRED_INDEXES = [
  'idx_jobs_canonical_key',
  'idx_jobs_feed_collected_id',
  'idx_jobs_active_category',
  'idx_coding_problems_track_level_position',
  'idx_slack_digest_job_reservations_active_job',
] as const;

export type RuntimeSchemaState = {
  ready: boolean;
  expectedVersion: string;
  appliedVersion: string | null;
  requiredTableCount: number;
  requiredIndexCount: number;
};

export async function inspectRuntimeSchema(db: D1Database): Promise<RuntimeSchemaState> {
  const placeholders = (values: readonly string[]) => values.map(() => '?').join(', ');
  const inventory = await first<{ requiredTableCount: number; requiredIndexCount: number }>(
    db,
    `SELECT
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'table' AND name IN (${placeholders(REQUIRED_TABLES)})) AS requiredTableCount,
       (SELECT COUNT(*) FROM sqlite_schema
         WHERE type = 'index' AND name IN (${placeholders(REQUIRED_INDEXES)})) AS requiredIndexCount`,
    ...REQUIRED_TABLES,
    ...REQUIRED_INDEXES,
  );
  const requiredTableCount = Number(inventory?.requiredTableCount || 0);
  const requiredIndexCount = Number(inventory?.requiredIndexCount || 0);
  const hasMigrationLedger = requiredTableCount === REQUIRED_TABLES.length;
  const ledger = hasMigrationLedger
    ? await first<{ version: string; checksum: string }>(
        db,
        'SELECT version, checksum FROM app_schema_migrations WHERE version = ?',
        EXPECTED_SCHEMA_VERSION,
      )
    : null;
  const appliedVersion = ledger?.version || null;
  return {
    ready:
      requiredTableCount === REQUIRED_TABLES.length &&
      requiredIndexCount === REQUIRED_INDEXES.length &&
      appliedVersion === EXPECTED_SCHEMA_VERSION &&
      ledger?.checksum === EXPECTED_SCHEMA_CHECKSUM,
    expectedVersion: EXPECTED_SCHEMA_VERSION,
    appliedVersion,
    requiredTableCount,
    requiredIndexCount,
  };
}

export async function readRuntimeSchema(db: D1Database) {
  let promise = schemaPromises.get(db);
  if (!promise) {
    promise = inspectRuntimeSchema(db);
    schemaPromises.set(db, promise);
  }
  try {
    return await promise;
  } catch (error) {
    schemaPromises.delete(db);
    throw error;
  }
}

export async function ensureRuntimeSchema(db: D1Database) {
  const state = await readRuntimeSchema(db);
  if (state.ready) return state;
  schemaPromises.delete(db);
  throw new Error(
    `D1 schema is not ready: expected=${state.expectedVersion} applied=${state.appliedVersion || 'none'}`,
  );
}
