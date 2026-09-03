import { first, newId, nowIso } from './d1.js';
import { RouteError, type D1Env } from './d1-api-contract.js';
import { BUILD_INFO } from './build-info.js';
import {
  claimSlackDigest,
  dailyChallenge,
  dailyChallenges,
  requireDigestToken,
  settleSlackDigestDelivery,
  slackDigest,
} from './d1-daily-challenges.js';
import { requirePublishToken } from './d1-jobs-v5-discovery-contract.js';
import { publishDiscoveryBundle } from './d1-jobs-v5.js';
import {
  publicJobDetail,
  publicJobRead,
  publicProblemDetail,
  publicProblems,
  visibleJobDeadlineClause,
  type JobReadMode,
} from './d1-public-catalog.js';
import { readJson, readJsonWithLimit, responseJson } from './d1-api-utils.js';
import { readRuntimeSchema } from './runtime-schema.js';

const methodNotAllowed = (method: string): never => {
  throw new RouteError(405, `${method} 요청만 허용됩니다.`, 'METHOD_NOT_ALLOWED', undefined, {
    allow: method,
  });
};

const requestRouteKey = (method: string, pathname: string) => {
  const normalizedPath = pathname
    .replace(/^\/api\/v1\/jobs\/[^/]+$/, '/api/v1/jobs/:id')
    .replace(/^\/api\/v1\/coding\/problems\/[^/]+$/, '/api/v1/coding/problems/:id');
  return `${method.toUpperCase()} ${normalizedPath}`;
};

async function activePublicRoute(request: Request, env: D1Env, url: URL) {
  if (request.method !== 'GET') {
    throw new RouteError(404, 'API 경로를 찾을 수 없습니다.', 'NOT_FOUND');
  }

  const jobMode: JobReadMode | undefined =
    url.pathname === '/api/v1/jobs'
      ? 'data'
      : url.pathname === '/api/v1/jobs/categories'
        ? 'categories'
        : url.pathname === '/api/v1/jobs/bootstrap'
          ? 'bootstrap'
          : undefined;
  if (jobMode) return publicJobRead(env, url, jobMode);

  const jobDetailMatch = url.pathname.match(/^\/api\/v1\/jobs\/([^/]+)$/);
  if (jobDetailMatch) return publicJobDetail(env.DB, jobDetailMatch[1]);

  if (url.pathname === '/api/v1/coding/problems') {
    return publicProblems(env.DB, url.searchParams);
  }
  const problemDetailMatch = url.pathname.match(/^\/api\/v1\/coding\/problems\/([^/]+)$/);
  if (problemDetailMatch) return publicProblemDetail(env.DB, problemDetailMatch[1]);

  if (url.pathname === '/api/v1/coding/daily-challenges') {
    return dailyChallenges(env.DB);
  }
  if (url.pathname === '/api/v1/coding/daily-challenge') {
    return dailyChallenge(env.DB);
  }

  throw new RouteError(404, 'API 경로를 찾을 수 없습니다.', 'NOT_FOUND');
}

async function internalRoute(request: Request, env: D1Env, url: URL) {
  if (url.pathname === '/api/v1/internal/slack-digest') {
    if (request.method !== 'GET') methodNotAllowed('GET');
    await requireDigestToken(request, env);
    return slackDigest(env.DB, url);
  }
  if (url.pathname === '/api/v1/internal/slack-digest/claim') {
    if (request.method !== 'POST') methodNotAllowed('POST');
    await requireDigestToken(request, env);
    return claimSlackDigest(env.DB, url, await readJson(request));
  }
  if (url.pathname === '/api/v1/internal/slack-digest/complete') {
    if (request.method !== 'POST') methodNotAllowed('POST');
    await requireDigestToken(request, env);
    return settleSlackDigestDelivery(env.DB, await readJson(request), 'SENT');
  }
  if (url.pathname === '/api/v1/internal/slack-digest/fail') {
    if (request.method !== 'POST') methodNotAllowed('POST');
    await requireDigestToken(request, env);
    const body = await readJson(request);
    return settleSlackDigestDelivery(
      env.DB,
      body,
      body.uncertain === true ? 'UNCERTAIN' : 'FAILED',
    );
  }
  if (url.pathname === '/api/v1/internal/jobs-v5/publish') {
    if (request.method !== 'POST') methodNotAllowed('POST');
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 3_000_000) {
      throw new RouteError(413, '운영 반영 요청이 너무 큽니다.', 'PUBLISH_PAYLOAD_TOO_LARGE');
    }
    await requirePublishToken(request, env);
    return publishDiscoveryBundle(env.DB, await readJsonWithLimit(request, 3_000_000));
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
        route: requestRouteKey(request.method, url.pathname),
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
        ? await first<{ jobs: number; problems: number }>(
            env.DB,
            `SELECT
               (SELECT COUNT(*) FROM jobs
                 WHERE status IN ('ACTIVE', 'DEADLINE_UNKNOWN')
                   AND career_scope IN ('NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE')
                   AND ${visibleJobDeadlineClause('jobs')}) AS jobs,
               (SELECT COUNT(*) FROM coding_problems WHERE active = 1) AS problems`,
            nowIso(),
          )
        : null;
      const ready = schema.ready && Boolean(canary);
      return finish(
        responseJson(
          { status: ready ? 'ok' : 'not-ready', database: 'd1', build: BUILD_INFO, schema, canary },
          ready ? 200 : 503,
          requestId,
        ),
      );
    }

    const result = url.pathname.startsWith('/api/v1/internal/')
      ? await internalRoute(request, env, url)
      : await activePublicRoute(request, env, url);
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
