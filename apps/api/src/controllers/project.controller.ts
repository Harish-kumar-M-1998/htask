import { Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { projectService } from '../services/project/project.service.js';
import { param } from '../utils/helpers.js';
import { getValidatedQuery, ValidatedRequest } from '../middleware/validate.js';
import type { PaginationInput } from '@htask/shared';

async function getActorName(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });
  return user ? `${user.firstName} ${user.lastName}` : 'User';
}

export const projectController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = getValidatedQuery<PaginationInput>(req as ValidatedRequest);
      const result = await projectService.findAll(
        req.user!.organizationId,
        query?.page ?? (Number(req.query.page) || 1),
        query?.limit ?? (Number(req.query.limit) || 20),
        query?.search ?? (req.query.search as string | undefined),
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await projectService.findById(param(req, 'id'), req.user!.organizationId);
      res.json({ data: project });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      const project = await projectService.create(
        req.body,
        req.user!.organizationId,
        req.user!.id,
        actorName,
      );
      res.status(201).json({ data: project });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      const project = await projectService.update(
        param(req, 'id'),
        req.body,
        req.user!.organizationId,
        req.user!.id,
        actorName,
      );
      res.json({ data: project });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const actorName = await getActorName(req.user!.id);
      await projectService.softDelete(
        param(req, 'id'),
        req.user!.organizationId,
        req.user!.id,
        actorName,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const history = await projectService.getHistory(param(req, 'id'));
      res.json({ data: history });
    } catch (err) {
      next(err);
    }
  },

  async createModule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      if (!name) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Module name is required' } });
        return;
      }
      const actorName = await getActorName(req.user!.id);
      const module = await projectService.createModule(
        param(req, 'id'),
        name,
        req.user!.organizationId,
        req.user!.id,
        actorName,
      );
      res.status(201).json({ data: module });
    } catch (err) {
      next(err);
    }
  },
};
