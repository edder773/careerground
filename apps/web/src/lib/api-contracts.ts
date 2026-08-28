import { z } from 'zod';

export type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const identifier = z.string().min(1);
const job = z
  .object({
    id: identifier,
    title: z.string(),
    company: z.object({ name: z.string() }).passthrough(),
  })
  .passthrough();
const problem = z
  .object({
    id: identifier,
    displayTitle: z.string(),
    level: z.number(),
    track: z.enum(['ALGORITHM', 'SQL']),
  })
  .passthrough();
const challenge = z.object({ id: identifier, problemId: identifier, problem }).passthrough();
const learningUnit = z.object({ id: identifier, title: z.string() }).passthrough();
const learningSource = z
  .object({ id: identifier, title: z.string(), units: z.array(learningUnit) })
  .passthrough();
const learningUnitDetail = learningUnit.extend({
  summary: z.string(),
  visuals: z.array(z.object({ src: z.string(), alt: z.string() }).passthrough()),
  questions: z.array(z.object({ id: identifier, prompt: z.string() }).passthrough()),
});
const searchItem = z.object({ id: identifier, title: z.string(), href: z.string() }).passthrough();

const cursorPage = (item: z.ZodType) =>
  z
    .object({
      items: z.array(item),
      nextCursor: z.string().nullable(),
      total: z.number().optional(),
    })
    .passthrough();
const arrayOrCursor = (item: z.ZodType) => z.union([z.array(item), cursorPage(item)]);

export function responseSchemaFor(path: string, method = 'GET'): z.ZodType {
  const [endpoint = ''] = path.split('?');
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod !== 'GET') {
    if (/^\/learning\/questions\/[^/]+\/answer$/.test(endpoint)) {
      return z
        .object({ questionId: identifier, response: z.string(), correct: z.boolean() })
        .passthrough();
    }
    if (endpoint === '/learning/review') {
      return z.object({ unitId: identifier, reviewVersion: z.number() }).passthrough();
    }
    if (endpoint.endsWith('/import/preview') || endpoint.endsWith('/file/preview')) {
      return z
        .object({ previewToken: identifier, checksum: z.string(), expiresAt: z.string() })
        .passthrough();
    }
    return z.record(z.string(), jsonValueSchema);
  }
  if (endpoint === '/dashboard') {
    return z.object({ recentJobs: z.number(), expiringJobs: z.number() }).passthrough();
  }
  if (endpoint === '/jobs/categories') return z.array(z.string());
  if (endpoint === '/jobs/bootstrap') {
    return z
      .object({
        categories: z.array(z.string()),
        data: arrayOrCursor(job),
      })
      .passthrough();
  }
  if (endpoint === '/learning/bootstrap') {
    return z
      .object({
        data: z.array(learningSource),
      })
      .passthrough();
  }
  if (endpoint === '/jobs') return arrayOrCursor(job);
  if (/^\/jobs\/[^/]+$/.test(endpoint)) return job;
  if (endpoint === '/coding/problems') return arrayOrCursor(problem);
  if (/^\/coding\/problems\/[^/]+$/.test(endpoint)) return problem;
  if (endpoint === '/coding/daily-challenges') return z.array(challenge);
  if (endpoint === '/coding/daily-challenge') return challenge;
  if (endpoint === '/learning') return z.array(learningSource);
  if (/^\/learning\/units\/[^/]+$/.test(endpoint)) return learningUnitDetail;
  if (endpoint === '/learning/due') return z.array(z.record(z.string(), jsonValueSchema));
  if (endpoint === '/search') {
    return z
      .object({ query: z.string(), nextCursor: z.string().nullable().optional() })
      .catchall(z.union([z.string(), z.null(), z.array(searchItem)]));
  }
  return jsonValueSchema;
}
