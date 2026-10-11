import crypto from 'crypto';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env';
import { AppError } from '../utils/app-error';
import { FileInfo, StorageService, UploadFile } from './storage.interface';

export class CloudinaryStorageService implements StorageService {
  private configure(): void {
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      throw new AppError(503, 'Cloudinary storage is not configured', 'STORAGE_UNAVAILABLE');
    }
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadFile(file: UploadFile): Promise<FileInfo> {
    this.configure();
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        resource_type: 'image',
        public_id: `taller-mecanico/work-orders/${crypto.randomBytes(16).toString('hex')}`,
        overwrite: false,
        // Usamos el callback; evita una promesa interna rechazada sin consumidor.
        disable_promises: true,
        timeout: 60000,
      }, (error, response) => {
        if (error || !response) {
          reject(new AppError(502, 'Could not upload image to Cloudinary', 'STORAGE_ERROR'));
        } else {
          resolve(response);
        }
      });
      stream.on('error', () => reject(new AppError(502, 'Could not upload image to Cloudinary', 'STORAGE_ERROR')));
      stream.end(file.buffer);
    });
    return {
      filename: result.public_id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      path: result.secure_url,
      size: result.bytes,
    };
  }

  async deleteFile(filename: string): Promise<void> {
    this.configure();
    try {
      const result = await cloudinary.uploader.destroy(filename, { resource_type: 'image', invalidate: true });
      if (result.result !== 'ok' && result.result !== 'not found') throw new Error('Deletion failed');
    } catch {
      throw new AppError(502, 'Could not delete image from Cloudinary', 'STORAGE_ERROR');
    }
  }
}
