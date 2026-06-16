import { TASK_STATUSES, formatTaskStatus } from '@htask/shared';
import { Archive, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PIPELINE_MILESTONES = [
  'ASSIGNED',
  'IN_PROGRESS',
  'DEVELOPMENT_COMPLETE',
  'MR_APPROVED',
  'STAGE_VERIFIED',
  'QA_PASSED',
  'DEPLOYED',
  'CLOSED',
  'ARCHIVED',
] as const;

function statusIndex(status: string): number {
  const idx = TASK_STATUSES.indexOf(status as (typeof TASK_STATUSES)[number]);
  return idx >= 0 ? idx : 0;
}

function isTerminal(status: string): boolean {
  return status === 'ARCHIVED' || status === 'CLOSED';
}

interface TaskPipelineProps {
  currentStatus: string;
}

export function TaskPipeline({ currentStatus }: TaskPipelineProps) {
  const currentIdx = statusIndex(currentStatus);
  const completedCount = PIPELINE_MILESTONES.filter(
    (status) => currentIdx >= statusIndex(status),
  ).length;
  const terminal = isTerminal(currentStatus);

  return (
    <div className="dashboard-card p-5 shrink-0">
      <div className="flex items-center justify-between mb-5 gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pipeline position
        </p>
        <p className="text-xs font-medium text-emerald-500 dark:text-emerald-400 whitespace-nowrap">
          {completedCount} / {PIPELINE_MILESTONES.length} stages
          {terminal ? ' · terminal' : ''}
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex items-start min-w-max px-1">
          {PIPELINE_MILESTONES.map((status, i) => {
            const done = currentIdx >= statusIndex(status);
            const isLast = i === PIPELINE_MILESTONES.length - 1;
            const isCurrentTerminal = isLast && done && terminal;

            return (
              <div key={status} className="flex items-start flex-1 min-w-[72px] last:min-w-[56px] last:flex-none">
                <div className="flex flex-col items-center w-full">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 z-10',
                      isCurrentTerminal
                        ? 'border-foreground bg-foreground text-background'
                        : done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-border bg-card text-transparent',
                    )}
                  >
                    {isCurrentTerminal ? (
                      <Archive className="h-3.5 w-3.5" />
                    ) : done ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-[9px] font-medium text-muted-foreground text-center leading-tight px-0.5">
                    {formatTaskStatus(status)}
                  </p>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mt-3.5 min-w-[8px] -mx-1',
                      currentIdx >= statusIndex(PIPELINE_MILESTONES[i + 1])
                        ? 'bg-emerald-500'
                        : done
                          ? 'bg-emerald-500'
                          : 'bg-border',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
