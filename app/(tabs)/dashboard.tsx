import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar, BookOpen, NotebookPen, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, TrendingUp, Award, Target } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DashboardData {
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
  };
  recentAttendance: Array<{
    date: string;
    status: 'present' | 'late' | 'absent';
    arrival_time?: string;
  }>;
  pendingAssignments: number;
  totalLectures: number;
  recentLectures: Array<{
    title: string;
    created_at: string;
  }>;
}

export default function DashboardScreen() {
  const { profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    attendanceStats: { totalDays: 0, presentDays: 0, lateDays: 0, absentDays: 0 },
    recentAttendance: [],
    pendingAssignments: 0,
    totalLectures: 0,
    recentLectures: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'parent' || profile?.role === 'student') {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      // This is a simplified implementation
      // In a real app, you'd need to determine the student ID based on the logged-in user
      
      // Mock data for demonstration
      setDashboardData({
        attendanceStats: {
          totalDays: 20,
          presentDays: 15,
          lateDays: 3,
          absentDays: 2,
        },
        recentAttendance: [
          { date: '2025-01-20', status: 'present', arrival_time: '15:58' },
          { date: '2025-01-19', status: 'late', arrival_time: '16:20' },
          { date: '2025-01-18', status: 'present', arrival_time: '15:55' },
          { date: '2025-01-17', status: 'absent' },
          { date: '2025-01-16', status: 'present', arrival_time: '16:00' },
        ],
        pendingAssignments: 3,
        totalLectures: 12,
        recentLectures: [
          { title: 'Mathematics Chapter 5', created_at: '2025-01-20' },
          { title: 'Physics Laws of Motion', created_at: '2025-01-19' },
          { title: 'Chemistry Organic Compounds', created_at: '2025-01-18' },
        ],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceRate = () => {
    const { totalDays, presentDays, lateDays } = dashboardData.attendanceStats;
    if (totalDays === 0) return 0;
    return Math.round(((presentDays + lateDays) / totalDays) * 100);
  };

  const getStatusIcon = (status: 'present' | 'late' | 'absent') => {
    switch (status) {
      case 'present':
        return <CheckCircle size={16} color="#10B981" />;
      case 'late':
        return <AlertCircle size={16} color="#F59E0B" />;
      case 'absent':
        return <XCircle size={16} color="#EF4444" />;
    }
  };

  const getStatusColor = (status: 'present' | 'late' | 'absent') => {
    switch (status) {
      case 'present':
        return '#10B981';
      case 'late':
        return '#F59E0B';
      case 'absent':
        return '#EF4444';
    }
  };

  if (profile?.role === 'teacher') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Teacher Dashboard</Text>
          <Text style={styles.errorSubtext}>
            Use the other tabs to manage students, attendance, lectures, and assignments.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Academic Overview</Text>
        </View>

        {/* Attendance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          
          <View style={styles.attendanceCard}>
            <View style={styles.attendanceRateContainer}>
              <View style={styles.attendanceRateCircle}>
                <Text style={styles.attendanceRateNumber}>{getAttendanceRate()}%</Text>
                <Text style={styles.attendanceRateLabel}>Attendance</Text>
              </View>
            </View>
            
            <View style={styles.attendanceStats}>
              <View style={styles.statItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statLabel}>Present</Text>
                <Text style={styles.statValue}>{dashboardData.attendanceStats.presentDays}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.statLabel}>Late</Text>
                <Text style={styles.statValue}>{dashboardData.attendanceStats.lateDays}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIndicator, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.statLabel}>Absent</Text>
                <Text style={styles.statValue}>{dashboardData.attendanceStats.absentDays}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Attendance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Attendance</Text>
          
          {dashboardData.recentAttendance.map((record, index) => (
            <View key={index} style={styles.attendanceRecord}>
              <View style={styles.recordDate}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.recordDateText}>
                  {new Date(record.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              
              <View style={styles.recordStatus}>
                {getStatusIcon(record.status)}
                <Text style={[styles.recordStatusText, { color: getStatusColor(record.status) }]}>
                  {record.status.toUpperCase()}
                </Text>
              </View>
              
              {record.arrival_time && (
                <View style={styles.recordTime}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.recordTimeText}>{record.arrival_time}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#b6d509' + '20' }]}>
                <Target size={24} color="#b6d509" />
              </View>
              <Text style={styles.statCardNumber}>{getAttendanceRate()}%</Text>
              <Text style={styles.statCardLabel}>Attendance Rate</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#274d71' + '20' }]}>
                <BookOpen size={24} color="#274d71" />
              </View>
              <Text style={styles.statCardNumber}>{dashboardData.totalLectures}</Text>
              <Text style={styles.statCardLabel}>Total Lectures</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EF4444' + '20' }]}>
                <NotebookPen size={24} color="#EF4444" />
              </View>
              <Text style={styles.statCardNumber}>{dashboardData.pendingAssignments}</Text>
              <Text style={styles.statCardLabel}>Pending Tasks</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' + '20' }]}>
                <Award size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.statCardNumber}>A+</Text>
              <Text style={styles.statCardLabel}>Grade</Text>
            </View>
          </View>
        </View>

        {/* Recent Lectures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Lectures</Text>
          
          {dashboardData.recentLectures.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={32} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No recent lectures</Text>
            </View>
          ) : (
            dashboardData.recentLectures.map((lecture, index) => (
              <View key={index} style={styles.lectureItem}>
                <View style={styles.lectureIcon}>
                  <BookOpen size={20} color="#274d71" />
                </View>
                <View style={styles.lectureInfo}>
                  <Text style={styles.lectureTitle}>{lecture.title}</Text>
                  <Text style={styles.lectureDate}>
                    {new Date(lecture.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Performance Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Trends</Text>
          
          <View style={styles.trendsCard}>
            <View style={styles.trendItem}>
              <TrendingUp size={20} color="#10B981" />
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>Attendance</Text>
                <Text style={[styles.trendValue, { color: '#10B981' }]}>+5% this month</Text>
              </View>
            </View>
            
            <View style={styles.trendItem}>
              <BookOpen size={20} color="#274d71" />
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>Lectures Completed</Text>
                <Text style={[styles.trendValue, { color: '#274d71' }]}>12 this month</Text>
              </View>
            </View>
            
            <View style={styles.trendItem}>
              <NotebookPen size={20} color="#b6d509" />
              <View style={styles.trendInfo}>
                <Text style={styles.trendLabel}>Assignments</Text>
                <Text style={[styles.trendValue, { color: '#b6d509' }]}>3 pending</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  attendanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceRateContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  attendanceRateCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#274d71',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendanceRateNumber: {
    fontSize: 32,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  attendanceRateLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#b6d509',
    marginTop: 4,
  },
  attendanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  attendanceRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  recordDate: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordDateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 8,
  },
  recordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  recordStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  recordTime: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  recordTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCardNumber: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  lectureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  lectureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  lectureDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  viewButton: {
    backgroundColor: '#274d71',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 12,
  },
  trendsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendInfo: {
    marginLeft: 12,
    flex: 1,
  },
  trendLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});