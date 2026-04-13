export interface FileInfo {
  filename: string;
  originalName: string;
  mimeType: string;
  path: string;
  size: number;
}

export interface StorageService {
  getFilePath(filename: string): string;
  deleteFile(filename: string): Promise<void>;
}
