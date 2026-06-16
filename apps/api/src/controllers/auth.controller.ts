import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { authService } from '../services/auth/auth.service.js';

export const authController = {
  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(
        req.body.email,
        req.body.password,
        req.ip,
        req.headers['user-agent'],
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(
        req.body.refreshToken,
        req.user!.id,
        req.user!.organizationId,
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.id);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },
};
