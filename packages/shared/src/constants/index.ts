export const ROLES = {
  MANAGER: 'MANAGER',
  TEAM_LEAD: 'TEAM_LEAD',
  TEAM_MEMBER: 'TEAM_MEMBER',
  PMO: 'PMO',
  QA: 'QA',
} as const;

export const PERMISSIONS = {
  PROJECT_CREATE: 'project:create',
  PROJECT_READ: 'project:read',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_MANAGE_MEMBERS: 'project:manage_members',
  MODULE_CREATE: 'module:create',
  MODULE_READ: 'module:read',
  MODULE_UPDATE: 'module:update',
  MODULE_DELETE: 'module:delete',
  TASK_CREATE: 'task:create',
  TASK_READ: 'task:read',
  TASK_UPDATE: 'task:update',
  TASK_UPDATE_OWN: 'task:update_own',
  TASK_DELETE: 'task:delete',
  TASK_DELETE_OWN: 'task:delete_own',
  TASK_ASSIGN: 'task:assign',
  TASK_TRANSITION: 'task:transition',
  TASK_COMMENT: 'task:comment',
  TASK_UPLOAD: 'task:upload',
  WORKLOG_CREATE: 'worklog:create',
  WORKLOG_READ: 'worklog:read',
  WORKLOG_UPDATE: 'worklog:update',
  RELEASE_READ: 'release:read',
  RELEASE_CREATE: 'release:create',
  RELEASE_UPDATE: 'release:update',
  BACKLOG_READ: 'backlog:read',
  BACKLOG_CREATE: 'backlog:create',
  BACKLOG_UPDATE: 'backlog:update',
  REPORT_VIEW: 'report:view',
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',
  ANALYTICS_VIEW: 'analytics:view',
  AUDIT_READ: 'audit:read',
  SEARCH_USE: 'search:use',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_UPDATE: 'notification:update',
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_MANAGE_ROLES: 'user:manage_roles',
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_MANAGE: 'workflow:manage',
  WORKFLOW_APPROVE: 'workflow:approve',
  QA_UPDATE: 'qa:update',
  QA_DEFECT: 'qa:defect',
  QA_COMMENT: 'qa:comment',
} as const;

export const TASK_STATUSES = [
  'DRAFT', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED',
  'DEVELOPMENT_COMPLETE', 'MR_RAISED', 'MR_APPROVED',
  'MOVED_TO_STAGE', 'STAGE_VERIFIED', 'MOVED_TO_QA',
  'QA_TESTING', 'QA_FAILED', 'QA_PASSED',
  'READY_FOR_PRODUCTION', 'DEPLOYED', 'CLOSED', 'ARCHIVED',
] as const;

export const TASK_STATUS_LABELS: Record<(typeof TASK_STATUSES)[number], string> = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DEVELOPMENT_COMPLETE: 'Dev Complete',
  MR_RAISED: 'MR Raised',
  MR_APPROVED: 'MR Approved',
  MOVED_TO_STAGE: 'Moved to Stage',
  STAGE_VERIFIED: 'Stage Verified',
  MOVED_TO_QA: 'Moved to QA',
  QA_TESTING: 'QA Testing',
  QA_FAILED: 'QA Failed',
  QA_PASSED: 'QA Passed',
  READY_FOR_PRODUCTION: 'Ready for Production',
  DEPLOYED: 'Deployed',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  FEATURE: 'Feature',
  ENHANCEMENT: 'Enhancement',
  BUG_FIX: 'Bug Fix',
  SUPPORT: 'Support',
};

export function formatTaskStatus(status: string): string {
  return TASK_STATUS_LABELS[status as (typeof TASK_STATUSES)[number]] ?? titleCaseEnum(status);
}

export function formatTaskType(type: string): string {
  return TASK_TYPE_LABELS[type] ?? titleCaseEnum(type);
}

function titleCaseEnum(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
