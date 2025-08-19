// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { Users, ClipboardCheck, BookOpen, NotebookPen, ChartBar as BarChart3, Calendar, Bell, Sparkles, TrendingUp } from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import AnalyticsScreen from './AnalyticsScreen';

interface HomeStats {
  students: number;
  classes: number;
  lectures: number;
  attendance?: number;
  assignments?: number;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

export default function HomeScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HomeStats>({
    students: 0,
    classes: 0,
    lectures: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchTeacherStats = async () => {
    try {
      if (!profile?.id) return;

      // Get teacher's classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', profile.id);

      if (classesError) throw classesError;

      const classIds = classes?.map(c => c.id) || [];

      // Get total students in teacher's classes
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .in('class_id', classIds)
        .eq('is_deleted', false);

      if (studentsError) throw studentsError;

      // Get total lectures uploaded by teacher
      const { data: lectures, error: lecturesError } = await supabase
        .from('lectures')
        .select('id')
        .eq('uploaded_by', profile.id);

      if (lecturesError) throw lecturesError;

      setStats({
        students: students?.length || 0,
        classes: classes?.length || 0,
        lectures: lectures?.length || 0,
      });

      // Get recent activities for teacher
      const activities: RecentActivity[] = [];

      // Recent attendance sessions
      const { data: recentAttendance } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          date,
          posted_at,
          classes!inner(name)
        `)
        .eq('posted_by', profile.id)
        .order('posted_at', { ascending: false })
        .limit(2);

      recentAttendance?.forEach(session => {
        activities.push({
          id: session.id,
          title: 'Attendance Marked',
          description: `${session.classes.name} - ${new Date(session.date).toLocaleDateString()}`,
          time: getTimeAgo(session.posted_at),
          type: 'success'
        });
      });

      // Recent lectures
      const { data: recentLectures } = await supabase
        .from('lectures')
        .select(`
          id,
          title,
          created_at,
          classes!inner(name)
        `)
        .eq('uploaded_by', profile.id)
        .order('created_at', { ascending: false })
        .limit(2);

      recentLectures?.forEach(lecture => {
        activities.push({
          id: lecture.id,
          title: 'New Lecture Uploaded',
          description: `${lecture.title} - ${lecture.classes.name}`,
          time: getTimeAgo(lecture.created_at),
          type: 'info'
        });
      });

      // Recent diary assignments
      const { data: recentDiary } = await supabase
        .from('diary_assignments')
        .select(`
          id,
          title,
          created_at,
          classes!inner(name)
        `)
        .eq('assigned_by', profile.id)
        .order('created_at', { ascending: false })
        .limit(2);

      recentDiary?.forEach(diary => {
        activities.push({
          id: diary.id,
          title: 'Homework Assigned',
          description: `${diary.title} - ${diary.classes.name}`,
          time: getTimeAgo(diary.created_at),
          type: 'warning'
        });
      });

      // Sort all activities by time and take top 3
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 3));

    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }
  };

  const fetchStudentStats = async () => {
    try {
      if (!profile?.id) return;

      // Get student record
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          class_id,
          classes!inner(id, name)
        `)
        .eq('email', profile.email)
        .eq('is_deleted', false)
        .single();

      if (studentError) throw studentError;

      // Get student's attendance rate
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentData.id);

      const totalDays = attendanceData?.length || 0;
      const presentDays = attendanceData?.filter(r => r.status === 'present').length || 0;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Get total assignments completed
      const { data: assignmentData } = await supabase
        .from('quiz_results')
        .select(`
          id,
          quizzes!inner(class_id)
        `)
        .eq('student_id', studentData.id)
        .eq('quizzes.class_id', studentData.class_id);

      // Get total lectures available
      const { data: lecturesData } = await supabase
        .from('lectures')
        .select('id')
        .eq('class_id', studentData.class_id);

      setStats({
        students: attendanceRate, // Show attendance rate instead
        classes: 0, // Not applicable for students
        lectures: lecturesData?.length || 0,
        attendance: attendanceRate,
        assignments: assignmentData?.length || 0,
      });

      // Get recent activities for student
      const activities: RecentActivity[] = [
        {
          id: '1',
          title: 'Attendance Recorded',
          description: `${studentData.classes.name} - Today`,
          time: '2 hours ago',
          type: 'success'
        },
        {
          id: '2',
          title: 'New Lecture Available',
          description: 'Mathematics - Chapter 5',
          time: '5 hours ago',
          type: 'info'
        },
        {
          id: '3',
          title: 'Assignment Due Soon',
          description: 'Physics Homework - Due Tomorrow',
          time: 'Yesterday',
          type: 'warning'
        }
      ];

      setRecentActivities(activities);

    } catch (error) {
      console.error('Error fetching student stats:', error);
      // Set default stats for students if error
      setStats({
        students: 85, // Default attendance
        classes: 0,
        lectures: 8,
        attendance: 85,
        assignments: 12,
      });
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const fetchData = async () => {
    if (profile?.role === 'teacher') {
      await fetchTeacherStats();
    } else {
      await fetchStudentStats();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const getRoleBasedQuickActions = () => {
    if (profile?.role === 'teacher') {
      return [
        {
          title: 'Mark Attendance',
          icon: ClipboardCheck,
          color: '#b6d509',
          onPress: () => router.push('/attendance')
        },
        {
          title: 'Upload Lecture',
          icon: BookOpen,
          color: '#274d71',
          onPress: () => router.push('/lectures')
        },
        {
          title: 'Assign Diary',
          icon: NotebookPen,
          color: '#EF4444',
          onPress: () => router.push('/dairy')
        },
        {
          title: 'Manage Students',
          icon: Users,
          color: '#8B5CF6',
          onPress: () => router.push('/analytics')
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
        onPress: () => router.push('/(tabs)/dairy')
      },
      {
        title: 'Progress',
        icon: BarChart3,
        color: '#8B5CF6',
        onPress: () => Alert.alert('Coming Soon', 'Progress tracking will be available soon')
      },
    ];
  };

  const getStatsLabels = () => {
    if (profile?.role === 'teacher') {
      return ['Students', 'Classes', 'Lectures'];
    } else {
      return ['Attendance', 'Assignments', 'Lectures'];
    }
  };

  const getStatsValues = () => {
    if (profile?.role === 'teacher') {
      return [stats.students, stats.classes, stats.lectures];
    } else {
      return [
        `${stats.attendance || stats.students}%`,
        stats.assignments || 0,
        stats.lectures
      ];
    }
  };

  const getActivityDotStyle = (type: string) => {
    switch (type) {
      case 'success':
        return styles.activityDotSuccess;
      case 'info':
        return styles.activityDotInfo;
      case 'warning':
        return styles.activityDotWarning;
      default:
        return styles.activityDotSuccess;
    }
  };

  const quickActions = getRoleBasedQuickActions();
  const statsLabels = getStatsLabels();
  const statsValues = getStatsValues();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSections showNotifications={true} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', "bottom"]}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: 50,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                title="Pull to refresh"
                titleColor={colors.textSecondary}
              />
            }
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

              {/* Dynamic Quick Stats */}
              <View style={[styles.statsContainer, { backgroundColor: colors.cardBackground }]}>
                {statsValues.map((value, index) => (
                  <View key={index} style={[styles.statsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.statsNumber, { color: colors.primary }]}>{value}</Text>
                    <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                      {statsLabels[index]}
                    </Text>
                  </View>
                ))}
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

            {/* Analytics Section */}
            <View>
              <AnalyticsScreen />
            </View>

            {/* Dynamic Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                <View style={[styles.sectionIcon, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <TrendingUp size={16} color={colors.primary} />
                </View>
              </View>
              <View style={[styles.activityCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <View key={activity.id} style={[styles.activityItem, index === recentActivities.length - 1 && { marginBottom: 0 }]}>
                      <View style={[styles.activityDot, getActivityDotStyle(activity.type)]} />
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.description} • {activity.time}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.activityItem}>
                    <View style={[styles.activityDot, styles.activityDotInfo]} />
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: colors.text }]}>Welcome!</Text>
                      <Text style={[styles.activityTime, { color: colors.textSecondary }]}>Start using the app to see your recent activity</Text>
                    </View>
                  </View>
                )}
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
    width: '48%',
    borderRadius: 16,
    padding: 15,
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