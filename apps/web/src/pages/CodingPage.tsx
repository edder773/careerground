import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { Code2, ExternalLink, Filter, Flame, Star } from 'lucide-react';
import { api } from '../lib/api';
import { useLocalFavorites } from '../lib/local-favorites';

type Problem = {
  id: string;
  displayTitle: string;
  level: number;
  track: 'ALGORITHM' | 'SQL';
  tags: string[];
  sourceUrl: string;
};
type Challenge = { id: string; problemId: string; problem: Problem };
type ProblemScope = 'favorites' | 'all';

export function CodingPage() {
  const favorites = useLocalFavorites();
  const [searchParams, setSearchParams] = useSearchParams();
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [track, setTrack] = useState<'ALGORITHM' | 'SQL'>(
    searchParams.get('track') === 'SQL' ? 'SQL' : 'ALGORITHM',
  );
  const [scope, setScope] = useState<ProblemScope>(
    searchParams.get('favorites') === '1' ? 'favorites' : 'all',
  );

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (track === 'SQL') next.set('track', track);
    else next.delete('track');
    if (level) next.set('level', level);
    else next.delete('level');
    if (scope === 'favorites') next.set('favorites', '1');
    else next.delete('favorites');
    next.delete('view');
    if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
  }, [level, scope, searchParams, setSearchParams, track]);

  const problems = useQuery({
    queryKey: ['problems', track, level],
    queryFn: () => {
      const query = new URLSearchParams({ track });
      if (level) query.set('level', level);
      return api<Problem[]>(`/coding/problems?${query.toString()}`);
    },
  });
  const challenge = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: () => api<Challenge[]>('/coding/daily-challenges'),
  });
  const list = useMemo(
    () =>
      (problems.data || []).filter(
        (problem) => scope === 'all' || favorites.isFavorite('CODING_PROBLEM', problem.id),
      ),
    [favorites, problems.data, scope],
  );
  const problemTotal = list.length;
  const requestedProblem = searchParams.get('problem');
  const requestedProblemQuery = useQuery({
    queryKey: ['problem-detail', requestedProblem],
    queryFn: () => api<Problem>(`/coding/problems/${requestedProblem}`),
    enabled: Boolean(requestedProblem && !list.some((problem) => problem.id === requestedProblem)),
  });
  const displayList = useMemo(
    () =>
      requestedProblemQuery.data &&
      !list.some((problem) => problem.id === requestedProblemQuery.data.id)
        ? [requestedProblemQuery.data, ...list]
        : list,
    [list, requestedProblemQuery.data],
  );
  useEffect(() => {
    if (!requestedProblem || !displayList.length) return;
    document.getElementById(`problem-${requestedProblem}`)?.scrollIntoView({ block: 'center' });
  }, [displayList, requestedProblem]);

  const toggleFavorite = (problem: Problem) =>
    favorites.toggle({
      itemType: 'CODING_PROBLEM',
      targetId: problem.id,
      label: problem.displayTitle,
      href: `/coding?problem=${encodeURIComponent(problem.id)}`,
    });

  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Code2 size={15} /> 문제 추천
          </span>
          <h1>코딩테스트</h1>
          <p>오늘의 추천 문제를 확인하고, 전체 문제에서 연습할 문제를 즐겨찾기하세요.</p>
        </div>
      </section>
      {challenge.data && challenge.data.length > 0 && (
        <section className="daily-hero daily-pair" aria-label="오늘의 추천 문제">
          <header>
            <span>
              <Flame size={16} /> 오늘의 추천 문제
            </span>
          </header>
          <div className="daily-challenge-grid">
            {challenge.data.map((item) => (
              <article key={item.id}>
                <span>
                  {item.problem.track === 'SQL' && 'SQL · '}Lv. {item.problem.level}
                </span>
                <strong>{item.problem.displayTitle}</strong>
                <div className="tag-row">
                  {item.problem.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="daily-challenge-actions">
                  <a
                    href={item.problem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${item.problem.displayTitle} 문제 열기`}
                  >
                    문제 열기 <ExternalLink />
                  </a>
                  <button
                    type="button"
                    aria-label={`${item.problem.displayTitle} 즐겨찾기`}
                    aria-pressed={favorites.isFavorite('CODING_PROBLEM', item.problem.id)}
                    onClick={() => toggleFavorite(item.problem)}
                  >
                    <Star
                      size={17}
                      fill={
                        favorites.isFavorite('CODING_PROBLEM', item.problem.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                    {favorites.isFavorite('CODING_PROBLEM', item.problem.id)
                      ? '저장됨'
                      : '즐겨찾기'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {challenge.isError && (
        <div className="error-panel" role="alert">
          오늘의 추천 문제를 준비하지 못했습니다.
          <button type="button" onClick={() => void challenge.refetch()}>
            다시 시도
          </button>
        </div>
      )}
      <div className="problem-scope-tabs" role="group" aria-label="문제 목록">
        <button
          type="button"
          aria-pressed={scope === 'all'}
          className={scope === 'all' ? 'active' : ''}
          onClick={() => setScope('all')}
        >
          전체 문제
        </button>
        <button
          type="button"
          aria-pressed={scope === 'favorites'}
          className={scope === 'favorites' ? 'active' : ''}
          onClick={() => setScope('favorites')}
        >
          즐겨찾기
        </button>
      </div>
      <div className="filter-bar">
        <Filter />
        <div className="problem-track-tabs" role="group" aria-label="문제 유형">
          <button
            type="button"
            className={track === 'ALGORITHM' ? 'active' : ''}
            aria-pressed={track === 'ALGORITHM'}
            onClick={() => {
              setTrack('ALGORITHM');
              setLevel('');
            }}
          >
            알고리즘
          </button>
          <button
            type="button"
            className={track === 'SQL' ? 'active' : ''}
            aria-pressed={track === 'SQL'}
            onClick={() => {
              setTrack('SQL');
              setLevel('');
            }}
          >
            SQL
          </button>
        </div>
        <label>
          레벨
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            <option value="">전체</option>
            {[0, 1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                Lv. {value}
              </option>
            ))}
          </select>
        </label>
        <span>
          {scope === 'favorites'
            ? `${problemTotal.toLocaleString()}개 즐겨찾기`
            : `${problemTotal.toLocaleString()}개 문제 · 프로그래머스 원문에서 바로 풀 수 있습니다.`}
        </span>
      </div>
      {problems.isLoading && <div className="loading-panel">문제 목록을 불러오는 중…</div>}
      {problems.isError && <div className="error-panel">문제 목록을 불러오지 못했습니다.</div>}
      {!problems.isLoading && !problems.isError && displayList.length === 0 && (
        <div className="empty-panel coding-problem-empty">
          <h2>
            {scope === 'favorites' ? '즐겨찾기한 문제가 없습니다' : '조건에 맞는 문제가 없습니다'}
          </h2>
          <p>
            {scope === 'favorites'
              ? '전체 문제에서 별표를 눌러 즐겨찾기에 추가해보세요.'
              : '문제 유형이나 레벨 조건을 바꿔보세요.'}
          </p>
          {scope === 'favorites' && (
            <button
              type="button"
              className="primary-button compact"
              onClick={() => setScope('all')}
            >
              전체 문제 둘러보기
            </button>
          )}
        </div>
      )}
      <div className="problem-grid">
        {displayList.map((problem) => (
          <article
            key={problem.id}
            id={`problem-${problem.id}`}
            className={problem.id === requestedProblem ? 'search-target' : ''}
          >
            <div className="problem-top">
              <span className="level-pill">Lv. {problem.level}</span>
              <span className={`track-pill ${problem.track === 'SQL' ? 'sql' : ''}`}>
                {problem.track === 'SQL' ? 'SQL' : '알고리즘'}
              </span>
              <button
                aria-label={`${problem.displayTitle} 즐겨찾기`}
                aria-pressed={favorites.isFavorite('CODING_PROBLEM', problem.id)}
                onClick={() => toggleFavorite(problem)}
              >
                <Star
                  size={17}
                  fill={
                    favorites.isFavorite('CODING_PROBLEM', problem.id) ? 'currentColor' : 'none'
                  }
                />
              </button>
            </div>
            <h2>{problem.displayTitle}</h2>
            <div className="tag-row">
              {problem.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="card-actions">
              <a href={problem.sourceUrl} target="_blank" rel="noreferrer">
                문제 열기 <ExternalLink />
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
