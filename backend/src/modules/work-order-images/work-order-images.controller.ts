import { Request, Response } from 'express';
import * as imagesService from './work-order-images.service';
import { sendSuccess, sendCreated } from '../../shared/utils/api-response';
import { AppError } from '../../shared/utils/app-error';

export async function list(req: Request, res: Response): Promise<void> {
  const images = await imagesService.list(Number(req.params.workOrderId), req.user!);
  sendSuccess(res, images);
}

export async function upload(req: Request, res: Response): Promise<void> {
  if (!req.file) throw AppError.badRequest('Image file is required');

  const image = await imagesService.upload(
    Number(req.params.workOrderId),
    {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      path: req.file.path,
      size: req.file.size,
    },
    req.user!,
  );
  sendCreated(res, image);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await imagesService.remove(
    Number(req.params.workOrderId),
    Number(req.params.id),
    req.user!,
  );
  sendSuccess(res, null, 'Image deleted successfully');
}
