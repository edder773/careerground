import {
  all,
  asBoolean,
  first,
  newId,
  nowIso,
  parseArray,
  parseObject,
  run,
  type D1Database,
} from './d1.js';

type D1Env = {
  DB: D1Database;
  OPENAI_ADMIN_EMAILS?: string;
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

class RouteError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = 'REQUEST_FAILED',
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

const responseJson = (body: unknown, status = 200, requestId?: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(requestId ? { 'x-request-id': requestId } : {}),
    },
  });

const cleanText = (value: unknown, fallback = '') =>
  (typeof value === 'string' ? value : fallback).replace(/[<>]/g, '').trim();

const bool = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback);

const int = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
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
    const count = await first<{ count: number }>(db, 'SELECT COUNT(*) AS count FROM users');
    const role =
      Number(count?.count || 0) === 0 || allowedAdmins.has(identity.email) ? 'ADMIN' : 'MEMBER';
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
             (id, user_id, type, title, message, href, created_at)
           VALUES (?, ?, 'SYSTEM', ?, ?, '/', ?)`,
        )
        .bind(
          newId(),
          id,
          'CareerGround에 오신 것을 환영합니다',
          'OpenAI 계정과 개인 워크스페이스가 연결되었습니다.',
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
    const role = allowedAdmins.has(identity.email) ? 'ADMIN' : row.role;
    await run(
      db,
      'UPDATE users SET site_user_id = ?, email = ?, role = ?, updated_at = ? WHERE id = ?',
      identity.userId,
      identity.email,
      role,
      timestamp,
      row.id,
    );
    row = await first<UserRow>(db, `${userSelect} WHERE id = ?`, row.id);
  }
  if (!row) throw new RouteError(500, '사용자 정보를 준비하지 못했습니다.');
  return row;
}

function requireAdmin(user: UserRow) {
  if (user.role !== 'ADMIN') throw new RouteError(403, '관리자 권한이 필요합니다.', 'FORBIDDEN');
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
  return folders.map((folder) => ({
    ...folder,
    items: items.filter((item) => item.collectionId === folder.id),
  }));
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
    rankingOptIn: asBoolean(row.rankingOptIn),
    dataDeletionRequested: row.dataDeletionRequested,
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
  tags: string;
  status: string | null;
  favorite: number | boolean | null;
  solutionCount: number;
};

async function problems(db: D1Database, userId: string, level?: string | null) {
  const values: unknown[] = [userId];
  let filter = '';
  if (level) {
    filter = ' AND p.level = ?';
    values.push(Number(level));
  }
  const rows = await all<ProblemRow>(
    db,
    `SELECT p.id, p.source_url AS sourceUrl, p.display_title AS displayTitle, p.level, p.tags,
            pp.status, pp.favorite,
            (SELECT COUNT(*) FROM solutions s WHERE s.problem_id = p.id AND s.deleted_at IS NULL) AS solutionCount
       FROM coding_problems p
       LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = ?
      WHERE p.active = 1${filter}
      ORDER BY p.position, p.level, p.display_title`,
    ...values,
  );
  return rows.map((row) => ({
    id: row.id,
    sourceUrl: row.sourceUrl,
    displayTitle: row.displayTitle,
    level: row.level,
    tags: parseArray(row.tags),
    progress: row.status ? [{ status: row.status, favorite: asBoolean(row.favorite) }] : [],
    _count: { solutions: Number(row.solutionCount || 0) },
  }));
}

const kstDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

async function dailyChallenge(db: D1Database, userId: string) {
  const today = kstDate();
  let challenge = await first<{ id: string; problemId: string; createdAt: string }>(
    db,
    `SELECT id, problem_id AS problemId, created_at AS createdAt
       FROM daily_challenges WHERE kst_date = ?`,
    today,
  );
  if (!challenge) {
    const setting = await first<{ allowedLevels: string }>(
      db,
      'SELECT allowed_levels AS allowedLevels FROM daily_challenge_settings WHERE id = 1',
    );
    const allowed = parseArray(setting?.allowedLevels || '[1,2]')
      .map(Number)
      .filter(Number.isFinite);
    const placeholders = allowed.map(() => '?').join(',') || '1,2';
    const candidates = await all<{ id: string }>(
      db,
      `SELECT id FROM coding_problems WHERE active = 1 AND level IN (${placeholders}) ORDER BY position, id`,
      ...allowed,
    );
    if (!candidates.length) throw new RouteError(404, '오늘의 문제 후보가 없습니다.');
    const seed = [...today].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const selected = candidates[seed % candidates.length];
    const timestamp = nowIso();
    const id = newId();
    await run(
      db,
      'INSERT OR IGNORE INTO daily_challenges (id, kst_date, problem_id, created_at) VALUES (?, ?, ?, ?)',
      id,
      today,
      selected.id,
      timestamp,
    );
    challenge = await first<{ id: string; problemId: string; createdAt: string }>(
      db,
      `SELECT id, problem_id AS problemId, created_at AS createdAt
         FROM daily_challenges WHERE kst_date = ?`,
      today,
    );
  }
  if (!challenge) throw new RouteError(500, '오늘의 문제를 준비하지 못했습니다.');
  const [problem] = await problems(db, userId);
  const exact = await first<ProblemRow>(
    db,
    `SELECT p.id, p.source_url AS sourceUrl, p.display_title AS displayTitle, p.level, p.tags,
            pp.status, pp.favorite,
            (SELECT COUNT(*) FROM solutions s WHERE s.problem_id = p.id AND s.deleted_at IS NULL) AS solutionCount
       FROM coding_problems p
       LEFT JOIN problem_progress pp ON pp.problem_id = p.id AND pp.user_id = ?
      WHERE p.id = ?`,
    userId,
    challenge.problemId,
  );
  const problemValue = exact
    ? {
        id: exact.id,
        sourceUrl: exact.sourceUrl,
        displayTitle: exact.displayTitle,
        level: exact.level,
        tags: parseArray(exact.tags),
        progress: exact.status
          ? [{ status: exact.status, favorite: asBoolean(exact.favorite) }]
          : [],
        _count: { solutions: Number(exact.solutionCount || 0) },
      }
    : problem;
  return { ...challenge, problem: problemValue };
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

async function commentsFor(db: D1Database, solutionId: string) {
  const rows = await all<Record<string, unknown>>(
    db,
    `SELECT c.id, c.parent_id AS parentId, c.markdown, c.deleted_at AS deletedAt,
            c.hidden_at AS hiddenAt, c.created_at AS createdAt,
            u.id AS authorId, u.display_name AS authorDisplayName
       FROM solution_comments c
       JOIN users u ON u.id = c.author_id
      WHERE c.solution_id = ?
      ORDER BY c.created_at`,
    solutionId,
  );
  const mapComment = (row: Record<string, unknown>) => ({
    id: row.id,
    markdown: row.markdown,
    deletedAt: row.deletedAt,
    hiddenAt: row.hiddenAt,
    createdAt: row.createdAt,
    author: { id: row.authorId, displayName: row.authorDisplayName },
    replies: [] as unknown[],
  });
  return rows
    .filter((row) => !row.parentId)
    .map((row) => ({
      ...mapComment(row),
      replies: rows.filter((reply) => reply.parentId === row.id).map(mapComment),
    }));
}

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
      ORDER BY s.updated_at DESC`,
    ...values,
  );
  return Promise.all(
    rows.map(async (row) => {
      const [revisions, reactions, comments] = await Promise.all([
        all<Record<string, unknown>>(
          db,
          `SELECT id, revision, code, description, created_at AS createdAt
             FROM solution_revisions WHERE solution_id = ? ORDER BY revision DESC LIMIT 10`,
          row.id,
        ),
        all<Record<string, unknown>>(
          db,
          'SELECT id, user_id AS userId, created_at AS createdAt FROM solution_reactions WHERE solution_id = ?',
          row.id,
        ),
        commentsFor(db, row.id),
      ]);
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
        revisions,
        reactions,
        comments,
        author: { id: row.authorId, displayName: row.authorDisplayName },
        problem: { displayTitle: row.problemTitle, level: row.problemLevel },
      };
    }),
  );
}

