import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Code2,
  FolderKanban,
  Grid2X2,
  GraduationCap,
  Home,
  List,
  Menu,
  MoreHorizontal,
  Search,
  X,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { brand, productLinks } from '@careerground/config';
import { api } from '../lib/api';
import { ApiStatusRegion } from './ApiStatusRegion';
import '../styles/shell.css';

const navigation = [
  { to: '/', label: '홈', icon: Home },
  { to: '/learning', label: '학습', icon: BookOpen },
  { to: '/jobs', label: '채용공고', icon: BriefcaseBusiness },
  { to: '/coding', label: '코딩테스트', icon: Code2 },
] as const;

const titles: Record<string, string> = {
  '/': '둘러보기',
  '/learning': '학습 라이브러리',
  '/jobs': '신입 IT 채용공고',
  '/coding': '코딩테스트',
};

export type ViewMode = 'grid' | 'list';
type SearchItem = {
  id: string;
  href: string;
  title?: string;
  name?: string;
  displayTitle?: string;
};

const searchItemKey = (group: string, item: SearchItem) => `${group}:${item.id}`;

export function AppShell({
  children,
  viewMode,
  onViewMode,
}: PropsWithChildren<{ viewMode: ViewMode; onViewMode: (mode: ViewMode) => void }>) {
  const client = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeResult, setActiveResult] = useState(0);
  const recentSearchKey = 'cg-recent-searches:v3';
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('cg-recent-searches:v3') || '[]') as unknown;
      return Array.isArray(parsed) ? parsed.map(String).slice(0, 5) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(recentSearchKey) || '[]') as unknown;
      setRecentSearches(Array.isArray(parsed) ? parsed.map(String).slice(0, 5) : []);
      localStorage.removeItem('cg-recent-searches');
    } catch {
      setRecentSearches([]);
    }
  }, [recentSearchKey]);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  const results = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      api<Record<string, SearchItem[]>>(`/search?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: searchOpen && debouncedQuery.length >= 2,
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setDrawer(false), [location.pathname]);
  const resultCount = useMemo(
    () =>
      Object.values(results.data || {})
        .filter(Array.isArray)
        .reduce((sum, value) => sum + value.length, 0),
    [results.data],
  );
  const flatResults = useMemo(
    () =>
      Object.entries(results.data || {}).flatMap(([group, items]) =>
        Array.isArray(items) ? items.map((item) => ({ ...item, group })) : [],
      ),
    [results.data],
  );
  useEffect(() => setActiveResult(0), [debouncedQuery, results.data]);
  const openResult = (item: SearchItem) => {
    const term = query.trim();
    if (term) {
      const next = [term, ...recentSearches.filter((value) => value !== term)].slice(0, 5);
      setRecentSearches(next);
      try {
        localStorage.setItem(recentSearchKey, JSON.stringify(next));
      } catch {
        // Recent search history is an optional device preference.
      }
    }
    setSearchOpen(false);
    setQuery('');
    navigate(item.href);
  };
  const preloadLearningData = () => {
    void client.prefetchQuery({
      queryKey: ['learning'],
      queryFn: () => api<unknown[]>('/learning'),
      staleTime: 5 * 60_000,
    });
  };
  const learningIntentProps = {
    onPointerEnter: preloadLearningData,
    onPointerDown: preloadLearningData,
    onFocus: preloadLearningData,
  };

  const nav = (
    <>
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <FolderKanban size={20} />
        </div>
        <div>
          <strong>{brand.name}</strong>
          <span>Growth workspace</span>
        </div>
      </div>
      <nav className="side-nav" aria-label="주요 메뉴">
        <span className="side-nav-label">둘러보기</span>
        {navigation.slice(0, 3).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
            {...(to === '/learning' ? learningIntentProps : {})}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <span className="side-nav-label">함께 성장</span>
        {navigation.slice(3).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <a
        className="certification-link"
        href={productLinks.certificationLearning}
        target="_blank"
        rel="noreferrer"
        aria-label="배움집 자격증 학습 새 창에서 열기"
      >
        <GraduationCap size={18} aria-hidden="true" />
        <span>
          <strong>자격증 학습</strong>
          <small>배움집으로 이동</small>
        </span>
        <ChevronRight size={15} aria-hidden="true" />
      </a>
    </>
  );

  return (
    <div className="app-canvas">
      <aside className="sidebar">{nav}</aside>
      {drawer && (
        <div className="drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden="true" />
      )}
      <aside
        className={`mobile-drawer ${drawer ? 'open' : ''}`}
        aria-label="모바일 메뉴"
        aria-hidden={!drawer}
        inert={!drawer ? true : undefined}
      >
        <button
          className="drawer-close"
          type="button"
          onClick={() => setDrawer(false)}
          aria-label="메뉴 닫기"
        >
          <X />
        </button>
        {nav}
      </aside>
      <main className="workspace">
        <header className="toolbar">
          <div className="toolbar-left">
            <button
              className="mobile-menu"
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="메뉴 열기"
            >
              <Menu />
            </button>
            <div className="history-buttons" aria-label="페이지 이동">
              <button onClick={() => navigate(-1)} aria-label="뒤로">
                <ChevronLeft />
              </button>
              <button onClick={() => navigate(1)} aria-label="앞으로">
                <ChevronRight />
              </button>
            </div>
            <div className="breadcrumb">
              <span>{brand.shortName}</span>
              <ChevronRight size={14} />
              <strong>{titles[location.pathname] || brand.name}</strong>
            </div>
          </div>
          <div className="toolbar-actions">
            <button
              aria-label="검색"
              className="search-trigger"
              type="button"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
              <span>검색</span>
              <kbd>
                {typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
                  ? '⌘ K'
                  : 'Ctrl K'}
              </kbd>
            </button>
            {location.pathname === '/' && (
              <div className="view-toggle" aria-label="홈 폴더 보기 방식">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => onViewMode('grid')}
                  aria-label="그리드 보기"
                >
                  <Grid2X2 />
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => onViewMode('list')}
                  aria-label="목록 보기"
                >
                  <List />
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
      <nav className="bottom-nav" aria-label="모바일 주요 메뉴">
        {navigation
          .filter(({ to }) => ['/', '/learning', '/jobs', '/coding'].includes(to))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              {...(to === '/learning' ? learningIntentProps : {})}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        <button type="button" onClick={() => setDrawer(true)} aria-label="더보기 메뉴">
          <MoreHorizontal />
          <span>더보기</span>
        </button>
      </nav>

      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="command-dialog" aria-describedby={undefined}>
            <Dialog.Title>전체 워크스페이스 검색</Dialog.Title>
            <label className="command-input">
              <Search />
              <span className="sr-only">검색어</span>
              <input
                role="combobox"
                aria-autocomplete="list"
                aria-controls="workspace-search-results"
                aria-expanded={searchOpen}
                aria-activedescendant={
                  flatResults[activeResult]
                    ? `search-option-${encodeURIComponent(searchItemKey(flatResults[activeResult].group, flatResults[activeResult]))}`
                    : undefined
                }
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    if (flatResults.length > 0)
                      setActiveResult((current) => Math.min(current + 1, flatResults.length - 1));
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (flatResults.length > 0)
                      setActiveResult((current) => Math.max(0, current - 1));
                  } else if (event.key === 'Enter' && flatResults[activeResult]) {
                    event.preventDefault();
                    openResult(flatResults[activeResult]);
                  }
                }}
                placeholder="폴더, 공고, 문제, 학습자료…"
              />
            </label>
            <div
              id="workspace-search-results"
              className="search-results"
              aria-live="polite"
              aria-label="검색 결과"
              role={flatResults.length > 0 ? 'listbox' : 'status'}
            >
              {query.length < 2 && recentSearches.length === 0 && <p>두 글자 이상 입력하세요.</p>}
              {query.length < 2 && recentSearches.length > 0 && (
                <section className="recent-searches" aria-label="최근 검색어">
                  <header>
                    <h3>최근 검색</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        try {
                          localStorage.removeItem(recentSearchKey);
                        } catch {
                          // Device history is optional.
                        }
                      }}
                    >
                      모두 지우기
                    </button>
                  </header>
                  {recentSearches.map((term) => (
                    <button key={term} type="button" onClick={() => setQuery(term)}>
                      {term}
                    </button>
                  ))}
                </section>
              )}
              {results.isFetching && <p>검색 중…</p>}
              {results.isError && <p className="error-text">검색 결과를 불러오지 못했습니다.</p>}
              {results.data && (
                <>
                  <div className="result-summary">{resultCount}개 결과</div>
                  {Object.entries(results.data).map(([group, items]) =>
                    Array.isArray(items) && items.length > 0 ? (
                      <section key={group} role="group" aria-label={group}>
                        <h3>{group}</h3>
                        {items.map((item, index) => {
                          const key = searchItemKey(group, item);
                          const activeKey = flatResults[activeResult]
                            ? searchItemKey(
                                flatResults[activeResult].group,
                                flatResults[activeResult],
                              )
                            : '';
                          return (
                            <button
                              id={`search-option-${encodeURIComponent(key)}`}
                              key={key || `${group}:${index}`}
                              role="option"
                              aria-selected={activeKey === key}
                              className={activeKey === key ? 'active' : ''}
                              onMouseEnter={() =>
                                setActiveResult(
                                  flatResults.findIndex(
                                    (result) => searchItemKey(result.group, result) === key,
                                  ),
                                )
                              }
                              onClick={() => openResult(item)}
                            >
                              {String(item.title || item.name || item.displayTitle || '검색 결과')}
                            </button>
                          );
                        })}
                      </section>
                    ) : null,
                  )}
                </>
              )}
            </div>
            <Dialog.Close className="dialog-close" aria-label="닫기">
              <X />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ApiStatusRegion />
    </div>
  );
}
