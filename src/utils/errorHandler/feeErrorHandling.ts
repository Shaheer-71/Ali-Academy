// src/utils/errorHandler/feeErrorHandling.ts

interface ErrorResponse {
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
}

// ===== FEE STRUCTURE ERROR HANDLERS =====

export const handleFeeStructureFetchError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No fee structure found
    if (errorMessage.includes('no fee structure') || errorCode === 'PGRST116') {
        return {
            title: 'No Fee Structure Found',
            message: 'Fee structure has not been set up for this class. Please configure the fee structure first.',
            type: 'info'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load fee structure. Please check your internet connection and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view fee structure information.',
            type: 'error'
        };
    }

    // Database errors
    if (errorCode?.startsWith('PGRST') || errorCode?.startsWith('23')) {
        return {
            title: 'Database Error',
            message: 'Failed to load fee structure due to a database issue. Please try again later.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Fee Structure',
        message: errorMessage || 'An unexpected error occurred while loading fee structure. Please try again.',
        type: 'error'
    };
};

export const handleFeeStructureCreateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Duplicate errors
    if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        return {
            title: 'Fee Structure Already Exists',
            message: 'A fee structure for this class and academic year already exists. Please update the existing structure instead.',
            type: 'error'
        };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        return {
            title: 'Validation Error',
            message: 'Please ensure all fields are filled correctly. Amount must be a valid number.',
            type: 'error'
        };
    }

    // Foreign key errors
    if (errorCode === '23503') {
        if (errorMessage.includes('class_id')) {
            return {
                title: 'Invalid Class',
                message: 'The selected class no longer exists. Please refresh and select a valid class.',
                type: 'error'
            };
        }
        return {
            title: 'Invalid Reference',
            message: 'One or more selected items no longer exist. Please refresh the page and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to create fee structures.',
            type: 'error'
        };
    }

    return {
        title: 'Creation Failed',
        message: errorMessage || 'Failed to create fee structure. Please try again.',
        type: 'error'
    };
};

// ===== FEE PAYMENT ERROR HANDLERS =====

export const handleFeePaymentFetchError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No payments found
    if (errorMessage.includes('no payments') || errorCode === 'PGRST116') {
        return {
            title: 'No Payment Records',
            message: 'No fee payment records found for the selected period.',
            type: 'info'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load payment records. Please check your internet connection.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view payment records.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Payments',
        message: errorMessage || 'Failed to load payment records. Please try again.',
        type: 'error'
    };
};

export const handleFeePaymentCreateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Duplicate payment
    if (errorCode === '23505' || errorMessage.includes('duplicate')) {
        return {
            title: 'Duplicate Payment',
            message: 'A payment record for this month already exists. Please update the existing record instead.',
            type: 'error'
        };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        return {
            title: 'Validation Error',
            message: 'Please ensure all payment details are valid. Amount must be a positive number.',
            type: 'error'
        };
    }

    // Foreign key errors
    if (errorCode === '23503') {
        if (errorMessage.includes('student_id')) {
            return {
                title: 'Invalid Student',
                message: 'The selected student no longer exists. Please refresh and try again.',
                type: 'error'
            };
        }
        if (errorMessage.includes('student_fee_id')) {
            return {
                title: 'Missing Fee Record',
                message: 'Student fee record not found. Please ensure the student is enrolled for fee payments.',
                type: 'error'
            };
        }
        return {
            title: 'Invalid Reference',
            message: 'One or more required records no longer exist. Please refresh and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to create payment records.',
            type: 'error'
        };
    }

    return {
        title: 'Payment Creation Failed',
        message: errorMessage || 'Failed to create payment record. Please try again.',
        type: 'error'
    };
};

export const handleFeePaymentUpdateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Not found
    if (errorMessage.includes('not found') || errorCode === 'PGRST116') {
        return {
            title: 'Payment Not Found',
            message: 'The payment record you are trying to update no longer exists.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to update payment records.',
            type: 'error'
        };
    }

    // Validation errors
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
        return {
            title: 'Invalid Input',
            message: 'Please check your input. Payment amount must be valid.',
            type: 'error'
        };
    }

    return {
        title: 'Update Failed',
        message: errorMessage || 'Failed to update payment record. Please try again.',
        type: 'error'
    };
};

// ===== STUDENT FEE STATUS ERROR HANDLERS =====

export const handleStudentFeeStatusFetchError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No students found
    if (errorMessage.includes('no students') || errorCode === 'PGRST116') {
        return {
            title: 'No Students Found',
            message: 'No students are enrolled in the selected class.',
            type: 'info'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load student fee status. Please check your internet connection.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view student fee information.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Fee Status',
        message: errorMessage || 'Failed to load student fee status. Please try again.',
        type: 'error'
    };
};

