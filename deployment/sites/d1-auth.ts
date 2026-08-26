import {
  asBoolean,
  first,
  newId,
  nowIso,
  run,
  type D1Database,
  type D1PreparedStatement,
} from './d1.js';
import {
  clearSessionCookie,
  hashSessionToken,
  newSessionToken,
  SESSION_TTL_SECONDS,
  sessionCookie,
  sessionTokenFrom,
  type GoogleIdentity,
} from './google-auth.js';
import { RouteError, type ApiUser, type D1Env, type UserRow } from './d1-api-contract.js';

const int = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

export const userSelect = `
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

export const apiUser = (row: UserRow): ApiUser => ({
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

export async function audit(
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

async function prepareUserInsert(
  db: D1Database,
  values: {
    id: string;
    email: string;
    displayName: string;
    role: 'ADMIN' | 'MEMBER';
    timestamp: string;
  },
): Promise<D1PreparedStatement> {
  const legacyIdentityColumn = await first<{ count: number }>(
    db,
    `SELECT COUNT(*) AS count
       FROM pragma_table_info('users')
      WHERE name = 'site_user_id'`,
  );
  if (Number(legacyIdentityColumn?.count || 0) === 1) {
    return db
      .prepare(
        `INSERT INTO users
           (id, site_user_id, email, display_name, role, preferred_language, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'javascript', ?, ?)`,
      )
      .bind(
        values.id,
        values.id,
        values.email,
        values.displayName,
        values.role,
        values.timestamp,
        values.timestamp,
      );
  }
  return db
    .prepare(
      `INSERT INTO users
         (id, email, display_name, role, preferred_language, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'javascript', ?, ?)`,
    )
    .bind(
      values.id,
      values.email,
      values.displayName,
      values.role,
      values.timestamp,
      values.timestamp,
    );
}

export async function resolveGoogleUser(identity: GoogleIdentity, env: D1Env): Promise<UserRow> {
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
    const userInsert = await prepareUserInsert(db, {
      id,
      email: identity.email,
      displayName: identity.displayName,
      role,
      timestamp,
    });
    await db.batch([
      userInsert,
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

export async function resolveSessionUser(request: Request, env: D1Env): Promise<UserRow> {
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

export async function createSession(db: D1Database, userId: string, secure: boolean) {
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

export async function logoutSession(request: Request, env: D1Env) {
  const token = sessionTokenFrom(request);
  if (token) {
    await run(
      env.DB,
      'DELETE FROM auth_sessions WHERE token_hash = ?',
      await hashSessionToken(token),
    );
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': clearSessionCookie(env.AUTH_TEST_MODE !== 'true'),
    },
  });
}

export function requireAdmin(user: UserRow) {
  if (user.role !== 'ADMIN') {
    throw new RouteError(403, '관리자 권한이 필요합니다.', 'FORBIDDEN');
  }
}

export const routeRateKey = (method: string, pathname: string) =>
  `${method}:${pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
    '/:id',
  )}`;

export type RateLimitWindow = {
  limit: number;
  now: number;
  routeKey: string;
  windowStart: number;
};

export const rateLimitWindow = (method: string, env: D1Env, path: string): RateLimitWindow => {
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

export const assertRateLimit = (count: number, window: RateLimitWindow) => {
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

export async function enforceRateLimit(request: Request, env: D1Env, userId: string, path: string) {
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

export const rateLimitStatement = (db: D1Database, userId: string, window: RateLimitWindow) =>
  db
    .prepare(
      `INSERT INTO request_rate_limits (user_id, route_key, window_start, count, updated_at)
       VALUES (?, ?, ?, 1, ?)
       ON CONFLICT(user_id, route_key, window_start)
       DO UPDATE SET count = request_rate_limits.count + 1, updated_at = excluded.updated_at
       RETURNING count`,
    )
    .bind(userId, window.routeKey, window.windowStart, new Date(window.now).toISOString());
