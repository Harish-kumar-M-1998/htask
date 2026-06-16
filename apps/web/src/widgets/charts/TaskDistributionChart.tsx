import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatTaskStatus } from '@htask/shared';

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: '#3b82f6',
  ARCHIVED: '#8b5cf6',
  OPEN: '#6366f1',
  ASSIGNED: '#a78bfa',
  CLOSED: '#94a3b8',
  QA_TESTING: '#f59e0b',
  DRAFT: '#cbd5e1',
};

const FALLBACK_COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#a78bfa', '#f59e0b', '#94a3b8'];

interface Props {
  data: Array<{ status: string; count: number }>;
}

export function TaskDistributionChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-16">No data available</p>;
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: formatTaskStatus(d.status),
    status: d.status,
    value: d.count,
  }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative w-[200px] h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-4">
        {chartData.map((entry, i) => {
          const color = STATUS_COLORS[entry.status] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const pct = total > 0 ? (entry.value / total) * 100 : 0;
          return (
            <div key={entry.status} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">{entry.value}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
