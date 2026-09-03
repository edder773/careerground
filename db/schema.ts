import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};

export const codingProblems = sqliteTable(
  'coding_problems',
  {
    id: text('id').primaryKey(),
    sourceUrl: text('source_url').notNull(),
    displayTitle: text('display_title').notNull(),
    level: integer('level').notNull(),
    track: text('track').notNull().default('ALGORITHM'),
    tags: text('tags').notNull().default('[]'),
    position: integer('position').notNull().default(0),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_coding_problems_source_url').on(table.sourceUrl),
    index('idx_coding_problems_level_position').on(table.level, table.position),
    index('idx_coding_problems_track_level_position').on(table.track, table.level, table.position),
    check('chk_coding_problems_level', sql`${table.level} BETWEEN 0 AND 5`),
    check('chk_coding_problems_track', sql`${table.track} IN ('ALGORITHM', 'SQL')`),
    check('chk_coding_problems_active', sql`${table.active} IN (0, 1)`),
  ],
);

export const dailyChallengeSettings = sqliteTable('daily_challenge_settings', {
  id: integer('id').primaryKey(),
  allowedLevels: text('allowed_levels').notNull().default('[1,2]'),
  repeatExclusionDays: integer('repeat_exclusion_days').notNull().default(60),
  allowRepeatRelaxation: integer('allow_repeat_relaxation', { mode: 'boolean' })
    .notNull()
    .default(false),
  updatedAt: text('updated_at').notNull(),
});

export const dailyChallenges = sqliteTable(
  'daily_challenges',
  {
    id: text('id').primaryKey(),
    kstDate: text('kst_date').notNull(),
    levelSlot: integer('level_slot').notNull().default(1),
    problemId: text('problem_id')
      .notNull()
      .references(() => codingProblems.id, { onDelete: 'restrict' }),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_daily_challenges_date_level').on(table.kstDate, table.levelSlot)],
);

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    companyName: text('company_name').notNull(),
    companySize: text('company_size').notNull().default('UNCLASSIFIED'),
    companySizeEvidence: text('company_size_evidence'),
    sourceName: text('source_name').notNull(),
    sourcePostingId: text('source_posting_id'),
    sourceUrl: text('source_url').notNull(),
    canonicalKey: text('canonical_key').generatedAlwaysAs(
      sql`CASE
        WHEN length(trim(coalesce(source_posting_id, ''))) > 0 THEN
          'source:' || lower(substr(substr(source_url, instr(source_url, '://') + 3), 1, instr(substr(source_url, instr(source_url, '://') + 3) || '/', '/') - 1)) || ':' || lower(trim(source_posting_id))
        ELSE 'url:' || lower(trim(source_url))
      END`,
      { mode: 'virtual' },
    ),
    title: text('title').notNull(),
    category: text('category').notNull(),
    careerScope: text('career_scope').notNull().default('NEW_GRAD_ELIGIBLE'),
    careerEvidence: text('career_evidence').notNull().default(''),
    employmentType: text('employment_type').notNull().default('FULL_TIME'),
    region: text('region').notNull(),
    remote: integer('remote', { mode: 'boolean' }).notNull().default(false),
    techStack: text('tech_stack').notNull().default('[]'),
    publishedAt: text('published_at'),
    applicationStartAt: text('application_start_at'),
    deadlineAt: text('deadline_at'),
    rolling: integer('rolling', { mode: 'boolean' }).notNull().default(false),
    summary: text('summary').notNull(),
    status: text('status').notNull().default('ACTIVE'),
    fingerprint: text('fingerprint'),
    collectedAt: text('collected_at'),
    lastVerifiedAt: text('last_verified_at').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_jobs_source_url').on(table.sourceUrl),
    uniqueIndex('idx_jobs_canonical_key')
      .on(table.canonicalKey)
      .where(sql`${table.canonicalKey} IS NOT NULL`),
    index('idx_jobs_status_deadline').on(table.status, table.deadlineAt),
    index('idx_jobs_category_created').on(table.category, table.createdAt),
    index('idx_jobs_created_status').on(table.createdAt, table.status),
    index('idx_jobs_category_created_status').on(table.category, table.createdAt, table.status),
    index('idx_jobs_size_created_status').on(table.companySize, table.createdAt, table.status),
    index('idx_jobs_company_status').on(table.companyName, table.status),
    index('idx_jobs_deadline_status').on(table.deadlineAt, table.status),
    index('idx_jobs_calendar_deadline')
      .on(table.deadlineAt)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')`,
      ),
    index('idx_jobs_calendar_published')
      .on(table.publishedAt)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')`,
      ),
    index('idx_jobs_calendar_application_start')
      .on(table.applicationStartAt)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')`,
      ),
    index('idx_jobs_feed_collected_id')
      .on(table.collectedAt, table.id)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')`,
      ),
    index('idx_jobs_active_category')
      .on(table.category)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')`,
      ),
    index('idx_jobs_calendar_rolling')
      .on(table.id)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE') AND ${table.rolling} = 1`,
      ),
    index('idx_jobs_fingerprint').on(table.fingerprint),
    check(
      'chk_jobs_company_size',
      sql`${table.companySize} IN ('LARGE', 'PUBLIC', 'MID', 'SMALL', 'STARTUP', 'FOREIGN', 'UNCLASSIFIED')`,
    ),
    check(
      'chk_jobs_career_scope',
      sql`${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE', 'CAREER_ONLY')`,
    ),
    check(
      'chk_jobs_status',
      sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN', 'EXPIRED', 'REMOVED', 'NEEDS_REVIEW')`,
    ),
    check('chk_jobs_remote', sql`${table.remote} IN (0, 1)`),
    check('chk_jobs_rolling', sql`${table.rolling} IN (0, 1)`),
  ],
);

