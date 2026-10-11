import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config/env', () => ({ env: { STORAGE_PROVIDER: 'cloudinary' } }));
const mocks = vi.hoisted(() => ({
  localUpload: vi.fn(), localDelete: vi.fn(), remoteUpload: vi.fn(), remoteDelete: vi.fn(),
}));
vi.mock('../../src/shared/storage/local-storage', () => ({ LocalStorageService: class {
  uploadFile = mocks.localUpload;
  deleteFile = mocks.localDelete;
} }));
vi.mock('../../src/shared/storage/cloudinary-storage', () => ({ CloudinaryStorageService: class {
  uploadFile = mocks.remoteUpload;
  deleteFile = mocks.remoteDelete;
} }));

import { env } from '../../src/config/env';
import { storageService } from '../../src/shared/storage/storage';

beforeEach(() => { vi.resetAllMocks(); env.STORAGE_PROVIDER = 'cloudinary'; });

describe('selección de almacenamiento', () => {
  const file = { buffer: Buffer.from('image'), originalName: 'photo.png', mimeType: 'image/png', size: 5 };

  it('sube al proveedor configurado', async () => {
    await storageService.uploadFile(file);
    expect(mocks.remoteUpload).toHaveBeenCalledWith(file);
    expect(mocks.localUpload).not.toHaveBeenCalled();
    env.STORAGE_PROVIDER = 'local';
    await storageService.uploadFile(file);
    expect(mocks.localUpload).toHaveBeenCalledWith(file);
  });

  it('borra una fotografía local antigua aunque Cloudinary esté activo', async () => {
    await storageService.deleteFile({ filename: 'photo.png', path: '/uploads/photo.png' });
    expect(mocks.localDelete).toHaveBeenCalledWith('photo.png');
    expect(mocks.remoteDelete).not.toHaveBeenCalled();
  });

  it('borra una fotografía remota aunque el proveedor haya cambiado a local', async () => {
    env.STORAGE_PROVIDER = 'local';
    await storageService.deleteFile({ filename: 'folder/photo', path: 'https://res.cloudinary.com/demo/photo.png' });
    expect(mocks.remoteDelete).toHaveBeenCalledWith('folder/photo');
    expect(mocks.localDelete).not.toHaveBeenCalled();
  });
});
