import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { TASK_STATUSES, formatTaskStatus } from '@htask/shared';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { selectClassName } from '@/lib/formStyles';

export interface TaskFilters {
  projectId: string;
  status: string;
  assigneeId: string;
  dueDateFrom: string;
  dueDateTo: string;
}

export const emptyTaskFilters: TaskFilters = {
  projectId: '',
  status: '',
  assigneeId: '',
  dueDateFrom: '',
  dueDateTo: '',
};

interface TaskFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TaskFilters;
  onApply: (filters: TaskFilters) => void;
  projects: Array<{ id: string; name: string; key: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
}

export function TaskFilterDialog({
  open,
  onOpenChange,
  filters,
  onApply,
  projects,
  users,
}: TaskFilterDialogProps) {
  const [draft, setDraft] = useState<TaskFilters>(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  const selectClass = selectClassName;

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md max-h-[90vh] -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">
              Filter Tasks
              {activeCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({activeCount} active)
                </span>
              )}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Project</label>
              <select
                value={draft.projectId}
                onChange={(e) => setDraft((prev) => ({ ...prev, projectId: e.target.value }))}
                className={selectClass}
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <select
                value={draft.status}
                onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value }))}
                className={selectClass}
              >
                <option value="">All statuses</option>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatTaskStatus(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Team Member</label>
              <select
                value={draft.assigneeId}
                onChange={(e) => setDraft((prev) => ({ ...prev, assigneeId: e.target.value }))}
                className={selectClass}
              >
                <option value="">All members</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Due from</label>
                <Input
                  type="date"
                  value={draft.dueDateFrom}
                  onChange={(e) => setDraft((prev) => ({ ...prev, dueDateFrom: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Due to</label>
                <Input
                  type="date"
                  value={draft.dueDateTo}
                  onChange={(e) => setDraft((prev) => ({ ...prev, dueDateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 p-6 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(emptyTaskFilters);
                onApply(emptyTaskFilters);
                onOpenChange(false);
              }}
            >
              Clear all
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onApply(draft);
                  onOpenChange(false);
                }}
              >
                Apply filters
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function filtersFromSearchParams(params: URLSearchParams): TaskFilters {
  return {
    projectId: params.get('projectId') ?? '',
    status: params.get('status') ?? '',
    assigneeId: params.get('assigneeId') ?? '',
    dueDateFrom: params.get('dueDateFrom') ?? '',
    dueDateTo: params.get('dueDateTo') ?? '',
  };
}

export function searchParamsFromFilters(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.projectId) params.set('projectId', filters.projectId);
  if (filters.status) params.set('status', filters.status);
  if (filters.assigneeId) params.set('assigneeId', filters.assigneeId);
  if (filters.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom);
  if (filters.dueDateTo) params.set('dueDateTo', filters.dueDateTo);
  return params;
}

export function buildTaskListParams(
  search: string,
  filters: TaskFilters,
  page = 1,
  limit = 50,
): Record<string, string | number> {
  return {
    search,
    page,
    limit,
    ...(filters.projectId && { projectId: filters.projectId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
    ...(filters.dueDateFrom && { dueDateFrom: filters.dueDateFrom }),
    ...(filters.dueDateTo && { dueDateTo: filters.dueDateTo }),
  };
}
