/**
 * API service boundary for the port monitoring module.
 *
 * Connects to live FastAPI backend.
 */
import { fetchMonitoringData as fetchMockMonitoring, MONITORING_STALE_THRESHOLD_MS } from '@/services/mock/monitoringMockService';
import type { MonitoringData } from '@/types';

export { MONITORING_STALE_THRESHOLD_MS };

export async function fetchMonitoringData(portId: string = 'port776'): Promise<MonitoringData> {
  const url = `/api/v1/monitoring?port_id=${portId}`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const hasVessels = Array.isArray(data.vessels) && data.vessels.length > 0;
      const hasActivity = Array.isArray(data.activityHistory) && data.activityHistory.length > 0;
      
      // If we genuinely have live vessels and activity, return it.
      if (hasVessels && hasActivity) {
        return data as MonitoringData;
      }
      
      // Otherwise, AIS is too sparse right now for a good demo. We fall back to mock data 
      const mock = await fetchMockMonitoring();
      return {
        ...mock,
        isDemoData: true, // Flag to show in UI
        summary: {
          ...mock.summary,
          activeVessels: data.summary?.activeVessels || mock.summary.activeVessels,
          arrivals: data.summary?.arrivals || mock.summary.arrivals,
          departures: data.summary?.departures || mock.summary.departures,
          waitingVessels: data.summary?.waitingVessels || mock.summary.waitingVessels,
          berthUtilisation: data.summary?.berthUtilisation || mock.summary.berthUtilisation,
          lastUpdated: data.summary?.lastUpdated || mock.summary.lastUpdated,
        },
      } as MonitoringData & { isDemoData?: boolean };
    }
  } catch (error) {
    console.warn('Backend API unavailable, using fallback monitoring data:', error);
  }
  
  const mockFallback = await fetchMockMonitoring();
  return { ...mockFallback, isDemoData: true } as MonitoringData & { isDemoData?: boolean };
}
