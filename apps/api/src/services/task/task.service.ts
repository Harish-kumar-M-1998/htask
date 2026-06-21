import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { eventBus } from '../../events/eventBus.js';
import { toJsonValue } from '../../utils/helpers.js';
import type { CreateTaskInput } from '@htask/shared';

type TaskChange = { field: string; oldValue: unknown; newValue: unknown };

class TaskService {
  async findAll(
    organizationId: string,
    filters: {
      projectId?: string;
      moduleId?: string;
      status?: TaskStatus;
      assigneeId?: string;
      type?: string;
      priority?: string;
      search?: string;
      dueDateFrom?: string;
      dueDateTo?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      project: { organizationId },
      ...(filters.projectId && { projectId: filters.projectId }),
      ...(filters.moduleId && { moduleId: filters.moduleId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type as Prisma.EnumTaskTypeFilter }),
      ...(filters.priority && { priority: filters.priority as Prisma.EnumTaskPriorityFilter }),
      ...(filters.assigneeId && {
        assignees: { some: { userId: filters.assigneeId } },
      }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { key: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.dueDateFrom || filters.dueDateTo
        ? {
            dueDate: {
              ...(filters.dueDateFrom && { gte: new Date(filters.dueDateFrom) }),
              ...(filters.dueDateTo && { lte: new Date(`${filters.dueDateTo}T23:59:59.999Z`) }),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
          module: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, key: true } },
          labels: true,
          _count: { select: { comments: true, worklogs: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, organizationId?: string) {
    const where: Prisma.TaskWhereInput = { id };
    if (organizationId) {
      where.project = { organizationId };
    }

    const task = await prisma.task.findFirst({
      where,
      include: {
        assignees: { include: { user: true } },
        module: true,
        project: true,
        labels: true,
        comments: {
          where: { deletedAt: null },
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        histories: { orderBy: { createdAt: 'desc' }, take: 50 },
        attachments: { where: { deletedAt: null } },
      },
    });

    if (!task) throw new NotFoundError('Task');
    return task;
  }

  async create(input: CreateTaskInput, userId: string, organizationId: string, actorName: string) {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    });
    if (!project) throw new NotFoundError('Project');

    const taskCount = await prisma.task.count({ where: { projectId: input.projectId } });
    const key = `${project.key}-${taskCount + 1}`;

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          projectId: input.projectId,
          moduleId: input.moduleId,
          key,
          title: input.title,
          description: input.description,
          type: input.type,
          priority: input.priority,
          storyPoints: input.storyPoints,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          estimatedHours: input.estimatedHours,
          createdById: userId,
          status: input.assigneeIds?.length ? 'ASSIGNED' : 'OPEN',
          assignees: input.assigneeIds?.length
            ? {
                create: input.assigneeIds.map((assigneeId) => ({
                  userId: assigneeId,
                  assignedBy: userId,
                })),
              }
            : undefined,
          labels: input.labelNames?.length
            ? { create: input.labelNames.map((name) => ({ name })) }
            : undefined,
        },
        include: {
          assignees: { include: { user: true } },
          project: true,
          module: true,
        },
      });

      await tx.taskHistory.create({
        data: {
          taskId: created.id,
          action: 'CREATED',
          actorId: userId,
          actorName,
          description: `Task ${key} "${input.title}" created`,
        },
      });

      await tx.entityHistory.create({
        data: {
          entityType: 'task',
          entityId: created.id,
          action: 'CREATED',
          description: `Task ${key} "${input.title}" created`,
          actorId: userId,
          actorName,
        },
      });

      return created;
    });

