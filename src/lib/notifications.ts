// ============================================
// lib/notifications.ts - COMPLETE NOTIFICATION SYSTEM WITH IP TRACKING
// ============================================

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { Platform } from 'react-native';

// ============================================
// HELPER: GET DEVICE IP ADDRESS
// ============================================
async function getDeviceIP(): Promise<string | null> {
    try {
        console.log('🌐 [IP] Fetching device IP address...');
        
        // Using ipify API (free, reliable, no auth needed)
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        
        console.log('✅ [IP] IP address fetched:', data.ip);
        return data.ip;
    } catch (error) {
        console.log('❌ [IP] Error fetching IP:', error);
        // Fallback to another service
        try {
            console.log('🔄 [IP] Trying fallback IP service...');
            const response = await fetch('https://api.ipify.org');
            const ip = await response.text();
            console.log('✅ [IP] IP address fetched (fallback):', ip);
            return ip;
        } catch (fallbackError) {
            console.log('❌ [IP] Fallback also failed:', fallbackError);
            return null;
        }
    }
}

// ============================================
// 1. SETUP NOTIFICATION HANDLERS (Foreground + Background)
// ============================================
export function setupNotificationHandlers() {
    console.log('📱 [SETUP] Starting notification handler setup...');

    // Handle notification when app is in foreground
    Notifications.setNotificationHandler({
        handleNotification: async () => {
            console.log('🔔 [HANDLER] Notification received in foreground');
            return {
                shouldShowAlert: true,      // Show popup
                shouldPlaySound: true,       // Play sound
                shouldSetBadge: false,       // Don't update badge
            };
        },
    });

    // Handle when notification is received (foreground)
    const foregroundListener = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('📨 [FOREGROUND] Notification received:', {
                title: notification.request.content.title,
                body: notification.request.content.body,
                data: notification.request.content.data,
            });
        }
    );

    // Handle when user taps notification (foreground)
    const tapListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            console.log('👆 [TAP] User tapped notification:', {
                title: response.notification.request.content.title,
                body: response.notification.request.content.body,
                data: response.notification.request.content.data,
            });

            // You can navigate or show modal here
            const data = response.notification.request.content.data;
            if (data?.type === 'fee') {
                console.log('💰 [ACTION] Navigating to fee screen for:', data.feeId);
                // router.push(`/fee/${data.feeId}`);
            }
        }
    );

    console.log('✅ [SETUP] Notification handlers registered');

    // Return cleanup function if needed
    return () => {
        foregroundListener.remove();
        tapListener.remove();
    };
}

