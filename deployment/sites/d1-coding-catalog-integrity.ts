import { all, nowIso, type D1Database } from './d1.js';
import { RouteError } from './d1-api-contract.js';
import {
  verifiedCatalogDate,
  verifiedCodingMetadata,
} from '../../shared/verified-coding-problem.mjs';

type CatalogRow = { id: string; sourceUrl: string; track: string; level: number };

// A separate, authenticated data repair. No seed/backfill data in schema migrations,
// no writes on public catalog reads, no arbitrary SQL or caller-supplied classifications.
export async function reconcileCodingCatalog(db: D1Database, apply = false) {
  const rows = await all<CatalogRow>(
    db,
    'SELECT id, source_url AS sourceUrl, track, level FROM coding_problems ORDER BY id',
  );
  const unverifiedIds: string[] = [];
  const changes = rows.flatMap((row) => {
    const verified = verifiedCodingMetadata(row.sourceUrl);
    if (!verified) {
      unverifiedIds.push(row.id);
      return [];
    }
    return row.track !== verified.track || row.level !== verified.level
      ? [{ ...row, expectedTrack: verified.track, expectedLevel: verified.level }]
      : [];
  });
  if (apply && unverifiedIds.length) {
    throw new RouteError(
      409,
      '원문 검증이 없는 문제가 있어 분류 반영을 중단합니다.',
      'UNVERIFIED_CATALOG',
    );
  }
  let updated = 0;
  if (apply && changes.length) {
    const timestamp = nowIso();
    const results = await db.batch(
      changes.map((row) =>
        db
          .prepare(
            `UPDATE coding_problems SET track = ?, level = ?, updated_at = ?
       WHERE id = ? AND source_url = ? AND track = ? AND level = ?`,
          )
          .bind(
            row.expectedTrack,
            row.expectedLevel,
            timestamp,
            row.id,
            row.sourceUrl,
            row.track,
            row.level,
          ),
      ),
    );
    updated = results.reduce((sum, result) => sum + Number(result.meta?.changes || 0), 0);
    if (updated !== changes.length) {
      throw new RouteError(
        409,
        '검사 이후 분류가 변경되었습니다. 반영 상태를 다시 확인하세요.',
        'CATALOG_CONFLICT',
      );
    }
  }
  return {
    verifiedAt: verifiedCatalogDate,
    scanned: rows.length,
    unverifiedIds,
    differences: changes.map(({ id, track, level, expectedTrack, expectedLevel }) => ({
      id,
      before: { track, level },
      after: { track: expectedTrack, level: expectedLevel },
    })),
    updated,
    applied: apply,
  };
}
