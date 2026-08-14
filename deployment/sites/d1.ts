export type D1Result<T = Record<string, unknown>> = {
  results?: T[];
  success?: boolean;
  meta?: { changes?: number; last_row_id?: number };
};

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
};

export type D1Database = {
  prepare(sql: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
};

export async function first<T>(db: D1Database, sql: string, ...values: unknown[]) {
  return db
    .prepare(sql)
    .bind(...values)
    .first<T>();
}

export async function all<T>(db: D1Database, sql: string, ...values: unknown[]) {
  const result = await db
    .prepare(sql)
    .bind(...values)
    .all<T>();
  return result.results || [];
}

export async function run(db: D1Database, sql: string, ...values: unknown[]) {
  return db
    .prepare(sql)
    .bind(...values)
    .run();
}

export const nowIso = () => new Date().toISOString();
export const newId = () => crypto.randomUUID();

export function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) throw new Error('Stored JSON value is not an array.');
    return parsed.map(String);
  } catch (error) {
    throw new Error('Stored JSON array is invalid.', { cause: error });
  }
}

export function parseJsonArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) throw new Error('Stored JSON value is not an array.');
    return parsed as T[];
  } catch (error) {
    throw new Error('Stored JSON array is invalid.', { cause: error });
  }
}

export function parseObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Stored JSON value is not an object.');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error('Stored JSON object is invalid.', { cause: error });
  }
}

export const asBoolean = (value: unknown) => value === true || value === 1;
