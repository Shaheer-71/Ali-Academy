// utils/timetableErrorHandler.ts
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

// ===== TIMETABLE-SPECIFIC ERROR HANDLERS =====

export const handleTimetableFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no class assigned') || message.includes('not enrolled')) {
        return {
            title: 'No Class Assigned',
            message: 'You have not been assigned to any class yet. Please contact your administrator.',
            type: 'info',
        };
    }

    if (message.includes('no timetable') || message.includes('empty schedule')) {
        return {
            title: 'No Schedule Available',
            message: 'There is no timetable available for your class at this time.',
            type: 'info',
        };
    }

    if (message.includes('not found')) {
        return {
            title: 'Schedule Not Found',
            message: 'No timetable entries found for the selected filters.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Timetable',
        message: 'Could not load the timetable. Please check your connection and try again.',
        type: 'error',
    };
};

export const handleTimetableCreateError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('time conflict') || message.includes('overlap')) {
        return {
            title: 'Time Conflict',
            message: 'This time slot is already occupied. Please choose a different time.',
            type: 'warning',
        };
    }

    if (message.includes('not assigned to teach') || message.includes('teacher not enrolled')) {
        return {
            title: 'Subject Assignment Required',
            message: 'You are not assigned to teach this subject in this class. Please contact administration.',
            type: 'warning',
        };
    }

    if (message.includes('subject not found')) {
        return {
            title: 'Invalid Subject',
            message: 'The selected subject does not exist. Please select a valid subject.',
            type: 'warning',
        };
    }

    if (message.includes('class not found')) {
        return {
            title: 'Invalid Class',
            message: 'The selected class does not exist. Please select a valid class.',
            type: 'warning',
        };
    }

    if (message.includes('all fields are required') || message.includes('missing')) {
        return {
            title: 'Incomplete Information',
            message: 'Please fill in all required fields before creating the entry.',
            type: 'warning',
        };
    }

    if (message.includes('end time must be after start time') || message.includes('invalid time')) {
        return {
            title: 'Invalid Time Range',
            message: 'The end time must be after the start time. Please check your times.',
            type: 'warning',
        };
    }

    if (message.includes('duplicate')) {
        return {
            title: 'Entry Already Exists',
            message: 'A timetable entry already exists for this time slot and class.',
            type: 'warning',
        };
    }

    return {
        title: 'Failed to Create Entry',
        message: 'Unable to create the timetable entry. Please check your information and try again.',
        type: 'error',
    };
};

export const handleTimetableUpdateError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('time conflict') || message.includes('overlap')) {
        return {
            title: 'Time Conflict',
            message: 'The new time conflicts with another entry. Please choose a different time.',
            type: 'warning',
        };
    }

    if (message.includes('not found') || message.includes('entry does not exist')) {
        return {
            title: 'Entry Not Found',
            message: 'The timetable entry no longer exists or has been deleted.',
            type: 'warning',
        };
    }

    if (message.includes('permission') || message.includes('not authorized')) {
        return {
            title: 'Cannot Edit Entry',
            message: 'You do not have permission to edit this timetable entry.',
            type: 'warning',
        };
    }

    if (message.includes('not assigned to teach')) {
        return {
            title: 'Assignment Required',
            message: 'You can only edit entries for subjects and classes you are assigned to teach.',
            type: 'warning',
        };
    }

    if (message.includes('invalid time')) {
        return {
            title: 'Invalid Time Range',
            message: 'Please ensure the end time is after the start time.',
            type: 'warning',
        };
    }

    return {
        title: 'Update Failed',
        message: 'Unable to update the timetable entry. Please try again.',
        type: 'error',
    };
};

export const handleTimetableDeleteError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('not found') || message.includes('does not exist')) {
        return {
            title: 'Entry Not Found',
            message: 'The timetable entry has already been deleted or does not exist.',
            type: 'info',
        };
    }

    if (message.includes('permission') || message.includes('not authorized')) {
        return {
            title: 'Cannot Delete Entry',
            message: 'You do not have permission to delete this entry. Only the teacher who created it can delete it.',
            type: 'warning',
        };
    }

    if (message.includes('in use') || message.includes('referenced')) {
        return {
            title: 'Entry In Use',
            message: 'This entry cannot be deleted as it is being referenced by other records.',
            type: 'warning',
        };
    }

    return {
        title: 'Delete Failed',
        message: 'Unable to delete the timetable entry. Please try again.',
        type: 'error',
    };
};

