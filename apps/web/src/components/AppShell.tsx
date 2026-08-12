import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Code2,
  FolderKanban,
  FileText,
  Grid2X2,
  Home,
  List,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { brand } from '@careerground/config';
import { useAuth } from '../auth';
import { api } from '../lib/api';

const navigation = [
  { to: '/', label: '홈', icon: Home },
  { to: '/learning', label: '학습', icon: BookOpen },
  { to: '/notes', label: '노트', icon: FileText },
  { to: '/jobs', label: '채용공고', icon: BriefcaseBusiness },
  { to: '/coding', label: '코딩테스트', icon: Code2 },
  { to: '/solutions', label: '공유 풀이', icon: Users },
  { to: '/rankings', label: '랭킹', icon: Trophy },
  { to: '/notifications', label: '알림', icon: Bell },
] as const;

const titles: Record<string, string> = {
  '/': '나의 작업대',
  '/learning': '학습 라이브러리',
  '/notes': '개인 노트',
  '/jobs': '신입 IT 채용공고',
  '/coding': '코딩테스트',
  '/solutions': '공유 풀이',
  '/rankings': '랭킹',
  '/notifications': '알림',
  '/admin': '관리자 센터',
  '/settings': '설정',
};

export type ViewMode = 'grid' | 'list';

export function AppShell({
  children,
  viewMode,
  onViewMode,
}: PropsWithChildren<{ viewMode: ViewMode; onViewMode: (mode: ViewMode) => void }>) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = useQuery({
    queryKey: ['search', query],
    queryFn: () =>
      api<Record<string, Array<Record<string, unknown>>>>(`/search?q=${encodeURIComponent(query)}`),
    enabled: searchOpen && query.trim().length >= 2,
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
        <span className="side-nav-label">나의 작업대</span>
        {navigation.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <span className="side-nav-label">함께 성장</span>
        {navigation.slice(4, 7).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        <span className="side-nav-label">소식과 관리</span>
        {navigation.slice(7).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            <ShieldCheck size={18} />
            <span>관리자</span>
          </NavLink>
        )}
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Settings size={18} />
          <span>설정</span>
        </NavLink>
      </nav>
      <div className="sidebar-profile">
        <div className="avatar" aria-hidden="true">
          {user?.displayName.slice(0, 1)}
        </div>
        <div>
          <strong>{user?.displayName}</strong>
          <span>{user?.role}</span>
        </div>
        <button type="button" onClick={() => void logout()} aria-label="로그아웃">
          나가기
        </button>
      </div>
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
              <strong>{titles[location.pathname] || 'CareerGround'}</strong>
            </div>
          </div>
          <div className="toolbar-actions">
            <button className="search-trigger" type="button" onClick={() => setSearchOpen(true)}>
              <Search size={17} />
              <span>검색</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="view-toggle" aria-label="보기 방식">
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
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
      <nav className="bottom-nav" aria-label="모바일 주요 메뉴">
        {navigation
          .filter(({ to }) => to !== '/notes')
          .slice(0, 5)
          .map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
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
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="폴더, 공고, 문제, 풀이, 학습자료…"
              />
            </label>
            <div className="search-results" aria-live="polite">
              {query.length < 2 && <p>두 글자 이상 입력하세요.</p>}
              {results.isFetching && <p>검색 중…</p>}
              {results.isError && <p className="error-text">검색 결과를 불러오지 못했습니다.</p>}
              {results.data && (
                <>
                  <div className="result-summary">{resultCount}개 결과</div>
                  {Object.entries(results.data).map(([group, items]) =>
                    Array.isArray(items) && items.length > 0 ? (
                      <section key={group}>
                        <h3>{group}</h3>
                        {items.slice(0, 5).map((item, index) => (
                          <button
                            key={String(item.id || index)}
                            onClick={() => setSearchOpen(false)}
                          >
                            {String(item.title || item.name || item.displayTitle || '검색 결과')}
                          </button>
                        ))}
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
    </div>
  );
}
