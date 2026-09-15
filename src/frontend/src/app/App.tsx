import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Homepage } from '@/features/homepage/Homepage';
import { AuthPage } from '@/features/auth/AuthPage';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { PortMonitoringPage } from '@/features/monitoring/pages/PortMonitoringPage';
import { PlannerPage } from '@/features/planner/PlannerPage';
import { OptimizationPage } from '@/features/optimization/OptimizationPage';
import { PredictionsPage } from '@/features/predictions/PredictionsPage';
import { SimulationPage } from '@/features/simulation/SimulationPage';
import { BobAssistantPage } from '@/features/bob/BobAssistantPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { AlertsPage } from '@/features/alerts/AlertsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { HotspotsPage } from '@/features/hotspots/HotspotsPage';

import { PortProvider } from '@/contexts/PortContext';
import { AuthProvider } from '@/contexts/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <PortProvider>
        <BrowserRouter>
        <Routes>
          {/* Public / Landing Page */}
          <Route path="/" element={<Homepage />} />

          {/* Auth */}
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />

          {/* Protected Application routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/monitoring" element={<PortMonitoringPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/hotspots" element={<HotspotsPage />} />
              <Route path="/optimization" element={<OptimizationPage />} />
              <Route path="/simulation" element={<SimulationPage />} />
              <Route path="/bob" element={<BobAssistantPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              {/* Fallback inside authenticated shell */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </PortProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
