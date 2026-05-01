// ===================================
// hooks/useDiaryForm.ts
// ===================================
import { uploadToCloudinary } from '@/src/lib/cloudinary';
import {
    handleAssignmentCreateError,
    handleCloudinaryUploadErrorForDiary,
    handleNotificationErrorForDiary,
} from '@/src/utils/errorHandler/diaryErrorHandler';
import { useCallback, useState } from 'react';
import { useDialog } from '@/src/contexts/DialogContext';
import { supabase } from '@/src/lib/supabase';

interface FormState {
    title: string;
    description: string;
    due_date: string;
    class_id: string;
    student_ids: string[];
    assignTo: 'class' | 'students';
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
    const { showError: dialogShowError } = useDialog();
    const [uploading, setUploading] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<DiaryAssignment | null>(null);
    const [newAssignment, setNewAssignment] = useState<FormState>({
        title: '',
        description: '',
        due_date: '',
        class_id: '',
        student_ids: [],
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
            student_ids: [],
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
                dialogShowError('Error', 'Please fill in all required fields');
            }
            return false;
        }

        if (newAssignment.assignTo === 'class' && !newAssignment.class_id) {
            if (showError) {
                showError({ message: 'Please select a class' });
            } else {
                dialogShowError('Error', 'Please select a class');
            }
            return false;
        }

        if (newAssignment.assignTo === 'students' && newAssignment.student_ids.length === 0) {
            if (showError) {
                showError({ message: 'Please select at least one student' });
            } else {
                dialogShowError('Error', 'Please select at least one student');
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
                        dialogShowError('Upload Error', uploadError.message || 'Failed to upload file');
                    }

                    return false;
                }
            }

            const assignmentData = {
                title: newAssignment.title,
                description: newAssignment.description,
                due_date: newAssignment.due_date,
                file_url: fileUrl,
                class_id: newAssignment.class_id || null,
                student_ids: newAssignment.assignTo === 'students' ? newAssignment.student_ids : [],
                subject_id: newAssignment.subject_id || null,
                assigned_by: profile!.id,
            };

            const { data: assignment, error } = await supabase
                .from('diary_assignments')
                .insert([assignmentData])
                .select()
                .single();

            if (error) throw error;

            // Tell user we're done — fire notifications in background
            resetForm();
            onSuccess();

            // ─── NOTIFICATIONS (background, non-blocking) ───────────────
            const assignmentId = assignment.id;
            const assignTitle = newAssignment.title;
            const assignDueDate = newAssignment.due_date;
            const assignTo = newAssignment.assignTo;
            const classId = newAssignment.class_id;
            const subjectId = newAssignment.subject_id;
            const studentIds = newAssignment.student_ids;
            const creatorId = profile!.id;

            ;(async () => {
                try {
                    let recipientIds: string[] = [];
                    let targetType: string;
                    let targetId: string | null = null;
                    const pushTitle = `New Diary: ${assignTitle}`;
                    let pushBody: string;

                    if (assignTo === 'class' && classId) {
                        const query = supabase
                            .from('student_subject_enrollments')
                            .select('student_id')
                            .eq('class_id', classId)
                            .eq('is_active', true);
                        if (subjectId) query.eq('subject_id', subjectId);
                        const { data: enrollments } = await query;
                        recipientIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
                        targetType = 'class';
                        targetId = classId;
                        pushBody = `New diary assignment for your class. Due: ${assignDueDate}.`;
                    } else {
                        recipientIds = studentIds;
                        targetType = 'individual';
                        targetId = studentIds[0] ?? null;
                        pushBody = `You have a new diary assignment due on ${assignDueDate}.`;
                    }

                    if (recipientIds.length === 0) return;

                    const { data: notif } = await supabase
                        .from('notifications')
                        .insert([{
                            type: 'assignment_added',
                            title: pushTitle,
                            message: pushBody,
                            entity_type: 'diary_assignment',
                            entity_id: assignmentId,
                            created_by: creatorId,
                            target_type: targetType,
                            target_id: targetId,
                            priority: 'medium',
                        }])
                        .select('id')
                        .single();

                    if (!notif) return;

                    await supabase.from('notification_recipients').insert(
                        recipientIds.map((uid) => ({
                            notification_id: notif.id,
                            user_id: uid,
                            is_read: false,
                            is_deleted: false,
                        }))
                    );

                    const { data: devices } = await supabase
                        .from('devices')
                        .select('token')
                        .in('user_id', recipientIds);

                    if (devices && devices.length > 0) {
                        await fetch('https://exp.host/--/api/v2/push/send', {
                            method: 'POST',
                            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                            body: JSON.stringify(
                                devices.map((d) => ({
                                    to: d.token,
                                    title: pushTitle,
                                    body: pushBody,
                                    data: { type: 'assignment_added', notificationId: notif.id, assignmentId },
                                    sound: 'default',
                                    channelId: 'default',
                                }))
                            ),
                        });
                    }
                } catch (e) {
                    console.warn('[DIARY NOTIF] Background error (non-fatal):', e);
                }
            })();
            // ─────────────────────────────────────────────────────────────

            return true;
        } catch (error: any) {
            console.warn('🔥 Fatal Error in createAssignment:', error);

            if (showError) {
                showError(error, handleAssignmentCreateError);
            } else {
                dialogShowError('Error', error.message || 'Failed to create assignment');
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