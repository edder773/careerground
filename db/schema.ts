import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
    preferredLanguage: text('preferred_language').notNull().default('typescript'),
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
  ],
);

export const collections = sqliteTable(
  'collections',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    parentId: text('parent_id'),
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
    collectionId: text('collection_id').notNull(),
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
  ],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    markdown: text('markdown').notNull(),
    visibility: text('visibility').notNull().default('PRIVATE'),
    linkedType: text('linked_type'),
    linkedId: text('linked_id'),
    currentRev: integer('current_rev').notNull().default(1),
    deletedAt: text('deleted_at'),
    ...timestamps,
  },
  (table) => [index('idx_notes_user_updated').on(table.userId, table.updatedAt)],
);

export const noteRevisions = sqliteTable(
  'note_revisions',
  {
    id: text('id').primaryKey(),
    noteId: text('note_id').notNull(),
    revision: integer('revision').notNull(),
    markdown: text('markdown').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_note_revisions_note_revision').on(table.noteId, table.revision)],
);

export const codingProblems = sqliteTable(
  'coding_problems',
  {
    id: text('id').primaryKey(),
    sourceUrl: text('source_url').notNull(),
    displayTitle: text('display_title').notNull(),
    level: integer('level').notNull(),
    tags: text('tags').notNull().default('[]'),
    position: integer('position').notNull().default(0),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_coding_problems_source_url').on(table.sourceUrl),
    index('idx_coding_problems_level_position').on(table.level, table.position),
  ],
);

export const problemProgress = sqliteTable(
  'problem_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    problemId: text('problem_id').notNull(),
    status: text('status').notNull().default('UNTRIED'),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    memo: text('memo').notNull().default(''),
    solvedAt: text('solved_at'),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_problem_progress_user_problem').on(table.userId, table.problemId),
    index('idx_problem_progress_user_status').on(table.userId, table.status),
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
    problemId: text('problem_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_daily_challenges_date').on(table.kstDate)],
);

export const dailyChallengeParticipations = sqliteTable(
  'daily_challenge_participations',
  {
    id: text('id').primaryKey(),
    challengeId: text('challenge_id').notNull(),
    userId: text('user_id').notNull(),
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
    problemId: text('problem_id').notNull(),
    authorId: text('author_id').notNull(),
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
  ],
);

export const solutionRevisions = sqliteTable(
  'solution_revisions',
  {
    id: text('id').primaryKey(),
    solutionId: text('solution_id').notNull(),
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
    solutionId: text('solution_id').notNull(),
    userId: text('user_id').notNull(),
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
    solutionId: text('solution_id').notNull(),
    authorId: text('author_id').notNull(),
    parentId: text('parent_id'),
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
    sourceName: text('source_name').notNull(),
    sourceUrl: text('source_url').notNull(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    region: text('region').notNull(),
    remote: integer('remote', { mode: 'boolean' }).notNull().default(false),
    techStack: text('tech_stack').notNull().default('[]'),
    deadlineAt: text('deadline_at'),
    rolling: integer('rolling', { mode: 'boolean' }).notNull().default(false),
    summary: text('summary').notNull(),
    status: text('status').notNull().default('ACTIVE'),
    lastVerifiedAt: text('last_verified_at').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_jobs_source_url').on(table.sourceUrl),
    index('idx_jobs_status_deadline').on(table.status, table.deadlineAt),
    index('idx_jobs_category_created').on(table.category, table.createdAt),
  ],
);

export const savedJobs = sqliteTable(
  'saved_jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    jobId: text('job_id').notNull(),
    status: text('status').notNull().default('INTERESTED'),
    memo: text('memo').notNull().default(''),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_saved_jobs_user_job').on(table.userId, table.jobId),
    index('idx_saved_jobs_user_status').on(table.userId, table.status),
  ],
);

export const learningSources = sqliteTable('learning_sources', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('READY'),
  ...timestamps,
});

export const learningUnits = sqliteTable(
  'learning_units',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id').notNull(),
    anchor: text('anchor').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    concepts: text('concepts').notNull().default('[]'),
    position: integer('position').notNull().default(0),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idx_learning_units_source_anchor').on(table.sourceId, table.anchor),
    index('idx_learning_units_source_position').on(table.sourceId, table.position),
  ],
);

export const flashcards = sqliteTable('flashcards', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull(),
  front: text('front').notNull(),
  back: text('back').notNull(),
  createdAt: text('created_at').notNull(),
});

export const learningQuestions = sqliteTable('learning_questions', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull(),
  prompt: text('prompt').notNull(),
  answer: text('answer').notNull(),
  createdAt: text('created_at').notNull(),
});

export const learningProgress = sqliteTable(
  'learning_progress',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    unitId: text('unit_id').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
    understanding: integer('understanding'),
    lastStudiedAt: text('last_studied_at'),
    nextReviewAt: text('next_review_at'),
    repetitionCount: integer('repetition_count').notNull().default(0),
    intervalDays: integer('interval_days').notNull().default(1),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_learning_progress_user_unit').on(table.userId, table.unitId),
    index('idx_learning_progress_user_due').on(table.userId, table.nextReviewAt),
  ],
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    href: text('href'),
    readAt: text('read_at'),
    expiresAt: text('expires_at'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_notifications_user_read_created').on(table.userId, table.readAt, table.createdAt),
  ],
);

export const auditLogs = sqliteTable(
  'audit_logs',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id'),
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
    originalCount: integer('original_count').notNull().default(0),
    rejectedCount: integer('rejected_count').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_import_batches_kind_checksum').on(table.kind, table.checksum)],
);
