// ===== QUIZ-SPECIFIC ERROR HANDLERS =====

import { ErrorResponse } from "./attendanceErrorHandler";

export const handleQuizFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('enrollment') || message.includes('not assigned')) {
        return {
            title: 'No Quizzes Found',
            message: 'No quizzes are available for your enrolled subjects.',
            type: 'info',
        };
    }

    if (message.includes('not found')) {
        return {
            title: 'No Quizzes Found',
            message: 'No quizzes found for the selected filters.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Quizzes',
        message: 'Could not load quiz information. Please check your connection and try again.',
        type: 'error',
    };
};

export const handleQuizCreationError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('not assigned') || message.includes('teach this subject')) {
        return {
            title: 'Assignment Error',
            message: 'You are not assigned to teach this subject in this class.',
            type: 'warning',
        };
    }

    if (message.includes('duplicate') || message.includes('already exists')) {
        return {
            title: 'Quiz Already Exists',
            message: 'A quiz with similar details already exists for this date.',
            type: 'warning',
        };
    }

    if (message.includes('validation') || message.includes('invalid')) {
        return {
            title: 'Invalid Quiz Data',
            message: 'Please check all fields and ensure they contain valid information.',
            type: 'warning',
        };
    }

    return {
        title: 'Failed to Create Quiz',
        message: 'Unable to create quiz. Please check your inputs and try again.',
        type: 'error',
    };
};

export const handleQuizResultFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no student record')) {
        return {
            title: 'Student Record Not Found',
            message: 'Your student profile could not be found. Please contact administration.',
            type: 'warning',
        };
    }

    if (message.includes('not found')) {
        return {
            title: 'No Results Found',
            message: 'No quiz results available for the selected criteria.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Results',
        message: 'Could not load quiz results. Please try again.',
        type: 'error',
    };
};

export const handleMarkingError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('already marked') || message.includes('already checked')) {
        return {
            title: 'Already Marked',
            message: 'This quiz has already been marked.',
            type: 'warning',
        };
    }

    if (message.includes('invalid marks') || message.includes('out of range')) {
        return {
            title: 'Invalid Marks',
            message: 'Marks must be between 0 and the total marks for this quiz.',
            type: 'warning',
        };
    }

    if (message.includes('permission')) {
        return {
            title: 'Permission Denied',
            message: 'You do not have permission to mark this quiz.',
            type: 'warning',
        };
    }

    return {
        title: 'Failed to Save Marks',
        message: 'Unable to save marks. Please try again.',
        type: 'error',
    };
};

export const handleSubjectFetchForClassError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no subjects') || message.includes('not found')) {
        return {
            title: 'No Subjects Found',
            message: 'No subjects are assigned to this class for you to teach.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Subjects',
        message: 'Could not load subjects for this class. Please try again.',
        type: 'error',
    };
};

export const handleQuizStatusUpdateError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('invalid status')) {
        return {
            title: 'Invalid Status',
            message: 'The requested status change is not allowed.',
            type: 'warning',
        };
    }

    if (message.includes('permission')) {
        return {
            title: 'Permission Denied',
            message: 'You do not have permission to change quiz status.',
            type: 'warning',
        };
    }

    return {
        title: 'Failed to Update Status',
        message: 'Unable to update quiz status. Please try again.',
        type: 'error',
    };
};

// Add these after the existing quiz handlers

export const handleReportGenerationError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('insufficient data') || message.includes('no data')) {
        return {
            title: 'Insufficient Data',
            message: 'Not enough quiz data available to generate a meaningful report.',
            type: 'info',
        };
    }

    if (message.includes('date range')) {
        return {
            title: 'Invalid Date Range',
            message: 'Please select a valid date range for the report.',
            type: 'warning',
        };
    }

    return {
        title: 'Report Generation Failed',
        message: 'Unable to generate report. Please try again.',
        type: 'error',
    };
};

export const handleFilterApplicationError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no results') || message.includes('no matches')) {
        return {
            title: 'No Results Found',
            message: 'No data matches your current filter criteria.',
            type: 'info',
        };
    }

    return {
        title: 'Filter Error',
        message: 'Unable to apply filters. Please try again.',
        type: 'error',
    };
};

export const handleClassSubjectFetchError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('enrollment') || message.includes('not assigned')) {
        return {
            title: 'No Class-Subject Assignments',
            message: 'No class-subject combinations are currently assigned.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Load Assignments',
        message: 'Could not load class-subject relationships. Please try again.',
        type: 'error',
    };
};

export const handleQuizStatsError = (error: any): ErrorResponse => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('no data') || message.includes('not found')) {
        return {
            title: 'No Statistics Available',
            message: 'No quiz statistics available for the selected criteria.',
            type: 'info',
        };
    }

    return {
        title: 'Unable to Calculate Stats',
        message: 'Could not calculate quiz statistics. Please try again.',
        type: 'error',
    };
};

export const handleNotificationSendError = (error: any): ErrorResponse => {
    return {
        title: 'Notification Warning',
        message: 'Quiz created successfully, but some notifications could not be sent to students.',
        type: 'warning',
    };
};