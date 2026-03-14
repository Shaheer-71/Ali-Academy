// ===================================
// hooks/useDiaryForm.ts
// ===================================
import { uploadToCloudinary } from '@/src/lib/cloudinary';
import { sendPushNotification } from '@/src/lib/notifications';
import {
    handleAssignmentCreateError,
    handleCloudinaryUploadErrorForDiary,
    handleNotificationErrorForDiary,
} from '@/src/utils/errorHandler/diaryErrorHandler';
import { useCallback, useState } from 'react';
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

export const useDiaryForm = (
    profile: any,
    onSuccess: () => void,
    showError?: (error: any, handler?: (error: any) => any) => void
) => {
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
        // Validation
        if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
            if (showError) {
                showError({ message: 'Please fill in all required fields' });
            } else {
                Alert.alert('Error', 'Please fill in all required fields');
            }
            return false;
        }

        if (newAssignment.assignTo === 'class' && !newAssignment.class_id) {
            if (showError) {
                showError({ message: 'Please select a class' });
            } else {
                Alert.alert('Error', 'Please select a class');
            }
            return false;
        }

        if (newAssignment.assignTo === 'student' && !newAssignment.student_id) {
            if (showError) {
                showError({ message: 'Please select a student' });
            } else {
                Alert.alert('Error', 'Please select a student');
            }
            return false;
        }

        setUploading(true);

        try {
            let fileUrl: string | undefined;

            // Upload file if present
            if (newAssignment.file) {
                try {
                    const uploadResult = await uploadToCloudinary(newAssignment.file, 'raw');
                    fileUrl = uploadResult.secure_url;
                } catch (uploadError: any) {
                    console.warn('❌ File upload error:', uploadError);

                    if (showError) {
                        showError(uploadError, handleCloudinaryUploadErrorForDiary);
                    } else {
                        Alert.alert('Upload Error', uploadError.message || 'Failed to upload file');
                    }

                    return false;
                }
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

            const { data: assignment, error } = await supabase
                .from('diary_assignments')
                .insert([assignmentData])
                .select()
                .single();

            if (error) throw error;

            // Handle notifications (non-blocking)
            try {
                if (newAssignment.assignTo === 'class' && newAssignment.class_id) {
                    const { data: students, error: studentError } = await supabase
                        .from('students')
                        .select('id, full_name')
                        .eq('class_id', newAssignment.class_id);

                    if (studentError) {
                        console.warn('❌ Error fetching class students:', studentError);
                    } else if (students && students.length > 0) {
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

                        if (!notifError && notif) {
                            const recipientRows = students.map((s) => ({
                                notification_id: notif.id,
                                user_id: s.id,
                                is_read: false,
                                is_deleted: false,
                            }));

                            await supabase.from('notification_recipients').insert(recipientRows);

                            // Send push notifications
                            for (const student of students) {
                                try {
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
                                } catch (pushError) {
                                    console.warn(`❌ Failed to send push to ${student.full_name}:`, pushError);
                                }
                            }
                        }
                    }
                } else if (newAssignment.assignTo === 'student' && newAssignment.student_id) {
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

                    if (!notifError && notif) {
                        const recipientRow = {
                            notification_id: notif.id,
                            user_id: newAssignment.student_id,
                            is_read: false,
                            is_deleted: false,
                        };

                        await supabase.from('notification_recipients').insert([recipientRow]);

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
                        } catch (pushError) {
                            console.warn('❌ Failed to send push notification:', pushError);
                        }
                    }
                }
            } catch (notificationError: any) {
                // Non-blocking: just log and show warning if handler exists
                console.warn('⚠️ Notification error (non-blocking):', notificationError);

                if (showError) {
                    showError(notificationError, handleNotificationErrorForDiary);
                }
            }

            resetForm();
            onSuccess();
            return true;
        } catch (error: any) {
            console.warn('🔥 Fatal Error in createAssignment:', error);

            if (showError) {
                showError(error, handleAssignmentCreateError);
            } else {
                Alert.alert('Error', error.message || 'Failed to create assignment');
            }

            return false;
        } finally {
            setUploading(false);
        }
    }, [newAssignment, profile, resetForm, onSuccess, showError]);

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