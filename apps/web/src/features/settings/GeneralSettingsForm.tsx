import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrganizationGeneralSettings } from '@htask/shared';
import { organizationApi, workflowsApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { setOrgSettings } from '@/lib/orgSettings';
import { selectClassName } from '@/lib/formStyles';
import { Skeleton } from '@/shared/ui/skeleton';

const TIMEZONE_OPTIONS = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const DATE_FORMAT_OPTIONS = [
  { value: 'MMM d, yyyy', label: 'Jan 15, 2026' },
  { value: 'dd/MM/yyyy', label: '15/01/2026' },
  { value: 'yyyy-MM-dd', label: '2026-01-15' },
] as const;

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

function GeneralSettingsSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function GeneralSettingsForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [general, setGeneral] = useState<OrganizationGeneralSettings | null>(null);
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () =>
      organizationApi.getCurrent().then(
        (r) => r.data.data as {
          name: string;
          slug: string;
          general: OrganizationGeneralSettings;
        },
      ),
  });

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: () =>
      workflowsApi.list().then(
        (r) => r.data.data as Array<{ id: string; name: string; isDefault: boolean }>,
      ),
  });

  useEffect(() => {
    if (data) {
      setName(data.name);
      setGeneral(data.general);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      organizationApi
        .update({ name, general: general ?? undefined })
        .then((r) => r.data.data as { general: OrganizationGeneralSettings }),
    onSuccess: (saved) => {
      if (saved?.general) setOrgSettings(saved.general);
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      setMessage('Settings saved.');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: () => setMessage('Failed to save settings.'),
  });

  if (isLoading || !general) {
    return <GeneralSettingsSkeleton />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      {message && (
        <p className="text-sm rounded-lg border border-border bg-muted/50 px-4 py-2">{message}</p>
      )}

      <section className="dashboard-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Organization</h3>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Organization name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Slug</label>
          <Input value={data?.slug ?? ''} disabled className="bg-muted/50" />
          <p className="text-xs text-muted-foreground mt-1">Used in URLs and cannot be changed here.</p>
        </div>
      </section>

      <section className="dashboard-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Regional</h3>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Timezone</label>
          <select
            value={general.timezone}
            onChange={(e) => setGeneral((g) => (g ? { ...g, timezone: e.target.value } : g))}
            className={selectClassName}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Date format</label>
          <select
            value={general.dateFormat}
            onChange={(e) =>
              setGeneral((g) =>
                g ? { ...g, dateFormat: e.target.value as OrganizationGeneralSettings['dateFormat'] } : g,
              )
            }
            className={selectClassName}
          >
            {DATE_FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="dashboard-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Task defaults</h3>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Default priority</label>
          <select
            value={general.defaultTaskPriority}
            onChange={(e) =>
              setGeneral((g) =>
                g
                  ? { ...g, defaultTaskPriority: e.target.value as OrganizationGeneralSettings['defaultTaskPriority'] }
                  : g,
              )
            }
            className={selectClassName}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        {workflows && workflows.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-1.5 block">Default workflow</label>
            <select
              value={general.defaultWorkflowId ?? ''}
              onChange={(e) =>
                setGeneral((g) =>
                  g ? { ...g, defaultWorkflowId: e.target.value || null } : g,
                )
              }
              className={selectClassName}
            >
              <option value="">None (use org default)</option>
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                  {wf.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Applied to new projects when no workflow is selected.
            </p>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim()}>
          {saveMutation.isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </div>
  );
}
