// src/components/layout/TopSection.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Settings, Moon, Sun, Bell, X, CheckCheck, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { NotificationCard } from '@/src/components/common/NotificationCard';

interface TopSectionProps {
    showNotifications?: boolean;
}

export default function TopSection({ showNotifications = true }: TopSectionProps) {
    const route = useRoute();
    const router = useRouter();
    const { isDark, toggleTheme, colors } = useTheme();
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotifications();

    const [notificationsVisible, setNotificationsVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const screenName = route.name.charAt(0).toUpperCase() + route.name.slice(1);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const handleNotificationPress = async (notificationId: string) => {
        await markAsRead(notificationId);
        // Navigate based on notification type if needed
        const notification = notifications.find(n => n.id === notificationId);
        if (notification?.entity_type && notification?.entity_id) {
            setNotificationsVisible(false);
            // Navigate to specific screen based on entity_type
            switch (notification.entity_type) {
                case 'lecture':
                    router.push(`/lectures/${notification.entity_id}`);
                    break;
                case 'quiz':
                    router.push(`/quizzes/${notification.entity_id}`);
                    break;
                case 'timetable':
                    router.push('/timetable');
                    break;
                default:
                    break;
            }
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top', 'left', 'right']}
        >
            <View style={[styles.content, { backgroundColor: colors.background }]}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {screenName === 'Index' ? 'Home' : screenName === 'Dairy' ? 'Diary' : screenName || 'Untitled'}
                </Text>

                <View style={styles.rightSection}>
                    {showNotifications && (
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
                            onPress={() => setNotificationsVisible(true)}
                        >
                            <Bell color={colors.primary} size={24} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
                        onPress={toggleTheme}
                    >
                        {isDark ? (
                            <Sun color={colors.primary} size={24} />
                        ) : (
                            <Moon color={colors.primary} size={24} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
                        onPress={() => router.push('/settings')}
                    >
                        <Settings color={colors.primary} size={24} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notifications Modal */}
            <Modal
                animationType="slide"
                transparent
                visible={notificationsVisible}
                onRequestClose={() => setNotificationsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Notifications
                            </Text>
                            <View style={styles.modalHeaderActions}>
                                {notifications.length > 0 && (
                                    <>
                                        <TouchableOpacity
                                            style={styles.headerActionButton}
                                            onPress={markAllAsRead}
                                        >
                                            <CheckCheck size={20} color={colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.headerActionButton}
                                            onPress={clearAll}
                                        >
                                            <Trash2 size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </>
                                )}
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setNotificationsVisible(false)}
                                >
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Filter Tabs */}
                        <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground }]}>
                            <TouchableOpacity
                                style={[
                                    styles.filterTab,
                                    filter === 'all' && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => setFilter('all')}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: filter === 'all' ? '#fff' : colors.textSecondary }
                                ]}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterTab,
                                    filter === 'unread' && { backgroundColor: colors.primary }
                                ]}
                                onPress={() => setFilter('unread')}
                            >
                                <Text style={[
                                    styles.filterText,
                                    { color: filter === 'unread' ? '#fff' : colors.textSecondary }
                                ]}>
                                    Unread ({unreadCount})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Notifications List */}
                        <ScrollView
                            style={styles.notificationsList}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={[colors.primary]}
                                />
                            }
                            showsVerticalScrollIndicator={false}
                        >
                            {loading && !refreshing ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : filteredNotifications.length === 0 ? (
                                <View style={styles.emptyNotifications}>
                                    <Bell size={48} color={colors.textSecondary} />
                                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        {filter === 'unread'
                                            ? "You're all caught up!"
                                            : "No notifications yet"}
                                    </Text>
                                    <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                                        {filter === 'unread'
                                            ? "Check the 'All' tab for read notifications"
                                            : "We'll notify you when something important happens"}
                                    </Text>
                                </View>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        onPress={() => handleNotificationPress(notification.id)}
                                        onDismiss={() => deleteNotification(notification.id)}
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
        minWidth: 18,
        height: 18,
        backgroundColor: '#EF4444',
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
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
        maxHeight: '85%',
        minHeight: '60%',
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
    modalHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerActionButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 4,
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 12,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    filterText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    notificationsList: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
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
    emptySubText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});