import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { CongestionTrendPoint } from '@/types';
import { ErrorState } from '@/components/ErrorState';
import { ChartSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

interface CongestionTrendChartProps {
  data: CongestionTrendPoint[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function formatXAxisLabel(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

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
      <p className="text-[#6b8899] mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-[#6b8899]">{entry.name}:</span>
          <span className="text-[#0d1f2d] font-semibold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function CongestionTrendChart({
  data,
  isLoading,
  isError,
  onRetry,
}: CongestionTrendChartProps) {
  if (isLoading) return <ChartSkeleton className="h-full" />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (data.length === 0) return <EmptyState message="No trend data available." />;

  return (
    <div className="w-full h-full" aria-label="Congestion trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="congestionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d1f2d" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#0d1f2d" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="berthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00b4a6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00b4a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1e0ea" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxisLabel}
            tick={{ fontSize: 10, fill: '#6b8899' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#6b8899' }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="berthUtilisation"
            name="Berth Util. %"
            stroke="#00b4a6"
            strokeWidth={1.5}
            fill="url(#berthGradient)"
            dot={false}
            activeDot={{ r: 3, fill: '#00b4a6' }}
          />
          <Area
            type="monotone"
            dataKey="congestionIndex"
            name="Congestion Index"
            stroke="#0d1f2d"
            strokeWidth={1.5}
            fill="url(#congestionGradient)"
            dot={false}
            activeDot={{ r: 3, fill: '#0d1f2d' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
