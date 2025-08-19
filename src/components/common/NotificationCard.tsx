import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Info, X } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
}

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
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'warning':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'error':
        return <AlertCircle size={20} color="#EF4444" />;
      default:
        return <Info size={20} color="#3B82F6" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'success':
        return '#DCFCE7';
      case 'warning':
        return '#FEF3C7';
      case 'error':
        return '#FEE2E2';
      default:
        return '#DBEAFE';
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

  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unreadContainer,
        { backgroundColor: colors.cardBackground }
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor() }]}>
        {getNotificationIcon()}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.timestamp}>
            {getTimeAgo(notification.timestamp)}
          </Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>

        {!notification.read && (
          <View style={styles.unreadIndicator} />
        )}
      </View>

      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#274d71',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  message: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: '#b6d509',
    borderRadius: 4,
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});