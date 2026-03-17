import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info, X } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Notification } from '@/src/types/notification';
import { TextSizes } from '@/src/styles/TextSizes';

interface NotificationCardProps {
  notification: Notification;
  onPress?: () => void;
  onDismiss?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onDismiss,
}) => {
  const { colors } = useTheme();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'quiz_graded':
        return <CheckCircle size={18} color="#10B981" />;
      case 'quiz_added':
      case 'timetable_changed':
        return <AlertCircle size={18} color="#F59E0B" />;
      case 'lecture_added':
      case 'assignment_added':
        return <Bell size={18} color="#3B82F6" />;
      default:
        return <Info size={18} color="#3B82F6" />;
    }
  };

  const getIconBg = () => {
    switch (notification.type) {
      case 'quiz_graded':   return '#DCFCE7';
      case 'quiz_added':
      case 'timetable_changed': return '#FEF3C7';
      default:              return '#DBEAFE';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return time.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
        !notification.is_read && { borderLeftColor: '#b6d509', borderLeftWidth: 3 },
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: getIconBg() }]}>
        {getNotificationIcon()}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            allowFontScaling={false}
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text
          allowFontScaling={false}
          style={[styles.message, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
        <Text allowFontScaling={false} style={styles.timestamp}>
          {getTimeAgo(notification.created_at)}
        </Text>
      </View>

      {/* Dismiss */}
      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={(e) => { e.stopPropagation(); onDismiss(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 6,
  },
  title: {
    fontSize: TextSizes.header,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#b6d509',
    flexShrink: 0,
  },
  message: {
    fontSize: TextSizes.normal,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  dismissButton: {
    paddingLeft: 8,
    paddingTop: 2,
    flexShrink: 0,
  },
});