// ============================================
// 2. REGISTER DEVICE FOR NOTIFICATIONS (WITH IP)
// ============================================
export async function registerDeviceForNotifications(userId: string) {
    try {
        console.log('🚀 [REGISTER] Starting device registration for user:', userId);

        // Request permission from user
        console.log('🔔 [PERMISSION] Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('📌 [PERMISSION] Permission status:', status);

        if (status !== 'granted') {
            console.log('❌ [PERMISSION] Push notification permission denied');
            return;
        }

        // Get Expo push token
        console.log('🎫 [TOKEN] Getting Expo push token...');
        console.log('📦 [TOKEN] Project ID:', Constants.expoConfig?.extra?.eas?.projectId);

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        const token = tokenData.data;

        console.log('✨ [TOKEN] Expo Push Token received:', token);
        console.log('📱 [TOKEN] Token length:', token?.length);

        if (!token) {
            console.log('❌ [TOKEN] No token received from Expo');
            return;
        }

        // Get device IP address
        const deviceIP = await getDeviceIP();
        console.log('🌐 [REGISTER] Device IP:', deviceIP || 'Not available');

        // Save token and IP to Supabase
        console.log('💾 [SUPABASE] Saving to devices table...');
        console.log('📋 [SUPABASE] Data:', {
            user_id: userId,
            token: token,
            platform: Platform.OS,
            ip_address: deviceIP,
        });

        const { data: upsertData, error } = await supabase
            .from('devices')
            .upsert({
                user_id: userId,
                token: token,
                platform: Platform.OS,
                ip_address: deviceIP,
                updated_at: new Date().toISOString(),
            });

        console.log('📊 [SUPABASE] Upsert response:', { data: upsertData, error });

        if (error) {
            console.log('❌ [SUPABASE] Error storing token:', error.message);
            return;
        }

        console.log('✅ [REGISTER] Device registered successfully');
    } catch (error) {
        console.log('❌ [REGISTER] CATCH Error:', error);
        console.log('❌ [REGISTER] Error details:', JSON.stringify(error));
    }
}

// ============================================
// 3. SEND PUSH NOTIFICATION TO USER (SINGLE OR MULTIPLE DEVICES)
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
        console.log('📤 [SEND] Starting notification send...');
        console.log('📤 [SEND] Details:', { userId, title, body, data });

        // Get ALL device tokens for this user (not just one!)
        console.log('🔍 [SEND] Fetching device tokens from Supabase...');
        const { data: devices, error: fetchError } = await supabase
            .from('devices')
            .select('token, platform, ip_address')
            .eq('user_id', userId);

        console.log('🔍 [SEND] Fetch response:', { deviceCount: devices?.length, error: fetchError });

        if (fetchError) {
            console.log('❌ [SEND] Error fetching devices:', fetchError.message);
            return;
        }

        if (!devices || devices.length === 0) {
            console.log('❌ [SEND] No devices found for user:', userId);
            return;
        }

        console.log(`✨ [SEND] Found ${devices.length} device(s) for user ${userId}`);

        // Send notification to ALL devices
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < devices.length; i++) {
            const device = devices[i];
            console.log(`📱 [SEND] Sending to device ${i + 1}/${devices.length}:`, {
                platform: device.platform,
                ip: device.ip_address || 'Unknown',
                token: device.token.substring(0, 30) + '...',
            });

            try {
                // Call Supabase Edge Function for each device
                const { data: result, error } = await supabase.functions.invoke(
                    'send-notification',
                    {
                        body: {
                            token: device.token,
                            title: title,
                            body: body,
                            data: data,
                        },
                    }
                );

                if (error) {
                    console.log(`❌ [SEND] Device ${i + 1} failed:`, error.message);
                    failedCount++;
                    continue;
                }

                console.log(`✅ [SEND] Device ${i + 1} success:`, result);
                sentCount++;
            } catch (deviceError) {
                console.log(`❌ [SEND] Device ${i + 1} error:`, deviceError);
                failedCount++;
            }
        }

        console.log(`📊 [SEND] Notification summary: ${sentCount} sent, ${failedCount} failed out of ${devices.length} devices`);

        if (sentCount === 0) {
            console.log('❌ [SEND] Failed to send notification to all devices');
            return;
        }

        console.log('✅ [SEND] Notifications sent successfully');
    } catch (error) {
        console.log('❌ [SEND] CATCH Error:', error);
        console.log('❌ [SEND] Error details:', JSON.stringify(error));
    }
}

// ============================================
// 4. SCHEDULE LOCAL NOTIFICATION (For Testing)
// ============================================
export async function scheduleTestNotification(
    delaySeconds: number = 5
) {
    try {
        console.log('⏰ [TEST] Scheduling test notification in', delaySeconds, 'seconds...');

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🧪 Test Notification',
                body: 'This is a test notification to verify setup',
                data: { type: 'test', timestamp: new Date().toISOString() },
            },
            trigger: { seconds: delaySeconds },
        });

        console.log('✅ [TEST] Test notification scheduled');
    } catch (error) {
        console.log('❌ [TEST] Error scheduling test notification:', error);
    }
}

// ============================================
// 5. GET DEVICE INFO (For Debugging)
// ============================================
export async function getDeviceInfo(userId: string) {
    try {
        console.log('🔎 [DEBUG] Fetching device info for user:', userId);

        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('user_id', userId);

        console.log('🔎 [DEBUG] Device info:', { data, error });
        return data;
    } catch (error) {
        console.log('❌ [DEBUG] Error fetching device info:', error);
        return null;
    }
}

// ============================================
// 6. UPDATE DEVICE IP (Manually refresh IP)
// ============================================
export async function updateDeviceIP(userId: string) {
    try {
        console.log('🔄 [UPDATE IP] Updating device IP for user:', userId);

        const deviceIP = await getDeviceIP();
        
        if (!deviceIP) {
            console.log('❌ [UPDATE IP] Could not fetch IP address');
            return;
        }

        const { error } = await supabase
            .from('devices')
            .update({ 
                ip_address: deviceIP,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) {
            console.log('❌ [UPDATE IP] Error updating IP:', error.message);
            return;
        }

        console.log('✅ [UPDATE IP] IP address updated successfully:', deviceIP);
    } catch (error) {
        console.log('❌ [UPDATE IP] Error:', error);
    }
}