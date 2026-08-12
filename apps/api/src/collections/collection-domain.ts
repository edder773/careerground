export function wouldCreateCollectionCycle(
  collectionId: string,
  nextParentId: string | null,
  parents: Map<string, string | null>,
) {
  let cursor = nextParentId;
  const visited = new Set<string>();
  while (cursor) {
    if (cursor === collectionId || visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = parents.get(cursor) ?? null;
  }
  return false;
}

export function collectionDepth(parentId: string | null, parents: Map<string, string | null>) {
  let cursor = parentId;
  let depth = 0;
  while (cursor) {
    depth += 1;
    if (depth > 20) return Number.POSITIVE_INFINITY;
    cursor = parents.get(cursor) ?? null;
  }
  return depth;
}
