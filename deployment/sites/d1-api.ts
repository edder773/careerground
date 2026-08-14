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

type D1Env = {
  DB: D1Database;
  OPENAI_ADMIN_EMAILS?: string;
  MAX_ACTIVE_USERS?: string;
  RATE_LIMIT_READS_PER_MINUTE?: string;
  RATE_LIMIT_WRITES_PER_MINUTE?: string;
  REQUEST_LOGGING?: string;
};

type Identity = { userId: string; email: string; displayName: string };
type UserRow = {
  id: string;
  siteUserId: string;
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
  SELECT id, site_user_id AS siteUserId, email, display_name AS displayName, role,
         is_active AS isActive, avatar_url AS avatarUrl, github_username AS githubUsername,
         preferred_language AS preferredLanguage,
         onboarding_completed_at AS onboardingCompletedAt, ranking_opt_in AS rankingOptIn,
         comment_notifications AS commentNotifications,
         deadline_notifications AS deadlineNotifications,
         review_notifications AS reviewNotifications,
         data_deletion_requested AS dataDeletionRequested,
         created_at AS createdAt, updated_at AS updatedAt
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

function identityFrom(request: Request): Identity {
  const userId = request.headers.get('oai-authenticated-user-id')?.trim();
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  if (!userId || !email) throw new RouteError(401, 'OpenAI 로그인이 필요합니다.', 'UNAUTHORIZED');
  const encodedName = request.headers.get('oai-authenticated-user-full-name');
  const encoding = request.headers.get('oai-authenticated-user-full-name-encoding');
  let displayName = email.split('@')[0] || email;
  if (encodedName && encoding === 'percent-encoded-utf-8') {
    try {
      displayName = decodeURIComponent(encodedName).trim() || displayName;
    } catch {
      // The optional name must not invalidate a valid Sites identity.
    }
  }
  return {
    userId: userId.slice(0, 255),
    email: email.slice(0, 320),
    displayName: displayName.slice(0, 80),
  };
}

const apiUser = (row: UserRow): ApiUser => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  role: row.role,
  preferredLanguage: row.preferredLanguage,
  onboardingCompleted: Boolean(row.onboardingCompletedAt),
});

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

async function resolveUser(identity: Identity, env: D1Env): Promise<UserRow> {
  const db = env.DB;
  let row = await first<UserRow>(db, `${userSelect} WHERE site_user_id = ?`, identity.userId);
  if (!row) {
    const sameEmail = await first<UserRow>(db, `${userSelect} WHERE email = ?`, identity.email);
    if (sameEmail && sameEmail.siteUserId !== identity.userId) {
      throw new RouteError(401, '이 이메일은 다른 OpenAI 계정에 연결되어 있습니다.');
    }
    row = sameEmail;
  }
  const allowedAdmins = new Set(
    (env.OPENAI_ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const timestamp = nowIso();
  if (!row) {
    const count = await first<{ count: number }>(
      db,
      'SELECT COUNT(*) AS count FROM users WHERE is_active = 1',
    );
    const maxActiveUsers = Math.max(1, int(env.MAX_ACTIVE_USERS, 100_000));
    if (Number(count?.count || 0) >= maxActiveUsers && !allowedAdmins.has(identity.email)) {
      throw new RouteError(403, '현재 활성 사용자 한도에 도달했습니다.', 'USER_LIMIT_REACHED');
    }
    const role = allowedAdmins.has(identity.email) ? 'ADMIN' : 'MEMBER';
    const id = newId();
    await env.DB.batch([
      db
        .prepare(
          `INSERT INTO users
             (id, site_user_id, email, display_name, role, preferred_language, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'javascript', ?, ?)`,
        )
        .bind(
          id,
          identity.userId,
          identity.email,
          identity.displayName,
          role,
          timestamp,
          timestamp,
        ),
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
          'OpenAI 계정과 개인 워크스페이스가 연결되었습니다.',
          `welcome:${id}`,
          timestamp,
        ),
      db
        .prepare(
          `INSERT INTO audit_logs
             (id, actor_id, action, target_type, target_id, metadata, created_at)
           VALUES (?, ?, 'OPENAI_ACCOUNT_CREATED', 'User', ?, ?, ?)`,
        )
        .bind(newId(), id, id, JSON.stringify({ provider: 'openai-sites', role }), timestamp),
    ]);
    row = await first<UserRow>(db, `${userSelect} WHERE id = ?`, id);
  } else {
    if (!asBoolean(row.isActive)) throw new RouteError(403, '비활성화된 계정입니다.');
    const role = allowedAdmins.has(identity.email) ? 'ADMIN' : 'MEMBER';
    const statements = [
      db
        .prepare(
          'UPDATE users SET site_user_id = ?, email = ?, role = ?, updated_at = ? WHERE id = ?',
        )
        .bind(identity.userId, identity.email, role, timestamp, row.id),
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
            JSON.stringify({ from: row.role, to: role, source: 'OPENAI_ADMIN_EMAILS' }),
            timestamp,
          ),
      );
    }
    await db.batch(statements);
    row = await first<UserRow>(db, `${userSelect} WHERE id = ?`, row.id);
  }
  if (!row) throw new RouteError(500, '사용자 정보를 준비하지 못했습니다.');
  return row;
}

function requireAdmin(user: UserRow) {
  if (user.role !== 'ADMIN') throw new RouteError(403, '관리자 권한이 필요합니다.', 'FORBIDDEN');
}

const routeRateKey = (method: string, pathname: string) =>
  `${method}:${pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
    '/:id',
  )}`;

