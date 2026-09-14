import { URL, pathToFileURL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

// Use the publisher's typed metadata, never Korean title keywords or our DB track.
export function parseProgrammersMetadata(html) {
  const category = html.match(/data-challenge-category="([^"]+)"/u)?.[1];
  const type = html.match(/data-challengeable-type="([^"]+)"/u)?.[1];
  const level = Number(html.match(/data-challenge-level="([0-5])"/u)?.[1]);
  const track = category === 'database' ? 'SQL' : category === 'algorithm' ? 'ALGORITHM' : null;
  if (!track || type !== category || !Number.isInteger(level)) {
    throw new Error('Missing or conflicting official challenge metadata');
  }
  return { track, level };
}

export async function verifyProgrammersCatalog(rows, fetcher = globalThis.fetch) {
  const verified = [];
  const failures = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < rows.length) {
        const row = rows[next++];
        try {
          const url = new URL(row.source_url);
          if (
            url.origin !== 'https://school.programmers.co.kr' ||
            !/^\/learn\/courses\/30\/lessons\/\d+$/u.test(url.pathname) ||
            url.search
          ) {
            throw new Error('Unsupported source URL');
          }
          const response = await fetcher(url, { signal: globalThis.AbortSignal.timeout(15000) });
          if (!response.ok || response.url !== url.href)
            throw new Error(`Source status ${response.status}`);
          const metadata = parseProgrammersMetadata(await response.text());
          verified.push({ lessonId: Number(url.pathname.split('/').at(-1)), ...metadata });
        } catch (error) {
          failures.push({ id: row.id, error: error.message });
        }
      }
    }),
  );
  if (failures.length) throw new Error(JSON.stringify({ failed: failures.length, failures }));
  verified.sort((a, b) => a.lessonId - b.lessonId);
  if (new Set(verified.map((row) => row.lessonId)).size !== rows.length)
    throw new Error('Duplicate lesson');
  return {
    version: 1,
    verifiedAt: new Date().toISOString(),
    source: 'https://school.programmers.co.kr',
    problems: verified,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { LocalD1 } = await import('../../deployment/sites/local-d1.ts');
  const db = new LocalD1();
  try {
    const { results } = await db
      .prepare('SELECT id, source_url FROM coding_problems ORDER BY id')
      .all();
    console.log(JSON.stringify(await verifyProgrammersCatalog(results)));
  } finally {
    db.close();
  }
}
