import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Mail, Shield } from 'lucide-react';
import { changePasswordSchema, type ChangePasswordInput } from '@htask/shared';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { PageShell } from '@/shared/layouts/PageShell';
import { AvatarInitials, getInitials } from '@/shared/components/AvatarInitials';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { formatDate, formatRelativeTime } from '@/lib/utils';

function formatRole(code: string) {
  return code.replace(/_/g, ' ');
}

export function ProfilePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me().then((r) => r.data.data),
  });

  useEffect(() => {
    if (profile) setUser(profile);
  }, [profile, setUser]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }),
    onSuccess: () => {
      setPasswordError('');
      setPasswordMessage('Password updated. Sign in again with your new password.');
      reset();
      window.setTimeout(() => {
        logout();
        navigate('/login', { replace: true, state: { message: 'Password updated. Please sign in again.' } });
      }, 1200);
    },
    onError: (err: unknown) => {
      setPasswordMessage('');
      const apiMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
              ?.message
          : undefined;
      setPasswordError(apiMessage ?? 'Failed to change password.');
    },
  });

  if (isLoading || !profile) {
    return (
      <PageShell title="Profile" subtitle="Your account">
        <div className="dashboard-card p-6 animate-pulse h-48" />
      </PageShell>
    );
  }

  return (
    <PageShell title="Profile" subtitle="Manage your account and security">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6 max-w-3xl">
        <div className="dashboard-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <AvatarInitials
              initials={getInitials(profile.firstName, profile.lastName)}
              size="2xl"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                {profile.email}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 pill-brand rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                  >
                    <Shield className="h-3 w-3" />
                    {formatRole(role)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground">Member since</p>
                <p className="font-medium">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground">Last sign in</p>
                <p className="font-medium">
                  {profile.lastLoginAt ? formatRelativeTime(profile.lastLoginAt) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card p-6">
          <h3 className="text-base font-semibold mb-1">Change password</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Use a strong password with at least 8 characters. You will be signed out after updating.
          </p>

          <form
            onSubmit={handleSubmit((data) => changePasswordMutation.mutate(data))}
            className="space-y-4 max-w-md"
          >
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="current-password">
                Current password
              </label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
              />
              {errors.currentPassword && (
                <p className="text-destructive text-xs mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="new-password">
                New password
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                {...register('newPassword')}
              />
              {errors.newPassword && (
                <p className="text-destructive text-xs mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="confirm-password">
                Confirm new password
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {passwordError && (
              <p className="text-destructive text-sm">{passwordError}</p>
            )}
            {passwordMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{passwordMessage}</p>
            )}

            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
