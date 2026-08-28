import type { D1Database } from './d1.js';

export type D1Env = {
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

export type UserRow = {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  isActive: number | boolean;
  avatarUrl: string | null;
  githubUsername: string | null;
  preferredLanguage: string;
  onboardingCompletedAt: string | null;
  dataDeletionRequested: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  preferredLanguage: string;
  onboardingCompleted: boolean;
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
