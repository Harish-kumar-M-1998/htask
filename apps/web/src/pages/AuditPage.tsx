import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter } from 'lucide-react';
import { auditApi, usersApi } from '@/services/api';
import { PageShell } from '@/shared/layouts/PageShell';
import { Button } from '@/shared/ui/button';
import { TablePagination } from '@/shared/components/TablePagination';
import { AuditTable, type AuditLogRow } from '@/widgets/AuditTable';
import { AuditFilterDialog } from '@/features/audit/AuditFilterDialog';
import {
  auditFiltersToParams,
  countActiveAuditFilters,
  emptyAuditFilters,
  type AuditFilters,
} from '@/features/audit/auditFilters';
import { formToolbarClass } from '@/lib/formStyles';

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<AuditFilters>(emptyAuditFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = countActiveAuditFilters(filters);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data),
  });

  const users = usersData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, limit, filters],
    queryFn: () =>
      auditApi.list({ page, limit, ...auditFiltersToParams(filters) }).then((r) => r.data),
  });

  const logs = (data?.data ?? []) as AuditLogRow[];
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  return (
    <PageShell
      title="Audit Log"
      subtitle={`${meta.total} records${activeFilterCount ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : ''}`}
      action={
        <div className={`${formToolbarClass}`}>
          <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="relative">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-neutral-900 text-[10px] text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      }
    >
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden dashboard-card">
        {isLoading ? (
          <div className="flex-1 overflow-hidden">
            <div className="space-y-0 divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/40 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <AuditTable logs={logs} />
        )}
        <TablePagination
          page={meta.page}
          limit={meta.limit}
          total={meta.total}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      </div>

      <AuditFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
        users={users}
      />
    </PageShell>
  );
}
