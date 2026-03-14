// hooks/useNotificationForm.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { sendPushNotification } from '@/src/lib/notifications';
import { Alert } from 'react-native';

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
    const [formData, setFormData] = useState<NotificationFormData>(INITIAL_FORM_STATE);
    const [sending, setSending] = useState(false);

    const resetForm = useCallback(() => {
        setFormData(INITIAL_FORM_STATE);
    }, []);

    const sendNotification = useCallback(async () => {
        if (!profile?.id) {
            Alert.alert('Error', 'User not authenticated');
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
                const { data, error } = await supabase.from('students').select('id');
                if (error) throw error;
                recipients = data || [];
            } else if (formData.target_type === 'individual') {
                recipients = [{ id: formData.target_id }];
            }

            if (recipients.length === 0) {
                Alert.alert('Warning', 'No recipients found for this notification');
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

            for (const recipient of recipients) {
                try {
                    await sendPushNotification({
                        userId: recipient.id,
                        title: formData.title,
                        body: formData.message,
                        data: {
                            type: formData.type,
                            notificationId: notification.id,
                            priority: formData.priority,
                            target_type: formData.target_type,
                            timestamp: new Date().toISOString(),
                        },
                    });
                    sentCount++;
                } catch (pushError) {
                    console.warn(`Failed to send push to ${recipient.id}:`, pushError);
                    failedCount++;
                }
            }

            Alert.alert(
                'Success',
                `Notification sent to ${sentCount} recipient(s)${failedCount > 0 ? ` (${failedCount} push notifications failed)` : ''}`
            );

            resetForm();
            return true;
        } catch (error: any) {
            console.warn('Error in sendNotification:', error);
            Alert.alert('Error', error.message || 'Failed to send notification');
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
