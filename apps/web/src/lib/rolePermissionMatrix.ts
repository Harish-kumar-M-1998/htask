import { PERMISSIONS, ROLES } from '@htask/shared';

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleCode, string> = {
  [ROLES.MANAGER]: 'Manager',
  [ROLES.TEAM_LEAD]: 'Team Lead',
  [ROLES.TEAM_MEMBER]: 'Team Member',
  [ROLES.PMO]: 'PMO',
  [ROLES.QA]: 'QA',
};

export const ROLE_ORDER: RoleCode[] = [
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
  ROLES.TEAM_MEMBER,
  ROLES.PMO,
  ROLES.QA,
];

type MatrixRow = {
  code: string;
  label: string;
  module: string;
  roles: Record<RoleCode, boolean>;
};

/** Mirrors seed + docs permission matrix (read-only reference). */
export const PERMISSION_MATRIX: MatrixRow[] = [
  { code: PERMISSIONS.PROJECT_CREATE, label: 'Create project', module: 'Project', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.PROJECT_READ, label: 'Read project', module: 'Project', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: true, QA: true } },
  { code: PERMISSIONS.PROJECT_UPDATE, label: 'Update project', module: 'Project', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.PROJECT_DELETE, label: 'Delete project', module: 'Project', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.MODULE_CREATE, label: 'Create module', module: 'Module', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.TASK_CREATE, label: 'Create task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: false, QA: false } },
  { code: PERMISSIONS.TASK_READ, label: 'Read task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: true, QA: true } },
  { code: PERMISSIONS.TASK_UPDATE, label: 'Update task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.TASK_UPDATE_OWN, label: 'Update own task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: false, QA: false } },
  { code: PERMISSIONS.TASK_DELETE, label: 'Delete task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.TASK_ASSIGN, label: 'Assign task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.TASK_TRANSITION, label: 'Transition task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: false, QA: true } },
  { code: PERMISSIONS.TASK_COMMENT, label: 'Comment on task', module: 'Task', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: false, QA: true } },
  { code: PERMISSIONS.WORKLOG_CREATE, label: 'Create worklog', module: 'Worklog', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: false, QA: false } },
  { code: PERMISSIONS.REPORT_VIEW, label: 'View reports', module: 'Reports', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: false, PMO: true, QA: false } },
  { code: PERMISSIONS.REPORT_GENERATE, label: 'Generate reports', module: 'Reports', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.ANALYTICS_VIEW, label: 'View analytics', module: 'Analytics', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: true, QA: false } },
  { code: PERMISSIONS.AUDIT_READ, label: 'Read audit log', module: 'Audit', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.SEARCH_USE, label: 'Use search', module: 'Search', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: true, PMO: true, QA: true } },
  { code: PERMISSIONS.USER_CREATE, label: 'Create user', module: 'Users', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.USER_MANAGE_ROLES, label: 'Manage roles', module: 'Users', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.USER_DELETE, label: 'Delete user', module: 'Users', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.WORKFLOW_MANAGE, label: 'Manage workflow', module: 'Workflow', roles: { MANAGER: true, TEAM_LEAD: false, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.WORKFLOW_APPROVE, label: 'Approve workflow step', module: 'Workflow', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: false, PMO: false, QA: false } },
  { code: PERMISSIONS.QA_UPDATE, label: 'QA update', module: 'QA', roles: { MANAGER: true, TEAM_LEAD: true, TEAM_MEMBER: false, PMO: false, QA: true } },
];
