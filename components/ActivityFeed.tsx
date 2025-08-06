import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CircleCheck as CheckCircle, BookOpen, NotebookPen, Users, Clock } from 'lucide-react-native';

interface Activity {
  id: string;
  type: 'attendance' | 'lecture' | 'assignment' | 'student';
  title: string;
  subtitle: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'info';
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 5,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance':
        return <CheckCircle size={16} color="#10B981" />;
      case 'lecture':
        return <BookOpen size={16} color="#274d71" />;
      case 'assignment':
        return <NotebookPen size={16} color="#b6d509" />;
      case 'student':
        return <Users size={16} color="#8B5CF6" />;
      default:
        return <Clock size={16} color="#6B7280" />;
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
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return time.toLocaleDateString();
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      
      {displayActivities.length === 0 ? (
        <View style={styles.emptyState}>
          <Clock size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
      ) : (
        <View style={styles.activitiesList}>
          {displayActivities.map((activity, index) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                {getActivityIcon(activity.type)}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                <Text style={styles.activityTime}>{getTimeAgo(activity.timestamp)}</Text>
              </View>
              {index < displayActivities.length - 1 && (
                <View style={styles.connector} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 8,
  },
  activitiesList: {
    position: 'relative',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    paddingBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  connector: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -16,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
});