import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Play, Send } from 'lucide-react';
import { notificationsApi } from '@/services/api';
import { EmailSettingsSkeleton } from '@/shared/components/skeletons';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import type { EmailAutomationConfig } from '@htask/shared';

type BooleanConfigKey = Extract<
  keyof EmailAutomationConfig,
  | 'taskCreated'
  | 'taskCompleted'
  | 'taskUpdated'
  | 'taskDeleted'
  | 'etaNearing'
  | 'etaOver'
  | 'dueNearing'
  | 'dueOverdue'
  | 'dailyTeamReminder'
  | 'dailyManagerDigest'
>;

type EventRow = {
  key: BooleanConfigKey;
  label: string;
  description: string;
  recipients: {
    manager?: boolean;
    teamLead?: boolean;
    creator?: boolean;
    assignees?: boolean;
  };
};

const EVENT_GROUPS: Array<{ title: string; rows: EventRow[] }> = [
  {
    title: 'Task lifecycle',
    rows: [
      {
        key: 'taskCreated',
        label: 'Task created',
        description: 'Creator, manager, TL, and assignees',
        recipients: { manager: true, teamLead: true, creator: true, assignees: true },
      },
      {
        key: 'taskUpdated',
        label: 'Task updated',
        description: 'Creator, manager, TL, and assignees',
        recipients: { manager: true, teamLead: true, creator: true, assignees: true },
      },
      {
        key: 'taskCompleted',
        label: 'Task completed',
        description: 'Manager and team lead',
        recipients: { manager: true, teamLead: true },
      },
      {
        key: 'taskDeleted',
        label: 'Task deleted',
        description: 'Creator, manager, TL, and assignees',
        recipients: { manager: true, teamLead: true, creator: true, assignees: true },
      },
    ],
  },
  {
    title: 'Deadlines & ETA',
    rows: [
      {
        key: 'etaNearing',
        label: 'Nearing ETA',
        description: 'When dev time approaches ETA',
        recipients: { manager: true, teamLead: true },
      },
      {
        key: 'etaOver',
        label: 'Over ETA',
        description: 'When dev time exceeds ETA',
        recipients: { manager: true, teamLead: true },
      },
      {
        key: 'dueNearing',
        label: 'Nearing due date',
        description: 'Before deadline',
        recipients: { manager: true, teamLead: true },
      },
      {
        key: 'dueOverdue',
        label: 'Past due date',
        description: 'When overdue',
        recipients: { manager: true, teamLead: true },
      },
    ],
  },
  {
    title: 'Digests & reminders',
    rows: [
      {
        key: 'dailyTeamReminder',
        label: 'Daily team reminder',
        description: 'Assigned tasks summary',
        recipients: { assignees: true },
      },
      {
        key: 'dailyManagerDigest',
        label: 'Daily manager digest',
        description: 'Automated summary',
        recipients: { manager: true, teamLead: true },
      },
    ],
  },
];

