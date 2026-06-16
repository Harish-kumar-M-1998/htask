import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus, Filter, ListTodo, Download, ChevronDown } from 'lucide-react';
import { tasksApi, projectsApi, usersApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { TaskTable } from '@/widgets/TaskTable';
import { CreateTaskDialog } from '@/features/tasks/CreateTaskDialog';
import {
  TaskFilterDialog,
  filtersFromSearchParams,
  searchParamsFromFilters,
  buildTaskListParams,
  type TaskFilters,
} from '@/features/tasks/TaskFilterDialog';
import { exportTasksToCsv, exportTasksToXlsx, type ExportableTask } from '@/lib/exportTasks';
import { PageShell } from '@/shared/layouts/PageShell';
import { TablePagination } from '@/shared/components/TablePagination';
import { FilterCountBadge } from '@/shared/components/FilterCountBadge';
import { formToolbarClass } from '@/lib/formStyles';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

async function fetchAllFilteredTasks(
  search: string,
  filters: TaskFilters,
): Promise<ExportableTask[]> {
  const limit = 100;
  const first = await tasksApi.list(buildTaskListParams(search, filters, 1, limit));
  const totalPages = first.data.meta?.totalPages ?? 1;
  let all: ExportableTask[] = [...(first.data.data ?? [])];

  for (let page = 2; page <= totalPages; page++) {
    const res = await tasksApi.list(buildTaskListParams(search, filters, page, limit));
    all = all.concat(res.data.data ?? []);
  }

  return all;
}

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.permissions.includes('task:create');

  const filters = filtersFromSearchParams(searchParams);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => {
    setPage(1);
  }, [search, searchParams.toString()]);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list({ limit: 100 }).then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data),
  });

  const projects = projectsData?.data ?? [];
  const users = usersData?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, filters, page, limit],
    queryFn: () =>
      tasksApi.list(buildTaskListParams(search, filters, page, limit)).then((r) => r.data),
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 };

  const applyFilters = (next: TaskFilters) => {
    setSearchParams(searchParamsFromFilters(next));
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    try {
      const allTasks = await fetchAllFilteredTasks(search, filters);
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'csv') {
        exportTasksToCsv(allTasks, `tasks-${stamp}.csv`);
      } else {
        exportTasksToXlsx(allTasks, `tasks-${stamp}.xlsx`);
      }
    } finally {
      setExporting(false);
    }
  };

  const pageActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="relative">
        <Filter className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && <FilterCountBadge count={activeFilterCount} />}
      </Button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="outline" size="sm" disabled={exporting || isLoading}>
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export'}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg"
          >
            <DropdownMenu.Item
              className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-accent"
              onSelect={() => handleExport('csv')}
            >
              Export CSV
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-accent"
              onSelect={() => handleExport('xlsx')}
            >
              Export XLSX
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {canCreate && (
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      )}
    </div>
  );

  return (
    <PageShell
      title="Tasks"
      subtitle={`${meta.total} tasks total${activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : ''}`}
      action={pageActions}
    >
      <div className="flex flex-1 min-h-0 min-w-0 flex-col gap-4">
        <div className={`shrink-0 max-w-sm ${formToolbarClass}`}>
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden dashboard-card">
          {isLoading ? (
            <div className="flex-1 overflow-hidden">
              <div className="space-y-0 divide-y divide-border">
                {Array.from({ length: limit }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted/40 animate-pulse" />
                ))}
              </div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16">
              <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No tasks found</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                {activeFilterCount > 0
                  ? 'Try adjusting your filters or search.'
                  : canCreate
                    ? 'Create your first task to get started.'
                    : 'No tasks available.'}
              </p>
              {canCreate && activeFilterCount === 0 && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              )}
            </div>
          ) : (
            <TaskTable tasks={tasks} onRowClick={(id) => navigate(`/tasks/${id}`)} />
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

        <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
        <TaskFilterDialog
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={filters}
          onApply={applyFilters}
          projects={projects}
          users={users}
        />
      </div>
    </PageShell>
  );
}
