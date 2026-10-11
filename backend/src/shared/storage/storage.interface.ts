export interface FileInfo {
  // Nombre local o public_id de Cloudinary (incluye su carpeta).
  filename: string;
  originalName: string;
  mimeType: string;
  // Ruta del disco para archivos locales; secure_url para Cloudinary.
  path: string;
  size: number;
}

export interface UploadFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StorageService {
  uploadFile(file: UploadFile): Promise<FileInfo>;
  deleteFile(filename: string): Promise<void>;
}
