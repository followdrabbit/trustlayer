/**
 * Application Router
 * Handles dynamic routing based on registered modules
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ModuleLoader } from '../modules/ModuleLoader';
import type { ModuleRoute } from '../modules/types';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { MainLayout } from '@/components/layout';

// Core pages that are always available
const Login = React.lazy(() => import('@/pages/Login'));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const Profile = React.lazy(() => import('@/pages/Profile'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const AdminConsole = React.lazy(() => import('@/pages/AdminConsole'));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage'));
const AuditLogsPage = React.lazy(() => import('@/pages/AuditLogsPage'));
const Home = React.lazy(() => import('@/pages/Home'));

/**
 * Loading fallback component
 */
const Loading: React.FC = () => (
  <div className="flex items-center justify-center h-screen w-full bg-background text-foreground">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <div className="text-lg text-muted-foreground">Loading TrustLayer...</div>
    </div>
  </div>
);

/**
 * Layout wrapper for authenticated pages
 */
const AuthenticatedLayout: React.FC = () => (
  <MainLayout>
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  </MainLayout>
);

/**
 * Main Application Router
 */
export const AppRouter: React.FC = () => {
  const routes = ModuleLoader.getRoutes();

  return (
    <ThemeProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes with layout */}
          <Route element={<AuthenticatedLayout />}>
            {/* Core protected routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminConsole />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />

            {/* Dynamic Module Routes */}
            {routes.map((route: ModuleRoute) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Suspense fallback={<Loading />}>
                    <route.component />
                  </Suspense>
                }
              />
            ))}
          </Route>

          {/* Global 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
};

export default AppRouter;
