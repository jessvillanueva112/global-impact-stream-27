import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { uploadFile, validateFile, FileUploadOptions } from '@/utils/fileUpload';
import { autoCompressImage } from '@/utils/imageCompression';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  File as FileIcon, 
  Image as ImageIcon, 
  Music, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export interface FileUploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadPath?: string;
}

interface FileUploadProps {
  bucket: 'photos' | 'audio';
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (files: { file: File; path: string }[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  bucket,
  folder,
  multiple = false,
  maxFiles = 5,
  onUploadComplete,
  onUploadError,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = bucket === 'photos';
  const acceptedTypes = isImage 
    ? 'image/jpeg,image/jpg,image/png,image/webp'
    : 'audio/wav,audio/mp3,audio/mpeg,audio/m4a,audio/webm';

  const handleFiles = useCallback(async (fileList: File[]) => {
    if (disabled) return;

    // Check file limits
    const totalFiles = files.length + fileList.length;
    if (totalFiles > maxFiles) {
      const error = `Maximum ${maxFiles} files allowed. Please remove some files first.`;
      onUploadError?.(error);
      toast({
        title: 'Too many files',
        description: error,
        variant: 'destructive'
      });
      return;
    }

    // Validate and add files
    const newFiles: FileUploadState[] = [];
    
    for (const file of fileList) {
      const validation = validateFile(file, bucket);
      if (!validation.isValid) {
        onUploadError?.(validation.error!);
        toast({
          title: 'Invalid file',
          description: validation.error,
          variant: 'destructive'
        });
        continue;
      }

      newFiles.push({
        file,
        status: 'pending',
        progress: 0
      });
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploading
    uploadFiles(newFiles);
  }, [files, maxFiles, bucket, disabled, onUploadError]);

  const uploadFiles = async (filesToUpload: FileUploadState[]) => {
    const uploadedFiles: { file: File; path: string }[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileState = filesToUpload[i];
      let processedFile = fileState.file;

      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.file === fileState.file 
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        ));

        // Compress image if needed
        if (isImage) {
          processedFile = await autoCompressImage(fileState.file);
        }

        // Upload file
        const options: FileUploadOptions = {
          bucket,
          folder,
          onProgress: (progress) => {
            setFiles(prev => prev.map(f => 
              f.file === fileState.file 
                ? { ...f, progress }
                : f
            ));
          }
        };

        const { data, error } = await uploadFile(processedFile, options);

        if (error) {
          throw error;
        }

        if (data) {
          // Update status to success
          setFiles(prev => prev.map(f => 
            f.file === fileState.file 
              ? { 
                  ...f, 
                  status: 'success' as const, 
                  progress: 100,
                  uploadPath: data.path
                }
              : f
          ));

          uploadedFiles.push({ file: fileState.file, path: data.path });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        // Update status to error
        setFiles(prev => prev.map(f => 
          f.file === fileState.file 
            ? { 
                ...f, 
                status: 'error' as const, 
                error: errorMessage
              }
            : f
        ));

        onUploadError?.(errorMessage);
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${fileState.file.name}: ${errorMessage}`,
          variant: 'destructive'
        });
      }
    }

    // Call completion callback
    if (uploadedFiles.length > 0) {
      onUploadComplete?.(uploadedFiles);
      toast({
        title: 'Upload complete',
        description: `Successfully uploaded ${uploadedFiles.length} file(s)`
      });
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    // Reset input value to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.type.startsWith('audio/')) {
      return <Music className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const getStatusIcon = (status: FileUploadState['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card 
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">
            {isImage ? 'Upload Images' : 'Upload Audio Files'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop files here, or click to browse
          </p>
          <div className="text-xs text-muted-foreground">
            <p>
              Supported formats: {isImage ? 'JPG, PNG, WebP' : 'WAV, MP3, M4A, WebM'}
            </p>
            <p>
              Max size: {isImage ? '5MB' : '10MB'} • Max files: {maxFiles}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Files ({files.length}/{maxFiles})</h4>
          {files.map((fileState, index) => (
            <Card key={`${fileState.file.name}-${index}`} className="p-3">
              <div className="flex items-center gap-3">
                {getFileIcon(fileState.file)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {fileState.file.name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(fileState.file.size)}
                    </Badge>
                    {getStatusIcon(fileState.status)}
                  </div>
                  
                  {fileState.status === 'uploading' && (
                    <Progress value={fileState.progress} className="mt-2 h-1" />
                  )}
                  
                  {fileState.error && (
                    <p className="text-xs text-red-500 mt-1">{fileState.error}</p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fileState.file);
                  }}
                  disabled={fileState.status === 'uploading'}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}