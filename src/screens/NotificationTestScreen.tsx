// screens/NotificationTestScreen.tsx
// Add this temporarily to test notifications

import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import {
    sendPushNotification,
    scheduleTestNotification,
    getDeviceInfo,
} from '@/src/lib/notifications';
import { useState } from 'react';

export default function NotificationTestScreen() {
    const { user } = useAuth();
    const [log, setLog] = useState<string[]>([]);

    const addLog = (message: string) => {
        console.log(message);
        setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testLocalNotification = async () => {
        addLog('🧪 Testing local notification...');
        await scheduleTestNotification(3);
    };

    const testPushNotification = async () => {
        if (!user?.id) {
            addLog('❌ No user ID');
            return;
        }
        addLog('📤 Sending push notification...');
        await sendPushNotification({
            userId: user.id,
            title: '📢 Test Notification',
            body: 'This is a push notification test',
            data: { type: 'test', timestamp: new Date().toISOString() },
        });
    };

    const checkDeviceInfo = async () => {
        if (!user?.id) {
            addLog('❌ No user ID');
            return;
        }
        addLog('🔍 Checking device info...');
        const info = await getDeviceInfo(user.id);
        if (info) {
            addLog(`✅ Device found: ${info.token.substring(0, 30)}...`);
        }
    };

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold mb-4">📱 Notification Test</Text>

            <TouchableOpacity
                onPress={testLocalNotification}
                className="bg-blue-500 p-4 rounded-lg mb-3"
            >
                <Text className="text-white font-bold">1️⃣ Test Local Notification</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={checkDeviceInfo}
                className="bg-green-500 p-4 rounded-lg mb-3"
            >
                <Text className="text-white font-bold">2️⃣ Check Device Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={testPushNotification}
                className="bg-purple-500 p-4 rounded-lg mb-3"
            >
                <Text className="text-white font-bold">3️⃣ Send Push Notification</Text>
            </TouchableOpacity>

            <View className="bg-gray-100 p-4 rounded-lg">
                <Text className="font-bold mb-2">📋 Console Log:</Text>
                {log.map((message, index) => (
                    <Text key={index} className="text-xs text-gray-700 mb-1">
                        {message}
                    </Text>
                ))}
            </View>
        </ScrollView>
    );
}