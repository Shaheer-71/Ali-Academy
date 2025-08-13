// lib/auth.ts - Updated for clean workflow
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'teacher' | 'student' | 'parent';
  contact_number?: string;
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
    console.error('Error validating email:', error);
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

    console.log('Creating auth user for student:', email);

    // Create auth user - this will also trigger profile creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: student.full_name,
          role: 'student',
          student_id: student.id,
          roll_number: student.roll_number,
          registration_completed: true
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      
      // Check if user already exists (shouldn't happen in this workflow but just in case)
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        throw new Error('An account with this email already exists. Please contact your teacher.');
      }
      
      throw new Error('Registration failed: ' + authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create user account');
    }

    console.log('Auth user created:', authData.user.id);

    // Update student record to mark as registered and link to auth user
    const { error: updateError } = await supabase
      .from('students')
      .update({
        id: authData.user.id, // Update ID to match auth user
        has_registered: true,
        updated_by: authData.user.id
      })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating student record:', updateError);
      // Don't throw - registration was successful
    }

    // Wait for profile auto-creation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure profile has correct data
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: student.full_name,
        role: 'student',
        contact_number: student.phone_number || null
      });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Don't throw - registration was successful
    }

    return {
      success: true,
      message: 'Registration completed successfully! You can now sign in.',
      user: authData.user
    };

  } catch (error: any) {
    console.error('Error completing registration:', error);
    return {
      success: false,
      message: error.message || 'Failed to complete registration'
    };
  }
};