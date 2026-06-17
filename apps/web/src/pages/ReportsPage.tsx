import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, FileSpreadsheet, FileText, Plus } from 'lucide-react';
import { reportsApi, projectsApi } from '@/services/api';
import { PageShell } from '@/shared/layouts/PageShell';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { TablePagination } from '@/shared/components/TablePagination';
import { GenerateReportDialog } from '@/features/reports/GenerateReportDialog';
import {
  REPORT_TYPES,
  type ReportTypeOption,
} from '@/features/reports/reportOptions';
import { formatDate, formatBytes } from '@/lib/utils';
import { formToolbarClass } from '@/lib/formStyles';
import { TableRowsSkeleton } from '@/shared/components/skeletons';

interface ReportRow {
  id: string;
  title: string;
  type: string;
  format: string;
  status: string;
  fileSize?: number | null;
  createdAt: string;
  completedAt?: string | null;
}

const QUICK_TYPES: ReportTypeOption[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<ReportTypeOption | undefined>();

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'reports'],
    queryFn: () => projectsApi.list({ limit: 100 }).then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page, limit],
    queryFn: () => reportsApi.list({ page, limit }).then((r) => r.data),
  });

  const projects = projectsData?.data ?? [];
  const reports = (data?.data ?? []) as ReportRow[];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const openDialog = (type?: ReportTypeOption) => {
    setDefaultType(type);
    setDialogOpen(true);
  };

  const handleDownload = async (report: ReportRow) => {
    try {
      const response = await reportsApi.download(report.id);
      const ext = report.format === 'EXCEL' ? 'xlsx' : report.format === 'PDF' ? 'html' : report.format.toLowerCase();
      const contentType = String(response.headers['content-type'] ?? 'application/octet-stream');
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.replace(/[^a-zA-Z0-9._-]+/g, '_')}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      // download failed silently; user can retry
    }
  };

  const statusVariant = (status: string) => {
    if (status === 'COMPLETED') return 'QA_PASSED' as const;
    if (status === 'FAILED') return 'BLOCKED' as const;
    return 'IN_PROGRESS' as const;
  };

  return (
    <PageShell
      title="Reports"
      subtitle={`${meta.total} generated report${meta.total === 1 ? '' : 's'}`}
      action={
        <div className={formToolbarClass}>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="h-4 w-4" />
            Generate report
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6 shrink-0">
        {QUICK_TYPES.map((type) => {
          const info = REPORT_TYPES.find((t) => t.value === type)!;
          return (
            <button
              key={type}
              type="button"
              onClick={() => openDialog(type)}
              className="dashboard-card bg-card text-left p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary shrink-0" />
                <Calendar className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="font-semibold mt-3">{info.label} report</p>
              <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
              <p className="text-xs text-primary mt-2 font-medium">Quick generate →</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden dashboard-card">
        <div className="shrink-0 px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Generated reports</h2>
        </div>

        {isLoading ? (
          <div className="flex-1 overflow-hidden">
            <TableRowsSkeleton rows={5} />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center px-6">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No reports yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Generate a daily, weekly, or custom report to export task summaries and team utilization.
            </p>
            <Button className="mt-4" size="sm" onClick={() => openDialog()}>
              Generate your first report
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card border-b border-border z-10">
                <tr className="text-left text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Report</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Type</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Created</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{report.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.format}
                            {report.fileSize ? ` · ${formatBytes(report.fileSize)}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <Badge>{report.type}</Badge>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="status" status={statusVariant(report.status)}>
                        {report.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {report.status === 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reports.length > 0 && (
          <TablePagination
            page={meta.page}
            limit={meta.limit}
            total={meta.total}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            onLimitChange={(next) => {
              setLimit(next);
              setPage(1);
            }}
          />
        )}
      </div>

      <GenerateReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={projects}
        defaultType={defaultType}
      />
    </PageShell>
  );
}
