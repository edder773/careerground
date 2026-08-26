import { all, first, newId, nowIso, parseObject, type D1Database } from './d1.js';
import {
  canonicalJobIdentity,
  canonicalJobUrl,
  jobFingerprint,
  parseImportCommit,
  parseJobPackage,
  parseLearningPackage,
  sha256,
  sourceText,
} from './domain.js';
import { RouteError } from './d1-api-contract.js';

type ImportActor = { id: string; role: 'ADMIN' | 'MEMBER' };
type ImportKind = 'jobs' | 'learning';

type ImportPreviewRow = {
  token: string;
  checksum: string;
  payload: string;
  expiresAt: string;
  consumedAt: string | null;
};

type ImportBatchRow = { id: string; result: string };

const int = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

const requireAdmin = (user: ImportActor) => {
  if (user.role !== 'ADMIN') throw new RouteError(403, '관리자 권한이 필요합니다.');
};

async function saveImportPreview(
  db: D1Database,
  user: ImportActor,
  kind: ImportKind,
  payload: unknown,
) {
  const serialized = JSON.stringify(payload);
  const checksum = await sha256(serialized);
  const previewToken = newId();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
  await db.batch([
    db.prepare('DELETE FROM import_previews WHERE expires_at <= ?').bind(createdAt),
    db
      .prepare(
        `INSERT INTO import_previews
           (token, kind, checksum, payload, actor_id, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(previewToken, kind, checksum, serialized, user.id, expiresAt, createdAt),
  ]);
  return { previewToken, checksum, expiresAt };
}

async function consumeImportPreview(
  db: D1Database,
  user: ImportActor,
  kind: ImportKind,
  input: unknown,
) {
  const commit = parseImportCommit(input);
  const acknowledgment = parseObject(input);
  const preview = await first<ImportPreviewRow>(
    db,
    `SELECT token, checksum, payload, expires_at AS expiresAt, consumed_at AS consumedAt
       FROM import_previews WHERE token = ? AND kind = ? AND actor_id = ?`,
    commit.previewToken,
    kind,
    user.id,
  );
  if (!preview) throw new RouteError(409, '유효한 import 미리보기가 없습니다.', 'PREVIEW_REQUIRED');
  if (preview.checksum !== commit.checksum) {
    throw new RouteError(409, '미리보기 이후 입력이 변경되었습니다.', 'PREVIEW_CHECKSUM_MISMATCH');
  }
  if (preview.expiresAt <= nowIso()) {
    throw new RouteError(409, 'import 미리보기가 만료되었습니다.', 'PREVIEW_EXPIRED');
  }
  const batch = await first<ImportBatchRow>(
    db,
    'SELECT id, result FROM import_batches WHERE kind = ? AND checksum = ?',
    kind,
    preview.checksum,
  );
  if (batch) return { preview, existing: parseObject(batch.result), acknowledgment };
  if (preview.consumedAt) {
    throw new RouteError(409, '이미 사용된 import 미리보기입니다.', 'PREVIEW_CONSUMED');
  }
  return { preview, existing: null, acknowledgment };
}

async function analyzeJobImport(db: D1Database, input: unknown) {
  const body = parseJobPackage(input);
  const normalized = await Promise.all(
    body.items.map(async (item, index) => ({
      index,
      item,
      canonicalUrl: canonicalJobUrl(item.sourceUrl),
      canonicalKey: canonicalJobIdentity(item.sourceId, item.sourceUrl),
      fingerprint: await jobFingerprint(item),
    })),
  );
  const existingByUrl = new Map<string, string>();
  const existingByCanonicalKey = new Map<string, string>();
  const existingFingerprints = new Set<string>();
  for (let offset = 0; offset < normalized.length; offset += 200) {
    const chunk = normalized.slice(offset, offset + 200);
    const urls = [...new Set(chunk.map((row) => row.canonicalUrl))];
    const canonicalKeys = [...new Set(chunk.map((row) => row.canonicalKey))];
    const fingerprints = [...new Set(chunk.map((row) => row.fingerprint))];
    const urlRows = urls.length
      ? await all<{ id: string; sourceUrl: string }>(
          db,
          `SELECT id, source_url AS sourceUrl FROM jobs WHERE source_url IN (${urls.map(() => '?').join(',')})`,
          ...urls,
        )
      : [];
    for (const row of urlRows) existingByUrl.set(row.sourceUrl, row.id);
    const canonicalRows = canonicalKeys.length
      ? await all<{ id: string; canonicalKey: string }>(
          db,
          `SELECT id, canonical_key AS canonicalKey FROM jobs
            WHERE canonical_key IN (${canonicalKeys.map(() => '?').join(',')})`,
          ...canonicalKeys,
        )
      : [];
    for (const row of canonicalRows) existingByCanonicalKey.set(row.canonicalKey, row.id);
    const fingerprintRows = fingerprints.length
      ? await all<{ fingerprint: string }>(
          db,
          `SELECT fingerprint FROM jobs WHERE fingerprint IN (${fingerprints.map(() => '?').join(',')})`,
          ...fingerprints,
        )
      : [];
    for (const row of fingerprintRows) existingFingerprints.add(row.fingerprint);
  }
  const seenUrls = new Set<string>();
  const seenCanonicalKeys = new Set<string>();
  const seenFingerprints = new Set<string>();
  const rows = normalized.map((row) => {
    let outcome: 'CREATE' | 'REVIEW' | 'REJECT' | 'DUPLICATE';
    let reason: string;
    if (row.item.status !== 'ACTIVE') {
      outcome = 'REJECT';
      reason = '신규 ACTIVE 공고만 등록할 수 있음';
    } else if (row.item.careerScope === 'CAREER_ONLY') {
      outcome = 'REJECT';
      reason = '경력직 전용 공고';
    } else if (
      seenUrls.has(row.canonicalUrl) ||
      seenCanonicalKeys.has(row.canonicalKey) ||
      seenFingerprints.has(row.fingerprint)
    ) {
      outcome = 'DUPLICATE';
      reason = '입력 package 내부 중복';
    } else if (existingByUrl.has(row.canonicalUrl)) {
      outcome = 'DUPLICATE';
      reason = '기존 공고는 변경하지 않음';
    } else if (existingByCanonicalKey.has(row.canonicalKey)) {
      outcome = 'DUPLICATE';
      reason = '같은 출처의 공고 식별자가 이미 등록되어 있음';
    } else if (existingFingerprints.has(row.fingerprint)) {
      outcome = 'REVIEW';
      reason = 'URL은 다르지만 fingerprint가 같은 공고';
    } else if (row.item.companySize === 'UNCLASSIFIED') {
      outcome = 'REVIEW';
      reason = '회사 규모 또는 공고 분류 검토 필요';
    } else {
      outcome = 'CREATE';
      reason = '반영 가능';
    }
    if (outcome !== 'REJECT') {
      seenUrls.add(row.canonicalUrl);
      seenCanonicalKeys.add(row.canonicalKey);
      seenFingerprints.add(row.fingerprint);
    }
    return {
      ...row,
      outcome,
      reason,
      existingId:
        existingByUrl.get(row.canonicalUrl) || existingByCanonicalKey.get(row.canonicalKey),
    };
  });
  const counts = {
    original: rows.length,
    create: rows.filter((row) => row.outcome === 'CREATE').length,
    update: 0,
    duplicate: rows.filter((row) => row.outcome === 'DUPLICATE').length,
    rejected: rows.filter((row) => row.outcome === 'REJECT').length,
    review: rows.filter((row) => row.outcome === 'REVIEW').length,
    removal: 0,
  };
  const removalCandidates: Array<{
    id: string;
    sourceName: string;
    companyName: string;
    title: string;
    sourceUrl: string;
  }> = [];
  return { body, rows, counts, removalCandidates };
}

export async function previewJobImport(db: D1Database, user: ImportActor, input: unknown) {
  requireAdmin(user);
  const analyzed = await analyzeJobImport(db, input);
  const preview = await saveImportPreview(db, user, 'jobs', analyzed.body);
  return {
    valid: true,
    ...preview,
    counts: analyzed.counts,
    rows: analyzed.rows.map((row) => ({
      index: row.index,
      outcome: row.outcome,
      reason: row.reason,
      companyName: row.item.companyName,
      title: row.item.title,
      sourceUrl: row.canonicalUrl,
    })),
    snapshot: analyzed.body.snapshot || null,
    removalCandidates: analyzed.removalCandidates,
  };
}

export async function commitJobImport(db: D1Database, user: ImportActor, input: unknown) {
  requireAdmin(user);
  const loaded = await consumeImportPreview(db, user, 'jobs', input);
  if (loaded.existing) return { ...loaded.existing, idempotent: true };
  const analyzed = await analyzeJobImport(db, JSON.parse(loaded.preview.payload));
  if (
    loaded.acknowledgment.acknowledgeAllRows !== true ||
    int(loaded.acknowledgment.reviewedRowCount, -1) !== analyzed.rows.length
  ) {
    throw new RouteError(
      409,
      '전체 미리보기 행을 검토했다는 확인이 필요합니다.',
      'IMPORT_REVIEW_ACK_REQUIRED',
    );
  }
  const timestamp = nowIso();
  const batchId = newId();
  const acceptedRows = analyzed.rows
    .filter((row) => row.outcome === 'CREATE' && row.item.status === 'ACTIVE')
    .map((row) => ({ ...row, persistedId: newId() }));
  const batch = {
    id: batchId,
    createdAt: timestamp,
    originalCount: analyzed.counts.original,
    rejectedCount: analyzed.counts.original - acceptedRows.length,
  };
  const result = {
    batch,
    counts: analyzed.counts,
    snapshot: { mode: 'INSERT_ONLY', sources: [] },
    idempotent: false,
  };
  const statements = acceptedRows.map((row) => {
    const item = row.item;
    return db
      .prepare(
        `INSERT INTO jobs
             (id, company_name, company_size, company_size_evidence, source_name,
              source_posting_id, source_url, title, category, career_scope, career_evidence,
              employment_type, region, remote, tech_stack, published_at, application_start_at,
              deadline_at, rolling, summary, status, fingerprint, collected_at, last_verified_at,
              created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT DO NOTHING`,
      )
      .bind(
        row.persistedId,
        item.companyName,
        item.companySize,
        item.companySizeEvidence || null,
        item.sourceName,
        item.sourceId || null,
        row.canonicalUrl,
        item.title,
        item.category,
        item.careerScope,
        item.careerEvidence,
        item.employmentType,
        item.region,
        item.remote ? 1 : 0,
        JSON.stringify(item.techStack),
        item.publishedAt || null,
        item.applicationStartAt || null,
        item.deadlineAt || null,
        item.rolling ? 1 : 0,
        item.summary,
        'ACTIVE',
        row.fingerprint,
        item.collectedAt,
        item.lastVerifiedAt,
        timestamp,
        timestamp,
      );
  });
  statements.push(
    db
      .prepare(
        `INSERT INTO import_batches
           (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
         VALUES (?, 'jobs', ?, 'COMMITTED', ?, ?, ?, ?, ?)`,
      )
      .bind(
        batchId,
        loaded.preview.checksum,
        analyzed.counts.original,
        batch.rejectedCount,
        JSON.stringify(result),
        timestamp,
        timestamp,
      ),
  );
  statements.push(
    db
      .prepare('UPDATE import_previews SET consumed_at = ? WHERE token = ? AND consumed_at IS NULL')
      .bind(timestamp, loaded.preview.token),
    db
      .prepare(
        `INSERT INTO audit_logs
           (id, actor_id, action, target_type, target_id, metadata, created_at)
         VALUES (?, ?, 'JOB_IMPORT_APPROVED', 'ImportBatch', ?, ?, ?)`,
      )
      .bind(newId(), user.id, batchId, JSON.stringify({ counts: analyzed.counts }), timestamp),
  );
  await db.batch(statements);
  return result;
}

export async function previewLearningImport(db: D1Database, user: ImportActor, input: unknown) {
  requireAdmin(user);
  const body = parseLearningPackage(input);
  const existing = await first<{ id: string }>(
    db,
    'SELECT id FROM learning_sources WHERE source_checksum = ? AND source_version = ?',
    body.source.checksum,
    body.source.sourceVersion,
  );
  const preview = await saveImportPreview(db, user, 'learning', body);
  return {
    valid: true,
    ...preview,
    idempotent: Boolean(existing),
    source: body.source,
    unitCount: body.units.length,
    flashcardCount: body.units.reduce((sum, unit) => sum + unit.flashcards.length, 0),
    questionCount: body.units.reduce((sum, unit) => sum + unit.questions.length, 0),
  };
}

export async function commitLearningImport(db: D1Database, user: ImportActor, input: unknown) {
  requireAdmin(user);
  const loaded = await consumeImportPreview(db, user, 'learning', input);
  if (loaded.existing) return { ...loaded.existing, idempotent: true };
  const body = parseLearningPackage(JSON.parse(loaded.preview.payload));
  if (
    loaded.acknowledgment.acknowledgeAllRows !== true ||
    int(loaded.acknowledgment.reviewedRowCount, -1) !== body.units.length
  ) {
    throw new RouteError(
      409,
      '전체 학습 단원을 검토했다는 확인이 필요합니다.',
      'IMPORT_REVIEW_ACK_REQUIRED',
    );
  }
  const existingSource = await first<{ id: string; title: string }>(
    db,
    'SELECT id, title FROM learning_sources WHERE source_checksum = ? AND source_version = ?',
    body.source.checksum,
    body.source.sourceVersion,
  );
  if (existingSource) return { source: existingSource, idempotent: true };
  const timestamp = nowIso();
  const sourceId = newId();
  const batchId = newId();
  const result = {
    source: { id: sourceId, ...body.source },
    unitCount: body.units.length,
    idempotent: false,
  };
  const statements = [
    db
      .prepare(
        `INSERT INTO learning_sources
           (id, title, subject, category, source_version, source_checksum, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'READY', ?, ?)`,
      )
      .bind(
        sourceId,
        body.source.title,
        body.source.subject,
        body.source.category,
        body.source.sourceVersion,
        body.source.checksum,
        timestamp,
        timestamp,
      ),
  ];
  for (const [position, unit] of body.units.entries()) {
    const unitId = newId();
    statements.push(
      db
        .prepare(
          `INSERT INTO learning_units
             (id, source_id, anchor, title, summary, concepts, visuals, position, published, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        )
        .bind(
          unitId,
          sourceId,
          unit.anchor,
          unit.title,
          sourceText(unit.summaryMarkdown),
          JSON.stringify(unit.concepts),
          JSON.stringify(unit.visuals || []),
          position,
          timestamp,
          timestamp,
        ),
    );
    for (const card of unit.flashcards) {
      statements.push(
        db
          .prepare(
            'INSERT INTO flashcards (id, unit_id, front, back, created_at) VALUES (?, ?, ?, ?, ?)',
          )
          .bind(newId(), unitId, sourceText(card.front), sourceText(card.back), timestamp),
      );
    }
    for (const question of unit.questions) {
      statements.push(
        db
          .prepare(
            `INSERT INTO learning_questions
               (id, unit_id, prompt, answer, type, choices, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            unitId,
            sourceText(question.prompt),
            sourceText(question.answer),
            question.type,
            JSON.stringify(question.choices || []),
            timestamp,
          ),
      );
    }
  }
  statements.push(
    db
      .prepare(
        `INSERT INTO import_batches
           (id, kind, checksum, status, original_count, rejected_count, result, committed_at, created_at)
         VALUES (?, 'learning', ?, 'COMMITTED', ?, 0, ?, ?, ?)`,
      )
      .bind(
        batchId,
        loaded.preview.checksum,
        body.units.length,
        JSON.stringify(result),
        timestamp,
        timestamp,
      ),
    db
      .prepare('UPDATE import_previews SET consumed_at = ? WHERE token = ? AND consumed_at IS NULL')
      .bind(timestamp, loaded.preview.token),
    db
      .prepare(
        `INSERT INTO audit_logs
           (id, actor_id, action, target_type, target_id, metadata, created_at)
         VALUES (?, ?, 'LEARNING_IMPORT_APPROVED', 'LearningSource', ?, ?, ?)`,
      )
      .bind(
        newId(),
        user.id,
        sourceId,
        JSON.stringify({ unitCount: body.units.length }),
        timestamp,
      ),
  );
  await db.batch(statements);
  return result;
}
