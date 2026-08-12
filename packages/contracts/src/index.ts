import { z } from 'zod';

export const roleSchema = z.enum(['ADMIN', 'MEMBER']);
export const visibilitySchema = z.enum(['PRIVATE', 'MEMBERS']);
export const careerScopeSchema = z.enum(['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE', 'CAREER_ONLY']);
export const companySizeSchema = z.enum([
  'LARGE',
  'PUBLIC',
  'MID',
  'SMALL',
  'STARTUP',
  'FOREIGN',
  'UNCLASSIFIED',
]);
export const jobStatusSchema = z.enum([
  'ACTIVE',
  'DEADLINE_UNKNOWN',
  'EXPIRED',
  'REMOVED',
  'NEEDS_REVIEW',
]);
export const applicationStatusSchema = z.enum([
  'INTERESTED',
  'PLANNED',
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'REJECTED',
  'ACCEPTED',
  'ON_HOLD',
]);
export const problemStatusSchema = z.enum(['UNTRIED', 'IN_PROGRESS', 'SOLVED', 'RETRY']);

const safeHttpUrl = z
  .string()
  .url()
  .refine(
    (value) => ['http:', 'https:'].includes(new URL(value).protocol),
    'http(s) URL만 허용됩니다.',
  );

export const jobImportItemSchema = z.object({
  sourceName: z.string().trim().min(1).max(80),
  sourceId: z.string().trim().max(200).optional(),
  sourceUrl: safeHttpUrl,
  companyName: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(240),
  category: z.string().trim().min(1).max(80),
  careerScope: careerScopeSchema,
  careerEvidence: z.string().trim().min(1).max(500),
  companySize: companySizeSchema,
  companySizeEvidence: z.string().trim().max(500).optional(),
  employmentType: z.string().trim().max(80).default('FULL_TIME'),
  region: z.string().trim().max(160).default('미정'),
  remote: z.boolean().default(false),
  techStack: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  publishedAt: z.string().datetime({ offset: true }).optional(),
  deadlineAt: z.string().datetime({ offset: true }).optional(),
  rolling: z.boolean().default(false),
  collectedAt: z.string().datetime({ offset: true }),
  lastVerifiedAt: z.string().datetime({ offset: true }),
  summary: z.string().trim().max(600),
  status: jobStatusSchema.default('ACTIVE'),
});

export const jobImportSchema = z.object({
  version: z.literal('1.0'),
  collectedAt: z.string().datetime({ offset: true }),
  sourceCount: z.number().int().min(1),
  items: z.array(jobImportItemSchema).min(1).max(5_000),
});

export const learningImportSchema = z.object({
  version: z.literal('1.0'),
  source: z.object({
    title: z.string().trim().min(1).max(200),
    subject: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(100),
    sourceVersion: z.string().trim().min(1).max(40),
    checksum: z.string().regex(/^[a-f0-9]{64}$/i),
  }),
  units: z
    .array(
      z.object({
        anchor: z.string().trim().min(1).max(200),
        title: z.string().trim().min(1).max(200),
        summaryMarkdown: z.string().max(30_000),
        concepts: z.array(z.string().trim().min(1).max(200)).max(30),
        flashcards: z
          .array(z.object({ front: z.string().max(2_000), back: z.string().max(4_000) }))
          .max(50),
        questions: z
          .array(
            z.object({
              type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER']),
              prompt: z.string().max(4_000),
              answer: z.string().max(4_000),
              choices: z.array(z.string().max(1_000)).max(10).optional(),
            }),
          )
          .max(50),
      }),
    )
    .min(1)
    .max(500),
});

export const problemImportSchema = z.object({
  version: z.literal('1.0'),
  items: z.array(
    z.object({
      sourceUrl: safeHttpUrl.refine(
        (value) => new URL(value).hostname === 'school.programmers.co.kr',
        '프로그래머스 문제 URL만 허용됩니다.',
      ),
      title: z.string().trim().min(1).max(160),
      level: z.number().int().min(0).max(5),
      tags: z.array(z.string().trim().min(1).max(40)).max(20),
      active: z.boolean().default(true),
    }),
  ),
});

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string(),
});

export type JobImport = z.infer<typeof jobImportSchema>;
export type JobImportItem = z.infer<typeof jobImportItemSchema>;
export type LearningImport = z.infer<typeof learningImportSchema>;
export type ProblemImport = z.infer<typeof problemImportSchema>;
export type Role = z.infer<typeof roleSchema>;
