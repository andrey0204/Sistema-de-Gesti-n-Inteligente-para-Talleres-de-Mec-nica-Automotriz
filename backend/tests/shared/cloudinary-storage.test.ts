import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Writable } from 'node:stream';

vi.mock('../../src/config/env', () => ({ env: {
  CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'test-key', CLOUDINARY_API_SECRET: 'test-secret',
} }));
vi.mock('cloudinary', () => ({ v2: {
  config: vi.fn(), uploader: { upload_stream: vi.fn(), destroy: vi.fn() },
} }));

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorageService } from '../../src/shared/storage/cloudinary-storage';

const sdk = vi.mocked(cloudinary, true);
const service = new CloudinaryStorageService();
const file = { buffer: Buffer.from('image'), originalName: 'photo.png', mimeType: 'image/png', size: 5 };

beforeEach(() => vi.resetAllMocks());

describe('Cloudinary', () => {
  it('sube el buffer y conserva el identificador y URL HTTPS', async () => {
    sdk.uploader.upload_stream.mockImplementation((options, callback) => new Writable({
      write(buffer, _encoding, done) {
        expect(buffer).toEqual(file.buffer);
        callback!(undefined, { public_id: 'folder/photo', secure_url: 'https://res.cloudinary.com/demo/photo.png', bytes: 5 } as never);
        done();
      },
    }) as never);
    await expect(service.uploadFile(file)).resolves.toMatchObject({
      filename: 'folder/photo', path: 'https://res.cloudinary.com/demo/photo.png', size: 5,
    });
    expect(sdk.uploader.upload_stream).toHaveBeenCalledWith(expect.objectContaining({ resource_type: 'image', overwrite: false }), expect.any(Function));
  });

  it('devuelve un error controlado sin divulgar el error del SDK', async () => {
    sdk.uploader.upload_stream.mockImplementation((_options, callback) => new Writable({
      write(_buffer, _encoding, done) {
        callback!({ message: 'Sensitive provider information', http_code: 401 } as never);
        done();
      },
    }) as never);
    await expect(service.uploadFile(file)).rejects.toMatchObject({ statusCode: 502, message: 'Could not upload image to Cloudinary' });
  });

  it('elimina por public_id e invalida la copia CDN', async () => {
    sdk.uploader.destroy.mockResolvedValue({ result: 'ok' });
    await service.deleteFile('folder/photo');
    expect(sdk.uploader.destroy).toHaveBeenCalledWith('folder/photo', { resource_type: 'image', invalidate: true });
  });

  it('tolera un archivo que ya fue eliminado', async () => {
    sdk.uploader.destroy.mockResolvedValue({ result: 'not found' });
    await expect(service.deleteFile('folder/photo')).resolves.toBeUndefined();
  });

  it('rechaza una respuesta de borrado fallida', async () => {
    sdk.uploader.destroy.mockResolvedValue({ result: 'error' });
    await expect(service.deleteFile('folder/photo')).rejects.toMatchObject({ statusCode: 502 });
  });
});
