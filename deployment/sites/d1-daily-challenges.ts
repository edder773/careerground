import {
  all,
  asBoolean,
  first,
  newId,
  nowIso,
  parseArray,
  parseObject,
  type D1Database,
} from './d1.js';
import { normalizedText, sha256 } from './domain.js';
import { RouteError, type D1Env } from './d1-api-contract.js';
import { hashToken, newOpaqueToken } from './security-token.js';
import {
  duplicateJobReason,
  jobCompanyKey,
  jobDigestIdentity,
  type ComparableJob,
} from './job-dedup.js';

const cleanText = normalizedText;

export const kstDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const DAILY_DIGEST_FALLBACK_WINDOW_MS = 86_400_000;

type SlackDigestJobRow = ComparableJob & {
  id: string;
  title: string;
  deadlineAt: string | null;
  rolling: number | boolean;
  sourceName: string;
  sourceUrl: string;
};

type SlackDigestHistoryRow = ComparableJob & {
  jobId?: string;
  deliveredAt?: string;
};

type SlackDigestPayloadJob = {
  jobId: string;
  company: string;
  title: string;
  applicationStartAt: string | null;
  deadlineAt: string | null;
  rolling: number | boolean;
  sourceName: string;
  sourceUrl: string;
  companyKey: string;
  campaignKey: string;
  roleKey: string;
};

async function dailyDigestWindowStart(db: D1Database, generatedAt: string) {
  const previous = await first<{ completedAt: string | null }>(
    db,
    `SELECT completed_at AS completedAt
       FROM slack_digest_deliveries
      WHERE delivery_mode = 'DAILY' AND status = 'SENT' AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT 1`,
  );
  const completedAt = cleanText(previous?.completedAt);
  const completedTime = completedAt ? new Date(completedAt).getTime() : Number.NaN;
  const generatedTime = new Date(generatedAt).getTime();
  if (Number.isFinite(completedTime) && completedTime < generatedTime) {
    return new Date(completedTime).toISOString();
  }
  return new Date(generatedTime - DAILY_DIGEST_FALLBACK_WINDOW_MS).toISOString();
}