async function jobList(db: D1Database, userId: string, url: URL) {
  const clauses = [
    "j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')",
    "j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')",
  ];
  const values: unknown[] = [userId];
  const companySize = url.searchParams.get('companySize');
  const category = url.searchParams.get('category');
  if (companySize) {
    clauses.push('j.company_size = ?');
    values.push(companySize);
  }
  if (category) {
    clauses.push('j.category = ?');
    values.push(category);
  }
  const order =
    url.searchParams.get('sort') === 'deadline'
      ? 'j.deadline_at ASC'
      : url.searchParams.get('sort') === 'company'
        ? 'j.company_name ASC'
        : 'j.created_at DESC';
  const rows = await all<Record<string, unknown>>(
    db,
    `SELECT j.*, sj.status AS savedStatus, sj.memo AS savedMemo
       FROM jobs j
       LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = ?
      WHERE ${clauses.join(' AND ')}
      ORDER BY ${order} LIMIT 100`,
    ...values,
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    region: row.region,
    remote: asBoolean(row.remote),
    techStack: parseArray(row.tech_stack),
    deadlineAt: row.deadline_at,
    rolling: asBoolean(row.rolling),
    summary: row.summary,
    sourceUrl: row.source_url,
    company: { name: row.company_name, size: row.company_size },
    source: { name: row.source_name, lastSuccessAt: row.last_verified_at },
    savedBy: row.savedStatus ? [{ status: row.savedStatus, memo: row.savedMemo || '' }] : [],
  }));
}

