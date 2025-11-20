// src/utils/errorHandler/diaryErrorHandler.ts

interface ErrorResponse {
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
}

// ===== DIARY/ASSIGNMENT-SPECIFIC ERROR HANDLERS =====

export const handleAssignmentFetchError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Enrollment/Access errors
    if (errorMessage.includes('enrollment') || errorMessage.includes('not enrolled')) {
        return {
            title: 'Access Denied',
            message: 'You are not enrolled in any subjects. Please contact your administrator.',
            type: 'error'
        };
    }

    // No data found
    if (errorMessage.includes('no assignments') || errorCode === 'PGRST116') {
        return {
            title: 'No Assignments',
            message: 'No assignments are available at the moment. Check back later.',
            type: 'info'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load assignments. Please check your internet connection and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view these assignments.',
            type: 'error'
        };
    }

    // Database errors
    if (errorCode?.startsWith('PGRST') || errorCode?.startsWith('23')) {
        return {
            title: 'Database Error',
            message: 'Failed to load assignments due to a database issue. Please try again later.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Assignments',
        message: errorMessage || 'An unexpected error occurred while loading assignments. Please try again.',
        type: 'error'
    };
};

export const handleAssignmentCreateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // File upload errors
    if (errorMessage.includes('cloudinary') || errorMessage.includes('upload failed')) {
        return {
            title: 'Upload Failed',
            message: 'Failed to upload the attachment. Please try again.',
            type: 'error'
        };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        return {
            title: 'Validation Error',
            message: 'Please fill in all required fields (title, description, due date).',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
            title: 'Connection Error',
            message: 'Failed to create assignment due to network issues. Please check your connection and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to create assignments.',
            type: 'error'
        };
    }

    // Database constraint errors
    if (errorCode === '23505') {
        return {
            title: 'Duplicate Entry',
            message: 'An assignment with this title already exists for this class.',
            type: 'error'
        };
    }

    // Foreign key errors
    if (errorCode === '23503') {
        return {
            title: 'Invalid Reference',
            message: 'The selected class or student no longer exists. Please refresh and try again.',
            type: 'error'
        };
    }

    return {
        title: 'Create Failed',
        message: errorMessage || 'Failed to create assignment. Please try again.',
        type: 'error'
    };
};

export const handleAssignmentUpdateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Not found
    if (errorMessage.includes('not found') || errorCode === 'PGRST116') {
        return {
            title: 'Assignment Not Found',
            message: 'The assignment you are trying to update no longer exists.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to edit this assignment.',
            type: 'error'
        };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        return {
            title: 'Invalid Input',
            message: 'Please check your input. All required fields must be filled correctly.',
            type: 'error'
        };
    }

    // File upload errors
    if (errorMessage.includes('upload') || errorMessage.includes('cloudinary')) {
        return {
            title: 'Upload Failed',
            message: 'Failed to upload the new attachment. Please try again.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to update assignment. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Update Failed',
        message: errorMessage || 'Failed to update assignment. Please try again.',
        type: 'error'
    };
};

export const handleAssignmentDeleteError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Not found
    if (errorMessage.includes('not found') || errorCode === 'PGRST116') {
        return {
            title: 'Assignment Not Found',
            message: 'The assignment you are trying to delete no longer exists.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to delete this assignment.',
            type: 'error'
        };
    }

    // Foreign key constraint (references exist)
    if (errorCode === '23503') {
        return {
            title: 'Cannot Delete',
            message: 'This assignment has associated submissions and cannot be deleted.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to delete assignment. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Delete Failed',
        message: errorMessage || 'Failed to delete assignment. Please try again.',
        type: 'error'
    };
};

export const handleClassFetchErrorForDiary = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No classes assigned
    if (errorMessage.includes('no classes') || errorCode === 'PGRST116') {
        return {
            title: 'No Classes Found',
            message: 'You are not assigned to any classes. Please contact your administrator.',
            type: 'info'
        };
    }

    // Enrollment errors
    if (errorMessage.includes('enrollment') || errorMessage.includes('not enrolled')) {
        return {
            title: 'Not Enrolled',
            message: 'You are not enrolled as a teacher for any class.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load classes. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Classes',
        message: errorMessage || 'Failed to load classes. Please try again.',
        type: 'error'
    };
};

export const handleSubjectFetchErrorForDiary = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No subjects for class
    if (errorMessage.includes('no subjects') || errorCode === 'PGRST116') {
        return {
            title: 'No Subjects Found',
            message: 'No subjects are available for the selected class.',
            type: 'info'
        };
    }

    // Enrollment errors
    if (errorMessage.includes('enrollment') || errorMessage.includes('not enrolled')) {
        return {
            title: 'Not Enrolled',
            message: 'You are not enrolled in any subjects for this class.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load subjects. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Subjects',
        message: errorMessage || 'Failed to load subjects. Please try again.',
        type: 'error'
    };
};

