import { Request, Response } from 'express';
import * as reportsService from './reports.service';
import { sendSuccess } from '../../shared/utils/api-response';

export async function ordersByPeriod(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as unknown as { from: Date; to: Date };
  const report = await reportsService.ordersByPeriod(new Date(from), new Date(to));
  sendSuccess(res, report);
}

export async function ordersByStatus(_req: Request, res: Response): Promise<void> {
  const report = await reportsService.ordersByStatus();
  sendSuccess(res, report);
}

export async function vehiclesByPeriod(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as unknown as { from: Date; to: Date };
  const report = await reportsService.vehiclesByPeriod(new Date(from), new Date(to));
  sendSuccess(res, report);
}

export async function clientsByPeriod(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query as unknown as { from: Date; to: Date };
  const report = await reportsService.clientsByPeriod(new Date(from), new Date(to));
  sendSuccess(res, report);
}
