import { supabase } from '@/integrations/supabase/client';
import { compressImage } from './imageCompression';

// File type configurations
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const SUPPORTED_AUDIO_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm'];

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  url?: string;
  metadata?: FileMetadata;
}

export interface FileMetadata {
  originalName: string;
  size: number;
  type: string;
  uploadDate: string;
  compressedSize?: number;
  duration?: number;
  dimensions?: { width: number; height: number };
}

export class FileUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export function validateFile(file: File, type: 'image' | 'audio'): void {
  const supportedTypes = type === 'image' ? SUPPORTED_IMAGE_TYPES : SUPPORTED_AUDIO_TYPES;
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
  
  if (!supportedTypes.includes(file.type)) {
    throw new FileUploadError(`Unsupported ${type} format`, 'INVALID_FILE_TYPE');
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    throw new FileUploadError(`File size exceeds ${maxSizeMB}MB limit`, 'FILE_TOO_LARGE');
  }
}

export async function uploadFile(
  file: File,
  bucket: 'photos' | 'audio',
  path: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; metadata: FileMetadata }> {
  validateFile(file, bucket === 'photos' ? 'image' : 'audio');
  
  let processedFile = file;
  if (bucket === 'photos' && file.size > 1024 * 1024) {
    processedFile = await compressImage(file, { quality: 0.8, maxWidth: 1920, maxHeight: 1920 });
  }
  
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const extension = file.name.split('.').pop();
  const fileName = `${timestamp}_${randomString}.${extension}`;
  const fullPath = `${path}/${fileName}`;
  
  onProgress?.(10);
  
  const { data, error } = await supabase.storage.from(bucket).upload(fullPath, processedFile);
  
  if (error) throw new FileUploadError(`Upload failed: ${error.message}`, 'UPLOAD_FAILED');
  
  onProgress?.(80);
  
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  
  onProgress?.(100);
  
  return {
    url: urlData.publicUrl,
    metadata: {
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString(),
      compressedSize: processedFile.size !== file.size ? processedFile.size : undefined,
    },
  };
}

export async function uploadMultipleFiles(
  files: File[],
  bucket: 'photos' | 'audio',
  path: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<Array<{ url: string; metadata: FileMetadata }>> {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(files[i], bucket, path, (progress) => onProgress?.(i, progress));
    results.push(result);
  }
  return results;
}

export async function getSignedUrl(bucket: 'photos' | 'audio', path: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new FileUploadError(`Failed to create signed URL: ${error.message}`, 'SIGNED_URL_FAILED');
  return data.signedUrl;
}

export async function deleteFile(bucket: 'photos' | 'audio', path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new FileUploadError(`Failed to delete file: ${error.message}`, 'DELETE_FAILED');
}

export async function deleteMultipleFiles(bucket: 'photos' | 'audio', paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new FileUploadError(`Failed to delete files: ${error.message}`, 'DELETE_FAILED');
}

export async function listFiles(bucket: 'photos' | 'audio', path: string = ''): Promise<Array<{ name: string; id: string; metadata: any }>> {
  const { data, error } = await supabase.storage.from(bucket).list(path);
  if (error) throw new FileUploadError(`Failed to list files: ${error.message}`, 'LIST_FAILED');
  return data || [];
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function getStorageUsage(bucket: 'photos' | 'audio'): Promise<{ used: number; limit: number; percentage: number }> {
  return { used: 0, limit: 1024 * 1024 * 1024, percentage: 0 };
}