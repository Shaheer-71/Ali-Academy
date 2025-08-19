// lib/api/simple-student-creation.ts
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

// Simple version - creates student in students table only
// NO auth user creation - that happens when student sets password
export const createStudentSimple = async (studentData: StudentData, createdBy: string) => {
    try {
        // Generate email from roll number
        const email = `${studentData.roll_number.toLowerCase()}@aliacademy.edu`;

        // Validate required fields
        if (!studentData.full_name || !studentData.roll_number || !studentData.phone_number ||
            !studentData.parent_contact || !studentData.class_id || !studentData.gender ||
            !studentData.address || !studentData.admission_date) {
            throw new Error('All required fields must be provided');
        }

        // Validate date format
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

        console.log('Creating student record (NO auth user creation)...');

        // Create student record ONLY - no auth user
        const { data, error } = await supabase
            .from('students')
            .insert({
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
                updated_by: createdBy,
                // Add flag to track if student has registered yet
                has_registered: false
            })
            .select()
            .single();

        if (error) {
            console.error('Student creation error:', error);
            throw new Error(`Failed to create student record: ${error.message}`);
        }

        console.log('Student record created successfully (students table only)');

        return {
            success: true,
            message: 'Student created successfully. They can now register with their email.',
            data: {
                student: data,
                email: email
            }
        };

    } catch (error: any) {
        console.error('Error creating student:', error);
        return { success: false, error: error.message };
    }
};

// Function to get students who haven't registered yet
export const getStudentsWithoutPasswords = async (): Promise<StudentsWithoutPasswords[]> => {
    try {
        // Get all students who haven't registered
        const { data: students, error } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                email,
                roll_number,
                has_registered,
                classes (
                    name
                )
            `)
            .eq('is_deleted', false)
            .eq('has_registered', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching unregistered students:', error);
            return [];
        }

        // Transform to expected format
        const studentsWithoutPasswords: StudentsWithoutPasswords[] = (students || []).map(student => ({
            id: student.id,
            full_name: student.full_name,
            email: student.email,
            roll_number: student.roll_number,
            hasPassword: false,
            registrationCompleted: student.has_registered || false,
            classes: student.classes || { name: 'N/A' }
        }));

        return studentsWithoutPasswords;

    } catch (error: any) {
        console.error('Error fetching students without passwords:', error.message);
        return [];
    }
};