import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatTaskStatus, PERMISSIONS } from '@htask/shared';
import { ArrowRight, Check, X } from 'lucide-react';
import { workflowsApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { KANBAN_COLUMNS } from '@/lib/kanbanColumns';
import { ROLE_LABELS, ROLE_ORDER } from '@/lib/rolePermissionMatrix';
import { WorkflowSettingsSkeleton } from '@/shared/components/skeletons/WorkflowSettingsSkeleton';
import { Button } from '@/shared/ui/button';
import { cn } from '@/lib/utils';

type WorkflowState = {
  id: string;
  status: string;
  name: string;
  category: string;
  sortOrder: number;
};

type WorkflowTransition = {
  id: string;
  fromStatus: string;
  toStatus: string;
  name: string;
  requiredRoles: string[];
  requiresApproval: boolean;
  isActive: boolean;
};

type WorkflowDetail = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  _count: { projects: number };
};

type WorkflowSummary = {
  id: string;
  name: string;
  isDefault: boolean;
};

function TransitionRow({
  workflowId,
  transition,
  canManage,
}: {
  workflowId: string;
  transition: WorkflowTransition;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(transition);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setDraft(transition);
  }, [transition]);

  const isDirty =
    draft.name !== transition.name ||
    draft.requiresApproval !== transition.requiresApproval ||
    draft.isActive !== transition.isActive ||
    draft.requiredRoles.length !== transition.requiredRoles.length ||
    draft.requiredRoles.some((r) => !transition.requiredRoles.includes(r));

  const saveMutation = useMutation({
    mutationFn: () =>
      workflowsApi
        .updateTransition(workflowId, transition.id, {
          name: draft.name,
          requiredRoles: draft.requiredRoles,
          requiresApproval: draft.requiresApproval,
          isActive: draft.isActive,
        })
        .then((r) => r.data.data as WorkflowTransition),
    onSuccess: (saved) => {
      setDraft(saved);
      setMessage('Saved');
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] });
      setTimeout(() => setMessage(''), 2000);
    },
    onError: () => setMessage('Failed to save'),
  });

  const toggleRole = (role: string) => {
    setDraft((prev) => {
      const has = prev.requiredRoles.includes(role);
      const next = has
        ? prev.requiredRoles.filter((r) => r !== role)
        : [...prev.requiredRoles, role];
      return { ...prev, requiredRoles: next.length ? next : prev.requiredRoles };
    });
  };

  return (
    <tr
      className={cn(
        'border-b border-border/60',
        !draft.isActive && 'opacity-60',
        canManage && 'hover:bg-accent/30',
      )}
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-sm min-w-[140px]">
          <span className="font-medium">{formatTaskStatus(draft.fromStatus)}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{formatTaskStatus(draft.toStatus)}</span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        {canManage ? (
          <input
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            className="w-full min-w-[120px] rounded-md border border-border bg-background px-2 py-1 text-sm"
          />
        ) : (
          <span className="text-sm">{draft.name}</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {ROLE_ORDER.map((role) => {
            const active = draft.requiredRoles.includes(role);
            if (!canManage) {
              return active ? (
                <span
                  key={role}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {ROLE_LABELS[role]}
                </span>
              ) : null;
            }
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-medium border transition-fast',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40',
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-2.5 text-center">
        {canManage ? (
          <input
            type="checkbox"
            checked={draft.requiresApproval}
            onChange={(e) => setDraft((p) => ({ ...p, requiresApproval: e.target.checked }))}
            className="h-4 w-4 accent-primary"
          />
        ) : draft.requiresApproval ? (
          <Check className="h-4 w-4 text-emerald-600 mx-auto" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
        )}
      </td>
      <td className="px-3 py-2.5 text-center">
        {canManage ? (
          <button
            type="button"
            role="switch"
            aria-checked={draft.isActive}
            onClick={() => setDraft((p) => ({ ...p, isActive: !p.isActive }))}
            className={cn(
              'relative h-6 w-11 rounded-full border transition mx-auto',
              draft.isActive ? 'border-primary bg-primary' : 'border-border bg-muted',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition',
                draft.isActive ? 'left-5' : 'left-0.5',
              )}
            />
          </button>
        ) : draft.isActive ? (
          <Check className="h-4 w-4 text-emerald-600 mx-auto" />
        ) : (
          <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        {canManage && (
          <div className="flex items-center justify-end gap-2">
            {message && <span className="text-[10px] text-muted-foreground">{message}</span>}
            <Button
              size="sm"
              variant="outline"
              disabled={!isDirty || saveMutation.isPending || draft.requiredRoles.length === 0}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? '…' : 'Save'}
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

export function WorkflowSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = permissions.includes(PERMISSIONS.WORKFLOW_MANAGE);

  const { data: workflows, isLoading: listLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data as WorkflowSummary[]),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const workflowId = selectedId ?? workflows?.[0]?.id ?? null;

  const { data: workflow, isLoading: detailLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowsApi.get(workflowId!).then((r) => r.data.data as WorkflowDetail),
    enabled: Boolean(workflowId),
  });

  const statesByColumn = useMemo(() => {
    if (!workflow) return [];
    const statusSet = new Set(workflow.states.map((s) => s.status));
    return KANBAN_COLUMNS.map((column) => ({
      ...column,
      states: workflow.states.filter((s) => column.statuses.includes(s.status)),
      activeCount: column.statuses.filter((s) => statusSet.has(s)).length,
    }));
  }, [workflow]);

  if (listLoading || detailLoading || !workflow) {
    return <WorkflowSettingsSkeleton />;
  }

  const activeTransitions = workflow.transitions.filter((t) => t.isActive).length;

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Workflow</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure task status transitions used by the Kanban board and pipeline.
          </p>
        </div>
        {workflows && workflows.length > 1 && (
          <select
            value={workflowId ?? ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm min-w-[200px]"
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
                {wf.isDefault ? ' (default)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      <section className="dashboard-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{workflow.name}</h3>
            {workflow.description && (
              <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {workflow.isDefault && (
              <span className="rounded-full pill-brand px-2.5 py-1 text-xs font-semibold">
                Default workflow
              </span>
            )}
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {workflow._count.projects} project{workflow._count.projects === 1 ? '' : 's'}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {activeTransitions}/{workflow.transitions.length} transitions active
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-card p-5">
        <h3 className="text-sm font-semibold mb-1">Kanban column mapping</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Statuses grouped into board columns. Drag-and-drop rules follow the transitions below.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statesByColumn.map((column) => (
            <div
              key={column.id}
              className={cn('rounded-lg border border-border p-3 border-t-4', column.accent)}
            >
              <p className="text-sm font-semibold">{column.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {column.activeCount} status{column.activeCount === 1 ? '' : 'es'}
              </p>
              <ul className="mt-2 space-y-0.5">
                {column.states.map((state) => (
                  <li key={state.id} className="text-xs text-muted-foreground">
                    {formatTaskStatus(state.status)}
                  </li>
                ))}
                {column.states.length === 0 && (
                  <li className="text-xs text-muted-foreground/60 italic">No statuses</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Transitions</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {canManage
                ? 'Toggle transitions, roles, and approval requirements. Changes apply to all projects using this workflow.'
                : 'Read-only view of allowed status moves and role requirements.'}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="text-left px-3 py-2.5">Path</th>
                <th className="text-left px-3 py-2.5">Label</th>
                <th className="text-left px-3 py-2.5">Required roles</th>
                <th className="text-center px-3 py-2.5 w-24">Approval</th>
                <th className="text-center px-3 py-2.5 w-20">Active</th>
                <th className="text-right px-3 py-2.5 w-28" />
              </tr>
            </thead>
            <tbody>
              {workflow.transitions.map((transition) => (
                <TransitionRow
                  key={transition.id}
                  workflowId={workflow.id}
                  transition={transition}
                  canManage={canManage}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!canManage && (
        <p className="text-xs text-muted-foreground">
          Contact a manager to change workflow rules. You have read-only access.
        </p>
      )}
    </div>
  );
}
