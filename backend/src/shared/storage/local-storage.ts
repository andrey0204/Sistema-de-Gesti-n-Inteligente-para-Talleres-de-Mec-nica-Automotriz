import fs from 'fs/promises';
import path from 'path';
import { env } from '../../config/env';
import { StorageService } from './storage.interface';

export class LocalStorageService implements StorageService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.UPLOAD_DIR);
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = this.getFilePath(filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

export const storageService = new LocalStorageService();
