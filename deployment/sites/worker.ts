import { handleD1Api, runScheduledMaintenance } from './d1-api.js';
import type { D1Database } from './d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

type Fetcher = { fetch(request: Request): Promise<Response> };

type SitesEnv = {
  ASSETS: Fetcher;
  DB?: D1Database;
  ADMIN_EMAILS?: string;
  AUTH_TEST_MODE?: string;
  DIGEST_API_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  MAX_ACTIVE_USERS?: string;
  REQUEST_LOGGING?: string;
};

type SitesExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

type SitesScheduledController = {
  cron: string;
  scheduledTime: number;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const withSecurityHeaders = (response: Response) => {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('cross-origin-opener-policy', 'same-origin-allow-popups');
  headers.set(
    'content-security-policy',
    "default-src 'self'; base-uri 'self'; connect-src 'self' https://accounts.google.com/gsi/; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; frame-src https://accounts.google.com/gsi/; img-src 'self' data: blob: https://lh3.googleusercontent.com; object-src 'none'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

async function serveApi(request: Request, env: SitesEnv) {
  if (env.DB) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api/v1/health/live') {
      return handleD1Api(request, { ...env, DB: env.DB });
    }
    try {
      await ensureRuntimeSchema(env.DB);
    } catch (error) {
      console.error('D1 runtime schema readiness check failed', {
        message: error instanceof Error ? error.message : String(error),
      });
      return json(
        {
          code: 'DB_SCHEMA_NOT_READY',
          message: '데이터베이스 migration 적용 상태를 확인해주세요.',
        },
        503,
      );
    }
    return handleD1Api(request, { ...env, DB: env.DB });
  }
  return json(
    {
      code: 'D1_NOT_CONFIGURED',
      message: 'CareerGround의 기준 데이터베이스인 D1 바인딩이 구성되지 않았습니다.',
    },
    503,
  );
}

const worker = {
  async fetch(request: Request, env: SitesEnv, _context: SitesExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/v1/'))
      return withSecurityHeaders(await serveApi(request, env));

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== 'GET') return withSecurityHeaders(asset);
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (!acceptsHtml) return withSecurityHeaders(asset);
    return withSecurityHeaders(
      await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request)),
    );
  },
  async scheduled(
    _controller: SitesScheduledController,
    env: SitesEnv,
    context: SitesExecutionContext,
  ) {
    const db = env.DB;
    if (!db) return;
    context.waitUntil(
      ensureRuntimeSchema(db).then(() => runScheduledMaintenance({ ...env, DB: db })),
    );
  },
};

export default worker;
