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
import { Alert } from 'react-native';
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

        if (newAssignment.assignTo === 'students' && newAssignment.student_ids.length === 0) {
            if (showError) {
                showError({ message: 'Please select at least one student' });
            } else {
                Alert.alert('Error', 'Please select at least one student');
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

            // ─── NOTIFICATIONS (non-blocking) ───────────────────────────
            try {
                let recipientIds: string[] = [];
                let targetType: string;
                let targetId: string | null = null;
                let pushTitle: string;
                let pushBody: string;

                // ── CASE 1: Whole class ──────────────────────────────────
                if (newAssignment.assignTo === 'class' && newAssignment.class_id) {
                    console.log('[DIARY NOTIF] Case 1 — whole class');
                    console.log('[DIARY NOTIF] class_id:', newAssignment.class_id, '| subject_id:', newAssignment.subject_id);

                    // Get only students taking THIS subject in THIS class
                    const query = supabase
                        .from('student_subject_enrollments')
                        .select('student_id')
                        .eq('class_id', newAssignment.class_id)
                        .eq('is_active', true);

                    // Filter by subject if one was selected
                    if (newAssignment.subject_id) {
                        query.eq('subject_id', newAssignment.subject_id);
                    }

                    const { data: enrollments, error: enrollErr } = await query;

                    if (enrollErr) {
                        console.warn('[DIARY NOTIF] Failed to fetch enrollments:', enrollErr.message);
                    } else {
                        recipientIds = [...new Set((enrollments ?? []).map((e) => e.student_id))];
                        console.log('[DIARY NOTIF] Students to notify:', recipientIds.length, recipientIds);
                    }

                    targetType = 'class';
                    targetId = newAssignment.class_id;
                    pushTitle = `📝 New Diary: ${newAssignment.title}`;
                    pushBody = `New diary assignment for your class. Due: ${newAssignment.due_date}.`;

                // ── CASE 2: Individual student(s) ────────────────────────
                } else {
                    console.log('[DIARY NOTIF] Case 2 — individual students');
                    console.log('[DIARY NOTIF] student_ids:', newAssignment.student_ids);

                    recipientIds = newAssignment.student_ids;
                    targetType = 'individual';
                    targetId = newAssignment.student_ids[0] ?? null;
                    pushTitle = `📝 New Diary: ${newAssignment.title}`;
                    pushBody = `You have a new diary assignment due on ${newAssignment.due_date}.`;
                }

                if (recipientIds.length === 0) {
                    console.log('[DIARY NOTIF] No recipients found — skipping notifications');
                } else {
                    // STEP 1: Insert notification record
                    console.log('[DIARY NOTIF] Step 1 — inserting notification record...');
                    const { data: notif, error: notifError } = await supabase
                        .from('notifications')
                        .insert([{
                            type: 'assignment_added',
                            title: `New Diary: ${newAssignment.title}`,
                            message: pushBody,
                            entity_type: 'diary_assignment',
                            entity_id: assignment.id,
                            created_by: profile!.id,
                            target_type: targetType,
                            target_id: targetId,
                            priority: 'medium',
                        }])
                        .select('id')
                        .single();

                    if (notifError) {
                        console.warn('[DIARY NOTIF] Step 1 failed:', notifError.message);
                    } else {
                        console.log('[DIARY NOTIF] Step 1 done — notification id:', notif.id);

                        // STEP 2: Bulk insert notification_recipients
                        console.log('[DIARY NOTIF] Step 2 — inserting', recipientIds.length, 'recipient(s)...');
                        const { error: recipientError } = await supabase
                            .from('notification_recipients')
                            .insert(
                                recipientIds.map((uid) => ({
                                    notification_id: notif.id,
                                    user_id: uid,
                                    is_read: false,
                                    is_deleted: false,
                                }))
                            );

                        if (recipientError) {
                            console.warn('[DIARY NOTIF] Step 2 failed:', recipientError.message);
                        } else {
                            console.log('[DIARY NOTIF] Step 2 done — recipients saved');
                        }

                        // STEP 3: Fetch device tokens for all recipients
                        console.log('[DIARY NOTIF] Step 3 — fetching device tokens...');
                        const { data: devices, error: deviceError } = await supabase
                            .from('devices')
                            .select('token')
                            .in('user_id', recipientIds);

                        if (deviceError) {
                            console.warn('[DIARY NOTIF] Step 3 failed:', deviceError.message);
                        } else {
                            console.log('[DIARY NOTIF] Step 3 done — devices found:', devices?.length ?? 0);
                        }

                        if (devices && devices.length > 0) {
                            // STEP 4: Send batch push to Expo
                            console.log('[DIARY NOTIF] Step 4 — sending batch push to', devices.length, 'device(s)...');
                            const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
                                method: 'POST',
                                headers: {
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(
                                    devices.map((d) => ({
                                        to: d.token,
                                        title: pushTitle,
                                        body: pushBody,
                                        data: {
                                            type: 'assignment_added',
                                            notificationId: notif.id,
                                            assignmentId: assignment.id,
                                        },
                                        sound: 'default',
                                        channelId: 'default',
                                    }))
                                ),
                            });
                            const expoResult = await expoResponse.json();
                            console.log('[DIARY NOTIF] Step 4 done — Expo response:', JSON.stringify(expoResult));
                        } else {
                            console.log('[DIARY NOTIF] Step 4 skipped — no registered devices');
                        }
                    }
                }
            } catch (notificationError: any) {
                console.warn('[DIARY NOTIF] Unexpected error (non-blocking):', notificationError);
                if (showError) {
                    showError(notificationError, handleNotificationErrorForDiary);
                }
            }
            // ────────────────────────────────────────────────────────────

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