import { useCallback, useMemo, useSyncExternalStore } from 'react';

export type FavoriteItemType = 'JOB_POSTING' | 'CODING_PROBLEM';

export type LocalFavorite = {
  itemType: FavoriteItemType;
  targetId: string;
  label: string;
  href: string;
};

const FAVORITES_STORAGE_NAME = 'careerground.favorites.v1';
const CHANGE_EVENT = 'careerground:favorites-change';
const EMPTY_SNAPSHOT = '[]';

const keyOf = (itemType: FavoriteItemType, targetId: string) => `${itemType}:${targetId}`;

function snapshot() {
  if (typeof window === 'undefined') return EMPTY_SNAPSHOT;
  try {
    return window.localStorage.getItem(FAVORITES_STORAGE_NAME) || EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function parseFavorites(raw: string): LocalFavorite[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const unique = new Map<string, LocalFavorite>();
    for (const value of parsed) {
      if (!value || typeof value !== 'object') continue;
      const candidate = value as Partial<LocalFavorite>;
      if (
        !['JOB_POSTING', 'CODING_PROBLEM'].includes(String(candidate.itemType)) ||
        typeof candidate.targetId !== 'string' ||
        typeof candidate.label !== 'string' ||
        typeof candidate.href !== 'string'
      ) {
        continue;
      }
      unique.set(keyOf(candidate.itemType as FavoriteItemType, candidate.targetId), {
        itemType: candidate.itemType as FavoriteItemType,
        targetId: candidate.targetId,
        label: candidate.label,
        href: candidate.href,
      });
    }
    return [...unique.values()];
  } catch {
    return [];
  }
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_STORAGE_NAME) listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function writeFavorites(items: LocalFavorite[]) {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_NAME, JSON.stringify(items));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Favorites are an optional browser-only preference.
  }
}

export function useLocalFavorites() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => EMPTY_SNAPSHOT);
  const items = useMemo(() => parseFavorites(raw), [raw]);
  const keys = useMemo(
    () => new Set(items.map((item) => keyOf(item.itemType, item.targetId))),
    [items],
  );
  const isFavorite = useCallback(
    (itemType: FavoriteItemType, targetId: string) => keys.has(keyOf(itemType, targetId)),
    [keys],
  );
  const save = useCallback(
    (item: LocalFavorite) => {
      const next = items.filter(
        (current) =>
          keyOf(current.itemType, current.targetId) !== keyOf(item.itemType, item.targetId),
      );
      writeFavorites([item, ...next]);
    },
    [items],
  );
  const remove = useCallback(
    (itemType: FavoriteItemType, targetId: string) => {
      writeFavorites(
        items.filter((item) => keyOf(item.itemType, item.targetId) !== keyOf(itemType, targetId)),
      );
    },
    [items],
  );
  const toggle = useCallback(
    (item: LocalFavorite) => {
      if (isFavorite(item.itemType, item.targetId)) remove(item.itemType, item.targetId);
      else save(item);
    },
    [isFavorite, remove, save],
  );
  return { items, isFavorite, remove, save, toggle };
}
