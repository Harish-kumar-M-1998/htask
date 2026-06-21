import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { taskService } from '../services/task/task.service.js';
import { workflowService } from '../services/workflow/workflow.service.js';
import { param } from '../utils/helpers.js';

async function getActorName(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });
  return user ? `${user.firstName} ${user.lastName}` : 'User';
}

export const taskController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await taskService.findAll(req.user!.organizationId, {
        projectId: req.query.projectId as string,
        moduleId: req.query.moduleId as string,
        status: req.query.status as never,
        assigneeId: req.query.assigneeId as string,
        type: req.query.type as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
        dueDateFrom: req.query.dueDateFrom as string,
        dueDateTo: req.query.dueDateTo as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await taskService.findById(param(req, 'id'), req.user!.organizationId);
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      const task = await taskService.create(
        req.body,
        req.user!.id,
        req.user!.organizationId,
        actorName,
      );
      res.status(201).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      const task = await taskService.update(
        param(req, 'id'),
        req.body,
        req.user!.id,
        req.user!.permissions,
        actorName,
        req.user!.organizationId,
      );
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      await taskService.softDelete(param(req, 'id'), req.user!.id, req.user!.permissions, actorName, req.user!.organizationId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async transition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      const task = await workflowService.transition({
        taskId: param(req, 'id'),
        toState: req.body.toState,
        userId: req.user!.id,
        userRoles: req.user!.roles,
        actorName,
        comment: req.body.comment,
        metadata: req.body.metadata,
        organizationId: req.user!.organizationId,
      });
      res.json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async getTransitions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transitions = await workflowService.getAvailableTransitions(
        param(req, 'id'),
        req.user!.roles,
        req.user!.organizationId,
      );
      res.json({ data: transitions });
    } catch (err) {
      next(err);
    }
  },

  async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      const comment = await taskService.addComment(
        param(req, 'id'),
        req.user!.id,
        req.body.content,
        actorName,
        req.body.parentId,
        req.user!.organizationId,
      );
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const history = await taskService.getHistory(param(req, 'id'), req.user!.organizationId);
      res.json({ data: history });
    } catch (err) {
      next(err);
    }
  },
};
