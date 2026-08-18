import { createServer } from 'node:http';
import { handleD1Api } from './d1-api.js';
import { LocalD1 } from './local-d1.js';

const port = Number(process.env.PORT || 4000);
const db = new LocalD1();
const fixtureTime = '2026-08-13T00:00:00.000Z';

await db.batch([
  db
    .prepare(
      `INSERT OR IGNORE INTO learning_sources
        (id, title, subject, category, status, source_version, source_checksum, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'READY', ?, ?, ?, ?)`,
    )
    .bind(
      'e2e-source-transaction-safety',
      'E2E 트랜잭션 안전성',
      '소프트웨어 개발',
      'E2E fixture',
      '1',
      'e2e-local-only',
      fixtureTime,
      fixtureTime,
    ),
  db
    .prepare(
      `INSERT OR IGNORE INTO learning_units
        (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`,
    )
    .bind(
      'e2e-unit-transaction-safety',
      'e2e-source-transaction-safety',
      'e2e:transaction-safety',
      '트랜잭션과 멱등성',
      'E2E 전용 합성 데이터로 원자성과 재시도 안전성을 검증합니다.',
      JSON.stringify(['트랜잭션', '멱등성']),
      fixtureTime,
      fixtureTime,
    ),
  db
    .prepare(
      'INSERT OR IGNORE INTO flashcards (id, unit_id, front, back, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(
      'e2e-card-transaction-safety',
      'e2e-unit-transaction-safety',
      '멱등성이란?',
      '동일한 요청을 반복해도 최종 상태가 같습니다.',
      fixtureTime,
    ),
  db
    .prepare(
      'INSERT OR IGNORE INTO learning_questions (id, unit_id, prompt, answer, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(
      'e2e-question-transaction-safety',
      'e2e-unit-transaction-safety',
      '원자적 처리의 핵심은?',
      '전체 성공 또는 전체 롤백입니다.',
      fixtureTime,
    ),
]);

const server = createServer(async (incoming, outgoing) => {
  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of incoming) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
      else if (value !== undefined) headers.set(name, value);
    }
    const method = incoming.method || 'GET';
    const request = new Request(`http://127.0.0.1:${port}${incoming.url || '/'}`, {
      method,
      headers,
      body:
        method === 'GET' || method === 'HEAD' || chunks.length === 0
          ? undefined
          : new Uint8Array(Buffer.concat(chunks)),
    });
    const response = await handleD1Api(request, {
      DB: db,
      ADMIN_EMAILS: 'admin@careerground.local',
      AUTH_TEST_MODE: 'true',
      MAX_ACTIVE_USERS: '100',
      REQUEST_LOGGING: 'false',
    });
    outgoing.statusCode = response.status;
    response.headers.forEach((value, name) => outgoing.setHeader(name, value));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.statusCode = 500;
    outgoing.setHeader('content-type', 'application/json; charset=utf-8');
    outgoing.end(JSON.stringify({ code: 'LOCAL_D1_ERROR', message: String(error) }));
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`CareerGround local D1 API listening on http://127.0.0.1:${port}\n`);
});

const close = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};

process.on('SIGINT', close);
process.on('SIGTERM', close);
