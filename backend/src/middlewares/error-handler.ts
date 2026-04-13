import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/utils/app-error';
import { sendError } from '../shared/utils/api-response';
import { env } from '../config/env';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  // Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      const fields = prismaError.meta?.target?.join(', ') || 'unknown';
      sendError(res, 409, `Unique constraint violation on: ${fields}`, 'CONFLICT');
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 404, 'Record not found', 'NOT_FOUND');
      return;
    }
  }

  console.error('Unhandled error:', err);

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  sendError(res, 500, message, 'INTERNAL_ERROR');
}
