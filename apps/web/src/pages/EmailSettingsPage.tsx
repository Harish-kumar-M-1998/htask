import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Play, Send } from 'lucide-react';
import { notificationsApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { PageShell } from '@/shared/layouts/PageShell';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { selectClassName } from '@/lib/formStyles';
import { Navigate } from 'react-router';
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

const EVENT_TOGGLES: Array<{ key: BooleanConfigKey; label: string; description: string }> = [
  { key: 'taskCreated', label: 'Task created', description: 'Creator, manager, TL, and assignees' },
  { key: 'taskCompleted', label: 'Task completed', description: 'Manager and team lead' },
  { key: 'taskUpdated', label: 'Task updated', description: 'Creator, manager, TL, and assignees' },
  { key: 'taskDeleted', label: 'Task deleted', description: 'Creator, manager, TL, and assignees' },
  { key: 'etaNearing', label: 'Nearing ETA', description: 'Manager and TL when dev time approaches ETA' },
  { key: 'etaOver', label: 'Over ETA', description: 'Manager and TL when dev time exceeds ETA' },
  { key: 'dueNearing', label: 'Nearing due date', description: 'Manager and TL before deadline' },
  { key: 'dueOverdue', label: 'Past due date', description: 'Manager and TL when overdue' },
  { key: 'dailyTeamReminder', label: 'Daily team reminder', description: 'Assigned tasks summary for team members' },
  { key: 'dailyManagerDigest', label: 'Daily manager digest', description: 'Automated summary for manager and TL' },
];

export function EmailSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<EmailAutomationConfig | null>(null);
  const [message, setMessage] = useState('');

  const isManager = user?.roles.includes('MANAGER');

  const { data: smtpStatus } = useQuery({
    queryKey: ['smtp-status'],
    queryFn: () => notificationsApi.getSmtpStatus().then((r) => r.data.data),
    enabled: isManager,
    retry: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn: () => notificationsApi.getEmailConfig().then((r) => r.data.data),
    enabled: isManager,
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

  if (!isManager) {
    return <Navigate to="/" replace />;
  }

  if (isLoading || !draft) {
    return <div className="h-48 animate-pulse bg-muted rounded-xl" />;
  }

  const toggle = (key: BooleanConfigKey) => {
    setDraft((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  return (
    <PageShell
      title="Email notifications"
      subtitle="Configure automated emails · Manager only"
      action={
        <Button
          size="sm"
          onClick={() => saveMutation.mutate(draft)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save settings'}
        </Button>
      }
    >
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-y-auto pb-6">
        <div className="w-full max-w-4xl space-y-6">
          {smtpStatus && !smtpStatus.success && (
            <p className="text-sm rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 px-4 py-3">
              <strong>SMTP not connected.</strong> {smtpStatus.error}
            </p>
          )}

          {message && (
            <p className="text-sm rounded-lg border border-border bg-muted/50 px-4 py-2">{message}</p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="dashboard-card p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Delivery mode
              </h2>
              <p className="text-sm text-muted-foreground">
                Automated sends on events and schedules. Manual turns off automation — use the run
                buttons below when you want to send.
              </p>
              <select
                value={draft.mode}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev ? { ...prev, mode: e.target.value as EmailAutomationConfig['mode'] } : prev,
                  )
                }
                className={selectClassName}
              >
                <option value="automated">Automated</option>
                <option value="manual">Manual</option>
              </select>

              <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">ETA nearing (%)</label>
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
                  <label className="text-sm font-medium mb-1.5 block">Due nearing (days)</label>
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
                  <label className="text-sm font-medium mb-1.5 block">Daily reminder hour</label>
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
            </div>

            <div className="dashboard-card p-5 flex flex-col min-h-0">
              <h2 className="text-sm font-semibold mb-3 shrink-0">Manual actions</h2>
              <p className="text-sm text-muted-foreground mb-4 shrink-0">
                Run these anytime — useful when delivery mode is Manual.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                  Send test email to me
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => dailyMutation.mutate()}
                  disabled={dailyMutation.isPending}
                >
                  <Play className="h-4 w-4" />
                  Run daily emails now
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => checksMutation.mutate()}
                  disabled={checksMutation.isPending}
                >
                  <Play className="h-4 w-4" />
                  Run ETA / due-date checks
                </Button>
              </div>
            </div>
          </div>

          <div className="dashboard-card p-5">
            <h2 className="text-sm font-semibold mb-4">Event notifications</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {EVENT_TOGGLES.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 rounded-lg border border-border px-3 py-3 cursor-pointer hover:bg-accent/40"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(draft[item.key])}
                    onChange={() => toggle(item.key)}
                    className="mt-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
