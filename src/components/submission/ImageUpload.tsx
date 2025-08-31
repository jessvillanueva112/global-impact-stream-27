import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSizeKB?: number;
}

export const ImageUpload = ({ onUpload, maxFiles = 5, maxSizeKB = 5000 }: ImageUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    fileArray.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not an image file.`,
          variant: "destructive"
        });
        return;
      }

      // Validate file size
      if (file.size > maxSizeKB * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than ${maxSizeKB}KB.`,
          variant: "destructive"
        });
        return;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Check total file count
    if (selectedFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed.`,
        variant: "destructive"
      });
      return;
    }

    const updatedFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(updatedFiles);
    onUpload(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    
    setSelectedFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onUpload(updatedFiles);
  };

  const triggerCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={triggerCameraCapture}
          className="h-24 flex flex-col items-center gap-2"
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm">Take Photo</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          className="h-24 flex flex-col items-center gap-2"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">Upload Images</span>
        </Button>
      </div>

      {/* File Info */}
      <div className="text-xs text-muted-foreground text-center">
        Maximum {maxFiles} images, {maxSizeKB}KB each. JPG, PNG, WebP supported.
      </div>

      {/* Preview Grid */}
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(preview, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* File name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                    {selectedFiles[index]?.name}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Summary */}
      {selectedFiles.length > 0 && (
        <div className="p-3 bg-accent-success/10 rounded-lg border">
          <p className="text-sm text-accent-success font-medium">
            ✓ {selectedFiles.length} image(s) selected
          </p>
          <p className="text-xs text-muted-foreground">
            Total size: {Math.round(selectedFiles.reduce((acc, file) => acc + file.size, 0) / 1024)}KB
          </p>
        </div>
      )}
    </div>
  );
};