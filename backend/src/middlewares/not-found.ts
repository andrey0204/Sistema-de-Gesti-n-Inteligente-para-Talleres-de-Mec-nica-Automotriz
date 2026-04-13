import { Request, Response } from 'express';
import { sendError } from '../shared/utils/api-response';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, 'Route not found', 'NOT_FOUND');
}
