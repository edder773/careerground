import { sql } from 'drizzle-orm';
import {
  type AnySQLiteColumn,
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
};

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    siteUserId: text('site_user_id').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    role: text('role').notNull().default('MEMBER'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    avatarUrl: text('avatar_url'),
    githubUsername: text('github_username'),
    preferredLanguage: text('preferred_language').notNull().default('javascript'),
    onboardingCompletedAt: text('onboarding_completed_at'),
    rankingOptIn: integer('ranking_opt_in', { mode: 'boolean' }).notNull().default(true),
    commentNotifications: integer('comment_notifications', { mode: 'boolean' })
      .notNull()
      .default(true),
    deadlineNotifications: integer('deadline_notifications', { mode: 'boolean' })
      .notNull()
      .default(true),
    reviewNotifications: integer('review_notifications', { mode: 'boolean' })
      .notNull()
      .default(true),
    dataDeletionRequested: text('data_deletion_requested'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_users_site_user_id').on(table.siteUserId),
    uniqueIndex('idx_users_email').on(table.email),
    check('chk_users_role', sql`${table.role} IN ('ADMIN', 'MEMBER')`),
    check(
      'chk_users_preferred_language',
      sql`${table.preferredLanguage} IN ('python', 'java', 'javascript', 'cpp')`,
    ),
    check('chk_users_active', sql`${table.isActive} IN (0, 1)`),
  ],
);

export const collections = sqliteTable(
  'collections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references((): AnySQLiteColumn => collections.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    icon: text('icon').notNull().default('folder'),
    color: text('color').notNull().default('amber'),
    position: integer('position').notNull().default(0),
    deletedAt: text('deleted_at'),
    ...timestamps,
  },
  (table) => [
    index('idx_collections_user_parent_position').on(table.userId, table.parentId, table.position),
    index('idx_collections_user_deleted').on(table.userId, table.deletedAt),
  ],
);

export const collectionItems = sqliteTable(
  'collection_items',
  {
    id: text('id').primaryKey(),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    itemType: text('item_type').notNull(),
    targetId: text('target_id').notNull(),
    label: text('label'),
    position: integer('position').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_collection_items_target').on(
      table.collectionId,
      table.itemType,
      table.targetId,
    ),
    index('idx_collection_items_position').on(table.collectionId, table.position),
    check(
      'chk_collection_items_type',
      sql`${table.itemType} IN ('JOB_POSTING', 'CODING_PROBLEM', 'SOLUTION', 'LEARNING_UNIT', 'EXTERNAL_LINK')`,
    ),
  ],
);

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

