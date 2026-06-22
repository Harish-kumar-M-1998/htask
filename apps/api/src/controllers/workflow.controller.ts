import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { workflowService } from '../services/workflow/workflow.service.js';
import { param } from '../utils/helpers.js';

export const workflowController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workflows = await workflowService.findAll(req.user!.organizationId);
      res.json({ data: workflows });
    } catch (err) {
      next(err);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workflow = await workflowService.getById(param(req, 'id'), req.user!.organizationId);
      res.json({ data: workflow });
    } catch (err) {
      next(err);
    }
  },

  async updateTransition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transition = await workflowService.updateTransition(
        param(req, 'id'),
        param(req, 'transitionId'),
        req.user!.organizationId,
        req.body,
      );
      res.json({ data: transition });
    } catch (err) {
      next(err);
    }
  },
};
