// The unsuffixed date is the regular A1 batch. An explicitly requested
// recovery gets A2 or later, so its files and receipts cannot close A1.
const PATTERN = /^(\d{4}-\d{2}-\d{2})(?:-A([2-9]|[1-9]\d{1,3}))?$/u;

export function parseBatchId(value) {
  const match = PATTERN.exec(String(value ?? ''));
  if (!match) return null;
  const date = match[1];
  const instant = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(instant.getTime()) || instant.toISOString().slice(0, 10) !== date) return null;
  return { date, attempt: Number(match[2] ?? 1) };
}

export const compareBatchIds = (left, right) => {
  const a = parseBatchId(left),
    b = parseBatchId(right);
  return a.date.localeCompare(b.date) || a.attempt - b.attempt;
};
