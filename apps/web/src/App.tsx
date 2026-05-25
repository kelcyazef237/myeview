import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "./stores/authStore";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AssetsPage from "./pages/AssetsPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import AttackPathsPage from "./pages/AttackPathsPage";
import RiskScoringPage from "./pages/RiskScoringPage";
import EnrichmentPage from "./pages/EnrichmentPage";
import CompliancePage from "./pages/CompliancePage";
import TLSIntelligencePage from "./pages/TLSIntelligencePage";
import ExecutiveReportPage from "./pages/ExecutiveReportPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";

/**
 * Protected route wrapper — redirects to login if not authenticated.
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isHydrated } = useAuthStore();

  // Wait for auth hydration from localStorage
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Root application component with routing.
 */
export default function App() {
  const { hydrate } = useAuthStore();

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/attack-paths" element={<AttackPathsPage />} />
          <Route path="/risks" element={<RiskScoringPage />} />
          <Route path="/enrichment" element={<EnrichmentPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/tls-intelligence" element={<TLSIntelligencePage />} />
          <Route path="/report" element={<ExecutiveReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