    eventBus.emit('task:created', { task, actorId: userId });
    return task;
  }

  async update(
    id: string,
    data: Partial<CreateTaskInput>,
    userId: string,
    permissions: string[],
    actorName: string,
    organizationId?: string,
  ) {
    const task = await this.findById(id, organizationId);

    const canUpdate =
      permissions.includes('task:update') ||
      (permissions.includes('task:update_own') && task.createdById === userId);

    if (!canUpdate) throw new ForbiddenError();

    const changes: TaskChange[] = [];
    if (data.title !== undefined && data.title !== task.title) {
      changes.push({ field: 'title', oldValue: task.title, newValue: data.title });
    }
    if (data.description !== undefined && data.description !== task.description) {
      changes.push({ field: 'description', oldValue: task.description, newValue: data.description });
    }
    if (data.type !== undefined && data.type !== task.type) {
      changes.push({ field: 'type', oldValue: task.type, newValue: data.type });
    }
    if (data.priority !== undefined && data.priority !== task.priority) {
      changes.push({ field: 'priority', oldValue: task.priority, newValue: data.priority });
    }
    if (data.storyPoints !== undefined && data.storyPoints !== task.storyPoints) {
      changes.push({ field: 'storyPoints', oldValue: task.storyPoints, newValue: data.storyPoints });
    }
    if (data.dueDate !== undefined) {
      const nextDue = data.dueDate ? new Date(data.dueDate).toISOString() : null;
      const prevDue = task.dueDate ? new Date(task.dueDate).toISOString() : null;
      if (nextDue !== prevDue) {
        changes.push({ field: 'dueDate', oldValue: prevDue, newValue: nextDue });
      }
    }
    if (data.estimatedHours !== undefined && data.estimatedHours !== task.estimatedHours) {
      changes.push({ field: 'estimatedHours', oldValue: task.estimatedHours, newValue: data.estimatedHours });
    }
    if (data.moduleId !== undefined && data.moduleId !== task.moduleId) {
      changes.push({ field: 'module', oldValue: task.moduleId, newValue: data.moduleId || null });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.type && { type: data.type }),
          ...(data.priority && { priority: data.priority }),
          ...(data.storyPoints !== undefined && { storyPoints: data.storyPoints }),
          ...(data.dueDate !== undefined && {
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
          }),
          ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
          ...(data.moduleId !== undefined && { moduleId: data.moduleId || null }),
        },
        include: { assignees: { include: { user: true } }, project: true, module: true },
      });

      if (changes.length > 0) {
        const fieldLabels = changes.map((c) => c.field).join(', ');
        await tx.taskHistory.create({
          data: {
            taskId: id,
            action: 'UPDATED',
            actorId: userId,
            actorName,
            description: `Updated ${fieldLabels}`,
            changes: toJsonValue(changes),
          },
        });
      }

      return result;
    });

    if (changes.length > 0) {
      eventBus.emit('task:updated', { task: updated, actorId: userId });
    }
    return updated;
  }

  async softDelete(id: string, userId: string, permissions: string[], actorName: string, organizationId?: string) {
    const task = await this.findById(id, organizationId);

    const canDelete =
      permissions.includes('task:delete') ||
      (permissions.includes('task:delete_own') && task.createdById === userId);

    if (!canDelete) throw new ForbiddenError();

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: userId },
      });

      await tx.taskHistory.create({
        data: {
          taskId: id,
          action: 'DELETED',
          actorId: userId,
          actorName,
          description: `Task ${task.key} "${task.title}" deleted`,
        },
      });
    });

    eventBus.emit('task:deleted', { task, actorId: userId });
    return task;
  }

  async addComment(taskId: string, userId: string, content: string, actorName: string, parentId?: string, organizationId?: string) {
    await this.findById(taskId, organizationId);

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.taskComment.create({
        data: { taskId, userId, content, parentId },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      });

      await tx.taskHistory.create({
        data: {
          taskId,
          action: 'COMMENT',
          actorId: userId,
          actorName,
          description: `Added a comment`,
        },
      });

      return created;
    });

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    eventBus.emit('comment:added', { task, comment, actorId: userId });

    return comment;
  }

  async getHistory(taskId: string, organizationId?: string) {
    await this.findById(taskId, organizationId);
    return prisma.taskHistory.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const taskService = new TaskService();