async function enforceRateLimit(request: Request, env: D1Env, userId: string, path: string) {
  const method = request.method.toUpperCase();
  const configured =
    method === 'GET'
      ? int(env.RATE_LIMIT_READS_PER_MINUTE, 240)
      : int(env.RATE_LIMIT_WRITES_PER_MINUTE, 60);
  const limit = Math.max(
    1,
    Math.min(10_000, path.includes('/import/') ? Math.min(10, configured) : configured),
  );
  const now = Date.now();
  const windowStart = Math.floor(now / 60_000);
  const row = await first<{ count: number }>(
    env.DB,
    `INSERT INTO request_rate_limits (user_id, route_key, window_start, count, updated_at)
     VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(user_id, route_key, window_start)
     DO UPDATE SET count = request_rate_limits.count + 1, updated_at = excluded.updated_at
     RETURNING count`,
    userId,
    routeRateKey(method, path),
    windowStart,
    new Date(now).toISOString(),
  );
  const count = Number(row?.count || 1);
  if (count === 1) {
    await run(env.DB, 'DELETE FROM request_rate_limits WHERE window_start < ?', windowStart - 2);
  }
  if (count > limit) {
    const retryAfter = Math.max(1, 60 - Math.floor((now % 60_000) / 1000));
    throw new RouteError(
      429,
      '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      'RATE_LIMITED',
      { limit, windowSeconds: 60, retryAfter },
      { 'retry-after': String(retryAfter) },
    );
  }
}

async function collections(db: D1Database, userId: string) {
  const folders = await all<Record<string, unknown>>(
    db,
    `SELECT id, parent_id AS parentId, name, icon, color, position,
            created_at AS createdAt, updated_at AS updatedAt
       FROM collections
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, position, updated_at DESC`,
    userId,
  );
  const items = await all<Record<string, unknown>>(
    db,
    `SELECT ci.id, ci.collection_id AS collectionId, ci.item_type AS itemType,
            ci.target_id AS targetId, ci.label, ci.position, ci.created_at AS createdAt
       FROM collection_items ci
       JOIN collections c ON c.id = ci.collection_id
      WHERE c.user_id = ? AND c.deleted_at IS NULL
      ORDER BY ci.position`,
    userId,
  );
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
}

async function ensureDeadlineNotifications(db: D1Database, user: UserRow) {
  if (!asBoolean(user.deadlineNotifications)) return;
  const now = new Date();
  const todayKst = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now) + 'T00:00:00+09:00',
  );
  const end = new Date(todayKst.getTime() + 8 * 86_400_000);
  const rows = await all<{ jobId: string; title: string; deadlineAt: string }>(
    db,
    `SELECT j.id AS jobId, j.title, j.deadline_at AS deadlineAt
       FROM saved_jobs sj JOIN jobs j ON j.id = sj.job_id
      WHERE sj.user_id = ? AND sj.bookmarked = 1 AND j.status = 'ACTIVE'
        AND j.deadline_at >= ? AND j.deadline_at < ?`,
    user.id,
    todayKst.toISOString(),
    end.toISOString(),
  );
  const statements = rows.flatMap((job) => {
    const deadlineKst = new Date(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(job.deadlineAt)) + 'T00:00:00+09:00',
    );
    const days = Math.round((deadlineKst.getTime() - todayKst.getTime()) / 86_400_000);
    if (![1, 3, 7].includes(days)) return [];
    const dedupeKey = `job-deadline:${job.jobId}:${job.deadlineAt}:d-${days}`;
    return [
      db
        .prepare(
          `INSERT INTO notifications
             (id, user_id, type, title, message, href, dedupe_key, expires_at, created_at)
           VALUES (?, ?, 'JOB_DEADLINE', ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, dedupe_key) DO NOTHING`,
        )
        .bind(
          newId(),
          user.id,
          `관심 공고 마감 D-${days}`,
          job.title,
          `/jobs?job=${job.jobId}`,
          dedupeKey,
          new Date(new Date(job.deadlineAt).getTime() + 7 * 86_400_000).toISOString(),
          now.toISOString(),
        ),
    ];
  });
  if (statements.length) await db.batch(statements);
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
};

