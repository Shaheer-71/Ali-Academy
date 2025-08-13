import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Settings, Moon, Sun, Bell, X, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationCard } from '@/components/NotificationCard';


// Dummy notifications data
const dummyNotifications = [
    {
        id: '1',
        type: 'info' as const,
        title: 'New Lecture Available',
        message: 'Mathematics Chapter 5 has been uploaded to your class.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
    },
    {
        id: '2',
        type: 'warning' as const,
        title: 'Assignment Due Soon',
        message: "Physics homework is due tomorrow. Don't forget to submit!",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        read: false,
    },
    {
        id: '3',
        type: 'success' as const,
        title: 'Attendance Marked',
        message: 'Your attendance has been marked as present for today.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        read: true,
    },
    {
        id: '4',
        type: 'info' as const,
        title: 'Class Schedule Update',
        message: "Tomorrow's chemistry class has been moved to 3:00 PM.",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        read: true,
    },
];

interface TopSectionProps {
    showNotifications?: boolean;
}

export default function TopSection({ showNotifications = false }: TopSectionProps) {
    const route = useRoute();
    const router = useRouter();
    const { isDark, toggleTheme, colors } = useTheme();
    const [notificationsVisible, setNotificationsVisible] = useState(false);
    const [notifications, setNotifications] = useState(dummyNotifications);
    const isSettingsScreen = route.name.toLowerCase() === 'settings';

    const screenName = route.name.charAt(0).toUpperCase() + route.name.slice(1);
    const unreadCount = notifications.filter((n) => !n.read).length;

    const handleNotificationPress = (notificationId: string) => {
        setNotifications((prev) =>
            prev.map((notification) =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    const handleDismissNotification = (notificationId: string) => {
        setNotifications((prev) =>
            prev.filter((notification) => notification.id !== notificationId)
        );
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top', 'left', 'right']}
        >
            <View
                style={[styles.content, { backgroundColor: colors.background }]}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {isSettingsScreen && (
                        <TouchableOpacity
                            style={[
                                styles.iconButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => router.back()}
                        >
                            <ChevronLeft color={colors.primary} size={24} />
                        </TouchableOpacity>
                    )}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {screenName === 'Index'
                            ? 'Home'
                            : screenName === 'Dairy'
                                ? 'Diary'
                                : screenName || 'Untitled'}
                    </Text>
                </View>

                <View style={styles.rightSection}>
                    {!isSettingsScreen && showNotifications && (
                        <TouchableOpacity
                            style={[
                                styles.iconButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => setNotificationsVisible(true)}
                        >
                            <Bell color={colors.primary} size={24} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {!isSettingsScreen && (
                        <TouchableOpacity
                            style={[
                                styles.iconButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={toggleTheme}
                        >
                            {isDark ? (
                                <Sun color={colors.primary} size={24} />
                            ) : (
                                <Moon color={colors.primary} size={24} />
                            )}
                        </TouchableOpacity>
                    )}

                    {!isSettingsScreen && (
                        <TouchableOpacity
                            style={[
                                styles.iconButton,
                                { backgroundColor: colors.cardBackground },
                            ]}
                            onPress={() => {
                                router.push('/settings');
                            }}
                        >
                            <Settings color={colors.primary} size={24} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Notifications Modal */}
            <Modal
                animationType="fade"
                transparent
                visible={notificationsVisible}
                onRequestClose={() => setNotificationsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: colors.background },
                        ]}
                    >
                        <View
                            style={[
                                styles.modalHeader,
                                { borderBottomColor: colors.border },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.modalTitle,
                                    { color: colors.text },
                                ]}
                            >
                                Notifications
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setNotificationsVisible(false)}
                            >
                                <X size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.notificationsList}>
                            {notifications.length === 0 ? (
                                <View style={styles.emptyNotifications}>
                                    <Bell
                                        size={48}
                                        color={colors.textSecondary}
                                    />
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        No notifications
                                    </Text>
                                </View>
                            ) : (
                                notifications.map((notification) => (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        onPress={() =>
                                            handleNotificationPress(
                                                notification.id
                                            )
                                        }
                                        onDismiss={() =>
                                            handleDismissNotification(
                                                notification.id
                                            )
                                        }
                                    />
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
    },
    content: {
        paddingHorizontal: 12,
        marginHorizontal: 12,
        justifyContent: 'space-between',
        flexDirection: 'row',
        paddingVertical: 5,
        marginVertical: 5,
        marginRight: '5%',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 28,
        fontFamily: 'Inter-SemiBold',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 18,
        height: 18,
        backgroundColor: '#EF4444',
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationsList: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    emptyNotifications: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginTop: 16,
    },
});