export const importBatches = sqliteTable(
  'import_batches',
  {
    id: text('id').primaryKey(),
    kind: text('kind').notNull(),
    checksum: text('checksum').notNull(),
    status: text('status').notNull().default('COMMITTED'),
    originalCount: integer('original_count').notNull().default(0),
    rejectedCount: integer('rejected_count').notNull().default(0),
    result: text('result').notNull().default('{}'),
    committedAt: text('committed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_import_batches_kind_checksum').on(table.kind, table.checksum)],
);

export const workflowRuns = sqliteTable(
  'workflow_runs',
  {
    runId: text('run_id').primaryKey(),
    schemaVersion: text('schema_version').notNull(),
    workflowId: text('workflow_id').notNull(),
    runGroupKey: text('run_group_key').notNull(),
    targetAsOfDate: text('target_as_of_date').notNull(),
    attempt: integer('attempt').notNull(),
    mode: text('mode').notNull(),
    status: text('status').notNull(),
    previousSuccessfulRunId: text('previous_successful_run_id'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    manifest: text('manifest'),
    manifestChecksum: text('manifest_checksum'),
    startedAt: text('started_at').notNull(),
    completedAt: text('completed_at'),
    validatedAt: text('validated_at'),
    publishedAt: text('published_at'),
  },
  (table) => [
    uniqueIndex('idx_workflow_runs_group_attempt').on(
      table.workflowId,
      table.runGroupKey,
      table.attempt,
    ),
    index('idx_workflow_runs_group_status').on(
      table.workflowId,
      table.runGroupKey,
      table.status,
      table.attempt,
    ),
    index('idx_workflow_runs_target_status').on(
      table.workflowId,
      table.targetAsOfDate,
      table.status,
      table.publishedAt,
    ),
    check('chk_workflow_runs_attempt', sql`${table.attempt} >= 1`),
    check('chk_workflow_runs_mode', sql`${table.mode} IN ('DRY_RUN', 'RESUME', 'PUBLISH')`),
  ],
);

export const workflowStagedJobs = sqliteTable(
  'workflow_staged_jobs',
  {
    runId: text('run_id')
      .notNull()
      .references(() => workflowRuns.runId, { onDelete: 'restrict' }),
    jobId: text('job_id').notNull(),
    canonicalJobKey: text('canonical_job_key').notNull(),
    operation: text('operation').notNull(),
    payload: text('payload').notNull(),
    expectedBefore: text('expected_before'),
    evidence: text('evidence').notNull().default('{}'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.runId, table.jobId, table.operation] }),
    index('idx_workflow_staged_jobs_run_operation').on(table.runId, table.operation),
    check(
      'chk_workflow_staged_jobs_operation',
      sql`${table.operation} IN ('INSERT', 'UPDATE', 'END')`,
    ),
  ],
);

