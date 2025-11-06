// hooks/useDiaryForm.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { uploadToCloudinary } from '@/src/lib/cloudinary';
import { sendPushNotification } from '@/src/lib/notifications';
import { Alert } from 'react-native';

interface FormState {
    title: string;
    description: string;
    due_date: string;
    class_id: string;
    student_id: string;
    assignTo: 'class' | 'student';
    file: any;
    subject_id: string;
}

interface DiaryAssignment {
    id: string;
    title: string;
    description: string;
    due_date: string;
    file_url?: string;
    class_id?: string;
    student_id?: string;
    subject_id?: string;
    created_at: string;
    classes?: { name: string };
    students?: { full_name: string };
}

export const useDiaryForm = (profile: any, onSuccess: () => void) => {
    const [uploading, setUploading] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<DiaryAssignment | null>(null);
    const [newAssignment, setNewAssignment] = useState<FormState>({
        title: '',
        description: '',
        due_date: '',
        class_id: '',
        student_id: '',
        assignTo: 'class',
        file: null,
        subject_id: '',
    });

    const resetForm = useCallback(() => {
        setNewAssignment({
            title: '',
            description: '',
            due_date: '',
            class_id: '',
            student_id: '',
            assignTo: 'class',
            file: null,
            subject_id: '',
        });
        setEditingAssignment(null);
    }, []);

    const createAssignment = useCallback(async (
        classes: any[],
        subjects: any[],
    ) => {
        if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
            Alert.alert('Error', 'Please fill in all required fields');
            return false;
        }

        if (newAssignment.assignTo === 'class' && !newAssignment.class_id) {
            Alert.alert('Error', 'Please select a class');
            return false;
        }

        if (newAssignment.assignTo === 'student' && !newAssignment.student_id) {
            Alert.alert('Error', 'Please select a student');
            return false;
        }

        setUploading(true);

        try {
            console.log('🟢 Starting assignment creation...');
            let fileUrl: string | undefined;

            if (newAssignment.file) {
                console.log('Uploading file to Cloudinary...');
                const uploadResult = await uploadToCloudinary(newAssignment.file, 'raw');
                fileUrl = uploadResult.secure_url;
                console.log('✅ File uploaded:', fileUrl);
            }

            const assignmentData = {
                title: newAssignment.title,
                description: newAssignment.description,
                due_date: newAssignment.due_date,
                file_url: fileUrl,
                class_id: newAssignment.assignTo === 'class' ? newAssignment.class_id : null,
                student_id: newAssignment.assignTo === 'student' ? newAssignment.student_id : null,
                subject_id: newAssignment.subject_id || null,
                assigned_by: profile!.id,
            };

            console.log('📦 Inserting assignment data:', assignmentData);

            const { data: assignment, error } = await supabase
                .from('diary_assignments')
                .insert([assignmentData])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Assignment created:', assignment);

            // CASE 1: Class-wide assignment
            if (newAssignment.assignTo === 'class' && newAssignment.class_id) {
                console.log('🔔 Creating class-wide notification for class:', newAssignment.class_id);

                const { data: students, error: studentError } = await supabase
                    .from('students')
                    .select('id, full_name')
                    .eq('class_id', newAssignment.class_id);

                if (studentError) {
                    console.error('❌ Error fetching class students:', studentError);
                } else if (!students || students.length === 0) {
                    console.warn('⚠️ No students found for this class');
                } else {
                    console.log(`✅ Found ${students.length} students in class ${newAssignment.class_id}`);

                    const { data: notif, error: notifError } = await supabase
                        .from('notifications')
                        .insert([
                            {
                                type: 'assignment_added',
                                title: `New Assignment: ${newAssignment.title}`,
                                message: `A new assignment has been added for your class. Due date: ${newAssignment.due_date}.`,
                                entity_type: 'assignment',
                                entity_id: assignment.id,
                                created_by: profile!.id,
                                target_type: 'students',
                                target_id: newAssignment.class_id,
                                priority: 'medium',
                            },
                        ])
                        .select('id')
                        .single();

                    if (notifError) {
                        console.error('❌ Error creating class assignment notification:', notifError);
                    } else {
                        const recipientRows = students.map((s) => ({
                            notification_id: notif.id,
                            user_id: s.id,
                            is_read: false,
                            is_deleted: false,
                        }));

                        const { error: recipientError } = await supabase
                            .from('notification_recipients')
                            .insert(recipientRows);

                        if (recipientError) {
                            console.error('❌ Error adding assignment recipients:', recipientError);
                        } else {
                            console.log(`✅ Added ${students.length} notification recipients`);

                            console.log(`📱 [ASSIGNMENT] Sending push notifications to ${students.length} students...`);
                            let sentCount = 0;
                            let failedCount = 0;

                            for (let i = 0; i < students.length; i++) {
                                const student = students[i];
                                try {
                                    console.log(`📤 Sending to student ${i + 1}/${students.length}: ${student.full_name}`);
                                    await sendPushNotification({
                                        userId: student.id,
                                        title: `📝 New Assignment: ${newAssignment.title}`,
                                        body: `A new assignment has been added. Due date: ${newAssignment.due_date}.`,
                                        data: {
                                            type: 'assignment_added',
                                            notificationId: notif.id,
                                            assignmentId: assignment.id,
                                            classId: newAssignment.class_id,
                                            studentId: student.id,
                                            studentName: student.full_name,
                                            dueDate: newAssignment.due_date,
                                            timestamp: new Date().toISOString(),
                                        },
                                    });
                                    sentCount++;
                                } catch (pushError) {
                                    console.error(`❌ Failed to send push to ${student.full_name}:`, pushError);
                                    failedCount++;
                                    continue;
                                }
                            }

                            console.log(`📊 Push Summary: Sent ${sentCount}, Failed ${failedCount}`);
                        }
                    }
                }
            } else if (newAssignment.assignTo === 'student' && newAssignment.student_id) {
                console.log('🔔 Creating individual notification for student:', newAssignment.student_id);

                const { data: notif, error: notifError } = await supabase
                    .from('notifications')
                    .insert([
                        {
                            type: 'assignment_added',
                            title: `Assignment: ${newAssignment.title}`,
                            message: `You have received a new assignment. Due date: ${newAssignment.due_date}.`,
                            entity_type: 'assignment',
                            entity_id: assignment.id,
                            created_by: profile!.id,
                            target_type: 'individual',
                            target_id: newAssignment.student_id,
                            priority: 'medium',
                        },
                    ])
                    .select('id')
                    .single();

                if (notifError) {
                    console.error('❌ Error creating individual assignment notification:', notifError);
                } else {
                    const recipientRow = {
                        notification_id: notif.id,
                        user_id: newAssignment.student_id,
                        is_read: false,
                        is_deleted: false,
                    };

                    const { error: recipientError } = await supabase
                        .from('notification_recipients')
                        .insert([recipientRow]);

                    if (recipientError) {
                        console.error('❌ Error adding recipient:', recipientError);
                    } else {
                        console.log('✅ Added recipient for single student');

                        try {
                            await sendPushNotification({
                                userId: newAssignment.student_id,
                                title: `📝 New Assignment: ${newAssignment.title}`,
                                body: `You have a new assignment due on ${newAssignment.due_date}.`,
                                data: {
                                    type: 'assignment_added',
                                    notificationId: notif.id,
                                    assignmentId: assignment.id,
                                    studentId: newAssignment.student_id,
                                    dueDate: newAssignment.due_date,
                                    timestamp: new Date().toISOString(),
                                },
                            });
                            console.log(`✅ Push sent to student ID: ${newAssignment.student_id}`);
                        } catch (pushError) {
                            console.error('❌ Failed to send push notification:', pushError);
                        }
                    }
                }
            }

            Alert.alert('Success', 'Assignment created successfully');
            resetForm();
            onSuccess();
            return true;
        } catch (error: any) {
            console.error('🔥 Fatal Error in createAssignment:', error);
            Alert.alert('Error', error.message);
            return false;
        } finally {
            console.log('🟡 Upload process finished');
            setUploading(false);
        }
    }, [newAssignment, profile, resetForm, onSuccess]);

    return {
        uploading,
        editingAssignment,
        setEditingAssignment,
        newAssignment,
        setNewAssignment,
        resetForm,
        createAssignment,
    };
};