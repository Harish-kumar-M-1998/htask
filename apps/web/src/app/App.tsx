import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { AppLayout } from '@/shared/layouts/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { PageLoader } from '@/shared/components/PageLoader';
import { isPathAllowedForTeamMember, isTeamMemberOnly } from '@/lib/auth';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })));
const TeamPage = lazy(() => import('@/pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const MemberPerformancePage = lazy(() =>
  import('@/pages/MemberPerformancePage').then((m) => ({ default: m.MemberPerformancePage })),
);
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const AuditPage = lazy(() => import('@/pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const SettingsLayout = lazy(() => import('@/pages/settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout })));
const GeneralSettingsPage = lazy(() =>
  import('@/pages/settings/GeneralSettingsPage').then((m) => ({ default: m.GeneralSettingsPage })),
);
const AppearanceSettingsPage = lazy(() =>
  import('@/pages/settings/AppearanceSettingsPage').then((m) => ({ default: m.AppearanceSettingsPage })),
);
const NotificationsSettingsPage = lazy(() =>
  import('@/pages/settings/NotificationsSettingsPage').then((m) => ({ default: m.NotificationsSettingsPage })),
);
const RolesSettingsPage = lazy(() =>
  import('@/pages/settings/RolesSettingsPage').then((m) => ({ default: m.RolesSettingsPage })),
);
const WorkflowSettingsPage = lazy(() =>
  import('@/pages/settings/WorkflowSettingsPage').then((m) => ({ default: m.WorkflowSettingsPage })),
);
const SecuritySettingsPage = lazy(() =>
  import('@/pages/settings/SecuritySettingsPage').then((m) => ({ default: m.SecuritySettingsPage })),
);
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function TeamMemberRouteGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (isTeamMemberOnly(user) && !isPathAllowedForTeamMember(location.pathname)) {
    return <Navigate to="/tasks" replace />;
  }

  return <>{children}</>;
}

function HomePage() {
  const user = useAuthStore((s) => s.user);
  if (isTeamMemberOnly(user)) {
    return <Navigate to="/tasks" replace />;
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardPage />
    </Suspense>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <TeamMemberRouteGuard>
                    <AppLayout />
                  </TeamMemberRouteGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route
                path="tasks"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TasksPage />
                  </Suspense>
                }
              />
              <Route
                path="tasks/:id"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TaskDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="projects"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProjectsPage />
                  </Suspense>
                }
              />
              <Route
                path="projects/:id"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProjectDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="team"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TeamPage />
                  </Suspense>
                }
              />
              <Route
                path="team/:id/performance"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MemberPerformancePage />
                  </Suspense>
                }
              />
              <Route
                path="reports"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ReportsPage />
                  </Suspense>
                }
              />
              <Route
                path="audit"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AuditPage />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SettingsLayout />
                  </Suspense>
                }
              >
                <Route
                  path="general"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <GeneralSettingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="appearance"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <AppearanceSettingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <NotificationsSettingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="workflow"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <WorkflowSettingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="security"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <SecuritySettingsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="roles"
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <RolesSettingsPage />
                    </Suspense>
                  }
                />
              </Route>
              <Route path="settings/email" element={<Navigate to="/settings/notifications" replace />} />
              <Route
                path="search"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SearchPage />
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage />
                  </Suspense>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
