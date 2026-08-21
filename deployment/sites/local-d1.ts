import { readdirSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import type { D1Database, D1PreparedStatement, D1Result } from './d1.js';

class LocalD1Statement implements D1PreparedStatement {
  constructor(
    private readonly statement: StatementSync,
    private readonly values: unknown[] = [],
    readonly sql = '',
  ) {}

  bind(...values: unknown[]) {
    return new LocalD1Statement(this.statement, values, this.sql);
  }

  async first<T>() {
    return (this.statement.get(...(this.values as SQLInputValue[])) as T | undefined) || null;
  }

  async all<T>(): Promise<D1Result<T>> {
    return {
      success: true,
      results: this.statement.all(...(this.values as SQLInputValue[])) as T[],
    };
  }

  async run<T>(): Promise<D1Result<T>> {
    const result = this.statement.run(...(this.values as SQLInputValue[]));
    return {
      success: true,
      results: [],
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

export class LocalD1 implements D1Database {
  private readonly sqlite: DatabaseSync;
  private batchQueue: Promise<void> = Promise.resolve();
  private failBatchAt?: number;
  private queryCount = 0;
  private batchCount = 0;
  preparedSql: string[] = [];

  constructor(
    filename = ':memory:',
    migrationsDirectories: string | string[] = ['drizzle-history', 'drizzle'],
  ) {
    this.sqlite = new DatabaseSync(filename);
    this.sqlite.exec('PRAGMA foreign_keys = ON');
    const directories = Array.isArray(migrationsDirectories)
      ? migrationsDirectories
      : [migrationsDirectories];
    const migrations = directories
      .flatMap((directory) =>
        readdirSync(directory)
          .filter((file) => /^\d{4}_.+\.sql$/.test(file))
          .map((file) => `${directory}/${file}`),
      )
      .sort((left, right) => basename(left).localeCompare(basename(right)));
    for (const file of migrations) {
      const migration = readFileSync(file, 'utf8');
      for (const statement of migration.split('--> statement-breakpoint')) {
        if (statement.trim()) this.sqlite.exec(statement);
      }
    }
  }

  prepare(sql: string) {
    this.queryCount += 1;
    this.preparedSql.push(sql);
    return new LocalD1Statement(this.sqlite.prepare(sql), [], sql);
  }

  resetQueryCount() {
    this.queryCount = 0;
  }

  getQueryCount() {
    return this.queryCount;
  }

  resetBatchCount() {
    this.batchCount = 0;
  }

  getBatchCount() {
    return this.batchCount;
  }

  resetPreparedSql() {
    this.preparedSql = [];
  }

  async batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    this.batchCount += 1;
    const execution = this.batchQueue.then(() => this.executeBatch<T>(statements));
    this.batchQueue = execution.then(
      () => undefined,
      () => undefined,
    );
    return execution;
  }

  private async executeBatch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    this.sqlite.exec('BEGIN IMMEDIATE');
    try {
      const results: D1Result<T>[] = [];
      for (const [index, statement] of statements.entries()) {
        if (this.failBatchAt === index) throw new Error('injected D1 batch failure');
        results.push(
          statement instanceof LocalD1Statement &&
            (/^\s*(SELECT|WITH|PRAGMA)/i.test(statement.sql) ||
              /\bRETURNING\b/i.test(statement.sql))
            ? await statement.all<T>()
            : await statement.run<T>(),
        );
      }
      this.sqlite.exec('COMMIT');
      if (this.failBatchAt === undefined || this.failBatchAt < statements.length) {
        this.failBatchAt = undefined;
      }
      return results;
    } catch (error) {
      this.sqlite.exec('ROLLBACK');
      this.failBatchAt = undefined;
      throw error;
    }
  }

  failNextBatch(index: number) {
    this.failBatchAt = index;
  }

  close() {
    this.sqlite.close();
  }
}
