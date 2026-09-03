import {
  asBoolean,
  first,
  nowIso,
  parseArray,
  type D1Database,
  type D1PreparedStatement,
} from './d1.js';
import { RouteError, type D1Env } from './d1-api-contract.js';
import {
  cleanText,
  cursorLimit,
  cursorPageRequested,
  decodeCursor,
  encodeCursor,
  int,
  type CursorPage,
} from './d1-api-utils.js';

type BatchResult = { results?: Record<string, unknown>[] };

const batchRows = <T>(result: BatchResult | undefined) => (result?.results || []) as T[];

type ProblemRow = {
  id: string;
  sourceUrl: string;
  displayTitle: string;
  level: number;
  track: 'ALGORITHM' | 'SQL';
  tags: string;
  position: number;
  totalCount?: number;
};

type ProblemReadPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};

function problemListPlan(db: D1Database, search: URLSearchParams): ProblemReadPlan {
  const clauses = ['p.active = 1'];
  const filterValues: unknown[] = [];
  const countClauses = ['counted.active = 1'];
  const countValues: unknown[] = [];
  const level = search.get('level');
  const track = search.get('track');
  if (level) {
    const parsedLevel = Number(level);
    if (!Number.isInteger(parsedLevel) || parsedLevel < 0 || parsedLevel > 5) {
      throw new RouteError(400, '문제 레벨은 0부터 5 사이여야 합니다.', 'INVALID_LEVEL');
    }
    clauses.push('p.level = ?');
    filterValues.push(parsedLevel);
    countClauses.push('counted.level = ?');
    countValues.push(parsedLevel);
  }
  if (track) {
    if (track !== 'ALGORITHM' && track !== 'SQL') {
      throw new RouteError(400, '문제 유형은 ALGORITHM 또는 SQL이어야 합니다.', 'INVALID_TRACK');
    }
    clauses.push('p.track = ?');
    filterValues.push(track);
    countClauses.push('counted.track = ?');
    countValues.push(track);
  }
  const paged = cursorPageRequested(search);
  const limit = paged ? cursorLimit(search, 60, 100) : 500;
  const cursor = paged
    ? decodeCursor<{ position?: unknown; id?: unknown }>(search.get('cursor'))
    : null;
  const values = [...filterValues];
  if (cursor) {
    const position = int(cursor.position, -1);
    const id = cleanText(cursor.id);
    if (position < 0 || !id) {
      throw new RouteError(400, '올바른 cursor가 필요합니다.', 'INVALID_CURSOR');
    }
    clauses.push('(p.position > ? OR (p.position = ? AND p.id > ?))');
    values.push(position, position, id);
  }
  const statements = [
    db
      .prepare(
        `SELECT p.id, p.source_url AS sourceUrl, p.display_title AS displayTitle,
                p.level, p.track, p.tags, p.position,
                ${
                  paged
                    ? `(SELECT COUNT(*) FROM coding_problems counted
                         WHERE ${countClauses.join(' AND ')})`
                    : '0'
                } AS totalCount
           FROM coding_problems p
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
      }));
      if (!paged) return items;
      const last = pageRows.at(-1);
      return {
        items,
        nextCursor: hasMore && last ? encodeCursor({ position: last.position, id: last.id }) : null,
        total: Number(pageRows[0]?.totalCount || 0),
      } satisfies CursorPage<(typeof items)[number]>;
    },
  };
}

export async function publicProblems(db: D1Database, search: URLSearchParams) {
  const plan = problemListPlan(db, search);
  return plan.value((await db.batch(plan.statements)) as BatchResult[]);
}

export async function publicProblemDetail(db: D1Database, problemId: string) {
  const row = await first<ProblemRow>(
    db,
    `SELECT id, source_url AS sourceUrl, display_title AS displayTitle,
            level, track, tags, position
       FROM coding_problems
      WHERE id = ? AND active = 1`,
    problemId,
  );
  if (!row) throw new RouteError(404, '코딩 문제를 찾을 수 없습니다.', 'NOT_FOUND');
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    displayTitle: row.displayTitle,
    level: row.level,
    track: row.track,
    tags: parseArray(row.tags),
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
    bookmarked: false,
    savedBy: [],
  }));
}

type JobReadPlan = {
  statements: D1PreparedStatement[];
  value(results: BatchResult[]): unknown;
};

const visibleJobDeadlineClause = (alias: string) =>
  `(${alias}.rolling = 1 OR ${alias}.deadline_at IS NULL OR ${alias}.deadline_at >= ?)`;

function appendJobFilters(
  filters: string[],
  values: unknown[],
  companySizes: string[],
  categories: string[],
  query: string,
) {
  if (companySizes.length) {
    filters.push(`j.company_size IN (${companySizes.map(() => '?').join(', ')})`);
    values.push(...companySizes);
  }
  if (categories.length) {
    filters.push(`j.category IN (${categories.map(() => '?').join(', ')})`);
    values.push(...categories);
  }
  if (query) {
    filters.push(
      '(instr(lower(j.company_name), lower(?)) > 0 OR instr(lower(j.title), lower(?)) > 0 OR instr(lower(j.source_name), lower(?)) > 0)',
    );
    values.push(query, query, query);
  }
}

function calendarJobPlan(
  db: D1Database,
  from: string,
  to: string,
  companySizes: string[],
  categories: string[],
  query: string,
): JobReadPlan {
  const filters: string[] = [];
  const filterValues: unknown[] = [];
  appendJobFilters(filters, filterValues, companySizes, categories, query);
  const select = (indexName: string, scheduleClause: string) => `
    SELECT j.id, j.title, j.category, j.region, j.remote, j.tech_stack,
           j.published_at, j.application_start_at, j.collected_at, j.deadline_at, j.rolling,
           substr(j.summary, 1, 320) AS summary, j.source_url, j.company_name,
           j.company_size, j.source_name, j.last_verified_at
      FROM jobs j INDEXED BY ${indexName}
     WHERE j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
       AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
       AND ${visibleJobDeadlineClause('j')}
       AND ${scheduleClause}
       ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
     LIMIT 1001`;
  const statement = (indexName: string, scheduleClause: string, ...scheduleValues: unknown[]) =>
    db
      .prepare(select(indexName, scheduleClause))
      .bind(nowIso(), ...scheduleValues, ...filterValues);
  const statements = [
    statement('idx_jobs_calendar_deadline', 'j.deadline_at >= ? AND j.deadline_at < ?', from, to),
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

function jobListPlan(db: D1Database, url: URL): JobReadPlan {
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
  const query = cleanText(url.searchParams.get('q'));
  appendJobFilters(clauses, values, companySizes, categories, query);

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
    throw new RouteError(400, '올바른 마감일 조회 범위가 필요합니다.', 'INVALID_DATE_RANGE');
  }
  if (calendar && deadlineFrom && deadlineTo) {
    return calendarJobPlan(
      db,
      new Date(deadlineFrom).toISOString(),
      new Date(deadlineTo).toISOString(),
      companySizes,
      categories,
      query,
    );
  }
  if (deadlineFrom) {
    clauses.push('j.deadline_at >= ?');
    values.push(new Date(deadlineFrom).toISOString());
  }
  if (deadlineTo) {
    clauses.push('j.deadline_at < ?');
    values.push(new Date(deadlineTo).toISOString());
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
                substr(j.summary, 1, 320) AS summary, j.source_url, j.company_name,
                j.company_size, j.source_name, j.last_verified_at
           FROM jobs j ${calendar ? '' : `INDEXED BY ${indexName}`}
          WHERE ${clauses.join(' AND ')}
          ORDER BY ${order} LIMIT ?`,
      )
      .bind(...values, limit + (paged || catalog ? 1 : 0)),
  ];
  if (paged) {
    statements.push(
      db
        .prepare(`SELECT COUNT(*) AS count FROM jobs j WHERE ${baseClauses.join(' AND ')}`)
        .bind(...baseValues),
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

export type JobReadMode = 'data' | 'categories' | 'bootstrap';

export async function publicJobRead(env: D1Env, url: URL, mode: JobReadMode) {
  const includeData = mode !== 'categories';
  const includeCategories = mode !== 'data';
  const catalogBootstrap = mode === 'bootstrap' && url.searchParams.get('catalog') === 'true';
  const statements: D1PreparedStatement[] = [];
  const fetchCategories = includeCategories && !catalogBootstrap;
  const categoriesIndex = fetchCategories ? statements.length : -1;
  if (fetchCategories) statements.push(jobCategoriesStatement(env.DB));
  const planUrl = catalogBootstrap ? new URL(url) : url;
  if (catalogBootstrap) {
    planUrl.search = '';
    planUrl.searchParams.set('catalog', 'true');
  }
  const plan = includeData ? jobListPlan(env.DB, planUrl) : undefined;
  const dataIndex = statements.length;
  if (plan) statements.push(...plan.statements);
  const results = (await env.DB.batch(statements)) as BatchResult[];
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
  return { categories: categories || [], data };
}

export async function publicJobDetail(db: D1Database, jobId: string) {
  const row = await first<Record<string, unknown>>(
    db,
    `SELECT j.id, j.title, j.category, j.region, j.remote,
            COALESCE((SELECT json_group_array(jts.name)
                        FROM job_tech_stacks jts WHERE jts.job_id = j.id), j.tech_stack) AS tech_stack,
            j.published_at, j.application_start_at, j.collected_at, j.deadline_at, j.rolling,
            j.summary, j.source_url, j.company_name, j.company_size,
            j.source_name, j.last_verified_at
       FROM jobs j
      WHERE j.id = ? AND j.status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
        AND j.career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
        AND ${visibleJobDeadlineClause('j')}`,
    jobId,
    nowIso(),
  );
  if (!row) throw new RouteError(404, '채용공고를 찾을 수 없습니다.', 'NOT_FOUND');
  return serializeJobRows([row])[0];
}

export { visibleJobDeadlineClause };
