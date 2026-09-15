import { useQuery } from '@tanstack/react-query';
import { fetchMonitoringData, MONITORING_STALE_THRESHOLD_MS } from '@/services/api/monitoringService';
import type { MonitoringData } from '@/types/monitoring';

export const MONITORING_QUERY_KEY = ['monitoring', 'data'] as const;

export function useMonitoringData() {
  return useQuery<MonitoringData, Error>({
    queryKey: MONITORING_QUERY_KEY,
    queryFn: fetchMonitoringData,
    staleTime: MONITORING_STALE_THRESHOLD_MS,
  });
}
