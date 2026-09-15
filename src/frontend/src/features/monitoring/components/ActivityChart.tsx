import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { ActivityDataPoint } from '@/types/monitoring';
import { ChartSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-[#d1e0ea] rounded-sm px-3 py-2 text-xs shadow-lg">
      <p className="text-[#6b8899] mb-1.5 font-mono">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: entry.color }} />
          <span className="text-[#6b8899]">{entry.name}:</span>
          <span className="text-[#0d1f2d] font-semibold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

interface ActivityChartProps {
  data: ActivityDataPoint[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ActivityChart({ data, isLoading, isError, onRetry }: ActivityChartProps) {
  if (isLoading) return <ChartSkeleton className="h-full" />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (data.length === 0) return <EmptyState message="No activity history is available." />;

  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="w-full h-full" aria-label="Arrivals vs departures chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1e0ea" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#6b8899' }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b8899' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="arrivals" name="Arrivals" fill="#0d1f2d" radius={[2, 2, 0, 0]} />
          <Bar dataKey="departures" name="Departures" fill="#00b4a6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
