import { CloudinaryStorageService } from '../src/shared/storage/cloudinary-storage';
import { FileInfo } from '../src/shared/storage/storage.interface';

// Prueba manual: crea un GIF de 1 píxel y elimina solo el archivo que acaba de subir.
// No consulta ni modifica MySQL y no imprime credenciales.
async function main(): Promise<void> {
  const storage = new CloudinaryStorageService();
  let image: FileInfo | undefined;
  try {
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    image = await storage.uploadFile({ buffer, originalName: 'connection-check.gif', mimeType: 'image/gif', size: buffer.length });
    const response = await fetch(image.path, { signal: AbortSignal.timeout(15000) });
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error('La fotografía de prueba no está disponible por HTTPS');
    }
    await response.arrayBuffer();
    console.log('Cloudinary: subida y consulta HTTPS correctas.');
  } finally {
    if (image) {
      await storage.deleteFile(image.filename);
      console.log('Cloudinary: fotografía de prueba eliminada.');
    }
  }
}

main().catch(() => {
  console.error('No se completó la prueba de Cloudinary. Revisa las credenciales y la conexión.');
  process.exitCode = 1;
});
