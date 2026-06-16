import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';
import { toJsonValue } from '../../utils/helpers.js';
import type { CreateProjectInput } from '@htask/shared';

type UpdateProjectInput = Partial<CreateProjectInput> & {
  status?: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  memberIds?: string[];
};

class ProjectService {
  async findAll(organizationId: string, page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      organizationId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { key: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          members: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          _count: { select: { tasks: true, modules: true, members: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        modules: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        members: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          },
        },
        releases: { where: { deletedAt: null }, orderBy: { plannedDate: 'asc' } },
        _count: { select: { tasks: true } },
      },
    });

    if (!project) throw new NotFoundError('Project');
    return project;
  }

  async create(
    input: CreateProjectInput,
    organizationId: string,
    userId: string,
    actorName: string,
  ) {
    const memberIds = [...new Set([userId, ...(input.memberIds ?? [])])];

    const project = await prisma.project.create({
      data: {
        organizationId,
        name: input.name,
        key: input.key,
        description: input.description,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        createdById: userId,
        members: {
          create: memberIds.map((uid) => ({
            userId: uid,
            role: uid === userId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    });

    await this.recordHistory(project.id, 'CREATED', `Project "${input.name}" created`, userId, actorName);
    await auditService.log({
      organizationId,
      userId,
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: project.id,
      newValue: { name: input.name, key: input.key, memberIds },
    });

    return project;
  }

  async update(
    id: string,
    input: UpdateProjectInput,
    organizationId: string,
    userId: string,
    actorName: string,
  ) {
    const existing = await this.findById(id, organizationId);
    const oldSnapshot = {
      name: existing.name,
      key: existing.key,
      description: existing.description,
      status: existing.status,
      members: existing.members.map((m) => m.userId),
    };

    const project = await prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.key && { key: input.key }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.status && { status: input.status }),
          ...(input.startDate && { startDate: new Date(input.startDate) }),
          ...(input.endDate && { endDate: new Date(input.endDate) }),
        },
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          _count: { select: { tasks: true, modules: true, members: true } },
        },
      });

      if (input.memberIds !== undefined) {
        const memberIds = [...new Set([existing.createdById, ...input.memberIds])];
        await tx.projectMember.deleteMany({ where: { projectId: id } });
        await tx.projectMember.createMany({
          data: memberIds.map((uid) => ({
            projectId: id,
            userId: uid,
            role: uid === existing.createdById ? 'OWNER' : 'MEMBER',
          })),
        });
      }

      return updated;
    });

    const refreshed = await this.findById(id, organizationId);

    await this.recordHistory(
      id,
      'UPDATED',
      `Project "${refreshed.name}" updated`,
      userId,
      actorName,
      [
        ...(input.name && input.name !== oldSnapshot.name
          ? [{ field: 'name', oldValue: oldSnapshot.name, newValue: input.name }]
          : []),
        ...(input.memberIds
          ? [{ field: 'members', oldValue: oldSnapshot.members, newValue: input.memberIds }]
          : []),
      ],
    );

    await auditService.log({
      organizationId,
      userId,
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: id,
      oldValue: oldSnapshot,
      newValue: input as Record<string, unknown>,
    });

    return refreshed;
  }

  async softDelete(id: string, organizationId: string, userId: string, actorName: string) {
    const existing = await this.findById(id, organizationId);

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: userId },
    });

    await this.recordHistory(
      id,
      'DELETED',
      `Project "${existing.name}" deleted`,
      userId,
      actorName,
    );

    await auditService.log({
      organizationId,
      userId,
      action: 'PROJECT_DELETED',
      entityType: 'project',
      entityId: id,
      oldValue: { name: existing.name, key: existing.key },
    });
  }

  async getHistory(projectId: string) {
    return prisma.entityHistory.findMany({
      where: { entityType: 'project', entityId: projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createModule(
    projectId: string,
    name: string,
    organizationId: string,
    userId: string,
    actorName: string,
  ) {
    await this.findById(projectId, organizationId);

    const count = await prisma.module.count({
      where: { projectId, deletedAt: null },
    });

    const module = await prisma.module.create({
      data: { projectId, name: name.trim(), sortOrder: count },
    });

    await this.recordHistory(
      projectId,
      'MODULE_CREATED',
      `Module "${name.trim()}" added`,
      userId,
      actorName,
    );

    return module;
  }

  private async recordHistory(
    projectId: string,
    action: string,
    description: string,
    actorId: string,
    actorName: string,
    changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [],
  ) {
    await prisma.entityHistory.create({
      data: {
        entityType: 'project',
        entityId: projectId,
        action,
        description,
        actorId,
        actorName,
        changes: toJsonValue(changes),
      },
    });
  }
}

export const projectService = new ProjectService();
