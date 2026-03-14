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

// Optional helpers
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
