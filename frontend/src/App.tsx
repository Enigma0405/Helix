import React from "react";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

// Import Layouts
import { AppShell } from "@/components/layout/AppShell";

// Import Pages
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { InvestigationsPage } from "@/pages/InvestigationsPage";
import { InvestigationDetailPage } from "@/pages/InvestigationDetailPage";
import { EvidenceViewerPage } from "@/pages/EvidenceViewerPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { LandingPage } from "@/pages/LandingPage";
import { MyWorkPage } from "@/pages/MyWorkPage";
import { KnowledgePage } from "@/pages/KnowledgePage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";

import { ToastContainer } from "@/components/ui/ToastContainer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component that redirects to login if unauthenticated
const ProtectedLayout: React.FC = () => {
  const token = useAuthStore((s) => s.token);
  return token ? (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Guard component for full-screen viewer pages (no AppShell)
const ProtectedViewerLayout: React.FC = () => {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: "/app",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "investigations", element: <InvestigationsPage /> },
      { path: "investigations/:id", element: <InvestigationDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "my-work", element: <MyWorkPage /> },
      { path: "knowledge", element: <KnowledgePage /> },
      { path: "analytics", element: <AnalyticsPage /> },
    ],
  },
  {
    path: "/app",
    element: <ProtectedViewerLayout />,
    children: [
      { path: "investigations/:id/evidence/:evidenceId", element: <EvidenceViewerPage /> },
    ],
  },
  // Catch-all: send unknown routes to landing (not login, to avoid redirect loops)
  { path: "*", element: <Navigate to="/" replace /> },
]);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer />
    </QueryClientProvider>
  );
};

export default App;
