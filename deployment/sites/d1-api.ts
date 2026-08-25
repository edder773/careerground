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
import {
  canonicalJobUrl,
  DomainValidationError,
  jobFingerprint,
  normalizedText,
  parseApplicationStatus,
  parseImportCommit,
  parseJobPackage,
  parseLearningPackage,
  parseProblemStatus,
  sha256,
  sourceText,
} from './domain.js';
import { inspectRuntimeSchema } from './runtime-schema.js';
import {
  clearSessionCookie,
  GOOGLE_CLIENT_ID,
  hashSessionToken,
  newSessionToken,
  SESSION_TTL_SECONDS,
  sessionCookie,
  sessionTokenFrom,
  verifyGoogleCredential,
  type GoogleIdentity,
} from './google-auth.js';

type D1Env = {
  DB: D1Database;
  ADMIN_EMAILS?: string;
  AUTH_TEST_MODE?: string;
  DIGEST_API_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  MAX_ACTIVE_USERS?: string;
  RATE_LIMIT_READS_PER_MINUTE?: string;
  RATE_LIMIT_WRITES_PER_MINUTE?: string;
  REQUEST_LOGGING?: string;
};

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: number | boolean;
  avatarUrl: string | null;
  githubUsername: string | null;
  preferredLanguage: string;
  onboardingCompletedAt: string | null;
  rankingOptIn: number | boolean;
  commentNotifications: number | boolean;
  deadlineNotifications: number | boolean;
  reviewNotifications: number | boolean;
  dataDeletionRequested: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  preferredLanguage: string;
  onboardingCompleted: boolean;
};

const codeLanguages = new Set(['python', 'java', 'javascript', 'cpp']);
const solutionLanguages = new Set([...codeLanguages, 'sql']);

class RouteError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = 'REQUEST_FAILED',
    readonly details?: unknown,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
  }
}

const userSelect = `
  SELECT users.id, users.email, users.display_name AS displayName, users.role,
         users.is_active AS isActive, users.avatar_url AS avatarUrl,
         users.github_username AS githubUsername,
         users.preferred_language AS preferredLanguage,
         users.onboarding_completed_at AS onboardingCompletedAt,
         users.ranking_opt_in AS rankingOptIn,
         users.comment_notifications AS commentNotifications,
         users.deadline_notifications AS deadlineNotifications,
         users.review_notifications AS reviewNotifications,
         users.data_deletion_requested AS dataDeletionRequested,
         users.created_at AS createdAt, users.updated_at AS updatedAt
  FROM users`;

const responseJson = (
  body: unknown,
  status = 200,
  requestId?: string,
  extraHeaders: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(requestId ? { 'x-request-id': requestId } : {}),
      ...extraHeaders,
    },
  });

const cleanText = normalizedText;

const bool = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback);

const int = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

type CursorPage<T> = { items: T[]; nextCursor: string | null; total: number };

const cursorPageRequested = (search: URLSearchParams) => search.get('page') === 'cursor';
const cursorLimit = (search: URLSearchParams, fallback: number, maximum: number) =>
  Math.min(maximum, Math.max(1, int(search.get('limit'), fallback)));
const ftsMatchQuery = (query: string) =>
  query
    .replace(/["*:^{}()[\]]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((token) => `"${token}"*`)
    .join(' AND ');
const encodeCursor = (value: Record<string, unknown>) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};
const decodeCursor = <T extends Record<string, unknown>>(value: string | null): T | null => {
  if (!value) return null;
  try {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
  }
};

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new RouteError(400, '올바른 JSON 요청 본문이 필요합니다.', 'INVALID_JSON');
  }
}

const apiUser = (row: UserRow): ApiUser => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  role: row.role,
  preferredLanguage: row.preferredLanguage,
  onboardingCompleted: Boolean(row.onboardingCompletedAt),
});

