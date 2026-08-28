import {
  all,
  asBoolean,
  first,
  newId,
  nowIso,
  parseArray,
  parseJsonArray,
  parseObject,
  run,
  type D1Database,
  type D1PreparedStatement,
} from './d1.js';
import { DomainValidationError, parseApplicationStatus, sourceText } from './domain.js';
import {
  apiUser,
  assertRateLimit,
  audit,
  createSession,
  enforceRateLimit,
  logoutSession,
  rateLimitStatement,
  rateLimitWindow,
  requireAdmin,
  resolveGoogleUser,
  resolveSessionUser,
  routeRateKey,
  userSelect,
  type RateLimitWindow,
} from './d1-auth.js';
import { RouteError, type D1Env, type UserRow } from './d1-api-contract.js';
import {
  claimSlackDigest,
  completeDailyChallengeBootstrap,
  dailyChallenge,
  dailyChallengeBootstrapStatement,
  dailyChallenges,
  kstDate,
  requireDigestToken,
  settleSlackDigestDelivery,
  slackDigest,
} from './d1-daily-challenges.js';
import {
  commitJobImport,
  commitLearningImport,
  previewJobImport,
  previewLearningImport,
} from './d1-imports.js';
import {
  bool,
  cleanText,
  cursorLimit,
  cursorPageRequested,
  decodeCursor,
  encodeCursor,
  ftsMatchQuery,
  int,
  readJson,
  responseJson,
  type CursorPage,
} from './d1-api-utils.js';
import { readRuntimeSchema } from './runtime-schema.js';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_JWKS_URL,
  verifyGoogleCredential,
  type GoogleIdentity,
} from './google-auth.js';

const codeLanguages = new Set(['python', 'java', 'javascript', 'cpp']);

const collectionFoldersSql = `SELECT id, parent_id AS parentId, name, icon, color, position,
                                      created_at AS createdAt, updated_at AS updatedAt
                                 FROM collections
                                WHERE user_id = ? AND deleted_at IS NULL
                                ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
                                         position, updated_at DESC`;

const collectionItemsSql = `SELECT ci.id, ci.collection_id AS collectionId,
                                    ci.item_type AS itemType, ci.target_id AS targetId,
                                    ci.label, ci.position, ci.created_at AS createdAt
                               FROM collection_items ci
                               JOIN collections c ON c.id = ci.collection_id
                              WHERE c.user_id = ? AND c.deleted_at IS NULL
                              ORDER BY ci.position`;

const collectionValue = (folders: Record<string, unknown>[], items: Record<string, unknown>[]) => {
  const itemsByCollection = new Map<string, Record<string, unknown>[]>();
  for (const item of items) {
    const collectionId = String(item.collectionId);
    const grouped = itemsByCollection.get(collectionId) || [];
    grouped.push(item);
    itemsByCollection.set(collectionId, grouped);
  }
  return folders.map((folder) => ({
    ...folder,
    items: itemsByCollection.get(String(folder.id)) || [],
  }));
};

const collectionTreeStatement = (db: D1Database, ownerSql: string, ownerValue: string) =>
  db
    .prepare(
      `SELECT c.id, c.parent_id AS parentId, c.name, c.icon, c.color, c.position,
              c.created_at AS createdAt, c.updated_at AS updatedAt,
              COALESCE((
                SELECT json_group_array(json_object(
                  'id', item.id,
                  'collectionId', item.collectionId,
                  'itemType', item.itemType,
                  'targetId', item.targetId,
                  'label', item.label,
                  'position', item.position,
                  'createdAt', item.createdAt
                ))
                  FROM (
                    SELECT ci.id, ci.collection_id AS collectionId,
                           ci.item_type AS itemType, ci.target_id AS targetId,
                           ci.label, ci.position, ci.created_at AS createdAt
                      FROM collection_items ci
                     WHERE ci.collection_id = c.id
                     ORDER BY ci.position
                  ) AS item
              ), '[]') AS itemsJson
         FROM collections c
        WHERE c.user_id = ${ownerSql} AND c.deleted_at IS NULL
        ORDER BY CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
                 c.position, c.updated_at DESC`,
    )
    .bind(ownerValue);

const collectionTreeValue = (result: BatchResult | undefined) =>
  batchRows<Record<string, unknown> & { itemsJson: string }>(result).map(
    ({ itemsJson, ...folder }) => ({
      ...folder,
      items: parseJsonArray<Record<string, unknown>>(itemsJson),
    }),
  );

async function collections(db: D1Database, userId: string) {
  const [folderResult, itemResult] = await db.batch<Record<string, unknown>>([
    db.prepare(collectionFoldersSql).bind(userId),
    db.prepare(collectionItemsSql).bind(userId),
  ]);
  return collectionValue(folderResult?.results || [], itemResult?.results || []);
}

type CountRow = { count: number };

const dashboardRange = () => {
  const now = nowIso();
  return {
    now,
    weekAgo: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    weekAhead: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  };
};

type DashboardRow = { recentJobs: number; expiringJobs: number };

