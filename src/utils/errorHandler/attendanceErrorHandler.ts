// utils/errorHandler.ts
export interface ErrorResponse {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
}

export const handleError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
        return {
            title: 'Connection Problem',
            message: 'Unable to connect to the server. Please check your internet connection and try again.',
            type: 'error',
        };
    }

    // Timeout
    if (message.includes('timeout')) {
        return {
            title: 'Request Timeout',
            message: 'The request is taking too long. Please try again.',
            type: 'warning',
        };
    }

    // Auth
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('jwt')) {
        return {
            title: 'Session Expired',
            message: 'Your session has expired. Please sign in again.',
            type: 'warning',
        };
    }

    // Permission
    if (message.includes('permission') || message.includes('forbidden')) {
        return {
            title: 'Access Denied',
            message: "You don't have permission to perform this action.",
            type: 'warning',
        };
    }

    // Not found
    if (message.includes('not found') || message.includes('404')) {
        return {
            title: 'Not Found',
            message: 'The requested resource could not be found.',
            type: 'info',
        };
    }

    // Validation
    if (message.includes('invalid') || message.includes('validation')) {
        return {
            title: 'Invalid Input',
            message: 'Please check your input and try again.',
            type: 'warning',
        };
    }

    // Database
    if (message.includes('database') || message.includes('query')) {
        return {
            title: 'Data Error',
            message: 'There was a problem accessing your data. Please try later.',
            type: 'error',
        };
    }

    // Supabase error codes
    if (error.code) {
        switch (error.code) {
            case 'PGRST116':
                return {
                    title: 'No Data Found',
                    message: 'The requested data could not be found.',
                    type: 'info',
                };
            case '23505':
                return {
                    title: 'Duplicate Entry',
                    message: 'This record already exists.',
                    type: 'warning',
                };
            case '23503':
                return {
                    title: 'Reference Error',
                    message: 'Action failed due to linked data.',
                    type: 'warning',
                };
            case '42501':
                return {
                    title: 'Permission Denied',
                    message: 'You do not have permission for this action.',
                    type: 'warning',
                };
        }
    }

    // Fallback
    return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        type: 'error',
    };
};

// Generic data operation errors
export const handleDataFetchError = (error: any): ErrorResponse => {
    if (error?.message?.toLowerCase().includes('not found')) {
        return {
            title: 'No Data Available',
            message: 'There is no data to show.',
            type: 'info',
        };
    }
    return handleError(error);
};

export const handleDataUpdateError = (): ErrorResponse => ({
    title: 'Update Failed',
    message: 'Unable to save your changes.',
    type: 'error',
});

export const handleDataDeleteError = (): ErrorResponse => ({
    title: 'Delete Failed',
    message: 'Unable to delete this item. It may be protected or in use.',
    type: 'error',
});

// ===== ATTENDANCE-SPECIFIC ERROR HANDLERS =====

export const handleStudentFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('enrollment')) {
        return {
            title: 'No Enrollments Found',
            message: 'No students are enrolled in this class and subject combination.',
            type: 'info',
        };
    }

    if (message.includes('not found')) {
        return {
            title: 'No Students Found',
            message: 'No students found for the selected class and subject.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Students',
        message: 'Could not load student information. Please check your connection and try again.',
        type: 'error',
    };
};

export const handleAttendanceFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('date')) {
        return {
            title: 'Date Error',
            message: 'Invalid date range selected. Please check your filters.',
            type: 'warning',
        };
    }

    if (message.includes('not found')) {
        return {
            title: 'No Records Found',
            message: 'No attendance records found for the selected criteria.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Attendance',
        message: 'Could not load attendance records. Please try again.',
        type: 'error',
    };
};

export const handleAttendancePostError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('already posted') || message.includes('duplicate')) {
        return {
            title: 'Attendance Already Marked',
            message: 'Attendance has already been posted for this class and date.',
            type: 'warning',
        };
    }

    if (message.includes('no attendance data')) {
        return {
            title: 'No Students Marked',
            message: 'Please mark attendance for at least one student before posting.',
            type: 'warning',
        };
    }

    if (message.includes('permission')) {
        return {
            title: 'Permission Denied',
            message: 'You do not have permission to post attendance for this class.',
            type: 'warning',
        };
    }

    return {
        title: 'Failed to Post Attendance',
        message: 'Unable to save attendance. Please check your connection and try again.',
        type: 'error',
    };
};

export const handleAttendanceUpdateError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('not found')) {
        return {
            title: 'Record Not Found',
            message: 'The attendance record no longer exists.',
            type: 'warning',
        };
    }

    if (message.includes('permission') || message.includes('forbidden')) {
        return {
            title: 'Cannot Edit',
            message: 'You do not have permission to edit this attendance record.',
            type: 'warning',
        };
    }

    return {
        title: 'Update Failed',
        message: 'Unable to update attendance record. Please try again.',
        type: 'error',
    };
};

export const handleClassFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('enrollment') || message.includes('not assigned')) {
        return {
            title: 'No Classes Assigned',
            message: 'You have not been assigned to any classes yet.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Classes',
        message: 'Could not load your class assignments. Please try again.',
        type: 'error',
    };
};

export const handleSubjectFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('enrollment') || message.includes('no subjects')) {
        return {
            title: 'No Subjects Found',
            message: 'No subjects are assigned for this class.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Subjects',
        message: 'Could not load subjects for this class. Please try again.',
        type: 'error',
    };
};

export const handleNotificationError = (error: any): ErrorResponse => {
    return {
        title: 'Notification Warning',
        message: 'Attendance posted successfully, but some notifications could not be sent.',
        type: 'warning',
    };
};