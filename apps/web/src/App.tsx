import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth';
import { AppShell, type ViewMode } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage })),
);
const CodingPage = lazy(() =>
  import('./pages/CodingPage').then((module) => ({ default: module.CodingPage })),
);
const SolutionsPage = lazy(() =>
  import('./pages/SolutionsPage').then((module) => ({ default: module.SolutionsPage })),
);
const JobsPage = lazy(() =>
  import('./pages/JobsPage').then((module) => ({ default: module.JobsPage })),
);
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
const NotesPage = lazy(() =>
  import('./pages/NotesPage').then((module) => ({ default: module.NotesPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
);

export function App() {
  const { user, loading } = useAuth();
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
  if (!user) return <LoginPage />;
  if (!user.onboardingCompleted) return <OnboardingPage />;
  return (
    <AppShell viewMode={viewMode} onViewMode={setViewMode}>
      <Suspense fallback={<div className="loading-panel">화면을 불러오는 중…</div>}>
        <Routes>
          <Route path="/" element={<HomePage viewMode={viewMode} />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/notes" element={<NotesPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
