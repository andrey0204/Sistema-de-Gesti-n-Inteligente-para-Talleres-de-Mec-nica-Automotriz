import { Response } from 'express';
import { PaginationMeta } from '../types/pagination';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
  const response: SuccessResponse<T> = { success: true, data };
  if (message) response.message = message;
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message: string = 'Resource created successfully'): void {
  sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(res: Response, data: T[], meta: PaginationMeta): void {
  const response: PaginatedResponse<T> = { success: true, data, meta };
  res.status(200).json(response);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code: string = 'INTERNAL_ERROR',
  details?: unknown,
): void {
  const response: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (details) response.error.details = details;
  res.status(statusCode).json(response);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
