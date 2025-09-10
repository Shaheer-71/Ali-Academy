// src/config/cloudinary.config.ts

/**
 * Cloudinary Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to cloudinary.com and create a free account
 * 2. Get your Cloud Name from the dashboard
 * 3. Create an upload preset:
 *    - Go to Settings > Upload > Upload presets
 *    - Click "Add upload preset"
 *    - Set signing mode to "Unsigned"
 *    - Set folder to "lectures" (optional but recommended)
 *    - Add any transformations you want (optional)
 *    - Save the preset name
 * 4. Replace the values below with your actual credentials
 */

export const CLOUDINARY_CONFIG = {
    // Replace with your Cloudinary cloud name
    cloud_name: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',

    // Replace with your upload preset name (must be unsigned)
    upload_preset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset',

    // Optional: Your API key (not needed for unsigned uploads)
    api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '',

    // Optional: Folder to organize uploads
    default_folder: 'lectures',

    // File size limit (50MB)
    max_file_size: 50 * 1024 * 1024,

    // Allowed file types
    allowed_types: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/quicktime',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
};

/**
 * Environment Variables Setup:
 * 
 * Create a .env file in your project root and add:
 * 
 * EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
 * EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-actual-upload-preset
 * EXPO_PUBLIC_CLOUDINARY_API_KEY=your-actual-api-key
 * 
 * Then install expo-dotenv:
 * npm install expo-dotenv
 * 
 * And add to your app.config.js:
 * import 'dotenv/config';
 */

// Validation function
export function validateCloudinaryConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!CLOUDINARY_CONFIG.cloud_name || CLOUDINARY_CONFIG.cloud_name === 'your-cloud-name') {
        errors.push('Cloudinary cloud name is not configured');
    }

    if (!CLOUDINARY_CONFIG.upload_preset || CLOUDINARY_CONFIG.upload_preset === 'your-upload-preset') {
        errors.push('Cloudinary upload preset is not configured');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// Helper to get resource type from MIME type
export function getResourceType(mimeType: string): 'image' | 'video' | 'raw' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
}

// Helper to check if file type is allowed
export function isFileTypeAllowed(mimeType: string): boolean {
    return CLOUDINARY_CONFIG.allowed_types.includes(mimeType);
}

// Helper to check file size
export function isFileSizeValid(size: number): boolean {
    return size <= CLOUDINARY_CONFIG.max_file_size;
}