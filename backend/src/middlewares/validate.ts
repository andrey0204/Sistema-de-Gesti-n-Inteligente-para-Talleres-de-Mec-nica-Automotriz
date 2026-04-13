import { Request, Response, NextFunction } from 'express';
import { z } from 'zod/v4';
import { AppError } from '../shared/utils/app-error';

interface ValidationSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: { field: string; message: string }[] = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({ field: `body.${issue.path.join('.')}`, message: issue.message });
        }
      } else {
        req.body = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({ field: `params.${issue.path.join('.')}`, message: issue.message });
        }
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({ field: `query.${issue.path.join('.')}`, message: issue.message });
        }
      } else {
        // Express 5: req.query is a getter, store parsed data in req.parsedQuery
        (req as Request & { parsedQuery: unknown }).parsedQuery = result.data;
      }
    }

    if (errors.length > 0) {
      throw AppError.validationError('Validation failed', errors);
    }

    next();
  };
}
