// src/utils/errorHandler/lectureErrorHandler.ts

interface ErrorResponse {
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
}

// ===== LECTURE-SPECIFIC ERROR HANDLERS =====

export const handleLectureFetchError = (error: any): ErrorResponse => {
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
    if (errorMessage.includes('no lectures') || errorCode === 'PGRST116') {
        return {
            title: 'No Lectures',
            message: 'No lectures are available at the moment. Check back later.',
            type: 'info'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load lectures. Please check your internet connection and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view these lectures.',
            type: 'error'
        };
    }

    // Database errors
    if (errorCode?.startsWith('PGRST') || errorCode?.startsWith('23')) {
        return {
            title: 'Database Error',
            message: 'Failed to load lectures due to a database issue. Please try again later.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Error Loading Lectures',
        message: errorMessage || 'An unexpected error occurred while loading lectures. Please try again.',
        type: 'error'
    };
};

export const handleLectureUploadError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // File size errors
    if (errorMessage.includes('file size') || errorMessage.includes('too large')) {
        return {
            title: 'File Too Large',
            message: 'The file size exceeds the 50MB limit. Please choose a smaller file.',
            type: 'error'
        };
    }

    // File format errors
    if (errorMessage.includes('format') || errorMessage.includes('type')) {
        return {
            title: 'Invalid File Format',
            message: 'Only PDF, image, and video files are supported.',
            type: 'error'
        };
    }

    // Storage/Cloudinary errors
    if (errorMessage.includes('cloudinary') || errorMessage.includes('upload failed')) {
        return {
            title: 'Upload Failed',
            message: 'Failed to upload the file to storage. Please try again.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
            title: 'Connection Error',
            message: 'Upload failed due to network issues. Please check your connection and try again.',
            type: 'error'
        };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        return {
            title: 'Validation Error',
            message: 'Please fill in all required fields correctly.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to upload lectures.',
            type: 'error'
        };
    }

    // Database constraint errors
    if (errorCode === '23505') {
        return {
            title: 'Duplicate Entry',
            message: 'A lecture with this title already exists for this class and subject.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Upload Failed',
        message: errorMessage || 'Failed to upload lecture. Please try again.',
        type: 'error'
    };
};

export const handleLectureUpdateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Not found
    if (errorMessage.includes('not found') || errorCode === 'PGRST116') {
        return {
            title: 'Lecture Not Found',
            message: 'The lecture you are trying to update no longer exists.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to edit this lecture.',
            type: 'error'
        };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        return {
            title: 'Invalid Input',
            message: 'Please check your input. Title is required and YouTube link must be valid.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to update lecture. Please check your internet connection.',
            type: 'error'
        };
    }

    // Database errors
    if (errorCode?.startsWith('PGRST') || errorCode?.startsWith('23')) {
        return {
            title: 'Database Error',
            message: 'Failed to update lecture due to a database issue. Please try again.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Update Failed',
        message: errorMessage || 'Failed to update lecture. Please try again.',
        type: 'error'
    };
};

export const handleLectureDeleteError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Not found
    if (errorMessage.includes('not found') || errorCode === 'PGRST116') {
        return {
            title: 'Lecture Not Found',
            message: 'The lecture you are trying to delete no longer exists.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to delete this lecture.',
            type: 'error'
        };
    }

    // Foreign key constraint (references exist)
    if (errorCode === '23503') {
        return {
            title: 'Cannot Delete',
            message: 'This lecture has associated records (views/downloads) and cannot be deleted.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to delete lecture. Please check your internet connection.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Delete Failed',
        message: errorMessage || 'Failed to delete lecture. Please try again.',
        type: 'error'
    };
};

export const handleClassFetchErrorForLectures = (error: any): ErrorResponse => {
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

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view class information.',
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

    // Generic error
    return {
        title: 'Error Loading Classes',
        message: errorMessage || 'Failed to load classes. Please try again.',
        type: 'error'
    };
};

export const handleSubjectFetchErrorForLectures = (error: any): ErrorResponse => {
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

    // Class-subject mapping missing
    if (errorMessage.includes('mapping') || errorMessage.includes('association')) {
        return {
            title: 'Configuration Error',
            message: 'No subjects are mapped to the selected class. Contact your administrator.',
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

    // Generic error
    return {
        title: 'Error Loading Subjects',
        message: errorMessage || 'Failed to load subjects. Please try again.',
        type: 'error'
    };
};

export const handleStudentFetchErrorForLectures = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No students enrolled
    if (errorMessage.includes('no students') || errorCode === 'PGRST116') {
        return {
            title: 'No Students Found',
            message: 'No students are enrolled in this subject for the selected class.',
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

    // Generic error
    return {
        title: 'Error Loading Students',
        message: errorMessage || 'Failed to load students. Please try again.',
        type: 'error'
    };
};

export const handleFilePickError = (error: any): ErrorResponse => {
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
            message: 'The selected file format is not supported. Please choose a PDF, image, or video file.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'File Selection Failed',
        message: errorMessage || 'Failed to select file. Please try again.',
        type: 'error'
    };
};

export const handleFileDownloadError = (error: any): ErrorResponse => {
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
            message: 'The file is no longer available for download.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Download Failed',
        message: errorMessage || 'Failed to download file. Please try again.',
        type: 'error'
    };
};

export const handleFileShareError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Sharing cancelled
    if (errorMessage.includes('cancel') || errorMessage.includes('cancelled')) {
        return {
            title: 'Share Cancelled',
            message: 'File sharing was cancelled.',
            type: 'info'
        };
    }

    // Sharing not available
    if (errorMessage.includes('not available') || errorMessage.includes('unavailable')) {
        return {
            title: 'Sharing Unavailable',
            message: 'File sharing is not available on this device.',
            type: 'error'
        };
    }

    // No apps to handle share
    if (errorMessage.includes('no apps')) {
        return {
            title: 'No Apps Available',
            message: 'No apps are available to share this file type.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Share Failed',
        message: errorMessage || 'Failed to share file. Please try again.',
        type: 'error'
    };
};

export const handleYouTubeLinkError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Invalid URL
    if (errorMessage.includes('invalid') || errorMessage.includes('url')) {
        return {
            title: 'Invalid Link',
            message: 'The YouTube link appears to be invalid or malformed.',
            type: 'error'
        };
    }

    // App not available
    if (errorMessage.includes('not available') || errorMessage.includes('no app')) {
        return {
            title: 'Cannot Open Link',
            message: 'Unable to open YouTube link. Please install the YouTube app or a web browser.',
            type: 'error'
        };
    }

    // Network error
    if (errorMessage.includes('network')) {
        return {
            title: 'Connection Error',
            message: 'Unable to open YouTube link. Please check your internet connection.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Failed to Open Link',
        message: errorMessage || 'Failed to open YouTube link. Please try again.',
        type: 'error'
    };
};

export const handleCloudinaryUploadError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // File size limit
    if (errorMessage.includes('size') || errorMessage.includes('too large')) {
        return {
            title: 'File Too Large',
            message: 'The file exceeds the maximum upload size of 50MB.',
            type: 'error'
        };
    }

    // Format not supported
    if (errorMessage.includes('format') || errorMessage.includes('type')) {
        return {
            title: 'Unsupported Format',
            message: 'The file format is not supported by the cloud storage service.',
            type: 'error'
        };
    }

    // Network/timeout
    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return {
            title: 'Upload Timeout',
            message: 'The upload took too long. Please check your connection and try again.',
            type: 'error'
        };
    }

    // Cloudinary API errors
    if (errorMessage.includes('cloudinary') || errorMessage.includes('api')) {
        return {
            title: 'Upload Service Error',
            message: 'The cloud storage service is temporarily unavailable. Please try again later.',
            type: 'error'
        };
    }

    // Authentication
    if (errorMessage.includes('unauthorized') || errorCode === 401) {
        return {
            title: 'Authentication Failed',
            message: 'Cloud storage authentication failed. Please contact support.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Upload Failed',
        message: errorMessage || 'Failed to upload file to cloud storage. Please try again.',
        type: 'error'
    };
};

export const handleLectureNotificationError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // This is a warning-level error as notification failures shouldn't block the main action
    
    // Permission denied
    if (errorMessage.includes('permission')) {
        return {
            title: 'Notification Not Sent',
            message: 'Push notifications are disabled. Students may not be notified about this lecture.',
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

    // Generic warning
    return {
        title: 'Notification Warning',
        message: 'Lecture was uploaded successfully, but some students may not have been notified.',
        type: 'warning'
    };
};

export const handleLectureAccessError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Duplicate access record
    if (errorCode === '23505') {
        return {
            title: 'Access Already Granted',
            message: 'Access has already been granted to these students.',
            type: 'info'
        };
    }

    // Invalid student IDs
    if (errorMessage.includes('invalid') || errorMessage.includes('not found')) {
        return {
            title: 'Invalid Students',
            message: 'Some selected students could not be found. Please refresh and try again.',
            type: 'error'
        };
    }

    // Database error
    if (errorCode?.startsWith('PGRST') || errorCode?.startsWith('23')) {
        return {
            title: 'Access Grant Failed',
            message: 'Failed to grant access due to a database error. Please try again.',
            type: 'error'
        };
    }

    // Generic error
    return {
        title: 'Access Error',
        message: errorMessage || 'Failed to manage lecture access. Please try again.',
        type: 'error'
    };
};