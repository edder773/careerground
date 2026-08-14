export type DiffLine = { type: 'same' | 'added' | 'removed'; value: string };

export function myersDiff(before: string, after: string): DiffLine[] {
  const original = before.split('\n');
  const revised = after.split('\n');
  const maximum = original.length + revised.length;
  const frontier = new Map<number, number>([[1, 0]]);
  const trace: Array<Map<number, number>> = [];

  for (let distance = 0; distance <= maximum; distance += 1) {
    trace.push(new Map(frontier));
    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      const down = frontier.get(diagonal + 1) ?? Number.NEGATIVE_INFINITY;
      const right = frontier.get(diagonal - 1) ?? Number.NEGATIVE_INFINITY;
      let x = diagonal === -distance || (diagonal !== distance && right < down) ? down : right + 1;
      if (!Number.isFinite(x)) x = 0;
      let y = x - diagonal;
      while (x < original.length && y < revised.length && original[x] === revised[y]) {
        x += 1;
        y += 1;
      }
      frontier.set(diagonal, x);
      if (x >= original.length && y >= revised.length) {
        return backtrack(trace, original, revised, distance);
      }
    }
  }
  return [];
}

function backtrack(
  trace: Array<Map<number, number>>,
  original: string[],
  revised: string[],
  distance: number,
) {
  const result: DiffLine[] = [];
  let x = original.length;
  let y = revised.length;
  for (let current = distance; current > 0; current -= 1) {
    const frontier = trace[current]!;
    const diagonal = x - y;
    const down = frontier.get(diagonal + 1) ?? Number.NEGATIVE_INFINITY;
    const right = frontier.get(diagonal - 1) ?? Number.NEGATIVE_INFINITY;
    const previousDiagonal =
      diagonal === -current || (diagonal !== current && right < down) ? diagonal + 1 : diagonal - 1;
    const previousX = frontier.get(previousDiagonal) ?? 0;
    const previousY = previousX - previousDiagonal;
    while (x > previousX && y > previousY) {
      result.push({ type: 'same', value: original[x - 1]! });
      x -= 1;
      y -= 1;
    }
    if (x === previousX) {
      result.push({ type: 'added', value: revised[y - 1]! });
      y -= 1;
    } else {
      result.push({ type: 'removed', value: original[x - 1]! });
      x -= 1;
    }
  }
  while (x > 0 && y > 0) {
    result.push({ type: 'same', value: original[x - 1]! });
    x -= 1;
    y -= 1;
  }
  while (x > 0) {
    result.push({ type: 'removed', value: original[x - 1]! });
    x -= 1;
  }
  while (y > 0) {
    result.push({ type: 'added', value: revised[y - 1]! });
    y -= 1;
  }
  return result.reverse();
}
