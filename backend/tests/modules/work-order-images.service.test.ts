import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config/database', () => ({ prisma: {
  workOrder: { findUnique: vi.fn() },
  workOrderImage: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
} }));
vi.mock('../../src/shared/storage/storage', () => ({ storageService: {
  uploadFile: vi.fn(), deleteFile: vi.fn(),
} }));

import { prisma } from '../../src/config/database';
import { storageService } from '../../src/shared/storage/storage';
import * as service from '../../src/modules/work-order-images/work-order-images.service';

const db = vi.mocked(prisma, true);
const storage = vi.mocked(storageService);
const admin = { id: 1, role: 'ADMIN' as const };
const mechanic = { id: 3, role: 'MECHANIC' as const };
const file = { buffer: Buffer.from('image'), originalName: 'photo.png', mimeType: 'image/png', size: 5 };
const stored = { filename: 'folder/photo', originalName: 'photo.png', mimeType: 'image/png',
  path: 'https://res.cloudinary.com/demo/image/upload/folder/photo.png', size: 5 };
const image = { id: 100, workOrderId: 10, ...stored };

beforeEach(() => {
  vi.resetAllMocks();
  db.workOrder.findUnique.mockResolvedValue({ id: 10, assignedToUserId: 3 } as never);
  storage.uploadFile.mockResolvedValue(stored);
  storage.deleteFile.mockResolvedValue(undefined);
});

describe('subida de fotografías', () => {
  it('no almacena un archivo si la orden no existe', async () => {
    db.workOrder.findUnique.mockResolvedValue(null);
    await expect(service.upload(10, file, admin)).rejects.toMatchObject({ statusCode: 404 });
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });

  it('comprueba la asignación del mecánico antes de almacenar', async () => {
    await expect(service.upload(10, file, { ...mechanic, id: 4 })).rejects.toMatchObject({ statusCode: 403 });
    expect(storage.uploadFile).not.toHaveBeenCalled();
    expect(db.workOrderImage.create).not.toHaveBeenCalled();
  });

  it('guarda el public_id y la URL devueltos por el proveedor', async () => {
    db.workOrderImage.create.mockResolvedValue(image as never);
    await expect(service.upload(10, file, mechanic)).resolves.toEqual(image);
    expect(db.workOrderImage.create).toHaveBeenCalledWith({ data: { workOrderId: 10, ...stored } });
  });

  it('no registra la imagen en MySQL cuando falla el proveedor', async () => {
    storage.uploadFile.mockRejectedValue(new Error('Provider failed'));
    await expect(service.upload(10, file, admin)).rejects.toThrow('Provider failed');
    expect(db.workOrderImage.create).not.toHaveBeenCalled();
  });

  it('borra el archivo subido si falla el registro en MySQL', async () => {
    db.workOrderImage.create.mockRejectedValue(new Error('Database failed'));
    await expect(service.upload(10, file, admin)).rejects.toThrow('Database failed');
    expect(storage.deleteFile).toHaveBeenCalledWith(stored);
  });

  it('conserva el error original aunque falle la limpieza', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    db.workOrderImage.create.mockRejectedValue(new Error('Database failed'));
    storage.deleteFile.mockRejectedValue(new Error('Cleanup failed'));
    try {
      await expect(service.upload(10, file, admin)).rejects.toThrow('Database failed');
      expect(log).toHaveBeenCalledOnce();
    } finally { log.mockRestore(); }
  });
});

describe('consulta y eliminación', () => {
  it('limita la consulta del mecánico a su orden', async () => {
    await expect(service.list(10, { ...mechanic, id: 4 })).rejects.toMatchObject({ statusCode: 403 });
    expect(db.workOrderImage.findMany).not.toHaveBeenCalled();
  });

  it('busca la fotografía dentro de la orden indicada', async () => {
    db.workOrderImage.findFirst.mockResolvedValue(null);
    await expect(service.remove(10, 100, admin)).rejects.toMatchObject({ statusCode: 404 });
    expect(db.workOrderImage.findFirst).toHaveBeenCalledWith({ where: { id: 100, workOrderId: 10 } });
    expect(storage.deleteFile).not.toHaveBeenCalled();
  });

  it('elimina el archivo antes de eliminar su registro', async () => {
    db.workOrderImage.findFirst.mockResolvedValue(image as never);
    await service.remove(10, 100, admin);
    expect(storage.deleteFile).toHaveBeenCalledWith(image);
    expect(db.workOrderImage.delete).toHaveBeenCalledWith({ where: { id: 100 } });
  });

  it('conserva el registro si falla la eliminación del archivo', async () => {
    db.workOrderImage.findFirst.mockResolvedValue(image as never);
    storage.deleteFile.mockRejectedValue(new Error('Provider failed'));
    await expect(service.remove(10, 100, admin)).rejects.toThrow('Provider failed');
    expect(db.workOrderImage.delete).not.toHaveBeenCalled();
  });
});
