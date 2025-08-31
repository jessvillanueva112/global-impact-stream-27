import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/files/FileUpload';
import { FileManager } from '@/components/files/FileManager';
import { Button } from '@/components/ui/button';
import { FolderOpen, Upload as UploadIcon, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FileUploadError } from '@/utils/fileUpload';

export default function FileStorage() {
  const [activeTab, setActiveTab] = useState('upload');

  const handleUploadComplete = (results: { url: string; metadata: any }[]) => {
    toast({
      title: 'Upload successful',
      description: `${results.length} file(s) uploaded successfully`,
    });
    
    // Switch to manager tab to see uploaded files
    setActiveTab('manage');
  };

  const handleUploadError = (error: FileUploadError) => {
    toast({
      title: 'Upload failed',
      description: error.message,
      variant: 'destructive'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Storage</h1>
          <p className="text-muted-foreground">
            Upload and manage your photos and audio files
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <UploadIcon className="h-4 w-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Manage Files
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket="photos"
                  multiple={true}
                  maxFiles={10}
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                />
              </CardContent>
            </Card>

            {/* Audio Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Audio Files</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket="audio"
                  multiple={true}
                  maxFiles={5}
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Photos</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Supported formats: JPG, PNG, WebP</li>
                    <li>• Maximum size: 5MB per file</li>
                    <li>• Images will be automatically compressed</li>
                    <li>• Public access (viewable by anyone with link)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Audio Files</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Supported formats: WAV, MP3, M4A, WebM</li>
                    <li>• Maximum size: 10MB per file</li>
                    <li>• Private access (only you can download)</li>
                    <li>• Perfect for voice recordings and interviews</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <FileManager bucket="photos" />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Storage Information</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Photos are stored in a public bucket for easy sharing</p>
                  <p>• Audio files are stored privately and require signed URLs</p>
                  <p>• All uploads are automatically backed up</p>
                  <p>• Files are retained indefinitely unless manually deleted</p>
                  <p>• File metadata is tracked for organizational purposes</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Security Features</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Row Level Security (RLS) ensures data isolation</p>
                  <p>• File type validation prevents malicious uploads</p>
                  <p>• Size limits prevent storage abuse</p>
                  <p>• Automatic file compression for photos</p>
                  <p>• Secure signed URLs for private audio access</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  View Storage Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}