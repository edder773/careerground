import { createHash } from 'node:crypto';
import { jobImportSchema, type JobImport, type JobImportItem } from '@careerground/contracts';
import Papa from 'papaparse';

export const normalizeCompany = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s()㈜주식회사.,_-]/g, '');

export function canonicalizeJobUrl(value: string) {
  const url = new URL(value);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (
      key.toLowerCase().startsWith('utm_') ||
      ['ref', 'source', 'campaign'].includes(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.toString();
}

export const jobFingerprint = (item: JobImportItem) =>
  createHash('sha256')
    .update(
      `${normalizeCompany(item.companyName)}|${item.title.normalize('NFKC').toLowerCase()}|${item.deadlineAt || 'rolling'}`,
    )
    .digest('hex');

export function parseCsvBoolean(value: string | undefined, field: string) {
  const normalized = (value || '').normalize('NFKC').trim().toLowerCase();
  if (!normalized) return false;
  if (['true', '1', 'yes', 'y', 't', '예', '네'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'f', '아니오', '아니요'].includes(normalized)) return false;
  throw new Error(`${field} 값은 true/false, 1/0, yes/no 형식이어야 합니다.`);
}

export function analyzeJobImport(input: JobImport, existingUrls = new Set<string>()) {
  const seen = new Set<string>();
  const rows = input.items.map((item, index) => {
    const canonicalUrl = canonicalizeJobUrl(item.sourceUrl);
    let outcome: 'CREATE' | 'UPDATE' | 'DUPLICATE' | 'REJECT' | 'REVIEW' = existingUrls.has(
      canonicalUrl,
    )
      ? 'UPDATE'
      : 'CREATE';
    let reason = outcome === 'UPDATE' ? 'canonical URL 일치' : '신규 canonical URL';
    if (item.careerScope === 'CAREER_ONLY') {
      outcome = 'REJECT';
      reason = '경력직 전용 공고';
    } else if (seen.has(canonicalUrl)) {
      outcome = 'DUPLICATE';
      reason = 'import 파일 내부 canonical URL 중복';
    } else if (item.companySize === 'UNCLASSIFIED' || item.status === 'NEEDS_REVIEW') {
      outcome = 'REVIEW';
      reason = '회사 규모 또는 공고 분류 검토 필요';
    }
    seen.add(canonicalUrl);
    return { index, outcome, reason, canonicalUrl, fingerprint: jobFingerprint(item), item };
  });
  return {
    rows,
    counts: {
      original: rows.length,
      create: rows.filter((x) => x.outcome === 'CREATE').length,
      update: rows.filter((x) => x.outcome === 'UPDATE').length,
      duplicate: rows.filter((x) => x.outcome === 'DUPLICATE').length,
      rejected: rows.filter((x) => x.outcome === 'REJECT').length,
      review: rows.filter((x) => x.outcome === 'REVIEW').length,
    },
  };
}

export function parseJobImportBuffer(buffer: Buffer, fileName: string): JobImport {
  if (fileName.toLowerCase().endsWith('.json'))
    return jobImportSchema.parse(JSON.parse(buffer.toString('utf8')));
  if (!fileName.toLowerCase().endsWith('.csv')) throw new Error('JSON 또는 CSV만 지원합니다.');
  const parsed = Papa.parse<Record<string, string>>(buffer.toString('utf8'), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) throw new Error(parsed.errors.map((error) => error.message).join(', '));
  const items = parsed.data.map((row) => ({
    ...row,
    remote: parseCsvBoolean(row.remote, 'remote'),
    rolling: parseCsvBoolean(row.rolling, 'rolling'),
    techStack: row.techStack
      ? row.techStack
          .split('|')
          .map((x) => x.trim())
          .filter(Boolean)
      : [],
    publishedAt: row.publishedAt || undefined,
    deadlineAt: row.deadlineAt || undefined,
  }));
  return jobImportSchema.parse({
    version: '1.0',
    collectedAt: parsed.data[0]?.['collectedAt'] || new Date().toISOString(),
    sourceCount: new Set(parsed.data.map((row) => row['sourceName'])).size,
    items,
  });
}
