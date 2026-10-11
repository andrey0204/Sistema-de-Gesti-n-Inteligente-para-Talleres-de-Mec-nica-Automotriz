import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env';
import { FileInfo, StorageService, UploadFile } from './storage.interface';

export class LocalStorageService implements StorageService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.UPLOAD_DIR);
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  async uploadFile(file: UploadFile): Promise<FileInfo> {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
    };
    const filename = `${crypto.randomBytes(16).toString('hex')}${extensions[file.mimeType]}`;
    const filePath = this.getFilePath(filename);
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.writeFile(filePath, file.buffer, { flag: 'wx' });
    return { filename, originalName: file.originalName, mimeType: file.mimeType, path: filePath, size: file.size };
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
