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
    return z.record(z.string(), jsonValueSchema);
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
  if (endpoint === '/jobs') return arrayOrCursor(job);
  if (/^\/jobs\/[^/]+$/.test(endpoint)) return job;
  if (endpoint === '/coding/problems') return arrayOrCursor(problem);
  if (/^\/coding\/problems\/[^/]+$/.test(endpoint)) return problem;
  if (endpoint === '/coding/daily-challenges') return z.array(challenge);
  if (endpoint === '/coding/daily-challenge') return challenge;
  return jsonValueSchema;
}
