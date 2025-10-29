// src/constants/lectureConstants.ts

export const LECTURE_CONSTANTS = {
    // File upload limits
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB

    // Supported file types
    ALLOWED_FILE_TYPES: [
        'application/pdf',
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/quicktime',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],

    // File type categories
    FILE_CATEGORIES: {
        DOCUMENT: 'document',
        VIDEO: 'video',
        IMAGE: 'image',
        OTHER: 'other',
    } as const,

    // API endpoints (if needed)
    ENDPOINTS: {
        LECTURES: '/api/lectures',
        CLASSES: '/api/classes',
        SUBJECTS: '/api/subjects',
        UPLOAD: '/api/upload',
    } as const,

    // Default values
    DEFAULTS: {
        PAGE_SIZE: 20,
        SEARCH_DEBOUNCE_MS: 300,
        CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
    } as const,

    // Status types
    LECTURE_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        DRAFT: 'draft',
    } as const,

    // Interaction types
    INTERACTION_TYPES: {
        VIEW: 'view',
        DOWNLOAD: 'download',
        SHARE: 'share',
    } as const,

    // Error messages
    ERROR_MESSAGES: {
        FILE_TOO_LARGE: 'File size must be less than 50MB',
        FILE_TYPE_NOT_SUPPORTED: 'File type not supported',
        NO_FILE_SELECTED: 'Please select a file',
        REQUIRED_FIELDS_MISSING: 'Please fill in all required fields',
        UPLOAD_FAILED: 'Failed to upload file',
        DOWNLOAD_FAILED: 'Failed to download file',
        SHARE_FAILED: 'Failed to share lecture',
        NETWORK_ERROR: 'Network error. Please check your connection.',
        PERMISSION_DENIED: 'You do not have permission to perform this action',
    } as const,

    // Success messages
    SUCCESS_MESSAGES: {
        LECTURE_UPLOADED: 'Lecture uploaded successfully',
        LECTURE_UPDATED: 'Lecture updated successfully',
        LECTURE_DELETED: 'Lecture deleted successfully',
        FILE_DOWNLOADED: 'File downloaded successfully',
    } as const,

    // File type icons mapping
    FILE_ICONS: {
        'application/pdf': 'FileText',
        'video/mp4': 'Video',
        'video/avi': 'Video',
        'video/mov': 'Video',
        'video/wmv': 'Video',
        'video/quicktime': 'Video',
        'image/jpeg': 'Image',
        'image/jpg': 'Image',
        'image/png': 'Image',
        'image/gif': 'Image',
        'image/webp': 'Image',
        'application/msword': 'FileText',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'FileText',
        'application/vnd.ms-powerpoint': 'FileText',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'FileText',
    } as const,

    // Animation durations
    ANIMATIONS: {
        MODAL_fade_DURATION: 300,
        FADE_DURATION: 200,
        SCALE_DURATION: 150,
    } as const,
} as const;

// Export specific constants for easier imports
export const {
    MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES,
    FILE_CATEGORIES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    LECTURE_STATUS,
    INTERACTION_TYPES,
} = LECTURE_CONSTANTS;