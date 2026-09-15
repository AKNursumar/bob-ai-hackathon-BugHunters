/**
 * API service boundary for the port monitoring module.
 *
 * Connects to live FastAPI backend with automatic fallback to mock data.
 */
import {
  fetchMonitoringData as fetchMockMonitoring,
  MONITORING_STALE_THRESHOLD_MS,
} from '@/services/mock/monitoringMockService';
import type { MonitoringData } from '@/types';

export { MONITORING_STALE_THRESHOLD_MS };

export async function fetchMonitoringData(): Promise<MonitoringData> {
  try {
    const res = await fetch('/api/v1/monitoring');
    if (res.ok) {
      const data = await res.json();
      // Backend currently returns empty vessels/berths arrays; fall back to
      // mock data so the monitoring page always shows meaningful detail rows.
      const hasVessels = Array.isArray(data.vessels) && data.vessels.length > 0;
      const hasBerths = Array.isArray(data.berths) && data.berths.length > 0;
      if (hasVessels && hasBerths) {
        return data as MonitoringData;
      }
      // Merge live summary stats with mock vessel/berth detail rows
      if (data.summary) {
        const mock = await fetchMockMonitoring();
        return {
          ...mock,
          summary: {
            ...mock.summary,
            activeVessels: data.summary.activeVessels ?? mock.summary.activeVessels,
            waitingVessels: data.summary.waitingVessels ?? mock.summary.waitingVessels,
            berthUtilisation: data.summary.berthUtilisation ?? mock.summary.berthUtilisation,
            lastUpdated: data.summary.lastUpdated ?? mock.summary.lastUpdated,
          },
        };
      }
    }
  } catch (error) {
    console.warn('Backend API unavailable, using fallback monitoring data:', error);
  }
  return fetchMockMonitoring();
}
