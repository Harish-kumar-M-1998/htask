import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export interface ValidatedRequest extends Request {
  validated?: Partial<Record<ValidationTarget, unknown>>;
}

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: ValidatedRequest, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }

    if (target === 'body') {
      req.body = result.data;
    } else {
      // Express 5 exposes query/params as read-only getters
      req.validated = { ...req.validated, [target]: result.data };
    }

    next();
  };
}

export function getValidatedQuery<T>(req: ValidatedRequest): T | undefined {
  return req.validated?.query as T | undefined;
}
