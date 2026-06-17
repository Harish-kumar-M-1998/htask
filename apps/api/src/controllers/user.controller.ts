import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { userService } from '../services/user/user.service.js';
import { param } from '../utils/helpers.js';
import { getValidatedQuery, ValidatedRequest } from '../middleware/validate.js';
import type { PaginationInput } from '@htask/shared';

export const userController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = getValidatedQuery<PaginationInput>(req as ValidatedRequest);
      const result = await userService.findAll(
        req.user!.organizationId,
        query?.page ?? (Number(req.query.page) || 1),
        query?.limit ?? (Number(req.query.limit) || 50),
        query?.search ?? (req.query.search as string | undefined),
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.create(req.body, req.user!.organizationId);
      res.status(201).json({ data: user });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await userService.softDelete(param(req, 'id'), req.user!.organizationId, req.user!.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async updateRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateRoles(
        param(req, 'id'),
        req.body.roleCodes,
        req.user!.organizationId,
        req.user!.id,
      );
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },
};
