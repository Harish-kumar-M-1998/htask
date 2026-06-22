import { useAuthStore } from '@/store';
import { ROLES } from '@htask/shared';
import { EmailNotificationSettings } from '@/features/settings/EmailNotificationSettings';
import { PersonalNotificationSettings } from '@/features/settings/PersonalNotificationSettings';

export function NotificationsSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.roles.includes(ROLES.MANAGER);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personal in-app alerts{isManager ? ' and organization email automation' : ''}.
        </p>
      </div>

      <section className="dashboard-card p-5">
        <PersonalNotificationSettings />
      </section>

      {isManager && (
        <section>
          <EmailNotificationSettings />
        </section>
      )}
    </div>
  );
}
