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
import { Settings, Moon, Sun, Bell, X, CheckCheck, Trash2, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { NotificationCard } from '@/src/components/common/NotificationCard';
import { Notification } from '@/src/types/notification';

interface TopSectionProps {
    showNotifications?: boolean;
    onFilterPress?: () => void;
    isFiltered?: boolean;
}

export default function TopSection({ showNotifications = true, onFilterPress, isFiltered = false }: TopSectionProps) {
    const route = useRoute();
    const router = useRouter();
    const { isDark, toggleTheme, colors } = useTheme();
    const { profile } = useAuth();
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
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const screenName = route.name.charAt(0).toUpperCase() + route.name.slice(1);

    const inSettings = route.name === 'settings';
    const inFee = route.name === 'fee';

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const handleNotificationPress = async (notificationId: string) => {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification) return;
        // Mark as read then show detail
        if (!notification.is_read) await markAsRead(notificationId);
        setSelectedNotification(notification);
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
                <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                    {screenName === 'Index' ? 'Home' : screenName === 'Dairy' ? 'Diary' : screenName === 'Fee-status' ? 'Fee Status' : screenName || 'Untitled'}
                </Text>

                <View style={styles.rightSection}>
                    {onFilterPress && (
                        <TouchableOpacity
                            style={[
                                styles.iconButton,
                                { backgroundColor: colors.cardBackground },
                                isFiltered && { borderWidth: 1, borderColor: colors.primary },
                            ]}
                            onPress={onFilterPress}
                        >
                            <SlidersHorizontal color={isFiltered ? colors.primary : colors.primary} size={20} />
                            {isFiltered && <View style={styles.filterDot} />}
                        </TouchableOpacity>
                    )}

                    {showNotifications && (
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
                            onPress={() => setNotificationsVisible(true)}
                        >
                            <Bell color={colors.primary} size={20} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text allowFontScaling={false} style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}


                    {inSettings && (
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
                            onPress={toggleTheme}
                        >
                            {isDark ? (
                                <Sun color={colors.primary} size={20} />
                            ) : (
                                <Moon color={colors.primary} size={20} />
                            )}
                        </TouchableOpacity>
                    )}

                    {!inSettings && (
                        <TouchableOpacity
                            style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
                            onPress={() => router.push('/settings')}
                        >
                            <Settings color={colors.primary} size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Notifications Modal - 50% BOTTOM SHEET */}
            <Modal
                animationType="fade"
                transparent
                visible={notificationsVisible}
                onRequestClose={() => setNotificationsVisible(false)}
                statusBarTranslucent={true}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setNotificationsVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.modalContent, { backgroundColor: colors.background }]}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {selectedNotification ? (
                            /* ── Detail View ── */
                            <>
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity
                                        style={styles.backButton}
                                        onPress={() => setSelectedNotification(null)}
                                    >
                                        <Text allowFontScaling={false} style={[styles.backText, { color: colors.primary }]}>← Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => { setSelectedNotification(null); setNotificationsVisible(false); }}
                                    >
                                        <X size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
                                    <Text allowFontScaling={false} style={[styles.detailTitle, { color: colors.text }]}>
                                        {selectedNotification.title}
                                    </Text>
                                    <View style={styles.detailMeta}>
                                        <View style={[styles.typeBadge, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                            <Text allowFontScaling={false} style={[styles.typeBadgeText, { color: colors.primary }]}>
                                                {selectedNotification.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </Text>
                                        </View>
                                        <Text allowFontScaling={false} style={[styles.detailTime, { color: colors.textSecondary }]}>
                                            {new Date(selectedNotification.created_at).toLocaleString('en-US', {
                                                weekday: 'short', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </Text>
                                    </View>
                                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                    <Text allowFontScaling={false} style={[styles.detailMessage, { color: colors.text }]}>
                                        {selectedNotification.message}
                                    </Text>
                                    {selectedNotification.creator?.name && (
                                        <Text allowFontScaling={false} style={[styles.detailSender, { color: colors.textSecondary }]}>
                                            Sent by {selectedNotification.creator.name}
                                        </Text>
                                    )}
                                </ScrollView>
                            </>
                        ) : (
                            /* ── List View ── */
                            <>
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>
                                        Notifications
                                    </Text>
                                    <View style={styles.modalHeaderActions}>
                                        {notifications.length > 0 && (
                                            <>
                                                <TouchableOpacity style={styles.headerActionButton} onPress={markAllAsRead}>
                                                    <CheckCheck size={20} color={colors.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.headerActionButton} onPress={clearAll}>
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

                                <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground }]}>
                                    <TouchableOpacity
                                        style={[styles.filterTab, filter === 'all' && { backgroundColor: colors.primary }]}
                                        onPress={() => setFilter('all')}
                                    >
                                        <Text allowFontScaling={false} style={[styles.filterText, { color: filter === 'all' ? '#fff' : colors.textSecondary }]}>
                                            All
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.filterTab, filter === 'unread' && { backgroundColor: colors.primary }]}
                                        onPress={() => setFilter('unread')}
                                    >
                                        <Text allowFontScaling={false} style={[styles.filterText, { color: filter === 'unread' ? '#fff' : colors.textSecondary }]}>
                                            Unread ({unreadCount})
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    style={styles.notificationsList}
                                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {loading && !refreshing ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="large" color={colors.primary} />
                                        </View>
                                    ) : filteredNotifications.length === 0 ? (
                                        <View style={styles.emptyNotifications}>
                                            <Bell size={48} color={colors.textSecondary} />
                                            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                                {filter === 'unread' ? "You're all caught up!" : "No notifications yet"}
                                            </Text>
                                            <Text allowFontScaling={false} style={[styles.emptySubText, { color: colors.textSecondary }]}>
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
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

import { TextSizes } from '@/src/styles/TextSizes';


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
        fontSize: TextSizes.header + 10,
        fontFamily: 'Inter-SemiBold',
        alignSelf: 'center',
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
    filterDot: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#fff',
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
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '65%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
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
        fontSize: TextSizes.sectionTitle,
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
        fontSize: TextSizes.filterLabel,
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
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    backButton: {
        paddingVertical: 4,
        paddingRight: 12,
    },
    backText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },
    detailContent: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    detailTitle: {
        fontSize: TextSizes.sectionTitle + 2,
        fontFamily: 'Inter-SemiBold',
        marginTop: 8,
        marginBottom: 10,
        lineHeight: 22,
    },
    detailMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        flexWrap: 'wrap',
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    typeBadgeText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    detailTime: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    divider: {
        height: 1,
        marginBottom: 14,
    },
    detailMessage: {
        fontSize: TextSizes.normal + 1,
        fontFamily: 'Inter-Regular',
        lineHeight: 20,
        marginBottom: 16,
    },
    detailSender: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
});




// const styles = StyleSheet.create({
//     container: {
//         backgroundColor: '#fff',
//     },
//     content: {
//         paddingHorizontal: 12,
//         marginHorizontal: 12,
//         justifyContent: 'space-between',
//         flexDirection: 'row',
//         paddingVertical: 5,
//         marginVertical: 5,
//         marginRight: '5%',
//     },
//     title: {
//         fontWeight: 'bold',
//         fontSize: 28,
//         fontFamily: 'Inter-SemiBold',
//     },
//     rightSection: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//     },
//     iconButton: {
//         width: 40,
//         height: 40,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//         position: 'relative',
//     },
//     notificationBadge: {
//         position: 'absolute',
//         top: -2,
//         right: -2,
//         minWidth: 18,
//         height: 18,
//         backgroundColor: '#EF4444',
//         borderRadius: 9,
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingHorizontal: 4,
//     },
//     badgeText: {
//         fontSize: 10,
//         fontFamily: 'Inter-SemiBold',
//         color: '#ffffff',
//     },
//     // FIXED: Overlay covers full screen with absolute positioning
//     modalOverlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         justifyContent: 'flex-end',
//     },
//     modalContent: {
//         height: '65%',  // Takes 50% of screen from bottom
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -2 },
//         shadowOpacity: 0.25,
//         shadowRadius: 8,
//         elevation: 5,
//     },
//     modalHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 24,
//         paddingTop: 24,
//         paddingBottom: 16,
//         borderBottomWidth: 1,
//     },
//     modalTitle: {
//         fontSize: 20,
//         fontFamily: 'Inter-SemiBold',
//     },
//     modalHeaderActions: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//     },
//     headerActionButton: {
//         width: 32,
//         height: 32,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     closeButton: {
//         width: 32,
//         height: 32,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     filterContainer: {
//         flexDirection: 'row',
//         padding: 4,
//         marginHorizontal: 24,
//         marginTop: 16,
//         marginBottom: 8,
//         borderRadius: 12,
//     },
//     filterTab: {
//         flex: 1,
//         paddingVertical: 8,
//         alignItems: 'center',
//         borderRadius: 8,
//     },
//     filterText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//     },
//     notificationsList: {
//         paddingHorizontal: 24,
//         paddingVertical: 16,
//     },
//     loadingContainer: {
//         paddingVertical: 40,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     emptyNotifications: {
//         alignItems: 'center',
//         paddingVertical: 40,
//     },
//     emptyText: {
//         fontSize: 16,
//         fontFamily: 'Inter-Regular',
//         marginTop: 16,
//     },
//     emptySubText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         marginTop: 8,
//         textAlign: 'center',
//         paddingHorizontal: 32,
//     },
// });