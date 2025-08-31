import { supabase } from '@/integrations/supabase/client';

export interface FileUploadOptions {
  bucket: 'photos' | 'audio';
  folder?: string;
  onProgress?: (progress: number) => void;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileMetadata {
  id: string;
  user_id: string;
  bucket_name: string;
  file_path: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
}

// File type validation configurations
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates file type and size based on bucket requirements
 */
export function validateFile(file: File, bucket: 'photos' | 'audio'): FileValidationResult {
  if (bucket === 'photos') {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid image format. Please upload JPG, PNG, or WebP files only.'
      };
    }
    
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        error: 'Image file is too large. Please upload files smaller than 5MB.'
      };
    }
  } else if (bucket === 'audio') {
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid audio format. Please upload WAV, MP3, M4A, or WebM files only.'
      };
    }
    
    if (file.size > MAX_AUDIO_SIZE) {
      return {
        isValid: false,
        error: 'Audio file is too large. Please upload files smaller than 10MB.'
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Generates a unique file path for storage
 */
export function generateFilePath(userId: string, originalName: string, folder?: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileExtension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  const cleanBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '');
  
  const fileName = `${cleanBaseName}_${timestamp}_${randomSuffix}.${fileExtension}`;
  
  if (folder) {
    return `${userId}/${folder}/${fileName}`;
  }
  return `${userId}/${fileName}`;
}

/**
 * Uploads a file to Supabase storage with progress tracking
 */
export async function uploadFile(
  file: File, 
  options: FileUploadOptions
): Promise<{ data: { path: string; fullPath: string } | null; error: Error | null }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate file
    const validation = validateFile(file, options.bucket);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate file path
    const filePath = generateFilePath(user.id, file.name, options.folder);

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Save file metadata
    const metadata: Omit<FileMetadata, 'id' | 'upload_date'> = {
      user_id: user.id,
      bucket_name: options.bucket,
      file_path: filePath,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type
    };

    const { error: metadataError } = await supabase
      .from('file_metadata')
      .insert(metadata);

    if (metadataError) {
      console.warn('Failed to save file metadata:', metadataError);
    }

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath
      },
      error: null
    };

  } catch (error) {
    console.error('Upload error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Upload failed')
    };
  }
}

/**
 * Deletes a file from storage and metadata
 */
export async function deleteFile(
  bucket: 'photos' | 'audio',
  filePath: string
): Promise<{ error: Error | null }> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (storageError) {
      throw storageError;
    }

    // Delete metadata
    const { error: metadataError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('file_path', filePath);

    if (metadataError) {
      console.warn('Failed to delete file metadata:', metadataError);
    }

    return { error: null };

  } catch (error) {
    console.error('Delete error:', error);
    return {
      error: error instanceof Error ? error : new Error('Delete failed')
    };
  }
}

/**
 * Gets a signed URL for secure file access
 */
export async function getSignedUrl(
  bucket: 'photos' | 'audio',
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return { data, error: null };

  } catch (error) {
    console.error('Signed URL error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to generate signed URL')
    };
  }
}

/**
 * Gets public URL for public files (photos bucket)
 */
export function getPublicUrl(bucket: 'photos' | 'audio', filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Lists user's files with metadata
 */
export async function listUserFiles(
  bucket?: 'photos' | 'audio'
): Promise<{ data: FileMetadata[] | null; error: Error | null }> {
  try {
    let query = supabase
      .from('file_metadata')
      .select('*')
      .order('upload_date', { ascending: false });

    if (bucket) {
      query = query.eq('bucket_name', bucket);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data, error: null };

  } catch (error) {
    console.error('List files error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to list files')
    };
  }
}