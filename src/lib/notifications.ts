// ============================================
// lib/notifications.ts - COMPLETE FILE
// ============================================
// Copy this entire file and replace your existing one

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { Platform } from 'react-native';

// ============================================
// 1. SETUP NOTIFICATION HANDLERS
// ============================================
export function setupNotificationHandlers() {
    // Handle notification when app is in foreground
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });

    // Handle when user receives notification (foreground)
    Notifications.addNotificationReceivedListener((notification) => {
        console.log('📨 Notification received:', notification);
    });

    // Handle when user taps notification
    Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 User tapped notification:', response.notification.request.content);
    });

    console.log('✅ Notification handlers setup complete');
}

// ============================================
// 2. REGISTER DEVICE FOR NOTIFICATIONS
// ============================================
export async function registerDeviceForNotifications(userId: string) {
    try {
        // Request permission from user
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            console.log('❌ Push notification permission denied');
            return;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        const token = tokenData.data;

        console.log('📱 Push Token:', token);

        // Save token to Supabase
        const { error } = await supabase.from('devices').upsert(
            {
                user_id: userId,
                token: token,
                platform: Platform.OS,
            },
            {
                onConflict: 'user_id',
            }
        );

        if (error) {
            console.log('❌ Error storing token:', error);
            return;
        }

        console.log('✅ Device registered successfully');
    } catch (error) {
        console.log('❌ Error registering device:', error);
    }
}

// ============================================
// 3. SEND PUSH NOTIFICATION
// ============================================
export async function sendPushNotification({
    userId,
    title,
    body,
    data = {},
}: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}) {
    try {
        // Get device token from Supabase
        const { data: devices, error: fetchError } = await supabase
            .from('devices')
            .select('token')
            .eq('user_id', userId)
            .single();

        if (fetchError || !devices?.token) {
            console.log('❌ No device found for user:', userId);
            return;
        }

        const token = devices.token;

        // Call Supabase Edge Function
        const { data: result, error } = await supabase.functions.invoke(
            'send-notification',
            {
                body: {
                    token: token,
                    title: title,
                    body: body,
                    data: data,
                },
            }
        );

        if (error) {
            console.log('❌ Error sending notification:', error);
            return;
        }

        console.log('✅ Notification sent:', result);
    } catch (error) {
        console.log('❌ Error in sendPushNotification:', error);
    }
}