export const workflowPublications = sqliteTable('workflow_publications', {
  idempotencyKey: text('idempotency_key').primaryKey(),
  runId: text('run_id')
    .notNull()
    .unique()
    .references(() => workflowRuns.runId, { onDelete: 'restrict' }),
  manifestChecksum: text('manifest_checksum').notNull(),
  insertedCount: integer('inserted_count').notNull(),
  updatedCount: integer('updated_count').notNull(),
  endedCount: integer('ended_count').notNull(),
  publishedAt: text('published_at').notNull(),
});

export const workflowPublishAssertions = sqliteTable(
  'workflow_publish_assertions',
  {
    runId: text('run_id')
      .primaryKey()
      .references(() => workflowRuns.runId, { onDelete: 'restrict' }),
    ok: integer('ok').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [check('chk_workflow_publish_assertion', sql`${table.ok} = 1`)],
);

export const workflowPointers = sqliteTable(
  'workflow_pointers',
  {
    workflowId: text('workflow_id').notNull(),
    pointerName: text('pointer_name').notNull(),
    runId: text('run_id')
      .notNull()
      .references(() => workflowRuns.runId, { onDelete: 'restrict' }),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.workflowId, table.pointerName] }),
    check('chk_workflow_pointer_name', sql`${table.pointerName} IN ('current', 'last-success')`),
  ],
);

export const workflowNotifications = sqliteTable(
  'workflow_notifications',
  {
    runId: text('run_id')
      .primaryKey()
      .references(() => workflowRuns.runId, { onDelete: 'restrict' }),
    status: text('status').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    payloadChecksum: text('payload_checksum'),
    lastError: text('last_error'),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    check(
      'chk_workflow_notification_status',
      sql`${table.status} IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED')`,
    ),
    check('chk_workflow_notification_attempt', sql`${table.attemptCount} >= 0`),
  ],
);

/**
 * Query-critical values are normalized instead of repeatedly parsing jobs.tech_stack JSON.
 * jobs.tech_stack remains as an import compatibility snapshot and can be removed after all
 * historical consumers have migrated.
 */
export const jobTechStacks = sqliteTable(
  'job_tech_stacks',
  {
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_job_tech_stacks_job_name').on(table.jobId, table.name),
    index('idx_job_tech_stacks_name_job').on(table.name, table.jobId),
    check('chk_job_tech_stacks_name', sql`length(trim(${table.name})) BETWEEN 1 AND 50`),
  ],
);

export const slackDigestDeliveries = sqliteTable(
  'slack_digest_deliveries',
  {
    deliveryKey: text('delivery_key').primaryKey(),
    deliveryMode: text('delivery_mode').notNull(),
    status: text('status').notNull(),
    claimTokenHash: text('claim_token_hash').notNull(),
    payload: text('payload').notNull(),
    payloadChecksum: text('payload_checksum').notNull(),
    attemptCount: integer('attempt_count').notNull().default(1),
    claimedAt: text('claimed_at').notNull(),
    completedAt: text('completed_at'),
    failedAt: text('failed_at'),
    lastError: text('last_error'),
  },
  (table) => [
    index('idx_slack_digest_deliveries_status_claimed').on(table.status, table.claimedAt),
    check('chk_slack_digest_delivery_mode', sql`${table.deliveryMode} IN ('DAILY', 'SNAPSHOT')`),
    check(
      'chk_slack_digest_delivery_status',
      sql`${table.status} IN ('CLAIMED', 'SENT', 'FAILED', 'UNCERTAIN')`,
    ),
    check('chk_slack_digest_delivery_attempt_count', sql`${table.attemptCount} >= 1`),
  ],
);
