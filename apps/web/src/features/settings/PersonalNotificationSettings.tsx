import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { notificationsApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

type NotificationPref = {
  event: string;
  label: string;
  description: string;
  inApp: boolean;
};

export function PersonalNotificationSettings() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<NotificationPref[] | null>(null);
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () =>
      notificationsApi.getPreferences().then((r) => r.data.data as NotificationPref[]),
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      notificationsApi
        .updatePreferences(
          (draft ?? []).map((p) => ({ event: p.event, inApp: p.inApp })),
        )
        .then((r) => r.data.data as NotificationPref[]),
    onSuccess: (saved) => {
      setDraft(saved);
      queryClient.setQueryData(['notification-preferences'], saved);
      setMessage('Preferences saved.');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: () => setMessage('Failed to save preferences.'),
  });

  if (isLoading || !draft) {
    return (
      <div className="space-y-3 max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            In-app notifications
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Choose which events appear in your notification bell.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="shrink-0"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {message && (
        <p className="text-sm rounded-lg border border-border bg-muted/50 px-4 py-2">{message}</p>
      )}

      <div className="space-y-2">
        {draft.map((pref) => (
          <label
            key={pref.event}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-accent/40 transition-fast"
          >
            <div>
              <p className="text-sm font-medium">{pref.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pref.inApp}
              onClick={() =>
                setDraft((prev) =>
                  prev?.map((p) => (p.event === pref.event ? { ...p, inApp: !p.inApp } : p)) ?? prev,
                )
              }
              className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                pref.inApp ? 'border-primary bg-primary' : 'border-border bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                  pref.inApp ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
