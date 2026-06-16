import { AuditAction } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { toJsonValue } from '../../utils/helpers.js';

interface AuditLogInput {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

class AuditService {
  async log(input: AuditLogInput) {
    const browser = parseBrowser(input.userAgent);
    const device = parseDevice(input.userAgent);

    return prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action as AuditAction,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValue: toJsonValue(input.oldValue),
        newValue: toJsonValue(input.newValue),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        browser: browser.name,
        device: device.type,
        os: device.os,
        requestId: input.requestId,
      },
    });
  }

  async findByOrganization(
    organizationId: string,
    filters: {
      action?: string;
      entityType?: string;
      userId?: string;
      from?: Date;
      to?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      ...(filters.action && { action: filters.action as AuditAction }),
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const enriched = await enrichAuditLogs(data);

    return {
      data: enriched,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByEntity(entityType: string, entityId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { entityType, entityId };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

function parseBrowser(ua?: string): { name: string } {
  if (!ua) return { name: 'Unknown' };
  if (ua.includes('Chrome')) return { name: 'Chrome' };
  if (ua.includes('Firefox')) return { name: 'Firefox' };
  if (ua.includes('Safari')) return { name: 'Safari' };
  if (ua.includes('Edge')) return { name: 'Edge' };
  return { name: 'Other' };
}

function parseDevice(ua?: string): { type: string; os: string } {
  if (!ua) return { type: 'Unknown', os: 'Unknown' };
  const type = ua.includes('Mobile') ? 'Mobile' : ua.includes('Tablet') ? 'Tablet' : 'Desktop';
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  return { type, os };
}

export const auditService = new AuditService();

type AuditLogRow = Awaited<ReturnType<typeof prisma.auditLog.findMany>>[number] & {
  user: { id: string; firstName: string; lastName: string; email: string } | null;
};

function resolveEntityType(action: string, entityType: string): string {
  if (entityType && entityType !== 'unknown') return entityType;
  const normalized = action.toUpperCase();
  if (normalized.startsWith('TASK_') || normalized === 'COMMENT_ADDED' || normalized === 'FILE_UPLOADED') {
    return 'task';
  }
  if (normalized.startsWith('PROJECT_')) return 'project';
  if (normalized.startsWith('USER_')) return 'user';
  if (normalized.startsWith('MODULE_')) return 'module';
  if (normalized.startsWith('WORKLOG_')) return 'worklog';
  if (normalized.startsWith('RELEASE_')) return 'release';
  return entityType || 'unknown';
}

function formatEntityTypeLabel(entityType: string): string {
  if (!entityType || entityType === 'unknown') return 'Record';
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

async function enrichAuditLogs(logs: AuditLogRow[]) {
  const taskIds = new Set<string>();
  const projectIds = new Set<string>();
  const userIds = new Set<string>();

  for (const log of logs) {
    const type = resolveEntityType(log.action, log.entityType);
    const id = log.entityId;
    if (!id || id === 'unknown' || id === 'system') continue;
    if (type === 'task') taskIds.add(id);
    else if (type === 'project') projectIds.add(id);
    else if (type === 'user') userIds.add(id);
  }

  const [tasks, projects, users] = await Promise.all([
    taskIds.size
      ? prisma.task.findMany({
          where: { id: { in: [...taskIds] } },
          select: { id: true, key: true, title: true },
        })
      : [],
    projectIds.size
      ? prisma.project.findMany({
          where: { id: { in: [...projectIds] } },
          select: { id: true, key: true, name: true },
        })
      : [],
    userIds.size
      ? prisma.user.findMany({
          where: { id: { in: [...userIds] } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [],
  ]);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return logs.map((log) => {
    const entityType = resolveEntityType(log.action, log.entityType);
    const entityLabel = buildEntityLabel(entityType, log.entityId, taskMap, projectMap, userMap);
    const details = buildAuditDetails(log);

    return {
      ...log,
      entityType,
      entityTypeLabel: formatEntityTypeLabel(entityType),
      entityLabel,
      details,
    };
  });
}

function buildEntityLabel(
  entityType: string,
  entityId: string,
  taskMap: Map<string, { key: string; title: string }>,
  projectMap: Map<string, { key: string; name: string }>,
  userMap: Map<string, { firstName: string; lastName: string; email: string }>,
): string {
  if (!entityId || entityId === 'unknown' || entityId === 'system') {
    return '—';
  }

  if (entityType === 'task') {
    const task = taskMap.get(entityId);
    if (task) return `${task.key} · ${task.title}`;
  }

  if (entityType === 'project') {
    const project = projectMap.get(entityId);
    if (project) return `${project.key} · ${project.name}`;
  }

  if (entityType === 'user') {
    const user = userMap.get(entityId);
    if (user) return `${user.firstName} ${user.lastName}`;
  }

  return '—';
}

function buildAuditDetails(log: AuditLogRow): string | null {
  const newValue = log.newValue as Record<string, unknown> | null;
  if (log.action === 'TASK_TRANSITIONED' && newValue?.toState) {
    return `Status → ${String(newValue.toState).replace(/_/g, ' ')}`;
  }
  if (log.action === 'TASK_CREATED' && newValue?.title) {
    return String(newValue.title);
  }
  if (log.action === 'PROJECT_CREATED' && newValue?.name) {
    return String(newValue.name);
  }
  return null;
}
