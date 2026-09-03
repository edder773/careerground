import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { AppShell } from './components/AppShell';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const CodingPage = lazy(() =>
  import('./pages/CodingPage').then((module) => ({ default: module.CodingPage })),
);
const FavoritesPage = lazy(() =>
  import('./pages/FavoritesPage').then((module) => ({ default: module.FavoritesPage })),
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

function LegacyJobsRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}

export function App() {
  return (
    <AppErrorBoundary>
      <AppShell>
        <Suspense fallback={<div className="loading-panel">화면을 불러오는 중…</div>}>
          <Routes>
            <Route path="/" element={<JobsPage />} />
            <Route path="/coding" element={<CodingPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/jobs" element={<LegacyJobsRedirect />} />
            <Route path="/learning" element={<Navigate to="/" replace />} />
            <Route path="/solutions" element={<Navigate to="/coding" replace />} />
            <Route path="/rankings" element={<Navigate to="/coding" replace />} />
            <Route path="/notifications" element={<Navigate to="/" replace />} />
            <Route path="/settings" element={<Navigate to="/" replace />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route
              path="*"
              element={
                <section className="empty-panel">
                  <h1>페이지를 찾을 수 없습니다</h1>
                  <p>주소가 바뀌었거나 삭제된 화면입니다.</p>
                  <Link to="/">채용 캘린더로 돌아가기</Link>
                </section>
              }
            />
          </Routes>
        </Suspense>
      </AppShell>
    </AppErrorBoundary>
  );
}
