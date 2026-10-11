import { env } from '../../config/env';
import { CloudinaryStorageService } from './cloudinary-storage';
import { LocalStorageService } from './local-storage';
import { FileInfo, UploadFile } from './storage.interface';

const local = new LocalStorageService();
const remote = new CloudinaryStorageService();

export const storageService = {
  uploadFile(file: UploadFile): Promise<FileInfo> {
    return (env.STORAGE_PROVIDER === 'cloudinary' ? remote : local).uploadFile(file);
  },

  deleteFile(file: Pick<FileInfo, 'filename' | 'path'>): Promise<void> {
    // El proveedor del archivo guardado puede diferir del proveedor actual.
    return (file.path.startsWith('https://res.cloudinary.com/') ? remote : local).deleteFile(file.filename);
  },
};
