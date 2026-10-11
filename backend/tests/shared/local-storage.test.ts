import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

vi.mock('../../src/config/env', () => ({ env: { UPLOAD_DIR: '' } }));
import { env } from '../../src/config/env';
import { LocalStorageService } from '../../src/shared/storage/local-storage';

let root: string;
let storage: LocalStorageService;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'workshop-storage-'));
  env.UPLOAD_DIR = path.join(root, 'uploads');
  storage = new LocalStorageService();
});
afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });

describe('almacenamiento local', () => {
  it('crea el directorio y guarda nombres únicos con la extensión del tipo de imagen', async () => {
    const file = { buffer: Buffer.from('image'), originalName: '../photo.png', mimeType: 'image/png', size: 5 };
    const first = await storage.uploadFile(file);
    const second = await storage.uploadFile(file);
    expect(first.filename).toMatch(/^[a-f0-9]{32}\.png$/);
    expect(second.filename).not.toBe(first.filename);
    expect(first.path).toBe(path.join(env.UPLOAD_DIR, first.filename));
    expect(await fs.readFile(first.path)).toEqual(file.buffer);
  });

  it('elimina el archivo y tolera un segundo intento de eliminación', async () => {
    const file = await storage.uploadFile({ buffer: Buffer.from('image'), originalName: 'photo.jpg', mimeType: 'image/jpeg', size: 5 });
    await storage.deleteFile(file.filename);
    await expect(fs.access(file.path)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(storage.deleteFile(file.filename)).resolves.toBeUndefined();
  });
});
