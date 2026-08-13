import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BellRing,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Folder,
  FolderPlus,
  GripVertical,
  Link2,
  Pencil,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { api, json } from '../lib/api';
import type { ViewMode } from '../components/AppShell';

type CollectionItem = { id: string; itemType: string; targetId: string; label?: string };
export type Collection = {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string | null;
  position: number;
  items: CollectionItem[];
};
type Challenge = {
  id: string;
  problem: {
    displayTitle: string;
    level: number;
    track: 'ALGORITHM' | 'SQL';
    sourceUrl: string;
  };
};

function SortableFolder({
  folder,
  selected,
  onSelect,
  viewMode,
}: {
  folder: Collection;
  selected: boolean;
  onSelect: () => void;
  viewMode: ViewMode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: folder.id,
  });
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`folder-card folder-${folder.color} ${viewMode} ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <button
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label={`${folder.name} 순서 이동`}
      >
        <GripVertical />
      </button>
      <button className="folder-open" type="button" onClick={onSelect} aria-current={selected}>
        <span className="folder-shape">
          <Folder aria-hidden="true" />
        </span>
        <span className="folder-copy">
          <strong>{folder.name}</strong>
          <span>{folder.items.length}개 항목</span>
        </span>
      </button>
    </article>
  );
}

export function HomePage({ viewMode }: { viewMode: ViewMode }) {
  const client = useQueryClient();
  const [searchParams] = useSearchParams();
  const collections = useQuery({
    queryKey: ['collections'],
    queryFn: () => api<Collection[]>('/collections'),
  });
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      api<{ recentJobs: number; expiringJobs: number; dueReviews: number }>('/dashboard'),
  });
  const challenge = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => api<Challenge[]>('/coding/daily-challenges'),
  });
  const [selected, setSelected] = useState<string>();
  const requestedFolder = searchParams.get('folder');
  const [creating, setCreating] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('violet');
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const folders = useMemo(
    () => (collections.data || []).filter((folder) => !folder.parentId),
    [collections.data],
  );
  const activeFolder = (collections.data || []).find((folder) => folder.id === selected);
  useEffect(() => {
    if (
      requestedFolder &&
      collections.data?.some((folder) => folder.id === requestedFolder) &&
      selected !== requestedFolder
    ) {
      setSelected(requestedFolder);
    }
  }, [collections.data, requestedFolder, selected]);
  const createFolder = useMutation({
    mutationFn: () =>
      api<Collection>('/collections', {
        method: 'POST',
        body: json({
          name,
          icon: 'folder',
          color,
          parentId: createParentId,
        }),
      }),
    onSuccess: async (folder) => {
      setName('');
      setCreating(false);
      setCreateParentId(null);
      setSelected(folder.id);
      await client.invalidateQueries({ queryKey: ['collections'] });
    },
  });
  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      api('/collections/reorder', { method: 'PATCH', body: json({ ids }) }),
    onMutate: async (ids) => {
      await client.cancelQueries({ queryKey: ['collections'] });
      const previous = client.getQueryData<Collection[]>(['collections']);
      client.setQueryData<Collection[]>(['collections'], (current) =>
        current
          ? [
              ...ids.map((id) => current.find((item) => item.id === id)!).filter(Boolean),
              ...current.filter((item) => item.parentId),
            ]
          : current,
      );
      return { previous };
    },
    onError: (_error, _ids, context) => client.setQueryData(['collections'], context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: ['collections'] }),
  });
  const renameFolder = useMutation({
    mutationFn: () =>
      api(`/collections/${activeFolder!.id}`, {
        method: 'PATCH',
        body: json({ name: renameValue }),
      }),
    onSuccess: async () => {
      setRenaming(false);
      await client.invalidateQueries({ queryKey: ['collections'] });
    },
  });
  const addLink = useMutation({
    mutationFn: () =>
      api(`/collections/${activeFolder!.id}/items`, {
        method: 'POST',
        body: json({ itemType: 'EXTERNAL_LINK', targetId: linkUrl, label: linkLabel || linkUrl }),
      }),
    onSuccess: async () => {
      setAddingLink(false);
      setLinkUrl('');
      setLinkLabel('');
      await client.invalidateQueries({ queryKey: ['collections'] });
    },
  });
  const deleteFolder = useMutation({
    mutationFn: (id: string) => api(`/collections/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      setSelected(undefined);
      await client.invalidateQueries({ queryKey: ['collections'] });
    },
  });
  const dragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const before = folders.findIndex((folder) => folder.id === event.active.id);
    const after = folders.findIndex((folder) => folder.id === event.over?.id);
    reorder.mutate(arrayMove(folders, before, after).map((folder) => folder.id));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) createFolder.mutate();
  };

  return (
    <div className="home-page finder-home">
      <section className="today-strip home-priority" aria-label="오늘의 요약">
        <article className="today-feature">
          <div className="today-icon">
            <Code2 />
          </div>
          <div className="today-problems">
            <span>오늘의 코딩테스트</span>
            {challenge.isLoading && <strong>문제를 준비하는 중…</strong>}
            {!challenge.isLoading && !challenge.data?.length && (
              <strong>오늘의 문제를 확인해주세요</strong>
            )}
            <div className="today-problem-list">
              {challenge.data?.map((item) => (
                <a key={item.id} href={item.problem.sourceUrl} target="_blank" rel="noreferrer">
                  <small>
                    {item.problem.track === 'SQL' ? 'SQL · ' : ''}Lv. {item.problem.level}
                  </small>
                  <strong>{item.problem.displayTitle}</strong>
                  <b>열기</b>
                </a>
              ))}
            </div>
          </div>
        </article>
        <article>
          <BookOpen />
          <div>
            <strong>{dashboard.data?.dueReviews ?? '—'}</strong>
            <span>오늘 복습</span>
          </div>
        </article>
        <article>
          <BriefcaseBusiness />
          <div>
            <strong>{dashboard.data?.recentJobs ?? '—'}</strong>
            <span>신규 공고</span>
          </div>
        </article>
        <article>
          <BellRing />
          <div>
            <strong>{dashboard.data?.expiringJobs ?? '—'}</strong>
            <span>마감 임박</span>
          </div>
        </article>
      </section>
      <section className="page-heading finder-canvas-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> 개인 워크스페이스
          </span>
          <h1>내 폴더</h1>
          <p>자료를 폴더처럼 자유롭게 모으고 정리하세요.</p>
        </div>
        <button
          className="primary-button compact"
          onClick={() => {
            setCreateParentId(null);
            setCreating(true);
          }}
        >
          <FolderPlus /> 새 폴더
        </button>
      </section>
      <section className="section-block">
        <div className="section-title">
          <div>
            <h2>내 폴더</h2>
            <span>{folders.length}개</span>
          </div>
          <p>끌어서 자주 쓰는 순서로 정렬하세요.</p>
        </div>
        {creating && (
          <form className="inline-create" onSubmit={submit}>
            <label>
              <span>폴더 이름</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
              />
            </label>
            <label>
              <span>색상</span>
              <select value={color} onChange={(event) => setColor(event.target.value)}>
                <option value="violet">보라</option>
                <option value="cyan">파랑</option>
                <option value="amber">노랑</option>
                <option value="rose">분홍</option>
                <option value="emerald">초록</option>
                <option value="slate">회색</option>
              </select>
            </label>
            <button className="primary-button compact" type="submit">
              만들기
            </button>
            <button type="button" className="ghost-button" onClick={() => setCreating(false)}>
              취소
            </button>
          </form>
        )}
        {collections.isLoading && (
          <div className="skeleton-grid" aria-label="폴더 불러오는 중">
            <i />
            <i />
            <i />
          </div>
        )}
        {collections.isError && (
          <div className="error-panel">폴더를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>
        )}
        {!collections.isLoading && folders.length === 0 && (
          <div className="empty-panel">
            <FolderPlus />
            <h3>첫 폴더를 만들어보세요</h3>
            <p>공고, 코딩 문제, 학습 단위를 원하는 기준으로 모을 수 있습니다.</p>
            <button className="primary-button compact" onClick={() => setCreating(true)}>
              폴더 만들기
            </button>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
          <SortableContext
            items={folders.map((folder) => folder.id)}
            strategy={rectSortingStrategy}
          >
            <div className={`folder-grid ${viewMode}`}>
              {folders.map((folder) => (
                <SortableFolder
                  key={folder.id}
                  folder={folder}
                  selected={selected === folder.id}
                  onSelect={() => setSelected(folder.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>
      {activeFolder && (
        <section className="section-block collection-detail">
          <div className="section-title">
            <div>
              <h2>{activeFolder?.name || '폴더 미리보기'}</h2>
              {activeFolder && <span>{activeFolder.items.length}개 항목</span>}
            </div>
            {activeFolder && (
              <div className="detail-actions">
                <button
                  className="ghost-button"
                  onClick={() => {
                    setRenameValue(activeFolder.name);
                    setRenaming(true);
                  }}
                >
                  <Pencil /> 이름 변경
                </button>
                <button className="ghost-button" onClick={() => setAddingLink(true)}>
                  <Link2 /> 링크 추가
                </button>
                <button
                  className="ghost-button"
                  onClick={() => {
                    setCreateParentId(activeFolder.id);
                    setCreating(true);
                  }}
                >
                  <FolderPlus /> 하위 폴더
                </button>
                <button
                  className="ghost-button danger"
                  onClick={() => {
                    if (window.confirm(`“${activeFolder.name}” 폴더를 휴지통으로 이동할까요?`)) {
                      deleteFolder.mutate(activeFolder.id);
                    }
                  }}
                >
                  <Trash2 /> 휴지통으로
                </button>
              </div>
            )}
          </div>
          {renaming && activeFolder && (
            <form
              className="inline-create"
              onSubmit={(event) => {
                event.preventDefault();
                if (renameValue.trim()) renameFolder.mutate();
              }}
            >
              <label>
                <span>새 폴더 이름</span>
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  maxLength={80}
                />
              </label>
              <button className="primary-button compact">저장</button>
              <button className="ghost-button" type="button" onClick={() => setRenaming(false)}>
                취소
              </button>
            </form>
          )}
          {addingLink && activeFolder && (
            <form
              className="inline-create"
              onSubmit={(event) => {
                event.preventDefault();
                if (linkUrl.trim()) addLink.mutate();
              }}
            >
              <label>
                <span>외부 링크</span>
                <input
                  type="url"
                  autoFocus
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://"
                />
              </label>
              <label>
                <span>표시 이름</span>
                <input
                  value={linkLabel}
                  onChange={(event) => setLinkLabel(event.target.value)}
                  maxLength={240}
                />
              </label>
              <button className="primary-button compact">추가</button>
              <button className="ghost-button" type="button" onClick={() => setAddingLink(false)}>
                취소
              </button>
            </form>
          )}
          {activeFolder && activeFolder.items.length === 0 && (
            <div className="hint-panel">
              아직 비어 있습니다. 채용공고나 코딩테스트에서 “폴더에 저장”을 선택하세요.
            </div>
          )}
          {(collections.data || []).some((folder) => folder.parentId === activeFolder.id) && (
            <div className="subfolder-list">
              {(collections.data || [])
                .filter((folder) => folder.parentId === activeFolder.id)
                .map((folder) => (
                  <button key={folder.id} onClick={() => setSelected(folder.id)}>
                    <Folder /> <span>{folder.name}</span>
                  </button>
                ))}
            </div>
          )}
          {activeFolder && (
            <div className="item-list">
              {activeFolder.items.map((item) => (
                <article key={item.id}>
                  <span className="item-type">{item.itemType.replaceAll('_', ' ')}</span>
                  <strong>{item.label || item.targetId}</strong>
                  <Star size={16} />
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="virtual-folders">
        <article>
          <RotateCcw />
          <strong>최근 항목</strong>
          <span>최근 수정된 자료</span>
        </article>
        <article>
          <Star />
          <strong>즐겨찾기</strong>
          <span>중요 표시 항목</span>
        </article>
        <article>
          <BriefcaseBusiness />
          <strong>관심 공고</strong>
          <span>지원 후보 모음</span>
        </article>
        <article>
          <BookOpen />
          <strong>복습 예정</strong>
          <span>간격 반복 일정</span>
        </article>
      </section>
    </div>
  );
}