async function problems(db: D1Database, userId: string, search: URLSearchParams) {
  const clauses = ['p.active = 1'];
  const filterValues: unknown[] = [];
  const level = search.get('level');
  const track = search.get('track');
  if (level) {
    clauses.push('p.level = ?');
    filterValues.push(Number(level));
  }
  if (track === 'ALGORITHM' || track === 'SQL') {
    clauses.push('p.track = ?');
    filterValues.push(track);
  }
  const paged = cursorPageRequested(search);
  const limit = paged ? cursorLimit(search, 60, 100) : 500;
  const cursor = paged
    ? decodeCursor<{ position?: unknown; id?: unknown }>(search.get('cursor'))
    : null;
  const values: unknown[] = [userId, ...filterValues];
  if (cursor) {
    const position = int(cursor.position, -1);
    const id = cleanText(cursor.id);
    if (position < 0 || !id)
      throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
    clauses.push('(p.position > ? OR (p.position = ? AND p.id > ?))');
    values.push(position, position, id);
  }
  const rows = await all<ProblemRow>(
    db,
    `SELECT p.id, p.source_url AS sourceUrl, p.display_title AS displayTitle, p.level, p.track, p.tags,
            p.position,
            pp.status, pp.favorite,
            (SELECT COUNT(*) FROM solutions s WHERE s.problem_id = p.id AND s.deleted_at IS NULL) AS solutionCount
       FROM coding_problems p
       LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = ?
      WHERE ${clauses.join(' AND ')}
      ORDER BY p.position, p.id
      LIMIT ?`,
    ...values,
    limit + (paged ? 1 : 0),
  );
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
  const total = await first<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count FROM coding_problems p WHERE ${clauses
      .filter((clause) => !clause.startsWith('(p.position >'))
      .join(' AND ')}`,
    ...filterValues,
  );
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
    total: Number(total?.count || 0),
  } satisfies CursorPage<(typeof items)[number]>;
}

const kstDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

async function dailyChallenge(
  db: D1Database,
  userId: string,
  levelSlot = 1,
  track: 'ALGORITHM' | 'SQL' = 'ALGORITHM',
  levels: number[] = [levelSlot],
) {
  const today = kstDate();
  let challenge = await first<{
    id: string;
    problemId: string;
    levelSlot: number;
    createdAt: string;
  }>(
    db,
    `SELECT id, problem_id AS problemId, level_slot AS levelSlot, created_at AS createdAt
       FROM daily_challenges WHERE kst_date = ? AND level_slot = ?`,
    today,
    levelSlot,
  );
  if (!challenge) {
    const levelPlaceholders = levels.map(() => '?').join(', ');
    const candidates = await all<{ id: string }>(
      db,
      `SELECT id FROM coding_problems WHERE active = 1 AND track = ? AND level IN (${levelPlaceholders}) ORDER BY position, id`,
      track,
      ...levels,
    );
    if (!candidates.length)
      throw new RouteError(
        404,
        `오늘의 ${track === 'SQL' ? 'SQL Lv. 3~4' : `Lv. ${levelSlot}`} 문제 후보가 없습니다.`,
      );
    const seed = [...`${today}:${track}:${levels.join('-')}`].reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    );
    const selected = candidates[seed % candidates.length];
    const timestamp = nowIso();
    const id = newId();
    await run(
      db,
      'INSERT OR IGNORE INTO daily_challenges (id, kst_date, level_slot, problem_id, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      today,
      levelSlot,
      selected.id,
      timestamp,
    );
    challenge = await first<{
      id: string;
      problemId: string;
      levelSlot: number;
      createdAt: string;
    }>(
      db,
      `SELECT id, problem_id AS problemId, level_slot AS levelSlot, created_at AS createdAt
         FROM daily_challenges WHERE kst_date = ? AND level_slot = ?`,
      today,
      levelSlot,
    );
  }
  if (!challenge) throw new RouteError(500, '오늘의 문제를 준비하지 못했습니다.');
  const exact = await first<ProblemRow>(
    db,
    `SELECT p.id, p.source_url AS sourceUrl, p.display_title AS displayTitle, p.level, p.track, p.tags,
            pp.status, pp.favorite,
            (SELECT COUNT(*) FROM solutions s WHERE s.problem_id = p.id AND s.deleted_at IS NULL) AS solutionCount
       FROM coding_problems p
       LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = ?
      WHERE p.id = ?`,
    userId,
    challenge.problemId,
  );
  if (!exact) throw new RouteError(500, '오늘의 문제 정보를 찾지 못했습니다.');
  const problemValue = {
    id: exact.id,
    sourceUrl: exact.sourceUrl,
    displayTitle: exact.displayTitle,
    level: exact.level,
    track: exact.track,
    tags: parseArray(exact.tags),
    progress: exact.status ? [{ status: exact.status, favorite: asBoolean(exact.favorite) }] : [],
    _count: { solutions: Number(exact.solutionCount || 0) },
  };
  return { ...challenge, problem: problemValue };
}

async function dailyChallenges(db: D1Database, userId: string) {
  return Promise.all([
    dailyChallenge(db, userId, 1, 'ALGORITHM', [1]),
    dailyChallenge(db, userId, 2, 'ALGORITHM', [2]),
    dailyChallenge(db, userId, 34, 'SQL', [3, 4]),
  ]);
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
            s.code, s.description, s.time_complexity AS timeComplexity,
            s.space_complexity AS spaceComplexity, s.lessons, s.solved, s.visibility,
            s.current_rev AS currentRev, s.created_at AS createdAt, s.updated_at AS updatedAt,
            u.display_name AS authorDisplayName,
            p.display_title AS problemTitle, p.level AS problemLevel
       FROM solutions s
       JOIN users u ON u.id = s.author_id
       JOIN coding_problems p ON p.id = s.problem_id
      WHERE ${clauses.join(' AND ')}
      ORDER BY s.updated_at DESC, s.id DESC
      LIMIT ?`,
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
  if (!pageRows.length)
    return paged ? ({ items: [], nextCursor: null, total } satisfies CursorPage<never>) : [];
  const placeholders = pageRows.map(() => '?').join(',');
  const ids = pageRows.map((row) => row.id);
  const [revisions, reactions, commentRows] = await Promise.all([
    all<Record<string, unknown>>(
      db,
      `SELECT id, solution_id AS solutionId, revision, code, description, created_at AS createdAt
         FROM solution_revisions
        WHERE solution_id IN (${placeholders}) ORDER BY solution_id, revision DESC`,
      ...ids,
    ),
    all<Record<string, unknown>>(
      db,
      `SELECT id, solution_id AS solutionId, user_id AS userId, created_at AS createdAt
         FROM solution_reactions WHERE solution_id IN (${placeholders})`,
      ...ids,
    ),
    all<Record<string, unknown>>(
      db,
      `SELECT c.id, c.solution_id AS solutionId, c.parent_id AS parentId, c.markdown,
              c.deleted_at AS deletedAt, c.hidden_at AS hiddenAt, c.created_at AS createdAt,
              u.id AS authorId, u.display_name AS authorDisplayName
         FROM solution_comments c JOIN users u ON u.id = c.author_id
        WHERE c.solution_id IN (${placeholders}) ORDER BY c.solution_id, c.created_at`,
      ...ids,
    ),
  ]);
  const group = (items: Record<string, unknown>[]) => {
    const grouped = new Map<string, Record<string, unknown>[]>();
    for (const item of items) {
      const id = String(item.solutionId);
      grouped.set(id, [...(grouped.get(id) || []), item]);
    }
    return grouped;
  };
  const revisionsBySolution = group(revisions);
  const reactionsBySolution = group(reactions);
  const commentsBySolution = group(commentRows);
  const items = pageRows.map((row) => {
    const comments = commentsBySolution.get(row.id) || [];
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
        replies: [] as unknown[],
      };
    };
    const solutionReactions = reactionsBySolution.get(row.id) || [];
    return {
      id: row.id,
      problemId: row.problemId,
      title: row.title,
      language: row.language,
      code: row.code,
      description: row.description,
      timeComplexity: row.timeComplexity,
      spaceComplexity: row.spaceComplexity,
      lessons: row.lessons,
      solved: asBoolean(row.solved),
      visibility: row.visibility,
      currentRev: row.currentRev,
      canEdit: row.authorId === userId,
      revisions: (revisionsBySolution.get(row.id) || []).slice(0, 10),
      reactions: solutionReactions,
      reactionCount: solutionReactions.length,
      reactedByMe: solutionReactions.some((reaction) => reaction.userId === userId),
      comments: comments
        .filter((comment) => !comment.parentId)
        .map((comment) => ({
          ...mapComment(comment),
          replies: comments.filter((reply) => reply.parentId === comment.id).map(mapComment),
        })),
      author: { id: row.authorId, displayName: row.authorDisplayName },
      problem: { displayTitle: row.problemTitle, level: row.problemLevel },
    };
  });
  if (!paged) return items;
  const last = pageRows.at(-1);
  return {
    items,
    nextCursor: hasMore && last ? encodeCursor({ updatedAt: last.updatedAt, id: last.id }) : null,
    total,
  } satisfies CursorPage<(typeof items)[number]>;
}