async function learningList(db: D1Database, userId: string) {
  const sources = await all<Record<string, unknown>>(
    db,
    `SELECT id, title, subject, category, status, created_at AS createdAt, updated_at AS updatedAt
       FROM learning_sources WHERE status IN ('READY', 'UPLOADED', 'REQUIRES_MANUAL_PROCESSING')
      ORDER BY updated_at DESC`,
  );
  return Promise.all(
    sources.map(async (source) => {
      const units = await all<Record<string, unknown>>(
        db,
        `SELECT u.id, u.title, u.summary, u.concepts, u.position,
                lp.completed, lp.understanding, lp.next_review_at AS nextReviewAt
           FROM learning_units u
           LEFT JOIN learning_progress lp ON lp.unit_id = u.id AND lp.user_id = ?
          WHERE u.source_id = ? AND u.published = 1 ORDER BY u.position`,
        userId,
        source.id,
      );
      const withDetails = await Promise.all(
        units.map(async (unit) => {
          const [cards, questions] = await Promise.all([
            all<Record<string, unknown>>(
              db,
              'SELECT id, front, back FROM flashcards WHERE unit_id = ? ORDER BY created_at',
              unit.id,
            ),
            all<Record<string, unknown>>(
              db,
              'SELECT id, prompt, answer FROM learning_questions WHERE unit_id = ? ORDER BY created_at',
              unit.id,
            ),
          ]);
          return {
            id: unit.id,
            title: unit.title,
            summary: unit.summary,
            concepts: parseArray(unit.concepts),
            flashcards: cards,
            questions,
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
        }),
      );
      return { ...source, units: withDetails };
    }),
  );
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
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      user: { id: row.userId, displayName: row.authorDisplayName },
      canEdit: row.userId === userId,
      revisions: await all<Record<string, unknown>>(
        db,
        `SELECT id, revision, markdown, created_at AS createdAt
           FROM note_revisions WHERE note_id = ? ORDER BY revision DESC LIMIT 10`,
        row.id,
      ),
    })),
  );
}

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function importObject(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new RouteError(400, '정형 import JSON 객체가 필요합니다.');
  }
  return input as Record<string, unknown>;
}

