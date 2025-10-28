// src/components/common/NotificationCard.tsx
import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
} from 'react-native';
import {
    BookOpen,
    FileText,
    Clock,
    Megaphone,
    AlertCircle,
    CheckCircle,
    ClipboardList,
    Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Notification } from '@/src/types/notification';

interface NotificationCardProps {
    notification: Notification;
    onPress: (id: string) => void;
    onDismiss: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
    notification,
    onPress,
    onDismiss,
}) => {
    const { colors } = useTheme();
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 20;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -100) {
                    Animated.timing(translateX, {
                        toValue: -100,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const getIcon = () => {
        const iconProps = { size: 24, color: colors.primary };

        switch (notification.type) {
            case 'lecture_added':
                return <BookOpen {...iconProps} />;
            case 'quiz_added':
            case 'quiz_graded':
                return <FileText {...iconProps} />;
            case 'timetable_changed':
                return <Clock {...iconProps} color={colors.warning} />;
            case 'announcement':
                return <Megaphone {...iconProps} color={colors.info} />;
            case 'assignment_added':
                return <ClipboardList {...iconProps} />;
            default:
                return <AlertCircle {...iconProps} />;
        }
    };

    const getPriorityColor = () => {
        switch (notification.priority) {
            case 'high':
                return colors.error;
            case 'medium':
                return colors.warning;
            default:
                return colors.textSecondary;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.cardContainer,
                    {
                        transform: [{ translateX }],
                        backgroundColor: notification.is_read ? colors.background : colors.cardBackground,
                        borderLeftColor: getPriorityColor(),
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => onPress(notification.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        {getIcon()}
                        {!notification.is_read && (
                            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                        )}
                    </View>

                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                                {notification.title}
                            </Text>
                            {notification.is_read && (
                                <CheckCircle size={16} color={colors.success} />
                            )}
                        </View>
                        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                            {notification.message}
                        </Text>
                        <View style={styles.footer}>
                            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                                {formatTimestamp(notification.created_at)}
                            </Text>
                            {notification.creator?.name && (
                                <Text style={[styles.creator, { color: colors.textSecondary }]}>
                                    by {notification.creator.name}
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Delete Action */}
            <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.error }]}
                onPress={() => onDismiss(notification.id)}
            >
                <Trash2 size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        position: 'relative',
    },
    cardContainer: {
        borderRadius: 12,
        borderLeftWidth: 4,
        zIndex: 2,
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        position: 'relative',
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        flex: 1,
        marginRight: 8,
    },
    message: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 8,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    creator: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
    deleteButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        zIndex: 1,
    },
});