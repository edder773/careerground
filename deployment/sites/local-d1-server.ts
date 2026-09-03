import { createServer } from 'node:http';
import { handleD1Api } from './d1-api.js';
import { LocalD1 } from './local-d1.js';
import { ensureRuntimeSchema } from './runtime-schema.js';

const port = Number(process.env.PORT || 4000);
const db = new LocalD1();
await ensureRuntimeSchema(db);

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
      REQUEST_LOGGING: 'false',
    });
    outgoing.statusCode = response.status;
    response.headers.forEach((value, name) => outgoing.setHeader(name, value));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Local D1 request failed', error);
    outgoing.statusCode = 500;
    outgoing.setHeader('content-type', 'application/json; charset=utf-8');
    outgoing.end(
      JSON.stringify({
        code: 'LOCAL_D1_ERROR',
        message: '로컬 D1 요청을 처리하지 못했습니다. 서버 로그를 확인해주세요.',
      }),
    );
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
