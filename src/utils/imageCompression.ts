export interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const { quality = 0.8, maxWidth = 1920, maxHeight = 1920, maintainAspectRatio = true } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      const { width, height } = calculateDimensions(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight, maintainAspectRatio);
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      const outputFormat = getOptimalFormat(file.type);
      const mimeType = `image/${outputFormat}`;
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image'));
          return;
        }
        
        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, `.${outputFormat}`), {
          type: mimeType,
          lastModified: Date.now(),
        });
        
        resolve(compressedFile);
      }, mimeType, quality);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number, maintainAspectRatio: boolean): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: Math.min(originalWidth, maxWidth), height: Math.min(originalHeight, maxHeight) };
  }

  const aspectRatio = originalWidth / originalHeight;
  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

function getOptimalFormat(inputType: string): 'jpeg' | 'png' | 'webp' {
  const supportsWebP = checkWebPSupport();
  if (supportsWebP) return 'webp';
  if (inputType === 'image/png') return 'png';
  return 'jpeg';
}

function checkWebPSupport(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  try {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}