import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { ForbiddenError } from '../utils/errors.js';

export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError());
      return;
    }

    const hasPermission = permissions.some((p) =>
      req.user!.permissions.includes(p),
    );

    if (!hasPermission) {
      next(new ForbiddenError(`Missing permission: ${permissions.join(' or ')}`));
      return;
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError());
      return;
    }

    const hasRole = roles.some((r) => req.user!.roles.includes(r));
    if (!hasRole) {
      next(new ForbiddenError(`Missing role: ${roles.join(' or ')}`));
      return;
    }

    next();
  };
}
