import { responseSchemaFor } from './api-contracts';

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  preferredLanguage: 'python' | 'java' | 'javascript' | 'cpp';
  onboardingCompleted: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string,
    readonly code = 'REQUEST_FAILED',
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const announceApiFailure = (message: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('careerground:api-status', { detail: { message } }));
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set('content-type', 'application/json');
  const timeout = AbortSignal.timeout(path.includes('/import/') ? 60_000 : 15_000);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      signal,
      credentials: 'include',
    });
  } catch {
    const timedOut = timeout.aborted;
    const error = new ApiError(
      timedOut ? '요청 시간이 초과되었습니다. 다시 시도해주세요.' : '서버에 연결할 수 없습니다.',
      0,
      undefined,
      timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
    );
    announceApiFailure(error.message);
    throw error;
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: response.statusText }))) as {
      message?: string;
      requestId?: string;
      code?: string;
      details?: unknown;
    };
    const error = new ApiError(
      body.message || '요청에 실패했습니다.',
      response.status,
      body.requestId,
      body.code,
      body.details,
    );
    announceApiFailure(error.message);
    throw error;
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    const error = new ApiError(
      '서버가 JSON이 아닌 응답을 반환했습니다.',
      502,
      response.headers.get('x-request-id') || undefined,
      'INVALID_API_RESPONSE',
    );
    announceApiFailure(error.message);
    throw error;
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    const error = new ApiError(
      '서버 JSON 응답을 해석하지 못했습니다.',
      502,
      response.headers.get('x-request-id') || undefined,
      'INVALID_API_RESPONSE',
    );
    announceApiFailure(error.message);
    throw error;
  }
  const parsed = responseSchemaFor(path, init.method || 'GET').safeParse(payload);
  if (!parsed.success) {
    const error = new ApiError(
      '서버 응답 형식이 예상과 다릅니다. 잠시 후 다시 시도해주세요.',
      502,
      response.headers.get('x-request-id') || undefined,
      'INVALID_API_RESPONSE',
      parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code })),
    );
    announceApiFailure(error.message);
    throw error;
  }
  return parsed.data as T;
}

export const json = (value: unknown) => JSON.stringify(value);
