import { Fragment, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { ROLES } from '@htask/shared';
import { useQuery } from '@tanstack/react-query';
import { Check, Search, X } from 'lucide-react';
import { rolesApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { getDefaultSettingsPath } from '@/lib/settingsNav';
import { ROLE_LABELS, ROLE_ORDER, type RoleCode } from '@/lib/rolePermissionMatrix';
import { TeamRolesSection } from '@/features/settings/TeamRolesSection';
import { RoleManagementSection } from '@/features/settings/RoleManagementSection';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { useDebounce } from '@/lib/useDebounce';

type RoleWithPermissions = {
  code: string;
  name: string;
  memberCount: number;
  permissions: Array<{ code: string; name: string; module: string }>;
};

type PermissionRow = {
  code: string;
  name: string;
  module: string;
};

function MatrixSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function RolesSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.roles.includes(ROLES.MANAGER);
  const [permSearch, setPermSearch] = useState('');
  const debouncedPermSearch = useDebounce(permSearch, 300);

  const permissions = user?.permissions ?? [];
  const userRoles = user?.roles ?? [];

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list().then((r) => r.data.data as RoleWithPermissions[]),
    enabled: isManager,
  });

  const { permissionRows, roleCodes } = useMemo(() => {
    if (!roles?.length) {
      return { permissionRows: [] as PermissionRow[], roleCodes: ROLE_ORDER };
    }

    const map = new Map<string, PermissionRow>();
    for (const role of roles) {
      for (const perm of role.permissions) {
        if (!map.has(perm.code)) {
          map.set(perm.code, perm);
        }
      }
    }

    const rows = Array.from(map.values()).sort(
      (a, b) => a.module.localeCompare(b.module) || a.code.localeCompare(b.code),
    );

    const codes = ROLE_ORDER.filter((code) => roles.some((r) => r.code === code));

    return { permissionRows: rows, roleCodes: codes };
  }, [roles]);

  const rolePermissionSets = useMemo(() => {
    const sets = new Map<string, Set<string>>();
    for (const role of roles ?? []) {
      sets.set(role.code, new Set(role.permissions.map((p) => p.code)));
    }
    return sets;
  }, [roles]);

  const modules = useMemo(
    () => Array.from(new Set(permissionRows.map((p) => p.module))),
    [permissionRows],
  );

  const filteredPermissions = useMemo(() => {
    const q = debouncedPermSearch.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter((code) => code.toLowerCase().includes(q));
  }, [permissions, debouncedPermSearch]);

  const filteredMatrixRows = useMemo(() => {
    const q = debouncedPermSearch.trim().toLowerCase();
    if (!q) return permissionRows;
    return permissionRows.filter(
      (row) =>
        row.code.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.module.toLowerCase().includes(q),
    );
  }, [permissionRows, debouncedPermSearch]);

  if (!isManager) {
    return (
      <Navigate
        to={getDefaultSettingsPath(user?.permissions ?? [], user?.roles ?? [])}
        replace
      />
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Roles & access</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage team roles, view the live permission matrix, and inspect your effective access.
        </p>
      </div>

      <TeamRolesSection />

      <RoleManagementSection />

      <section className="dashboard-card p-5">
        <h3 className="text-sm font-semibold mb-1">Your effective access</h3>
        <p className="text-sm text-muted-foreground mb-4">Signed in as {user?.email}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {userRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {ROLE_LABELS[role as RoleCode] ?? role}
            </span>
          ))}
        </div>
        <div className="relative max-w-sm mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            placeholder="Filter permissions…"
            className="pl-9 h-9 text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {filteredPermissions.length} of {permissions.length} permissions
          {debouncedPermSearch ? ' matching filter' : ' granted'}
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {filteredPermissions.map((code) => (
            <span
              key={code}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
            >
              {code}
            </span>
          ))}
          {filteredPermissions.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No permissions match your filter.</span>
          )}
        </div>
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Permission matrix</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Live data from your organization&apos;s role definitions.
          </p>
        </div>
        {rolesLoading ? (
          <MatrixSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    Permission
                  </th>
                  {roleCodes.map((role) => (
                    <th
                      key={role}
                      className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground w-24"
                    >
                      <div>{ROLE_LABELS[role]}</div>
                      <div className="font-normal text-[10px] text-muted-foreground/80 mt-0.5">
                        {roles?.find((r) => r.code === role)?.memberCount ?? 0} users
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => {
                  const moduleRows = filteredMatrixRows.filter((row) => row.module === module);
                  if (moduleRows.length === 0) return null;
                  return (
                    <Fragment key={module}>
                      <tr className="bg-muted/20">
                        <td
                          colSpan={roleCodes.length + 1}
                          className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {module}
                        </td>
                      </tr>
                      {moduleRows.map((row) => (
                        <tr key={row.code} className="border-b border-border/60 hover:bg-accent/30">
                          <td className="px-4 py-2">
                            <p className="font-medium text-sm">{row.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{row.code}</p>
                          </td>
                          {roleCodes.map((role) => (
                            <td key={role} className="px-3 py-2 text-center">
                              {rolePermissionSets.get(role)?.has(row.code) ? (
                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Webhooks, SSO, and integration keys are planned for a future release.
      </p>
    </div>
  );
}
