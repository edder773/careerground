import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, FolderInput, X } from 'lucide-react';
import { api, json } from '../lib/api';

type Collection = {
  id: string;
  name: string;
  parentId?: string | null;
  items: Array<{ itemType: string; targetId: string }>;
};

export function FolderSaveButton({
  itemType,
  targetId,
  label,
}: {
  itemType: 'JOB_POSTING' | 'CODING_PROBLEM' | 'SOLUTION' | 'LEARNING_UNIT' | 'NOTE';
  targetId: string;
  label: string;
}) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [savedName, setSavedName] = useState('');
  const collections = useQuery({
    queryKey: ['collections'],
    queryFn: () => api<Collection[]>('/collections'),
    enabled: open,
    refetchOnMount: 'always',
  });
  const save = useMutation({
    mutationFn: (collection: Collection) =>
      api(`/collections/${collection.id}/items`, {
        method: 'POST',
        body: json({ itemType, targetId, label }),
      }),
    onSuccess: async (_value, collection) => {
      setSavedName(collection.name);
      setOpen(false);
      await client.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="folder-save">
        <Dialog.Trigger asChild>
          <button type="button" aria-expanded={open}>
            {savedName ? <Check /> : <FolderInput />}
            {savedName ? `${savedName}에 저장됨` : '폴더에 저장'}
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
            {collections.data
              ?.filter((collection) => !collection.parentId)
              .map((collection) => {
                const alreadySaved = collection.items.some(
                  (item) => item.itemType === itemType && item.targetId === targetId,
                );
                return (
                  <button
                    type="button"
                    key={collection.id}
                    disabled={alreadySaved || save.isPending}
                    onClick={() => save.mutate(collection)}
                  >
                    {alreadySaved && <Check />}
                    {collection.name}
                  </button>
                );
              })}
            {!collections.isLoading && !collections.data?.length && (
              <span>홈에서 먼저 폴더를 만들어주세요.</span>
            )}
            {save.isError && <span className="error-text">저장하지 못했습니다.</span>}
          </Dialog.Content>
        )}
      </div>
    </Dialog.Root>
  );
}
