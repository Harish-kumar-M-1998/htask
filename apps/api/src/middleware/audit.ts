import { Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { AuthRequest } from './auth.js';
import { auditService } from '../services/audit/audit.service.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const RESOURCE_SEGMENTS: Record<string, string> = {
  tasks: 'task',
  projects: 'project',
  users: 'user',
  modules: 'module',
  releases: 'release',
  worklogs: 'worklog',
  reports: 'report',
  notifications: 'notification',
  workflows: 'workflow',
  organizations: 'organization',
  permissions: 'permission',
};

export function requestId(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  req.requestId = (req.headers['x-request-id'] as string) || uuid();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

export function auditMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let auditLogged = false;

  const logAuditIfNeeded = () => {
    if (auditLogged || res.statusCode >= 400 || !req.user) return;

    const path = req.originalUrl.split('?')[0];
    const action = mapMethodToAction(req.method, path);
    if (!action) return;

    const entityType = extractEntityType(path, action);
    const entityId = extractEntityId(path, req.params as Record<string, string | string[] | undefined>);

    auditLogged = true;
    auditService
      .log({
        organizationId: req.user.organizationId,
        userId: req.user.id,
        action,
        entityType,
        entityId: entityId ?? 'system',
        newValue: req.method !== 'DELETE' ? (req.body as Record<string, unknown>) : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.requestId,
      })
      .catch(() => {
        // Audit failures should not block response
      });
  };

  res.json = function (body: unknown) {
    logAuditIfNeeded();
    return originalJson(body);
  };

  res.send = function (body?: unknown) {
    logAuditIfNeeded();
    return originalSend(body);
  };

  next();
}

function mapMethodToAction(method: string, path: string): string | null {
  if (shouldSkipAudit(path)) return null;

  if (path.includes('/auth/login')) return 'USER_LOGIN';
  if (path.includes('/auth/logout')) return 'USER_LOGOUT';
  if (path.includes('/notifications/email-config') && method === 'PATCH') return 'PERMISSION_UPDATED';
  if (path.includes('/notifications/preferences') && method === 'PATCH') return null;
  if (path.includes('/transition')) return 'TASK_TRANSITIONED';
  if (path.includes('/comments')) return 'COMMENT_ADDED';
  if (path.includes('/attachments')) return 'FILE_UPLOADED';
  if (path.includes('/worklogs/start')) return 'WORKLOG_STARTED';
  if (path.includes('/reports/generate')) return 'REPORT_GENERATED';

  const entity = extractEntityType(path);
  const actionMap: Record<string, string> = {
    POST: entity === 'report' ? 'REPORT_GENERATED' : `${entity.toUpperCase()}_CREATED`,
    PATCH: `${entity.toUpperCase()}_UPDATED`,
    PUT: `${entity.toUpperCase()}_UPDATED`,
    DELETE: `${entity.toUpperCase()}_DELETED`,
  };
  const action = actionMap[method] || null;
  if (action && !VALID_AUDIT_ACTIONS.has(action)) return null;
  return action;
}

const VALID_AUDIT_ACTIONS = new Set([
  'USER_LOGIN', 'USER_LOGOUT', 'USER_LOGIN_FAILED', 'TOKEN_REFRESHED', 'PASSWORD_CHANGED',
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED',
  'ORGANIZATION_UPDATED',
  'MODULE_CREATED', 'MODULE_UPDATED', 'MODULE_DELETED',
  'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'TASK_TRANSITIONED', 'TASK_ASSIGNED',
  'COMMENT_ADDED', 'COMMENT_UPDATED', 'COMMENT_DELETED',
  'FILE_UPLOADED', 'FILE_DELETED',
  'WORKLOG_STARTED', 'WORKLOG_PAUSED', 'WORKLOG_RESUMED', 'WORKLOG_STOPPED',
  'ROLE_CHANGED', 'PERMISSION_UPDATED',
  'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED',
  'REPORT_GENERATED', 'REPORT_EXPORTED',
  'WORKFLOW_APPROVED', 'WORKFLOW_REJECTED', 'WORKFLOW_UPDATED',
  'RELEASE_CREATED', 'RELEASE_UPDATED',
  'BACKLOG_CREATED', 'BACKLOG_UPDATED',
]);

function shouldSkipAudit(path: string): boolean {
  if (path.includes('/notifications/') && !path.includes('/notifications/email-config')) return true;
  return false;
}

function extractEntityType(path: string, action?: string | null): string {
  const segments = path.split('/').filter(Boolean);
  for (const segment of segments) {
    const normalized = segment.toLowerCase();
    if (RESOURCE_SEGMENTS[normalized]) {
      return RESOURCE_SEGMENTS[normalized];
    }
  }

  if (action?.startsWith('TASK_') || path.includes('/transition') || path.includes('/comments') || path.includes('/attachments')) {
    return 'task';
  }
  if (action?.startsWith('PROJECT_')) return 'project';
  if (action?.startsWith('USER_')) return 'user';
  if (action?.startsWith('WORKLOG_')) return 'worklog';

  return 'unknown';
}

function pickParam(
  params: Record<string, string | string[] | undefined>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = params[key];
    if (!value) continue;
    return Array.isArray(value) ? value[0] : value;
  }
  return null;
}

function extractEntityId(
  path: string,
  params: Record<string, string | string[] | undefined>,
): string | null {
  const fromParams = pickParam(params, 'id', 'taskId', 'projectId', 'userId', 'moduleId');
  if (fromParams) return fromParams;

  const uuidMatch = path.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );
  return uuidMatch?.[0] ?? null;
}
