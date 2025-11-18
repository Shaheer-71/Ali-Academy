// File: src/utils/errorHandler.ts

export interface UserFriendlyError {
    title: string;
    message: string;
}

export const handleAuthError = (error: any): UserFriendlyError => {
    const errorMessage = error?.message?.toLowerCase() || '';

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return {
            title: 'Connection Problem',
            message: 'Please check your internet connection and try again.',
        };
    }

    // JSON parsing errors (usually config issues)
    if (errorMessage.includes('json parse error') || errorMessage.includes('unexpected token')) {
        return {
            title: 'Service Unavailable',
            message: 'We\'re having trouble connecting to our servers. Please try again in a few moments.',
        };
    }

    // Invalid credentials
    if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid email or password')) {
        return {
            title: 'Login Failed',
            message: 'The email or password you entered is incorrect. Please try again.',
        };
    }

    // Email not confirmed
    if (errorMessage.includes('email not confirmed') || errorMessage.includes('email confirmation')) {
        return {
            title: 'Verify Your Email',
            message: 'Please check your email and click the verification link before signing in.',
        };
    }

    // User not found
    if (errorMessage.includes('user not found') || errorMessage.includes('no user found')) {
        return {
            title: 'Account Not Found',
            message: 'We couldn\'t find an account with this email. Please check your email or sign up.',
        };
    }

    // Too many requests
    if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
        return {
            title: 'Too Many Attempts',
            message: 'You\'ve tried too many times. Please wait a few minutes and try again.',
        };
    }

    // Password issues
    if (errorMessage.includes('password')) {
        return {
            title: 'Password Error',
            message: 'There\'s an issue with your password. Please make sure it\'s correct.',
        };
    }

    // Email issues
    if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
        return {
            title: 'Invalid Email',
            message: 'Please enter a valid email address.',
        };
    }

    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('server error')) {
        return {
            title: 'Server Error',
            message: 'Our servers are experiencing issues. Please try again later.',
        };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        return {
            title: 'Request Timed Out',
            message: 'The connection is taking too long. Please check your internet and try again.',
        };
    }

    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('query')) {
        return {
            title: 'Service Issue',
            message: 'We\'re experiencing technical difficulties. Please try again in a moment.',
        };
    }

    // Generic fallback
    return {
        title: 'Something Went Wrong',
        message: 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
    };
};

// Validation errors
export const getValidationError = (email: string, password: string): UserFriendlyError | null => {
    if (!email && !password) {
        return {
            title: 'Missing Information',
            message: 'Please enter your email and password to sign in.',
        };
    }

    if (!email) {
        return {
            title: 'Email Required',
            message: 'Please enter your email address.',
        };
    }

    if (!password) {
        return {
            title: 'Password Required',
            message: 'Please enter your password.',
        };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            title: 'Invalid Email',
            message: 'Please enter a valid email address (e.g., name@example.com).',
        };
    }

    return null;
};