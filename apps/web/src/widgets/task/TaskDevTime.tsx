import { Clock } from 'lucide-react';
import { formatTaskStatus } from '@htask/shared';
import { cn } from '@/lib/utils';
import {
  compareDevTimeWithEta,
  computeDevDuration,
  formatDurationHours,
  type TaskHistoryEntry,
} from '@/lib/taskMetrics';

const TONE_STYLES = {
  good: 'text-primary bg-primary/10',
  warn: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  bad: 'text-red-600 dark:text-red-400 bg-red-500/10',
  neutral: 'text-muted-foreground bg-muted',
} as const;

interface TaskDevTimeProps {
  history: TaskHistoryEntry[];
  currentStatus: string;
  estimatedHours?: number | null;
}

export function TaskDevTime({ history, currentStatus, estimatedHours }: TaskDevTimeProps) {
  const devDuration = computeDevDuration(history, currentStatus);
  const comparison = devDuration.durationHours != null
    ? compareDevTimeWithEta(devDuration.durationHours, estimatedHours, devDuration.phase)
    : null;

  const progressPercent = comparison?.percentOfEta != null
    ? Math.min(comparison.percentOfEta, 100)
    : 0;

  return (
    <div className="dashboard-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Development time</h2>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {formatTaskStatus('IN_PROGRESS')} → {formatTaskStatus('DEVELOPMENT_COMPLETE')}
      </p>

      {devDuration.phase === 'not_started' ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Development has not started yet.</p>
          {estimatedHours != null && (
            <p className="text-sm">
              <span className="text-muted-foreground">ETA: </span>
              <span className="font-medium">{estimatedHours}h</span>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                {devDuration.phase === 'completed' ? 'Actual' : 'Elapsed'}
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatDurationHours(devDuration.durationHours ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">ETA</p>
              <p className="text-lg font-semibold tabular-nums">
                {estimatedHours != null ? `${estimatedHours}h` : '—'}
              </p>
            </div>
          </div>

          {comparison && estimatedHours != null && (
            <>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    comparison.tone === 'good' && 'progress-brand',
                    comparison.tone === 'warn' && 'bg-amber-500',
                    comparison.tone === 'bad' && 'bg-red-500',
                    comparison.tone === 'neutral' && 'bg-muted-foreground/40',
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span
                  className={cn(
                    'inline-flex rounded-md px-2 py-0.5 font-medium',
                    TONE_STYLES[comparison.tone],
                  )}
                >
                  {comparison.label}
                </span>
                {comparison.percentOfEta != null && (
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round(comparison.percentOfEta)}% of ETA
                  </span>
                )}
              </div>
            </>
          )}

          {devDuration.startedAt && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/60">
              Started {devDuration.startedAt.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {devDuration.completedAt && (
                <>
                  {' · '}
                  Completed {devDuration.completedAt.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
