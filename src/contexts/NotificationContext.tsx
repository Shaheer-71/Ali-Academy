// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { Notification } from '@/src/types/notification';
import * as Notifications from 'expo-notifications';

// Android notification channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#b6d509',
  });
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lifecycle refs — never trigger re-renders
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeUserIdRef = useRef<string | null>(null);
  const isSettingUpRef = useRef(false);

  // ── Fetch all notifications for the current user ───────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('notification_recipients')
        .select(`
          *,
          notification:notifications!inner(
            *,
            creator:profiles!notifications_created_by_fkey(id, full_name, role)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      let formatted: Notification[] = [];

      if (data && data.length > 0 && data[0].notification) {
        // Primary path: nested join worked
        formatted = data.map(item => {
          const notif = item.notification as any;
          const creator = notif.creator
            ? { id: notif.creator.id, name: notif.creator.full_name, avatar_url: notif.creator.avatar_url, role: notif.creator.role }
            : undefined;
          return { ...notif, creator, is_read: item.is_read, read_at: item.read_at } as Notification;
        });
      } else if (data && data.length > 0) {
        // Fallback: fetch notifications separately
        const ids = data.map((r: any) => r.notification_id).filter(Boolean);
        if (ids.length > 0) {
          const { data: notifsData } = await supabase
            .from('notifications')
            .select('*, creator:profiles!notifications_created_by_fkey(id, full_name, avatar_url, role)')
            .in('id', ids);

          const byId = (notifsData || []).reduce((acc: any, n: any) => { acc[n.id] = n; return acc; }, {});
          formatted = data.map((r: any) => {
            const n = byId[r.notification_id] || {};
            const creator = n.creator
              ? { id: n.creator.id, name: n.creator.full_name, avatar_url: n.creator.avatar_url, role: n.creator.role }
              : undefined;
            return { ...n, creator, is_read: r.is_read, read_at: r.read_at } as Notification;
          });
        }
      }

      setNotifications(formatted);
    } catch (err) {
      console.warn('[Notifications] fetchNotifications error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Handle a realtime INSERT without a full refetch ───────────────────────
  const handleInsert = useCallback(async (payload: any) => {
    const notificationId = payload.new?.notification_id;
    if (!notificationId) return;

    try {
      const { data } = await supabase
        .from('notifications')
        .select('*, creator:profiles!notifications_created_by_fkey(id, full_name, avatar_url, role)')
        .eq('id', notificationId)
        .single();

      if (!data) return;

      const creator = data.creator
        ? { id: data.creator.id, name: (data.creator as any).full_name, avatar_url: data.creator.avatar_url, role: data.creator.role }
        : undefined;

      const newNotif: Notification = { ...data, creator, is_read: false };

      // Prepend without duplicating
      setNotifications(prev => prev.some(n => n.id === newNotif.id) ? prev : [newNotif, ...prev]);

      // Show local notification banner while the app is open
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: { notificationId: data.id, type: data.type },
          sound: true,
        },
        trigger: Platform.OS === 'android'
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: 'default' }
          : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
      });
    } catch {
      // If we can't fetch the notification details, fall back to a full refetch
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Tear down channel + poll timer ────────────────────────────────────────
  const stopRealtimeForUser = useCallback(async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // ── Set up realtime channel + polling for a logged-in user ────────────────
  const setupForUser = useCallback(async (userId: string) => {
    // Guard: skip if already active for this user OR if setup is already in progress
    if (activeUserIdRef.current === userId) return;
    if (isSettingUpRef.current) return;

    isSettingUpRef.current = true;

    // Inline teardown so we don't reset isSettingUpRef prematurely
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    if (channelRef.current) { await supabase.removeChannel(channelRef.current); channelRef.current = null; }

    // Mark the new user as active BEFORE releasing the setup lock
    activeUserIdRef.current = userId;
    isSettingUpRef.current = false;

    // Initial data load
    await fetchNotifications();

    // ── Supabase Realtime ────────────────────────────────────────────────────
    // Unique channel name prevents conflicts if the component remounts quickly
    const channel = supabase
      .channel(`notif_recipients_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${userId}`,
        },
        handleInsert,
      )
      .subscribe((status, err) => {
        console.log('[Notifications] Realtime:', status, err ?? '');
        // If realtime fails, do a one-time full refetch
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          fetchNotifications();
        }
      });

    channelRef.current = channel;

    // ── Polling fallback (15 s) ───────────────────────────────────────────────
    // Ensures the list stays fresh even if the realtime channel drops,
    // or if the Supabase project has realtime rate-limited.
    pollTimerRef.current = setInterval(() => fetchNotifications(), 15000);
  }, [fetchNotifications, handleInsert]);

  // ── Drive setup / teardown from auth state ────────────────────────────────
  useEffect(() => {
    // Immediately check if we already have a session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setupForUser(user.id);
    });

    // Watch for sign-in / sign-out
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setupForUser(session.user.id);
      } else {
        stopRealtimeForUser();
        activeUserIdRef.current = null;
        setNotifications([]);
      }
    });

    return () => {
      authSub.unsubscribe();
      stopRealtimeForUser();
      activeUserIdRef.current = null;
    };
  }, [setupForUser, stopRealtimeForUser]);

  // ── Refresh when a push notification arrives in the foreground ────────────
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      fetchNotifications();
    });
    return () => sub.remove();
  }, [fetchNotifications]);

  // ── Refresh when app comes back to foreground ─────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') fetchNotifications();
    });
    return () => sub.remove();
  }, [fetchNotifications]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('notification_id', notificationId)
        .eq('user_id', user.id);
      if (error) throw error;
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
    } catch (err) {
      console.warn('[Notifications] markAsRead error:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (!unreadIds.length) return;
      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('notification_id', unreadIds);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
    } catch (err) {
      console.warn('[Notifications] markAllAsRead error:', err);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_deleted: true })
        .eq('notification_id', notificationId)
        .eq('user_id', user.id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.warn('[Notifications] deleteNotification error:', err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_deleted: true })
        .eq('user_id', user.id);
      if (error) throw error;
      setNotifications([]);
    } catch (err) {
      console.warn('[Notifications] clearAll error:', err);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
