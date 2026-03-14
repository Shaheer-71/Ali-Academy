// File: src/utils/signUpErrorHandler.ts

export interface UserFriendlyError {
    title: string;
    message: string;
}

// Handle email validation errors
export const handleEmailValidationError = (error: any): UserFriendlyError => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Problem',
            message: 'Please check your internet connection and try again.',
        };
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('query')) {
        return {
            title: 'Service Issue',
            message: 'We\'re having trouble accessing student records. Please try again in a moment.',
        };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return {
            title: 'Request Timed Out',
            message: 'The connection is taking too long. Please check your internet and try again.',
        };
    }

    // Generic fallback
    return {
        title: 'Validation Error',
        message: 'We couldn\'t validate your email. Please try again or contact your teacher.',
    };
};

// Handle password setting errors
export const handlePasswordSetError = (error: any): UserFriendlyError => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Account already exists
    if (errorMessage.includes('already registered') || errorMessage.includes('already been registered')) {
        return {
            title: 'Account Already Exists',
            message: 'An account with this email already exists. Please use the sign-in page instead.',
        };
    }

    // Email already exists
    if (errorMessage.includes('user already registered') || errorMessage.includes('duplicate')) {
        return {
            title: 'Account Already Exists',
            message: 'This email is already registered. Please sign in or contact your teacher.',
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Problem',
            message: 'Please check your internet connection and try again.',
        };
    }

    // Weak password
    if (errorMessage.includes('password') && errorMessage.includes('weak')) {
        return {
            title: 'Weak Password',
            message: 'Please choose a stronger password with at least 6 characters.',
        };
    }

    // Auth service errors
    if (errorMessage.includes('auth') || errorMessage.includes('authentication')) {
        return {
            title: 'Registration Failed',
            message: 'We couldn\'t create your account. Please try again or contact your teacher.',
        };
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('query')) {
        return {
            title: 'Service Issue',
            message: 'We\'re experiencing technical difficulties. Please try again in a moment.',
        };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return {
            title: 'Request Timed Out',
            message: 'The registration is taking too long. Please check your internet and try again.',
        };
    }

    // Generic fallback
    return {
        title: 'Registration Failed',
        message: 'We couldn\'t complete your registration. Please try again or contact your teacher for help.',
    };
};

// Validation errors for email step
export const getEmailValidationError = (email: string): UserFriendlyError | null => {
    if (!email.trim()) {
        return {
            title: 'Email Required',
            message: 'Please enter your email address to continue.',
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            title: 'Invalid Email',
            message: 'Please enter a valid email address (e.g., student@school.com).',
        };
    }

    return null;
};

// Validation errors for password step
export const getPasswordValidationError = (password: string, confirmPassword: string): UserFriendlyError | null => {
    if (!password.trim()) {
        return {
            title: 'Password Required',
            message: 'Please enter a password for your account.',
        };
    }

    if (password.length < 6) {
        return {
            title: 'Password Too Short',
            message: 'Your password must be at least 6 characters long.',
        };
    }

    if (password !== confirmPassword) {
        return {
            title: 'Passwords Don\'t Match',
            message: 'The passwords you entered don\'t match. Please check and try again.',
        };
    }

    return null;
};

// Handle sign-in after registration errors
export const handleSignInAfterRegistrationError = (error: any): UserFriendlyError => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Invalid credentials (shouldn't happen but just in case)
    if (errorMessage.includes('invalid login credentials')) {
        return {
            title: 'Sign In Failed',
            message: 'There was an issue signing you in. Please try signing in manually.',
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Problem',
            message: 'Registration successful, but couldn\'t sign you in automatically. Please sign in manually.',
        };
    }

    // Generic fallback
    return {
        title: 'Auto Sign-In Failed',
        message: 'Registration was successful! Please use the sign-in page to access your account.',
    };
};