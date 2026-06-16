import { BarChart3, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface Props {
  data: Array<{ user?: { firstName: string; lastName: string }; hours: number }>;
  onAssignTask?: () => void;
}

export function UtilizationChart({ data, onAssignTask }: Props) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 mb-4">
          <BarChart3 className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold mb-2">No data to show yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
          Assign tasks to your team and log time — once there&apos;s activity, you&apos;ll see
          who&apos;s busy and who has room.
        </p>
        <Button onClick={onAssignTask} className="rounded-lg">
          <Plus className="h-4 w-4" />
          Assign a task
        </Button>
      </div>
    );
  }

  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  return (
    <div className="space-y-4">
      {data.map((d) => {
        const name = d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Unknown';
        const pct = (d.hours / maxHours) * 100;
        return (
          <div key={name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground tabular-nums">{d.hours}h</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
