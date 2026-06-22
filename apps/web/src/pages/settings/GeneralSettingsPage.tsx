import { Navigate } from 'react-router';
import { ROLES } from '@htask/shared';
import { useAuthStore } from '@/store';
import { getDefaultSettingsPath } from '@/lib/settingsNav';
import { GeneralSettingsForm } from '@/features/settings/GeneralSettingsForm';

export function GeneralSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.roles.includes(ROLES.MANAGER);

  if (!isManager) {
    return (
      <Navigate
        to={getDefaultSettingsPath(user?.permissions ?? [], user?.roles ?? [])}
        replace
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Organization profile, regional preferences, and task defaults.
        </p>
      </div>
      <GeneralSettingsForm />
    </div>
  );
}
