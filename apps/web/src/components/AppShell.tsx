import { useEffect, useState, type PropsWithChildren } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Code2,
  FolderKanban,
  GraduationCap,
  Menu,
  Star,
  X,
} from 'lucide-react';
import { brand, productLinks } from '@careerground/config';
import { ApiStatusRegion } from './ApiStatusRegion';
import '../styles/shell.css';

const navigation = [
  { to: '/', label: '채용공고', icon: CalendarDays },
  { to: '/coding', label: '코딩테스트', icon: Code2 },
  { href: productLinks.certificationLearning, label: '자격증', icon: GraduationCap },
  { to: '/favorites', label: '즐겨찾기', icon: Star },
] as const;

const titles: Record<string, string> = {
  '/': '채용 캘린더',
  '/coding': '코딩테스트',
  '/favorites': '즐겨찾기',
};

function NavigationItems() {
  return (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        if ('href' in item) {
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`${item.label} 새 창에서 열기`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </a>
          );
        }
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [location.pathname]);

  const nav = (
    <>
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          <FolderKanban size={20} />
        </div>
        <div>
          <strong>{brand.name}</strong>
          <span>Career workspace</span>
        </div>
      </div>
      <nav className="side-nav" aria-label="주요 메뉴">
        <NavigationItems />
      </nav>
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
      <main className={`workspace ${location.pathname === '/' ? 'workspace-calendar' : ''}`}>
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
        </header>
        <div className="page-content">{children}</div>
      </main>
      <nav className="bottom-nav" aria-label="모바일 주요 메뉴">
        <NavigationItems />
      </nav>
      <ApiStatusRegion />
    </div>
  );
}
