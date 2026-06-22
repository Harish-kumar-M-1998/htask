import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { roleService } from '../services/role/role.service.js';
import { param } from '../utils/helpers.js';

export const roleController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roles = await roleService.listWithPermissions(req.user!.organizationId);
      res.json({ data: roles });
    } catch (err) {
      next(err);
    }
  },

  async listPermissions(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const permissions = await roleService.listPermissions();
      res.json({ data: permissions });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = await roleService.create(req.body, req.user!.organizationId, req.user!.id);
      res.status(201).json({ data: role });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = await roleService.update(
        param(req, 'id'),
        req.body,
        req.user!.organizationId,
        req.user!.id,
      );
      res.json({ data: role });
    } catch (err) {
      next(err);
    }
  },

  async updatePermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const role = await roleService.updatePermissions(
        param(req, 'id'),
        req.body,
        req.user!.organizationId,
        req.user!.id,
      );
      res.json({ data: role });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await roleService.remove(
        param(req, 'id'),
        req.user!.organizationId,
        req.user!.id,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
};