export const handleClassesFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('not assigned') || message.includes('no classes')) {
        return {
            title: 'No Classes Available',
            message: 'You have not been assigned to any classes yet. Please contact your administrator.',
            type: 'info',
        };
    }

    if (message.includes('enrollment')) {
        return {
            title: 'No Enrollments Found',
            message: 'No class enrollments found for your account.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Classes',
        message: 'Could not load the list of classes. Please try again.',
        type: 'error',
    };
};

export const handleSubjectsFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no subjects') || message.includes('not found')) {
        return {
            title: 'No Subjects Found',
            message: 'No subjects are available in the system yet.',
            type: 'info',
        };
    }

    if (message.includes('not assigned')) {
        return {
            title: 'No Subject Assignments',
            message: 'You have not been assigned to teach any subjects.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Subjects',
        message: 'Could not load the list of subjects. Please try again.',
        type: 'error',
    };
};

export const handleTeachersFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no teachers') || message.includes('not found')) {
        return {
            title: 'No Teachers Found',
            message: 'No teachers are registered in the system yet.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Teachers',
        message: 'Could not load the list of teachers. Please try again.',
        type: 'error',
    };
};

export const handleValidationError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('all fields are required')) {
        return {
            title: 'Missing Information',
            message: 'Please fill in all required fields: day, time, subject, room, and class.',
            type: 'warning',
        };
    }

    if (message.includes('invalid time format')) {
        return {
            title: 'Invalid Time Format',
            message: 'Please enter time in HH:MM format (e.g., 09:00).',
            type: 'warning',
        };
    }

    if (message.includes('end time must be after start time')) {
        return {
            title: 'Invalid Time Range',
            message: 'The class end time must be after the start time.',
            type: 'warning',
        };
    }

    if (message.includes('invalid day')) {
        return {
            title: 'Invalid Day',
            message: 'Please select a valid day of the week.',
            type: 'warning',
        };
    }

    if (message.includes('room number')) {
        return {
            title: 'Invalid Room Number',
            message: 'Please enter a valid room number.',
            type: 'warning',
        };
    }

    return {
        title: 'Validation Error',
        message: 'Please check your input and try again.',
        type: 'warning',
    };
};

export const handleConflictError = (conflicts: any[]): ErrorResponse => {
    if (!conflicts || conflicts.length === 0) {
        return {
            title: 'Conflict Detected',
            message: 'A scheduling conflict was detected. Please choose a different time.',
            type: 'warning',
        };
    }

    const firstConflict = conflicts[0];
    const conflictSubject = firstConflict.existing_entry?.subject_name || 'another class';
    const conflictTime = firstConflict.existing_entry?.start_time || '';

    return {
        title: 'Time Conflict',
        message: `This time slot conflicts with ${conflictSubject} at ${conflictTime}. Please choose a different time.`,
        type: 'warning',
    };
};

export const handleRealtimeError = (error: any): ErrorResponse => {
    return {
        title: 'Live Updates Unavailable',
        message: 'Real-time updates are temporarily unavailable. Please refresh manually to see latest changes.',
        type: 'info',
    };
};

export const handleWeekNavigationError = (): ErrorResponse => {
    return {
        title: 'Date Error',
        message: 'Unable to calculate week dates. Please refresh the page.',
        type: 'error',
    };
};

export const handleFilterError = (error: any): ErrorResponse => {
    return {
        title: 'Filter Error',
        message: 'Unable to apply filters. Please try again.',
        type: 'warning',
    };
};

export const handleSearchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no results')) {
        return {
            title: 'No Results',
            message: 'No timetable entries match your search criteria.',
            type: 'info',
        };
    }

    return {
        title: 'Search Failed',
        message: 'Unable to search timetable entries. Please try again.',
        type: 'error',
    };
};

// Generic helper for data operations
export const handleDataOperationError = (operation: 'fetch' | 'create' | 'update' | 'delete', error: any): ErrorResponse => {
    switch (operation) {
        case 'fetch':
            return handleTimetableFetchError(error);
        case 'create':
            return handleTimetableCreateError(error);
        case 'update':
            return handleTimetableUpdateError(error);
        case 'delete':
            return handleTimetableDeleteError(error);
        default:
            return handleError(error);
    }
};