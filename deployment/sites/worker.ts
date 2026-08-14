import { handleD1Api, runScheduledMaintenance } from './d1-api.js';
import type { D1Database } from './d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

type Fetcher = { fetch(request: Request): Promise<Response> };

type SitesEnv = {
  ASSETS: Fetcher;
  DB?: D1Database;
  OPENAI_ADMIN_EMAILS?: string;
  MAX_ACTIVE_USERS?: string;
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

async function serveApi(request: Request, env: SitesEnv) {
  if (env.DB) {
    try {
      await ensureRuntimeSchema(env.DB);
    } catch (error) {
      console.error('D1 runtime schema initialization failed', error);
      return json(
        {
          code: 'DB_SCHEMA_INITIALIZATION_FAILED',
          message: '데이터베이스 스키마를 준비하지 못했습니다. 잠시 후 다시 시도해주세요.',
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
    if (url.pathname.startsWith('/api/v1/')) return serveApi(request, env);

    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || request.method !== 'GET') return asset;
    const acceptsHtml = request.headers.get('accept')?.includes('text/html');
    if (!acceptsHtml) return asset;
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
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
