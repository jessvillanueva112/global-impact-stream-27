import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listUserFiles, deleteFile, getPublicUrl, getSignedUrl, FileMetadata } from '@/utils/fileUpload';
import { toast } from '@/hooks/use-toast';
import { 
  FileIcon, 
  Image as ImageIcon, 
  Music, 
  Trash2, 
  Download, 
  Search,
  Calendar,
  HardDrive,
  Loader2
} from 'lucide-react';

interface FileManagerProps {
  bucket?: 'photos' | 'audio';
  onFileSelect?: (file: FileMetadata) => void;
  selectable?: boolean;
}

export function FileManager({ bucket, onFileSelect, selectable = false }: FileManagerProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bucketFilter, setBucketFilter] = useState<'all' | 'photos' | 'audio'>(bucket || 'all');

  useEffect(() => {
    loadFiles();
  }, [bucket]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await listUserFiles(bucket);
      
      if (error) {
        throw error;
      }
      
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error loading files',
        description: 'Failed to load your files. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: FileMetadata) => {
    if (!confirm(`Are you sure you want to delete "${file.original_name}"?`)) {
      return;
    }

    setDeleting(file.id);
    try {
      const { error } = await deleteFile(file.bucket_name as 'photos' | 'audio', file.file_path);
      
      if (error) {
        throw error;
      }
      
      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast({
        title: 'File deleted',
        description: `${file.original_name} has been deleted successfully.`
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      let url: string;
      
      if (file.bucket_name === 'photos') {
        // Public bucket - use public URL
        url = getPublicUrl(file.bucket_name, file.file_path);
      } else {
        // Private bucket - use signed URL
        const { data, error } = await getSignedUrl(file.bucket_name as 'audio', file.file_path);
        if (error || !data) {
          throw new Error('Failed to generate download URL');
        }
        url = data.signedUrl;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download started',
        description: `Downloading ${file.original_name}...`
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download the file. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getFileIcon = (file: FileMetadata) => {
    if (file.mime_type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.mime_type.startsWith('audio/')) {
      return <Music className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter files based on search term and bucket filter
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBucket = bucketFilter === 'all' || file.bucket_name === bucketFilter;
    return matchesSearch && matchesBucket;
  });

  // Calculate storage usage
  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);
  const photoSize = files
    .filter(f => f.bucket_name === 'photos')
    .reduce((sum, file) => sum + file.file_size, 0);
  const audioSize = files
    .filter(f => f.bucket_name === 'audio')
    .reduce((sum, file) => sum + file.file_size, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-2 p-4">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Storage</p>
              <p className="text-xl font-bold">{formatFileSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-2 p-4">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Photos</p>
              <p className="text-xl font-bold">{formatFileSize(photoSize)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center gap-2 p-4">
            <Music className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Audio</p>
              <p className="text-xl font-bold">{formatFileSize(audioSize)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Files ({filteredFiles.length})</span>
            <Button onClick={loadFiles} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {!bucket && (
              <Select value={bucketFilter} onValueChange={(value: any) => setBucketFilter(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="photos">Photos Only</SelectItem>
                  <SelectItem value="audio">Audio Only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* File List */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'Upload some files to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <Card 
                  key={file.id} 
                  className={`p-4 transition-colors ${
                    selectable ? 'cursor-pointer hover:bg-muted/50' : ''
                  }`}
                  onClick={() => selectable && onFileSelect?.(file)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file)}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.original_name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(file.upload_date)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(file.file_size)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {file.bucket_name}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                        disabled={deleting === file.id}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        {deleting === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}