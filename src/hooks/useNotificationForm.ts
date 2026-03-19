// hooks/useNotificationForm.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useDialog } from '@/src/contexts/DialogContext';

interface NotificationFormData {
    title: string;
    message: string;
    type: 'announcement' | 'assignment_added' | 'event' | 'reminder' | 'other';
    priority: 'low' | 'medium' | 'high';
    target_type: 'all' | 'students' | 'individual';
    target_id: string;
    entity_type: string;
    entity_id: string;
}

const INITIAL_FORM_STATE: NotificationFormData = {
    title: '',
    message: '',
    type: 'announcement',
    priority: 'medium',
    target_type: 'students',
    target_id: '',
    entity_type: '',
    entity_id: '',
};

export const useNotificationForm = (profile: any) => {
    const { showError, showSuccess, showWarning } = useDialog();
    const [formData, setFormData] = useState<NotificationFormData>(INITIAL_FORM_STATE);
    const [sending, setSending] = useState(false);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
    }, []);

    const sendNotification = useCallback(async () => {
        if (!profile?.id) {
            showError('Error', 'User not authenticated');
            return false;
        }

        setSending(true);

        try {
            const notificationData = {
                title: formData.title,
                message: formData.message,
                type: formData.type,
                priority: formData.priority,
                target_type: formData.target_type,
                target_id: formData.target_id || null,
                entity_type: formData.entity_type || 'notification',
                entity_id: formData.entity_id || null,
                created_by: profile.id,
            };

            const { data: notification, error: notifError } = await supabase
                .from('notifications')
                .insert([notificationData])
                .select()
                .single();

            if (notifError) throw notifError;

            let recipients: any[] = [];

            if (formData.target_type === 'all') {
                const { data, error } = await supabase.from('profiles').select('id');
                if (error) throw error;
                recipients = data || [];
            } else if (formData.target_type === 'students') {
                const { data, error } = await supabase.from('profiles').select('id').eq('role', 'student');
                if (error) throw error;
                recipients = data || [];
            } else if (formData.target_type === 'individual') {
                recipients = [{ id: formData.target_id }];
            }

            if (recipients.length === 0) {
                showWarning('Warning', 'No recipients found for this notification');
                setSending(false);
                return true;
            }

            const recipientRecords = recipients.map((recipient) => ({
                notification_id: notification.id,
                user_id: recipient.id,
                is_read: false,
                is_deleted: false,
            }));

            const { error: recipientError } = await supabase
                .from('notification_recipients')
                .insert(recipientRecords);

            if (recipientError) throw recipientError;

            let sentCount = 0;
            let failedCount = 0;

            // Batch: fetch ALL device tokens for ALL recipients in ONE query
            const recipientIds = recipients.map((r) => r.id);
            const { data: devices } = await supabase
                .from('devices')
                .select('token')
                .in('user_id', recipientIds);

            if (devices && devices.length > 0) {
                const notifData = {
                    type: formData.type,
                    notificationId: notification.id,
                    priority: formData.priority,
                    target_type: formData.target_type,
                    timestamp: new Date().toISOString(),
                };

                const messages = devices.map((device) => ({
                    to: device.token,
                    title: formData.title,
                    body: formData.message,
                    data: notifData,
                    sound: 'default',
                    badge: 1,
                    channelId: 'default',
                }));

                try {
                    const response = await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(messages),
                    });
                    const result = await response.json();
                    const statuses = Array.isArray(result?.data) ? result.data : [result?.data];
                    statuses.forEach((s: any) => {
                        if (s?.status === 'error') failedCount++;
                        else sentCount++;
                    });
                } catch (pushError) {
                    console.warn('Batch push send failed:', pushError);
                    failedCount = devices.length;
                }
            } else {
                sentCount = recipients.length;
            }

            showSuccess(
                'Success',
                `Notification sent to ${sentCount} recipient(s)${failedCount > 0 ? ` (${failedCount} push notifications failed)` : ''}`
            );

            resetForm();
            return true;
        } catch (error: any) {
            console.warn('Error in sendNotification:', error);
            showError('Error', error.message || 'Failed to send notification');
            return false;
        } finally {
            setSending(false);
        }
    }, [formData, profile, resetForm]);

    return {
        formData,
        setFormData,
        sending,
        sendNotification,
        resetForm,
    };
};
