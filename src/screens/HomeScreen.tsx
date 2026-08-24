// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useNotifications } from '@/src/contexts/NotificationContext';
import { supabase } from '@/src/lib/supabase';
import { Users, ClipboardCheck, BookOpen, NotebookPen, ChartBar as BarChart3, Calendar, Sparkles, TrendingUp, GraduationCap, CheckCircle2, Info, AlertTriangle } from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { Animated } from 'react-native';
import { useScreenAnimation, useButtonAnimation, useCardAnimation } from '@/src/utils/animations';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { handleError, handleDataFetchError } from '@/src/utils/errorHandler/homeErrorHandler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SECTION_PADDING = 24;
const ACTION_GAP = 12;
const ACTION_CARD_WIDTH = (SCREEN_WIDTH - SECTION_PADDING * 2 - ACTION_GAP * 2) / 3;

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

interface QuickAction {
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
}

export default function HomeScreen() {
  const { profile, student } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { fetchNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<HomeStats>({
    students: 0,
    classes: 0,
    lectures: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const screenStyle = useScreenAnimation();

  // Error handling state
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showError = (title: string, message: string) => {
    setErrorModal({
      visible: true,
      title,
      message,
    });
  };

  const closeErrorModal = () => {
    setErrorModal({
      visible: false,
      title: '',
      message: '',
    });
  };

  const fetchTeacherStats = async () => {
    try {
      if (!profile?.id) {
        throw new Error(
          'Unable to load your profile information. Please try logging in again.',
        );
      }

      const isSuperAdmin = profile.role === 'superadmin';

      // ========== 1️⃣ Get Class IDs ==========
      let teacherClassIds: string[] = [];
      let uniqueClassSubjectPairs: { class_id: string; subject_id: string }[] = [];

      if (isSuperAdmin) {
        // Superadmin: all classes + all class-subject pairs
        const [{ data: allClasses }, { data: allCS }] = await Promise.all([
          supabase.from('classes').select('id'),
          supabase.from('classes_subjects').select('class_id, subject_id').eq('is_active', true),
        ]);
        teacherClassIds = (allClasses || []).map((c: any) => c.id);
        uniqueClassSubjectPairs = allCS || [];
      } else {
        const { data: classes, error: classesError } = await supabase
          .from('teacher_subject_enrollments')
          .select('class_id')
          .eq('teacher_id', profile.id);

        if (classesError) {
          console.warn('Classes error:', classesError);
          throw new Error('We couldn\'t fetch your class information. Please check your internet connection and try again.');
        }

        teacherClassIds = [...new Set(classes?.map(c => c.class_id) || [])];

        const { data: teacherClassesSubjects, error: teacherClassesSubjectsError } = await supabase
          .from('teacher_subject_enrollments')
          .select('class_id, subject_id')
          .eq('teacher_id', profile.id);

        if (teacherClassesSubjectsError) {
          console.warn('Subject error:', teacherClassesSubjectsError);
          throw new Error('There was a problem loading your subject assignments. Please try refreshing.');
        }

        uniqueClassSubjectPairs = Array.from(
          new Map(
            (teacherClassesSubjects || []).map(item => [
              `${item.class_id}-${item.subject_id}`,
              { class_id: item.class_id, subject_id: item.subject_id }
            ])
          ).values()
        );
      }

      // ========== 3️⃣ Get Students from These Classes ==========
      let uniqueStudentIds: string[] = [];

      if (teacherClassIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from('student_subject_enrollments')
          .select('student_id')
          .in('class_id', teacherClassIds);

        if (studentsError) {
          console.warn('Students error:', studentsError);
          throw new Error(
            'We couldn\'t fetch student information. Your other data has been loaded successfully.',
          );
        }

        uniqueStudentIds = [...new Set(students?.map(s => s.student_id) || [])];
      }

      // ========== 4️⃣ Get Total Lectures Uploaded ==========
      const { data: lectures, error: lecturesError } = await supabase
        .from('lectures')
        .select('id')
        .eq('uploaded_by', profile.id);

      if (lecturesError) {
        console.warn('Lectures error:', lecturesError);
        throw new Error(
          'There was a problem loading your lecture data. Please try again.',
        );
      }

      // ========== 5️⃣ Update Stats ==========
      setStats({
        students: uniqueStudentIds.length || 0,
        classes: teacherClassIds.length || 0,
        lectures: lectures?.length || 0,
      });

      // ========== 6️⃣ Build Recent Activities ==========
      await fetchRecentActivities();

    } catch (error: any) {
      console.warn('❌ Error fetching teacher stats:', error);
      const errorResponse = handleDataFetchError(error);
      showError(errorResponse.title, errorResponse.message);

      // Set default stats to prevent blank screen
      setStats({
        students: 0,
        classes: 0,
        lectures: 0,
      });
    }
  };

  const fetchRecentActivities = async () => {
    try {
      if (!profile?.id) return;

      const activities: RecentActivity[] = [];

      // Recent attendance sessions
      try {
        const { data: recentAttendance, error: attendanceError } = await supabase
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

        if (!attendanceError && recentAttendance) {
          recentAttendance.forEach(session => {
            activities.push({
              id: session.id,
              title: 'Attendance Marked',
              description: `${session.classes.name} - ${new Date(session.date).toLocaleDateString()}`,
              time: getTimeAgo(session.posted_at),
              type: 'success'
            });
          });
        }
      } catch (error) {
        console.warn('Error fetching attendance:', error);
        // Continue without attendance data
      }

      // Recent lectures
      try {
        const { data: recentLectures, error: lecturesError } = await supabase
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

        if (!lecturesError && recentLectures) {
          recentLectures.forEach(lecture => {
            activities.push({
              id: lecture.id,
              title: 'New Lecture Uploaded',
              description: `${lecture.title} - ${lecture.classes.name}`,
              time: getTimeAgo(lecture.created_at),
              type: 'info'
            });
          });
        }
      } catch (error) {
        console.warn('Error fetching lectures:', error);
        // Continue without lecture data
      }

      // Recent diary assignments
      try {
        const { data: recentDiary, error: diaryError } = await supabase
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

        if (!diaryError && recentDiary) {
          recentDiary.forEach(diary => {
            activities.push({
              id: diary.id,
              title: 'Homework Assigned',
              description: `${diary.title} - ${diary.classes.name}`,
              time: getTimeAgo(diary.created_at),
              type: 'warning'
            });
          });
        }
      } catch (error) {
        console.warn('Error fetching diary:', error);
        // Continue without diary data
      }

      // Sort all activities by time and take top 3
      activities.sort((a, b) => {
        const timeA = a.time.includes('ago') ? -1 : 1;
        const timeB = b.time.includes('ago') ? -1 : 1;
        return timeA - timeB;
      });
      setRecentActivities(activities.slice(0, 3));

    } catch (error: any) {
      console.warn('Error fetching recent activities:', error);
      // Set empty activities array - not critical enough for error modal
      setRecentActivities([]);
    }
  };

  const fetchStudentStats = async () => {
    try {
      if (!profile?.id) {
        throw new Error(
          'Unable to load your profile information. Please try logging in again.',
        );
      }

      // Get student record — look up by profile email (stable, works even before student state loads)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          class_id,
          classes!inner(id, name)
        `)
        .eq('email', profile!.email)
        .eq('is_deleted', false)
        .single();

      if (studentError) {
        console.warn('Student data error:', studentError);
        throw new Error(
          'We couldn\'t fetch your student information. Please check your internet connection and try again.',
        );
      }

      if (!studentData) {
        throw new Error(
          'Your student record could not be found. Please contact your administrator.',
        );
      }

      // Get student's attendance rate
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', studentData.id);

      if (attendanceError) {
        console.warn('Attendance error:', attendanceError);
        // Continue without attendance data
      }

      const totalDays = attendanceData?.length || 0;
      const presentDays = attendanceData?.filter(r => r.status === 'present').length || 0;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Get total assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('diary_assignments')
        .select('*')
        .eq('class_id', studentData.class_id);

      if (assignmentError) {
        console.warn('Assignment error:', assignmentError);
        // Continue without assignment data
      }

      // Get total lectures available
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('id')
        .eq('class_id', studentData.class_id);

      if (lecturesError) {
        console.warn('Lectures error:', lecturesError);
        // Continue without lecture data
      }

      setStats({
        students: attendanceRate,
        classes: 0,
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
          description: 'Check your lectures section',
          time: '5 hours ago',
          type: 'info'
        },
      ];

      if (assignmentData && assignmentData.length > 0) {
        activities.push({
          id: '3',
          title: 'Assignments Available',
          description: `You have ${assignmentData.length} assignments`,
          time: 'Today',
          type: 'warning'
        });
      }

      setRecentActivities(activities);

    } catch (error: any) {
      console.warn('Error fetching student stats:', error);
      const errorResponse = handleDataFetchError(error);
      showError(errorResponse.title, errorResponse.message);

      // Set default stats for students
      setStats({
        students: 0,
        classes: 0,
        lectures: 0,
        attendance: 0,
        assignments: 0,
      });
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    try {
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
    } catch (error) {
      return 'Recently';
    }
  };

  const fetchData = async () => {
    try {
      if (!profile) {
        throw new Error(
          'Please sign in to view your dashboard.',
        );
      }

      if (profile.role === 'teacher' || profile.role === 'admin' || profile.role === 'superadmin') {
        await fetchTeacherStats();
      } else if (profile.role === 'student') {
        await fetchStudentStats();
      } else {
        throw new Error(
          'Your account role is not recognized. Please contact support.',
        );
      }
    } catch (error: any) {
      console.warn('Error in fetchData:', error);
      const errorResponse = handleError(error);
      showError(errorResponse.title, errorResponse.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchData(), fetchNotifications()]);
    } catch (error: any) {
      console.warn('Refresh error:', error);
      const errorResponse = handleError(error);
      showError(errorResponse.title, errorResponse.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile) fetchData();
  }, [profile?.id, profile?.role]);

  const getRoleBasedQuickActions = () => {
    if (profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin') {
      return [
        {
          title: 'Mark Attendance',
          icon: ClipboardCheck,
          onPress: () => router.push('/attendance')
        },
        {
          title: 'Upload Lecture',
          icon: BookOpen,
          onPress: () => router.push('/lectures')
        },
        {
          title: 'Assign Diary',
          icon: NotebookPen,
          onPress: () => router.push('/dairy')
        },
        {
          title: 'Manage Students',
          icon: Users,
          onPress: () => router.push('/students')
        },
        {
          title: 'Exams',
          icon: GraduationCap,
          onPress: () => router.push('/exams')
        },
        {
          title: 'Timetable',
          icon: Calendar,
          onPress: () => router.push('/timetable')
        },
        {
          title: 'Analytics',
          icon: BarChart3,
          onPress: () => router.push('/analytics')
        },
      ];
    }

    return [
      {
        title: 'View Attendance',
        icon: Calendar,
        onPress: () => router.push('/attendance')
      },
      {
        title: 'Latest Lectures',
        icon: BookOpen,
        onPress: () => router.push('/lectures')
      },
      {
        title: 'Homework',
        icon: NotebookPen,
        onPress: () => router.push('/dairy')
      },
      {
        title: 'Progress',
        icon: BarChart3,
        onPress: () => router.push('/exams')
      },
      {
        title: 'Timetable',
        icon: Calendar,
        onPress: () => router.push('/timetable')
      },
      {
        title: 'Analytics',
        icon: TrendingUp,
        onPress: () => router.push('/analytics')
      },
    ];
  };

  const getStatsLabels = () => {
    if (profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin') {
      return ['Students', 'Classes', 'Lectures'];
    } else {
      return ['Attendance', 'Dairy', 'Lectures'];
    }
  };

  const getStatsValues = () => {
    if (profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin') {
      return [stats.students, stats.classes, stats.lectures];
    } else {
      return [
        `${stats.attendance || stats.students}%`,
        stats.assignments || 0,
        stats.lectures
      ];
    }
  };

  const getActivityMeta = (type: string): { icon: React.ComponentType<{ size: number; color: string }>; color: string } => {
    switch (type) {
      case 'success': return { icon: CheckCircle2, color: '#10B981' };
      case 'info':    return { icon: Info, color: '#3B82F6' };
      case 'warning': return { icon: AlertTriangle, color: '#F59E0B' };
      default:        return { icon: CheckCircle2, color: '#10B981' };
    }
  };

  const quickActions = getRoleBasedQuickActions();
  const statsLabels = getStatsLabels();
  const statsValues = getStatsValues();
  const badgeGradient: [string, string] = [colors.primary, '#173239'];

  return (
    <Animated.View style={[styles.container, screenStyle, { backgroundColor: colors.background }]}>
      <TopSections showNotifications={true} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', "bottom"]}>
        <View style={{ flex: 1 }}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
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
              {/* Dynamic Quick Stats */}
              <View style={styles.statsSection}>
                <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <LinearGradient
                    colors={[colors.secondary, colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.overviewAccent}
                  />
                  <View style={styles.overviewRow}>
                    {statsValues.map((value, index) => (
                      <React.Fragment key={index}>
                        {index > 0 && <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />}
                        <View style={styles.overviewItem}>
                          <Text allowFontScaling={false} style={[styles.overviewValue, { color: colors.text }]}>{value}</Text>
                          <Text allowFontScaling={false} style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                            {statsLabels[index].toUpperCase()}
                          </Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                    <Text allowFontScaling={false} style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                      Jump straight into your daily tasks
                    </Text>
                  </View>
                  {isDark ? (
                    <LinearGradient
                      colors={badgeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sectionIcon}
                    >
                      <Sparkles size={16} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.sectionIcon, { backgroundColor: `${colors.primary}14` }]}>
                      <Sparkles size={16} color={colors.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.actionsGrid}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.actionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border, width: ACTION_CARD_WIDTH }]}
                      onPress={action.onPress}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={isDark ? badgeGradient : [`${colors.primary}1F`, `${colors.secondary}26`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionIcon}
                      >
                        <action.icon size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                      </LinearGradient>
                      <Text allowFontScaling={false} numberOfLines={2} style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dynamic Recent Activity — commented out for now
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
                  <View style={[styles.sectionIcon, { backgroundColor: `${colors.primary}14` }]}>
                    <TrendingUp size={16} color={colors.primary} />
                  </View>
                </View>
                <View style={styles.activityList}>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => {
                      const meta = getActivityMeta(activity.type);
                      return (
                        <View key={activity.id} style={[styles.activityCard, { backgroundColor: colors.cardBackground }]}>
                          <View style={[styles.activityIconWrap, { backgroundColor: `${meta.color}18` }]}>
                            <meta.icon size={18} color={meta.color} />
                          </View>
                          <View style={styles.activityContent}>
                            <Text allowFontScaling={false} style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                            <Text allowFontScaling={false} numberOfLines={1} style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.description} • {activity.time}</Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={[styles.activityCard, { backgroundColor: colors.cardBackground }]}>
                      <View style={[styles.activityIconWrap, { backgroundColor: `${colors.primary}18` }]}>
                        <Sparkles size={18} color={colors.primary} />
                      </View>
                      <View style={styles.activityContent}>
                        <Text allowFontScaling={false} style={[styles.activityTitle, { color: colors.text }]}>Welcome!</Text>
                        <Text allowFontScaling={false} style={[styles.activityTime, { color: colors.textSecondary }]}>Start using the app to see your recent activity</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              */}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={closeErrorModal}
      />
    </Animated.View>
  );
}

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetContent: {
    paddingTop: 20,
    paddingBottom: 130,
    gap: 28,
  },
  statsSection: {
    paddingHorizontal: 20,
  },
  overviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#1F3F4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  overviewAccent: {
    height: 3,
    width: '100%',
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 22,
  },
  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewDivider: {
    width: StyleSheet.hairlineWidth,
    height: '70%',
    alignSelf: 'center',
  },
  overviewValue: {
    fontSize: TextSizes.statValue + 4,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: TextSizes.tiny,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.6,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: TextSizes.sectionTitle,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ACTION_GAP,
  },
  actionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#1F3F4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    lineHeight: 15,
    letterSpacing: -0.1,
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#1F3F4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: TextSizes.filterLabel,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 3,
  },
  activityTime: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
  },
});