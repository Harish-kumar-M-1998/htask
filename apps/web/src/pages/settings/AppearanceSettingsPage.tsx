import { AppearanceSettingsForm } from '@/features/settings/AppearanceSettingsForm';

export function AppearanceSettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Theme, accent color, and layout density for your workspace.
        </p>
      </div>
      <AppearanceSettingsForm />
    </div>
  );
}