const adminEmails = (env: D1Env) =>
  new Set(
    (env.ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

async function audit(
  db: D1Database,
  actorId: string | null,
  action: string,
  targetType: string,
  targetId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  await run(
    db,
    `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    actorId,
    action,
    targetType,
    targetId || null,
    JSON.stringify(metadata),
    nowIso(),
  );
}

async function resolveGoogleUser(identity: GoogleIdentity, env: D1Env): Promise<UserRow> {
  const db = env.DB;
  let row = await first<UserRow>(
    db,
    `${userSelect}
       JOIN auth_identities identity ON identity.user_id = users.id
      WHERE identity.provider = 'GOOGLE' AND identity.provider_subject = ?`,
    identity.subject,
  );
  const allowedAdmins = adminEmails(env);
  const timestamp = nowIso();
  if (!row) {
    const sameEmail = await first<UserRow>(
      db,
      `${userSelect} WHERE users.email = ?`,
      identity.email,
    );
    if (sameEmail) {
      throw new RouteError(
        409,
        '이 이메일은 다른 Google 계정에 연결되어 있습니다.',
        'GOOGLE_IDENTITY_CONFLICT',
      );
    }
    const maxActiveUsers = Math.max(1, int(env.MAX_ACTIVE_USERS, 100_000));
    const role = allowedAdmins.has(identity.email) ? 'ADMIN' : 'MEMBER';
    const id = newId();
    const capacity = await first<{ allowed: number }>(
      db,
      `SELECT CASE WHEN ? = 'ADMIN' OR
             (SELECT COUNT(*) FROM users WHERE is_active = 1) < ?
           THEN 1 ELSE 0 END AS allowed`,
      role,
      maxActiveUsers,
    );
    if (capacity?.allowed !== 1) {
      throw new RouteError(403, '현재 활성 사용자 한도에 도달했습니다.', 'USER_LIMIT_REACHED');
    }
    await db.batch([
      db
        .prepare(
          `INSERT INTO users
             (id, email, display_name, role, preferred_language, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'javascript', ?, ?)`,
        )
        .bind(id, identity.email, identity.displayName, role, timestamp, timestamp),
      db
        .prepare(
          `INSERT INTO auth_identities
             (id, user_id, provider, provider_subject, email, created_at, updated_at)
           VALUES (?, ?, 'GOOGLE', ?, ?, ?, ?)`,
        )
        .bind(newId(), id, identity.subject, identity.email, timestamp, timestamp),
      db
        .prepare(
          `INSERT INTO notifications
             (id, user_id, type, title, message, href, dedupe_key, created_at)
           VALUES (?, ?, 'SYSTEM', ?, ?, '/', ?, ?)`,
        )
        .bind(
          newId(),
          id,
          'CareerGround에 오신 것을 환영합니다',
          'Google 계정으로 개인 워크스페이스가 준비되었습니다.',
          `welcome:${id}`,
          timestamp,
        ),
      db
        .prepare(
          `INSERT INTO audit_logs
             (id, actor_id, action, target_type, target_id, metadata, created_at)
           VALUES (?, ?, 'GOOGLE_ACCOUNT_CREATED', 'User', ?, ?, ?)`,
        )
        .bind(newId(), id, id, JSON.stringify({ provider: 'google', role }), timestamp),
    ]);
    row = await first<UserRow>(db, `${userSelect} WHERE users.id = ?`, id);
  } else {
    if (!asBoolean(row.isActive)) throw new RouteError(403, '비활성화된 계정입니다.');
    const role = row.role === 'ADMIN' || allowedAdmins.has(identity.email) ? 'ADMIN' : 'MEMBER';
    const statements = [
      db
        .prepare('UPDATE users SET email = ?, role = ?, updated_at = ? WHERE id = ?')
        .bind(identity.email, role, timestamp, row.id),
      db
        .prepare(
          `UPDATE auth_identities SET email = ?, updated_at = ?
            WHERE provider = 'GOOGLE' AND provider_subject = ?`,
        )
        .bind(identity.email, timestamp, identity.subject),
    ];
    if (row.role !== role) {
      statements.push(
        db
          .prepare(
            `INSERT INTO audit_logs
               (id, actor_id, action, target_type, target_id, metadata, created_at)
             VALUES (?, ?, 'USER_ROLE_SYNCED', 'User', ?, ?, ?)`,
          )
          .bind(
            newId(),
            row.id,
            row.id,
            JSON.stringify({ from: row.role, to: role, source: 'ADMIN_EMAILS' }),
            timestamp,
          ),
      );
    }
    await db.batch(statements);
    row = await first<UserRow>(db, `${userSelect} WHERE users.id = ?`, row.id);
  }
  if (!row) throw new RouteError(500, '사용자 정보를 준비하지 못했습니다.');
  return row;
}

async function resolveSessionUser(request: Request, env: D1Env): Promise<UserRow> {
  const token = sessionTokenFrom(request);
  if (!token) throw new RouteError(401, 'Google 로그인이 필요합니다.', 'UNAUTHORIZED');
  const tokenHash = await hashSessionToken(token);
  const row = await first<UserRow>(
    env.DB,
    `${userSelect}
       JOIN auth_sessions session ON session.user_id = users.id
      WHERE session.token_hash = ? AND session.expires_at > ?`,
    tokenHash,
    nowIso(),
  );
  if (!row) throw new RouteError(401, '로그인 세션이 만료되었습니다.', 'UNAUTHORIZED');
  if (!asBoolean(row.isActive)) throw new RouteError(403, '비활성화된 계정입니다.');
  return row;
}

async function createSession(db: D1Database, userId: string, secure: boolean) {
  const token = newSessionToken();
  const tokenHash = await hashSessionToken(token);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await run(
    db,
    `INSERT INTO auth_sessions
       (id, user_id, token_hash, expires_at, last_seen_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    newId(),
    userId,
    tokenHash,
    expiresAt,
    createdAt,
    createdAt,
  );
  return sessionCookie(token, secure);
}

async function logoutSession(request: Request, env: D1Env) {
  const token = sessionTokenFrom(request);
  if (token) {
    await run(
      env.DB,
      'DELETE FROM auth_sessions WHERE token_hash = ?',
      await hashSessionToken(token),
    );
  }
  return responseJson({ ok: true }, 200, undefined, {
    'set-cookie': clearSessionCookie(env.AUTH_TEST_MODE !== 'true'),
  });
}

function requireAdmin(user: UserRow) {
  if (user.role !== 'ADMIN') throw new RouteError(403, '관리자 권한이 필요합니다.', 'FORBIDDEN');
}

const routeRateKey = (method: string, pathname: string) =>
  `${method}:${pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
    '/:id',
  )}`;

type RateLimitWindow = {
  limit: number;
  now: number;
  routeKey: string;
  windowStart: number;
};

const rateLimitWindow = (method: string, env: D1Env, path: string): RateLimitWindow => {
  const now = Date.now();
  const configured =
    method === 'GET'
      ? int(env.RATE_LIMIT_READS_PER_MINUTE, 240)
      : int(env.RATE_LIMIT_WRITES_PER_MINUTE, 60);
  return {
    limit: Math.max(
      1,
      Math.min(10_000, path.includes('/import/') ? Math.min(10, configured) : configured),
    ),
    now,
    routeKey: routeRateKey(method, path),
    windowStart: Math.floor(now / 60_000),
  };
};

const assertRateLimit = (count: number, window: RateLimitWindow) => {
  if (count <= window.limit) return;
  const retryAfter = Math.max(1, 60 - Math.floor((window.now % 60_000) / 1000));
  throw new RouteError(
    429,
    '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'RATE_LIMITED',
    { limit: window.limit, windowSeconds: 60, retryAfter },
    { 'retry-after': String(retryAfter) },
  );
};

async function enforceRateLimit(request: Request, env: D1Env, userId: string, path: string) {
  const method = request.method.toUpperCase();
  const window = rateLimitWindow(method, env, path);
  const row = await first<{ count: number }>(
    env.DB,
    `INSERT INTO request_rate_limits (user_id, route_key, window_start, count, updated_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, route_key, window_start)
     DO UPDATE SET count = request_rate_limits.count + 1, updated_at = excluded.updated_at
     RETURNING count`,
    userId,
    window.routeKey,
    window.windowStart,
    new Date(window.now).toISOString(),
  );
  const count = Number(row?.count || 1);
  if (count === 1) {
    await run(
      env.DB,
      'DELETE FROM request_rate_limits WHERE window_start < ?',
      window.windowStart - 2,
    );
  }
  assertRateLimit(count, window);
}

const rateLimitStatement = (db: D1Database, userId: string, window: RateLimitWindow) =>
  db
    .prepare(
      `INSERT INTO request_rate_limits (user_id, route_key, window_start, count, updated_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(user_id, route_key, window_start)
       DO UPDATE SET count = request_rate_limits.count + 1, updated_at = excluded.updated_at
       RETURNING count`,
    )
    .bind(userId, window.routeKey, window.windowStart, new Date(window.now).toISOString());

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

const unreadCountSql = `SELECT COUNT(*) AS count FROM notifications
                         WHERE user_id = ? AND read_at IS NULL
                           AND type <> 'LEARNING_REVIEW'
                           AND (expires_at IS NULL OR expires_at > ?)`;

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
           WHERE status = 'ACTIVE' AND created_at >= ?) AS recentJobs,
         (SELECT COUNT(*) FROM saved_jobs sj JOIN jobs j ON j.id = sj.job_id
           WHERE sj.user_id = ${ownerSql} AND j.status = 'ACTIVE'
             AND j.deadline_at BETWEEN ? AND ?) AS expiringJobs`,
    )
    .bind(range.weekAgo, ownerValue, range.now, range.weekAhead);

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

async function ensureDeadlineNotifications(db: D1Database) {
  const now = new Date();
  const todayKst = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now) + 'T00:00:00+09:00',
  );
  const results = await db.batch(
    [1, 3, 7].map((days) => {
      const from = new Date(todayKst.getTime() + days * 86_400_000).toISOString();
      const to = new Date(todayKst.getTime() + (days + 1) * 86_400_000).toISOString();
      return db
        .prepare(
          `INSERT INTO notifications
             (id, user_id, type, title, message, href, dedupe_key, expires_at, created_at)
           SELECT lower(hex(randomblob(16))), sj.user_id, 'JOB_DEADLINE', ?, j.title,
                  '/jobs?job=' || j.id,
                  'job-deadline:' || j.id || ':' || j.deadline_at || ':d-${days}',
                  datetime(j.deadline_at, '+7 days'), ?
             FROM saved_jobs sj
             JOIN jobs j ON j.id = sj.job_id
             JOIN users u ON u.id = sj.user_id
            WHERE sj.bookmarked = 1 AND j.status = 'ACTIVE' AND u.is_active = 1
              AND u.deadline_notifications = 1
              AND j.deadline_at >= ? AND j.deadline_at < ?
           ON CONFLICT(user_id, dedupe_key) DO NOTHING`,
        )
        .bind(`관심 공고 마감 D-${days}`, now.toISOString(), from, to);
    }),
  );
  return results.reduce((sum, result) => sum + Number(result.meta?.changes || 0), 0);
}

export async function runScheduledMaintenance(env: D1Env) {
  const db = env.DB;
  const ownerId = newId();
  const startedAt = nowIso();
  const leaseUntil = new Date(Date.now() + 4 * 60_000).toISOString();
  const lease = await first<{ ownerId: string }>(
    db,
    `INSERT INTO scheduler_leases (name, owner_id, lease_until, updated_at)
     VALUES ('notifications-and-expiry', ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       owner_id = excluded.owner_id, lease_until = excluded.lease_until,
       updated_at = excluded.updated_at
     WHERE scheduler_leases.lease_until <= excluded.updated_at
     RETURNING owner_id AS ownerId`,
    ownerId,
    leaseUntil,
    startedAt,
  );
  if (lease?.ownerId !== ownerId) return { acquired: false, expiredJobs: 0, notifications: 0 };
  let notifications = 0;
  try {
    const [expired] = await db.batch([
      db
        .prepare(
          `UPDATE jobs SET status = 'EXPIRED', updated_at = ?
            WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN') AND rolling = 0
              AND deadline_at IS NOT NULL AND deadline_at < ?`,
        )
        .bind(startedAt, startedAt),
      db
        .prepare('DELETE FROM request_rate_limits WHERE window_start < ?')
        .bind(Math.floor(Date.now() / 60_000) - 2),
      db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(startedAt),
    ]);
    notifications += await ensureDeadlineNotifications(db);
    return {
      acquired: true,
      expiredJobs: Number(expired.meta?.changes || 0),
      notifications,
      completedAt: nowIso(),
    };
  } finally {
    await run(
      db,
      'DELETE FROM scheduler_leases WHERE name = ? AND owner_id = ?',
      'notifications-and-expiry',
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
    preference: {
      commentNotifications: asBoolean(row.commentNotifications),
      deadlineNotifications: asBoolean(row.deadlineNotifications),
      reviewNotifications: asBoolean(row.reviewNotifications),
    },
  };
}

type ProblemRow = {
  id: string;
  sourceUrl: string;
  displayTitle: string;
  level: number;
  track: 'ALGORITHM' | 'SQL';
  tags: string;
  status: string | null;
  favorite: number | boolean | null;
  solutionCount: number;
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
  const scope = search.get('scope');
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
  if (scope === 'solved') {
    clauses.push("pp.status = 'SOLVED'");
    countClauses.push(
      `EXISTS (SELECT 1 FROM problem_progress counted_progress
                WHERE counted_progress.problem_id = counted.id
                  AND counted_progress.user_id = ${readOwnerSql(owner)}
                  AND counted_progress.status = 'SOLVED')`,
    );
    countValues.push(owner.value);
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
                pp.status, pp.favorite,
                (SELECT COUNT(*) FROM solutions s WHERE s.problem_id = p.id AND s.deleted_at IS NULL) AS solutionCount
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
        progress: row.status ? [{ status: row.status, favorite: asBoolean(row.favorite) }] : [],
        _count: { solutions: Number(row.solutionCount || 0) },
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
            p.level, p.track, p.tags, p.position, pp.status, pp.favorite,
            (SELECT COUNT(*) FROM solutions s
              WHERE s.problem_id = p.id AND s.deleted_at IS NULL) AS solutionCount
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
    progress: row.status ? [{ status: row.status, favorite: asBoolean(row.favorite) }] : [],
    _count: { solutions: Number(row.solutionCount || 0) },
  };
}

const kstDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const kstDayBounds = (date: string) => {
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start.getTime() + 86_400_000);
  return { start: start.toISOString(), end: end.toISOString() };
};

async function secureTokenMatch(actual: string, expected: string) {
  const [actualHash, expectedHash] = await Promise.all([sha256(actual), sha256(expected)]);
  let difference = actualHash.length ^ expectedHash.length;
  const length = Math.max(actualHash.length, expectedHash.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (actualHash.charCodeAt(index) || 0) ^ (expectedHash.charCodeAt(index) || 0);
  }
  return difference === 0;
}

async function requireDigestToken(request: Request, env: D1Env) {
  const expected = cleanText(env.DIGEST_API_TOKEN);
  if (!expected) {
    throw new RouteError(
      503,
      '일일 알림 인증이 구성되지 않았습니다.',
      'DIGEST_AUTH_NOT_CONFIGURED',
    );
  }
  const authorization = request.headers.get('authorization') || '';
  const actual = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!actual || !(await secureTokenMatch(actual, expected))) {
    throw new RouteError(401, '일일 알림 인증에 실패했습니다.', 'DIGEST_UNAUTHORIZED');
  }
}

type DailyChallengeRow = {
  id: string;
  problemId: string;
  levelSlot: number;
  createdAt: string;
  sourceUrl: string;
  displayTitle: string;
  level: number;
  track: 'ALGORITHM' | 'SQL';
  tags: string;
  status: string | null;
  favorite: number | boolean | null;
  solutionCount: number;
};

const dailyChallengeRowsSql = `SELECT dc.id, dc.problem_id AS problemId,
                                      dc.level_slot AS levelSlot, dc.created_at AS createdAt,
                                      p.source_url AS sourceUrl,
                                      p.display_title AS displayTitle, p.level, p.track, p.tags,
                                      pp.status, pp.favorite,
                                      (SELECT COUNT(*) FROM solutions s
                                        WHERE s.problem_id = p.id AND s.deleted_at IS NULL)
                                        AS solutionCount
                                 FROM daily_challenges dc
                                 JOIN coding_problems p ON p.id = dc.problem_id AND p.active = 1
                                 LEFT JOIN problem_progress pp
                                   ON pp.problem_id = p.id AND pp.user_id = ?
                                WHERE dc.kst_date = ? AND dc.level_slot IN (1, 2, 34)
                                ORDER BY CASE dc.level_slot
                                           WHEN 1 THEN 1 WHEN 2 THEN 2 ELSE 3 END`;

type DailyChallengeSettingRow = {
  allowedLevels: string;
  repeatExclusionDays: number;
  allowRepeatRelaxation: number | boolean;
};

const dailyChallengeSettingSql = `SELECT allowed_levels AS allowedLevels,
                                          repeat_exclusion_days AS repeatExclusionDays,
                                          allow_repeat_relaxation AS allowRepeatRelaxation
                                     FROM daily_challenge_settings WHERE id = 1`;

const dailyChallengeConfiguration = (setting?: DailyChallengeSettingRow) => {
  const configuredLevels = parseArray(setting?.allowedLevels || '[1,2]')
    .map(Number)
    .filter((level) => Number.isInteger(level) && level >= 0 && level <= 5);
  const algorithmLevels = configuredLevels.length ? configuredLevels : [1, 2];
  return {
    specs: [
      { levelSlot: 1, track: 'ALGORITHM' as const, levels: [algorithmLevels[0] ?? 1] },
      {
        levelSlot: 2,
        track: 'ALGORITHM' as const,
        levels: [algorithmLevels[1] ?? algorithmLevels[0] ?? 2],
      },
      { levelSlot: 34, track: 'SQL' as const, levels: [3, 4] },
    ],
    repeatExclusionDays: Math.max(0, Number(setting?.repeatExclusionDays ?? 60)),
    allowRepeatRelaxation: asBoolean(setting?.allowRepeatRelaxation),
  };
};

const dailyChallengeValue = (row: DailyChallengeRow) => ({
  id: row.id,
  problemId: row.problemId,
  levelSlot: row.levelSlot,
  createdAt: row.createdAt,
  problem: {
    id: row.problemId,
    sourceUrl: row.sourceUrl,
    displayTitle: row.displayTitle,
    level: row.level,
    track: row.track,
    tags: parseArray(row.tags),
    progress: row.status ? [{ status: row.status, favorite: asBoolean(row.favorite) }] : [],
    _count: { solutions: Number(row.solutionCount || 0) },
  },
});

const hasEveryDailyChallenge = (rows: DailyChallengeRow[]) => {
  const slots = new Set(rows.map((row) => Number(row.levelSlot)));
  return [1, 2, 34].every((levelSlot) => slots.has(levelSlot));
};

const seededCandidateIndex = (value: string, candidateCount: number) => {
  let seed = 0x811c9dc5;
  for (const character of value) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  return seed % candidateCount;
};

async function selectMissingDailyChallenges(
  db: D1Database,
  today: string,
  existingRows: DailyChallengeRow[],
  setting?: DailyChallengeSettingRow,
) {
  const existingSlots = new Set(existingRows.map((row) => Number(row.levelSlot)));
  const configuration = dailyChallengeConfiguration(setting);
  const missing = configuration.specs.filter((spec) => !existingSlots.has(spec.levelSlot));
  if (!missing.length) return;
  const cutoff = new Date(`${today}T00:00:00.000Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - configuration.repeatExclusionDays);
  const candidateIndexes: Array<{ strict: number; relaxed?: number }> = [];
  const candidateStatements = [];
  for (const spec of missing) {
    const placeholders = spec.levels.map(() => '?').join(', ');
    const sql = `SELECT id FROM coding_problems
                  WHERE active = 1 AND track = ? AND level IN (${placeholders})
                    AND id NOT IN (
                      SELECT problem_id FROM daily_challenges WHERE kst_date >= ?
                    )
                  ORDER BY position, id`;
    const strict = candidateStatements.length;
    candidateStatements.push(
      db.prepare(sql).bind(spec.track, ...spec.levels, cutoff.toISOString().slice(0, 10)),
    );
    let relaxed: number | undefined;
    if (configuration.allowRepeatRelaxation) {
      relaxed = candidateStatements.length;
      candidateStatements.push(db.prepare(sql).bind(spec.track, ...spec.levels, today));
    }
    candidateIndexes.push({ strict, relaxed });
  }
  const candidateResults = await db.batch<{ id: string }>(candidateStatements);
  const timestamp = nowIso();
  const inserts = missing.map((spec, index) => {
    const resultIndexes = candidateIndexes[index]!;
    let candidates = candidateResults[resultIndexes.strict]?.results || [];
    if (!candidates.length && resultIndexes.relaxed !== undefined) {
      candidates = candidateResults[resultIndexes.relaxed]?.results || [];
    }
    if (!candidates.length) {
      throw new RouteError(
        404,
        `오늘의 ${spec.track === 'SQL' ? 'SQL Lv. 3~4' : `Lv. ${spec.levelSlot}`} 문제 후보가 없습니다.`,
      );
    }
    const selected =
      candidates[
        seededCandidateIndex(
          `${today}:${spec.track}:${spec.levelSlot}:${spec.levels.join('-')}`,
          candidates.length,
        )
      ]!;
    return db
      .prepare(
        `INSERT OR IGNORE INTO daily_challenges
           (id, kst_date, level_slot, problem_id, created_at) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(newId(), today, spec.levelSlot, selected.id, timestamp);
  });
  await db.batch(inserts);
}

async function dailyChallengeRows(db: D1Database, userId: string, today: string) {
  return all<DailyChallengeRow>(db, dailyChallengeRowsSql, userId, today);
}

async function completeDailyChallenges(
  db: D1Database,
  userId: string,
  today: string,
  rows: DailyChallengeRow[],
  setting?: DailyChallengeSettingRow,
) {
  if (!hasEveryDailyChallenge(rows)) {
    setting ??= (await first<DailyChallengeSettingRow>(db, dailyChallengeSettingSql)) || undefined;
    await selectMissingDailyChallenges(db, today, rows, setting);
    rows = await dailyChallengeRows(db, userId, today);
  }
  if (!hasEveryDailyChallenge(rows)) {
    throw new RouteError(500, '오늘의 문제를 준비하지 못했습니다.');
  }
  return rows.map(dailyChallengeValue);
}

async function dailyChallenges(db: D1Database, userId: string) {
  const today = kstDate();
  const rows = await dailyChallengeRows(db, userId, today);
  return completeDailyChallenges(db, userId, today, rows);
}

async function dailyChallenge(db: D1Database, userId: string) {
  const challenges = await dailyChallenges(db, userId);
  const challenge = challenges.find((value) => value.levelSlot === 1);
  if (!challenge) throw new RouteError(500, '오늘의 문제를 준비하지 못했습니다.');
  return challenge;
}

type SlackChallengeRow = {
  problemId: string;
  sourceUrl: string;
  displayTitle: string;
  level: number;
  track: 'ALGORITHM';
};

const slackChallengeSql = `SELECT p.id AS problemId, p.source_url AS sourceUrl,
                                   p.display_title AS displayTitle, p.level, p.track
                              FROM daily_challenges dc
                              JOIN coding_problems p ON p.id = dc.problem_id AND p.active = 1
                             WHERE dc.kst_date = ? AND dc.level_slot = 3
                             LIMIT 1`;

async function slackLv3Challenge(db: D1Database, today: string) {
  let selected = await first<SlackChallengeRow>(db, slackChallengeSql, today);
  if (!selected) {
    const setting =
      (await first<DailyChallengeSettingRow>(db, dailyChallengeSettingSql)) || undefined;
    const configuration = dailyChallengeConfiguration(setting);
    const cutoff = new Date(`${today}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - configuration.repeatExclusionDays);
    const candidateSql = `SELECT id FROM coding_problems
                            WHERE active = 1 AND track = 'ALGORITHM' AND level = 3
                              AND id NOT IN (
                                SELECT problem_id FROM daily_challenges WHERE kst_date >= ?
                              )
                            ORDER BY position, id`;
    let candidates = await all<{ id: string }>(db, candidateSql, cutoff.toISOString().slice(0, 10));
    if (!candidates.length && configuration.allowRepeatRelaxation) {
      candidates = await all<{ id: string }>(db, candidateSql, today);
    }
    if (!candidates.length) {
      throw new RouteError(404, 'Slack 도전 문제로 사용할 알고리즘 Lv.3 후보가 없습니다.');
    }
    const candidate =
      candidates[seededCandidateIndex(`${today}:SLACK:ALGORITHM:3`, candidates.length)]!;
    await db
      .prepare(
        `INSERT INTO daily_challenges
           (id, kst_date, level_slot, problem_id, created_at) VALUES (?, ?, 3, ?, ?)
         ON CONFLICT(kst_date, level_slot) DO UPDATE SET
           problem_id = excluded.problem_id, created_at = excluded.created_at`,
      )
      .bind(newId(), today, candidate.id, nowIso())
      .run();
    selected = await first<SlackChallengeRow>(db, slackChallengeSql, today);
  }
  if (!selected) throw new RouteError(500, 'Slack 도전 문제를 준비하지 못했습니다.');
  return selected;
}

async function slackDigest(db: D1Database, requestUrl: URL) {
  const today = kstDate();
  const rows = await dailyChallengeRows(db, '', today);
  const challenges = await completeDailyChallenges(db, '', today, rows);
  const advancedChallenge = await slackLv3Challenge(db, today);
  const { start, end } = kstDayBounds(today);
  const snapshotCreatedAtInput = cleanText(requestUrl.searchParams.get('snapshotCreatedAt'));
  let snapshotCreatedAt: string | null = null;
  if (snapshotCreatedAtInput) {
    const parsed = new Date(snapshotCreatedAtInput);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== snapshotCreatedAtInput) {
      throw new RouteError(
        400,
        '스냅샷 반영 시각은 밀리초와 Z가 포함된 ISO 8601 형식이어야 합니다.',
        'INVALID_SNAPSHOT_CREATED_AT',
      );
    }
    snapshotCreatedAt = snapshotCreatedAtInput;
  }
  const jobs = await all<{
    company: string;
    title: string;
    deadlineAt: string | null;
    rolling: number | boolean;
    sourceName: string;
    sourceUrl: string;
  }>(
    db,
    snapshotCreatedAt
      ? `SELECT company_name AS company, title, deadline_at AS deadlineAt, rolling,
                source_name AS sourceName, source_url AS sourceUrl
           FROM jobs
          WHERE status = 'ACTIVE'
            AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
            AND (deadline_at IS NULL OR deadline_at > ?)
            AND created_at = ?
          ORDER BY deadline_at IS NULL, deadline_at, company_name, title, id`
      : `SELECT company_name AS company, title, deadline_at AS deadlineAt, rolling,
                source_name AS sourceName, source_url AS sourceUrl
           FROM jobs
          WHERE status = 'ACTIVE'
            AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
            AND rolling = 0
            AND deadline_at IS NOT NULL
            AND deadline_at > ?
            AND created_at >= ? AND created_at < ?
          ORDER BY deadline_at, company_name, title, id`,
    ...(snapshotCreatedAt ? [nowIso(), snapshotCreatedAt] : [nowIso(), start, end]),
  );
  return {
    date: today,
    generatedAt: nowIso(),
    snapshotCreatedAt,
    siteUrl: new URL('/', requestUrl).toString(),
    challenges: [
      ...challenges
        .filter((challenge) => challenge.problem.track === 'ALGORITHM')
        .map((challenge) => ({
          title: challenge.problem.displayTitle,
          track: challenge.problem.track,
          level: challenge.problem.level,
          sourceUrl: challenge.problem.sourceUrl,
        })),
      {
        title: advancedChallenge.displayTitle,
        track: advancedChallenge.track,
        level: advancedChallenge.level,
        sourceUrl: advancedChallenge.sourceUrl,
        isChallenge: true,
      },
      ...challenges
        .filter((challenge) => challenge.problem.track === 'SQL')
        .map((challenge) => ({
          title: challenge.problem.displayTitle,
          track: challenge.problem.track,
          level: challenge.problem.level,
          sourceUrl: challenge.problem.sourceUrl,
        })),
    ],
    jobs,
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
    db.prepare(unreadCountSql).bind(userId, nowIso()),
  ];
  if (!includeHome) return statements;
  statements.push(
    collectionTreeStatement(db, '?', userId),
    db.prepare(dailyChallengeRowsSql).bind(userId, today),
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
  embeddedUnreadCount?: number,
) {
  assertRateLimit(Number(batchRows<CountRow>(results[0])[0]?.count || 1), rateWindow);
  let resultIndex = 1;
  const unreadCount =
    embeddedUnreadCount === undefined
      ? Number(batchRows<CountRow>(results[resultIndex++])[0]?.count || 0)
      : embeddedUnreadCount;
  const shouldIncludeHome = includeHome && Boolean(user.onboardingCompletedAt);
  if (!shouldIncludeHome) return { user: apiUser(user), unreadCount, home: null };
  const collectionResult = results[resultIndex++];
  const dailyRows = batchRows<DailyChallengeRow>(results[resultIndex]);
  return {
    user: apiUser(user),
    unreadCount,
    home: {
      collections: collectionTreeValue(collectionResult),
      dailyChallenges: await completeDailyChallenges(db, user.id, today, dailyRows),
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

type SolutionRow = {
  id: string;
  problemId: string;
  authorId: string;
  title: string;
  language: string;
  code: string;
  description: string;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  lessons: string;
  solved: number | boolean;
  visibility: 'PRIVATE' | 'MEMBERS';
  currentRev: number;
  createdAt: string;
  updatedAt: string;
  authorDisplayName: string;
  problemTitle: string;
  problemLevel: number;
};

async function solutionList(db: D1Database, userId: string, search: URLSearchParams) {
  const clauses = ['s.deleted_at IS NULL', "s.visibility = 'MEMBERS'"];
  const values: unknown[] = [];
  const problemId = search.get('problemId');
  const language = search.get('language');
  const authorId = search.get('authorId');
  if (problemId) {
    clauses.push('s.problem_id = ?');
    values.push(problemId);
  }
  if (language) {
    clauses.push('s.language = ?');
    values.push(language);
  }
  if (authorId) {
    clauses.push('s.author_id = ?');
    values.push(authorId);
  }
  const baseClauses = [...clauses];
  const baseValues = [...values];
  const paged = cursorPageRequested(search);
  const limit = paged ? cursorLimit(search, 10, 30) : 50;
  const cursor = paged
    ? decodeCursor<{ updatedAt?: unknown; id?: unknown }>(search.get('cursor'))
    : null;
  if (cursor) {
    const updatedAt = cleanText(cursor.updatedAt);
    const id = cleanText(cursor.id);
    if (!updatedAt || !id)
      throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
    clauses.push('(s.updated_at < ? OR (s.updated_at = ? AND s.id < ?))');
    values.push(updatedAt, updatedAt, id);
  }
  const rows = await all<SolutionRow>(
    db,
    `SELECT s.id, s.problem_id AS problemId, s.author_id AS authorId, s.title, s.language,
            substr(s.description, 1, 240) AS descriptionPreview,
            s.time_complexity AS timeComplexity, s.space_complexity AS spaceComplexity,
            s.solved, s.visibility,
            s.current_rev AS currentRev, s.created_at AS createdAt, s.updated_at AS updatedAt,
            u.display_name AS authorDisplayName,
            p.display_title AS problemTitle, p.level AS problemLevel,
            (SELECT COUNT(*) FROM solution_reactions sr WHERE sr.solution_id = s.id) AS reactionCount,
            EXISTS(SELECT 1 FROM solution_reactions sr WHERE sr.solution_id = s.id AND sr.user_id = ?) AS reactedByMe,
            (SELECT COUNT(*) FROM solution_comments sc WHERE sc.solution_id = s.id) AS commentCount
       FROM solutions s
       JOIN users u ON u.id = s.author_id
       JOIN coding_problems p ON p.id = s.problem_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY s.updated_at DESC, s.id DESC
      LIMIT ?`,
    userId,
    ...values,
    limit + (paged ? 1 : 0),
  );
  const hasMore = paged && rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const total = paged
    ? Number(
        (
          await first<{ count: number }>(
            db,
            `SELECT COUNT(*) AS count FROM solutions s WHERE ${baseClauses.join(' AND ')}`,
            ...baseValues,
          )
        )?.count || 0,
      )
    : pageRows.length;
  const items = pageRows.map((row) => ({
    id: row.id,
    problemId: row.problemId,
    title: row.title,
    language: row.language,
    descriptionPreview: Reflect.get(row, 'descriptionPreview'),
    timeComplexity: row.timeComplexity,
    spaceComplexity: row.spaceComplexity,
    solved: asBoolean(row.solved),
    visibility: row.visibility,
    currentRev: row.currentRev,
    canEdit: row.authorId === userId,
    reactionCount: Number(Reflect.get(row, 'reactionCount') || 0),
    reactedByMe: asBoolean(Reflect.get(row, 'reactedByMe')),
    commentCount: Number(Reflect.get(row, 'commentCount') || 0),
    author: { id: row.authorId, displayName: row.authorDisplayName },
    problem: { displayTitle: row.problemTitle, level: row.problemLevel },
  }));
  if (!paged) return items;
  const last = pageRows.at(-1);
  return {
    items,
    nextCursor: hasMore && last ? encodeCursor({ updatedAt: last.updatedAt, id: last.id }) : null,
    total,
  } satisfies CursorPage<(typeof items)[number]>;
}

async function solutionDetail(db: D1Database, userId: string, solutionId: string) {
  const row = await first<SolutionRow>(
    db,
    `SELECT s.id, s.problem_id AS problemId, s.author_id AS authorId, s.title, s.language,
            s.code, s.description, s.time_complexity AS timeComplexity,
            s.space_complexity AS spaceComplexity, s.lessons, s.solved, s.visibility,
            s.current_rev AS currentRev, s.created_at AS createdAt, s.updated_at AS updatedAt,
            u.display_name AS authorDisplayName,
            p.display_title AS problemTitle, p.level AS problemLevel
       FROM solutions s
       JOIN users u ON u.id = s.author_id
       JOIN coding_problems p ON p.id = s.problem_id
      WHERE s.id = ? AND s.deleted_at IS NULL
        AND (s.visibility = 'MEMBERS' OR s.author_id = ?)`,
    solutionId,
    userId,
  );
  if (!row) throw new RouteError(404, '풀이를 찾을 수 없습니다.');
  const [revisions, reactions, comments] = await Promise.all([
    all<Record<string, unknown>>(
      db,
      `SELECT id, revision, code, description, created_at AS createdAt
         FROM solution_revisions WHERE solution_id = ? ORDER BY revision DESC LIMIT 10`,
      solutionId,
    ),
    all<Record<string, unknown>>(
      db,
      `SELECT id, user_id AS userId, created_at AS createdAt
         FROM solution_reactions WHERE solution_id = ?`,
      solutionId,
    ),
    all<Record<string, unknown>>(
      db,
      `SELECT c.id, c.parent_id AS parentId, c.markdown, c.deleted_at AS deletedAt,
              c.hidden_at AS hiddenAt, c.created_at AS createdAt,
              u.id AS authorId, u.display_name AS authorDisplayName
         FROM solution_comments c JOIN users u ON u.id = c.author_id
        WHERE c.solution_id = ? ORDER BY c.created_at`,
      solutionId,
    ),
  ]);
  const mapComment = (comment: Record<string, unknown>) => {
    const deleted = Boolean(comment.deletedAt);
    const hidden = Boolean(comment.hiddenAt);
    return {
      id: comment.id,
      markdown: deleted || hidden ? null : comment.markdown,
      redacted: deleted ? ('DELETED' as const) : hidden ? ('HIDDEN' as const) : null,
      deletedAt: comment.deletedAt,
      hiddenAt: comment.hiddenAt,
      createdAt: comment.createdAt,
      author: { id: comment.authorId, displayName: comment.authorDisplayName },
      canEdit: comment.authorId === userId,
      replies: [] as unknown[],
    };
  };
  const mappedComments = new Map(
    comments.map((comment) => [String(comment.id), mapComment(comment)]),
  );
  const rootComments: ReturnType<typeof mapComment>[] = [];
  for (const comment of comments) {
    const mapped = mappedComments.get(String(comment.id));
    if (!mapped) continue;
    if (!comment.parentId) {
      rootComments.push(mapped);
      continue;
    }
    const parent = mappedComments.get(String(comment.parentId));
    if (parent) parent.replies.push(mapped);
  }
  return {
    ...row,
    solved: asBoolean(row.solved),
    canEdit: row.authorId === userId,
    revisions,
    reactions,
    reactionCount: reactions.length,
    reactedByMe: reactions.some((reaction) => reaction.userId === userId),
    comments: rootComments,
    author: { id: row.authorId, displayName: row.authorDisplayName },
    problem: { displayTitle: row.problemTitle, level: row.problemLevel },
  };
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
       AND ${scheduleClause}
       ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
     LIMIT 1001`;
  const statement = (indexName: string, scheduleClause: string, ...scheduleValues: unknown[]) =>
    db
      .prepare(select(indexName, scheduleClause))
      .bind(owner.value, ...scheduleValues, ...filterValues);
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
  ];
  const values: unknown[] = [];
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
        AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')`,
    userId,
    jobId,
  );
  if (!row) throw new RouteError(404, '채용공고를 찾을 수 없습니다.');
  return serializeJobRows([row])[0];
}

const jobCategoriesStatement = (db: D1Database) =>
  db.prepare(
    `SELECT DISTINCT category
       FROM jobs INDEXED BY idx_jobs_active_category
      WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
        AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
      ORDER BY category LIMIT 100`,
  );

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
  const includeUnread = mode === 'bootstrap';
  const catalogBootstrap = mode === 'bootstrap' && url.searchParams.get('catalog') === 'true';
  const window = rateLimitWindow(request.method.toUpperCase(), env, url.pathname);
  const statements = [rateLimitStatement(env.DB, user.id, window)];
  const unreadIndex = includeUnread ? statements.length : -1;
  if (includeUnread) statements.push(env.DB.prepare(unreadCountSql).bind(user.id, nowIso()));
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
  const unreadCount =
    unreadIndex >= 0 ? Number(batchRows<CountRow>(results[unreadIndex])[0]?.count || 0) : 0;
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
    unreadCount,
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
  const statements = [
    rateLimitStatement(env.DB, user.id, window),
    env.DB.prepare(unreadCountSql).bind(user.id, nowIso()),
  ];
  const plan = learningListPlan(env.DB, { kind: 'userId', value: user.id });
  const dataIndex = statements.length;
  statements.push(...plan.statements);
  const results = (await env.DB.batch(statements)) as BatchResult[];
  assertRateLimit(Number(batchRows<CountRow>(results[0])[0]?.count || 1), window);
  const unreadCount = Number(batchRows<CountRow>(results[1])[0]?.count || 0);
  return {
    user: apiUser(user),
    unreadCount,
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

type ImportPreviewRow = {
  token: string;
  checksum: string;
  payload: string;
  expiresAt: string;
  consumedAt: string | null;
};

type ImportBatchRow = { id: string; result: string };

async function saveImportPreview(
  db: D1Database,
  user: UserRow,
  kind: 'jobs' | 'learning',
  payload: unknown,
) {
  const serialized = JSON.stringify(payload);
  const checksum = await sha256(serialized);
  const previewToken = newId();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  await db.batch([
    db.prepare('DELETE FROM import_previews WHERE expires_at <= ?').bind(createdAt),
    db
      .prepare(
        `INSERT INTO import_previews
           (token, kind, checksum, payload, actor_id, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(previewToken, kind, checksum, serialized, user.id, expiresAt, createdAt),
  ]);
  return { previewToken, checksum, expiresAt };
}

async function consumeImportPreview(
  db: D1Database,
  user: UserRow,
  kind: 'jobs' | 'learning',
  input: unknown,
) {
  const commit = parseImportCommit(input);
  const acknowledgment = parseObject(input);
  const preview = await first<ImportPreviewRow>(
    db,
    `SELECT token, checksum, payload, expires_at AS expiresAt, consumed_at AS consumedAt
       FROM import_previews WHERE token = ? AND kind = ? AND actor_id = ?`,
    commit.previewToken,
    kind,
    user.id,
  );
  if (!preview) throw new RouteError(409, '유효한 import 미리보기가 없습니다.', 'PREVIEW_REQUIRED');
  if (preview.checksum !== commit.checksum) {
    throw new RouteError(409, '미리보기 이후 입력이 변경되었습니다.', 'PREVIEW_CHECKSUM_MISMATCH');
  }
  if (preview.expiresAt <= nowIso()) {
    throw new RouteError(409, 'import 미리보기가 만료되었습니다.', 'PREVIEW_EXPIRED');
  }
  const batch = await first<ImportBatchRow>(
    db,
    'SELECT id, result FROM import_batches WHERE kind = ? AND checksum = ?',
    kind,
    preview.checksum,
  );
  if (batch) return { preview, existing: parseObject(batch.result), acknowledgment };
  if (preview.consumedAt) {
    throw new RouteError(409, '이미 사용된 import 미리보기입니다.', 'PREVIEW_CONSUMED');
  }
  return { preview, existing: null, acknowledgment };
}

async function analyzeJobImport(db: D1Database, input: unknown) {
  const body = parseJobPackage(input);
  const normalized = await Promise.all(
    body.items.map(async (item, index) => ({
      index,
      item,
      canonicalUrl: canonicalJobUrl(item.sourceUrl),
      fingerprint: await jobFingerprint(item),
    })),
  );
  const existingByUrl = new Map<string, string>();
  const existingFingerprints = new Set<string>();
  for (let offset = 0; offset < normalized.length; offset += 200) {
    const chunk = normalized.slice(offset, offset + 200);
    const urls = [...new Set(chunk.map((row) => row.canonicalUrl))];
    const fingerprints = [...new Set(chunk.map((row) => row.fingerprint))];
    const urlRows = urls.length
      ? await all<{ id: string; sourceUrl: string }>(
          db,
          `SELECT id, source_url AS sourceUrl FROM jobs WHERE source_url IN (${urls.map(() => '?').join(',')})`,
          ...urls,
        )
      : [];
    for (const row of urlRows) existingByUrl.set(row.sourceUrl, row.id);
    const fingerprintRows = fingerprints.length
      ? await all<{ fingerprint: string }>(
          db,
          `SELECT fingerprint FROM jobs WHERE fingerprint IN (${fingerprints.map(() => '?').join(',')})`,
          ...fingerprints,
        )
      : [];
    for (const row of fingerprintRows) existingFingerprints.add(row.fingerprint);
  }
  const seenUrls = new Set<string>();
  const seenFingerprints = new Set<string>();
  const rows = normalized.map((row) => {
    let outcome: 'CREATE' | 'UPDATE' | 'REVIEW' | 'REJECT' | 'DUPLICATE';
    let reason: string;
    if (row.item.careerScope === 'CAREER_ONLY') {
      outcome = 'REJECT';
      reason = '경력직 전용 공고';
    } else if (seenUrls.has(row.canonicalUrl) || seenFingerprints.has(row.fingerprint)) {
      outcome = 'DUPLICATE';
      reason = '입력 package 내부 중복';
    } else if (existingByUrl.has(row.canonicalUrl)) {
      outcome = 'UPDATE';
      reason = '기존 canonical URL 갱신';
    } else if (existingFingerprints.has(row.fingerprint)) {
      outcome = 'REVIEW';
      reason = 'URL은 다르지만 fingerprint가 같은 공고';
    } else if (row.item.companySize === 'UNCLASSIFIED' || row.item.status === 'NEEDS_REVIEW') {
      outcome = 'REVIEW';
      reason = '회사 규모 또는 공고 분류 검토 필요';
    } else {
      outcome = 'CREATE';
      reason = '반영 가능';
    }
    if (outcome !== 'REJECT') {
      seenUrls.add(row.canonicalUrl);
      seenFingerprints.add(row.fingerprint);
    }
    return { ...row, outcome, reason, existingId: existingByUrl.get(row.canonicalUrl) };
  });
  const counts = {
    original: rows.length,
    create: rows.filter((row) => row.outcome === 'CREATE').length,
    update: rows.filter((row) => row.outcome === 'UPDATE').length,
    duplicate: rows.filter((row) => row.outcome === 'DUPLICATE').length,
    rejected: rows.filter((row) => row.outcome === 'REJECT').length,
    review: rows.filter((row) => row.outcome === 'REVIEW').length,
    removal: 0,
  };
  const removalCandidates: Array<{
    id: string;
    sourceName: string;
    companyName: string;
    title: string;
    sourceUrl: string;
  }> = [];
  for (const sourceName of body.snapshot?.sources || []) {
    const observedUrls = new Set(
      normalized.filter((row) => row.item.sourceName === sourceName).map((row) => row.canonicalUrl),
    );
    const existing = await all<{
      id: string;
      sourceName: string;
      companyName: string;
      title: string;
      sourceUrl: string;
    }>(
      db,
      `SELECT id, source_name AS sourceName, company_name AS companyName, title, source_url AS sourceUrl
         FROM jobs
        WHERE source_name = ? AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
          AND last_verified_at < ?
        ORDER BY company_name, title`,
      sourceName,
      body.collectedAt,
    );
    removalCandidates.push(...existing.filter((job) => !observedUrls.has(job.sourceUrl)));
  }
  counts.removal = removalCandidates.length;
  return { body, rows, counts, removalCandidates };
}

async function previewJobImport(db: D1Database, user: UserRow, input: unknown) {
  requireAdmin(user);
  const analyzed = await analyzeJobImport(db, input);
  const preview = await saveImportPreview(db, user, 'jobs', analyzed.body);
  return {
    valid: true,
    ...preview,
    counts: analyzed.counts,
    rows: analyzed.rows.map((row) => ({
      index: row.index,
      outcome: row.outcome,
      reason: row.reason,
      companyName: row.item.companyName,
      title: row.item.title,
      sourceUrl: row.canonicalUrl,
    })),
    snapshot: analyzed.body.snapshot || null,
    removalCandidates: analyzed.removalCandidates,
  };
}

async function commitJobImport(db: D1Database, user: UserRow, input: unknown) {
  requireAdmin(user);
  const loaded = await consumeImportPreview(db, user, 'jobs', input);
  if (loaded.existing) return { ...loaded.existing, idempotent: true };
  const analyzed = await analyzeJobImport(db, JSON.parse(loaded.preview.payload));
  if (
    loaded.acknowledgment.acknowledgeAllRows !== true ||
    int(loaded.acknowledgment.reviewedRowCount, -1) !== analyzed.rows.length
  ) {
    throw new RouteError(
      409,
      '전체 미리보기 행을 검토했다는 확인이 필요합니다.',
      'IMPORT_REVIEW_ACK_REQUIRED',
    );
  }
  if (
    analyzed.removalCandidates.length > 0 &&
    (loaded.acknowledgment.acknowledgeRemovals !== true ||
      int(loaded.acknowledgment.removalCount, -1) !== analyzed.removalCandidates.length)
  ) {
    throw new RouteError(
      409,
      'FULL snapshot 제거 대상을 별도로 확인해주세요.',
      'IMPORT_REMOVAL_ACK_REQUIRED',
      { removalCount: analyzed.removalCandidates.length },
    );
  }
  if (analyzed.removalCandidates.length > Math.max(100, analyzed.rows.length)) {
    throw new RouteError(
      409,
      '제거 대상이 안전 임계치를 초과했습니다. source snapshot을 분할해 다시 검토해주세요.',
      'IMPORT_REMOVAL_THRESHOLD_EXCEEDED',
      { removalCount: analyzed.removalCandidates.length, importedCount: analyzed.rows.length },
    );
  }
  const timestamp = nowIso();
  const batchId = newId();
  const batch = {
    id: batchId,
    createdAt: timestamp,
    originalCount: analyzed.counts.original,
    rejectedCount: analyzed.counts.rejected,
  };
  const acceptedRows = analyzed.rows
    .filter((row) => !['REJECT', 'DUPLICATE'].includes(row.outcome))
    .map((row) => ({ ...row, persistedId: row.existingId || newId() }));
  const snapshotSources = analyzed.body.snapshot?.sources || [];
  const result = {
    batch,
    counts: analyzed.counts,
    snapshot: { mode: analyzed.body.snapshot?.mode || 'DELTA', sources: snapshotSources },
    idempotent: false,
  };
  const statements = acceptedRows.map((row) => {
    const item = row.item;
    return db
      .prepare(
        `INSERT INTO jobs
             (id, company_name, company_size, company_size_evidence, source_name,
              source_posting_id, source_url, title, category, career_scope, career_evidence,
              employment_type, region, remote, tech_stack, published_at, application_start_at,
              deadline_at, rolling, summary, status, fingerprint, collected_at, last_verified_at,
              created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(source_url) DO UPDATE SET
             company_name = excluded.company_name, company_size = excluded.company_size,
             company_size_evidence = excluded.company_size_evidence,
             source_name = excluded.source_name, source_posting_id = excluded.source_posting_id,
             title = excluded.title, category = excluded.category,
             career_scope = excluded.career_scope, career_evidence = excluded.career_evidence,
             employment_type = excluded.employment_type, region = excluded.region,
             remote = excluded.remote, tech_stack = excluded.tech_stack,
             published_at = excluded.published_at,
             application_start_at = excluded.application_start_at,
             deadline_at = excluded.deadline_at, rolling = excluded.rolling,
             summary = excluded.summary, status = excluded.status,
             fingerprint = excluded.fingerprint, collected_at = excluded.collected_at,
             last_verified_at = excluded.last_verified_at, updated_at = excluded.updated_at`,
      )
      .bind(
        row.persistedId,
        item.companyName,
        item.companySize,
        item.companySizeEvidence || null,
        item.sourceName,
        item.sourceId || null,
        row.canonicalUrl,
        item.title,
        item.category,
        item.careerScope,
        item.careerEvidence,
        item.employmentType,
        item.region,
        item.remote ? 1 : 0,
        JSON.stringify(item.techStack),
        item.publishedAt || null,
        item.applicationStartAt || null,
        item.deadlineAt || null,
        item.rolling ? 1 : 0,
        item.summary,
        row.outcome === 'REVIEW' ? 'NEEDS_REVIEW' : item.status,
        row.fingerprint,
        item.collectedAt,
        item.lastVerifiedAt,
        timestamp,
        timestamp,
      );
  });
  statements.push(
    db
      .prepare(
        `INSERT INTO import_batches
           (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
         VALUES (?, 'jobs', ?, 'COMMITTED', ?, ?, ?, ?, ?)`,
      )
      .bind(
        batchId,
        loaded.preview.checksum,
        analyzed.counts.original,
        analyzed.counts.rejected,
        JSON.stringify(result),
        timestamp,
        timestamp,
      ),
  );
  for (const sourceName of snapshotSources) {
    const observed = acceptedRows.filter((row) => row.item.sourceName === sourceName);
    const snapshotId = newId();
    const removalCount = analyzed.removalCandidates.filter(
      (row) => row.sourceName === sourceName,
    ).length;
    statements.push(
      db
        .prepare(
          `INSERT INTO job_source_snapshots
             (id, source_name, collected_at, observed_count, expired_count, import_batch_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          snapshotId,
          sourceName,
          analyzed.body.collectedAt,
          observed.length,
          removalCount,
          batchId,
          timestamp,
        ),
      ...observed.map((row) =>
        db
          .prepare('INSERT INTO job_source_snapshot_items (snapshot_id, job_id) VALUES (?, ?)')
          .bind(snapshotId, row.persistedId),
      ),
      db
        .prepare(
          `UPDATE jobs SET status = 'REMOVED', updated_at = ?
            WHERE source_name = ? AND status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
              AND last_verified_at < ?
              AND NOT EXISTS (
                SELECT 1 FROM job_source_snapshot_items snapshot_item
                 WHERE snapshot_item.snapshot_id = ? AND snapshot_item.job_id = jobs.id
              )`,
        )
        .bind(timestamp, sourceName, analyzed.body.collectedAt, snapshotId),
    );
  }
  statements.push(
    db
      .prepare('UPDATE import_previews SET consumed_at = ? WHERE token = ? AND consumed_at IS NULL')
      .bind(timestamp, loaded.preview.token),
    db
      .prepare(
        `INSERT INTO audit_logs
           (id, actor_id, action, target_type, target_id, metadata, created_at)
         VALUES (?, ?, 'JOB_IMPORT_APPROVED', 'ImportBatch', ?, ?, ?)`,
      )
      .bind(newId(), user.id, batchId, JSON.stringify({ counts: analyzed.counts }), timestamp),
  );
  await db.batch(statements);
  return result;
}

async function previewLearningImport(db: D1Database, user: UserRow, input: unknown) {
  requireAdmin(user);
  const body = parseLearningPackage(input);
  const existing = await first<{ id: string }>(
    db,
    'SELECT id FROM learning_sources WHERE source_checksum = ? AND source_version = ?',
    body.source.checksum,
    body.source.sourceVersion,
  );
  const preview = await saveImportPreview(db, user, 'learning', body);
  return {
    valid: true,
    ...preview,
    idempotent: Boolean(existing),
    source: body.source,
    unitCount: body.units.length,
    flashcardCount: body.units.reduce((sum, unit) => sum + unit.flashcards.length, 0),
    questionCount: body.units.reduce((sum, unit) => sum + unit.questions.length, 0),
  };
}

async function commitLearningImport(db: D1Database, user: UserRow, input: unknown) {
  requireAdmin(user);
  const loaded = await consumeImportPreview(db, user, 'learning', input);
  if (loaded.existing) return { ...loaded.existing, idempotent: true };
  const body = parseLearningPackage(JSON.parse(loaded.preview.payload));
  if (
    loaded.acknowledgment.acknowledgeAllRows !== true ||
    int(loaded.acknowledgment.reviewedRowCount, -1) !== body.units.length
  ) {
    throw new RouteError(
      409,
      '전체 학습 단원을 검토했다는 확인이 필요합니다.',
      'IMPORT_REVIEW_ACK_REQUIRED',
    );
  }
  const existingSource = await first<{ id: string; title: string }>(
    db,
    'SELECT id, title FROM learning_sources WHERE source_checksum = ? AND source_version = ?',
    body.source.checksum,
    body.source.sourceVersion,
  );
  if (existingSource) {
    return { source: existingSource, idempotent: true };
  }
  const timestamp = nowIso();
  const sourceId = newId();
  const batchId = newId();
  const result = {
    source: { id: sourceId, ...body.source },
    unitCount: body.units.length,
    idempotent: false,
  };
  const statements = [
    db
      .prepare(
        `INSERT INTO learning_sources
           (id, title, subject, category, source_version, source_checksum, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'READY', ?, ?)`,
      )
      .bind(
        sourceId,
        body.source.title,
        body.source.subject,
        body.source.category,
        body.source.sourceVersion,
        body.source.checksum,
        timestamp,
        timestamp,
      ),
  ];
  for (const [position, unit] of body.units.entries()) {
    const unitId = newId();
    statements.push(
      db
        .prepare(
          `INSERT INTO learning_units
             (id, source_id, anchor, title, summary, concepts, visuals, position, published, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          unitId,
          sourceId,
          unit.anchor,
          unit.title,
          sourceText(unit.summaryMarkdown),
          JSON.stringify(unit.concepts),
          JSON.stringify(unit.visuals || []),
          position,
          timestamp,
          timestamp,
        ),
    );
    for (const card of unit.flashcards) {
      statements.push(
        db
          .prepare(
            'INSERT INTO flashcards (id, unit_id, front, back, created_at) VALUES (?, ?, ?, ?, ?)',
          )
          .bind(newId(), unitId, sourceText(card.front), sourceText(card.back), timestamp),
      );
    }
    for (const question of unit.questions) {
      statements.push(
        db
          .prepare(
            `INSERT INTO learning_questions
               (id, unit_id, prompt, answer, type, choices, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            unitId,
            sourceText(question.prompt),
            sourceText(question.answer),
            question.type,
            JSON.stringify(question.choices || []),
            timestamp,
          ),
      );
    }
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO import_batches
           (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
         VALUES (?, 'learning', ?, 'COMMITTED', ?, 0, ?, ?, ?)`,
      )
      .bind(
        batchId,
        loaded.preview.checksum,
        body.units.length,
        JSON.stringify(result),
        timestamp,
        timestamp,
      ),
    db
      .prepare('UPDATE import_previews SET consumed_at = ? WHERE token = ? AND consumed_at IS NULL')
      .bind(timestamp, loaded.preview.token),
    db
      .prepare(
        `INSERT INTO audit_logs
           (id, actor_id, action, target_type, target_id, metadata, created_at)
         VALUES (?, ?, 'LEARNING_IMPORT_APPROVED', 'LearningSource', ?, ?, ?)`,
      )
      .bind(
        newId(),
        user.id,
        sourceId,
        JSON.stringify({ unitCount: body.units.length }),
        timestamp,
      ),
  );
  await db.batch(statements);
  return result;
}

async function handleRoute(request: Request, env: D1Env, user: UserRow, url: URL) {
  const db = env.DB;
  const path = url.pathname.replace(/^\/api\/v1/, '') || '/';
  const method = request.method.toUpperCase();

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
         preferred_language = ?, ranking_opt_in = ?, comment_notifications = ?,
         deadline_notifications = ?, review_notifications = ?, updated_at = ? WHERE id = ?`,
      displayName,
      avatarUrl || null,
      githubUsername || null,
      preferredLanguage,
      body.rankingOptIn === undefined
        ? asBoolean(user.rankingOptIn)
          ? 1
          : 0
        : bool(body.rankingOptIn)
          ? 1
          : 0,
      body.commentNotifications === undefined
        ? asBoolean(user.commentNotifications)
          ? 1
          : 0
        : bool(body.commentNotifications)
          ? 1
          : 0,
      body.deadlineNotifications === undefined
        ? asBoolean(user.deadlineNotifications)
          ? 1
          : 0
        : bool(body.deadlineNotifications)
          ? 1
          : 0,
      body.reviewNotifications === undefined
        ? asBoolean(user.reviewNotifications)
          ? 1
          : 0
        : bool(body.reviewNotifications)
          ? 1
          : 0,
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
      'SOLUTION',
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
        SOLUTION:
          "SELECT id FROM solutions WHERE id = ? AND deleted_at IS NULL AND (visibility = 'MEMBERS' OR author_id = ?)",
        LEARNING_UNIT: 'SELECT id FROM learning_units WHERE id = ? AND published = 1',
      };
      const ownerScoped = itemType === 'SOLUTION';
      targetExists = Boolean(
        await first(db, targetQueries[itemType]!, targetId, ...(ownerScoped ? [user.id] : [])),
      );
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
          ${cursor ? 'AND (rank > ? OR (rank = ? AND rowid > ?))' : ''}
        ORDER BY rank ASC LIMIT ?`,
      match,
      user.id,
      ...(cursor ? [cursorRank, cursorRank, cursorRowid] : []),
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const grouped: Record<string, Array<Record<string, unknown>>> = {
      folders: [],
      jobs: [],
      problems: [],
      solutions: [],
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
            : kind === 'solutions'
              ? `/solutions?solution=${id}`
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

  if (method === 'GET' && path === '/notifications/unread-count') {
    const row = await first<CountRow>(db, unreadCountSql, user.id, nowIso());
    return { count: Number(row?.count || 0) };
  }
  if (method === 'GET' && path === '/notifications') {
    const allowedTypes = new Set(['COMMENT', 'REPLY', 'JOB_DEADLINE', 'SYSTEM']);
    const type = cleanText(url.searchParams.get('type'));
    if (type && !allowedTypes.has(type)) {
      throw new RouteError(400, '지원하지 않는 알림 유형입니다.');
    }
    const paged = cursorPageRequested(url.searchParams);
    const limit = paged ? cursorLimit(url.searchParams, 30, 100) : 100;
    const cursor = paged
      ? decodeCursor<{ createdAt?: unknown; id?: unknown }>(url.searchParams.get('cursor'))
      : null;
    const clauses = [
      'user_id = ?',
      "type <> 'LEARNING_REVIEW'",
      '(expires_at IS NULL OR expires_at > ?)',
    ];
    const values: unknown[] = [user.id, nowIso()];
    if (type) {
      clauses.push('type = ?');
      values.push(type);
    }
    if (url.searchParams.get('unread') === '1') clauses.push('read_at IS NULL');
    if (cursor) {
      const createdAt = cleanText(cursor.createdAt);
      const id = cleanText(cursor.id);
      if (!createdAt || !id) {
        throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
      }
      clauses.push('(created_at < ? OR (created_at = ? AND id < ?))');
      values.push(createdAt, createdAt, id);
    }
    const rows = await all<Record<string, unknown>>(
      db,
      `SELECT id, type, title, message, href, read_at AS readAt, created_at AS createdAt
         FROM notifications WHERE ${clauses.join(' AND ')}
        ORDER BY created_at DESC, id DESC LIMIT ?`,
      ...values,
      limit + (paged ? 1 : 0),
    );
    if (!paged) return rows;
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items.at(-1);
    return {
      items,
      nextCursor: hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
    };
  }
  if (method === 'PATCH' && path === '/notifications/read-all') {
    const result = await run(
      db,
      'UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL',
      nowIso(),
      user.id,
    );
    return { count: result.meta?.changes || 0 };
  }
  const notificationMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notificationMatch && method === 'PATCH') {
    const result = await run(
      db,
      'UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?',
      nowIso(),
      notificationMatch[1],
      user.id,
    );
    return { count: result.meta?.changes || 0 };
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
  const progressMatch = path.match(
    /^\/coding\/problems\/([^/]+)\/(progress|status|favorite|memo)$/,
  );
  if (progressMatch && method === 'PATCH') {
    const body = await readJson(request);
    const problem = await first<{ id: string }>(
      db,
      'SELECT id FROM coding_problems WHERE id = ? AND active = 1',
      progressMatch[1],
    );
    if (!problem) throw new RouteError(404, '문제를 찾을 수 없습니다.');
    const current = await first<{
      status: string;
      favorite: number | boolean;
      memo: string;
      solvedAt: string | null;
    }>(
      db,
      `SELECT status, favorite, memo, solved_at AS solvedAt
         FROM problem_progress WHERE user_id = ? AND problem_id = ?`,
      user.id,
      progressMatch[1],
    );
    const intent = progressMatch[2];
    const hasStatus = intent === 'status' || Object.hasOwn(body, 'status');
    const hasFavorite = intent === 'favorite' || Object.hasOwn(body, 'favorite');
    const hasMemo = intent === 'memo' || Object.hasOwn(body, 'memo');
    if (!hasStatus && !hasFavorite && !hasMemo) {
      throw new RouteError(422, '변경할 진행 상태 필드가 없습니다.', 'VALIDATION_FAILED');
    }
    const status = hasStatus ? parseProblemStatus(body.status) : current?.status || 'UNTRIED';
    const favorite = hasFavorite ? bool(body.favorite) : asBoolean(current?.favorite);
    const memo = hasMemo ? sourceText(body.memo) : current?.memo || '';
    const timestamp = nowIso();
    const solvedAt = hasStatus
      ? status === 'SOLVED'
        ? current?.solvedAt || timestamp
        : null
      : current?.solvedAt || null;
    await run(
      db,
      `INSERT INTO problem_progress (id, user_id, problem_id, status, favorite, memo, solved_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, problem_id) DO UPDATE SET status = excluded.status, favorite = excluded.favorite, memo = excluded.memo, solved_at = excluded.solved_at, updated_at = excluded.updated_at`,
      newId(),
      user.id,
      progressMatch[1],
      status,
      favorite ? 1 : 0,
      memo,
      solvedAt,
      timestamp,
    );
    return { problemId: progressMatch[1], status, favorite, memo, solvedAt };
  }
  if (method === 'GET' && path === '/coding/daily-challenge') return dailyChallenge(db, user.id);
  if (method === 'GET' && path === '/coding/daily-challenges') return dailyChallenges(db, user.id);
  const completeMatch = path.match(/^\/coding\/daily-challenge\/([^/]+)\/complete$/);
  if (completeMatch && method === 'POST') {
    const timestamp = nowIso();
    await run(
      db,
      `INSERT INTO daily_challenge_participations (id, challenge_id, user_id, completed_at, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(challenge_id, user_id) DO UPDATE SET completed_at = excluded.completed_at`,
      newId(),
      completeMatch[1],
      user.id,
      timestamp,
      timestamp,
    );
    return { completedAt: timestamp };
  }
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
    await run(
      db,
      'UPDATE daily_challenges SET problem_id = ? WHERE id = ?',
      problemId,
      challenge.id,
    );
    await audit(db, user.id, 'DAILY_CHALLENGE_RESELECTED', 'DailyChallenge', challenge.id, {
      problemId,
    });
    return dailyChallenge(db, user.id);
  }
  if (method === 'GET' && path === '/coding/solutions')
    return solutionList(db, user.id, url.searchParams);
  if (method === 'GET' && path === '/coding/solutions/trash') {
    return all(
      db,
      `SELECT s.id, s.title, s.deleted_at AS deletedAt, p.display_title AS problemTitle
         FROM solutions s JOIN coding_problems p ON p.id = s.problem_id
        WHERE s.author_id = ? AND s.deleted_at IS NOT NULL
        ORDER BY s.deleted_at DESC LIMIT 100`,
      user.id,
    );
  }
  const restoreSolutionMatch = path.match(/^\/coding\/solutions\/([^/]+)\/restore$/);
  if (restoreSolutionMatch && method === 'POST') {
    const timestamp = nowIso();
    const result = await run(
      db,
      `UPDATE solutions SET deleted_at = NULL, updated_at = ?
        WHERE id = ? AND author_id = ? AND deleted_at IS NOT NULL`,
      timestamp,
      restoreSolutionMatch[1],
      user.id,
    );
    if (Number(result.meta?.changes || 0) !== 1)
      throw new RouteError(404, '복원할 내 풀이를 찾을 수 없습니다.');
    await audit(db, user.id, 'SOLUTION_RESTORED', 'Solution', restoreSolutionMatch[1]);
    return { id: restoreSolutionMatch[1], restored: true };
  }
  const solutionDetailMatch = path.match(/^\/coding\/solutions\/([^/]+)$/);
  if (solutionDetailMatch && method === 'GET') {
    return solutionDetail(db, user.id, solutionDetailMatch[1]);
  }
  if (solutionDetailMatch && method === 'DELETE') {
    const timestamp = nowIso();
    const result = await run(
      db,
      `UPDATE solutions SET deleted_at = ?, updated_at = ?
        WHERE id = ? AND author_id = ? AND deleted_at IS NULL`,
      timestamp,
      timestamp,
      solutionDetailMatch[1],
      user.id,
    );
    if (Number(result.meta?.changes || 0) !== 1) {
      throw new RouteError(404, '삭제할 내 풀이를 찾을 수 없습니다.');
    }
    await db.batch([
      db
        .prepare("DELETE FROM collection_items WHERE item_type = 'SOLUTION' AND target_id = ?")
        .bind(solutionDetailMatch[1]),
      db
        .prepare(
          `INSERT INTO audit_logs
             (id, actor_id, action, target_type, target_id, metadata, created_at)
           VALUES (?, ?, 'SOLUTION_DELETED', 'Solution', ?, '{}', ?)`,
        )
        .bind(newId(), user.id, solutionDetailMatch[1], timestamp),
    ]);
    return { id: solutionDetailMatch[1], deleted: true };
  }
  if (
    method === 'POST' &&
    (path === '/coding/solutions' || path === '/coding/solutions/complete')
  ) {
    const body = await readJson(request);
    const code = typeof body.code === 'string' ? body.code : '';
    if (bool(body.solved) && !code.trim())
      throw new RouteError(400, '해결 기록에는 코드가 필요합니다.');
    const timestamp = nowIso();
    const problemId = cleanText(body.problemId);
    const challengeId = cleanText(body.challengeId);
    if (path.endsWith('/complete') && !challengeId) {
      throw new RouteError(400, '오늘의 문제 식별자가 필요합니다.');
    }
    const challenge = challengeId
      ? await first<{ id: string }>(
          db,
          'SELECT id FROM daily_challenges WHERE id = ? AND problem_id = ?',
          challengeId,
          problemId,
        )
      : null;
    if (challengeId && !challenge) {
      throw new RouteError(409, '선택한 오늘의 문제와 풀이 문제가 일치하지 않습니다.');
    }
    const language = cleanText(body.language);
    if (!solutionLanguages.has(language)) {
      throw new RouteError(400, '지원하는 코드 언어를 선택해주세요.');
    }
    if (typeof body.id === 'string' && body.id) {
      const current = await first<{
        authorId: string;
        currentRev: number;
        solvedAt: string | null;
      }>(
        db,
        'SELECT author_id AS authorId, current_rev AS currentRev, solved_at AS solvedAt FROM solutions WHERE id = ? AND deleted_at IS NULL',
        body.id,
      );
      if (!current) throw new RouteError(404, '풀이를 찾을 수 없습니다.');
      if (current.authorId !== user.id)
        throw new RouteError(403, '다른 사용자의 풀이는 수정할 수 없습니다.');
      const baseRevision = int(body.baseRevision, -1);
      if (baseRevision !== Number(current.currentRev)) {
        const latest = await first<{ code: string; description: string; currentRev: number }>(
          db,
          'SELECT code, description, current_rev AS currentRev FROM solutions WHERE id = ?',
          body.id,
        );
        throw new RouteError(409, '다른 곳에서 풀이가 먼저 수정되었습니다.', 'REVISION_CONFLICT', {
          current: latest,
        });
      }
      const revision = Number(current.currentRev) + 1;
      await db.batch([
        db
          .prepare(
            `UPDATE solutions SET problem_id = ?, title = ?, language = ?, code = ?, description = ?, time_complexity = ?, space_complexity = ?, lessons = ?, solved = ?, visibility = ?, current_rev = ?, solved_at = ?, updated_at = ? WHERE id = ?`,
          )
          .bind(
            problemId,
            cleanText(body.title),
            language,
            code,
            sourceText(body.description),
            cleanText(body.timeComplexity) || null,
            cleanText(body.spaceComplexity) || null,
            sourceText(body.lessons),
            bool(body.solved) ? 1 : 0,
            'MEMBERS',
            revision,
            bool(body.solved) ? current.solvedAt || timestamp : null,
            timestamp,
            body.id,
          ),
        db
          .prepare(
            'INSERT INTO solution_revisions (id, solution_id, revision, code, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .bind(newId(), body.id, revision, code, sourceText(body.description), timestamp),
        db
          .prepare(
            `INSERT INTO problem_progress (id, user_id, problem_id, status, solved_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, problem_id) DO UPDATE SET status = excluded.status, solved_at = excluded.solved_at, updated_at = excluded.updated_at`,
          )
          .bind(
            newId(),
            user.id,
            problemId,
            bool(body.solved) ? 'SOLVED' : 'IN_PROGRESS',
            bool(body.solved) ? timestamp : null,
            timestamp,
          ),
        ...(challenge
          ? [
              db
                .prepare(
                  `INSERT INTO daily_challenge_participations
                     (id, challenge_id, user_id, completed_at, created_at)
                   VALUES (?, ?, ?, ?, ?)
                   ON CONFLICT(challenge_id, user_id) DO UPDATE SET completed_at = excluded.completed_at`,
                )
                .bind(newId(), challenge.id, user.id, timestamp, timestamp),
            ]
          : []),
      ]);
      return { id: body.id, currentRev: revision };
    }
    const id = newId();
    await db.batch([
      db
        .prepare(
          `INSERT INTO solutions (id, problem_id, author_id, title, language, code, description, time_complexity, space_complexity, lessons, solved, visibility, current_rev, solved_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        )
        .bind(
          id,
          problemId,
          user.id,
          cleanText(body.title),
          language,
          code,
          sourceText(body.description),
          cleanText(body.timeComplexity) || null,
          cleanText(body.spaceComplexity) || null,
          sourceText(body.lessons),
          bool(body.solved) ? 1 : 0,
          'MEMBERS',
          bool(body.solved) ? timestamp : null,
          timestamp,
          timestamp,
        ),
      db
        .prepare(
          'INSERT INTO solution_revisions (id, solution_id, revision, code, description, created_at) VALUES (?, ?, 1, ?, ?, ?)',
        )
        .bind(newId(), id, code, sourceText(body.description), timestamp),
      db
        .prepare(
          `INSERT INTO problem_progress (id, user_id, problem_id, status, solved_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, problem_id) DO UPDATE SET status = excluded.status, solved_at = excluded.solved_at, updated_at = excluded.updated_at`,
        )
        .bind(
          newId(),
          user.id,
          problemId,
          bool(body.solved) ? 'SOLVED' : 'IN_PROGRESS',
          bool(body.solved) ? timestamp : null,
          timestamp,
        ),
      ...(challenge
        ? [
            db
              .prepare(
                `INSERT INTO daily_challenge_participations
                   (id, challenge_id, user_id, completed_at, created_at)
                 VALUES (?, ?, ?, ?, ?)
                 ON CONFLICT(challenge_id, user_id) DO UPDATE SET completed_at = excluded.completed_at`,
              )
              .bind(newId(), challenge.id, user.id, timestamp, timestamp),
          ]
        : []),
    ]);
    return { id, problemId, authorId: user.id, currentRev: 1, createdAt: timestamp };
  }
  const reactionMatch = path.match(/^\/coding\/solutions\/([^/]+)\/reaction$/);
  if (reactionMatch && (method === 'POST' || method === 'PUT')) {
    const desired = method === 'PUT' ? bool((await readJson(request)).active) : undefined;
    const existing = await first<{ id: string }>(
      db,
      'SELECT id FROM solution_reactions WHERE solution_id = ? AND user_id = ?',
      reactionMatch[1],
      user.id,
    );
    const active = desired ?? !existing;
    if (!active && existing) {
      await run(db, 'DELETE FROM solution_reactions WHERE id = ?', existing.id);
      return { active: false };
    }
    if (active && !existing) {
      const solution = await first<{ id: string }>(
        db,
        "SELECT id FROM solutions WHERE id = ? AND deleted_at IS NULL AND visibility = 'MEMBERS'",
        reactionMatch[1],
      );
      if (!solution) throw new RouteError(404, '풀이를 찾을 수 없습니다.');
      await run(
        db,
        `INSERT INTO solution_reactions (id, solution_id, user_id, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(solution_id, user_id) DO NOTHING`,
        newId(),
        reactionMatch[1],
        user.id,
        nowIso(),
      );
    }
    return { active };
  }
  const commentMatch = path.match(/^\/coding\/solutions\/([^/]+)\/comments$/);
  if (commentMatch && method === 'POST') {
    const body = await readJson(request);
    const markdown = sourceText(body.markdown);
    if (!markdown.trim()) throw new RouteError(400, '댓글 내용이 필요합니다.');
    const solution = await first<{ authorId: string }>(
      db,
      'SELECT author_id AS authorId FROM solutions WHERE id = ? AND deleted_at IS NULL',
      commentMatch[1],
    );
    if (!solution) throw new RouteError(404, '풀이를 찾을 수 없습니다.');
    const parentId = typeof body.parentId === 'string' && body.parentId ? body.parentId : null;
    let notifyUserId = solution.authorId;
    if (parentId) {
      const parent = await first<{ authorId: string; parentId: string | null; solutionId: string }>(
        db,
        'SELECT author_id AS authorId, parent_id AS parentId, solution_id AS solutionId FROM solution_comments WHERE id = ?',
        parentId,
      );
      if (!parent || parent.parentId || parent.solutionId !== commentMatch[1])
        throw new RouteError(400, '답글은 한 단계까지만 지원합니다.');
      notifyUserId = parent.authorId;
    }
    const timestamp = nowIso();
    const id = newId();
    const statements = [
      db
        .prepare(
          `INSERT INTO solution_comments (id, solution_id, author_id, parent_id, markdown, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, commentMatch[1], user.id, parentId, markdown, timestamp, timestamp),
    ];
    if (notifyUserId !== user.id) {
      const preference = await first<{ enabled: number | boolean }>(
        db,
        'SELECT comment_notifications AS enabled FROM users WHERE id = ?',
        notifyUserId,
      );
      if (asBoolean(preference?.enabled)) {
        statements.push(
          db
            .prepare(
              `INSERT INTO notifications
                 (id, user_id, type, title, message, href, dedupe_key, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(user_id, dedupe_key) DO NOTHING`,
            )
            .bind(
              newId(),
              notifyUserId,
              parentId ? 'REPLY' : 'COMMENT',
              parentId ? '새 답글' : '새 댓글',
              `${user.displayName}님이 의견을 남겼습니다.`,
              `/solutions?solution=${commentMatch[1]}`,
              `solution-comment:${id}:${notifyUserId}`,
              timestamp,
            ),
        );
      }
    }
    await db.batch(statements);
    return {
      id,
      solutionId: commentMatch[1],
      authorId: user.id,
      parentId,
      markdown,
      createdAt: timestamp,
    };
  }
  const commentActionMatch = path.match(/^\/coding\/comments\/([^/]+)(?:\/(report))?$/);
  if (commentActionMatch && method === 'PATCH' && !commentActionMatch[2]) {
    const body = await readJson(request);
    const markdown = sourceText(body.markdown);
    if (!markdown.trim() || markdown.length > 4_000) {
      throw new RouteError(422, '댓글은 1~4,000자로 입력해주세요.');
    }
    const result = await run(
      db,
      `UPDATE solution_comments SET markdown = ?, edited_at = ?, updated_at = ?
        WHERE id = ? AND author_id = ? AND deleted_at IS NULL AND hidden_at IS NULL`,
      markdown,
      nowIso(),
      nowIso(),
      commentActionMatch[1],
      user.id,
    );
    if (Number(result.meta?.changes || 0) !== 1)
      throw new RouteError(404, '수정할 댓글을 찾을 수 없습니다.');
    return { id: commentActionMatch[1], markdown, edited: true };
  }
  if (commentActionMatch && method === 'DELETE' && !commentActionMatch[2]) {
    const timestamp = nowIso();
    const result = await run(
      db,
      `UPDATE solution_comments SET deleted_at = ?, updated_at = ?
        WHERE id = ? AND author_id = ? AND deleted_at IS NULL`,
      timestamp,
      timestamp,
      commentActionMatch[1],
      user.id,
    );
    if (Number(result.meta?.changes || 0) !== 1)
      throw new RouteError(404, '삭제할 댓글을 찾을 수 없습니다.');
    return { id: commentActionMatch[1], deleted: true };
  }
  if (commentActionMatch?.[2] === 'report' && method === 'POST') {
    const body = await readJson(request);
    const reason = cleanText(body.reason);
    if (reason.length < 2 || reason.length > 500)
      throw new RouteError(422, '신고 사유를 2~500자로 입력해주세요.');
    const comment = await first<{ id: string; solutionId: string }>(
      db,
      'SELECT id, solution_id AS solutionId FROM solution_comments WHERE id = ? AND deleted_at IS NULL',
      commentActionMatch[1],
    );
    if (!comment) throw new RouteError(404, '신고할 댓글을 찾을 수 없습니다.');
    await audit(db, user.id, 'COMMENT_REPORTED', 'SolutionComment', comment.id, {
      solutionId: comment.solutionId,
      reason,
    });
    return { id: comment.id, reported: true };
  }
  if (method === 'GET' && path === '/coding/rankings') {
    const now = new Date();
    const kstParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const todayKst = new Date(`${kstParts}T00:00:00+09:00`);
    const weekdayName = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      weekday: 'short',
    }).format(now);
    const weekday = Math.max(
      0,
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayName),
    );
    const weekStart = new Date(todayKst);
    weekStart.setUTCDate(weekStart.getUTCDate() - ((weekday + 6) % 7));
    const monthStart = new Date(`${kstParts.slice(0, 7)}-01T00:00:00+09:00`);
    const [rows, activity] = await Promise.all([
      all<Record<string, unknown>>(
        db,
        `SELECT u.id AS userId, u.display_name AS displayName,
              COUNT(DISTINCT CASE WHEN s.solved = 1 THEN s.problem_id END) AS score,
              COUNT(DISTINCT CASE WHEN s.solved = 1 AND s.solved_at >= ? THEN s.problem_id END) AS weekly,
              COUNT(DISTINCT CASE WHEN s.solved = 1 AND s.solved_at >= ? THEN s.problem_id END) AS monthly,
              COUNT(DISTINCT dp.challenge_id) AS challengeCount
         FROM users u
         LEFT JOIN solutions s ON s.author_id = u.id AND s.deleted_at IS NULL
         LEFT JOIN daily_challenge_participations dp ON dp.user_id = u.id AND dp.completed_at IS NOT NULL
        WHERE u.is_active = 1 AND u.role = 'MEMBER'
        GROUP BY u.id, u.display_name ORDER BY score DESC, u.display_name`,
        weekStart.toISOString(),
        monthStart.toISOString(),
      ),
      all<{ userId: string; date: string }>(
        db,
        `SELECT dp.user_id AS userId, dc.kst_date AS date
           FROM daily_challenge_participations dp
           JOIN daily_challenges dc ON dc.id = dp.challenge_id
          WHERE dp.completed_at IS NOT NULL ORDER BY dp.user_id, dc.kst_date DESC`,
      ),
    ]);
    const datesByUser = new Map<string, Set<string>>();
    for (const row of activity) {
      const dates = datesByUser.get(row.userId) || new Set<string>();
      dates.add(row.date.slice(0, 10));
      datesByUser.set(row.userId, dates);
    }
    const streakFor = (userId: string) => {
      const dates = datesByUser.get(userId) || new Set<string>();
      const today = kstDate();
      const previous = new Date(`${today}T00:00:00.000Z`);
      if (!dates.has(today)) previous.setUTCDate(previous.getUTCDate() - 1);
      let streak = 0;
      while (dates.has(previous.toISOString().slice(0, 10))) {
        streak += 1;
        previous.setUTCDate(previous.getUTCDate() - 1);
      }
      return streak;
    };
    let rank = 0;
    let previousScore: number | null = null;
    return {
      calculatedAt: nowIso(),
      currentUserId: user.id,
      selfReported: true,
      periods: {
        timezone: 'Asia/Seoul',
        weeklyStart: weekStart.toISOString(),
        monthlyStart: monthStart.toISOString(),
      },
      methodology:
        '모든 멤버가 직접 저장한 SOLVED 풀이를 사용자·문제별 한 번만 자동 계산합니다. 관리자와 삭제된 풀이는 제외되며 점수는 실행 검증 결과가 아닌 자가 기록 활동입니다.',
      rows: rows.map((row, index) => {
        const score = Number(row.score || 0);
        if (previousScore !== score) rank = index + 1;
        previousScore = score;
        return {
          ...row,
          score,
          weekly: Number(row.weekly || 0),
          monthly: Number(row.monthly || 0),
          challengeCount: Number(row.challengeCount || 0),
          streak: streakFor(String(row.userId)),
          rank,
        };
      }),
    };
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
      capabilities: {
        processingQueue: false,
        commentReports: true,
      },
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
      const schema = await inspectRuntimeSchema(env.DB);
      const canary = schema.ready
        ? await first<{ jobs: number; problems: number; learning: number; searchRows: number }>(
            env.DB,
            `SELECT
               (SELECT COUNT(*) FROM jobs WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')) AS jobs,
               (SELECT COUNT(*) FROM coding_problems WHERE active = 1) AS problems,
               (SELECT COUNT(*) FROM learning_units WHERE published = 1) AS learning,
               (SELECT COUNT(*) FROM workspace_search) AS searchRows`,
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
    if (url.pathname === '/api/v1/internal/slack-digest') {
      if (request.method !== 'GET') {
        throw new RouteError(405, 'GET 요청만 허용됩니다.', 'METHOD_NOT_ALLOWED', undefined, {
          allow: 'GET',
        });
      }
      await requireDigestToken(request, env);
      return finish(responseJson(await slackDigest(env.DB, url), 200, requestId));
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