export const problemProgress = sqliteTable(
  'problem_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    problemId: text('problem_id')
      .notNull()
      .references(() => codingProblems.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('UNTRIED'),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    memo: text('memo').notNull().default(''),
    solvedAt: text('solved_at'),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_problem_progress_user_problem').on(table.userId, table.problemId),
    index('idx_problem_progress_user_status').on(table.userId, table.status),
    check(
      'chk_problem_progress_status',
      sql`${table.status} IN ('UNTRIED', 'IN_PROGRESS', 'SOLVED', 'RETRY')`,
    ),
    check('chk_problem_progress_favorite', sql`${table.favorite} IN (0, 1)`),
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

export const dailyChallengeParticipations = sqliteTable(
  'daily_challenge_participations',
  {
    id: text('id').primaryKey(),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => dailyChallenges.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    completedAt: text('completed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_daily_participations_challenge_user').on(table.challengeId, table.userId),
    index('idx_daily_participations_user').on(table.userId, table.completedAt),
  ],
);

export const solutions = sqliteTable(
  'solutions',
  {
    id: text('id').primaryKey(),
    problemId: text('problem_id')
      .notNull()
      .references(() => codingProblems.id, { onDelete: 'restrict' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    language: text('language').notNull(),
    code: text('code').notNull(),
    description: text('description').notNull(),
    timeComplexity: text('time_complexity'),
    spaceComplexity: text('space_complexity'),
    lessons: text('lessons').notNull().default(''),
    solved: integer('solved', { mode: 'boolean' }).notNull().default(false),
    visibility: text('visibility').notNull().default('MEMBERS'),
    currentRev: integer('current_rev').notNull().default(1),
    solvedAt: text('solved_at'),
    deletedAt: text('deleted_at'),
    ...timestamps,
  },
  (table) => [
    index('idx_solutions_problem_visibility_updated').on(
      table.problemId,
      table.visibility,
      table.updatedAt,
    ),
    index('idx_solutions_author_solved').on(table.authorId, table.solvedAt),
    check(
      'chk_solutions_language',
      sql`${table.language} IN ('python', 'java', 'javascript', 'cpp', 'sql')`,
    ),
    check('chk_solutions_visibility', sql`${table.visibility} IN ('PRIVATE', 'MEMBERS')`),
    check('chk_solutions_solved', sql`${table.solved} IN (0, 1)`),
  ],
);

export const solutionRevisions = sqliteTable(
  'solution_revisions',
  {
    id: text('id').primaryKey(),
    solutionId: text('solution_id')
      .notNull()
      .references(() => solutions.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    code: text('code').notNull(),
    description: text('description').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_solution_revisions_solution_revision').on(table.solutionId, table.revision),
  ],
);

export const solutionReactions = sqliteTable(
  'solution_reactions',
  {
    id: text('id').primaryKey(),
    solutionId: text('solution_id')
      .notNull()
      .references(() => solutions.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_solution_reactions_solution_user').on(table.solutionId, table.userId),
  ],
);

export const solutionComments = sqliteTable(
  'solution_comments',
  {
    id: text('id').primaryKey(),
    solutionId: text('solution_id')
      .notNull()
      .references(() => solutions.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references((): AnySQLiteColumn => solutionComments.id, {
      onDelete: 'set null',
    }),
    markdown: text('markdown').notNull(),
    editedAt: text('edited_at'),
    deletedAt: text('deleted_at'),
    hiddenAt: text('hidden_at'),
    ...timestamps,
  },
  (table) => [
    index('idx_solution_comments_solution_created').on(table.solutionId, table.createdAt),
    index('idx_solution_comments_parent').on(table.parentId),
  ],
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
    title: text('title').notNull(),
    category: text('category').notNull(),
    careerScope: text('career_scope').notNull().default('NEW_GRAD_ELIGIBLE'),
    careerEvidence: text('career_evidence').notNull().default(''),
    employmentType: text('employment_type').notNull().default('FULL_TIME'),
    region: text('region').notNull(),
    remote: integer('remote', { mode: 'boolean' }).notNull().default(false),
    techStack: text('tech_stack').notNull().default('[]'),
    publishedAt: text('published_at'),
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
    index('idx_jobs_calendar_collected')
      .on(table.collectedAt)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')`,
      ),
    index('idx_jobs_calendar_created')
      .on(table.createdAt)
      .where(
        sql`${table.status} IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND ${table.careerScope} IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE') AND ${table.collectedAt} IS NULL`,
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

export const savedJobs = sqliteTable(
  'saved_jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('INTERESTED'),
    bookmarked: integer('bookmarked', { mode: 'boolean' }).notNull().default(true),
    memo: text('memo').notNull().default(''),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_saved_jobs_user_job').on(table.userId, table.jobId),
    index('idx_saved_jobs_user_status').on(table.userId, table.status),
    check(
      'chk_saved_jobs_status',
      sql`${table.status} IN ('INTERESTED', 'PLANNED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'REJECTED', 'ACCEPTED', 'ON_HOLD')`,
    ),
    check('chk_saved_jobs_bookmarked', sql`${table.bookmarked} IN (0, 1)`),
  ],
);

export const learningSources = sqliteTable(
  'learning_sources',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    subject: text('subject').notNull(),
    category: text('category').notNull(),
    sourceVersion: text('source_version'),
    sourceChecksum: text('source_checksum'),
    status: text('status').notNull().default('READY'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_learning_sources_checksum_version').on(
      table.sourceChecksum,
      table.sourceVersion,
    ),
  ],
);

export const learningUnits = sqliteTable(
  'learning_units',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id')
      .notNull()
      .references(() => learningSources.id, { onDelete: 'cascade' }),
    anchor: text('anchor').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    concepts: text('concepts').notNull().default('[]'),
    visuals: text('visuals').notNull().default('[]'),
    position: integer('position').notNull().default(0),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_learning_units_source_anchor').on(table.sourceId, table.anchor),
    index('idx_learning_units_source_position').on(table.sourceId, table.position),
    index('idx_learning_units_published_source_position').on(
      table.published,
      table.sourceId,
      table.position,
    ),
    check('chk_learning_units_published', sql`${table.published} IN (0, 1)`),
  ],
);

export const flashcards = sqliteTable(
  'flashcards',
  {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
      .notNull()
      .references(() => learningUnits.id, { onDelete: 'cascade' }),
    front: text('front').notNull(),
    back: text('back').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_flashcards_unit_created').on(table.unitId, table.createdAt)],
);

export const learningQuestions = sqliteTable(
  'learning_questions',
  {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
      .notNull()
      .references(() => learningUnits.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    answer: text('answer').notNull(),
    type: text('type').notNull().default('SHORT_ANSWER'),
    choices: text('choices').notNull().default('[]'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_learning_questions_unit_created').on(table.unitId, table.createdAt),
    check('chk_learning_questions_type', sql`${table.type} IN ('MULTIPLE_CHOICE', 'SHORT_ANSWER')`),
  ],
);

export const learningProgress = sqliteTable(
  'learning_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    unitId: text('unit_id')
      .notNull()
      .references(() => learningUnits.id, { onDelete: 'cascade' }),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    understanding: integer('understanding'),
    lastStudiedAt: text('last_studied_at'),
    nextReviewAt: text('next_review_at'),
    repetitionCount: integer('repetition_count').notNull().default(0),
    intervalDays: integer('interval_days').notNull().default(1),
    reviewVersion: integer('review_version').notNull().default(0),
    completedAt: text('completed_at'),
    masteredAt: text('mastered_at'),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_learning_progress_user_unit').on(table.userId, table.unitId),
    index('idx_learning_progress_user_due').on(table.userId, table.nextReviewAt),
    check('chk_learning_progress_completed', sql`${table.completed} IN (0, 1)`),
    check(
      'chk_learning_progress_understanding',
      sql`${table.understanding} IS NULL OR ${table.understanding} BETWEEN 1 AND 5`,
    ),
    check('chk_learning_progress_interval', sql`${table.intervalDays} >= 1`),
    check('chk_learning_progress_version', sql`${table.reviewVersion} >= 0`),
  ],
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    href: text('href'),
    dedupeKey: text('dedupe_key'),
    readAt: text('read_at'),
    expiresAt: text('expires_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_notifications_user_read_created').on(table.userId, table.readAt, table.createdAt),
    index('idx_notifications_user_read_expiry_created').on(
      table.userId,
      table.readAt,
      table.expiresAt,
      table.createdAt,
    ),
    uniqueIndex('idx_notifications_user_dedupe').on(table.userId, table.dedupeKey),
    check(
      'chk_notifications_type',
      sql`${table.type} IN ('COMMENT', 'REPLY', 'JOB_DEADLINE', 'LEARNING_REVIEW', 'SYSTEM')`,
    ),
  ],
);

export const requestRateLimits = sqliteTable(
  'request_rate_limits',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    routeKey: text('route_key').notNull(),
    windowStart: integer('window_start').notNull(),
    count: integer('count').notNull().default(1),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_request_rate_limits_window').on(
      table.userId,
      table.routeKey,
      table.windowStart,
    ),
    index('idx_request_rate_limits_updated').on(table.updatedAt),
  ],
);

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    metadata: text('metadata').notNull().default('{}'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_audit_logs_action_created').on(table.action, table.createdAt),
    index('idx_audit_logs_actor_created').on(table.actorId, table.createdAt),
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

export const importPreviews = sqliteTable(
  'import_previews',
  {
    token: text('token').primaryKey(),
    kind: text('kind').notNull(),
    checksum: text('checksum').notNull(),
    payload: text('payload').notNull(),
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
    consumedAt: text('consumed_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_import_previews_actor_kind').on(table.actorId, table.kind, table.createdAt),
    index('idx_import_previews_expiry').on(table.expiresAt),
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

export const jobSourceSnapshots = sqliteTable(
  'job_source_snapshots',
  {
    id: text('id').primaryKey(),
    sourceName: text('source_name').notNull(),
    collectedAt: text('collected_at').notNull(),
    observedCount: integer('observed_count').notNull(),
    expiredCount: integer('expired_count').notNull().default(0),
    importBatchId: text('import_batch_id')
      .notNull()
      .references(() => importBatches.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_job_source_snapshots_batch_source').on(table.importBatchId, table.sourceName),
    index('idx_job_source_snapshots_source_collected').on(table.sourceName, table.collectedAt),
    check(
      'chk_job_source_snapshots_counts',
      sql`${table.observedCount} >= 0 AND ${table.expiredCount} >= 0`,
    ),
  ],
);

export const jobSourceSnapshotItems = sqliteTable(
  'job_source_snapshot_items',
  {
    snapshotId: text('snapshot_id')
      .notNull()
      .references(() => jobSourceSnapshots.id, { onDelete: 'cascade' }),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('idx_job_source_snapshot_items_unique').on(table.snapshotId, table.jobId),
    index('idx_job_source_snapshot_items_job').on(table.jobId),
  ],
);

export const learningReviewEvents = sqliteTable(
  'learning_review_events',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    unitId: text('unit_id')
      .notNull()
      .references(() => learningUnits.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    rating: integer('rating').notNull(),
    previousIntervalDays: integer('previous_interval_days').notNull(),
    nextIntervalDays: integer('next_interval_days').notNull(),
    nextReviewAt: text('next_review_at').notNull(),
    reviewedAt: text('reviewed_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_learning_review_events_sequence').on(
      table.userId,
      table.unitId,
      table.sequence,
    ),
    index('idx_learning_review_events_user_reviewed').on(table.userId, table.reviewedAt),
    check('chk_learning_review_events_rating', sql`${table.rating} BETWEEN 1 AND 5`),
    check(
      'chk_learning_review_events_intervals',
      sql`${table.previousIntervalDays} >= 1 AND ${table.nextIntervalDays} >= 1`,
    ),
  ],
);

export const learningQuestionAttempts = sqliteTable(
  'learning_question_attempts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => learningQuestions.id, { onDelete: 'cascade' }),
    response: text('response').notNull(),
    correct: integer('correct', { mode: 'boolean' }).notNull(),
    attemptedAt: text('attempted_at').notNull(),
  },
  (table) => [
    index('idx_learning_question_attempts_user_question').on(
      table.userId,
      table.questionId,
      table.attemptedAt,
    ),
    check('chk_learning_question_attempts_correct', sql`${table.correct} IN (0, 1)`),
  ],
);

export const schedulerLeases = sqliteTable('scheduler_leases', {
  name: text('name').primaryKey(),
  ownerId: text('owner_id').notNull(),
  leaseUntil: text('lease_until').notNull(),
  updatedAt: text('updated_at').notNull(),
});
