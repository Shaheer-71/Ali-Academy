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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Bell, X, CheckCheck, Trash2, SlidersHorizontal, Briefcase, ChevronLeft } from 'lucide-react-native';
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
    const { colors } = useTheme();
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
    const isHome = route.name === 'index';
    const isProfile = route.name === 'profile';
    const isPrimaryHeader = isHome || isProfile || inSettings;

    const primaryTitle = isProfile ? 'Profile' : 'Settings';
    const primarySubtitle = isProfile ? 'Your personal information' : 'Manage your account and preferences';
    const commonTitle = screenName === 'Index' ? 'Home' : screenName === 'Dairy' ? 'Diary' : screenName === 'Fee-status' ? 'Fee Status' : screenName === 'Change-password' ? 'Change Password' : screenName === 'Activate-users' ? 'Activate Users' : screenName || 'Untitled';
    const commonSubtitles: Record<string, string> = {
        attendance: 'Track and manage attendance',
        exams: 'View exams and results',
        lectures: 'Browse uploaded lectures',
        dairy: 'Homework and assignments',
        analytics: 'Performance insights and trends',
        timetable: 'Class schedule overview',
        students: 'Manage student records',
        fee: 'Track fee payments',
        'fee-status': 'Your fee payment history',
        notifications: 'Manage notifications',
        'change-password': 'Update your account password',
        'activate-users': 'Reactivate deactivated accounts',
    };
    const commonSubtitle = commonSubtitles[route.name] || 'Overview and details';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

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

    const actionButtons = (
        <View style={styles.rightSection}>
            {onFilterPress && (
                <TouchableOpacity
                    style={[
                        styles.iconButton,
                        isFiltered && { borderWidth: 1, borderColor: '#ffffff' },
                    ]}
                    onPress={onFilterPress}
                >
                    <SlidersHorizontal color="#ffffff" size={20} />
                    {isFiltered && <View style={styles.filterDot} />}
                </TouchableOpacity>
            )}

            {showNotifications && (
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => setNotificationsVisible(true)}
                >
                    <Bell color="#ffffff" size={20} />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text allowFontScaling={false} style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}

        </View>
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.primary }]}
            edges={['top', 'left', 'right']}
        >
            <StatusBar style="light" backgroundColor={colors.primary} />
            <LinearGradient
                colors={[colors.primary, '#173239']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.heroContent}
            >
                <View style={styles.heroTopRow}>
                    <View style={styles.heroTextCol}>
                        {isHome ? (
                            <>
                                <Text allowFontScaling={false} style={styles.heroGreeting}>
                                    {getGreeting().toUpperCase()}
                                </Text>
                                <Text allowFontScaling={false} numberOfLines={1} style={styles.heroName}>
                                    {profile?.full_name || 'Guest'}
                                </Text>
                                {!!profile?.role && (
                                    <View style={styles.chipsRow}>
                                        <View style={styles.chip}>
                                            <Briefcase size={11} color="rgba(255,255,255,0.85)" />
                                            <Text allowFontScaling={false} style={styles.chipText}>
                                                {profile.role.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </>
                        ) : isPrimaryHeader ? (
                            <>
                                <Text allowFontScaling={false} style={styles.heroTitle}>
                                    {primaryTitle}
                                </Text>
                                <Text allowFontScaling={false} numberOfLines={2} style={styles.heroSubtitle}>
                                    {primarySubtitle}
                                </Text>
                            </>
                        ) : (
                            <View style={styles.commonHeaderRow}>
                                <TouchableOpacity
                                    style={styles.backIconButton}
                                    onPress={() => router.back()}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <ChevronLeft color="#ffffff" size={22} />
                                </TouchableOpacity>
                                <View style={styles.commonHeaderTextCol}>
                                    <Text allowFontScaling={false} numberOfLines={1} style={styles.heroTitle}>
                                        {commonTitle}
                                    </Text>
                                    <Text allowFontScaling={false} numberOfLines={1} style={styles.heroSubtitle}>
                                        {commonSubtitle}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                    {actionButtons}
                </View>
            </LinearGradient>

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
    commonHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    commonHeaderTextCol: {
        flex: 1,
    },
    backIconButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    heroContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 36,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroTextCol: {
        flex: 1,
        marginRight: 12,
        minHeight: 64,
        justifyContent: 'center',
    },
    heroGreeting: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-SemiBold',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    heroName: {
        fontSize: TextSizes.xlarge + 6,
        fontFamily: 'Inter-SemiBold',
        color: '#FFFFFF',
        marginTop: 4,
        letterSpacing: -0.3,
    },
    heroTitle: {
        fontSize: TextSizes.xlarge + 6,
        fontFamily: 'Inter-SemiBold',
        color: '#FFFFFF',
        marginTop: 4,
        letterSpacing: -0.3,
    },
    heroSubtitle: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        color: 'rgba(255,255,255,0.65)',
        marginTop: 4,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    chipText: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-SemiBold',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 0.4,
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
        backgroundColor: 'rgba(255,255,255,0.16)',
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
        height: WINDOW_HEIGHT * 0.65,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
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
        flex: 1,
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