async function jobImport(db: D1Database, user: UserRow, input: unknown, commit: boolean) {
  requireAdmin(user);
  const body = importObject(input);
  const items = Array.isArray(body.items) ? body.items : [];
  if (body.version !== '1.0' || !items.length) {
    throw new RouteError(400, 'version 1.0과 하나 이상의 items가 필요합니다.');
  }
  const analyzed = items.map((raw, index) => {
    const item = importObject(raw);
    const careerScope = cleanText(item.careerScope);
    const sourceUrl = cleanText(item.sourceUrl);
    const invalid =
      !sourceUrl ||
      !cleanText(item.companyName) ||
      !cleanText(item.title) ||
      !cleanText(item.category);
    const needsReview =
      cleanText(item.companySize, 'UNCLASSIFIED') === 'UNCLASSIFIED' ||
      cleanText(item.status) === 'NEEDS_REVIEW';
    const outcome = invalid
      ? 'REJECT'
      : careerScope === 'CAREER_ONLY'
        ? 'REJECT'
        : needsReview
          ? 'REVIEW'
          : 'CREATE';
    return {
      index,
      outcome,
      reason: invalid
        ? '필수 필드 누락'
        : careerScope === 'CAREER_ONLY'
          ? '경력직 전용 공고'
          : needsReview
            ? '회사 규모 또는 공고 분류 검토 필요'
            : '반영 가능',
      item,
    };
  });
  const counts = {
    original: analyzed.length,
    create: analyzed.filter((row) => row.outcome === 'CREATE').length,
    update: 0,
    duplicate: 0,
    rejected: analyzed.filter((row) => row.outcome === 'REJECT').length,
    review: analyzed.filter((row) => row.outcome === 'REVIEW').length,
  };
  if (!commit) return { valid: true, counts, rows: analyzed };
  const timestamp = nowIso();
  for (const row of analyzed.filter((value) => value.outcome !== 'REJECT')) {
    const item = row.item;
    const sourceUrl = new URL(cleanText(item.sourceUrl));
    sourceUrl.hash = '';
    const id = newId();
    await run(
      db,
      `INSERT INTO jobs
         (id, company_name, company_size, company_size_evidence, source_name, source_posting_id,
          source_url, title, category, career_scope, career_evidence, employment_type, region,
          remote, tech_stack, deadline_at, rolling, summary, status, collected_at,
          last_verified_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
         collected_at = excluded.collected_at, last_verified_at = excluded.last_verified_at,
         updated_at = excluded.updated_at`,
      id,
      cleanText(item.companyName),
      cleanText(item.companySize, 'UNCLASSIFIED'),
      cleanText(item.companySizeEvidence) || null,
      cleanText(item.sourceName, '관리자 import'),
      cleanText(item.sourceId) || null,
      sourceUrl.toString(),
      cleanText(item.title),
      cleanText(item.category),
      cleanText(item.careerScope, 'NEW_GRAD_ELIGIBLE'),
      cleanText(item.careerEvidence),
      cleanText(item.employmentType, 'FULL_TIME'),
      cleanText(item.region, '미정'),
      bool(item.remote) ? 1 : 0,
      JSON.stringify(Array.isArray(item.techStack) ? item.techStack.map(String) : []),
      typeof item.deadlineAt === 'string' ? item.deadlineAt : null,
      bool(item.rolling) ? 1 : 0,
      cleanText(item.summary),
      row.outcome === 'REVIEW' ? 'NEEDS_REVIEW' : cleanText(item.status, 'ACTIVE'),
      cleanText(item.collectedAt, timestamp),
      cleanText(item.lastVerifiedAt, timestamp),
      timestamp,
      timestamp,
    );
  }
  const checksum = await digest(JSON.stringify(body));
  const batchId = newId();
  await run(
    db,
    `INSERT OR IGNORE INTO import_batches
       (id, kind, checksum, original_count, rejected_count, created_at)
     VALUES (?, 'jobs', ?, ?, ?, ?)`,
    batchId,
    checksum,
    counts.original,
    counts.rejected,
    timestamp,
  );
  await audit(db, user.id, 'JOB_IMPORT_APPROVED', 'ImportBatch', batchId, { counts });
  return {
    batch: {
      id: batchId,
      createdAt: timestamp,
      originalCount: counts.original,
      rejectedCount: counts.rejected,
    },
    counts,
  };
}