const dashboardStatement = (
  db: D1Database,
  ownerSql: string,
  ownerValue: string,
  range = dashboardRange(),
) =>
  db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM jobs
           WHERE status = 'ACTIVE' AND created_at >= ?
             AND (rolling = 1 OR deadline_at IS NULL OR deadline_at >= ?)) AS recentJobs,
         (SELECT COUNT(*) FROM saved_jobs sj JOIN jobs j ON j.id = sj.job_id
           WHERE sj.user_id = ${ownerSql} AND j.status = 'ACTIVE'
             AND j.deadline_at BETWEEN ? AND ?) AS expiringJobs`,
    )
    .bind(range.weekAgo, range.now, ownerValue, range.now, range.weekAhead);

const dashboardValue = (result: BatchResult | undefined) => {
  const row = batchRows<DashboardRow>(result)[0];
  return {
    recentJobs: Number(row?.recentJobs || 0),
    expiringJobs: Number(row?.expiringJobs || 0),
    recentActivity: [],
  };
};

async function dashboard(db: D1Database, userId: string) {
  const [result] = await db.batch([dashboardStatement(db, '?', userId)]);
  return dashboardValue(result);
}

export async function runScheduledMaintenance(env: D1Env) {
  const db = env.DB;
  const ownerId = newId();
  const startedAt = nowIso();
  const leaseUntil = new Date(Date.now() + 4 * 60_000).toISOString();
  const lease = await first<{ ownerId: string }>(
    db,
    `INSERT INTO scheduler_leases (name, owner_id, lease_until, updated_at)
     VALUES ('maintenance-cleanup', ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       owner_id = excluded.owner_id, lease_until = excluded.lease_until,
       updated_at = excluded.updated_at
     WHERE scheduler_leases.lease_until <= excluded.updated_at
     RETURNING owner_id AS ownerId`,
    ownerId,
    leaseUntil,
    startedAt,
  );
  if (lease?.ownerId !== ownerId) return { acquired: false };
  try {
    await db.batch([
      db
        .prepare('DELETE FROM request_rate_limits WHERE window_start < ?')
        .bind(Math.floor(Date.now() / 60_000) - 2),
      db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(startedAt),
    ]);
    return {
      acquired: true,
      completedAt: nowIso(),
    };
  } finally {
    await run(
      db,
      'DELETE FROM scheduler_leases WHERE name = ? AND owner_id = ?',
      'maintenance-cleanup',
      ownerId,
    );
  }
}

async function profile(db: D1Database, userId: string) {
  const row = await first<UserRow>(db, `${userSelect} WHERE id = ?`, userId);
  if (!row) throw new RouteError(404, '사용자를 찾을 수 없습니다.');
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    githubUsername: row.githubUsername,
    preferredLanguage: row.preferredLanguage,
    onboardingCompleted: Boolean(row.onboardingCompletedAt),
  };
}

type ProblemRow = {
  id: string;
  sourceUrl: string;
  displayTitle: string;
  level: number;
  track: 'ALGORITHM' | 'SQL';
  tags: string;
  favorite: number | boolean | null;
  position: number;
  totalCount?: number;
};

type ReadOwner = { kind: 'userId'; value: string };

const readOwnerSql = (_owner: ReadOwner) => '?';

type ProblemReadPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};

function problemListPlan(
  db: D1Database,
  owner: ReadOwner,
  search: URLSearchParams,
): ProblemReadPlan {
  const clauses = ['p.active = 1'];
  const filterValues: unknown[] = [];
  const countClauses = ['counted.active = 1'];
  const countValues: unknown[] = [];
  const level = search.get('level');
  const track = search.get('track');
  const favoritesOnly = search.get('favorites') === '1';
  if (level) {
    clauses.push('p.level = ?');
    filterValues.push(Number(level));
    countClauses.push('counted.level = ?');
    countValues.push(Number(level));
  }
  if (track === 'ALGORITHM' || track === 'SQL') {
    clauses.push('p.track = ?');
    filterValues.push(track);
    countClauses.push('counted.track = ?');
    countValues.push(track);
  }
  if (favoritesOnly) {
    clauses.push('pp.favorite = 1');
    countClauses.push(
      `EXISTS (SELECT 1 FROM problem_progress favorite_progress
                WHERE favorite_progress.problem_id = counted.id
                  AND favorite_progress.user_id = ${readOwnerSql(owner)}
                  AND favorite_progress.favorite = 1)`,
    );
    countValues.push(owner.value);
  }
  const paged = cursorPageRequested(search);
  const limit = paged ? cursorLimit(search, 60, 100) : 500;
  const cursor = paged
    ? decodeCursor<{ position?: unknown; id?: unknown }>(search.get('cursor'))
    : null;
  const values: unknown[] = [owner.value, ...filterValues];
  if (cursor) {
    const position = int(cursor.position, -1);
    const id = cleanText(cursor.id);
    if (position < 0 || !id)
      throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
    clauses.push('(p.position > ? OR (p.position = ? AND p.id > ?))');
    values.push(position, position, id);
  }
  const statements = [
    db
      .prepare(
        `SELECT p.id, p.source_url AS sourceUrl, p.display_title AS displayTitle, p.level, p.track, p.tags,
                p.position,
                ${
                  paged
                    ? `(SELECT COUNT(*) FROM coding_problems counted
                         WHERE ${countClauses.join(' AND ')})`
                    : '0'
                } AS totalCount,
                pp.favorite
           FROM coding_problems p
           LEFT JOIN problem_progress pp ON pp.problem_id = p.id
            AND pp.user_id = ${readOwnerSql(owner)}
          WHERE ${clauses.join(' AND ')}
          ORDER BY p.position, p.id
          LIMIT ?`,
      )
      .bind(...(paged ? countValues : []), ...values, limit + (paged ? 1 : 0)),
  ];
  return {
    statements,
    value(results) {
      const rows = batchRows<ProblemRow>(results[0]);
      const hasMore = paged && rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const items = pageRows.map((row) => ({
        id: row.id,
        sourceUrl: row.sourceUrl,
        displayTitle: row.displayTitle,
        level: row.level,
        track: row.track,
        tags: parseArray(row.tags),
        progress: row.favorite === null ? [] : [{ favorite: asBoolean(row.favorite) }],
      }));
      if (!paged) return items;
      const last = pageRows.at(-1);
      return {
        items,
        nextCursor:
          hasMore && last
            ? encodeCursor({
                position: last.position,
                id: last.id,
              })
            : null,
        total: Number(pageRows[0]?.totalCount || 0),
      } satisfies CursorPage<(typeof items)[number]>;
    },
  };
}

async function problems(db: D1Database, userId: string, search: URLSearchParams) {
  const plan = problemListPlan(db, { kind: 'userId', value: userId }, search);
  return plan.value((await db.batch(plan.statements)) as BatchResult[]);
}

async function problemDetail(db: D1Database, userId: string, problemId: string) {
  const row = await first<ProblemRow>(
    db,
    `SELECT p.id, p.source_url AS sourceUrl, p.display_title AS displayTitle,
            p.level, p.track, p.tags, p.position, pp.favorite
       FROM coding_problems p
       LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = ?
      WHERE p.id = ? AND p.active = 1`,
    userId,
    problemId,
  );
  if (!row) throw new RouteError(404, '코딩 문제를 찾을 수 없습니다.');
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    displayTitle: row.displayTitle,
    level: row.level,
    track: row.track,
    tags: parseArray(row.tags),
    progress: row.favorite === null ? [] : [{ favorite: asBoolean(row.favorite) }],
  };
}

type BatchResult = { results?: Record<string, unknown>[] };

const batchRows = <T>(result: BatchResult | undefined) => (result?.results || []) as T[];

const bootstrapStatementsForUser = (
  db: D1Database,
  userId: string,
  includeHome: boolean,
  today: string,
  rateWindow: RateLimitWindow,
) => {
  const statements = [
    db
      .prepare(
        `INSERT INTO request_rate_limits (user_id, route_key, window_start, count, updated_at)
         VALUES (?, ?, ?, 1, ?)
         ON CONFLICT(user_id, route_key, window_start)
         DO UPDATE SET count = request_rate_limits.count + 1, updated_at = excluded.updated_at
         RETURNING count`,
      )
      .bind(
        userId,
        rateWindow.routeKey,
        rateWindow.windowStart,
        new Date(rateWindow.now).toISOString(),
      ),
  ];
  if (!includeHome) return statements;
  statements.push(
    collectionTreeStatement(db, '?', userId),
    dailyChallengeBootstrapStatement(db, userId, today),
  );
  return statements;
};

async function bootstrapPayload(
  db: D1Database,
  user: UserRow,
  includeHome: boolean,
  today: string,
  rateWindow: RateLimitWindow,
  results: BatchResult[],
) {
  assertRateLimit(Number(batchRows<CountRow>(results[0])[0]?.count || 1), rateWindow);
  let resultIndex = 1;
  const shouldIncludeHome = includeHome && Boolean(user.onboardingCompletedAt);
  if (!shouldIncludeHome) return { user: apiUser(user), home: null };
  const collectionResult = results[resultIndex++];
  return {
    user: apiUser(user),
    home: {
      collections: collectionTreeValue(collectionResult),
      dailyChallenges: await completeDailyChallengeBootstrap(
        db,
        user.id,
        today,
        results[resultIndex],
      ),
    },
  };
}

async function bootstrap(user: UserRow, env: D1Env, includeHome: boolean) {
  const today = kstDate();
  const rateWindow = rateLimitWindow('GET', env, '/api/v1/bootstrap');
  const results = (await env.DB.batch<Record<string, unknown>>(
    bootstrapStatementsForUser(
      env.DB,
      user.id,
      includeHome && Boolean(user.onboardingCompletedAt),
      today,
      rateWindow,
    ),
  )) as BatchResult[];
  return bootstrapPayload(env.DB, user, includeHome, today, rateWindow, results);
}

function serializeJobRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    region: row.region,
    remote: asBoolean(row.remote),
    techStack: parseArray(row.tech_stack),
    publishedAt: row.published_at || null,
    applicationStartAt: row.application_start_at || null,
    collectedAt: row.collected_at,
    deadlineAt: row.deadline_at,
    rolling: asBoolean(row.rolling),
    summary: row.summary,
    sourceUrl: row.source_url,
    company: { name: row.company_name, size: row.company_size },
    source: { name: row.source_name, lastSuccessAt: row.last_verified_at },
    bookmarked: asBoolean(row.savedBookmarked),
    savedBy: row.savedStatus
      ? [
          {
            status: row.savedStatus,
            memo: row.savedMemo || '',
            bookmarked: asBoolean(row.savedBookmarked),
          },
        ]
      : [],
  }));
}

type JobReadPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};

const visibleJobDeadlineClause = (alias: string) =>
  `(${alias}.rolling = 1 OR ${alias}.deadline_at IS NULL OR ${alias}.deadline_at >= ?)`;

function calendarJobPlan(
  db: D1Database,
  owner: ReadOwner,
  from: string,
  to: string,
  companySizes: string[],
  categories: string[],
  query: string,
  savedOnly: boolean,
): JobReadPlan {
  const filters: string[] = [];
  const filterValues: unknown[] = [];
  if (companySizes.length) {
    filters.push(`j.company_size IN (${companySizes.map(() => '?').join(', ')})`);
    filterValues.push(...companySizes);
  }
  if (categories.length) {
    filters.push(`j.category IN (${categories.map(() => '?').join(', ')})`);
    filterValues.push(...categories);
  }
  if (query) {
    const match = ftsMatchQuery(query);
    if (match) {
      filters.push(
        "j.id IN (SELECT entity_id FROM workspace_search WHERE kind = 'jobs' AND workspace_search MATCH ?)",
      );
      filterValues.push(match);
    }
  }
  if (savedOnly) filters.push('sj.bookmarked = 1');
  const select = (indexName: string, scheduleClause: string) => `
    SELECT j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
           j.published_at, j.application_start_at, j.collected_at, j.deadline_at, j.rolling,
           substr(j.summary, 1, 320) AS summary,
           j.source_url, j.company_name,
           j.company_size, j.source_name, j.last_verified_at,
           sj.status AS savedStatus, sj.memo AS savedMemo, sj.bookmarked AS savedBookmarked
      FROM jobs j INDEXED BY ${indexName}
      LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ${readOwnerSql(owner)}
     WHERE j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
       AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
       AND ${visibleJobDeadlineClause('j')}
       AND ${scheduleClause}
       ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
     LIMIT 1001`;
  const statement = (indexName: string, scheduleClause: string, ...scheduleValues: unknown[]) =>
    db
      .prepare(select(indexName, scheduleClause))
      .bind(owner.value, nowIso(), ...scheduleValues, ...filterValues);
  const statements = [
    statement('idx_jobs_calendar_deadline', 'j.deadline_at >= ? AND j.deadline_at < ?', from, to),
    statement(
      'idx_jobs_calendar_published',
      'j.published_at >= ? AND j.published_at < ?',
      from,
      to,
    ),
    statement(
      'idx_jobs_calendar_application_start',
      'j.application_start_at >= ? AND j.application_start_at < ?',
      from,
      to,
    ),
    statement('idx_jobs_calendar_rolling', 'j.rolling = 1'),
  ];
  return {
    statements,
    value(results) {
      const unique = new Map<string, Record<string, unknown>>();
      for (const result of results) {
        if ((result.results || []).length > 1000) {
          throw new RouteError(
            422,
            '달력 일정이 너무 많습니다. 검색어나 필터로 범위를 좁혀주세요.',
            'CALENDAR_RESULT_LIMIT',
          );
        }
        for (const row of result.results || []) unique.set(String(row.id), row);
      }
      return serializeJobRows([...unique.values()]);
    },
  };
}

function jobListPlan(db: D1Database, owner: ReadOwner, url: URL): JobReadPlan {
  const clauses = [
    "j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')",
    "j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')",
    visibleJobDeadlineClause('j'),
  ];
  const values: unknown[] = [nowIso()];
  const companySizes = [...new Set(url.searchParams.getAll('companySize').filter(Boolean))].slice(
    0,
    100,
  );
  const categories = [...new Set(url.searchParams.getAll('category').filter(Boolean))].slice(
    0,
    100,
  );
  if (companySizes.length) {
    clauses.push(`j.company_size IN (${companySizes.map(() => '?').join(', ')})`);
    values.push(...companySizes);
  }
  if (categories.length) {
    clauses.push(`j.category IN (${categories.map(() => '?').join(', ')})`);
    values.push(...categories);
  }
  const query = cleanText(url.searchParams.get('q'));
  if (query) {
    const match = ftsMatchQuery(query);
    if (match) {
      clauses.push(
        "j.id IN (SELECT entity_id FROM workspace_search WHERE kind = 'jobs' AND workspace_search MATCH ?)",
      );
      values.push(match);
    }
  }
  const savedOnly = url.searchParams.get('saved') === '1';
  if (savedOnly) clauses.push('sj.bookmarked = 1');
  const deadlineFrom = url.searchParams.get('deadlineFrom');
  const deadlineTo = url.searchParams.get('deadlineTo');
  const calendar = url.searchParams.get('calendar') === 'true';
  const deadlineFromTime = deadlineFrom ? Date.parse(deadlineFrom) : undefined;
  const deadlineToTime = deadlineTo ? Date.parse(deadlineTo) : undefined;
  if (
    (deadlineFromTime !== undefined && Number.isNaN(deadlineFromTime)) ||
    (deadlineToTime !== undefined && Number.isNaN(deadlineToTime)) ||
    (deadlineFromTime !== undefined &&
      deadlineToTime !== undefined &&
      deadlineFromTime >= deadlineToTime)
  ) {
    throw new RouteError(400, '올바른 마감일 조회 범위가 필요합니다.');
  }
  if (calendar && deadlineFrom && deadlineTo) {
    const from = new Date(deadlineFrom).toISOString();
    const to = new Date(deadlineTo).toISOString();
    return calendarJobPlan(db, owner, from, to, companySizes, categories, query, savedOnly);
  } else {
    if (deadlineFrom) {
      clauses.push('j.deadline_at >= ?');
      values.push(new Date(deadlineFrom).toISOString());
    }
    if (deadlineTo) {
      clauses.push('j.deadline_at < ?');
      values.push(new Date(deadlineTo).toISOString());
    }
  }
  const sortMode = url.searchParams.get('sort');
  const order =
    sortMode === 'deadline'
      ? "COALESCE(j.deadline_at, '9999') ASC, j.id ASC"
      : sortMode === 'company'
        ? 'j.company_name ASC, j.id ASC'
        : 'j.collected_at DESC, j.id DESC';
  const indexName =
    sortMode === 'deadline'
      ? 'idx_jobs_deadline_status'
      : sortMode === 'company'
        ? 'idx_jobs_company_status'
        : categories.length
          ? 'idx_jobs_category_created_status'
          : companySizes.length
            ? 'idx_jobs_size_created_status'
            : 'idx_jobs_feed_collected_id';
  const catalog = url.searchParams.get('catalog') === 'true';
  const paged = !catalog && cursorPageRequested(url.searchParams);
  const limit = catalog ? 1_000 : paged ? cursorLimit(url.searchParams, 40, 100) : 200;
  const baseClauses = [...clauses];
  const baseValues = [...values];
  const cursor = paged
    ? decodeCursor<{ value?: unknown; id?: unknown }>(url.searchParams.get('cursor'))
    : null;
  if (cursor) {
    const cursorValue = cleanText(cursor.value);
    const cursorId = cleanText(cursor.id);
    if (!cursorId) throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
    if (sortMode === 'deadline') {
      clauses.push(
        "(COALESCE(j.deadline_at, '9999') > ? OR (COALESCE(j.deadline_at, '9999') = ? AND j.id > ?))",
      );
    } else if (sortMode === 'company') {
      clauses.push('(j.company_name > ? OR (j.company_name = ? AND j.id > ?))');
    } else {
      clauses.push(
        "(COALESCE(j.collected_at, '') < ? OR (COALESCE(j.collected_at, '') = ? AND j.id < ?))",
      );
    }
    values.push(cursorValue, cursorValue, cursorId);
  }
  const statements = [
    db
      .prepare(
        `SELECT j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
            j.published_at, j.application_start_at, j.collected_at, j.deadline_at, j.rolling,
            substr(j.summary, 1, 320) AS summary,
            j.source_url, j.company_name,
            j.company_size, j.source_name, j.last_verified_at,
            sj.status AS savedStatus, sj.memo AS savedMemo, sj.bookmarked AS savedBookmarked
       FROM jobs j ${calendar ? '' : `INDEXED BY ${indexName}`}
       LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ${readOwnerSql(owner)}
      WHERE ${clauses.join(' AND ')}
      ORDER BY ${order} LIMIT ?`,
      )
      .bind(owner.value, ...values, limit + (paged || catalog ? 1 : 0)),
  ];
  if (paged) {
    statements.push(
      db
        .prepare(
          `SELECT COUNT(*) AS count
             FROM jobs j
             ${savedOnly ? `LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ${readOwnerSql(owner)}` : ''}
            WHERE ${baseClauses.join(' AND ')}`,
        )
        .bind(...(savedOnly ? [owner.value, ...baseValues] : baseValues)),
    );
  }
  return {
    statements,
    value(results) {
      const rows = batchRows<Record<string, unknown>>(results[0]);
      if (catalog && rows.length > limit) {
        throw new RouteError(
          422,
          '채용공고가 너무 많아 전체 카탈로그를 한 번에 표시할 수 없습니다.',
          'JOB_CATALOG_RESULT_LIMIT',
        );
      }
      const hasMore = paged && rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const items = serializeJobRows(pageRows);
      if (!paged) return items;
      const total = batchRows<{ count: number }>(results[1])[0];
      const last = pageRows.at(-1);
      const cursorValue = last
        ? sortMode === 'deadline'
          ? String(last.deadline_at || '9999')
          : sortMode === 'company'
            ? String(last.company_name || '')
            : String(last.collected_at || '')
        : '';
      return {
        items,
        nextCursor: hasMore && last ? encodeCursor({ value: cursorValue, id: last.id }) : null,
        total: Number(total?.count || 0),
      } satisfies CursorPage<(typeof items)[number]>;
    },
  };
}

async function jobList(db: D1Database, userId: string, url: URL) {
  const plan = jobListPlan(db, { kind: 'userId', value: userId }, url);
  const results = (await db.batch(plan.statements)) as BatchResult[];
  return plan.value(results);
}

async function jobDetail(db: D1Database, userId: string, jobId: string) {
  const row = await first<Record<string, unknown>>(
    db,
    `SELECT j.id, j.title, j.category, j.region, j.remote,
            COALESCE((SELECT json_group_array(jts.name) FROM job_tech_stacks jts WHERE jts.job_id = j.id), j.tech_stack) AS tech_stack,
            j.published_at, j.application_start_at, j.collected_at, j.deadline_at, j.rolling,
            j.summary, j.source_url,
            j.company_name, j.company_size, j.source_name, j.last_verified_at,
            sj.status AS savedStatus, sj.memo AS savedMemo, sj.bookmarked AS savedBookmarked
       FROM jobs j
       LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
      WHERE j.id = ? AND j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
        AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
        AND ${visibleJobDeadlineClause('j')}`,
    userId,
    jobId,
    nowIso(),
  );
  if (!row) throw new RouteError(404, '채용공고를 찾을 수 없습니다.');
  return serializeJobRows([row])[0];
}

const jobCategoriesStatement = (db: D1Database) =>
  db
    .prepare(
      `SELECT DISTINCT category
       FROM jobs INDEXED BY idx_jobs_active_category
      WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
        AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
        AND ${visibleJobDeadlineClause('jobs')}
      ORDER BY category LIMIT 100`,
    )
    .bind(nowIso());

const jobCategoryValues = (result: BatchResult | undefined) =>
  batchRows<{ category: string }>(result).map((row) => row.category);

async function jobCategories(db: D1Database) {
  const [result] = (await db.batch([jobCategoriesStatement(db)])) as BatchResult[];
  return jobCategoryValues(result);
}

type JobReadMode = 'data' | 'categories' | 'bootstrap';

async function fastJobRead(
  user: UserRow,
  request: Request,
  env: D1Env,
  url: URL,
  mode: JobReadMode,
) {
  const includeData = mode !== 'categories';
  const includeCategories = mode !== 'data';
  const catalogBootstrap = mode === 'bootstrap' && url.searchParams.get('catalog') === 'true';
  const window = rateLimitWindow(request.method.toUpperCase(), env, url.pathname);
  const statements = [rateLimitStatement(env.DB, user.id, window)];
  const fetchCategories = includeCategories && !catalogBootstrap;
  const categoriesIndex = fetchCategories ? statements.length : -1;
  if (fetchCategories) statements.push(jobCategoriesStatement(env.DB));
  const planUrl = catalogBootstrap ? new URL(url) : url;
  if (catalogBootstrap) {
    planUrl.search = '';
    planUrl.searchParams.set('catalog', 'true');
  }
  const plan = includeData
    ? jobListPlan(env.DB, { kind: 'userId', value: user.id }, planUrl)
    : undefined;
  const dataIndex = statements.length;
  if (plan) statements.push(...plan.statements);
  const results = (await env.DB.batch(statements)) as BatchResult[];
  assertRateLimit(Number(batchRows<CountRow>(results[0])[0]?.count || 1), window);
  const data = plan ? plan.value(results.slice(dataIndex)) : undefined;
  const categories = catalogBootstrap
    ? [
        ...new Set(
          ((Array.isArray(data) ? data : []) as Array<{ category?: unknown }>)
            .map((job) => String(job.category || ''))
            .filter(Boolean),
        ),
      ].sort((left, right) => left.localeCompare(right, 'ko'))
    : fetchCategories
      ? jobCategoryValues(results[categoriesIndex])
      : undefined;
  if (mode === 'categories') return categories || [];
  if (mode === 'data') return data;
  return {
    user: apiUser(user),
    categories: categories || [],
    data,
  };
}

type FastReadPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};

const learningDueStatement = (db: D1Database, owner: ReadOwner) =>
  db
    .prepare(
      `SELECT lp.*, u.title, s.title AS sourceTitle
         FROM learning_progress lp
         JOIN learning_units u ON u.id = lp.unit_id
         JOIN learning_sources s ON s.id = u.source_id
        WHERE lp.user_id = ${readOwnerSql(owner)} AND lp.completed = 1
          AND lp.mastered_at IS NULL AND lp.next_review_at IS NOT NULL
          AND lp.next_review_at <= ?
        ORDER BY lp.next_review_at LIMIT 100`,
    )
    .bind(owner.value, nowIso());

function collectionsReadPlan(db: D1Database, owner: ReadOwner): FastReadPlan {
  return {
    statements: [collectionTreeStatement(db, readOwnerSql(owner), owner.value)],
    value: (results) => collectionTreeValue(results[0]),
  };
}

function collectionTrashReadPlan(db: D1Database, owner: ReadOwner): FastReadPlan {
  return {
    statements: [
      db
        .prepare(
          `SELECT c.id, c.parent_id AS parentId, c.name, c.icon, c.color,
                  c.deleted_at AS deletedAt
             FROM collections c
            WHERE c.user_id = ${readOwnerSql(owner)} AND c.deleted_at IS NOT NULL
              AND (c.parent_id IS NULL OR NOT EXISTS (
                SELECT 1 FROM collections parent
                 WHERE parent.id = c.parent_id AND parent.deleted_at IS NOT NULL
              ))
            ORDER BY c.deleted_at DESC LIMIT 50`,
        )
        .bind(owner.value),
    ],
    value: (results) =>
      batchRows<Record<string, unknown>>(results[0]).map((folder) => ({
        ...folder,
        items: [],
      })),
  };
}

function fastReadPlanFor(db: D1Database, owner: ReadOwner, url: URL): FastReadPlan | undefined {
  if (url.pathname === '/api/v1/coding/problems') {
    return problemListPlan(db, owner, url.searchParams);
  }
  if (url.pathname === '/api/v1/learning') return learningListPlan(db, owner);
  const learningUnitMatch = url.pathname.match(/^\/api\/v1\/learning\/units\/([^/]+)$/);
  if (learningUnitMatch) return learningUnitDetailPlan(db, owner, learningUnitMatch[1]);
  if (url.pathname === '/api/v1/learning/due') {
    return {
      statements: [learningDueStatement(db, owner)],
      value: (results) => batchRows<Record<string, unknown>>(results[0]),
    };
  }
  if (url.pathname === '/api/v1/collections') return collectionsReadPlan(db, owner);
  if (url.pathname === '/api/v1/collections/trash') return collectionTrashReadPlan(db, owner);
  return undefined;
}

async function fastRead(user: UserRow, request: Request, env: D1Env, url: URL, plan: FastReadPlan) {
  const window = rateLimitWindow(request.method.toUpperCase(), env, url.pathname);
  const results = (await env.DB.batch([
    rateLimitStatement(env.DB, user.id, window),
    ...plan.statements,
  ])) as BatchResult[];
  assertRateLimit(Number(batchRows<CountRow>(results[0])[0]?.count || 1), window);
  return plan.value(results.slice(1));
}

type LearningListPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};

function learningListPlan(db: D1Database, owner: ReadOwner): LearningListPlan {
  const statements = [
    db
      .prepare(
        `SELECT s.id, s.title, s.subject, s.category, s.status,
                s.created_at AS createdAt, s.updated_at AS updatedAt,
                COALESCE((
                  SELECT json_group_array(json_object(
                    'id', unit.id,
                    'title', unit.title,
                    'summaryPreview', unit.summaryPreview,
                    'flashcardCount', unit.flashcardCount,
                    'questionCount', unit.questionCount,
                    'completed', unit.completed,
                    'nextReviewAt', unit.nextReviewAt
                  ))
                    FROM (
                      SELECT u.id, u.title, substr(u.summary, 1, 320) AS summaryPreview,
                             (SELECT COUNT(*) FROM flashcards f
                               WHERE f.unit_id = u.id) AS flashcardCount,
                             (SELECT COUNT(*) FROM learning_questions q
                               WHERE q.unit_id = u.id) AS questionCount,
                             lp.completed, lp.next_review_at AS nextReviewAt
                        FROM learning_units u
                        LEFT JOIN learning_progress lp ON lp.unit_id = u.id
                         AND lp.user_id = ${readOwnerSql(owner)}
                       WHERE u.source_id = s.id AND u.published = 1
                       ORDER BY u.position
                    ) AS unit
                ), '[]') AS unitsJson
           FROM learning_sources s
          WHERE s.status IN ('READY', 'UPLOADED', 'REQUIRES_MANUAL_PROCESSING')
          ORDER BY s.updated_at DESC`,
      )
      .bind(owner.value),
  ];
  return {
    statements,
    value(results) {
      return batchRows<Record<string, unknown> & { unitsJson: string }>(results[0]).map(
        ({ unitsJson, ...source }) => ({
          ...source,
          units: parseJsonArray<Record<string, unknown>>(unitsJson).map((unit) => ({
            id: unit.id,
            title: unit.title,
            summaryPreview: unit.summaryPreview,
            flashcardCount: Number(unit.flashcardCount || 0),
            questionCount: Number(unit.questionCount || 0),
            progress:
              unit.completed === null || unit.completed === undefined
                ? []
                : [
                    {
                      completed: asBoolean(unit.completed),
                      nextReviewAt: unit.nextReviewAt,
                    },
                  ],
          })),
        }),
      );
    },
  };
}

async function learningList(db: D1Database, userId: string) {
  const plan = learningListPlan(db, { kind: 'userId', value: userId });
  return plan.value((await db.batch(plan.statements)) as BatchResult[]);
}

async function fastLearningBootstrap(user: UserRow, request: Request, env: D1Env, url: URL) {
  const window = rateLimitWindow(request.method.toUpperCase(), env, url.pathname);
  const statements = [rateLimitStatement(env.DB, user.id, window)];
  const plan = learningListPlan(env.DB, { kind: 'userId', value: user.id });
  const dataIndex = statements.length;
  statements.push(...plan.statements);
  const results = (await env.DB.batch(statements)) as BatchResult[];
  assertRateLimit(Number(batchRows<CountRow>(results[0])[0]?.count || 1), window);
  return {
    user: apiUser(user),
    data: plan.value(results.slice(dataIndex)),
  };
}

function learningUnitDetailPlan(db: D1Database, owner: ReadOwner, unitId: string): FastReadPlan {
  return {
    statements: [
      db
        .prepare(
          `SELECT u.id, u.source_id AS sourceId, u.title, u.summary, u.concepts, u.visuals,
                  s.title AS sourceTitle, s.subject, s.category,
                  lp.completed, lp.next_review_at AS nextReviewAt
             FROM learning_units u
             JOIN learning_sources s ON s.id = u.source_id
             LEFT JOIN learning_progress lp ON lp.unit_id = u.id
              AND lp.user_id = ${readOwnerSql(owner)}
            WHERE u.id = ? AND u.published = 1
              AND s.status IN ('READY', 'UPLOADED', 'REQUIRES_MANUAL_PROCESSING')`,
        )
        .bind(owner.value, unitId),
      db
        .prepare(
          `SELECT id, front, back FROM flashcards
            WHERE unit_id = ? ORDER BY created_at`,
        )
        .bind(unitId),
      db
        .prepare(
          `SELECT id, prompt, type, choices FROM learning_questions
            WHERE unit_id = ? ORDER BY created_at`,
        )
        .bind(unitId),
      db
        .prepare(
          `SELECT a.id, a.question_id AS questionId, a.response, a.correct,
                  a.attempted_at AS attemptedAt
             FROM learning_questions q
             JOIN learning_question_attempts a ON a.question_id = q.id
              AND a.user_id = ${readOwnerSql(owner)}
            WHERE q.unit_id = ?
            ORDER BY a.attempted_at DESC LIMIT 100`,
        )
        .bind(owner.value, unitId),
    ],
    value(results) {
      const unit = batchRows<Record<string, unknown>>(results[0])[0];
      if (!unit) throw new RouteError(404, '학습 단원을 찾을 수 없습니다.');
      const flashcards = batchRows<Record<string, unknown>>(results[1]);
      const questions = batchRows<Record<string, unknown>>(results[2]);
      const attempts = batchRows<Record<string, unknown>>(results[3]);
      const attemptsByQuestion = new Map<string, Record<string, unknown>[]>();
      for (const attempt of attempts) {
        const questionId = String(attempt.questionId);
        attemptsByQuestion.set(questionId, [
          ...(attemptsByQuestion.get(questionId) || []),
          { ...attempt, correct: asBoolean(attempt.correct) },
        ]);
      }
      return {
        ...unit,
        concepts: parseArray(unit.concepts),
        visuals: parseJsonArray(unit.visuals),
        flashcards,
        questions: questions.map((question) => ({
          ...question,
          choices: parseArray(question.choices),
          attempts: attemptsByQuestion.get(String(question.id)) || [],
        })),
        progress:
          unit.completed === null || unit.completed === undefined
            ? []
            : [{ completed: asBoolean(unit.completed), nextReviewAt: unit.nextReviewAt }],
      };
    },
  };
}

async function learningUnitDetail(db: D1Database, userId: string, unitId: string) {
  const plan = learningUnitDetailPlan(db, { kind: 'userId', value: userId }, unitId);
  return plan.value((await db.batch(plan.statements)) as BatchResult[]);
}

async function recordLearningReview(
  db: D1Database,
  userId: string,
  unitId: string,
  rating: number,
) {
  const unit = await first<{ id: string }>(
    db,
    'SELECT id FROM learning_units WHERE id = ? AND published = 1',
    unitId,
  );
  if (!unit) throw new RouteError(404, '학습 단원을 찾을 수 없습니다.');
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await first<{
      repetitionCount: number;
      intervalDays: number;
      reviewVersion: number;
      completedAt: string | null;
    }>(
      db,
      `SELECT repetition_count AS repetitionCount, interval_days AS intervalDays,
              review_version AS reviewVersion, completed_at AS completedAt
         FROM learning_progress WHERE user_id = ? AND unit_id = ?`,
      userId,
      unitId,
    );
    const repetitionCount = rating <= 2 ? 0 : Number(current?.repetitionCount || 0) + 1;
    const previousIntervalDays = Math.max(1, Number(current?.intervalDays || 1));
    const intervalDays =
      rating <= 2
        ? 1
        : repetitionCount === 1
          ? 1
          : repetitionCount === 2
            ? 3
            : Math.max(4, previousIntervalDays * 2);
    const timestamp = nowIso();
    const nextReviewAt = new Date(Date.now() + intervalDays * 86_400_000).toISOString();
    const masteredAt = rating === 5 && repetitionCount >= 3 ? timestamp : null;
    const scheduledReviewAt = masteredAt ? null : nextReviewAt;
    const expectedVersion = Number(current?.reviewVersion || 0);
    const result = current
      ? await run(
          db,
          `UPDATE learning_progress
              SET completed = 1, understanding = ?, last_studied_at = ?, next_review_at = ?,
                  repetition_count = ?, interval_days = ?, review_version = review_version + 1,
                  completed_at = COALESCE(completed_at, ?), mastered_at = COALESCE(mastered_at, ?),
                  updated_at = ?
            WHERE user_id = ? AND unit_id = ? AND review_version = ?`,
          rating,
          timestamp,
          scheduledReviewAt,
          repetitionCount,
          intervalDays,
          timestamp,
          masteredAt,
          timestamp,
          userId,
          unitId,
          expectedVersion,
        )
      : await run(
          db,
          `INSERT INTO learning_progress
             (id, user_id, unit_id, completed, understanding, last_studied_at, next_review_at,
              repetition_count, interval_days, review_version, completed_at, mastered_at, updated_at)
           VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, 1, ?, ?, ?)
           ON CONFLICT(user_id, unit_id) DO NOTHING`,
          newId(),
          userId,
          unitId,
          rating,
          timestamp,
          scheduledReviewAt,
          repetitionCount,
          intervalDays,
          timestamp,
          masteredAt,
          timestamp,
        );
    if (Number(result.meta?.changes || 0) !== 1) continue;
    const sequence = expectedVersion + 1;
    await run(
      db,
      `INSERT INTO learning_review_events
         (id, user_id, unit_id, sequence, rating, previous_interval_days,
          next_interval_days, next_review_at, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId(),
      userId,
      unitId,
      sequence,
      rating,
      previousIntervalDays,
      intervalDays,
      nextReviewAt,
      timestamp,
    );
    return {
      userId,
      unitId,
      completed: true,
      mastered: Boolean(masteredAt),
      nextReviewAt: scheduledReviewAt,
      repetitionCount,
      intervalDays,
      reviewVersion: sequence,
    };
  }
  throw new RouteError(
    409,
    '동시에 복습 기록이 변경되었습니다. 다시 시도해주세요.',
    'REVIEW_CONFLICT',
  );
}

