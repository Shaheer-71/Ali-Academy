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
            console.log('🟢 Starting notification creation...');

            // Step 1: Create notification record
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

            console.log('📝 Creating notification:', notificationData);

            const { data: notification, error: notifError } = await supabase
                .from('notifications')
                .insert([notificationData])
                .select()
                .single();

            if (notifError) throw notifError;

            console.log('✅ Notification created:', notification.id);

            // Step 2: Get recipients based on target_type
            let recipients: any[] = [];

            if (formData.target_type === 'all') {
                console.log('👥 Fetching all users...');
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id');

                if (error) throw error;
                recipients = data || [];
                console.log(`✅ Found ${recipients.length} total users`);
            } else if (formData.target_type === 'students') {
                console.log('👨‍🎓 Fetching all students...');
                const { data, error } = await supabase
                    .from('students')
                    .select('id');

                if (error) throw error;
                recipients = data || [];
                console.log(`✅ Found ${recipients.length} students`);
            } else if (formData.target_type === 'individual') {
                console.log('👤 Setting individual recipient:', formData.target_id);
                recipients = [{ id: formData.target_id }];
            }

            if (recipients.length === 0) {
                console.warn('⚠️ No recipients found');
                Alert.alert('Warning', 'No recipients found for this notification');
                setSending(false);
                return true;
            }

            // Step 3: Create notification_recipients records
            console.log(`📧 Creating ${recipients.length} recipient records...`);

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

            console.log(`✅ Created ${recipients.length} notification recipient records`);

            // Step 4: Send push notifications
            console.log(`📱 Sending push notifications to ${recipients.length} recipients...`);

            let sentCount = 0;
            let failedCount = 0;

            for (let i = 0; i < recipients.length; i++) {
                const recipient = recipients[i];
                try {
                    console.log(`📤 Sending push ${i + 1}/${recipients.length} to user ${recipient.id}`);

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
                    console.warn(`❌ Failed to send push to ${recipient.id}:`, pushError);
                    failedCount++;
                }
            }

            console.log(`📊 Push Summary: Sent ${sentCount}/${recipients.length}, Failed ${failedCount}`);

            Alert.alert(
                'Success',
                `Notification sent to ${sentCount} recipient(s)${failedCount > 0 ? ` (${failedCount} push notifications failed)` : ''}`
            );

            resetForm();
            return true;
        } catch (error: any) {
            console.warn('🔥 Error in sendNotification:', error);
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
