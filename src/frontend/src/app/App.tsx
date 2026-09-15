import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { Homepage } from '@/features/homepage/Homepage';
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
      <BrowserRouter>
        <Routes>
          {/* Marketing / Homepage — no shell */}
          <Route path="/home" element={<Homepage />} />

          {/* Application shell */}
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="monitoring" element={<PortMonitoringPage />} />
            <Route path="planner" element={<PlannerPage />} />
            <Route path="predictions" element={<PredictionsPage />} />
            <Route path="hotspots" element={<HotspotsPage />} />
            <Route path="optimisation" element={<OptimizationPage />} />
            <Route path="simulation" element={<SimulationPage />} />
            <Route path="bob" element={<BobAssistantPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
