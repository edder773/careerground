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
const user = z
  .object({
    id: identifier,
    email: z.string().email(),
    displayName: z.string(),
    role: z.enum(['ADMIN', 'MEMBER']),
    preferredLanguage: z.enum(['python', 'java', 'javascript', 'cpp']),
    onboardingCompleted: z.boolean(),
  })
  .passthrough();
const profile = z
  .object({
    id: identifier,
    email: z.string().email(),
    displayName: z.string(),
    preferredLanguage: z.enum(['python', 'java', 'javascript', 'cpp']),
  })
  .passthrough();
const collectionItem = z
  .object({ id: identifier, itemType: z.string(), targetId: z.string() })
  .passthrough();
const collection = z
  .object({ id: identifier, name: z.string(), items: z.array(collectionItem) })
  .passthrough();
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
const solutionSummary = z
  .object({
    id: identifier,
    problemId: identifier,
    title: z.string(),
    language: z.string(),
    author: z.object({ displayName: z.string() }).passthrough(),
  })
  .passthrough();
const solutionDetail = solutionSummary.extend({
  code: z.string(),
  description: z.string(),
  revisions: z.array(z.object({ revision: z.number() }).passthrough()),
  comments: z.array(z.object({ id: identifier }).passthrough()),
});
const learningUnit = z.object({ id: identifier, title: z.string() }).passthrough();
const learningSource = z
  .object({ id: identifier, title: z.string(), units: z.array(learningUnit) })
  .passthrough();
const learningUnitDetail = learningUnit.extend({
  summary: z.string(),
  visuals: z.array(z.object({ src: z.string(), alt: z.string() }).passthrough()),
  questions: z.array(z.object({ id: identifier, prompt: z.string() }).passthrough()),
});
const notification = z
  .object({ id: identifier, type: z.string(), title: z.string(), createdAt: z.string() })
  .passthrough();
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
    if (endpoint === '/notifications/read-all' || /\/notifications\/[^/]+\/read$/.test(endpoint)) {
      return z.object({ count: z.number().nonnegative() }).passthrough();
    }
    return z.record(z.string(), jsonValueSchema);
  }
  if (endpoint === '/auth/me') return z.object({ user }).passthrough();
  if (endpoint === '/auth/profile') return profile;
  if (endpoint === '/collections' || endpoint === '/collections/trash') return z.array(collection);
  if (endpoint === '/dashboard') {
    return z
      .object({ recentJobs: z.number(), expiringJobs: z.number(), dueReviews: z.number() })
      .passthrough();
  }
  if (endpoint === '/jobs/categories') return z.array(z.string());
  if (endpoint === '/jobs') return arrayOrCursor(job);
  if (/^\/jobs\/[^/]+$/.test(endpoint)) return job;
  if (endpoint === '/coding/problems') return arrayOrCursor(problem);
  if (/^\/coding\/problems\/[^/]+$/.test(endpoint)) return problem;
  if (endpoint === '/coding/daily-challenges') return z.array(challenge);
  if (endpoint === '/coding/daily-challenge') return challenge;
  if (endpoint === '/coding/solutions') return arrayOrCursor(solutionSummary);
  if (endpoint === '/coding/solutions/trash') {
    return z.array(
      z.object({ id: identifier, title: z.string(), deletedAt: z.string() }).passthrough(),
    );
  }
  if (/^\/coding\/solutions\/[^/]+$/.test(endpoint)) return solutionDetail;
  if (endpoint === '/coding/rankings') {
    return z
      .object({
        rows: z.array(z.object({ rank: z.number(), displayName: z.string() }).passthrough()),
      })
      .passthrough();
  }
  if (endpoint === '/learning') return z.array(learningSource);
  if (/^\/learning\/units\/[^/]+$/.test(endpoint)) return learningUnitDetail;
  if (endpoint === '/learning/due') return z.array(z.record(z.string(), jsonValueSchema));
  if (endpoint === '/notifications') return arrayOrCursor(notification);
  if (endpoint === '/notifications/unread-count') {
    return z.object({ count: z.number().nonnegative() }).passthrough();
  }
  if (endpoint === '/search') {
    return z
      .object({ query: z.string(), nextCursor: z.string().nullable().optional() })
      .catchall(z.union([z.string(), z.null(), z.array(searchItem)]));
  }
  return jsonValueSchema;
}
