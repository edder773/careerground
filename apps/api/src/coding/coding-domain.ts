import { createHash } from 'node:crypto';

export function kstCalendarDate(input: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(input);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return new Date(`${get('year')}-${get('month')}-${get('day')}T00:00:00.000Z`);
}

export function selectDeterministicProblem<T extends { id: string }>(
  candidates: T[],
  seed: string,
) {
  if (!candidates.length) return undefined;
  const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
  const value = Number.parseInt(createHash('sha256').update(seed).digest('hex').slice(0, 8), 16);
  return sorted[value % sorted.length];
}

export type SolvedRow = { userId: string; problemId: string; solvedAt: Date; code: string };

export function solvedCounts(rows: SolvedRow[], since?: Date) {
  const byUser = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.code.trim() || (since && row.solvedAt < since)) continue;
    const set = byUser.get(row.userId) || new Set<string>();
    set.add(row.problemId);
    byUser.set(row.userId, set);
  }
  return new Map([...byUser].map(([userId, problems]) => [userId, problems.size]));
}

export function denseRank<T extends { score: number }>(rows: T[]) {
  let lastScore: number | undefined;
  let rank = 0;
  return [...rows]
    .sort((a, b) => b.score - a.score)
    .map((row) => {
      if (lastScore !== row.score) rank += 1;
      lastScore = row.score;
      return { ...row, rank };
    });
}

export function mayEditComment(actor: { id: string; role: string }, authorId: string) {
  return actor.id === authorId || actor.role === 'ADMIN';
}
