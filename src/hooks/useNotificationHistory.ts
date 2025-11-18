
// hooks/useNotificationHistory.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useNotificationHistory = (profile: any) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!profile?.id) return;

        try {
            setLoading(true);
            console.log('📋 Fetching notifications for user:', profile.id);

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('created_by', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log(`✅ Fetched ${data?.length || 0} notifications`);
            setNotifications(data || []);
        } catch (error) {
            console.warn('❌ Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);

    return {
        notifications,
        loading,
        fetchNotifications,
    };
};