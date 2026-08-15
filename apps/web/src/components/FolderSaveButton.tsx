import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, FolderInput, X } from 'lucide-react';
import { api, json } from '../lib/api';

type Collection = {
  id: string;
  name: string;
  parentId?: string | null;
  items: Array<{ id: string; itemType: string; targetId: string; label?: string }>;
};

export function FolderSaveButton({
  itemType,
  targetId,
  label,
}: {
  itemType: 'JOB_POSTING' | 'CODING_PROBLEM' | 'SOLUTION' | 'LEARNING_UNIT';
  targetId: string;
  label: string;
}) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const collections = useQuery({
    queryKey: ['collections'],
    queryFn: () => api<Collection[]>('/collections'),
    enabled: open,
    staleTime: 60_000,
  });
  const toggle = useMutation({
    mutationFn: async ({ collection, active }: { collection: Collection; active: boolean }) => {
      const existing = collection.items.find(
        (item) => item.itemType === itemType && item.targetId === targetId,
      );
      if (!active && existing) {
        await api(`/collections/${collection.id}/items/${existing.id}`, { method: 'DELETE' });
        return { active: false, item: existing };
      }
      const item = await api<Collection['items'][number]>(`/collections/${collection.id}/items`, {
        method: 'POST',
        body: json({ itemType, targetId, label }),
      });
      return { active: true, item };
    },
    onMutate: async ({ collection, active }) => {
      await client.cancelQueries({ queryKey: ['collections'] });
      const previous = client.getQueryData<Collection[]>(['collections']);
      client.setQueryData<Collection[]>(['collections'], (current) =>
        current?.map((item) =>
          item.id === collection.id
            ? {
                ...item,
                items: active
                  ? [...item.items, { id: `optimistic-${targetId}`, itemType, targetId, label }]
                  : item.items.filter(
                      (saved) => saved.itemType !== itemType || saved.targetId !== targetId,
                    ),
              }
            : item,
        ),
      );
      return { previous };
    },
    onSuccess: (result, variables) => {
      client.setQueryData<Collection[]>(['collections'], (current) =>
        current?.map((collection) =>
          collection.id === variables.collection.id && result.active
            ? {
                ...collection,
                items: collection.items.map((item) =>
                  item.id === `optimistic-${targetId}` ? result.item : item,
                ),
              }
            : collection,
        ),
      );
    },
    onError: (_error, _variables, context) =>
      client.setQueryData(['collections'], context?.previous),
  });
  const savedFolders =
    collections.data?.filter((collection) =>
      collection.items.some((item) => item.itemType === itemType && item.targetId === targetId),
    ) || [];
  const pathFor = (collection: Collection) => {
    const names = [collection.name];
    let parentId = collection.parentId;
    const seen = new Set([collection.id]);
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId);
      const parent = collections.data?.find((candidate) => candidate.id === parentId);
      if (!parent) break;
      names.unshift(parent.name);
      parentId = parent.parentId;
    }
    return names.join(' / ');
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="folder-save">
        <Dialog.Trigger asChild>
          <button type="button" aria-expanded={open}>
            {savedFolders.length ? <Check /> : <FolderInput />}
            {savedFolders.length ? `${savedFolders.length}개 폴더에 저장됨` : '폴더에 저장'}
          </button>
        </Dialog.Trigger>
        {open && (
          <Dialog.Content
            className="folder-save-menu"
            aria-label={`${label} 저장할 폴더 선택`}
            aria-describedby={undefined}
          >
            <header>
              <Dialog.Title asChild>
                <strong>
                  <span aria-hidden="true">저장할 폴더</span>
                  <span className="sr-only">{label} 저장할 폴더 선택</span>
                </strong>
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" aria-label="폴더 선택 닫기">
                  <X />
                </button>
              </Dialog.Close>
            </header>
            {collections.isLoading && <span>폴더 불러오는 중…</span>}
            {collections.isError && <span className="error-text">폴더를 불러오지 못했습니다.</span>}
            {collections.data?.map((collection) => {
              const alreadySaved = collection.items.some(
                (item) => item.itemType === itemType && item.targetId === targetId,
              );
              return (
                <button
                  type="button"
                  key={collection.id}
                  role="checkbox"
                  aria-checked={alreadySaved}
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate({ collection, active: !alreadySaved })}
                >
                  {alreadySaved && <Check />}
                  {pathFor(collection)}
                </button>
              );
            })}
            {!collections.isLoading && !collections.data?.length && (
              <span>홈에서 먼저 폴더를 만들어주세요.</span>
            )}
            {toggle.isError && <span className="error-text">폴더 저장을 변경하지 못했습니다.</span>}
          </Dialog.Content>
        )}
      </div>
    </Dialog.Root>
  );
}
