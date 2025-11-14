// src/screens/NotificationCenter.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CheckCheck, Filter, Search } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { NotificationCard } from '@/src/components/notifications/NotificationCard';

export default function NotificationCenter() {
    const { colors } = useTheme();
    const {
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications();

    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [refreshing, setRefreshing] = useState(false);

    // Notifications from the backend use `is_read` (snake_case).
    // Using `read` here was a bug (undefined), causing the unread filter
    // to behave incorrectly. Use `is_read` to filter unread items.
    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };

    const EmptyState = () => (
        <View style={styles.emptyContainer}>
            <Bell size={64} color={colors.textSecondary} />
            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
                No notifications
            </Text>
            <Text allowFontScaling={false} style={[styles.emptyMessage, { color: colors.textSecondary }]}>
                {filter === 'unread'
                    ? "You're all caught up!"
                    : "You don't have any notifications yet"}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>
                    Notifications
                </Text>
                <TouchableOpacity
                    style={[styles.markAllButton, { backgroundColor: colors.primary }]}
                    onPress={markAllAsRead}
                >
                    <CheckCheck size={20} color="#fff" />
                    <Text allowFontScaling={false} style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity
                    style={[
                        styles.filterTab,
                        filter === 'all' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setFilter('all')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            { color: filter === 'all' ? '#fff' : colors.textSecondary },
                        ]}
                    >
                        All
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.filterTab,
                        filter === 'unread' && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setFilter('unread')}
                >
                    <Text
                        style={[
                            styles.filterText,
                            { color: filter === 'unread' ? '#fff' : colors.textSecondary },
                        ]}
                    >
                        Unread
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Notifications List */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredNotifications}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <NotificationCard
                            notification={item}
                            onPress={markAsRead}
                            onDismiss={deleteNotification}
                        />
                    )}
                    ListEmptyComponent={EmptyState}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    markAllText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginLeft: 6,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 8,
        marginHorizontal: 20,
        marginVertical: 12,
        borderRadius: 12,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    filterText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
    },
    emptyMessage: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginTop: 8,
        textAlign: 'center',
    },
});