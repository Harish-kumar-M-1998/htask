import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router';
import { ArrowRight, Download, Shield } from 'lucide-react';
import { ROLES, PERMISSIONS } from '@htask/shared';
import { auditApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { getDefaultSettingsPath } from '@/lib/settingsNav';
import { Button } from '@/shared/ui/button';
import { AuditTable, type AuditLogRow } from '@/widgets/AuditTable';
import { exportAuditToCsv } from '@/features/audit/exportAudit';
import { TableRowsSkeleton } from '@/shared/components/skeletons';

export function SecuritySettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.roles.includes(ROLES.MANAGER);
  const canViewAudit = user?.permissions.includes(PERMISSIONS.AUDIT_READ);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', 'preview'],
    queryFn: () => auditApi.list({ page: 1, limit: 8 }).then((r) => r.data),
    enabled: Boolean(canViewAudit),
  });

  if (!isManager && !canViewAudit) {
    return (
      <Navigate
        to={getDefaultSettingsPath(user?.permissions ?? [], user?.roles ?? [])}
        replace
      />
    );
  }

  const logs = (data?.data ?? []) as AuditLogRow[];

  const handleExport = async () => {
    const result = await auditApi.list({ page: 1, limit: 500 }).then((r) => r.data);
    exportAuditToCsv((result.data ?? []) as AuditLogRow[]);
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Security & audit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review account activity and access the full audit trail.
        </p>
      </div>

      <section className="dashboard-card p-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Your session
        </h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Signed in as</dt>
            <dd className="font-medium mt-0.5">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Roles</dt>
            <dd className="font-medium mt-0.5">{user?.roles.join(', ')}</dd>
          </div>
        </dl>
      </section>

      {canViewAudit && (
        <section className="dashboard-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Recent audit activity</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Last {logs.length} events · export up to 500 records
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void handleExport()}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/audit">
                  Full audit log
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="p-4">
              <TableRowsSkeleton rows={5} />
            </div>
          ) : logs.length > 0 ? (
            <AuditTable logs={logs} />
          ) : (
            <p className="p-5 text-sm text-muted-foreground">No audit records yet.</p>
          )}
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        SSO, password policy, and session timeout controls are planned for a future release.
      </p>
    </div>
  );
}
