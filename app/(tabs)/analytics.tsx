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
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { ChartBar as BarChart3, TrendingUp, TrendingDown, Users, Award, Target, Calendar, BookOpen, ClipboardCheck } from 'lucide-react-native';
import TopSections from '@/components/TopSections';

const { width } = Dimensions.get('window');

interface StudentPerformance {
    id: string;
    full_name: string;
    roll_number: string;
    attendance_rate: number;
    average_grade: number;
    assignments_completed: number;
    total_assignments: number;
    class_name: string;
}

interface ClassAnalytics {
    class_id: string;
    class_name: string;
    total_students: number;
    average_attendance: number;
    average_grade: number;
    top_performer: string;
}

export default function AnalyticsScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
    const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.role === 'teacher') {
            fetchClasses();
            fetchAnalyticsData();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedClass) {
            fetchAnalyticsData();
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('name');

            if (error) throw error;
            setClasses(data || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            // Mock data for demonstration - replace with actual database queries
            const mockStudentPerformances: StudentPerformance[] = [
                {
                    id: '1',
                    full_name: 'Ahmed Ali',
                    roll_number: 'A001',
                    attendance_rate: 95,
                    average_grade: 88,
                    assignments_completed: 8,
                    total_assignments: 10,
                    class_name: 'Class A',
                },
                {
                    id: '2',
                    full_name: 'Fatima Khan',
                    roll_number: 'A002',
                    attendance_rate: 92,
                    average_grade: 91,
                    assignments_completed: 9,
                    total_assignments: 10,
                    class_name: 'Class A',
                },
                {
                    id: '3',
                    full_name: 'Hassan Ahmed',
                    roll_number: 'A003',
                    attendance_rate: 87,
                    average_grade: 82,
                    assignments_completed: 7,
                    total_assignments: 10,
                    class_name: 'Class A',
                },
                {
                    id: '4',
                    full_name: 'Aisha Malik',
                    roll_number: 'B001',
                    attendance_rate: 98,
                    average_grade: 94,
                    assignments_completed: 10,
                    total_assignments: 10,
                    class_name: 'Class B',
                },
            ];

            const mockClassAnalytics: ClassAnalytics[] = [
                {
                    class_id: '1',
                    class_name: 'Class A',
                    total_students: 15,
                    average_attendance: 91,
                    average_grade: 87,
                    top_performer: 'Fatima Khan',
                },
                {
                    class_id: '2',
                    class_name: 'Class B',
                    total_students: 12,
                    average_attendance: 94,
                    average_grade: 89,
                    top_performer: 'Aisha Malik',
                },
            ];

            setStudentPerformances(mockStudentPerformances);
            setClassAnalytics(mockClassAnalytics);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderProgressBar = (percentage: number, color: string) => {
        return (
            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                <View
                    style={[
                        styles.progressBarFill,
                        { width: `${percentage}%`, backgroundColor: color },
                    ]}
                />
            </View>
        );
    };

    const renderPerformanceChart = (student: StudentPerformance) => {
        const chartWidth = width - 80;
        const attendanceWidth = (student.attendance_rate / 100) * chartWidth * 0.8;
        const gradeWidth = (student.average_grade / 100) * chartWidth * 0.8;
        const assignmentWidth = (student.assignments_completed / student.total_assignments) * chartWidth * 0.8;

        return (
            <View style={[styles.performanceCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.studentHeader}>
                    <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.studentInitial}>
                            {student.full_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: colors.text }]}>{student.full_name}</Text>
                        <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>
                            {student.roll_number} • {student.class_name}
                        </Text>
                    </View>
                    <View style={[styles.gradeContainer, { backgroundColor: colors.primary }]}>
                        <Text style={styles.gradeText}>{student.average_grade}%</Text>
                    </View>
                </View>

                <View style={styles.metricsContainer}>
                    <View style={styles.metric}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Attendance</Text>
                        <View style={styles.metricBar}>
                            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${student.attendance_rate}%`, backgroundColor: '#10B981' },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.metricValue, { color: colors.text }]}>{student.attendance_rate}%</Text>
                        </View>
                    </View>

                    <View style={styles.metric}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Assignments</Text>
                        <View style={styles.metricBar}>
                            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${(student.assignments_completed / student.total_assignments) * 100}%`, backgroundColor: colors.secondary },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.metricValue, { color: colors.text }]}>
                                {student.assignments_completed}/{student.total_assignments}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.metric}>
                        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Overall Grade</Text>
                        <View style={styles.metricBar}>
                            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${student.average_grade}%`, backgroundColor: colors.primary },
                                    ]}
                                />
                            </View>
                            <Text style={[styles.metricValue, { color: colors.text }]}>{student.average_grade}%</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (profile?.role !== 'teacher') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, { color: colors.text }]}>Access Denied</Text>
                        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
                            Performance analytics are only available for teachers.
                        </Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TopSections />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                {/* Class Filter */}
                <View style={styles.filterContainer}>
                    <Text style={[styles.filterLabel, { color: colors.text }]}>Select Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.filterButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    selectedClass === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setSelectedClass('all')}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    { color: colors.text },
                                    selectedClass === 'all' && { color: '#ffffff' },
                                ]}>
                                    All Classes
                                </Text>
                            </TouchableOpacity>
                            {classes.map((classItem) => (
                                <TouchableOpacity
                                    key={classItem.id}
                                    style={[
                                        styles.filterButton,
                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                        selectedClass === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    ]}
                                    onPress={() => setSelectedClass(classItem.id)}
                                >
                                    <Text style={[
                                        styles.filterButtonText,
                                        { color: colors.text },
                                        selectedClass === classItem.id && { color: '#ffffff' },
                                    ]}>
                                        {classItem.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* Class Overview Cards */}
                <View style={styles.overviewContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.overviewCards}>
                            <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <View style={[styles.overviewIcon, { backgroundColor: '#10B98120' }]}>
                                    <Users size={24} color="#10B981" />
                                </View>
                                <Text style={[styles.overviewValue, { color: colors.text }]}>
                                    {classAnalytics.reduce((sum, c) => sum + c.total_students, 0)}
                                </Text>
                                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total Students</Text>
                            </View>

                            <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <View style={[styles.overviewIcon, { backgroundColor: `${colors.secondary}20` }]}>
                                    <ClipboardCheck size={24} color={colors.secondary} />
                                </View>
                                <Text style={[styles.overviewValue, { color: colors.text }]}>
                                    {Math.round(classAnalytics.reduce((sum, c) => sum + c.average_attendance, 0) / classAnalytics.length || 0)}%
                                </Text>
                                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Avg Attendance</Text>
                            </View>

                            <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <View style={[styles.overviewIcon, { backgroundColor: `${colors.primary}20` }]}>
                                    <Award size={24} color={colors.primary} />
                                </View>
                                <Text style={[styles.overviewValue, { color: colors.text }]}>
                                    {Math.round(classAnalytics.reduce((sum, c) => sum + c.average_grade, 0) / classAnalytics.length || 0)}%
                                </Text>
                                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Avg Grade</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Student Performance Charts */}
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Performance</Text>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics...</Text>
                            </View>
                        ) : (
                            studentPerformances
                                .filter(student => selectedClass === 'all' || student.class_name.includes(selectedClass))
                                .map((student) => renderPerformanceChart(student))
                        )}
                    </View>

                    {/* Class Comparison */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Class Comparison</Text>
                        {classAnalytics.map((classData) => (
                            <View key={classData.class_id} style={[styles.classCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <View style={styles.classHeader}>
                                    <Text style={[styles.className, { color: colors.text }]}>{classData.class_name}</Text>
                                    <View style={[styles.studentCount, { backgroundColor: colors.primary }]}>
                                        <Text style={styles.studentCountText}>{classData.total_students} students</Text>
                                    </View>
                                </View>

                                <View style={styles.classMetrics}>
                                    <View style={styles.classMetric}>
                                        <Text style={[styles.classMetricValue, { color: colors.primary }]}>{classData.average_attendance}%</Text>
                                        <Text style={[styles.classMetricLabel, { color: colors.textSecondary }]}>Attendance</Text>
                                    </View>
                                    <View style={styles.classMetric}>
                                        <Text style={[styles.classMetricValue, { color: colors.secondary }]}>{classData.average_grade}%</Text>
                                        <Text style={[styles.classMetricLabel, { color: colors.textSecondary }]}>Avg Grade</Text>
                                    </View>
                                    <View style={styles.classMetric}>
                                        <Award size={16} color="#10B981" />
                                        <Text style={[styles.topPerformer, { color: colors.text }]}>{classData.top_performer}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 8,
    },
    errorSubtext: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    filterContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    filterLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    filterButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    overviewContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    overviewCards: {
        flexDirection: 'row',
        gap: 12,
    },
    overviewCard: {
        width: 120,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    overviewIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    overviewValue: {
        fontSize: 24,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    overviewLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    performanceCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    studentInitial: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    rollNumber: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    gradeContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    gradeText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    metricsContainer: {
        gap: 16,
    },
    metric: {
        gap: 8,
    },
    metricLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    metricBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    metricValue: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        minWidth: 50,
        textAlign: 'right',
    },
    classCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    className: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    studentCount: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
    },
    studentCountText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: '#ffffff',
    },
    classMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    classMetric: {
        alignItems: 'center',
        flex: 1,
    },
    classMetricValue: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    classMetricLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    topPerformer: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        marginTop: 4,
        textAlign: 'center',
    },
});