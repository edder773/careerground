import {
  applicationStatusSchema,
  importCommitSchema,
  jobImportSchema,
  learningImportSchema,
  preserveSourceText,
  problemStatusSchema,
  type JobImport,
  type LearningImport,
} from '../../packages/contracts/dist/index.js';

export class DomainValidationError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const sourceText = (value: unknown, fallback = '') => preserveSourceText(value, fallback);

export const normalizedText = (value: unknown, fallback = '') => sourceText(value, fallback).trim();

export function parseJobPackage(input: unknown): JobImport {
  const parsed = jobImportSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainValidationError(
      '채용공고 import 형식이 올바르지 않습니다.',
      parsed.error.issues,
    );
  }
  return parsed.data;
}

export function parseLearningPackage(input: unknown): LearningImport {
  const parsed = learningImportSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainValidationError('학습 package 형식이 올바르지 않습니다.', parsed.error.issues);
  }
  const anchors = new Set<string>();
  for (const unit of parsed.data.units) {
    if (anchors.has(unit.anchor)) {
      throw new DomainValidationError(`중복 학습 단원 anchor가 있습니다: ${unit.anchor}`);
    }
    anchors.add(unit.anchor);
  }
  return parsed.data;
}

export function parseImportCommit(input: unknown) {
  const parsed = importCommitSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainValidationError('previewToken과 checksum이 필요합니다.', parsed.error.issues);
  }
  return parsed.data;
}

export function parseApplicationStatus(input: unknown) {
  const parsed = applicationStatusSchema.safeParse(input);
  if (!parsed.success) throw new DomainValidationError('지원 상태가 올바르지 않습니다.');
  return parsed.data;
}

export function parseProblemStatus(input: unknown) {
  const parsed = problemStatusSchema.safeParse(input);
  if (!parsed.success) throw new DomainValidationError('문제 진행 상태가 올바르지 않습니다.');
  return parsed.data;
}

export function canonicalJobUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new DomainValidationError('채용공고 URL은 http(s)만 허용됩니다.');
  }
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_(source|medium|campaign|term|content)|fbclid|gclid)$/i.test(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}

export const normalizeCompanyName = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/주식회사/g, '')
    .replace(/\(주\)|㈜/g, '')
    .replace(/[\s().,_-]/g, '');

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function jobFingerprint(item: JobImport['items'][number]) {
  const url = new URL(canonicalJobUrl(item.sourceUrl));
  const evidence = [
    url.hostname,
    item.sourceId || '',
    normalizeCompanyName(item.companyName),
    item.title.normalize('NFKC').trim().toLowerCase(),
    item.region.normalize('NFKC').trim().toLowerCase(),
    item.deadlineAt || '',
    item.careerScope,
    item.employmentType,
  ];
  return sha256(evidence.join('\u001f'));
}
