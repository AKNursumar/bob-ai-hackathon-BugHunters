import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '@/services/api/dashboardApi';
import type { DashboardSummary } from '@/types';

export const DASHBOARD_QUERY_KEY = ['dashboard', 'summary'] as const;

/** Refresh every 60 seconds while window is focused */
const REFETCH_INTERVAL_MS = 60_000;

export function useDashboardSummary() {
  return useQuery<DashboardSummary, Error>({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardSummary,
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: 30_000,
  });
}
