import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { organizationService } from '../services/organization/organization.service.js';

export const organizationController = {
  async getCurrent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const org = await organizationService.getCurrent(req.user!.organizationId);
      res.json({ data: org });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const org = await organizationService.update(req.user!.organizationId, req.body);
      res.json({ data: org });
    } catch (err) {
      next(err);
    }
  },
};
