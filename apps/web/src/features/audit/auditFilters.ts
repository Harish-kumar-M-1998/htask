export interface AuditFilters {
  action: string;
  entityType: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
}

export const emptyAuditFilters: AuditFilters = {
  action: '',
  entityType: '',
  userId: '',
  dateFrom: '',
  dateTo: '',
};

export const AUDIT_ENTITY_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'project', label: 'Project' },
  { value: 'user', label: 'User' },
  { value: 'module', label: 'Module' },
  { value: 'worklog', label: 'Worklog' },
  { value: 'release', label: 'Release' },
];

export const AUDIT_ACTION_GROUPS: Array<{ label: string; actions: Array<{ value: string; label: string }> }> = [
  {
    label: 'Authentication',
    actions: [
      { value: 'USER_LOGIN', label: 'User login' },
      { value: 'USER_LOGOUT', label: 'User logout' },
      { value: 'USER_LOGIN_FAILED', label: 'Login failed' },
      { value: 'TOKEN_REFRESHED', label: 'Token refreshed' },
      { value: 'PASSWORD_CHANGED', label: 'Password changed' },
    ],
  },
  {
    label: 'Projects',
    actions: [
      { value: 'PROJECT_CREATED', label: 'Project created' },
      { value: 'PROJECT_UPDATED', label: 'Project updated' },
      { value: 'PROJECT_DELETED', label: 'Project deleted' },
      { value: 'MODULE_CREATED', label: 'Module created' },
    ],
  },
  {
    label: 'Tasks',
    actions: [
      { value: 'TASK_CREATED', label: 'Task created' },
      { value: 'TASK_UPDATED', label: 'Task updated' },
      { value: 'TASK_DELETED', label: 'Task deleted' },
      { value: 'TASK_TRANSITIONED', label: 'Task transitioned' },
      { value: 'TASK_ASSIGNED', label: 'Task assigned' },
      { value: 'COMMENT_ADDED', label: 'Comment added' },
      { value: 'FILE_UPLOADED', label: 'File uploaded' },
    ],
  },
  {
    label: 'Users & access',
    actions: [
      { value: 'USER_CREATED', label: 'User created' },
      { value: 'USER_UPDATED', label: 'User updated' },
      { value: 'USER_DEACTIVATED', label: 'User deactivated' },
      { value: 'ROLE_CHANGED', label: 'Role changed' },
    ],
  },
  {
    label: 'Reports',
    actions: [
      { value: 'REPORT_GENERATED', label: 'Report generated' },
      { value: 'REPORT_EXPORTED', label: 'Report exported' },
    ],
  },
];

export function auditFiltersToParams(filters: AuditFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.action) params.action = filters.action;
  if (filters.entityType) params.entityType = filters.entityType;
  if (filters.userId) params.userId = filters.userId;
  if (filters.dateFrom) params.from = filters.dateFrom;
  if (filters.dateTo) params.to = filters.dateTo;
  return params;
}

export function countActiveAuditFilters(filters: AuditFilters): number {
  return Object.values(filters).filter(Boolean).length;
}
