import type { AuditLogRow } from '@/widgets/AuditTable';
import { formatDate } from '@/lib/utils';

export function exportAuditToCsv(logs: AuditLogRow[], filename = 'audit-export.csv') {
  const headers = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP'];
  const rows = logs.map((log) => [
    formatDate(log.createdAt),
    log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
    log.action,
    log.entityType,
    log.entityId,
    log.ipAddress ?? '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
