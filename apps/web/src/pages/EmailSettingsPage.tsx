import { Navigate } from 'react-router';

/** @deprecated Use /settings/notifications */
export function EmailSettingsPage() {
  return <Navigate to="/settings/notifications" replace />;
}
