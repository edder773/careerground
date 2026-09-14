import catalog from './verified-programmers-catalog.json' with { type: 'json' };

export const verifiedCatalogDate = catalog.verifiedAt;
const byId = new Map(catalog.problems.map((problem) => [problem.lessonId, problem]));
if (byId.size !== catalog.problems.length) throw new Error('Duplicate verified lesson ID');

export function verifiedCodingMetadata(sourceUrl) {
  try {
    const url = new globalThis.URL(sourceUrl);
    const match = url.pathname.match(/^\/learn\/courses\/30\/lessons\/([1-9]\d*)$/u);
    if (url.origin !== 'https://school.programmers.co.kr' || !match || url.username || url.password)
      return null;
    return byId.get(Number(match[1])) || null;
  } catch {
    return null;
  }
}

// Unknown sources are not implicitly algorithms. DB labels are not proof.
export function isVerifiedCodingProblem(problem) {
  const verified = verifiedCodingMetadata(problem.sourceUrl);
  return Boolean(
    verified && verified.track === problem.track && verified.level === Number(problem.level),
  );
}
