// src/utils/errorHandler/studentErrorHandler.ts

interface ErrorResponse {
    title: string;
    message: string;
    type?: 'error' | 'warning' | 'info';
}

// ===== STUDENT-SPECIFIC ERROR HANDLERS =====

export const handleStudentFetchError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No data found
    if (errorMessage.includes('no students') || errorCode === 'PGRST116') {
        return {
            title: 'No Students Found',
            message: 'No students are registered yet. Add your first student to get started.',
            type: 'info'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to load students. Please check your internet connection and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to view student records.',
            type: 'error'
        };
    }

    // Database errors
    if (errorCode?.startsWith('PGRST') || errorCode?.startsWith('23')) {
        return {
            title: 'Database Error',
            message: 'Failed to load students due to a database issue. Please try again later.',
            type: 'error'
        };
    }

    return {
        title: 'Error Loading Students',
        message: errorMessage || 'An unexpected error occurred while loading students. Please try again.',
        type: 'error'
    };
};

export const handleStudentCreateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Duplicate errors
    if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        if (errorMessage.includes('roll_number') || errorMessage.includes('roll number')) {
            return {
                title: 'Duplicate Roll Number',
                message: 'A student with this roll number already exists. Please use a different roll number.',
                type: 'error'
            };
        }
        if (errorMessage.includes('email')) {
            return {
                title: 'Email Already Registered',
                message: 'This email is already registered in the system. Please use a different roll number.',
                type: 'error'
            };
        }
        return {
            title: 'Duplicate Entry',
            message: 'A student with these details already exists in the system.',
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

    // Date format errors
    if (errorMessage.includes('invalid') && errorMessage.includes('date')) {
        return {
            title: 'Invalid Date Format',
            message: 'Please enter dates in YYYY-MM-DD format (e.g., 2024-01-15).',
            type: 'error'
        };
    }

    // Teacher assignment errors
    if (errorMessage.includes('no teachers assigned') || errorMessage.includes('teacher')) {
        return {
            title: 'Teacher Assignment Required',
            message: 'No teachers are assigned to the selected subjects. Please assign teachers before enrolling students.',
            type: 'error'
        };
    }

    // Enrollment errors
    if (errorMessage.includes('enroll') || errorMessage.includes('enrollment')) {
        return {
            title: 'Enrollment Failed',
            message: 'Failed to enroll student in selected subjects. Please verify subject availability and try again.',
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
        if (errorMessage.includes('subject_id')) {
            return {
                title: 'Invalid Subject',
                message: 'One or more selected subjects no longer exist. Please refresh and try again.',
                type: 'error'
            };
        }
        return {
            title: 'Invalid Reference',
            message: 'One or more selected items no longer exist. Please refresh the page and try again.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return {
            title: 'Connection Error',
            message: 'Failed to create student due to network issues. Please check your connection and try again.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to create student records.',
            type: 'error'
        };
    }

    return {
        title: 'Creation Failed',
        message: errorMessage || 'Failed to create student. Please try again.',
        type: 'error'
    };
};

export const handleStudentUpdateError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Not found
    if (errorMessage.includes('not found') || errorCode === 'PGRST116') {
        return {
            title: 'Student Not Found',
            message: 'The student you are trying to update no longer exists.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to edit this student record.',
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

    // Duplicate errors
    if (errorCode === '23505') {
        if (errorMessage.includes('roll_number')) {
            return {
                title: 'Duplicate Roll Number',
                message: 'Another student already has this roll number.',
                type: 'error'
            };
        }
        if (errorMessage.includes('email')) {
            return {
                title: 'Email Already Exists',
                message: 'This email is already registered to another student.',
                type: 'error'
            };
        }
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to update student. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Update Failed',
        message: errorMessage || 'Failed to update student. Please try again.',
        type: 'error'
    };
};

export const handleStudentDeleteError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // Not found
    if (errorMessage.includes('not found') || errorCode === 'PGRST116') {
        return {
            title: 'Student Not Found',
            message: 'The student you are trying to delete no longer exists.',
            type: 'error'
        };
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('not authorized') || errorCode === '42501') {
        return {
            title: 'Access Denied',
            message: 'You do not have permission to delete this student record.',
            type: 'error'
        };
    }

    // Foreign key constraint (has related records)
    if (errorCode === '23503') {
        return {
            title: 'Cannot Delete',
            message: 'This student has associated records (attendance, grades, etc.) and cannot be deleted. Consider marking them as inactive instead.',
            type: 'error'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to delete student. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Delete Failed',
        message: errorMessage || 'Failed to delete student. Please try again.',
        type: 'error'
    };
};

export const handleClassFetchErrorForStudents = (error: any): ErrorResponse => {
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

export const handleSubjectFetchErrorForStudents = (error: any): ErrorResponse => {
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

    // No teachers assigned
    if (errorMessage.includes('no teachers') || errorMessage.includes('teacher')) {
        return {
            title: 'No Teachers Assigned',
            message: 'No teachers are assigned to subjects in this class. Please assign teachers first.',
            type: 'error'
        };
    }

    // Enrollment errors
    if (errorMessage.includes('enrollment')) {
        return {
            title: 'Enrollment Error',
            message: 'Unable to fetch subject enrollment data. Please try again.',
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

export const handleEnrollmentError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code;

    // No teachers assigned
    if (errorMessage.includes('no teachers assigned')) {
        return {
            title: 'Teacher Assignment Required',
            message: 'Cannot enroll student. No teachers are assigned to the selected subjects in this class.',
            type: 'error'
        };
    }

    // Invalid subject/class combination
    if (errorMessage.includes('invalid') || errorCode === '23503') {
        return {
            title: 'Invalid Enrollment',
            message: 'The selected subject-class combination is invalid. Please refresh and try again.',
            type: 'error'
        };
    }

    // Duplicate enrollment
    if (errorCode === '23505') {
        return {
            title: 'Already Enrolled',
            message: 'Student is already enrolled in this subject.',
            type: 'error'
        };
    }

    // Enrollment creation failed
    if (errorMessage.includes('failed to enroll')) {
        return {
            title: 'Enrollment Failed',
            message: 'Failed to enroll student in selected subjects. The student record may need to be removed.',
            type: 'error'
        };
    }

    return {
        title: 'Enrollment Error',
        message: errorMessage || 'Failed to create student enrollment. Please try again.',
        type: 'error'
    };
};

export const handlePasswordStatusFetchError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Error',
            message: 'Unable to check student registration status. Please check your internet connection.',
            type: 'error'
        };
    }

    return {
        title: 'Status Check Failed',
        message: 'Failed to fetch student registration status.',
        type: 'warning'
    };
};

export const handleValidationError = (field: string): ErrorResponse => {
    const fieldMessages: Record<string, string> = {
        full_name: 'Student name is required and cannot be empty.',
        roll_number: 'Roll number is required and must be unique.',
        phone_number: 'Student phone number is required.',
        parent_contact: 'Parent contact number is required.',
        class_id: 'Please select a class for the student.',
        subject_ids: 'Please select at least one subject.',
        gender: 'Please select the student\'s gender.',
        address: 'Student address is required.',
        admission_date: 'Admission date is required in YYYY-MM-DD format.',
    };

    return {
        title: 'Required Field Missing',
        message: fieldMessages[field] || `${field} is required.`,
        type: 'error'
    };
};

export const handleAuthCreationError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Email already exists in auth
    if (errorMessage.includes('email') && errorMessage.includes('already')) {
        return {
            title: 'Email Already Registered',
            message: 'This email is already registered in the authentication system.',
            type: 'error'
        };
    }

    // Invalid email format
    if (errorMessage.includes('invalid') && errorMessage.includes('email')) {
        return {
            title: 'Invalid Email',
            message: 'The generated email format is invalid. Please check the roll number.',
            type: 'error'
        };
    }

    // Auth service unavailable
    if (errorMessage.includes('service') || errorMessage.includes('unavailable')) {
        return {
            title: 'Service Unavailable',
            message: 'The authentication service is temporarily unavailable. Please try again later.',
            type: 'error'
        };
    }

    return {
        title: 'Authentication Error',
        message: errorMessage || 'Failed to create authentication account. Please try again.',
        type: 'error'
    };
};

export const handleRollbackError = (error: any): ErrorResponse => {
    const errorMessage = error?.message?.toLowerCase() || '';

    return {
        title: 'Rollback Warning',
        message: 'An error occurred and changes may need manual cleanup. Please contact support.',
        type: 'warning'
    };
};