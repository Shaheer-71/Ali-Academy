// lib/api/students-full-flow.ts
import { supabase } from '@/src/lib/supabase';

interface StudentData {
    full_name: string;
    roll_number: string;
    phone_number: string;
    parent_contact: string;
    class_id: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    admission_date: string;
    date_of_birth?: string;
    emergency_contact?: string;
    parent_name?: string;
    medical_conditions?: string;
    notes?: string;
}

interface StudentsWithoutPasswords {
    id: string;
    full_name: string;
    email: string;
    roll_number: string;
    hasPassword: boolean;
    registrationCompleted: boolean;
    classes: { name: string };
}

// Create student in auth + students tables (profiles auto-created by Supabase)
export const createStudentWithAuth = async (studentData: StudentData, createdBy: string) => {
    try {
        // Generate email from roll number with a valid format for Supabase
        const email = `student.${studentData.roll_number.toLowerCase()}@gmail.com`;

        // Validate required fields
        if (!studentData.full_name || !studentData.roll_number || !studentData.phone_number ||
            !studentData.parent_contact || !studentData.class_id || !studentData.gender ||
            !studentData.address || !studentData.admission_date) {
            throw new Error('All required fields must be provided');
        }

        // Validate date formats
        const isValidDate = (dateStr: string) => {
            const regex = /^\d{4}-\d{2}-\d{2}$/;
            if (!regex.test(dateStr)) return false;
            const date = new Date(dateStr);
            return date instanceof Date && !isNaN(date.getTime());
        };

        if (!isValidDate(studentData.admission_date)) {
            throw new Error('Invalid admission_date format (use YYYY-MM-DD)');
        }
        if (studentData.date_of_birth && !isValidDate(studentData.date_of_birth)) {
            throw new Error('Invalid date_of_birth format (use YYYY-MM-DD)');
        }

        // Check if roll number already exists
        const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('roll_number', studentData.roll_number)
            .eq('is_deleted', false)
            .single();

        if (existingStudent) {
            throw new Error('Student with this roll number already exists');
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
            .from('students')
            .select('id')
            .eq('email', email)
            .eq('is_deleted', false)
            .single();

        if (existingEmail) {
            throw new Error('Student with this email already exists');
        }


        // Step 1: Create auth user using signUp 
        // Note: This automatically creates a profile via Supabase triggers
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: 'temp_password_' + Math.random().toString(36), // Temporary password
            options: {
                data: {
                    full_name: studentData.full_name,
                    role: 'student',
                    created_by_teacher: true,
                    roll_number: studentData.roll_number,
                    phone_number: studentData.phone_number
                }
            }
        });

        if (authError || !authData.user) {
            console.warn('Auth creation error:', authError);
            throw new Error(`Failed to create auth user: ${authError?.message}`);
        }

        const userId = authData.user.id;


        try {
            // Wait a moment for the profile to be created by triggers
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 2: Update the auto-created profile with our specific data
            // Only update fields that exist in the profiles table
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                    full_name: studentData.full_name,
                    role: 'student',
                    contact_number: studentData.phone_number
                    // Removed updated_by since it doesn't exist in profiles table
                })
                .eq('id', userId);


            // Step 3: Create student record
            const { data: studentRecord, error: studentError } = await supabase
                .from('students')
                .insert({
                    id: userId, // Same ID as auth user and profile
                    full_name: studentData.full_name,
                    roll_number: studentData.roll_number,
                    email: email,
                    phone_number: studentData.phone_number,
                    parent_contact: studentData.parent_contact,
                    class_id: studentData.class_id,
                    gender: studentData.gender,
                    address: studentData.address,
                    admission_date: studentData.admission_date,
                    date_of_birth: studentData.date_of_birth || null,
                    emergency_contact: studentData.emergency_contact || null,
                    parent_name: studentData.parent_name || null,
                    medical_conditions: studentData.medical_conditions || null,
                    notes: studentData.notes || null,
                    student_status: 'active',
                    is_deleted: false,
                    created_by: createdBy,
                    updated_by: createdBy
                })
                .select()
                .single();

            if (studentError) {
                console.warn('Student creation error:', studentError);
                throw new Error(`Failed to create student record: ${studentError.message}`);
            }


            return {
                success: true,
                data: {
                    student: studentRecord,
                    userId: userId,
                    email: email,
                    message: 'Student created successfully in all 3 tables (auth, profiles auto-created, students)'
                }
            };

        } catch (error: any) {
            console.warn('Error in student creation, auth user may need manual cleanup...');
            console.warn('Auth user ID that may need cleanup:', userId);

            throw error;
        }

    } catch (error: any) {
        console.warn('Error in createStudentWithAuth:', error.message);
        return { success: false, error: error.message };
    }
};

export const getStudentsWithoutPasswords = async (): Promise<StudentsWithoutPasswords[]> => {
    try {
        // For now, return empty array since we're using client-side auth creation
        // console.log('getStudentsWithoutPasswords called - returning empty array (using client-side auth)');
        return [];
    } catch (error: any) {
        console.warn('Error fetching students without passwords:', error.message);
        return [];
    }
};