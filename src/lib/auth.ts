// lib/auth.ts - Updated for clean workflow
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'student' | 'admin' | 'superadmin';
  contact_number?: string;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  roll_number: string;
  class_id: string;
  email?: string;
  student_status?: 'active' | 'inactive' | null;
  gender?: 'male' | 'female' | 'other' | null;
  admission_date?: string | null;
  date_of_birth?: string | null;
  is_active?: boolean | null;
}


export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw profileError;

  return { user: data.user, profile };
};

export const signUp = async (
  email: string,
  password: string,
  fullName: string,
  role: 'teacher' | 'student' | 'parent',
  contactNumber?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        contact_number: contactNumber,
      });

    if (profileError) throw profileError;
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<{ user: any; profile: UserProfile | null }> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
};

// Validate if email exists in students table (no auth check)
export const validateStudentEmail = async (email: string) => {
  try {
    // Check if email exists in students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        roll_number,
        email,
        has_registered,
        classes (
          name
        )
      `)
      .eq('email', email.toLowerCase().trim())
      .eq('is_deleted', false)
      .single();

    if (studentError || !student) {
      return {
        isValid: false,
        message: 'Email not found. Please contact your teacher to register.',
        student: null
      };
    }

    // Check if student has already registered
    if (student.has_registered) {
      return {
        isValid: false,
        message: 'This student has already completed registration. Please sign in instead.',
        student: null
      };
    }

    return {
      isValid: true,
      message: 'Email found! Please set your password.',
      student: student
    };

  } catch (error: any) {
    console.warn('Error validating email:', error);
    return {
      isValid: false,
      message: 'Error validating email. Please try again.',
      student: null
    };
  }
};

// Complete student registration - creates auth user for first time
export const completeStudentRegistration = async (email: string, password: string) => {
  try {
    // Get student details first
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('is_deleted', false)
      .single();

    if (studentError || !student) {
      throw new Error('Student record not found');
    }

    // Check if already registered
    if (student.has_registered) {
      throw new Error('This student has already completed registration. Please sign in instead.');
    }

    // Call Edge Function which uses Admin API to create auth user with
    // the exact same UUID already set in students.id and profiles.id.
    const fnUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/complete-student-registration`;
    const fnResponse = await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });

    console.log('[REG] Edge Function HTTP status:', fnResponse.status);
    const fnData = await fnResponse.json().catch(() => ({}));
    console.log('[REG] Edge Function response:', JSON.stringify(fnData));

    const fnError = !fnResponse.ok;
    if (fnError || !fnData?.success) {
      const msg = fnData?.error || `HTTP ${fnResponse.status}`;
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        throw new Error('An account with this email already exists. Please contact your teacher.');
      }
      throw new Error(msg);
    }

    return {
      success: true,
      message: 'Registration completed successfully! You can now sign in.',
      user: { id: fnData.userId }
    };

  } catch (error: any) {
    console.warn('Error completing registration:', error);
    return {
      success: false,
      message: error.message || 'Failed to complete registration'
    };
  }
};