function serializeJobRows(rows: Record<string, unknown>[]) {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    region: row.region,
    remote: asBoolean(row.remote),
    techStack: parseArray(row.tech_stack),
    publishedAt: null,
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

async function calendarJobList(
  db: D1Database,
  userId: string,
  from: string,
  to: string,
  companySizes: string[],
  categories: string[],
) {
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
  const select = (indexName: string, scheduleClause: string) => `
    SELECT j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
           j.collected_at, j.deadline_at, j.rolling, j.summary, j.source_url, j.company_name,
           j.company_size, j.source_name, j.last_verified_at,
           sj.status AS savedStatus, sj.memo AS savedMemo, sj.bookmarked AS savedBookmarked
      FROM jobs j INDEXED BY ${indexName}
      LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
     WHERE j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
       AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
       AND ${scheduleClause}
       ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
     LIMIT 200`;
  const statement = (indexName: string, scheduleClause: string, ...scheduleValues: unknown[]) =>
    db.prepare(select(indexName, scheduleClause)).bind(userId, ...scheduleValues, ...filterValues);
  const resultSets = await db.batch<Record<string, unknown>>([
    statement('idx_jobs_calendar_deadline', 'j.deadline_at >= ? AND j.deadline_at < ?', from, to),
    statement(
      'idx_jobs_calendar_collected',
      'j.collected_at >= ? AND j.collected_at < ?',
      from,
      to,
    ),
    statement(
      'idx_jobs_calendar_created',
      'j.collected_at IS NULL AND j.created_at >= ? AND j.created_at < ?',
      from,
      to,
    ),
    statement('idx_jobs_calendar_rolling', 'j.rolling = 1'),
  ]);
  const unique = new Map<string, Record<string, unknown>>();
  for (const result of resultSets) {
    for (const row of result.results || []) unique.set(String(row.id), row);
  }
  return serializeJobRows([...unique.values()]);
}

async function jobList(db: D1Database, userId: string, url: URL) {
  const clauses = [
    "j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')",
    "j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')",
  ];
  const values: unknown[] = [userId];
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
    clauses.push('(j.title LIKE ? OR j.company_name LIKE ? OR j.tech_stack LIKE ?)');
    const like = `%${query}%`;
    values.push(like, like, like);
  }
  if (url.searchParams.get('saved') === '1') clauses.push('sj.bookmarked = 1');
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
    return calendarJobList(db, userId, from, to, companySizes, categories);
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
        : "COALESCE(j.collected_at, '') DESC, j.id DESC";
  const indexName =
    sortMode === 'deadline'
      ? 'idx_jobs_deadline_status'
      : sortMode === 'company'
        ? 'idx_jobs_company_status'
        : categories.length
          ? 'idx_jobs_category_created_status'
          : companySizes.length
            ? 'idx_jobs_size_created_status'
            : 'idx_jobs_calendar_collected';
  const paged = cursorPageRequested(url.searchParams);
  const limit = paged ? cursorLimit(url.searchParams, 40, 100) : 200;
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
  const rows = await all<Record<string, unknown>>(
    db,
    `SELECT j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
            j.collected_at, j.deadline_at, j.rolling, j.summary, j.source_url, j.company_name,
            j.company_size, j.source_name, j.last_verified_at,
            sj.status AS savedStatus, sj.memo AS savedMemo, sj.bookmarked AS savedBookmarked
       FROM jobs j ${calendar ? '' : `INDEXED BY ${indexName}`}
       LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
      WHERE ${clauses.join(' AND ')}
      ORDER BY ${order} LIMIT ?`,
    ...values,
    limit + (paged ? 1 : 0),
  );
  const hasMore = paged && rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const items = serializeJobRows(pageRows);
  if (!paged) return items;
  const total = await first<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count
       FROM jobs j
       LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
      WHERE ${baseClauses.join(' AND ')}`,
    ...baseValues,
  );
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
}

async function jobCategories(db: D1Database) {
  const rows = await all<{ category: string }>(
    db,
    `SELECT DISTINCT category
       FROM jobs INDEXED BY idx_jobs_category_created_status
      WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
        AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
      ORDER BY category LIMIT 100`,
  );
  return rows.map((row) => row.category);
}

async function learningList(db: D1Database, userId: string) {
  const [sources, units, cards, questions] = await Promise.all([
    all<Record<string, unknown>>(
      db,
      `SELECT id, title, subject, category, status, created_at AS createdAt, updated_at AS updatedAt
         FROM learning_sources
        WHERE status IN ('READY', 'UPLOADED', 'REQUIRES_MANUAL_PROCESSING')
        ORDER BY updated_at DESC`,
    ),
    all<Record<string, unknown>>(
      db,
      `SELECT u.id, u.source_id AS sourceId, u.title, u.summary, u.concepts, u.visuals, u.position,
              lp.completed, lp.understanding, lp.next_review_at AS nextReviewAt
         FROM learning_units u INDEXED BY idx_learning_units_published_source_position
         JOIN learning_sources s ON s.id = u.source_id
         LEFT JOIN learning_progress lp ON lp.unit_id = u.id AND lp.user_id = ?
        WHERE u.published = 1
          AND s.status IN ('READY', 'UPLOADED', 'REQUIRES_MANUAL_PROCESSING')
        ORDER BY u.source_id, u.position`,
      userId,
    ),
    all<Record<string, unknown>>(
      db,
      `SELECT f.id, f.unit_id AS unitId, f.front, f.back
         FROM flashcards f INDEXED BY idx_flashcards_unit_created
         JOIN learning_units u ON u.id = f.unit_id
         JOIN learning_sources s ON s.id = u.source_id
        WHERE u.published = 1
          AND s.status IN ('READY', 'UPLOADED', 'REQUIRES_MANUAL_PROCESSING')
        ORDER BY f.unit_id, f.created_at`,
    ),
    all<Record<string, unknown>>(
      db,
      `SELECT q.id, q.unit_id AS unitId, q.prompt, q.answer
         FROM learning_questions q INDEXED BY idx_learning_questions_unit_created
         JOIN learning_units u ON u.id = q.unit_id
         JOIN learning_sources s ON s.id = u.source_id
        WHERE u.published = 1
          AND s.status IN ('READY', 'UPLOADED', 'REQUIRES_MANUAL_PROCESSING')
        ORDER BY q.unit_id, q.created_at`,
    ),
  ]);

  const cardsByUnit = new Map<string, Record<string, unknown>[]>();
  for (const card of cards) {
    const unitId = String(card.unitId);
    cardsByUnit.set(unitId, [...(cardsByUnit.get(unitId) || []), card]);
  }
  const questionsByUnit = new Map<string, Record<string, unknown>[]>();
  for (const question of questions) {
    const unitId = String(question.unitId);
    questionsByUnit.set(unitId, [...(questionsByUnit.get(unitId) || []), question]);
  }
  const unitsBySource = new Map<string, Record<string, unknown>[]>();
  for (const unit of units) {
    const sourceId = String(unit.sourceId);
    const id = String(unit.id);
    const detail = {
      id: unit.id,
      title: unit.title,
      summary: unit.summary,
      concepts: parseArray(unit.concepts),
      visuals: parseJsonArray(unit.visuals),
      flashcards: cardsByUnit.get(id) || [],
      questions: questionsByUnit.get(id) || [],
      progress:
        unit.completed === null || unit.completed === undefined
          ? []
          : [
              {
                completed: asBoolean(unit.completed),
                understanding: unit.understanding,
                nextReviewAt: unit.nextReviewAt,
              },
            ],
    };
    unitsBySource.set(sourceId, [...(unitsBySource.get(sourceId) || []), detail]);
  }

  return sources.map((source) => ({
    ...source,
    units: unitsBySource.get(String(source.id)) || [],
  }));
}

async function noteList(db: D1Database, userId: string) {
  const rows = await all<Record<string, unknown>>(
    db,
    `SELECT n.id, n.user_id AS userId, n.title, n.markdown, n.visibility,
            n.linked_type AS linkedType, n.linked_id AS linkedId,
            n.current_rev AS currentRev, n.created_at AS createdAt, n.updated_at AS updatedAt,
            u.display_name AS authorDisplayName
       FROM notes n JOIN users u ON u.id = n.user_id
      WHERE n.deleted_at IS NULL AND n.user_id = ?
      ORDER BY n.updated_at DESC LIMIT 100`,
    userId,
  );
  if (!rows.length) return [];
  const noteIds = rows.map((row) => String(row.id));
  const revisions = await all<Record<string, unknown>>(
    db,
    `SELECT id, note_id AS noteId, revision, markdown, created_at AS createdAt
       FROM note_revisions
      WHERE note_id IN (${noteIds.map(() => '?').join(',')})
      ORDER BY note_id, revision DESC`,
    ...noteIds,
  );
  const revisionsByNote = new Map<string, Record<string, unknown>[]>();
  for (const revision of revisions) {
    const noteId = String(revision.noteId);
    revisionsByNote.set(noteId, [...(revisionsByNote.get(noteId) || []), revision]);
  }
  return rows.map((row) => ({
    ...row,
    user: { id: row.userId, displayName: row.authorDisplayName },
    canEdit: row.userId === userId,
    revisions: (revisionsByNote.get(String(row.id)) || []).slice(0, 10),
  }));
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
  if (batch) return { preview, existing: parseObject(batch.result) };
  if (preview.consumedAt) {
    throw new RouteError(409, '이미 사용된 import 미리보기입니다.', 'PREVIEW_CONSUMED');
  }
  return { preview, existing: null };
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
  };
  return { body, rows, counts };
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
  };
}

async function commitJobImport(db: D1Database, user: UserRow, input: unknown) {
  requireAdmin(user);
  const loaded = await consumeImportPreview(db, user, 'jobs', input);
  if (loaded.existing) return { ...loaded.existing, idempotent: true };
  const analyzed = await analyzeJobImport(db, JSON.parse(loaded.preview.payload));
  const timestamp = nowIso();
  const batchId = newId();
  const batch = {
    id: batchId,
    createdAt: timestamp,
    originalCount: analyzed.counts.original,
    rejectedCount: analyzed.counts.rejected,
  };
  const result = { batch, counts: analyzed.counts, idempotent: false };
  const statements = analyzed.rows
    .filter((row) => !['REJECT', 'DUPLICATE'].includes(row.outcome))
    .map((row) => {
      const item = row.item;
      return db
        .prepare(
          `INSERT INTO jobs
             (id, company_name, company_size, company_size_evidence, source_name,
              source_posting_id, source_url, title, category, career_scope, career_evidence,
              employment_type, region, remote, tech_stack, deadline_at, rolling, summary,
              status, fingerprint, collected_at, last_verified_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(source_url) DO UPDATE SET
             company_name = excluded.company_name, company_size = excluded.company_size,
             company_size_evidence = excluded.company_size_evidence,
             source_name = excluded.source_name, source_posting_id = excluded.source_posting_id,
             title = excluded.title, category = excluded.category,
             career_scope = excluded.career_scope, career_evidence = excluded.career_evidence,
             employment_type = excluded.employment_type, region = excluded.region,
             remote = excluded.remote, tech_stack = excluded.tech_stack,
             deadline_at = excluded.deadline_at, rolling = excluded.rolling,
             summary = excluded.summary, status = excluded.status,
             fingerprint = excluded.fingerprint, collected_at = excluded.collected_at,
             last_verified_at = excluded.last_verified_at, updated_at = excluded.updated_at`,
        )
        .bind(
          row.existingId || newId(),
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
            'INSERT INTO learning_questions (id, unit_id, prompt, answer, created_at) VALUES (?, ?, ?, ?, ?)',
          )
          .bind(
            newId(),
            unitId,
            sourceText(question.prompt),
            sourceText(question.answer),
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

  if (method === 'GET' && path === '/collections') return collections(db, user.id);
  if (method === 'GET' && path === '/collections/trash') {
    return all(
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
          'UPDATE collections SET deleted_at = NULL, updated_at = ? WHERE id = ? AND user_id = ?',
        )
        .bind(timestamp, current.id, user.id),
      db
        .prepare(
          `UPDATE collections SET deleted_at = NULL, updated_at = ?
            WHERE parent_id = ? AND user_id = ? AND deleted_at = ?`,
        )
        .bind(timestamp, current.id, user.id, current.deletedAt),
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
    if (!name) throw new RouteError(400, '폴더 이름이 필요합니다.');
    await run(
      db,
      'UPDATE collections SET name = ?, icon = ?, color = ?, updated_at = ? WHERE id = ?',
      name,
      body.icon === undefined ? current.icon : cleanText(body.icon, 'folder'),
      body.color === undefined ? current.color : cleanText(body.color, 'amber'),
      nowIso(),
      collectionMatch[1],
    );
    return { ...current, name, items: [] };
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
        .prepare('UPDATE collections SET deleted_at = ?, updated_at = ? WHERE id = ?')
        .bind(timestamp, timestamp, collectionMatch[1]),
      db
        .prepare(
          'UPDATE collections SET deleted_at = ?, updated_at = ? WHERE parent_id = ? AND user_id = ?',
        )
        .bind(timestamp, timestamp, collectionMatch[1], user.id),
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
      'NOTE',
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
        NOTE: 'SELECT id FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
        JOB_POSTING: 'SELECT id FROM jobs WHERE id = ?',
        CODING_PROBLEM: 'SELECT id FROM coding_problems WHERE id = ? AND active = 1',
        SOLUTION:
          "SELECT id FROM solutions WHERE id = ? AND deleted_at IS NULL AND (visibility = 'MEMBERS' OR author_id = ?)",
        LEARNING_UNIT: 'SELECT id FROM learning_units WHERE id = ? AND published = 1',
      };
      const ownerScoped = ['NOTE', 'SOLUTION'].includes(itemType);
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

  if (method === 'GET' && path === '/dashboard') {
    const now = nowIso();
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const weekAhead = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const [recent, expiring, due] = await Promise.all([
      first<{ count: number }>(
        db,
        "SELECT COUNT(*) AS count FROM jobs WHERE status = 'ACTIVE' AND created_at >= ?",
        weekAgo,
      ),
      first<{ count: number }>(
        db,
        `SELECT COUNT(*) AS count FROM saved_jobs sj JOIN jobs j ON j.id = sj.job_id WHERE sj.user_id = ? AND j.status = 'ACTIVE' AND j.deadline_at BETWEEN ? AND ?`,
        user.id,
        now,
        weekAhead,
      ),
      first<{ count: number }>(
        db,
        'SELECT COUNT(*) AS count FROM learning_progress WHERE user_id = ? AND next_review_at <= ?',
        user.id,
        now,
      ),
    ]);
    return {
      recentJobs: Number(recent?.count || 0),
      expiringJobs: Number(expiring?.count || 0),
      dueReviews: Number(due?.count || 0),
      recentActivity: [],
    };
  }
  if (method === 'GET' && path === '/search') {
    const query = cleanText(url.searchParams.get('q'));
    if (query.length < 2) throw new RouteError(400, '검색어는 2자 이상이어야 합니다.');
    const like = `%${query}%`;
    const [folders, notes, jobs, codingProblems, foundSolutions, learning] = await Promise.all([
      all<{ id: string; name: string }>(
        db,
        'SELECT id, name FROM collections WHERE user_id = ? AND deleted_at IS NULL AND name LIKE ? LIMIT 10',
        user.id,
        like,
      ),
      all<{ id: string; title: string; updatedAt: string }>(
        db,
        `SELECT id, title, updated_at AS updatedAt FROM notes WHERE deleted_at IS NULL AND user_id = ? AND (title LIKE ? OR markdown LIKE ?) LIMIT 10`,
        user.id,
        like,
        like,
      ),
      all<{ id: string; title: string; companyName: string }>(
        db,
        'SELECT id, title, company_name AS companyName FROM jobs WHERE title LIKE ? OR company_name LIKE ? LIMIT 10',
        like,
        like,
      ),
      all<{ id: string; displayTitle: string; level: string }>(
        db,
        'SELECT id, display_title AS displayTitle, level FROM coding_problems WHERE active = 1 AND display_title LIKE ? LIMIT 10',
        like,
      ),
      all<{ id: string; title: string }>(
        db,
        `SELECT id, title FROM solutions WHERE deleted_at IS NULL AND (visibility = 'MEMBERS' OR author_id = ?) AND title LIKE ? LIMIT 10`,
        user.id,
        like,
      ),
      all<{ id: string; title: string; summary: string; sourceTitle: string }>(
        db,
        `SELECT u.id, u.title, u.summary, s.title AS sourceTitle FROM learning_units u JOIN learning_sources s ON s.id = u.source_id WHERE u.published = 1 AND (u.title LIKE ? OR u.summary LIKE ?) LIMIT 10`,
        like,
        like,
      ),
    ]);
    return {
      query,
      folders: folders.map((item) => ({ ...item, href: `/?folder=${String(item.id)}` })),
      notes: notes.map((item) => ({ ...item, href: `/notes?note=${String(item.id)}` })),
      jobs: jobs.map((item) => ({ ...item, href: `/jobs?job=${String(item.id)}` })),
      problems: codingProblems.map((item) => ({
        ...item,
        href: `/coding?problem=${String(item.id)}`,
      })),
      solutions: foundSolutions.map((item) => ({
        ...item,
        href: `/solutions?solution=${String(item.id)}`,
      })),
      learning: learning.map((item) => ({
        ...item,
        href: `/learning?unit=${String(item.id)}`,
      })),
    };
  }

  if (method === 'GET' && path === '/notifications/unread-count') {
    await ensureDeadlineNotifications(db, user);
    const row = await first<{ count: number }>(
      db,
      `SELECT COUNT(*) AS count FROM notifications
        WHERE user_id = ? AND read_at IS NULL AND (expires_at IS NULL OR expires_at > ?)`,
      user.id,
      nowIso(),
    );
    return { count: Number(row?.count || 0) };
  }
  if (method === 'GET' && path === '/notifications') {
    return all(
      db,
      `SELECT id, type, title, message, href, read_at AS readAt, created_at AS createdAt FROM notifications WHERE user_id = ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY created_at DESC LIMIT 100`,
      user.id,
      nowIso(),
    );
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

  if (method === 'GET' && path === '/notes') return noteList(db, user.id);
  if (method === 'GET' && path === '/notes/trash') {
    return all(
      db,
      `SELECT id, title, deleted_at AS deletedAt
         FROM notes WHERE user_id = ? AND deleted_at IS NOT NULL
        ORDER BY deleted_at DESC LIMIT 50`,
      user.id,
    );
  }
  if (method === 'POST' && path === '/notes') {
    const body = await readJson(request);
    const title = cleanText(body.title);
    const markdown = sourceText(body.markdown);
    const visibility = 'PRIVATE';
    if (!title) throw new RouteError(400, '노트 제목이 필요합니다.');
    const timestamp = nowIso();
    if (typeof body.id === 'string' && body.id) {
      const current = await first<{ id: string; userId: string; currentRev: number }>(
        db,
        'SELECT id, user_id AS userId, current_rev AS currentRev FROM notes WHERE id = ? AND deleted_at IS NULL',
        body.id,
      );
      if (!current) throw new RouteError(404, '노트를 찾을 수 없습니다.');
      if (current.userId !== user.id)
        throw new RouteError(403, '다른 사용자의 노트는 수정할 수 없습니다.');
      const baseRevision = int(body.baseRevision, -1);
      if (baseRevision !== Number(current.currentRev)) {
        const latest = await first<{ title: string; markdown: string; currentRev: number }>(
          db,
          'SELECT title, markdown, current_rev AS currentRev FROM notes WHERE id = ?',
          body.id,
        );
        throw new RouteError(409, '다른 곳에서 노트가 먼저 수정되었습니다.', 'REVISION_CONFLICT', {
          current: latest,
        });
      }
      const revision = Number(current.currentRev) + 1;
      await db.batch([
        db
          .prepare(
            `UPDATE notes SET title = ?, markdown = ?, visibility = ?, linked_type = ?, linked_id = ?, current_rev = ?, updated_at = ? WHERE id = ?`,
          )
          .bind(
            title,
            markdown,
            visibility,
            cleanText(body.linkedType) || null,
            cleanText(body.linkedId) || null,
            revision,
            timestamp,
            body.id,
          ),
        db
          .prepare(
            'INSERT INTO note_revisions (id, note_id, revision, markdown, created_at) VALUES (?, ?, ?, ?, ?)',
          )
          .bind(newId(), body.id, revision, markdown, timestamp),
      ]);
      return first(db, 'SELECT * FROM notes WHERE id = ?', body.id);
    }
    const id = newId();
    await db.batch([
      db
        .prepare(
          `INSERT INTO notes (id, user_id, title, markdown, visibility, linked_type, linked_id, current_rev, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          id,
          user.id,
          title,
          markdown,
          visibility,
          cleanText(body.linkedType) || null,
          cleanText(body.linkedId) || null,
          timestamp,
          timestamp,
        ),
      db
        .prepare(
          'INSERT INTO note_revisions (id, note_id, revision, markdown, created_at) VALUES (?, ?, 1, ?, ?)',
        )
        .bind(newId(), id, markdown, timestamp),
    ]);
    return {
      id,
      userId: user.id,
      title,
      markdown,
      visibility,
      currentRev: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  const deleteNoteMatch = path.match(/^\/notes\/([^/]+)$/);
  if (deleteNoteMatch && method === 'DELETE') {
    const result = await run(
      db,
      'UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      nowIso(),
      nowIso(),
      deleteNoteMatch[1],
      user.id,
    );
    if (!Number(result.meta?.changes || 0)) throw new RouteError(404, '노트를 찾을 수 없습니다.');
    return { id: deleteNoteMatch[1], deleted: true };
  }
  const restoreNoteMatch = path.match(/^\/notes\/([^/]+)\/restore$/);
  if (restoreNoteMatch && method === 'POST') {
    const result = await run(
      db,
      `UPDATE notes SET deleted_at = NULL, updated_at = ?
        WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`,
      nowIso(),
      restoreNoteMatch[1],
      user.id,
    );
    if (!Number(result.meta?.changes || 0))
      throw new RouteError(404, '삭제된 노트를 찾을 수 없습니다.');
    return { id: restoreNoteMatch[1], restored: true };
  }

  if (method === 'GET' && path === '/coding/problems')
    return problems(db, user.id, url.searchParams);
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
  if (method === 'POST' && path === '/coding/solutions') {
    const body = await readJson(request);
    const code = typeof body.code === 'string' ? body.code : '';
    if (bool(body.solved) && !code.trim())
      throw new RouteError(400, '해결 기록에는 코드가 필요합니다.');
    const timestamp = nowIso();
    const problemId = cleanText(body.problemId);
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
  if (method === 'GET' && path === '/coding/rankings') {
    const [rows, activity] = await Promise.all([
      all<Record<string, unknown>>(
        db,
        `SELECT u.id AS userId, u.display_name AS displayName,
              COUNT(DISTINCT CASE WHEN s.solved = 1 THEN s.problem_id END) AS score,
              COUNT(DISTINCT CASE WHEN s.solved = 1 AND s.solved_at >= datetime('now', '-7 day') THEN s.problem_id END) AS weekly,
              COUNT(DISTINCT CASE WHEN s.solved = 1 AND s.solved_at >= datetime('now', '-30 day') THEN s.problem_id END) AS monthly,
              COUNT(DISTINCT dp.challenge_id) AS challengeCount
         FROM users u
         LEFT JOIN solutions s ON s.author_id = u.id AND s.deleted_at IS NULL
         LEFT JOIN daily_challenge_participations dp ON dp.user_id = u.id AND dp.completed_at IS NOT NULL
        WHERE u.is_active = 1 AND u.role = 'MEMBER'
        GROUP BY u.id, u.display_name ORDER BY score DESC, u.display_name`,
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
      selfReported: true,
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
  if (method === 'GET' && path === '/learning/due') {
    return all(
      db,
      `SELECT lp.*, u.title, s.title AS sourceTitle FROM learning_progress lp JOIN learning_units u ON u.id = lp.unit_id JOIN learning_sources s ON s.id = u.source_id WHERE lp.user_id = ? AND lp.next_review_at <= ? ORDER BY lp.next_review_at LIMIT 100`,
      user.id,
      nowIso(),
    );
  }
  if (method === 'POST' && path === '/learning/review') {
    const body = await readJson(request);
    const unitId = cleanText(body.unitId);
    const rating = Math.min(5, Math.max(1, int(body.rating, 1)));
    const current = await first<{ repetitionCount: number; intervalDays: number }>(
      db,
      'SELECT repetition_count AS repetitionCount, interval_days AS intervalDays FROM learning_progress WHERE user_id = ? AND unit_id = ?',
      user.id,
      unitId,
    );
    const repetitionCount = rating <= 2 ? 0 : Number(current?.repetitionCount || 0) + 1;
    const intervalDays =
      rating <= 2
        ? 1
        : repetitionCount === 1
          ? 1
          : repetitionCount === 2
            ? 3
            : Math.max(4, Number(current?.intervalDays || 1) * 2);
    const timestamp = nowIso();
    const nextReviewAt = new Date(Date.now() + intervalDays * 86_400_000).toISOString();
    await run(
      db,
      `INSERT INTO learning_progress (id, user_id, unit_id, completed, understanding, last_studied_at, next_review_at, repetition_count, interval_days, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, unit_id) DO UPDATE SET completed = 1, understanding = excluded.understanding, last_studied_at = excluded.last_studied_at, next_review_at = excluded.next_review_at, repetition_count = excluded.repetition_count, interval_days = excluded.interval_days, updated_at = excluded.updated_at`,
      newId(),
      user.id,
      unitId,
      rating,
      timestamp,
      nextReviewAt,
      repetitionCount,
      intervalDays,
      timestamp,
    );
    return {
      userId: user.id,
      unitId,
      completed: true,
      understanding: rating,
      nextReviewAt,
      repetitionCount,
      intervalDays,
    };
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
        commentReports: false,
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
    if (url.pathname === '/api/v1/health' || url.pathname === '/api/v1/health/ready') {
      const ready = await first<{ ok: number }>(env.DB, 'SELECT 1 AS ok');
      return finish(
        responseJson(
          { status: ready?.ok === 1 ? 'ok' : 'not-ready', database: 'd1' },
          ready?.ok === 1 ? 200 : 503,
          requestId,
        ),
      );
    }
    const identity = identityFrom(request);
    const user = await resolveUser(identity, env);
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
