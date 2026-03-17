// lib/api/simple-student-creation.ts
import { supabase } from '@/src/lib/supabase';

interface StudentData {
    full_name: string;
    roll_number: string;
    phone_number: string;
    parent_contact: string;
    class_id: string;
    subject_ids: string[];
    gender: 'male' | 'female' | 'other';
    address: string;
    admission_date: string;
    date_of_birth?: string;
    emergency_contact?: string;
    parent_name?: string;
    medical_conditions?: string;
    notes?: string;
    monthly_fee?: number;
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
        const email = `${studentData.roll_number.toLowerCase()}@aliacademy.com`;

        // Validate required fields
        if (!studentData.full_name || !studentData.roll_number || !studentData.phone_number ||
            !studentData.parent_contact || !studentData.class_id || !studentData.gender ||
            !studentData.address || !studentData.admission_date) {
            throw new Error('All required fields must be provided');
        }

        // ✅ Validate subjects
        if (!studentData.subject_ids || studentData.subject_ids.length === 0) {
            throw new Error('At least one subject must be selected');
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

        // Verify selected subjects are valid for this class
        const { data: classSubjects, error: csError } = await supabase
            .from('classes_subjects')
            .select('subject_id')
            .eq('class_id', studentData.class_id)
            .eq('is_active', true)
            .in('subject_id', studentData.subject_ids);

        if (csError) {
            console.warn('Error verifying subjects:', csError);
            throw new Error('Failed to verify subjects for this class');
        }

        if (!classSubjects || classSubjects.length !== studentData.subject_ids.length) {
            throw new Error('One or more selected subjects are not available for this class');
        }

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
                has_registered: false
            })
            .select()
            .single();

        if (error) {
            console.warn('Student creation error:', error);
            throw new Error(`Failed to create student record: ${error.message}`);
        }

        // Create student_subject_enrollments for each subject
        const enrollments = studentData.subject_ids.map(subjectId => ({
            student_id: data.id,
            class_id: studentData.class_id,
            subject_id: subjectId,
            is_active: true,
            created_by: createdBy,
        }));

        const { error: enrollmentError } = await supabase
            .from('student_subject_enrollments')
            .insert(enrollments);

        if (enrollmentError) {
            console.warn('Enrollment creation error:', enrollmentError);

            // ✅ Rollback: Delete the student if enrollments fail
            await supabase
                .from('students')
                .delete()
                .eq('id', data.id);

            throw new Error(`Failed to enroll student in subjects: ${enrollmentError.message}`);
        }

        // Pre-create profile with same id as students.id so all three stay in sync
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.id,
                email: email,
                full_name: studentData.full_name,
                role: 'student',
                contact_number: studentData.phone_number || null,
            });

        if (profileError) {
            console.warn('Profile pre-creation warning (non-fatal):', profileError.message);
        }

        // Save fee into fee_structures (class-level) and student_fees (per-student link)
        if (studentData.monthly_fee != null && studentData.monthly_fee >= 0) {
            const currentYear = new Date().getFullYear();

            // 1. Upsert into fee_structures with student_id (per-student fee)
            const { error: fsError } = await supabase
                .from('fee_structures')
                .upsert({
                    student_id: data.id,
                    class_id: studentData.class_id,
                    amount: studentData.monthly_fee,
                    academic_year: currentYear,
                }, { onConflict: 'student_id,class_id,academic_year' });

            if (fsError) {
                console.warn('fee_structures upsert warning (non-fatal):', fsError.message);
            }

            // 2. Upsert into student_fees for the FK link used by fee_payments
            const { error: sfError } = await supabase
                .from('student_fees')
                .upsert({
                    student_id: data.id,
                    class_id: studentData.class_id,
                    amount_due: studentData.monthly_fee,
                    academic_year: currentYear,
                }, { onConflict: 'student_id,class_id,academic_year' });

            if (sfError) {
                console.warn('student_fees upsert warning (non-fatal):', sfError.message);
            }
        }

        console.log(`✅ Student created, profile pre-created, enrolled in ${enrollments.length} subjects`);

        return {
            success: true,
            message: 'Student created successfully. They can now register with their email.',
            data: {
                student: data,
                email: email,
                enrolledSubjects: enrollments.length
            }
        };

    } catch (error: any) {
        console.warn('Error creating student:', error);
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
            console.warn('Error fetching unregistered students:', error);
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
        console.warn('Error fetching students without passwords:', error.message);
        return [];
    }
};