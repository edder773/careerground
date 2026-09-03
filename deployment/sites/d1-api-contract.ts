import type { D1Database } from './d1.js';

export type D1Env = {
  DB: D1Database;
  DIGEST_API_TOKEN?: string;
  PUBLISH_API_TOKEN?: string;
  REQUEST_LOGGING?: string;
};

export class RouteError extends Error {
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
