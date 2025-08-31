import { useState, useCallback, useRef } from 'react';
import { Upload, X, File, Image, Mic, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { 
  uploadFile, 
  uploadMultipleFiles, 
  validateFile, 
  formatFileSize, 
  FileUploadProgress,
  FileUploadError 
} from '@/utils/fileUpload';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  bucket: 'photos' | 'audio';
  path?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  onUploadComplete?: (results: Array<{ url: string; metadata: any }>) => void;
  onUploadProgress?: (progress: FileUploadProgress[]) => void;
  onError?: (error: FileUploadError) => void;
  className?: string;
}

export function FileUpload({
  bucket,
  path = '',
  accept,
  multiple = false,
  maxFiles = 5,
  disabled = false,
  onUploadComplete,
  onUploadProgress,
  onError,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine file type and accept attribute
  const fileType = bucket === 'photos' ? 'image' : 'audio';
  const defaultAccept = bucket === 'photos' 
    ? 'image/jpeg,image/png,image/webp' 
    : 'audio/wav,audio/mp3,audio/mpeg,audio/m4a,audio/webm';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Limit number of files
    const filesToProcess = files.slice(0, maxFiles);
    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Only the first ${maxFiles} files will be uploaded.`,
        variant: "destructive",
      });
    }

    // Initialize progress tracking
    const progressItems: FileUploadProgress[] = filesToProcess.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    setUploadProgress(progressItems);
    setIsUploading(true);
    onUploadProgress?.(progressItems);

    try {
      // Validate all files first
      for (const file of filesToProcess) {
        try {
          validateFile(file, fileType);
        } catch (error) {
          if (error instanceof FileUploadError) {
            const updatedProgress = progressItems.map(item => 
              item.file === file 
                ? { ...item, status: 'error' as const, error: error.message }
                : item
            );
            setUploadProgress(updatedProgress);
            onUploadProgress?.(updatedProgress);
            onError?.(error);
            continue;
          }
        }
      }

      // Upload files
      if (multiple) {
        const results = await uploadMultipleFiles(
          filesToProcess.filter(file => 
            !progressItems.find(item => item.file === file && item.status === 'error')
          ),
          bucket,
          path,
          (fileIndex, progress) => {
            const updatedProgress = [...progressItems];
            if (updatedProgress[fileIndex]) {
              updatedProgress[fileIndex] = {
                ...updatedProgress[fileIndex],
                progress,
                status: progress === 100 ? 'completed' : 'uploading',
              };
              setUploadProgress(updatedProgress);
              onUploadProgress?.(updatedProgress);
            }
          }
        );

        // Update with final results
        const finalProgress = progressItems.map((item, index) => {
          const result = results[index];
          return result ? {
            ...item,
            status: 'completed' as const,
            progress: 100,
            url: result.url,
            metadata: result.metadata,
          } : item;
        });

        setUploadProgress(finalProgress);
        onUploadProgress?.(finalProgress);
        onUploadComplete?.(results);
        
        toast({
          title: "Upload successful",
          description: `${results.length} file(s) uploaded successfully.`,
        });

      } else {
        // Single file upload
        const file = filesToProcess[0];
        const progressItem = progressItems[0];
        
        const result = await uploadFile(file, bucket, path, (progress) => {
          const updatedProgress = [{
            ...progressItem,
            progress,
            status: progress === 100 ? 'completed' as const : 'uploading' as const,
          }];
          setUploadProgress(updatedProgress);
          onUploadProgress?.(updatedProgress);
        });

        const finalProgress = [{
          ...progressItem,
          status: 'completed' as const,
          progress: 100,
          url: result.url,
          metadata: result.metadata,
        }];

        setUploadProgress(finalProgress);
        onUploadProgress?.(finalProgress);
        onUploadComplete?.([result]);
        
        toast({
          title: "Upload successful",
          description: "File uploaded successfully.",
        });
      }

    } catch (error) {
      const fileError = error instanceof FileUploadError 
        ? error 
        : new FileUploadError('Upload failed', 'UPLOAD_ERROR');
      
      const updatedProgress = progressItems.map(item => ({
        ...item,
        status: 'error' as const,
        error: fileError.message,
      }));
      
      setUploadProgress(updatedProgress);
      onUploadProgress?.(updatedProgress);
      onError?.(fileError);
      
      toast({
        title: "Upload failed",
        description: fileError.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileIndex: number) => {
    const updatedProgress = uploadProgress.filter((_, index) => index !== fileIndex);
    setUploadProgress(updatedProgress);
    onUploadProgress?.(updatedProgress);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type.startsWith('audio/')) {
      return <Mic className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const getStatusIcon = (status: FileUploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-accent-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragOver && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className={cn(
            "h-8 w-8 mb-2",
            isDragOver ? "text-primary" : "text-muted-foreground"
          )} />
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragOver 
                ? `Drop ${fileType}s here` 
                : `Upload ${fileType}s`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {multiple 
                ? `Drag & drop up to ${maxFiles} files or click to browse`
                : 'Drag & drop a file or click to browse'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {bucket === 'photos' 
                ? 'JPG, PNG, WebP up to 5MB' 
                : 'WAV, MP3, M4A, WebM up to 10MB'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept || defaultAccept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">
            {isUploading ? 'Uploading...' : 'Upload Results'}
          </h4>
          
          {uploadProgress.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(item.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    item.status === 'completed' ? 'default' :
                    item.status === 'error' ? 'destructive' :
                    'secondary'
                  }>
                    {item.status}
                  </Badge>
                  
                  {getStatusIcon(item.status)}
                  
                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              {item.status === 'uploading' && (
                <Progress value={item.progress} className="mt-2" />
              )}
              
              {item.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {item.error}
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}