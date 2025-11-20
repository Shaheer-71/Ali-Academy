// src/lib/cloudinary.ts

const CLOUD_NAME = 'dvng4f0nj';
const UPLOAD_PRESET = 'Ali-Academy-Preset';

/**
 * Enhanced Cloudinary upload with comprehensive error handling
 * @param file - File object with uri, name, and mimeType
 * @param resourceType - 'image' for images, 'raw' for PDFs and other files
 * @returns Object with secure_url and other Cloudinary metadata
 */
export async function uploadToCloudinary(
  file: {
    uri: string;
    name?: string;
    mimeType?: string;
  },
  resourceType: 'image' | 'raw' = 'raw'
): Promise<{ secure_url: string; public_id: string; resource_type: string }> {
  try {
    console.log('📤 Starting Cloudinary upload:', {
      name: file.name,
      type: file.mimeType,
      uri: file.uri?.substring(0, 50) + '...',
      resourceType,
    });

    // ===== CONFIGURATION VALIDATION =====
    if (!CLOUD_NAME) {
      throw new Error(
        'SETUP REQUIRED: Go to cloudinary.com, get your cloud name, and replace CLOUD_NAME.'
      );
    }

    if (!UPLOAD_PRESET) {
      throw new Error(
        'SETUP REQUIRED: Create an unsigned upload preset in Cloudinary and replace UPLOAD_PRESET.'
      );
    }

    // ===== FILE VALIDATION =====
    if (!file || !file.uri) {
      throw new Error('No valid file provided');
    }

    // Check file URI format
    if (!file.uri.startsWith('file://') && !file.uri.startsWith('content://')) {
      console.warn('⚠️ Unusual file URI format:', file.uri.substring(0, 50));
    }

    // ===== PREPARE FORM DATA =====
    const formData = new FormData();

    // React Native-compatible file object
    formData.append('file', {
      uri: file.uri,
      type: file.mimeType || 'application/octet-stream',
      name: file.name || `upload-${Date.now()}.${resourceType === 'image' ? 'jpg' : 'pdf'}`,
    } as any);

    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('resource_type', resourceType);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

    // ===== UPLOAD WITH TIMEOUT =====
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('⏱️ Upload timeout triggered (60s)');
    }, 60000); // 60 second timeout

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ===== HANDLE HTTP ERRORS =====
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('❌ Cloudinary error response:', errorText);

        switch (response.status) {
          case 400:
            throw new Error('Invalid file or configuration. Check your Cloudinary settings.');
          case 401:
            throw new Error('Upload not authorized. Check your upload preset settings.');
          case 413:
            throw new Error('File is too large to upload. Please choose a smaller file.');
          case 415:
            throw new Error('File type not supported. Please use PDF or image files.');
          case 429:
            throw new Error('Too many upload requests. Please wait a moment and try again.');
          case 500:
          case 502:
          case 503:
            throw new Error('Cloudinary server error. Please try again later.');
          default:
            throw new Error(`Upload failed with status ${response.status}`);
        }
      }

      // ===== PARSE RESPONSE =====
      const data = await response.json();

      if (!data.secure_url) {
        throw new Error('No URL returned from Cloudinary');
      }

      console.log('✅ Upload successful:', data.secure_url);

      return {
        secure_url: data.secure_url,
        public_id: data.public_id,
        resource_type: data.resource_type,
      };

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout. Please check your connection and try again.');
      }

      // Re-throw other errors
      throw fetchError;
    }

  } catch (error: any) {
    console.warn('🔥 Cloudinary upload error:', error);

    // ===== CATEGORIZE AND RE-THROW ERRORS =====

    // Network errors
    if (
      error.message?.includes('network') ||
      error.message?.includes('fetch failed') ||
      error.message?.includes('Network request failed')
    ) {
      throw new Error('Network error during upload. Please check your connection.');
    }

    // Configuration errors
    if (error.message?.includes('SETUP REQUIRED') || error.message?.includes('cloud_name')) {
      throw error; // Pass through setup errors as-is
    }

    // File system errors
    if (error.message?.includes('file') && error.message?.includes('not found')) {
      throw new Error('File not found. Please select the file again.');
    }

    // Re-throw with original message if already formatted
    throw error;
  }
}

/**
 * Helper function to validate file before upload
 * @param file - File object to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10)
 * @returns Validation result with error message if invalid
 */
export function validateFileForUpload(
  file: { uri: string; name?: string; mimeType?: string },
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {

  // Check URI
  if (!file || !file.uri) {
    return { valid: false, error: 'No file selected' };
  }

  // Check MIME type if available
  if (file.mimeType) {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimeType.toLowerCase())) {
      return {
        valid: false,
        error: 'File type not supported. Please use PDF, JPEG, PNG, GIF, or WebP files.'
      };
    }
  }

  // Check file name extension
  if (file.name) {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = allowedExtensions.some(ext =>
      file.name!.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid file extension. Please use PDF or image files.'
      };
    }
  }

  return { valid: true };
}

/**
 * Delete file from Cloudinary (requires authentication)
 * Note: This typically requires backend implementation for security
 * @param publicId - Public ID of the file to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  console.warn('⚠️ Direct deletion from client not recommended for security. Implement on backend.');
  // This should be implemented on your backend with proper authentication
  return false;
}