async function handleRoute(request: Request, env: D1Env, user: UserRow, url: URL) {
  const db = env.DB;
  const path = url.pathname.replace(/^\/api\/v1/, '') || '/';
  const method = request.method.toUpperCase();

  if (
    path === '/coding/rankings' ||
    path.startsWith('/coding/solutions') ||
    path.startsWith('/coding/comments') ||
    path.startsWith('/notifications')
  ) {
    throw new RouteError(404, '더 이상 제공하지 않는 기능입니다.', 'ROUTE_RETIRED');
  }

  if (method === 'GET' && path === '/auth/me') return { user: apiUser(user) };
  if (method === 'GET' && path === '/auth/profile') return profile(db, user.id);
  if (method === 'POST' && path === '/auth/onboarding') {
    const body = await readJson(request);
    const displayName = cleanText(body.displayName);
    const preferredLanguage = cleanText(body.preferredLanguage);
    if (displayName.length < 2 || displayName.length > 80) {
      throw new RouteError(400, '이름은 2~80자여야 합니다.');
    }
    if (!codeLanguages.has(preferredLanguage)) {
      throw new RouteError(400, '지원하는 코드 언어를 선택해주세요.');
    }
    const timestamp = nowIso();
    await run(
      db,
      `UPDATE users SET display_name = ?, preferred_language = ?,
         onboarding_completed_at = ?, updated_at = ? WHERE id = ?`,
      displayName,
      preferredLanguage,
      timestamp,
      timestamp,
      user.id,
    );
    await audit(db, user.id, 'ONBOARDING_COMPLETED', 'User', user.id);
    const completed = await first<UserRow>(db, `${userSelect} WHERE id = ?`, user.id);
    if (!completed) throw new RouteError(404, '사용자를 찾을 수 없습니다.');
    return apiUser(completed);
  }
  if (method === 'PATCH' && path === '/auth/profile') {
    const body = await readJson(request);
    const displayName = cleanText(body.displayName);
    if (displayName.length < 2 || displayName.length > 80) {
      throw new RouteError(400, '표시 이름은 2~80자여야 합니다.');
    }
    const preferredLanguage = cleanText(body.preferredLanguage);
    if (!codeLanguages.has(preferredLanguage)) {
      throw new RouteError(400, '지원하는 코드 언어를 선택해주세요.');
    }
    const avatarUrl = cleanText(body.avatarUrl);
    if (avatarUrl) {
      let parsedAvatar: URL;
      try {
        parsedAvatar = new URL(avatarUrl);
      } catch {
        throw new RouteError(422, '프로필 이미지는 올바른 https URL이어야 합니다.');
      }
      if (parsedAvatar.protocol !== 'https:') {
        throw new RouteError(422, '프로필 이미지는 https URL만 허용됩니다.');
      }
    }
    const githubUsername = cleanText(body.githubUsername);
    if (githubUsername && !/^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/.test(githubUsername)) {
      throw new RouteError(422, 'GitHub 사용자명 형식이 올바르지 않습니다.');
    }
    const timestamp = nowIso();
    await run(
      db,
      `UPDATE users SET display_name = ?, avatar_url = ?, github_username = ?,
         preferred_language = ?, updated_at = ? WHERE id = ?`,
      displayName,
      avatarUrl || null,
      githubUsername || null,
      preferredLanguage,
      timestamp,
      user.id,
    );
    await audit(db, user.id, 'PROFILE_UPDATED', 'User', user.id);
    return profile(db, user.id);
  }
  if (method === 'GET' && path === '/auth/users') {
    requireAdmin(user);
    return all<Record<string, unknown>>(
      db,
      `SELECT id, email, display_name AS displayName, role, is_active AS isActive,
              created_at AS createdAt FROM users ORDER BY display_name`,
    ).then((rows) => rows.map((row) => ({ ...row, isActive: asBoolean(row.isActive) })));
  }
  const adminUserMatch = path.match(/^\/auth\/users\/([^/]+)$/);
  if (adminUserMatch && method === 'PATCH') {
    requireAdmin(user);
    if (adminUserMatch[1] === user.id)
      throw new RouteError(409, '현재 로그인한 관리자 계정은 여기서 변경할 수 없습니다.');
    const body = await readJson(request);
    const role = cleanText(body.role);
    if (!['ADMIN', 'MEMBER'].includes(role))
      throw new RouteError(422, '역할은 ADMIN 또는 MEMBER여야 합니다.');
    if (typeof body.isActive !== 'boolean') throw new RouteError(422, '활성 상태가 필요합니다.');
    const result = await run(
      db,
      'UPDATE users SET role = ?, is_active = ?, updated_at = ? WHERE id = ?',
      role,
      body.isActive ? 1 : 0,
      nowIso(),
      adminUserMatch[1],
    );
    if (Number(result.meta?.changes || 0) !== 1)
      throw new RouteError(404, '변경할 사용자를 찾을 수 없습니다.');
    await audit(db, user.id, 'USER_ACCESS_UPDATED', 'User', adminUserMatch[1], {
      role,
      isActive: body.isActive,
    });
    return { id: adminUserMatch[1], role, isActive: body.isActive };
  }

  if (method === 'GET' && path === '/collections') return collections(db, user.id);
  if (method === 'GET' && path === '/collections/trash') {
    const trashed = await all<Record<string, unknown>>(
      db,
      `SELECT c.id, c.parent_id AS parentId, c.name, c.icon, c.color,
              c.deleted_at AS deletedAt
         FROM collections c
        WHERE c.user_id = ? AND c.deleted_at IS NOT NULL
          AND (c.parent_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM collections parent
             WHERE parent.id = c.parent_id AND parent.deleted_at IS NOT NULL
          ))
        ORDER BY c.deleted_at DESC LIMIT 50`,
      user.id,
    );
    return trashed.map((folder) => ({ ...folder, items: [] }));
  }
  if (method === 'POST' && path === '/collections') {
    const body = await readJson(request);
    const name = cleanText(body.name);
    if (!name || name.length > 80) throw new RouteError(400, '폴더 이름이 필요합니다.');
    const parentId = typeof body.parentId === 'string' && body.parentId ? body.parentId : null;
    if (parentId) {
      const parent = await first<{ parentId: string | null }>(
        db,
        'SELECT parent_id AS parentId FROM collections WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        parentId,
        user.id,
      );
      if (!parent) throw new RouteError(404, '상위 폴더를 찾을 수 없습니다.');
      if (parent.parentId) throw new RouteError(400, '최대 2단계 폴더만 지원합니다.');
    }
    const count = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM collections WHERE user_id = ? AND parent_id IS ? AND deleted_at IS NULL',
      user.id,
      parentId,
    );
    const timestamp = nowIso();
    const id = newId();
    await run(
      db,
      `INSERT INTO collections
         (id, user_id, parent_id, name, icon, color, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      user.id,
      parentId,
      name,
      cleanText(body.icon, 'folder'),
      cleanText(body.color, 'amber'),
      Number(count?.count || 0),
      timestamp,
      timestamp,
    );
    return {
      id,
      parentId,
      name,
      icon: cleanText(body.icon, 'folder'),
      color: cleanText(body.color, 'amber'),
      position: Number(count?.count || 0),
      items: [],
    };
  }
  if (method === 'PATCH' && path === '/collections/reorder') {
    const body = await readJson(request);
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length || new Set(ids).size !== ids.length)
      throw new RouteError(400, '정렬할 폴더 ID가 필요합니다.');
    const placeholders = ids.map(() => '?').join(',');
    const owned = await all<{ id: string; parentId: string | null }>(
      db,
      `SELECT id, parent_id AS parentId FROM collections
        WHERE user_id = ? AND deleted_at IS NULL AND id IN (${placeholders})`,
      user.id,
      ...ids,
    );
    if (owned.length !== ids.length)
      throw new RouteError(403, '다른 사용자의 폴더는 이동할 수 없습니다.');
    const parentIds = new Set(owned.map((folder) => folder.parentId || 'ROOT'));
    if (parentIds.size !== 1)
      throw new RouteError(422, '같은 상위 폴더의 항목만 정렬할 수 있습니다.');
    const parentId = owned[0]?.parentId || null;
    const siblings = await all<{ id: string }>(
      db,
      `SELECT id FROM collections
        WHERE user_id = ? AND parent_id IS ? AND deleted_at IS NULL`,
      user.id,
      parentId,
    );
    if (siblings.length !== ids.length || siblings.some((folder) => !ids.includes(folder.id))) {
      throw new RouteError(409, '현재 형제 폴더 전체 목록으로 다시 정렬해주세요.', 'STALE_REORDER');
    }
    await db.batch(
      ids.map((id, position) =>
        db
          .prepare('UPDATE collections SET position = ?, updated_at = ? WHERE id = ?')
          .bind(position, nowIso(), id),
      ),
    );
    return { ok: true };
  }
  const collectionRestoreMatch = path.match(/^\/collections\/([^/]+)\/restore$/);
  if (collectionRestoreMatch && method === 'POST') {
    const current = await first<{ id: string; parentId: string | null; deletedAt: string }>(
      db,
      `SELECT id, parent_id AS parentId, deleted_at AS deletedAt
         FROM collections WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`,
      collectionRestoreMatch[1],
      user.id,
    );
    if (!current) throw new RouteError(404, '삭제된 폴더를 찾을 수 없습니다.');
    if (current.parentId) {
      const parent = await first<{ deletedAt: string | null }>(
        db,
        'SELECT deleted_at AS deletedAt FROM collections WHERE id = ? AND user_id = ?',
        current.parentId,
        user.id,
      );
      if (!parent || parent.deletedAt)
        throw new RouteError(409, '상위 폴더를 먼저 복원해주세요.', 'PARENT_DELETED');
    }
    const timestamp = nowIso();
    await db.batch([
      db
        .prepare(
          `WITH RECURSIVE subtree(id) AS (
             SELECT id FROM collections WHERE id = ? AND user_id = ?
             UNION ALL
             SELECT c.id FROM collections c JOIN subtree s ON c.parent_id = s.id
              WHERE c.user_id = ? AND c.deleted_at = ?
           )
           UPDATE collections SET deleted_at = NULL, updated_at = ?
            WHERE id IN (SELECT id FROM subtree)`,
        )
        .bind(current.id, user.id, user.id, current.deletedAt, timestamp),
    ]);
    return { id: current.id, restored: true };
  }
  const collectionMatch = path.match(/^\/collections\/([^/]+)$/);
  if (collectionMatch && method === 'PATCH') {
    const current = await first<Record<string, unknown>>(
      db,
      'SELECT * FROM collections WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      collectionMatch[1],
      user.id,
    );
    if (!current) throw new RouteError(404, '폴더를 찾을 수 없습니다.');
    const body = await readJson(request);
    const name = body.name === undefined ? String(current.name) : cleanText(body.name);
    if (!name || name.length > 80) throw new RouteError(400, '폴더 이름은 1~80자여야 합니다.');
    let parentId = current.parent_id as string | null;
    if (Object.hasOwn(body, 'parentId')) {
      parentId = typeof body.parentId === 'string' && body.parentId ? body.parentId : null;
      if (parentId === collectionMatch[1]) {
        throw new RouteError(409, '폴더를 자기 자신 안으로 이동할 수 없습니다.');
      }
      if (parentId) {
        const parent = await first<{ id: string; parentId: string | null }>(
          db,
          `SELECT id, parent_id AS parentId FROM collections
            WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
          parentId,
          user.id,
        );
        if (!parent) throw new RouteError(404, '이동할 상위 폴더를 찾을 수 없습니다.');
        if (parent.parentId) throw new RouteError(422, '최대 2단계 폴더만 지원합니다.');
        const child = await first<{ id: string }>(
          db,
          `SELECT id FROM collections
            WHERE parent_id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1`,
          collectionMatch[1],
          user.id,
        );
        if (child) {
          throw new RouteError(422, '하위 폴더가 있는 폴더는 다른 폴더 안으로 이동할 수 없습니다.');
        }
        const descendant = await first<{ id: string }>(
          db,
          `WITH RECURSIVE descendants(id) AS (
             SELECT id FROM collections WHERE parent_id = ? AND user_id = ? AND deleted_at IS NULL
             UNION ALL
             SELECT c.id FROM collections c JOIN descendants d ON c.parent_id = d.id
              WHERE c.user_id = ? AND c.deleted_at IS NULL
           ) SELECT id FROM descendants WHERE id = ?`,
          collectionMatch[1],
          user.id,
          user.id,
          parentId,
        );
        if (descendant) throw new RouteError(409, '하위 폴더 안으로 이동할 수 없습니다.');
      }
    }
    await run(
      db,
      'UPDATE collections SET name = ?, icon = ?, color = ?, parent_id = ?, updated_at = ? WHERE id = ?',
      name,
      body.icon === undefined ? current.icon : cleanText(body.icon, 'folder'),
      body.color === undefined ? current.color : cleanText(body.color, 'amber'),
      parentId,
      nowIso(),
      collectionMatch[1],
    );
    return { ...current, name, parentId, items: [] };
  }
  if (collectionMatch && method === 'DELETE') {
    const current = await first<{ id: string }>(
      db,
      'SELECT id FROM collections WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      collectionMatch[1],
      user.id,
    );
    if (!current) throw new RouteError(404, '폴더를 찾을 수 없습니다.');
    const timestamp = nowIso();
    await db.batch([
      db
        .prepare(
          `WITH RECURSIVE subtree(id) AS (
             SELECT id FROM collections WHERE id = ? AND user_id = ? AND deleted_at IS NULL
             UNION ALL
             SELECT c.id FROM collections c JOIN subtree s ON c.parent_id = s.id
              WHERE c.user_id = ? AND c.deleted_at IS NULL
           )
           UPDATE collections SET deleted_at = ?, updated_at = ?
            WHERE id IN (SELECT id FROM subtree)`,
        )
        .bind(collectionMatch[1], user.id, user.id, timestamp, timestamp),
    ]);
    return { ok: true };
  }
  const collectionItemMatch = path.match(/^\/collections\/([^/]+)\/items$/);
  if (collectionItemMatch && method === 'POST') {
    const owned = await first<{ id: string }>(
      db,
      'SELECT id FROM collections WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      collectionItemMatch[1],
      user.id,
    );
    if (!owned) throw new RouteError(404, '폴더를 찾을 수 없습니다.');
    const body = await readJson(request);
    const itemType = cleanText(body.itemType);
    const targetId = cleanText(body.targetId);
    if (!itemType || !targetId) throw new RouteError(400, '저장할 항목 정보가 필요합니다.');
    const allowedItemTypes = new Set([
      'EXTERNAL_LINK',
      'JOB_POSTING',
      'CODING_PROBLEM',
      'LEARNING_UNIT',
    ]);
    if (!allowedItemTypes.has(itemType)) {
      throw new RouteError(422, '지원하지 않는 폴더 항목 유형입니다.');
    }
    let targetExists = false;
    if (itemType === 'EXTERNAL_LINK') {
      try {
        targetExists = ['http:', 'https:'].includes(new URL(targetId).protocol);
      } catch {
        targetExists = false;
      }
    } else {
      const targetQueries: Record<string, string> = {
        JOB_POSTING: 'SELECT id FROM jobs WHERE id = ?',
        CODING_PROBLEM: 'SELECT id FROM coding_problems WHERE id = ? AND active = 1',
        LEARNING_UNIT: 'SELECT id FROM learning_units WHERE id = ? AND published = 1',
      };
      targetExists = Boolean(await first(db, targetQueries[itemType]!, targetId));
    }
    if (!targetExists) throw new RouteError(404, '저장할 원본 항목을 찾을 수 없습니다.');
    const count = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM collection_items WHERE collection_id = ?',
      owned.id,
    );
    const id = newId();
    try {
      await run(
        db,
        `INSERT INTO collection_items
           (id, collection_id, item_type, target_id, label, position, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        owned.id,
        itemType,
        targetId,
        cleanText(body.label) || null,
        Number(count?.count || 0),
        nowIso(),
      );
    } catch (error) {
      if (String(error).includes('UNIQUE'))
        throw new RouteError(409, '이미 이 폴더에 저장된 항목입니다.');
      throw error;
    }
    return { id, collectionId: owned.id, itemType, targetId, label: cleanText(body.label) || null };
  }
  const collectionItemDeleteMatch = path.match(/^\/collections\/([^/]+)\/items\/([^/]+)$/);
  const collectionItemReorderMatch = path.match(/^\/collections\/([^/]+)\/items\/reorder$/);
  if (collectionItemReorderMatch && method === 'PATCH') {
    const body = await readJson(request);
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length || new Set(ids).size !== ids.length)
      throw new RouteError(422, '중복 없는 전체 항목 순서가 필요합니다.');
    const owned = await all<{ id: string }>(
      db,
      `SELECT ci.id FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
        WHERE ci.collection_id = ? AND c.user_id = ? AND c.deleted_at IS NULL
        ORDER BY ci.position`,
      collectionItemReorderMatch[1],
      user.id,
    );
    if (owned.length !== ids.length || owned.some((item) => !ids.includes(item.id)))
      throw new RouteError(409, '현재 폴더의 전체 항목 순서와 일치하지 않습니다.');
    await db.batch(
      ids.map((id, position) =>
        db
          .prepare('UPDATE collection_items SET position = ? WHERE id = ? AND collection_id = ?')
          .bind(position, id, collectionItemReorderMatch[1]),
      ),
    );
    return { ids };
  }
  if (collectionItemDeleteMatch && method === 'PATCH') {
    const body = await readJson(request);
    const targetCollectionId = cleanText(body.targetCollectionId);
    const target = await first<{ id: string }>(
      db,
      'SELECT id FROM collections WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      targetCollectionId,
      user.id,
    );
    const item = await first<{ id: string }>(
      db,
      `SELECT ci.id FROM collection_items ci JOIN collections c ON c.id = ci.collection_id
        WHERE ci.id = ? AND ci.collection_id = ? AND c.user_id = ? AND c.deleted_at IS NULL`,
      collectionItemDeleteMatch[2],
      collectionItemDeleteMatch[1],
      user.id,
    );
    if (!target || !item) throw new RouteError(404, '이동할 폴더 항목을 찾을 수 없습니다.');
    const count = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM collection_items WHERE collection_id = ?',
      targetCollectionId,
    );
    try {
      await run(
        db,
        'UPDATE collection_items SET collection_id = ?, position = ? WHERE id = ?',
        targetCollectionId,
        Number(count?.count || 0),
        item.id,
      );
    } catch (error) {
      if (String(error).includes('UNIQUE'))
        throw new RouteError(409, '대상 폴더에 이미 같은 항목이 있습니다.');
      throw error;
    }
    return { id: item.id, collectionId: targetCollectionId };
  }
  if (collectionItemDeleteMatch && method === 'DELETE') {
    const result = await run(
      db,
      `DELETE FROM collection_items
        WHERE id = ? AND collection_id = ?
          AND EXISTS (
            SELECT 1 FROM collections c
             WHERE c.id = collection_items.collection_id AND c.user_id = ?
               AND c.deleted_at IS NULL
          )`,
      collectionItemDeleteMatch[2],
      collectionItemDeleteMatch[1],
      user.id,
    );
    if (Number(result.meta?.changes || 0) !== 1) {
      throw new RouteError(404, '저장된 폴더 항목을 찾을 수 없습니다.');
    }
    return new Response(null, { status: 204 });
  }

  if (method === 'GET' && path === '/dashboard') {
    return dashboard(db, user.id);
  }
  if (method === 'GET' && path === '/search') {
    const query = cleanText(url.searchParams.get('q'));
    if (query.length < 2) throw new RouteError(400, '검색어는 2자 이상이어야 합니다.');
    const limit = cursorLimit(url.searchParams, 30, 60);
    const cursor = decodeCursor<{ rank?: unknown; rowid?: unknown }>(
      url.searchParams.get('cursor'),
    );
    const cursorRank = Number(cursor?.rank);
    const cursorRowid = int(cursor?.rowid, 0);
    if (cursor && (!Number.isFinite(cursorRank) || cursorRowid < 1)) {
      throw new RouteError(400, '올바른 검색 cursor가 필요합니다.', 'INVALID_CURSOR');
    }
    const match = ftsMatchQuery(query);
    if (!match) throw new RouteError(400, '검색 가능한 문자를 입력해주세요.');
    const rows = await all<{
      kind: string;
      id: string;
      title: string;
      snippet: string;
      rank: number;
      searchRowid: number;
    }>(
      db,
      `SELECT rowid AS searchRowid, kind, entity_id AS id, title,
              snippet(workspace_search, 4, '', '', ' … ', 18) AS snippet,
              rank
         FROM workspace_search
        WHERE workspace_search MATCH ? AND (owner_id = '' OR owner_id = ?)
          AND kind <> 'solutions'
          AND (
            kind <> 'jobs' OR EXISTS (
              SELECT 1 FROM jobs j
               WHERE j.id = workspace_search.entity_id
                 AND j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
                 AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
                 AND ${visibleJobDeadlineClause('j')}
            )
          )
          ${cursor ? 'AND (rank > ? OR (rank = ? AND rowid > ?))' : ''}
        ORDER BY rank ASC LIMIT ?`,
      match,
      user.id,
      nowIso(),
      ...(cursor ? [cursorRank, cursorRank, cursorRowid] : []),
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const grouped: Record<string, Array<Record<string, unknown>>> = {
      folders: [],
      jobs: [],
      problems: [],
      learning: [],
    };
    const groupName = (kind: string) => (kind === 'codingProblems' ? 'problems' : kind);
    const href = (kind: string, id: string) =>
      kind === 'folders'
        ? `/?folder=${id}`
        : kind === 'jobs'
          ? `/jobs?job=${id}`
          : kind === 'codingProblems'
            ? `/coding?problem=${id}`
            : `/learning?unit=${id}`;
    for (const row of pageRows) {
      const group = groupName(row.kind);
      grouped[group]?.push({
        id: row.id,
        title: row.title,
        snippet: row.snippet,
        href: href(row.kind, row.id),
      });
    }
    return {
      query,
      ...grouped,
      nextCursor:
        hasMore && pageRows.length
          ? encodeCursor({ rank: pageRows.at(-1)?.rank, rowid: pageRows.at(-1)?.searchRowid })
          : null,
    };
  }

  if (method === 'GET' && path === '/coding/problems')
    return problems(db, user.id, url.searchParams);
  const codingProblemDetailMatch = path.match(/^\/coding\/problems\/([^/]+)$/);
  if (codingProblemDetailMatch && method === 'GET') {
    return problemDetail(db, user.id, codingProblemDetailMatch[1]);
  }
  if (method === 'POST' && path === '/coding/problems') {
    requireAdmin(user);
    const body = await readJson(request);
    let sourceUrl: URL;
    try {
      sourceUrl = new URL(cleanText(body.sourceUrl));
    } catch {
      throw new RouteError(400, '올바른 문제 URL이 필요합니다.');
    }
    if (
      sourceUrl.protocol !== 'https:' ||
      sourceUrl.hostname !== 'school.programmers.co.kr' ||
      !sourceUrl.pathname.includes('/learn/courses/')
    ) {
      throw new RouteError(400, '허용된 프로그래머스 문제 링크가 아닙니다.');
    }
    sourceUrl.search = '';
    sourceUrl.hash = '';
    const id = newId();
    const timestamp = nowIso();
    const count = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM coding_problems',
    );
    const track = cleanText(body.track, 'ALGORITHM');
    if (!['ALGORITHM', 'SQL'].includes(track)) {
      throw new RouteError(400, '문제 유형은 ALGORITHM 또는 SQL이어야 합니다.');
    }
    await run(
      db,
      `INSERT INTO coding_problems (id, source_url, display_title, level, track, tags, position, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      sourceUrl.toString(),
      cleanText(body.displayTitle),
      int(body.level, 1),
      track,
      JSON.stringify(Array.isArray(body.tags) ? body.tags.map(String) : []),
      Number(count?.count || 0),
      timestamp,
      timestamp,
    );
    await audit(db, user.id, 'CODING_PROBLEM_CREATED', 'CodingProblem', id);
    return {
      id,
      sourceUrl: sourceUrl.toString(),
      displayTitle: cleanText(body.displayTitle),
      level: int(body.level, 1),
      track,
      tags: Array.isArray(body.tags) ? body.tags : [],
    };
  }
  const favoriteMatch = path.match(/^\/coding\/problems\/([^/]+)\/favorite$/);
  if (favoriteMatch && method === 'PATCH') {
    const body = await readJson(request);
    const problem = await first<{ id: string }>(
      db,
      'SELECT id FROM coding_problems WHERE id = ? AND active = 1',
      favoriteMatch[1],
    );
    if (!problem) throw new RouteError(404, '문제를 찾을 수 없습니다.');
    if (!Object.hasOwn(body, 'favorite')) {
      throw new RouteError(422, '즐겨찾기 상태가 필요합니다.', 'VALIDATION_FAILED');
    }
    const favorite = bool(body.favorite);
    await run(
      db,
      `INSERT INTO problem_progress (id, user_id, problem_id, status, favorite, memo, updated_at)
       VALUES (?, ?, ?, 'UNTRIED', ?, '', ?)
       ON CONFLICT(user_id, problem_id) DO UPDATE SET
         favorite = excluded.favorite, updated_at = excluded.updated_at`,
      newId(),
      user.id,
      favoriteMatch[1],
      favorite ? 1 : 0,
      nowIso(),
    );
    return { problemId: favoriteMatch[1], favorite };
  }
  if (method === 'GET' && path === '/coding/daily-challenge') return dailyChallenge(db, user.id);
  if (method === 'GET' && path === '/coding/daily-challenges') return dailyChallenges(db, user.id);
  if (method === 'POST' && path === '/coding/daily-challenge/reselect') {
    requireAdmin(user);
    const body = await readJson(request);
    const problemId = cleanText(body.problemId);
    const confirmKstDate = cleanText(body.confirmKstDate);
    if (confirmKstDate !== kstDate())
      throw new RouteError(400, '오늘 KST 날짜를 정확히 입력해야 합니다.');
    const participation = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM daily_challenge_participations p JOIN daily_challenges c ON c.id = p.challenge_id WHERE c.kst_date = ?',
      confirmKstDate,
    );
    if (Number(participation?.count || 0) > 0)
      throw new RouteError(409, '참여 기록이 있어 재선정할 수 없습니다.');
    const challenge = await dailyChallenge(db, user.id);
    const selectedProblem = await first<{ id: string; level: number; track: string }>(
      db,
      'SELECT id, level, track FROM coding_problems WHERE id = ? AND active = 1',
      problemId,
    );
    if (!selectedProblem) throw new RouteError(404, '활성 문제를 찾을 수 없습니다.');
    if (selectedProblem.track !== 'ALGORITHM' || selectedProblem.level !== challenge.levelSlot) {
      throw new RouteError(
        422,
        `오늘의 Lv. ${challenge.levelSlot} 알고리즘 문제만 선택할 수 있습니다.`,
        'VALIDATION_FAILED',
      );
    }
    await run(
      db,
      'UPDATE daily_challenges SET problem_id = ? WHERE id = ?',
      selectedProblem.id,
      challenge.id,
    );
    await audit(db, user.id, 'DAILY_CHALLENGE_RESELECTED', 'DailyChallenge', challenge.id, {
      problemId,
    });
    return dailyChallenge(db, user.id);
  }

  if (method === 'GET' && path === '/jobs/categories') return jobCategories(db);
  if (method === 'GET' && path === '/jobs') return jobList(db, user.id, url);
  const jobDetailMatch = path.match(/^\/jobs\/([^/]+)$/);
  if (jobDetailMatch && method === 'GET') return jobDetail(db, user.id, jobDetailMatch[1]);
  const savedJobMatch = path.match(/^\/jobs\/([^/]+)\/(application|bookmark)$/);
  if ((method === 'POST' && path === '/jobs/saved') || (method === 'PATCH' && savedJobMatch)) {
    const body = await readJson(request);
    const jobId = savedJobMatch?.[1] || cleanText(body.jobId);
    const job = await first<{ id: string }>(db, 'SELECT id FROM jobs WHERE id = ?', jobId);
    if (!job) throw new RouteError(404, '채용공고를 찾을 수 없습니다.');
    const current = await first<{
      status: string;
      memo: string;
      bookmarked: number | boolean;
    }>(
      db,
      `SELECT status, memo, bookmarked FROM saved_jobs
        WHERE user_id = ? AND job_id = ?`,
      user.id,
      jobId,
    );
    const intent = savedJobMatch?.[2];
    const hasStatus =
      intent === 'application' ? Object.hasOwn(body, 'status') : Object.hasOwn(body, 'status');
    const hasMemo =
      intent === 'application' ? Object.hasOwn(body, 'memo') : Object.hasOwn(body, 'memo');
    const hasBookmarked = intent === 'bookmark' || Object.hasOwn(body, 'bookmarked');
    const status = hasStatus
      ? parseApplicationStatus(body.status)
      : current?.status || 'INTERESTED';
    const memo = hasMemo ? sourceText(body.memo) : current?.memo || '';
    const bookmarked = hasBookmarked
      ? bool(body.bookmarked)
      : current
        ? asBoolean(current.bookmarked)
        : true;
    const timestamp = nowIso();
    await run(
      db,
      `INSERT INTO saved_jobs
         (id, user_id, job_id, status, bookmarked, memo, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, job_id) DO UPDATE SET
         status = excluded.status, bookmarked = excluded.bookmarked,
         memo = excluded.memo, updated_at = excluded.updated_at`,
      newId(),
      user.id,
      jobId,
      status,
      bookmarked ? 1 : 0,
      memo,
      timestamp,
      timestamp,
    );
    return { jobId, status, memo, bookmarked };
  }
  if (method === 'POST' && path === '/jobs/import/preview') {
    return previewJobImport(db, user, await readJson(request));
  }
  if (method === 'POST' && path === '/jobs/import/commit') {
    return commitJobImport(db, user, await readJson(request));
  }
  if (
    method === 'POST' &&
    (path === '/jobs/import/file/preview' || path === '/jobs/import/file/commit')
  ) {
    requireAdmin(user);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new RouteError(400, 'JSON 파일이 필요합니다.');
    if (!file.name.toLowerCase().endsWith('.json'))
      throw new RouteError(400, 'Sites 운영 import는 JSON 파일을 지원합니다.');
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new RouteError(400, '올바른 JSON 파일이 아닙니다.');
    }
    if (path.endsWith('/preview')) return previewJobImport(db, user, parsed);
    throw new RouteError(
      409,
      '파일을 다시 보내지 말고 미리보기 token으로 승인해주세요.',
      'PREVIEW_TOKEN_REQUIRED',
    );
  }

  if (method === 'GET' && path === '/learning') return learningList(db, user.id);
  const learningUnitMatch = path.match(/^\/learning\/units\/([^/]+)$/);
  if (learningUnitMatch && method === 'GET') {
    return learningUnitDetail(db, user.id, learningUnitMatch[1]);
  }
  const learningAnswerMatch = path.match(/^\/learning\/questions\/([^/]+)\/answer$/);
  if (learningAnswerMatch && method === 'POST') {
    const body = await readJson(request);
    const response = sourceText(body.response).trim();
    if (!response || response.length > 4_000) {
      throw new RouteError(400, '답안을 1~4,000자로 입력해주세요.');
    }
    const question = await first<{ id: string; answer: string; type: string; choices: string }>(
      db,
      `SELECT q.id, q.answer, q.type, q.choices FROM learning_questions q
        JOIN learning_units u ON u.id = q.unit_id
       WHERE q.id = ? AND u.published = 1`,
      learningAnswerMatch[1],
    );
    if (!question) throw new RouteError(404, '복습 문제를 찾을 수 없습니다.');
    const normalizeAnswer = (value: string) =>
      value.normalize('NFKC').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');
    const choices = parseArray(question.choices);
    if (question.type === 'MULTIPLE_CHOICE' && !choices.includes(response)) {
      throw new RouteError(422, '제공된 선택지 중 하나를 골라주세요.');
    }
    const correct = normalizeAnswer(response) === normalizeAnswer(question.answer);
    const attemptedAt = nowIso();
    const id = newId();
    await run(
      db,
      `INSERT INTO learning_question_attempts
         (id, user_id, question_id, response, correct, attempted_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      user.id,
      question.id,
      response,
      correct ? 1 : 0,
      attemptedAt,
    );
    return { id, questionId: question.id, response, correct, answer: question.answer, attemptedAt };
  }
  if (method === 'GET' && path === '/learning/due') {
    return all(
      db,
      `SELECT lp.*, u.title, s.title AS sourceTitle
         FROM learning_progress lp
         JOIN learning_units u ON u.id = lp.unit_id
         JOIN learning_sources s ON s.id = u.source_id
        WHERE lp.user_id = ? AND lp.completed = 1 AND lp.mastered_at IS NULL
          AND lp.next_review_at IS NOT NULL AND lp.next_review_at <= ?
        ORDER BY lp.next_review_at LIMIT 100`,
      user.id,
      nowIso(),
    );
  }
  if (method === 'POST' && path === '/learning/review') {
    const body = await readJson(request);
    const unitId = cleanText(body.unitId);
    const rating = int(body.rating, 0);
    if (!unitId || rating < 1 || rating > 5) {
      throw new RouteError(422, '복습 평가는 1~5 사이의 정수여야 합니다.');
    }
    return recordLearningReview(db, user.id, unitId, rating);
  }
  if (method === 'POST' && path === '/learning/import/preview') {
    return previewLearningImport(db, user, await readJson(request));
  }
  if (method === 'POST' && path === '/learning/import/commit') {
    return commitLearningImport(db, user, await readJson(request));
  }
  if (method === 'GET' && path === '/admin/overview') {
    requireAdmin(user);
    const [active, batches] = await Promise.all([
      first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM users WHERE is_active = 1'),
      all(
        db,
        'SELECT id, created_at AS createdAt, original_count AS originalCount, rejected_count AS rejectedCount FROM import_batches ORDER BY created_at DESC LIMIT 10',
      ),
    ]);
    return {
      activeUsers: Number(active?.count || 0),
      maxActiveUsers: Math.max(1, int(env.MAX_ACTIVE_USERS, 100_000)),
      importBatches: batches,
    };
  }
  if (method === 'GET' && path === '/admin/audit-logs') {
    requireAdmin(user);
    const rows = await all<Record<string, unknown>>(
      db,
      `SELECT a.id, a.action, a.target_type AS targetType, a.target_id AS targetId, a.metadata, a.created_at AS createdAt, u.display_name AS actorDisplayName, u.email AS actorEmail FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT 200`,
    );
    return rows.map((row) => ({
      ...row,
      metadata: parseObject(row.metadata),
      actor: row.actorDisplayName
        ? { displayName: row.actorDisplayName, email: row.actorEmail }
        : undefined,
    }));
  }
  if (method === 'GET' && path === '/admin/daily-challenge-setting') {
    requireAdmin(user);
    const row = await first<Record<string, unknown>>(
      db,
      'SELECT allowed_levels AS allowedLevels, repeat_exclusion_days AS repeatExclusionDays, allow_repeat_relaxation AS allowRepeatRelaxation FROM daily_challenge_settings WHERE id = 1',
    );
    return {
      allowedLevels: parseArray(row?.allowedLevels || '[1,2]').map(Number),
      repeatExclusionDays: Number(row?.repeatExclusionDays || 60),
      allowRepeatRelaxation: asBoolean(row?.allowRepeatRelaxation),
    };
  }
  if (method === 'PATCH' && path === '/admin/daily-challenge-setting') {
    requireAdmin(user);
    const body = await readJson(request);
    const allowedLevels = Array.isArray(body.allowedLevels)
      ? body.allowedLevels
          .map(Number)
          .filter((value) => Number.isInteger(value) && value >= 0 && value <= 5)
      : [];
    if (!allowedLevels.length) throw new RouteError(400, '허용 난이도가 하나 이상 필요합니다.');
    const repeatExclusionDays = Math.min(365, Math.max(0, int(body.repeatExclusionDays, 60)));
    const allowRepeatRelaxation = bool(body.allowRepeatRelaxation);
    await run(
      db,
      `INSERT INTO daily_challenge_settings (id, allowed_levels, repeat_exclusion_days, allow_repeat_relaxation, updated_at) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET allowed_levels = excluded.allowed_levels, repeat_exclusion_days = excluded.repeat_exclusion_days, allow_repeat_relaxation = excluded.allow_repeat_relaxation, updated_at = excluded.updated_at`,
      JSON.stringify(allowedLevels),
      repeatExclusionDays,
      allowRepeatRelaxation ? 1 : 0,
      nowIso(),
    );
    await audit(db, user.id, 'DAILY_CHALLENGE_SETTING_UPDATED', 'DailyChallengeSetting', '1', {
      allowedLevels,
      repeatExclusionDays,
      allowRepeatRelaxation,
    });
    return { allowedLevels, repeatExclusionDays, allowRepeatRelaxation };
  }

  throw new RouteError(404, 'API 경로를 찾을 수 없습니다.', 'NOT_FOUND');
}

export async function handleD1Api(request: Request, env: D1Env) {
  const requestId = request.headers.get('x-request-id') || newId();
  const url = new URL(request.url);
  const startedAt = performance.now();
  const finish = (response: Response) => {
    const durationMs = Math.max(0, performance.now() - startedAt);
    const headers = new Headers(response.headers);
    headers.set('x-request-id', requestId);
    headers.set('server-timing', `app;dur=${durationMs.toFixed(1)}`);
    headers.set('x-response-time-ms', durationMs.toFixed(1));
    if (env.REQUEST_LOGGING !== 'false') {
      console.info('D1 API request completed', {
        requestId,
        method: request.method,
        route: routeRateKey(request.method, url.pathname),
        status: response.status,
        durationMs: Number(durationMs.toFixed(1)),
      });
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
  try {
    if (url.pathname === '/api/v1/health/live') {
      const ready = await first<{ ok: number }>(env.DB, 'SELECT 1 AS ok');
      return finish(
        responseJson(
          { status: ready?.ok === 1 ? 'ok' : 'unavailable', database: 'd1' },
          ready?.ok === 1 ? 200 : 503,
          requestId,
        ),
      );
    }
    if (url.pathname === '/api/v1/health' || url.pathname === '/api/v1/health/ready') {
      const schema = await readRuntimeSchema(env.DB);
      const canary = schema.ready
        ? await first<{ jobs: number; problems: number; learning: number; searchRows: number }>(
            env.DB,
            `SELECT
               (SELECT COUNT(*) FROM jobs
                 WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
                   AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
                   AND ${visibleJobDeadlineClause('jobs')}) AS jobs,
               (SELECT COUNT(*) FROM coding_problems WHERE active = 1) AS problems,
               (SELECT COUNT(*) FROM learning_units WHERE published = 1) AS learning,
               (SELECT COUNT(*) FROM workspace_search) AS searchRows`,
            nowIso(),
          )
        : null;
      const ready = schema.ready && Boolean(canary);
      return finish(
        responseJson(
          { status: ready ? 'ok' : 'not-ready', database: 'd1', schema, canary },
          ready ? 200 : 503,
          requestId,
        ),
      );
    }
    if (url.pathname === '/api/v1/auth/config') {
      if (request.method !== 'GET') {
        throw new RouteError(405, 'GET 요청만 허용됩니다.', 'METHOD_NOT_ALLOWED', undefined, {
          allow: 'GET',
        });
      }
      return finish(
        responseJson(
          {
            provider: 'GOOGLE',
            clientId: env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID,
            identityScriptUrl: 'https://accounts.google.com/gsi/client',
            jwksUrl: GOOGLE_JWKS_URL,
          },
          200,
          requestId,
        ),
      );
    }
    if (url.pathname === '/api/v1/internal/slack-digest') {
      if (request.method !== 'GET') {
        throw new RouteError(405, 'GET 요청만 허용됩니다.', 'METHOD_NOT_ALLOWED', undefined, {
          allow: 'GET',
        });
      }
      await requireDigestToken(request, env);
      return finish(responseJson(await slackDigest(env.DB, url), 200, requestId));
    }
    if (url.pathname === '/api/v1/internal/slack-digest/claim') {
      if (request.method !== 'POST') {
        throw new RouteError(405, 'POST 요청만 허용됩니다.', 'METHOD_NOT_ALLOWED', undefined, {
          allow: 'POST',
        });
      }
      await requireDigestToken(request, env);
      return finish(
        responseJson(await claimSlackDigest(env.DB, url, await readJson(request)), 200, requestId),
      );
    }
    if (url.pathname === '/api/v1/internal/slack-digest/complete') {
      if (request.method !== 'POST') {
        throw new RouteError(405, 'POST 요청만 허용됩니다.', 'METHOD_NOT_ALLOWED', undefined, {
          allow: 'POST',
        });
      }
      await requireDigestToken(request, env);
      return finish(
        responseJson(
          await settleSlackDigestDelivery(env.DB, await readJson(request), 'SENT'),
          200,
          requestId,
        ),
      );
    }
    if (url.pathname === '/api/v1/internal/slack-digest/fail') {
      if (request.method !== 'POST') {
        throw new RouteError(405, 'POST 요청만 허용됩니다.', 'METHOD_NOT_ALLOWED', undefined, {
          allow: 'POST',
        });
      }
      await requireDigestToken(request, env);
      const body = await readJson(request);
      const outcome = body.uncertain === true ? 'UNCERTAIN' : 'FAILED';
      return finish(
        responseJson(await settleSlackDigestDelivery(env.DB, body, outcome), 200, requestId),
      );
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/auth/google') {
      const body = await readJson(request);
      const credential = cleanText(body.credential);
      let identity: GoogleIdentity;
      try {
        identity = await verifyGoogleCredential(
          credential,
          env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID,
        );
      } catch (error) {
        console.warn('Google credential verification failed', {
          requestId,
          reason: error instanceof Error ? error.message : 'UNKNOWN',
        });
        throw new RouteError(
          401,
          'Google 로그인 정보를 확인하지 못했습니다. 다시 시도해주세요.',
          'GOOGLE_LOGIN_FAILED',
        );
      }
      const user = await resolveGoogleUser(identity, env);
      const cookie = await createSession(env.DB, user.id, env.AUTH_TEST_MODE !== 'true');
      return finish(
        responseJson({ user: apiUser(user) }, 200, requestId, { 'set-cookie': cookie }),
      );
    }
    if (
      request.method === 'POST' &&
      url.pathname === '/api/v1/auth/test' &&
      env.AUTH_TEST_MODE === 'true'
    ) {
      const body = await readJson(request);
      const subject = cleanText(body.subject);
      const email = cleanText(body.email).toLowerCase();
      const displayName = cleanText(body.displayName);
      if (
        !subject ||
        subject.length > 255 ||
        !email ||
        email.length > 320 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        throw new RouteError(400, '테스트 Google 사용자 정보가 올바르지 않습니다.');
      }
      const user = await resolveGoogleUser(
        { subject, email, displayName: (displayName || email.split('@')[0] || email).slice(0, 80) },
        env,
      );
      const cookie = await createSession(env.DB, user.id, false);
      return finish(
        responseJson({ user: apiUser(user) }, 200, requestId, { 'set-cookie': cookie }),
      );
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/auth/logout') {
      return finish(await logoutSession(request, env));
    }
    const user = await resolveSessionUser(request, env);
    if (request.method.toUpperCase() === 'GET' && url.pathname === '/api/v1/bootstrap') {
      return finish(
        responseJson(
          await bootstrap(user, env, url.searchParams.get('home') === '1'),
          200,
          requestId,
        ),
      );
    }
    if (request.method.toUpperCase() === 'GET') {
      const fastJobMode =
        url.pathname === '/api/v1/jobs'
          ? 'data'
          : url.pathname === '/api/v1/jobs/categories'
            ? 'categories'
            : url.pathname === '/api/v1/jobs/bootstrap'
              ? 'bootstrap'
              : undefined;
      if (fastJobMode) {
        return finish(
          responseJson(await fastJobRead(user, request, env, url, fastJobMode), 200, requestId),
        );
      }
      if (url.pathname === '/api/v1/learning/bootstrap') {
        return finish(
          responseJson(await fastLearningBootstrap(user, request, env, url), 200, requestId),
        );
      }
      const readPlan = fastReadPlanFor(env.DB, { kind: 'userId', value: user.id }, url);
      if (readPlan) {
        return finish(
          responseJson(await fastRead(user, request, env, url, readPlan), 200, requestId),
        );
      }
    }
    await enforceRateLimit(request, env, user.id, url.pathname);
    const result = await handleRoute(request, env, user, url);
    return finish(result instanceof Response ? result : responseJson(result, 200, requestId));
  } catch (error) {
    if (error instanceof RouteError) {
      return finish(
        responseJson(
          { code: error.code, message: error.message, details: error.details, requestId },
          error.status,
          requestId,
          error.headers,
        ),
      );
    }
    if (error instanceof DomainValidationError) {
      return finish(
        responseJson(
          {
            code: 'VALIDATION_FAILED',
            message: error.message,
            details: error.details,
            requestId,
          },
          422,
          requestId,
        ),
      );
    }
    const message = error instanceof Error ? error.message : '알 수 없는 데이터베이스 오류';
    console.error('D1 API request failed', {
      requestId,
      method: request.method,
      path: url.pathname,
      message,
    });
    return finish(
      responseJson(
        { code: 'DATABASE_ERROR', message: '데이터 요청을 처리하지 못했습니다.', requestId },
        500,
        requestId,
      ),
    );
  }
}
