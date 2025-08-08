import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Users, ClipboardCheck, BookOpen, NotebookPen, ChartBar as BarChart3, Calendar, Bell, Sparkles, TrendingUp } from 'lucide-react-native';
import TopSection from '@/components/TopSections';

export default function HomeScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleBasedQuickActions = () => {
    if (profile?.role === 'teacher') {
      return [
        {
          title: 'Mark Attendance',
          icon: ClipboardCheck,
          color: '#b6d509',
          onPress: () => router.push('/(tabs)/attendance')
        },
        {
          title: 'Upload Lecture',
          icon: BookOpen,
          color: '#274d71',
          onPress: () => router.push('/(tabs)/lectures')
        },
        {
          title: 'Assign Diary',
          icon: NotebookPen,
          color: '#EF4444',
          onPress: () => router.push('/(tabs)/diary')
        },
        {
          title: 'Manage Students',
          icon: Users,
          color: '#8B5CF6',
          onPress: () => router.push('/(tabs)/students')
        },
      ];
    }

    return [
      {
        title: 'View Attendance',
        icon: Calendar,
        color: '#b6d509',
        onPress: () => Alert.alert('Coming Soon', 'Attendance view will be available soon')
      },
      {
        title: 'Latest Lectures',
        icon: BookOpen,
        color: '#274d71',
        onPress: () => router.push('/(tabs)/lectures')
      },
      {
        title: 'Homework',
        icon: NotebookPen,
        color: '#EF4444',
        onPress: () => router.push('/(tabs)/diary')
      },
      {
        title: 'Progress',
        icon: BarChart3,
        color: '#8B5CF6',
        onPress: () => Alert.alert('Coming Soon', 'Progress tracking will be available soon')
      },
    ];
  };

  const quickActions = getRoleBasedQuickActions();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSection showNotifications={true} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={[ 'left', 'right']}>
        <View style={{ flex: 1 }}>

          <ScrollView
            contentContainerStyle={{
              paddingBottom: 50,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground }]}>
              {/* Header */}
              <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
                <View>
                  <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
                  <Text style={[styles.username, { color: colors.text }]}>{profile?.full_name}</Text>
                  <Text style={[styles.role, { backgroundColor: colors.primary }]}>{profile?.role?.toUpperCase()}</Text>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground }]}>
                <View style={[styles.statsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.statsNumber, { color: colors.primary }]}>15</Text>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                    {profile?.role === 'teacher' ? 'Students' : 'Days Present'}
                  </Text>
                </View>
                <View style={[styles.statsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.statsNumber, { color: colors.primary }]}>3</Text>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                    {profile?.role === 'teacher' ? 'Classes' : 'Pending Tasks'}
                  </Text>
                </View>
                <View style={[styles.statsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.statsNumber, { color: colors.primary }]}>8</Text>
                  <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                    {profile?.role === 'teacher' ? 'Lectures' : 'Lectures'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                <View style={[styles.sectionIcon, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <Sparkles size={16} color={colors.secondary} />
                </View>
              </View>

              <View style={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={action.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                      <action.icon size={24} color={action.color} />
                    </View>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                    <View style={[styles.actionIndicator, { backgroundColor: action.color }]} />
                  </TouchableOpacity>
                ))}
              </View>

            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                <View style={[styles.sectionIcon, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <TrendingUp size={16} color={colors.primary} />
                </View>
              </View>
              <View style={[styles.activityCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, styles.activityDotSuccess]} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>Attendance Marked</Text>
                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>Class A - 2 hours ago</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, styles.activityDotInfo]} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>New Lecture Uploaded</Text>
                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>Mathematics - 5 hours ago</Text>
                  </View>
                </View>
                <View style={styles.activityItem}>
                  <View style={[styles.activityDot, styles.activityDotWarning]} />
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>Homework Assigned</Text>
                    <Text style={[styles.activityTime, { color: colors.textSecondary }]}>Physics - Yesterday</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: -10
  },
  headerContainer: {
    marginHorizontal: 24,
    paddingTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  username: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  role: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#b6d509',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
    borderRadius: 12,
    padding: 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statsNumber: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  actionIndicator: {
    position: 'absolute',
    bottom: -0.5,
    left: 0,
    right: 0,
    height: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    // padding : "10%"
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    backgroundColor: '#b6d509',
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  activityDotSuccess: {
    backgroundColor: '#10B981',
  },
  activityDotInfo: {
    backgroundColor: '#3B82F6',
  },
  activityDotWarning: {
    backgroundColor: '#F59E0B',
  },
});