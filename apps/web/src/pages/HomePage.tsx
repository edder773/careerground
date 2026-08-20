import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { BriefcaseBusiness, Code2, ExternalLink, Sparkles, Star, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { ViewMode } from '../components/AppShell';
import '../styles/home.css';

type CollectionItem = {
  id: string;
  itemType: string;
  targetId: string;
  label?: string;
  position?: number;
};

export type Collection = {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string | null;
  position: number;
  items: CollectionItem[];
  deletedAt?: string;
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

type FavoriteItem = CollectionItem & {
  placements: Array<{ collectionId: string; itemId: string }>;
};

const itemTypeLabels: Record<string, string> = {
  JOB_POSTING: '채용공고',
  CODING_PROBLEM: '코딩 문제',
  SOLUTION: '풀이',
  LEARNING_UNIT: '학습자료',
  EXTERNAL_LINK: '외부 링크',
};

function itemHref(item: CollectionItem) {
  const encoded = encodeURIComponent(item.targetId);
  if (item.itemType === 'EXTERNAL_LINK') return item.targetId;
  if (item.itemType === 'JOB_POSTING') return `/jobs?job=${encoded}`;
  if (item.itemType === 'CODING_PROBLEM') return `/coding?problem=${encoded}&view=all`;
  if (item.itemType === 'SOLUTION') return `/solutions?solution=${encoded}`;
  if (item.itemType === 'LEARNING_UNIT') return `/learning?unit=${encoded}`;
  return undefined;
}

export function HomePage({ viewMode }: { viewMode: ViewMode }) {
  const client = useQueryClient();
  const collections = useQuery({
    queryKey: ['collections'],
    queryFn: () => api<Collection[]>('/collections'),
  });
  const challenge = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => api<Challenge[]>('/coding/daily-challenges'),
  });
  const favorites = useMemo(() => {
    const byTarget = new Map<string, FavoriteItem>();
    for (const collection of collections.data || []) {
      for (const item of collection.items) {
        const key = `${item.itemType}:${item.targetId}`;
        const current = byTarget.get(key);
        if (current) {
          current.placements.push({ collectionId: collection.id, itemId: item.id });
        } else {
          byTarget.set(key, {
            ...item,
            placements: [{ collectionId: collection.id, itemId: item.id }],
          });
        }
      }
    }
    return [...byTarget.values()];
  }, [collections.data]);
  const removeFavorite = useMutation({
    mutationFn: (item: FavoriteItem) =>
      Promise.all(
        item.placements.map(({ collectionId, itemId }) =>
          api(`/collections/${collectionId}/items/${itemId}`, { method: 'DELETE' }),
        ),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ['collections'] }),
  });

  return (
    <div className="home-page finder-home favorites-home">
      <section className="today-strip home-priority favorites-today-strip" aria-label="오늘의 문제">
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
      </section>

      <section className="page-heading finder-canvas-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> 개인 워크스페이스
          </span>
          <h1>즐겨찾기</h1>
          <p>관심 공고, 코딩 문제, 학습자료와 풀이를 한곳에서 다시 확인하세요.</p>
        </div>
      </section>

      <section className="favorite-shortcuts" aria-label="즐겨찾기 바로가기">
        <Link to="/coding?favorites=1&view=all">
          <Star aria-hidden="true" />
          <span>
            <strong>즐겨찾기 문제</strong>
            <small>별표한 코딩 문제만 보기</small>
          </span>
        </Link>
        <Link to="/jobs?saved=1">
          <BriefcaseBusiness aria-hidden="true" />
          <span>
            <strong>관심 공고</strong>
            <small>저장한 채용공고만 보기</small>
          </span>
        </Link>
      </section>

      <section className="section-block favorite-library">
        <div className="section-title">
          <div>
            <h2>저장한 항목</h2>
            <span>{favorites.length}개</span>
          </div>
          <p>기존 폴더에 있던 항목도 빠짐없이 한 목록으로 모았습니다.</p>
        </div>
        {collections.isLoading && (
          <div className="skeleton-grid" aria-label="즐겨찾기 불러오는 중">
            <i />
            <i />
            <i />
          </div>
        )}
        {collections.isError && (
          <div className="error-panel">
            즐겨찾기를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}
        {!collections.isLoading && !collections.isError && favorites.length === 0 && (
          <div className="empty-panel">
            <Star />
            <h3>아직 저장한 항목이 없습니다</h3>
            <p>학습자료나 풀이의 즐겨찾기 버튼을 눌러 여기에 모아보세요.</p>
          </div>
        )}
        <div className={`favorite-item-grid ${viewMode}`}>
          {favorites.map((item) => {
            const href = itemHref(item);
            const external = item.itemType === 'EXTERNAL_LINK';
            return (
              <article key={`${item.itemType}:${item.targetId}`}>
                <span className="favorite-item-icon">
                  <Star fill="currentColor" aria-hidden="true" />
                </span>
                <span className="favorite-item-copy">
                  <small>{itemTypeLabels[item.itemType] || '저장 항목'}</small>
                  <strong>{item.label || item.targetId}</strong>
                </span>
                <span className="favorite-item-actions">
                  {href &&
                    (external ? (
                      <a href={href} target="_blank" rel="noreferrer">
                        열기 <ExternalLink aria-hidden="true" />
                      </a>
                    ) : (
                      <Link to={href}>열기</Link>
                    ))}
                  <button
                    type="button"
                    aria-label={`${item.label || item.targetId} 즐겨찾기 해제`}
                    disabled={
                      removeFavorite.isPending &&
                      removeFavorite.variables?.targetId === item.targetId
                    }
                    onClick={() => removeFavorite.mutate(item)}
                  >
                    <Trash2 aria-hidden="true" /> 해제
                  </button>
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