export const handleStudentFetchErrorForDiary = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No students enrolled
    if (errorMessage.includes('no students') || errorCode === 'PGRST116') {
        return {
            title: 'No Students Found',
            message: 'No students are enrolled in this class for the selected subject.',
            type: 'info'
        };
    }

    // Enrollment errors
    if (errorMessage.includes('enrollment')) {
        return {
            title: 'Enrollment Error',
            message: 'Unable to fetch student enrollment data. Please try again.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load students. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Students',
        message: errorMessage || 'Failed to load students. Please try again.',
        type: 'error'
    };
};

export const handleFilePickErrorForDiary = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // User cancelled
    if (errorMessage.includes('cancel') || errorMessage.includes('cancelled')) {
        return {
            title: 'Cancelled',
            message: 'File selection was cancelled.',
            type: 'info'
        };
    }

    // Permission denied
    if (errorMessage.includes('permission')) {
        return {
            title: 'Permission Denied',
            message: 'Please grant permission to access files from your device.',
            type: 'error'
        };
    }

    // Invalid file
    if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
        return {
            title: 'Invalid File',
            message: 'The selected file format is not supported. Please choose a PDF or image file.',
            type: 'error'
        };
    }

    return {
        title: 'File Selection Failed',
        message: errorMessage || 'Failed to select file. Please try again.',
        type: 'error'
    };
};

export const handleCloudinaryUploadErrorForDiary = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Configuration errors
    if (errorMessage.includes('setup required') || errorMessage.includes('cloud_name')) {
        return {
            title: 'Configuration Error',
            message: 'Cloud storage is not properly configured. Please contact support.',
            type: 'error'
        };
    }

    // File size limit
    if (errorMessage.includes('size') || errorMessage.includes('too large')) {
        return {
            title: 'File Too Large',
            message: 'The file is too large to upload. Please choose a smaller file.',
            type: 'error'
        };
    }

    // Format not supported
    if (errorMessage.includes('format') || errorMessage.includes('type')) {
        return {
            title: 'Unsupported Format',
            message: 'The file format is not supported. Please use PDF or image files.',
            type: 'error'
        };
    }

    // Network/timeout
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
            title: 'Upload Timeout',
            message: 'The upload took too long. Please check your connection and try again.',
            type: 'error'
        };
    }

    // Invalid configuration
    if (errorMessage.includes('invalid') || errorMessage.includes('configuration')) {
        return {
            title: 'Configuration Error',
            message: 'Cloud storage configuration is invalid. Please contact support.',
            type: 'error'
        };
    }

    // Authentication
    if (errorMessage.includes('unauthorized') || errorMessage.includes('not authorized')) {
        return {
            title: 'Authentication Failed',
            message: 'Cloud storage authentication failed. Please contact support.',
            type: 'error'
        };
    }

    return {
        title: 'Upload Failed',
        message: errorMessage || 'Failed to upload file to cloud storage. Please try again.',
        type: 'error'
    };
};

export const handleNotificationErrorForDiary = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // This is a warning-level error as notification failures shouldn't block the main action

    // Permission denied
    if (errorMessage.includes('permission')) {
        return {
            title: 'Notification Not Sent',
            message: 'Push notifications are disabled. Students may not be notified about this assignment.',
            type: 'warning'
        };
    }

    // No recipients
    if (errorMessage.includes('no recipients') || errorMessage.includes('no students')) {
        return {
            title: 'No Recipients',
            message: 'No students were notified as none are enrolled or have notifications enabled.',
            type: 'warning'
        };
    }

    // Service unavailable
    if (errorMessage.includes('service') || errorMessage.includes('unavailable')) {
        return {
            title: 'Notification Service Error',
            message: 'The notification service is temporarily unavailable. Students may not be notified.',
            type: 'warning'
        };
    }

    return {
        title: 'Notification Warning',
        message: 'Assignment was created successfully, but some students may not have been notified.',
        type: 'warning'
    };
};

export const handleFileDownloadErrorForDiary = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to download file. Please check your internet connection.',
            type: 'error'
        };
    }

    // Storage permission
    if (errorMessage.includes('permission') || errorMessage.includes('storage')) {
        return {
            title: 'Permission Required',
            message: 'Please grant storage permission to download files.',
            type: 'error'
        };
    }

    // Storage full
    if (errorMessage.includes('space') || errorMessage.includes('storage full')) {
        return {
            title: 'Insufficient Storage',
            message: 'Not enough storage space to download the file.',
            type: 'error'
        };
    }

    // File not found
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return {
            title: 'File Not Found',
            message: 'The attachment is no longer available for download.',
            type: 'error'
        };
    }

    return {
        title: 'Download Failed',
        message: errorMessage || 'Failed to download attachment. Please try again.',
        type: 'error'
    };
};