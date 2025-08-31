import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  File, 
  Image, 
  Mic, 
  Calendar,
  HardDrive,
  Filter,
  Grid,
  List,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  listFiles, 
  deleteFile, 
  deleteMultipleFiles, 
  formatFileSize, 
  getSignedUrl,
  getStorageUsage,
  FileUploadError 
} from '@/utils/fileUpload';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  url?: string;
  metadata?: any;
  selected?: boolean;
}

interface FileManagerProps {
  bucket: 'photos' | 'audio';
  path?: string;
  className?: string;
  onFileSelect?: (file: FileItem) => void;
  onFileDelete?: (file: FileItem) => void;
  selectable?: boolean;
  showStorageUsage?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';

export function FileManager({
  bucket,
  path = '',
  className,
  onFileSelect,
  onFileDelete,
  selectable = false,
  showStorageUsage = true,
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, limit: 0, percentage: 0 });

  // Load files
  useEffect(() => {
    loadFiles();
    if (showStorageUsage) {
      loadStorageUsage();
    }
  }, [bucket, path]);

  // Filter and sort files
  useEffect(() => {
    let filtered = files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFiles(filtered);
  }, [files, searchQuery, sortBy, sortOrder]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fileList = await listFiles(bucket, path);
      
      const fileItems: FileItem[] = fileList.map(file => ({
        id: file.id,
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        uploadDate: file.metadata?.lastModified || new Date().toISOString(),
        metadata: file.metadata,
      }));
      
      setFiles(fileItems);
    } catch (err) {
      const error = err instanceof FileUploadError ? err.message : 'Failed to load files';
      setError(error);
      toast({
        title: "Error loading files",
        description: error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStorageUsage = async () => {
    try {
      const usage = await getStorageUsage(bucket);
      setStorageUsage(usage);
    } catch (err) {
      console.error('Failed to load storage usage:', err);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (selectable) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    }
    
    if (onFileSelect) {
      // Get signed URL for secure access
      try {
        const signedUrl = await getSignedUrl(bucket, `${path}/${file.name}`);
        onFileSelect({ ...file, url: signedUrl });
      } catch (err) {
        toast({
          title: "Error accessing file",
          description: "Failed to generate secure access URL",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteFile = (file: FileItem) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      await deleteFile(bucket, `${path}/${fileToDelete.name}`);
      
      setFiles(files.filter(f => f.id !== fileToDelete.id));
      onFileDelete?.(fileToDelete);
      
      toast({
        title: "File deleted",
        description: `${fileToDelete.name} has been deleted successfully.`,
      });
    } catch (err) {
      const error = err instanceof FileUploadError ? err.message : 'Failed to delete file';
      toast({
        title: "Error deleting file",
        description: error,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    
    try {
      const filesToDelete = files.filter(f => selectedFiles.has(f.id));
      const paths = filesToDelete.map(f => `${path}/${f.name}`);
      
      await deleteMultipleFiles(bucket, paths);
      
      setFiles(files.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
      
      toast({
        title: "Files deleted",
        description: `${filesToDelete.length} file(s) deleted successfully.`,
      });
    } catch (err) {
      const error = err instanceof FileUploadError ? err.message : 'Failed to delete files';
      toast({
        title: "Error deleting files",
        description: error,
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      const signedUrl = await getSignedUrl(bucket, `${path}/${file.name}`);
      
      // Create download link
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Downloading ${file.name}...`,
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (file.type.startsWith('audio/')) {
      return <Mic className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadFiles} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Storage Usage */}
      {showStorageUsage && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm font-medium">Storage Usage</span>
              </div>
              <Badge variant="outline">
                {formatFileSize(storageUsage.used)} / {formatFileSize(storageUsage.limit)}
              </Badge>
            </div>
            <div className="mt-2 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              {getFileIcon({ type: bucket === 'photos' ? 'image/' : 'audio/' } as FileItem)}
              <span>
                {bucket === 'photos' ? 'Photos' : 'Audio Files'} 
                ({filteredFiles.length})
              </span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {selectedFiles.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedFiles.size})
                </Button>
              )}
              
              <div className="flex items-center space-x-1 border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <Filter className="h-4 w-4 mr-1" />
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No files found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Upload some files to get started.'}
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-2"
            )}>
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedFiles.has(file.id) && "ring-2 ring-primary",
                    viewMode === 'list' && "p-3"
                  )}
                  onClick={() => handleFileClick(file)}
                >
                  {viewMode === 'grid' ? (
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        {getFileIcon(file)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteFile(file)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(file.uploadDate)}
                        </p>
                      </div>
                    </CardContent>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteFile(file)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}