// ===== CLASS FETCH ERROR HANDLERS =====

export const handleClassFetchErrorForFees = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No classes available
    if (errorMessage.includes('no classes') || errorCode === 'PGRST116') {
        return {
            title: 'No Classes Found',
            message: 'No classes are available in the system. Please create classes first.',
            type: 'info'
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

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view class information.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Classes',
        message: errorMessage || 'Failed to load classes. Please try again.',
        type: 'error'
    };
};

// ===== FEE NOTIFICATION ERROR HANDLERS =====

export const handleFeeNotificationCreateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No recipients
    if (errorMessage.includes('no recipients') || errorMessage.includes('no students')) {
        return {
            title: 'No Recipients',
            message: 'No students found to send notifications to.',
            type: 'info'
        };
    }

    // Notification service error
    if (errorMessage.includes('notification') && errorMessage.includes('failed')) {
        return {
            title: 'Notification Service Error',
            message: 'Failed to send notifications. The notification service may be temporarily unavailable.',
            type: 'error'
        };
    }

    // Push notification error
    if (errorMessage.includes('push') || errorMessage.includes('expo')) {
        return {
            title: 'Push Notification Failed',
            message: 'Failed to send push notifications to some students. In-app notifications were created successfully.',
            type: 'warning'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
            title: 'Connection Error',
            message: 'Failed to send notifications due to network issues. Please try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to send notifications.',
            type: 'error'
        };
    }

    return {
        title: 'Notification Failed',
        message: errorMessage || 'Failed to send fee notifications. Please try again.',
        type: 'error'
    };
};

// ===== FEE STATISTICS ERROR HANDLERS =====

export const handleFeeStatisticsError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No data available
    if (errorMessage.includes('no data') || errorCode === 'PGRST116') {
        return {
            title: 'No Statistics Available',
            message: 'No fee data available for the selected period.',
            type: 'info'
        };
    }

    // Calculation error
    if (errorMessage.includes('calculation') || errorMessage.includes('compute')) {
        return {
            title: 'Calculation Error',
            message: 'Failed to calculate fee statistics. Please try again.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load statistics. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Statistics',
        message: errorMessage || 'Failed to load fee statistics. Please try again.',
        type: 'error'
    };
};

// ===== VALIDATION ERROR HANDLERS =====

export const handleFeeValidationError = (field: string): ErrorResponse => {
    const fieldMessages: Record<string, string> = {
        class_id: 'Please select a class to view fee records.',
        month: 'Please select a valid month.',
        year: 'Please select a valid year.',
        amount: 'Please enter a valid fee amount.',
        payment_method: 'Please select a payment method.',
        student_id: 'Please select a valid student.',
        fee_structure: 'Fee structure is required for this class.',
        academic_year: 'Please specify the academic year.',
    };

    return {
        title: 'Required Field Missing',
        message: fieldMessages[field] || `${field} is required.`,
        type: 'error'
    };
};

// ===== BULK OPERATION ERROR HANDLERS =====

export const handleBulkPaymentUpdateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Partial failure
    if (errorMessage.includes('partial') || errorMessage.includes('some')) {
        return {
            title: 'Partial Update',
            message: 'Some payment records were updated successfully, but others failed. Please review and retry.',
            type: 'warning'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to update multiple payment records.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
            title: 'Connection Error',
            message: 'Failed to update payment records due to network issues. Please try again.',
            type: 'error'
        };
    }

    return {
        title: 'Bulk Update Failed',
        message: errorMessage || 'Failed to update payment records. Please try again.',
        type: 'error'
    };
};

// ===== STUDENT FEE RECORD ERROR HANDLERS =====

export const handleStudentFeeRecordError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Missing student fee record
    if (errorMessage.includes('student_fee') || errorMessage.includes('not found')) {
        return {
            title: 'Student Fee Record Missing',
            message: 'Student fee record not found. Please ensure the student is enrolled for fee payments.',
            type: 'error'
        };
    }

    // Foreign key constraint
    if (errorCode === '23503') {
        return {
            title: 'Invalid Student Record',
            message: 'The student record is invalid or no longer exists. Please refresh and try again.',
            type: 'error'
        };
    }

    return {
        title: 'Fee Record Error',
        message: errorMessage || 'Failed to access student fee record. Please try again.',
        type: 'error'
    };
};

// ===== MONTHLY SUMMARY ERROR HANDLERS =====

export const handleMonthlySummaryError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // No data for period
    if (errorMessage.includes('no data') || errorMessage.includes('no records')) {
        return {
            title: 'No Data Available',
            message: 'No fee records found for the selected month and year.',
            type: 'info'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load monthly summary. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Summary Error',
        message: errorMessage || 'Failed to load monthly summary. Please try again.',
        type: 'error'
    };
};