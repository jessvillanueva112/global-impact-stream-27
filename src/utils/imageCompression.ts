/**
 * Compresses an image file to reduce size while maintaining quality
 */
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_COMPRESSION_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Loads an image file and returns an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculates new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Calculate scaling factor
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio, 1); // Don't upscale

  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  return { width, height };
}

/**
 * Compresses an image file by resizing and adjusting quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  try {
    const config = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
    
    // If file is already small enough, return as-is
    const maxFileSize = 1024 * 1024; // 1MB
    if (file.size <= maxFileSize && config.quality >= 0.9) {
      return file;
    }

    // Load the image
    const img = await loadImage(file);
    
    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.naturalWidth,
      img.naturalHeight,
      config.maxWidth,
      config.maxHeight
    );

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = width;
    canvas.height = height;

    // Use high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob with specified quality
    const mimeType = `image/${config.format}`;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Create a new File object from the blob
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, `.${config.format}`),
            {
              type: mimeType,
              lastModified: Date.now()
            }
          );

          resolve(compressedFile);
        },
        mimeType,
        config.quality
      );
    });

  } catch (error) {
    console.error('Image compression error:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Auto-compresses image based on file size
 */
export async function autoCompressImage(file: File): Promise<File> {
  const fileSize = file.size;
  
  // No compression needed for small files
  if (fileSize <= 512 * 1024) { // 512KB
    return file;
  }
  
  // Aggressive compression for large files
  if (fileSize > 3 * 1024 * 1024) { // 3MB
    return compressImage(file, {
      maxWidth: 1280,
      maxHeight: 720,
      quality: 0.7,
      format: 'jpeg'
    });
  }
  
  // Moderate compression for medium files
  if (fileSize > 1 * 1024 * 1024) { // 1MB
    return compressImage(file, {
      maxWidth: 1600,
      maxHeight: 900,
      quality: 0.8,
      format: 'jpeg'
    });
  }
  
  // Light compression for small-medium files
  return compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'jpeg'
  });
}

/**
 * Gets image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}