export async function secureTokenMatch(actual: string, expected: string) {
  const [actualHash, expectedHash] = await Promise.all([sha256(actual), sha256(expected)]);
  let difference = actualHash.length ^ expectedHash.length;
  const length = Math.max(actualHash.length, expectedHash.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (actualHash.charCodeAt(index) || 0) ^ (expectedHash.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export async function requireDigestToken(request: Request, env: D1Env) {
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
};

const dailyChallengeRowsSql = `SELECT dc.id, dc.problem_id AS problemId,
                                      dc.level_slot AS levelSlot, dc.created_at AS createdAt,
                                      p.source_url AS sourceUrl,
                                      p.display_title AS displayTitle, p.level, p.track, p.tags
                                 FROM daily_challenges dc
                                 JOIN coding_problems p ON p.id = dc.problem_id AND p.active = 1
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
  },
});

const dailyChallengeRowMatchesSlot = (row: DailyChallengeRow) => {
  if (row.levelSlot === 1) return row.track === 'ALGORITHM' && row.level === 1;
  if (row.levelSlot === 2) return row.track === 'ALGORITHM' && row.level === 2;
  if (row.levelSlot === 34) return row.track === 'SQL' && [3, 4].includes(row.level);
  return false;
};

const hasEveryDailyChallenge = (rows: DailyChallengeRow[]) => {
  const slots = new Set(
    rows.filter(dailyChallengeRowMatchesSlot).map((row) => Number(row.levelSlot)),
  );
  return [1, 2, 34].every((levelSlot) => slots.has(levelSlot));
};

async function removeInvalidDailyChallengeRows(db: D1Database, rows: DailyChallengeRow[]) {
  const invalidIds = rows.filter((row) => !dailyChallengeRowMatchesSlot(row)).map((row) => row.id);
  if (!invalidIds.length) return rows;
  const placeholders = invalidIds.map(() => '?').join(', ');
  await db
    .prepare(`DELETE FROM daily_challenges WHERE id IN (${placeholders})`)
    .bind(...invalidIds)
    .run();
  return rows.filter(dailyChallengeRowMatchesSlot);
}

const seededCandidateIndex = (value: string, candidateCount: number) => {
  let seed = 0x811c9dc5;
  for (const character of value) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  return seed % candidateCount;
};

async function availableCandidates(
  db: D1Database,
  sql: string,
  bindings: Array<string | number>,
  strictCutoff: string,
  today: string,
  allowRepeatRelaxation: boolean,
) {
  const strict = await all<{ id: string }>(db, sql, ...bindings, strictCutoff);
  if (strict.length) return strict;

  // Availability is more important than the preferred repeat window. A finite
  // catalog (especially SQL Lv.3~4) will eventually be exhausted, so fall back
  // to excluding only today's selections instead of failing the whole page and
  // Slack digest. The setting still permits the relaxed query to be planned up
  // front; this branch is the mandatory safety net when it is disabled.
  if (!allowRepeatRelaxation) {
    console.warn('Daily challenge repeat window exhausted; applying availability fallback', {
      strictCutoff,
      today,
    });
  }
  return all<{ id: string }>(db, sql, ...bindings, today);
}

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
  const candidatesBySpec: Array<Promise<{ id: string }[]>> = [];
  for (const spec of missing) {
    const placeholders = spec.levels.map(() => '?').join(', ');
    const sql = `SELECT id FROM coding_problems
                  WHERE active = 1 AND track = ? AND level IN (${placeholders})
                    AND id NOT IN (
                      SELECT problem_id FROM daily_challenges WHERE kst_date >= ?
                    )
                  ORDER BY position, id`;
    candidatesBySpec.push(
      availableCandidates(
        db,
        sql,
        [spec.track, ...spec.levels],
        cutoff.toISOString().slice(0, 10),
        today,
        configuration.allowRepeatRelaxation,
      ),
    );
  }
  const candidateResults = await Promise.all(candidatesBySpec);
  const timestamp = nowIso();
  const inserts = missing.map((spec, index) => {
    const candidates = candidateResults[index] || [];
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

async function dailyChallengeRows(db: D1Database, today: string) {
  return all<DailyChallengeRow>(db, dailyChallengeRowsSql, today);
}

async function completeDailyChallenges(
  db: D1Database,
  today: string,
  rows: DailyChallengeRow[],
  setting?: DailyChallengeSettingRow,
) {
  rows = await removeInvalidDailyChallengeRows(db, rows);
  if (!hasEveryDailyChallenge(rows)) {
    setting ??= (await first<DailyChallengeSettingRow>(db, dailyChallengeSettingSql)) || undefined;
    await selectMissingDailyChallenges(db, today, rows, setting);
    rows = await dailyChallengeRows(db, today);
  }
  if (!hasEveryDailyChallenge(rows)) {
    throw new RouteError(500, '오늘의 문제를 준비하지 못했습니다.');
  }
  return rows.map(dailyChallengeValue);
}

export async function dailyChallenges(db: D1Database) {
  const today = kstDate();
  const rows = await dailyChallengeRows(db, today);
  return completeDailyChallenges(db, today, rows);
}

export async function dailyChallenge(db: D1Database) {
  const challenges = await dailyChallenges(db);
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
                               AND p.track = 'ALGORITHM' AND p.level = 3
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
    const candidates = await availableCandidates(
      db,
      candidateSql,
      [],
      cutoff.toISOString().slice(0, 10),
      today,
      configuration.allowRepeatRelaxation,
    );
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

const deliveryPayloadJobs = (payload: string): SlackDigestHistoryRow[] => {
  try {
    const parsed = parseObject(JSON.parse(payload));
    return (Array.isArray(parsed.jobs) ? parsed.jobs : [])
      .map(parseObject)
      .map((job) => ({
        jobId: cleanText(job.jobId),
        companyName: cleanText(job.company),
        title: cleanText(job.title),
        applicationStartAt: cleanText(job.applicationStartAt) || null,
        deadlineAt: cleanText(job.deadlineAt) || null,
        sourceUrl: cleanText(job.sourceUrl),
      }))
      .filter((job) => job.companyName && job.title);
  } catch {
    return [];
  }
};

async function deliveredSlackJobs(db: D1Database) {
  const [ledgerRows, legacyDeliveries] = await Promise.all([
    all<SlackDigestHistoryRow>(
      db,
      `SELECT job_id AS jobId, company_name AS companyName, title,
              application_start_at AS applicationStartAt, deadline_at AS deadlineAt,
              source_url AS sourceUrl, delivered_at AS deliveredAt
         FROM slack_digest_items
        ORDER BY delivered_at DESC`,
    ),
    all<{ payload: string; completedAt: string }>(
      db,
      `SELECT payload, completed_at AS completedAt
         FROM slack_digest_deliveries
        WHERE status = 'SENT' AND completed_at IS NOT NULL
        ORDER BY completed_at DESC`,
    ),
  ]);
  const seen = new Set<string>();
  const history: SlackDigestHistoryRow[] = [];
  for (const row of ledgerRows) {
    const key = `${cleanText(row.jobId)}|${cleanText(row.sourceUrl)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    history.push(row);
  }
  for (const delivery of legacyDeliveries) {
    for (const row of deliveryPayloadJobs(delivery.payload)) {
      const key = `${cleanText(row.jobId)}|${cleanText(row.sourceUrl)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      history.push({ ...row, deliveredAt: delivery.completedAt });
    }
  }
  return history;
}

export async function slackDigest(db: D1Database, requestUrl: URL) {
  const today = kstDate();
  const generatedAt = nowIso();
  const rows = await dailyChallengeRows(db, today);
  const challenges = await completeDailyChallenges(db, today, rows);
  const advancedChallenge = await slackLv3Challenge(db, today);
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
  const windowStartedAt = snapshotCreatedAt ? null : await dailyDigestWindowStart(db, generatedAt);
  const candidateJobs = await all<SlackDigestJobRow>(
    db,
    snapshotCreatedAt
      ? `SELECT id, company_name AS companyName, title,
                application_start_at AS applicationStartAt, deadline_at AS deadlineAt, rolling,
                source_name AS sourceName, source_url AS sourceUrl
           FROM jobs
          WHERE status = 'ACTIVE'
            AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
            AND (deadline_at IS NULL OR deadline_at > ?)
            AND created_at = ?
          ORDER BY deadline_at IS NULL, deadline_at, company_name, title, id`
      : `SELECT id, company_name AS companyName, title,
                application_start_at AS applicationStartAt, deadline_at AS deadlineAt, rolling,
                source_name AS sourceName, source_url AS sourceUrl
           FROM jobs
          WHERE status = 'ACTIVE'
            AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
            AND rolling = 0
            AND deadline_at IS NOT NULL
            AND deadline_at > ?
            AND created_at > ? AND created_at <= ?
          ORDER BY deadline_at, company_name, title, id`,
    ...(snapshotCreatedAt
      ? [generatedAt, snapshotCreatedAt]
      : [generatedAt, windowStartedAt, generatedAt]),
  );
  const deliveryHistory = await deliveredSlackJobs(db);
  const historicalByCompany = new Map<string, SlackDigestHistoryRow[]>();
  for (const job of deliveryHistory) {
    const key = jobCompanyKey(job.companyName);
    const companyJobs = historicalByCompany.get(key) || [];
    companyJobs.push(job);
    historicalByCompany.set(key, companyJobs);
  }
  const includedJobs: SlackDigestJobRow[] = [];
  let suppressedDuplicateCount = 0;
  const duplicateReasons: Record<string, number> = {};
  const suppressedJobs: Array<{
    jobId: string;
    company: string;
    title: string;
    reason: string;
    matchedJobId: string;
    matchedCompany: string;
    matchedTitle: string;
  }> = [];
  for (const candidate of candidateJobs) {
    const comparisons = [
      ...(historicalByCompany.get(jobCompanyKey(candidate.companyName)) || []).map((job) => ({
        job,
        jobId: cleanText(job.jobId),
      })),
      ...includedJobs.map((job) => ({ job, jobId: job.id })),
    ];
    const duplicateMatch = comparisons
      .map(({ job, jobId }) => ({ job, jobId, reason: duplicateJobReason(candidate, job) }))
      .find((match) => Boolean(match.reason));
    if (duplicateMatch?.reason) {
      suppressedDuplicateCount += 1;
      duplicateReasons[duplicateMatch.reason] = (duplicateReasons[duplicateMatch.reason] || 0) + 1;
      suppressedJobs.push({
        jobId: candidate.id,
        company: candidate.companyName,
        title: candidate.title,
        reason: duplicateMatch.reason,
        matchedJobId: duplicateMatch.jobId,
        matchedCompany: duplicateMatch.job.companyName,
        matchedTitle: duplicateMatch.job.title,
      });
    } else {
      includedJobs.push(candidate);
    }
  }
  const jobs: SlackDigestPayloadJob[] = includedJobs.map((job) => {
    const identity = jobDigestIdentity(job);
    return {
      jobId: job.id,
      company: job.companyName,
      title: job.title,
      applicationStartAt: job.applicationStartAt || null,
      deadlineAt: job.deadlineAt,
      rolling: job.rolling,
      sourceName: job.sourceName,
      sourceUrl: job.sourceUrl,
      companyKey: identity.companyKey,
      campaignKey: identity.campaignKey,
      roleKey: identity.roleKey,
    };
  });
  return {
    date: today,
    generatedAt,
    windowStartedAt,
    snapshotCreatedAt,
    suppressedDuplicateCount,
    duplicateAudit: {
      candidateCount: candidateJobs.length,
      includedCount: jobs.length,
      suppressedCount: suppressedDuplicateCount,
      reasons: duplicateReasons,
      suppressedJobs,
    },
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

type SlackDigestDeliveryRow = {
  deliveryKey: string;
  status: 'CLAIMED' | 'SENT' | 'FAILED' | 'UNCERTAIN';
  payload: string;
  attemptCount: number;
};

type SlackDigestReservationRow = {
  jobId: string;
  deliveryKey: string;
  status: 'CLAIMED' | 'SENT' | 'UNCERTAIN';
};

const slackDigestDeliveryInput = (input: unknown) => {
  const body = parseObject(input);
  const snapshotCreatedAt = cleanText(body.snapshotCreatedAt);
  const jobsOnly = body.jobsOnly === true;
  const requireFreshJobs = body.requireFreshJobs === true;
  const dryRun = body.dryRun === true;
  if (jobsOnly && !snapshotCreatedAt) {
    throw new RouteError(
      400,
      '채용공고 전용 알림에는 스냅샷 반영 시각이 필요합니다.',
      'SNAPSHOT_REQUIRED',
    );
  }
  if (snapshotCreatedAt && requireFreshJobs) {
    throw new RouteError(
      400,
      '스냅샷 재전송에는 당일 채용 갱신 확인을 함께 사용할 수 없습니다.',
      'FRESH_JOBS_NOT_APPLICABLE',
    );
  }
  return { snapshotCreatedAt, jobsOnly, requireFreshJobs, dryRun };
};

async function committedJobsImportAfter(
  db: D1Database,
  windowStartedAt: string,
  generatedAt: string,
) {
  return first<{ id: string; committedAt: string }>(
    db,
    `SELECT id, committed_at AS committedAt
       FROM import_batches
      WHERE kind IN ('jobs', 'jobs-v5') AND status = 'COMMITTED' AND committed_at IS NOT NULL
        AND julianday(committed_at) > julianday(?)
        AND julianday(committed_at) <= julianday(?)
      ORDER BY julianday(committed_at) DESC
      LIMIT 1`,
    windowStartedAt,
    generatedAt,
  );
}

export async function claimSlackDigest(db: D1Database, requestUrl: URL, input: unknown) {
  const options = slackDigestDeliveryInput(input);
  const preliminaryDeliveryKey = options.snapshotCreatedAt
    ? `snapshot:${options.snapshotCreatedAt}:jobs`
    : `daily:${kstDate()}`;
  if (!options.dryRun) {
    const existing = await first<SlackDigestDeliveryRow>(
      db,
      `SELECT delivery_key AS deliveryKey, status, payload, attempt_count AS attemptCount
         FROM slack_digest_deliveries WHERE delivery_key = ?`,
      preliminaryDeliveryKey,
    );
    if (existing?.status === 'SENT') {
      return {
        status: 'already-sent' as const,
        deliveryKey: preliminaryDeliveryKey,
        deliveryStatus: existing.status,
        attemptCount: Number(existing.attemptCount || 0),
      };
    }
    if (existing && existing.status !== 'FAILED') {
      return {
        status: 'blocked' as const,
        deliveryKey: preliminaryDeliveryKey,
        deliveryStatus: existing.status,
        attemptCount: Number(existing.attemptCount || 0),
      };
    }
  }
  if (options.requireFreshJobs) {
    const date = kstDate();
    const generatedAt = nowIso();
    const windowStartedAt = await dailyDigestWindowStart(db, generatedAt);
    const committedImport = await committedJobsImportAfter(db, windowStartedAt, generatedAt);
    if (!committedImport) {
      return {
        status: 'not-ready' as const,
        deliveryKey: `daily:${date}`,
        reason: 'job-import-not-ready' as const,
      };
    }
  }
  const digestUrl = new URL(requestUrl);
  digestUrl.pathname = '/api/v1/internal/slack-digest';
  digestUrl.search = '';
  if (options.snapshotCreatedAt) {
    digestUrl.searchParams.set('snapshotCreatedAt', options.snapshotCreatedAt);
  }
  const payload = await slackDigest(db, digestUrl);
  const deliveryMode = options.snapshotCreatedAt ? 'SNAPSHOT' : 'DAILY';
  const deliveryKey = options.snapshotCreatedAt
    ? `snapshot:${options.snapshotCreatedAt}:jobs`
    : `daily:${payload.date}`;
  if (deliveryKey !== preliminaryDeliveryKey) {
    throw new RouteError(409, '알림 기준일이 처리 중 변경되었습니다.', 'DELIVERY_DATE_CHANGED');
  }
  if (options.dryRun) {
    return {
      status: 'preview' as const,
      deliveryKey,
      jobsOnly: options.jobsOnly,
      payload,
    };
  }
  const serializedPayload = JSON.stringify(payload);
  const payloadJobs = deliveryPayloadJobs(serializedPayload).filter((job) => cleanText(job.jobId));
  const payloadChecksum = await sha256(serializedPayload);
  const claimToken = newOpaqueToken();
  const claimTokenHash = await hashToken(claimToken);
  const timestamp = nowIso();
  const deliveryClaim = db
    .prepare(
      `INSERT INTO slack_digest_deliveries
       (delivery_key, delivery_mode, status, claim_token_hash, payload, payload_checksum,
        attempt_count, claimed_at)
     VALUES (?, ?, 'CLAIMED', ?, ?, ?, 1, ?)
     ON CONFLICT(delivery_key) DO UPDATE SET
       delivery_mode = excluded.delivery_mode,
       status = 'CLAIMED',
       claim_token_hash = excluded.claim_token_hash,
       payload = excluded.payload,
       payload_checksum = excluded.payload_checksum,
       attempt_count = slack_digest_deliveries.attempt_count + 1,
       claimed_at = excluded.claimed_at,
       completed_at = NULL,
       failed_at = NULL,
       last_error = NULL
     WHERE slack_digest_deliveries.status = 'FAILED'
     RETURNING delivery_key AS deliveryKey, status, payload, attempt_count AS attemptCount`,
    )
    .bind(deliveryKey, deliveryMode, claimTokenHash, serializedPayload, payloadChecksum, timestamp);
  const reservationClaims = payloadJobs.map((job) =>
    db
      .prepare(
        `INSERT INTO slack_digest_job_reservations
           (delivery_key, job_id, status, claimed_at, settled_at)
         VALUES (?, ?, 'CLAIMED', ?, NULL)
         ON CONFLICT(delivery_key, job_id) DO UPDATE SET
           status = 'CLAIMED', claimed_at = excluded.claimed_at, settled_at = NULL
         WHERE slack_digest_job_reservations.status = 'RELEASED'`,
      )
      .bind(deliveryKey, cleanText(job.jobId), timestamp),
  );
  let claimed: SlackDigestDeliveryRow | undefined;
  try {
    const results = await db.batch<SlackDigestDeliveryRow>([deliveryClaim, ...reservationClaims]);
    claimed = results[0]?.results?.[0];
  } catch (error) {
    const jobIds = payloadJobs.map((job) => cleanText(job.jobId));
    const reservationConflict =
      jobIds.length > 0 && /unique|constraint/iu.test(error instanceof Error ? error.message : '');
    const conflicts = reservationConflict
      ? await all<SlackDigestReservationRow>(
          db,
          `SELECT job_id AS jobId, delivery_key AS deliveryKey, status
             FROM slack_digest_job_reservations
            WHERE status IN ('CLAIMED', 'SENT', 'UNCERTAIN')
              AND job_id IN (${jobIds.map(() => '?').join(', ')})`,
          ...jobIds,
        )
      : [];
    if (!conflicts.length) throw error;
    return {
      status: 'blocked' as const,
      deliveryKey,
      deliveryStatus: 'JOB_RESERVED' as const,
      reason: 'job-already-reserved' as const,
      conflictingJobCount: new Set(conflicts.map((row) => row.jobId)).size,
    };
  }
  if (claimed) {
    return {
      status: 'claimed' as const,
      deliveryKey,
      claimToken,
      attemptCount: Number(claimed.attemptCount),
      jobsOnly: options.jobsOnly,
      payload: JSON.parse(claimed.payload) as Record<string, unknown>,
    };
  }
  const existing = await first<SlackDigestDeliveryRow>(
    db,
    `SELECT delivery_key AS deliveryKey, status, payload, attempt_count AS attemptCount
       FROM slack_digest_deliveries WHERE delivery_key = ?`,
    deliveryKey,
  );
  return {
    status: existing?.status === 'SENT' ? ('already-sent' as const) : ('blocked' as const),
    deliveryKey,
    deliveryStatus: existing?.status || 'UNKNOWN',
    attemptCount: Number(existing?.attemptCount || 0),
  };
}

export async function settleSlackDigestDelivery(
  db: D1Database,
  input: unknown,
  outcome: 'SENT' | 'FAILED' | 'UNCERTAIN',
) {
  const body = parseObject(input);
  const deliveryKey = cleanText(body.deliveryKey);
  const claimToken = cleanText(body.claimToken);
  if (!deliveryKey || !claimToken) {
    throw new RouteError(400, '발송 식별자와 claim token이 필요합니다.', 'DELIVERY_CLAIM_REQUIRED');
  }
  const claimTokenHash = await hashToken(claimToken);
  const timestamp = nowIso();
  const error = cleanText(body.error).slice(0, 500) || null;
  const claimedDelivery = await first<{ payload: string }>(
    db,
    `SELECT payload FROM slack_digest_deliveries
      WHERE delivery_key = ? AND status = 'CLAIMED' AND claim_token_hash = ?`,
    deliveryKey,
    claimTokenHash,
  );
  if (!claimedDelivery) {
    throw new RouteError(
      409,
      '발송 claim이 없거나 이미 종료되었습니다.',
      'DELIVERY_CLAIM_CONFLICT',
    );
  }
  const payloadJobs = deliveryPayloadJobs(claimedDelivery.payload).filter((job) =>
    cleanText(job.jobId),
  );
  if (payloadJobs.length) {
    const reservationCount = await first<{ count: number }>(
      db,
      `SELECT COUNT(*) AS count
         FROM slack_digest_job_reservations
        WHERE delivery_key = ? AND status = 'CLAIMED'`,
      deliveryKey,
    );
    if (Number(reservationCount?.count || 0) !== payloadJobs.length) {
      throw new RouteError(
        409,
        '채용공고 발송 예약 원장이 일치하지 않습니다.',
        'DELIVERY_RESERVATION_CONFLICT',
      );
    }
  }
  const update = db
    .prepare(
      `UPDATE slack_digest_deliveries
          SET status = ?,
              completed_at = CASE WHEN ? = 'SENT' THEN ? ELSE completed_at END,
              failed_at = CASE WHEN ? IN ('FAILED', 'UNCERTAIN') THEN ? ELSE NULL END,
              last_error = ?
        WHERE delivery_key = ? AND status = 'CLAIMED' AND claim_token_hash = ?`,
    )
    .bind(outcome, outcome, timestamp, outcome, timestamp, error, deliveryKey, claimTokenHash);
  const statements = [update];
  const reservationStatus =
    outcome === 'SENT' ? 'SENT' : outcome === 'UNCERTAIN' ? 'UNCERTAIN' : 'RELEASED';
  for (const job of payloadJobs) {
    statements.push(
      db
        .prepare(
          `UPDATE slack_digest_job_reservations
              SET status = ?, settled_at = ?
            WHERE delivery_key = ? AND job_id = ? AND status = 'CLAIMED'`,
        )
        .bind(reservationStatus, timestamp, deliveryKey, cleanText(job.jobId)),
    );
  }
  if (outcome === 'SENT') {
    for (const job of payloadJobs) {
      const jobId = cleanText(job.jobId);
      const sourceUrl = cleanText(job.sourceUrl);
      if (!jobId || !sourceUrl) continue;
      const identity = jobDigestIdentity(job);
      statements.push(
        db
          .prepare(
            `INSERT INTO slack_digest_items
               (delivery_key, job_id, company_key, campaign_key, role_key, source_url,
                company_name, title, application_start_at, deadline_at, delivered_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(delivery_key, job_id) DO NOTHING`,
          )
          .bind(
            deliveryKey,
            jobId,
            identity.companyKey,
            identity.campaignKey,
            identity.roleKey,
            sourceUrl,
            job.companyName,
            job.title,
            job.applicationStartAt || null,
            job.deadlineAt || null,
            timestamp,
          ),
      );
    }
  }
  const results = await db.batch(statements);
  if (Number(results[0]?.meta?.changes || 0) !== 1) {
    throw new RouteError(409, '발송 claim 종료가 충돌했습니다.', 'DELIVERY_CLAIM_CONFLICT');
  }
  return { status: outcome.toLowerCase(), deliveryKey };
}
