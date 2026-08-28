import { Star } from 'lucide-react';
import { useLocalFavorites, type FavoriteItemType } from '../lib/local-favorites';

export function FavoriteSaveButton({
  itemType,
  targetId,
  label,
}: {
  itemType: FavoriteItemType;
  targetId: string;
  label: string;
}) {
  const favorites = useLocalFavorites();
  const saved = favorites.isFavorite(itemType, targetId);
  const href =
    itemType === 'LEARNING_UNIT'
      ? `/learning?unit=${encodeURIComponent(targetId)}`
      : itemType === 'JOB_POSTING'
        ? `/jobs?job=${encodeURIComponent(targetId)}`
        : `/coding?problem=${encodeURIComponent(targetId)}`;

  return (
    <button
      type="button"
      className={`favorite-save-button ${saved ? 'saved' : ''}`}
      aria-label={`${label} ${saved ? '즐겨찾기 해제' : '즐겨찾기'}`}
      aria-pressed={saved}
      onClick={() => favorites.toggle({ itemType, targetId, label, href })}
    >
      <Star fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {saved ? '즐겨찾기됨' : '즐겨찾기'}
    </button>
  );
}
