import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { userService } from '../services/user/user.service.js';
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
};