async function learningImport(db: D1Database, user: UserRow, input: unknown, commit: boolean) {
  requireAdmin(user);
  const body = importObject(input);
  const source = importObject(body.source);
  const units = Array.isArray(body.units) ? body.units : [];
  if (body.version !== '1.0' || !cleanText(source.title) || !units.length) {
    throw new RouteError(400, '올바른 학습 package가 필요합니다.');
  }
  const flashcardCount = units.reduce(
    (sum, raw) =>
      sum +
      (Array.isArray(importObject(raw).flashcards)
        ? (importObject(raw).flashcards as unknown[]).length
        : 0),
    0,
  );
  const questionCount = units.reduce(
    (sum, raw) =>
      sum +
      (Array.isArray(importObject(raw).questions)
        ? (importObject(raw).questions as unknown[]).length
        : 0),
    0,
  );
  const preview = {
    valid: true,
    idempotent: false,
    source,
    unitCount: units.length,
    flashcardCount,
    questionCount,
  };
  if (!commit) return preview;
  const timestamp = nowIso();
  const sourceId = newId();
  await run(
    db,
    `INSERT INTO learning_sources (id, title, subject, category, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'READY', ?, ?)`,
    sourceId,
    cleanText(source.title),
    cleanText(source.subject),
    cleanText(source.category),
    timestamp,
    timestamp,
  );
  for (const [position, raw] of units.entries()) {
    const unit = importObject(raw);
    const unitId = newId();
    await run(
      db,
      `INSERT INTO learning_units
         (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      unitId,
      sourceId,
      cleanText(unit.anchor),
      cleanText(unit.title),
      cleanText(unit.summaryMarkdown),
      JSON.stringify(Array.isArray(unit.concepts) ? unit.concepts.map(String) : []),
      position,
      timestamp,
      timestamp,
    );
    for (const rawCard of Array.isArray(unit.flashcards) ? unit.flashcards : []) {
      const card = importObject(rawCard);
      await run(
        db,
        'INSERT INTO flashcards (id, unit_id, front, back, created_at) VALUES (?, ?, ?, ?, ?)',
        newId(),
        unitId,
        cleanText(card.front),
        cleanText(card.back),
        timestamp,
      );
    }
    for (const rawQuestion of Array.isArray(unit.questions) ? unit.questions : []) {
      const question = importObject(rawQuestion);
      await run(
        db,
        'INSERT INTO learning_questions (id, unit_id, prompt, answer, created_at) VALUES (?, ?, ?, ?, ?)',
        newId(),
        unitId,
        cleanText(question.prompt),
        cleanText(question.answer),
        timestamp,
      );
    }
  }
  await audit(db, user.id, 'LEARNING_IMPORT_APPROVED', 'LearningSource', sourceId, {
    unitCount: units.length,
  });
  return { source: { id: sourceId, ...source }, idempotent: false };
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
    const timestamp = nowIso();
    await run(
      db,
      `UPDATE users SET display_name = ?, avatar_url = ?, github_username = ?,
         preferred_language = ?, ranking_opt_in = ?, comment_notifications = ?,
         deadline_notifications = ?, review_notifications = ?, updated_at = ? WHERE id = ?`,
      displayName,
      cleanText(body.avatarUrl) || null,
      cleanText(body.githubUsername) || null,
      preferredLanguage,
      bool(body.rankingOptIn, true) ? 1 : 0,
      bool(body.commentNotifications, true) ? 1 : 0,
      bool(body.deadlineNotifications, true) ? 1 : 0,
      bool(body.reviewNotifications, true) ? 1 : 0,
      timestamp,
      user.id,
    );
    await audit(db, user.id, 'PROFILE_UPDATED', 'User', user.id);
    return profile(db, user.id);
  }
  if (method === 'GET' && path === '/auth/export') {
    const [userProfile, userCollections, notes, saved, solutions, learning] = await Promise.all([
      profile(db, user.id),
      collections(db, user.id),
      all(db, 'SELECT * FROM notes WHERE user_id = ? AND deleted_at IS NULL', user.id),
      all(db, 'SELECT * FROM saved_jobs WHERE user_id = ?', user.id),
      all(db, 'SELECT * FROM solutions WHERE author_id = ? AND deleted_at IS NULL', user.id),
      all(db, 'SELECT * FROM learning_progress WHERE user_id = ?', user.id),
    ]);
    return {
      ...userProfile,
      collections: userCollections,
      notes,
      savedJobs: saved,
      solutions,
      learningProgress: learning,
    };
  }
  if (method === 'POST' && path === '/auth/delete-request') {
    const timestamp = nowIso();
    await run(
      db,
      'UPDATE users SET data_deletion_requested = ?, updated_at = ? WHERE id = ?',
      timestamp,
      timestamp,
      user.id,
    );
    await audit(db, user.id, 'DATA_DELETION_REQUESTED', 'User', user.id);
    return { id: user.id, dataDeletionRequested: timestamp };
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
    const owned = await first<{ count: number }>(
      db,
      `SELECT COUNT(*) AS count FROM collections WHERE user_id = ? AND deleted_at IS NULL AND id IN (${placeholders})`,
      user.id,
      ...ids,
    );
    if (Number(owned?.count || 0) !== ids.length)
      throw new RouteError(403, '다른 사용자의 폴더는 이동할 수 없습니다.');
    await db.batch(
      ids.map((id, position) =>
        db
          .prepare('UPDATE collections SET position = ?, updated_at = ? WHERE id = ?')
          .bind(position, nowIso(), id),
      ),
    );
    return { ok: true };
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
      all(
        db,
        'SELECT id, name FROM collections WHERE user_id = ? AND deleted_at IS NULL AND name LIKE ? LIMIT 10',
        user.id,
        like,
      ),
      all(
        db,
        `SELECT id, title, updated_at AS updatedAt FROM notes WHERE deleted_at IS NULL AND user_id = ? AND (title LIKE ? OR markdown LIKE ?) LIMIT 10`,
        user.id,
        like,
        like,
      ),
      all(
        db,
        'SELECT id, title, company_name AS companyName FROM jobs WHERE title LIKE ? OR company_name LIKE ? LIMIT 10',
        like,
        like,
      ),
      all(
        db,
        'SELECT id, display_title AS displayTitle, level FROM coding_problems WHERE active = 1 AND display_title LIKE ? LIMIT 10',
        like,
      ),
      all(
        db,
        `SELECT id, title FROM solutions WHERE deleted_at IS NULL AND (visibility = 'MEMBERS' OR author_id = ?) AND title LIKE ? LIMIT 10`,
        user.id,
        like,
      ),
      all(
        db,
        `SELECT u.id, u.title, u.summary, s.title AS sourceTitle FROM learning_units u JOIN learning_sources s ON s.id = u.source_id WHERE u.published = 1 AND (u.title LIKE ? OR u.summary LIKE ?) LIMIT 10`,
        like,
        like,
      ),
    ]);
    return {
      query,
      folders,
      notes,
      jobs,
      problems: codingProblems,
      solutions: foundSolutions,
      learning,
    };
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
  if (method === 'POST' && path === '/notes') {
    const body = await readJson(request);
    const title = cleanText(body.title);
    const markdown = cleanText(body.markdown);
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

  if (method === 'GET' && path === '/coding/problems')
    return problems(db, user.id, url.searchParams.get('level'));
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
    await run(
      db,
      `INSERT INTO coding_problems (id, source_url, display_title, level, tags, position, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      sourceUrl.toString(),
      cleanText(body.displayTitle),
      int(body.level, 1),
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
      tags: Array.isArray(body.tags) ? body.tags : [],
    };
  }
  const progressMatch = path.match(/^\/coding\/problems\/([^/]+)\/progress$/);
  if (progressMatch && method === 'PATCH') {
    const body = await readJson(request);
    const status = cleanText(body.status, 'IN_PROGRESS');
    const timestamp = nowIso();
    await run(
      db,
      `INSERT INTO problem_progress (id, user_id, problem_id, status, favorite, memo, solved_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, problem_id) DO UPDATE SET status = excluded.status, favorite = excluded.favorite, memo = excluded.memo, solved_at = excluded.solved_at, updated_at = excluded.updated_at`,
      newId(),
      user.id,
      progressMatch[1],
      status,
      bool(body.favorite) ? 1 : 0,
      cleanText(body.memo),
      status === 'SOLVED' ? timestamp : null,
      timestamp,
    );
    return { problemId: progressMatch[1], status };
  }
  if (method === 'GET' && path === '/coding/daily-challenge') return dailyChallenge(db, user.id);
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
    if (!codeLanguages.has(language)) {
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
            cleanText(body.description),
            cleanText(body.timeComplexity) || null,
            cleanText(body.spaceComplexity) || null,
            cleanText(body.lessons),
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
          .bind(newId(), body.id, revision, code, cleanText(body.description), timestamp),
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
          cleanText(body.description),
          cleanText(body.timeComplexity) || null,
          cleanText(body.spaceComplexity) || null,
          cleanText(body.lessons),
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
        .bind(newId(), id, code, cleanText(body.description), timestamp),
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
  if (reactionMatch && method === 'POST') {
    const existing = await first<{ id: string }>(
      db,
      'SELECT id FROM solution_reactions WHERE solution_id = ? AND user_id = ?',
      reactionMatch[1],
      user.id,
    );
    if (existing) {
      await run(db, 'DELETE FROM solution_reactions WHERE id = ?', existing.id);
      return { active: false };
    }
    await run(
      db,
      'INSERT INTO solution_reactions (id, solution_id, user_id, created_at) VALUES (?, ?, ?, ?)',
      newId(),
      reactionMatch[1],
      user.id,
      nowIso(),
    );
    return { active: true };
  }
  const commentMatch = path.match(/^\/coding\/solutions\/([^/]+)\/comments$/);
  if (commentMatch && method === 'POST') {
    const body = await readJson(request);
    const markdown = cleanText(body.markdown);
    if (!markdown) throw new RouteError(400, '댓글 내용이 필요합니다.');
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
      statements.push(
        db
          .prepare(
            `INSERT INTO notifications (id, user_id, type, title, message, href, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            notifyUserId,
            parentId ? 'REPLY' : 'COMMENT',
            parentId ? '새 답글' : '새 댓글',
            `${user.displayName}님이 의견을 남겼습니다.`,
            `/solutions?solution=${commentMatch[1]}`,
            timestamp,
          ),
      );
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
    const rows = await all<Record<string, unknown>>(
      db,
      `SELECT u.id AS userId, u.display_name AS displayName,
              COUNT(DISTINCT CASE WHEN s.solved = 1 THEN s.problem_id END) AS score,
              COUNT(DISTINCT CASE WHEN s.solved = 1 AND s.solved_at >= datetime('now', '-7 day') THEN s.problem_id END) AS weekly,
              COUNT(DISTINCT CASE WHEN s.solved = 1 AND s.solved_at >= datetime('now', '-30 day') THEN s.problem_id END) AS monthly,
              COUNT(DISTINCT dp.challenge_id) AS challengeCount
         FROM users u
         LEFT JOIN solutions s ON s.author_id = u.id AND s.deleted_at IS NULL
         LEFT JOIN daily_challenge_participations dp ON dp.user_id = u.id AND dp.completed_at IS NOT NULL
        WHERE u.is_active = 1 AND u.role = 'MEMBER' AND u.ranking_opt_in = 1
        GROUP BY u.id, u.display_name ORDER BY score DESC, u.display_name`,
    );
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
          streak: 0,
          rank,
        };
      }),
    };
  }

  if (method === 'GET' && path === '/jobs') return jobList(db, user.id, url);
  if (method === 'POST' && path === '/jobs/saved') {
    const body = await readJson(request);
    const jobId = cleanText(body.jobId);
    const timestamp = nowIso();
    await run(
      db,
      `INSERT INTO saved_jobs (id, user_id, job_id, status, memo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, job_id) DO UPDATE SET status = excluded.status, memo = excluded.memo, updated_at = excluded.updated_at`,
      newId(),
      user.id,
      jobId,
      cleanText(body.status, 'INTERESTED'),
      cleanText(body.memo),
      timestamp,
      timestamp,
    );
    return { jobId, status: cleanText(body.status, 'INTERESTED') };
  }
  if (method === 'POST' && (path === '/jobs/import/preview' || path === '/jobs/import/commit')) {
    return jobImport(db, user, await readJson(request), path.endsWith('/commit'));
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
    return jobImport(db, user, parsed, path.endsWith('/commit'));
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
  if (
    method === 'POST' &&
    (path === '/learning/import/preview' || path === '/learning/import/commit')
  ) {
    return learningImport(db, user, await readJson(request), path.endsWith('/commit'));
  }
  if (method === 'POST' && path === '/learning/sources/upload') {
    requireAdmin(user);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new RouteError(400, '학습 원본 파일이 필요합니다.');
    if (file.size > 20 * 1024 * 1024) throw new RouteError(400, '파일은 20MB 이하여야 합니다.');
    const timestamp = nowIso();
    const id = newId();
    const status = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(file.type)
      ? 'REQUIRES_MANUAL_PROCESSING'
      : 'UPLOADED';
    await run(
      db,
      'INSERT INTO learning_sources (id, title, subject, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id,
      cleanText(form.get('title')),
      cleanText(form.get('subject')),
      cleanText(form.get('category')),
      status,
      timestamp,
      timestamp,
    );
    await audit(db, user.id, 'LEARNING_SOURCE_REGISTERED', 'LearningSource', id, {
      fileName: file.name,
      size: file.size,
      status,
    });
    return { id, status };
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
      maxActiveUsers: 10,
      importBatches: batches,
      processingQueue: [],
      commentReports: [],
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
  try {
    if (url.pathname === '/api/v1/health' || url.pathname === '/api/v1/health/ready') {
      const ready = await first<{ ok: number }>(env.DB, 'SELECT 1 AS ok');
      return responseJson(
        { status: ready?.ok === 1 ? 'ok' : 'not-ready', database: 'd1' },
        ready?.ok === 1 ? 200 : 503,
        requestId,
      );
    }
    const identity = identityFrom(request);
    const user = await resolveUser(identity, env);
    const result = await handleRoute(request, env, user, url);
    return result instanceof Response ? result : responseJson(result, 200, requestId);
  } catch (error) {
    if (error instanceof RouteError) {
      return responseJson(
        { code: error.code, message: error.message, requestId },
        error.status,
        requestId,
      );
    }
    const message = error instanceof Error ? error.message : '알 수 없는 데이터베이스 오류';
    console.error('D1 API request failed', {
      requestId,
      method: request.method,
      path: url.pathname,
      message,
    });
    return responseJson(
      { code: 'DATABASE_ERROR', message: '데이터 요청을 처리하지 못했습니다.', requestId },
      500,
      requestId,
    );
  }
}
