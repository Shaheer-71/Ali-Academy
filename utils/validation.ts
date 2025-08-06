export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateRollNumber = (rollNumber: string): boolean => {
  return rollNumber.length >= 3 && /^[A-Z]\d+$/.test(rollNumber);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime()) && date.match(/^\d{4}-\d{2}-\d{2}$/);
};

export const validateTime = (time: string): boolean => {
  return time.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) !== null;
};

export interface FormErrors {
  [key: string]: string | null;
}

export const validateForm = (data: Record<string, any>, rules: Record<string, (value: any) => string | null>): FormErrors => {
  const errors: FormErrors = {};
  
  Object.keys(rules).forEach(field => {
    const validator = rules[field];
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
};