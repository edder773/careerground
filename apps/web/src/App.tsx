import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth';
import { AppShell, type ViewMode } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const CodingPage = lazy(() =>
  import('./pages/CodingPage').then((module) => ({ default: module.CodingPage })),
);
const SolutionsPage = lazy(() =>
  import('./pages/SolutionsPage').then((module) => ({ default: module.SolutionsPage })),
);
let jobsPagePromise: Promise<{ default: typeof import('./pages/JobsPage').JobsPage }> | undefined;
export const preloadJobsPage = () => {
  jobsPagePromise ??= import('./pages/JobsPage')
    .then((module) => ({ default: module.JobsPage }))
    .catch((error) => {
      jobsPagePromise = undefined;
      throw error;
    });
  return jobsPagePromise;
};
const JobsPage = lazy(preloadJobsPage);
const LearningPage = lazy(() =>
  import('./pages/LearningPage').then((module) => ({ default: module.LearningPage })),
);
const RankingPage = lazy(() =>
  import('./pages/RankingPage').then((module) => ({ default: module.RankingPage })),
);
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })),
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);

export function App() {
  const { user, loading, error, retry } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    localStorage.getItem('cg-view') === 'list' ? 'list' : 'grid',
  );
  useEffect(() => localStorage.setItem('cg-view', viewMode), [viewMode]);
  if (loading)
    return (
      <div className="app-loading">
        <div className="brand-mark">CG</div>
        <span>작업대를 준비하는 중…</span>
      </div>
    );
  if (error)
    return (
      <div className="fatal-error" role="alert">
        <h1>작업대를 불러오지 못했습니다</h1>
        <p>{error.message}</p>
        {error.requestId && <code>요청 ID: {error.requestId}</code>}
        <button onClick={retry}>다시 시도</button>
      </div>
    );
  if (!user) return <LoginPage />;
  if (!user.onboardingCompleted) return <OnboardingPage />;
  return (
    <AppErrorBoundary>
      <AppShell viewMode={viewMode} onViewMode={setViewMode}>
        <Suspense fallback={<div className="loading-panel">화면을 불러오는 중…</div>}>
          <Routes>
            <Route path="/" element={<HomePage viewMode={viewMode} />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/coding" element={<CodingPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
            <Route path="/rankings" element={<RankingPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/admin"
              element={user.role === 'ADMIN' ? <AdminPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="*"
              element={
                <section className="empty-panel">
                  <h1>페이지를 찾을 수 없습니다</h1>
                  <p>주소가 바뀌었거나 삭제된 화면입니다.</p>
                  <Link to="/">홈으로 돌아가기</Link>
                </section>
              }
            />
          </Routes>
        </Suspense>
      </AppShell>
    </AppErrorBoundary>
  );
}
