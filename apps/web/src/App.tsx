import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router';
import { AppShell, type ViewMode } from './components/AppShell';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const CodingPage = lazy(() =>
  import('./pages/CodingPage').then((module) => ({ default: module.CodingPage })),
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
let learningPagePromise:
  Promise<{ default: typeof import('./pages/LearningPage').LearningPage }> | undefined;
export const preloadLearningPage = () => {
  learningPagePromise ??= import('./pages/LearningPage')
    .then((module) => ({ default: module.LearningPage }))
    .catch((error) => {
      learningPagePromise = undefined;
      throw error;
    });
  return learningPagePromise;
};
const LearningPage = lazy(preloadLearningPage);
export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    localStorage.getItem('cg-view') === 'list' ? 'list' : 'grid',
  );
  useEffect(() => localStorage.setItem('cg-view', viewMode), [viewMode]);
  return (
    <AppErrorBoundary>
      <AppShell viewMode={viewMode} onViewMode={setViewMode}>
        <Suspense fallback={<div className="loading-panel">화면을 불러오는 중…</div>}>
          <Routes>
            <Route path="/" element={<HomePage viewMode={viewMode} />} />
            <Route path="/learning" element={<LearningPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/coding" element={<CodingPage />} />
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