export function EmailNotificationSettings() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EmailAutomationConfig | null>(null);
  const [message, setMessage] = useState('');

  const { data: smtpStatus } = useQuery({
    queryKey: ['smtp-status'],
    queryFn: () => notificationsApi.getSmtpStatus().then((r) => r.data.data),
    retry: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn: () => notificationsApi.getEmailConfig().then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<EmailAutomationConfig>) =>
      notificationsApi.updateEmailConfig(payload).then((r) => r.data.data),
    onSuccess: (saved) => {
      setDraft(saved);
      queryClient.setQueryData(['email-config'], saved);
      setMessage('Settings saved.');
    },
    onError: () => setMessage('Failed to save settings.'),
  });

  const testMutation = useMutation({
    mutationFn: () => notificationsApi.sendTestEmail().then((r) => r.data.data),
    onSuccess: (result) =>
      setMessage(
        result.sent
          ? 'Test email sent to your inbox.'
          : result.error ?? 'Test email failed — check SMTP settings in apps/api/.env',
      ),
    onError: () => setMessage('Test email failed.'),
  });

  const dailyMutation = useMutation({
    mutationFn: () => notificationsApi.runDailyEmails().then((r) => r.data),
    onSuccess: () => setMessage('Daily reminders and digest triggered.'),
    onError: () => setMessage('Failed to run daily emails.'),
  });

  const checksMutation = useMutation({
    mutationFn: () => notificationsApi.runEmailChecks().then((r) => r.data),
    onSuccess: () => setMessage('ETA and due-date checks triggered.'),
    onError: () => setMessage('Failed to run checks.'),
  });

  if (isLoading || !draft) {
    return <EmailSettingsSkeleton />;
  }

  const toggle = (key: BooleanConfigKey) => {
    setDraft((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const modeLabel = draft.mode === 'automated' ? 'Automated' : 'Manual';

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Email automation</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated email delivery and alerts for the organization.
          </p>
        </div>
        <Button
          size="default"
          onClick={() => saveMutation.mutate(draft)}
          disabled={saveMutation.isPending}
          className="shrink-0"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>

      {smtpStatus && !smtpStatus.success && (
        <p className="text-sm rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 px-4 py-3">
          <strong>SMTP not connected.</strong> {smtpStatus.error}
        </p>
      )}

      {message && (
        <p className="text-sm rounded-lg border border-border bg-muted/50 px-4 py-2 mt-4">{message}</p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="dashboard-card p-3">
            <button
              type="button"
              className="w-full rounded-lg bg-card px-3 py-2 text-left text-sm font-medium text-foreground"
            >
              Delivery mode
            </button>
            <button
              type="button"
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            >
              Manual actions
            </button>
            <button
              type="button"
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            >
              Event matrix
            </button>
          </div>

          <div className="dashboard-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Current setup
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Mode</dt>
                <dd className="rounded-full pill-brand px-2 py-0.5 text-xs font-semibold">
                  {modeLabel}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Events on</dt>
                <dd className="font-semibold">
                  {
                    EVENT_GROUPS.flatMap((group) => group.rows).filter((item) => draft[item.key])
                      .length
                  }
                  /10
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Daily send</dt>
                <dd className="font-semibold">{`${String(draft.dailyReminderHour).padStart(2, '0')}:00`}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">ETA alert</dt>
                <dd className="font-semibold">at {draft.etaNearingPercent}%</dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="dashboard-card p-5">
            <h3 className="text-lg font-semibold">Delivery mode</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Automated sends on events and schedules. Manual turns off automation and lets you run
              checks manually.
            </p>

            <div className="mt-4 inline-flex rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setDraft((prev) => (prev ? { ...prev, mode: 'automated' } : prev))}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  draft.mode === 'automated'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Automated
              </button>
              <button
                type="button"
                onClick={() => setDraft((prev) => (prev ? { ...prev, mode: 'manual' } : prev))}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  draft.mode === 'manual'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Manual
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ETA nearing (%)
                </label>
                <Input
                  type="number"
                  min={50}
                  max={99}
                  value={draft.etaNearingPercent}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, etaNearingPercent: Number(e.target.value) } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Due nearing (days)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={draft.dueNearingDays}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, dueNearingDays: Number(e.target.value) } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Daily reminder hour (0-23)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={draft.dailyReminderHour}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev ? { ...prev, dailyReminderHour: Number(e.target.value) } : prev,
                    )
                  }
                />
              </div>
            </div>
          </section>

          <section className="dashboard-card p-5">
            <h3 className="text-lg font-semibold">Manual actions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Run these anytime - useful when delivery mode is Manual.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                className="h-11 justify-start"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
              >
                <Send className="h-4 w-4" />
                Send test email to me
              </Button>
              <Button
                variant="outline"
                className="h-11 justify-start"
                onClick={() => dailyMutation.mutate()}
                disabled={dailyMutation.isPending}
              >
                <Play className="h-4 w-4" />
                Run daily emails now
              </Button>
              <Button
                variant="outline"
                className="h-11 justify-start"
                onClick={() => checksMutation.mutate()}
                disabled={checksMutation.isPending}
              >
                <Play className="h-4 w-4" />
                Run ETA / due-date checks
              </Button>
            </div>
          </section>

          <section className="dashboard-card p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="h-4 w-4" />
              Event matrix
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Toggle a row off to mute that email entirely.
            </p>

            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[780px]">
                <div className="grid grid-cols-[minmax(280px,1fr)_88px_88px_88px_88px_72px] gap-x-3 px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <div>Event</div>
                  <div className="text-center">Manager</div>
                  <div className="text-center">Team lead</div>
                  <div className="text-center">Creator</div>
                  <div className="text-center">Assignees</div>
                  <div className="text-center">On</div>
                </div>

                {EVENT_GROUPS.map((group) => (
                  <div key={group.title} className="border-t border-border/70 px-2 py-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {group.title}
                    </p>
                    <div className="space-y-1">
                      {group.rows.map((item) => (
                        <div
                          key={item.key}
                          className="grid grid-cols-[minmax(280px,1fr)_88px_88px_88px_88px_72px] items-center gap-x-3 rounded-lg px-1 py-2 hover:bg-accent/40"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                          </div>
                          <div className="text-center text-sm">{item.recipients.manager ? '✓' : ''}</div>
                          <div className="text-center text-sm">{item.recipients.teamLead ? '✓' : ''}</div>
                          <div className="text-center text-sm">{item.recipients.creator ? '✓' : ''}</div>
                          <div className="text-center text-sm">{item.recipients.assignees ? '✓' : ''}</div>
                          <div className="flex justify-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={Boolean(draft[item.key])}
                              onClick={() => toggle(item.key)}
                              className={`relative h-6 w-11 rounded-full border transition ${
                                draft[item.key]
                                  ? 'border-primary bg-primary'
                                  : 'border-border bg-muted'
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                                  draft[item.key] ? 'left-5' : 'left-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
