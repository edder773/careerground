import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { api, json } from '../lib/api';

type CollectionItem = {
  id: string;
  itemType: string;
  targetId: string;
  label?: string;
};

type Collection = {
  id: string;
  name: string;
  parentId?: string | null;
  items: CollectionItem[];
};

const FAVORITES_NAME = '즐겨찾기';

export function FavoriteSaveButton({
  itemType,
  targetId,
  label,
}: {
  itemType: 'SOLUTION' | 'LEARNING_UNIT';
  targetId: string;
  label: string;
}) {
  const client = useQueryClient();
  const collections = useQuery({
    queryKey: ['collections'],
    queryFn: () => api<Collection[]>('/collections'),
    staleTime: 60_000,
  });
  const savedItems =
    collections.data?.flatMap((collection) =>
      collection.items
        .filter((item) => item.itemType === itemType && item.targetId === targetId)
        .map((item) => ({ collectionId: collection.id, itemId: item.id })),
    ) || [];
  const saved = savedItems.length > 0;
  const toggle = useMutation({
    mutationFn: async () => {
      if (savedItems.length) {
        await Promise.all(
          savedItems.map(({ collectionId, itemId }) =>
            api(`/collections/${collectionId}/items/${itemId}`, { method: 'DELETE' }),
          ),
        );
        return;
      }
      let favorites = collections.data?.find(
        (collection) => !collection.parentId && collection.name === FAVORITES_NAME,
      );
      if (!favorites) {
        favorites = await api<Collection>('/collections', {
          method: 'POST',
          body: json({ name: FAVORITES_NAME, icon: 'star', color: 'amber', parentId: null }),
        });
      }
      await api(`/collections/${favorites.id}/items`, {
        method: 'POST',
        body: json({ itemType, targetId, label }),
      });
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['collections'] }),
  });

  return (
    <button
      type="button"
      className={`favorite-save-button ${saved ? 'saved' : ''}`}
      aria-label={`${label} ${saved ? '즐겨찾기 해제' : '즐겨찾기'}`}
      aria-pressed={saved}
      disabled={collections.isLoading || collections.isError || toggle.isPending}
      onClick={() => toggle.mutate()}
    >
      <Star fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {toggle.isPending ? '처리 중…' : saved ? '즐겨찾기됨' : '즐겨찾기'}
    </button>
  );
}
