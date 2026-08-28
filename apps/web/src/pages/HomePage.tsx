import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { BriefcaseBusiness, Code2, Sparkles, Star, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useLocalFavorites } from '../lib/local-favorites';
import type { ViewMode } from '../components/AppShell';
import '../styles/home.css';

type Challenge = {
  id: string;
  problem: {
    displayTitle: string;
    level: number;
    track: 'ALGORITHM' | 'SQL';
    sourceUrl: string;
  };
};

const itemTypeLabels: Record<string, string> = {
  JOB_POSTING: '채용공고',
  CODING_PROBLEM: '코딩 문제',
  LEARNING_UNIT: '학습자료',
};

export function HomePage({ viewMode }: { viewMode: ViewMode }) {
  const favorites = useLocalFavorites();
  const challenge = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => api<Challenge[]>('/coding/daily-challenges'),
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
            <Sparkles size={15} /> 학습 워크스페이스
          </span>
          <h1>즐겨찾기</h1>
          <p>관심 공고, 코딩 문제와 학습자료를 한곳에서 다시 확인하세요.</p>
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
            <span>{favorites.items.length}개</span>
          </div>
          <p>이 브라우저에서 별표한 항목을 한곳에 모았습니다.</p>
        </div>
        {favorites.items.length === 0 && (
          <div className="empty-panel">
            <Star />
            <h3>아직 저장한 항목이 없습니다</h3>
            <p>채용공고, 코딩 문제나 학습자료의 즐겨찾기 버튼을 눌러 여기에 모아보세요.</p>
          </div>
        )}
        <div className={`favorite-item-grid ${viewMode}`}>
          {favorites.items.map((item) => (
            <article key={`${item.itemType}:${item.targetId}`}>
              <span className="favorite-item-icon">
                <Star fill="currentColor" aria-hidden="true" />
              </span>
              <span className="favorite-item-copy">
                <small>{itemTypeLabels[item.itemType] || '저장 항목'}</small>
                <strong>{item.label}</strong>
              </span>
              <span className="favorite-item-actions">
                <Link to={item.href}>열기</Link>
                <button
                  type="button"
                  aria-label={`${item.label} 즐겨찾기 해제`}
                  onClick={() => favorites.remove(item.itemType, item.targetId)}
                >
                  <Trash2 aria-hidden="true" /> 해제
                </button>
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
