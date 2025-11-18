// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Notification } from '@/src/types/notification';
import * as Notifications from 'expo-notifications';

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

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_recipients')
        .select(`
          *,
          notification:notifications!inner(
            *,
            creator:created_by(
                id,
                full_name,
                role
              )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);

      console.debug('[NotificationContext] raw notification_recipients response:', { data, error });

      if (error) throw error;

      // Some Supabase setups or permissions may return recipient rows without the
      // nested `notification` object. In that case, fall back to fetching the
      // notifications separately and merge with recipient metadata.
      let formattedNotifications: Notification[] = [];

      if (data && data.length > 0 && data[0].notification) {
        formattedNotifications = data.map(item => {
          const notif = item.notification || {};
          // Map creator.full_name -> creator.name for UI consistency
          const creator = notif.creator
            ? {
                id: notif.creator.id,
                name: (notif.creator as any).full_name || (notif.creator as any).name,
                avatar_url: (notif.creator as any).avatar_url,
                role: (notif.creator as any).role,
              }
            : undefined;

          return {
            ...notif,
            creator,
            is_read: item.is_read,
            read_at: item.read_at,
          } as Notification;
        });
      } else if (data && data.length > 0) {
        // Fallback: collect notification_ids and fetch full notifications
        const notifIds = data.map((r: any) => r.notification_id).filter(Boolean);
        console.debug('[NotificationContext] fallback fetching notifications for ids:', notifIds);

        if (notifIds.length > 0) {
          const { data: notifsData, error: notifsError } = await supabase
            .from('notifications')
            .select(`*, creator:created_by(id, full_name, avatar_url, role)`)
            .in('id', notifIds);

          if (notifsError) throw notifsError;

          const notifById = (notifsData || []).reduce((acc: any, n: any) => {
            acc[n.id] = n;
            return acc;
          }, {} as Record<string, any>);

          formattedNotifications = data.map((r: any) => {
            const n = notifById[r.notification_id] || {};
            const creator = n.creator
              ? {
                  id: n.creator.id,
                  name: n.creator.full_name || n.creator.name,
                  avatar_url: n.creator.avatar_url,
                  role: n.creator.role,
                }
              : undefined;

            return ({
              ...n,
              creator,
              is_read: r.is_read,
              read_at: r.read_at,
            } as Notification);
          });
        }
      }

      setNotifications(formattedNotifications);
    } catch (err) {
      console.log('Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notification_recipients')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('notification_id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notification_recipients')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .in('notification_id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
    } catch (err) {
      console.warn('Failed to mark all as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_deleted: true })
        .eq('notification_id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (err) {
      console.warn('Failed to delete notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_deleted: true })
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
    } catch (err) {
      console.warn('Failed to clear notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear all');
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_recipients',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            // Fetch the full notification details
            const { data } = await supabase
              .from('notifications')
              .select(`
                *,
                creator:created_by(
                      id,
                      full_name,
                      avatar_url,
                      role
                    )
              `)
              .eq('id', payload.new.notification_id)
              .single();

            if (data) {
              const creator = data.creator
                ? {
                    id: data.creator.id,
                    name: (data.creator as any).full_name || (data.creator as any).name,
                    avatar_url: data.creator.avatar_url,
                    role: data.creator.role,
                  }
                : undefined;

              const newNotification: Notification = {
                ...data,
                creator,
                is_read: false,
              };
              
              setNotifications(prev => [newNotification, ...prev]);
              
              // Show push notification
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: data.title,
                  body: data.message,
                  data: { notificationId: data.id },
                },
                trigger: null,
              });
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupRealtimeSubscription();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};