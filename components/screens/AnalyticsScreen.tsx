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
import { ChartBar as BarChart3, TrendingUp, TrendingDown, Users, Award, Target, Calendar, BookOpen, ClipboardCheck, User, Activity } from 'lucide-react-native';
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

interface StudentAnalytics {
    attendance_rate: number;
    average_grade: number;
    assignments_completed: number;
    total_assignments: number;
    rank_in_class: number;
    total_students: number;
    improvement_trend: 'up' | 'down' | 'stable';
    recent_grades: number[];
    subjects: {
        name: string;
        grade: number;
        assignments_completed: number;
        total_assignments: number;
    }[];
}

export default function AnalyticsScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
    const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
    const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalytics | null>(null);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.role === 'teacher') {
            fetchClasses();
            fetchAnalyticsData();
        } else if (profile?.role === 'student') {
            fetchStudentAnalytics();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedClass && profile?.role === 'teacher') {
            fetchAnalyticsData();
        }
    }, [selectedClass]);

    const fetchStudentAnalytics = async () => {
        try {
            // Mock data for student analytics - replace with actual database queries
            const mockStudentAnalytics: StudentAnalytics = {
                attendance_rate: 92,
                average_grade: 87,
                assignments_completed: 14,
                total_assignments: 16,
                rank_in_class: 3,
                total_students: 25,
                improvement_trend: 'up',
                recent_grades: [85, 88, 90, 87, 89],
                subjects: [
                    {
                        name: 'Mathematics',
                        grade: 90,
                        assignments_completed: 4,
                        total_assignments: 4,
                    },
                    {
                        name: 'Science',
                        grade: 88,
                        assignments_completed: 3,
                        total_assignments: 4,
                    },
                    {
                        name: 'English',
                        grade: 85,
                        assignments_completed: 3,
                        total_assignments: 4,
                    },
                    {
                        name: 'History',
                        grade: 86,
                        assignments_completed: 4,
                        total_assignments: 4,
                    },
                ],
            };

            setStudentAnalytics(mockStudentAnalytics);
        } catch (error) {
            console.error('Error fetching student analytics:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp size={16} color="#10B981" />;
            case 'down':
                return <TrendingDown size={16} color="#EF4444" />;
            default:
                return <Activity size={16} color={colors.textSecondary} />;
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return '#10B981';
            case 'down':
                return '#EF4444';
            default:
                return colors.textSecondary;
        }
    };

    // Student View
    if (profile?.role === 'student') {
        if (loading || !studentAnalytics) {
            return (
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <TopSections />
                    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                        <View style={styles.loadingContainer}>
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your analytics...</Text>
                        </View>
                    </SafeAreaView>
                </View>
            );
        }

        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                    {/* Student Header */}
                    <View style={styles.studentHeaderSection}>
                        <View style={styles.studentHeaderContent}>
                            <User size={24} color={colors.primary} />
                            <Text style={[styles.studentTitle, { color: colors.text }]}>My Performance</Text>
                        </View>
                        <View style={styles.rankContainer}>
                            <Text style={[styles.rankNumber, { color: colors.primary }]}>#{studentAnalytics.rank_in_class}</Text>
                            <Text style={[styles.rankLabel, { color: colors.textSecondary }]}>of {studentAnalytics.total_students}</Text>
                        </View>
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                        {/* Performance Overview */}
                        <View style={styles.overviewContainer}>
                            <View style={styles.overviewCards}>
                                <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={[styles.overviewIcon, { backgroundColor: '#10B98120' }]}>
                                        <ClipboardCheck size={20} color="#10B981" />
                                    </View>
                                    <Text style={[styles.overviewValue, { color: colors.text }]}>{studentAnalytics.attendance_rate}%</Text>
                                    <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Attendance</Text>
                                </View>

                                <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={[styles.overviewIcon, { backgroundColor: `${colors.primary}20` }]}>
                                        <Award size={20} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.overviewValue, { color: colors.text }]}>{studentAnalytics.average_grade}%</Text>
                                    <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Avg Grade</Text>
                                </View>

                                <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={[styles.overviewIcon, { backgroundColor: `${colors.secondary}20` }]}>
                                        <BookOpen size={20} color={colors.secondary} />
                                    </View>
                                    <Text style={[styles.overviewValue, { color: colors.text }]}>{studentAnalytics.assignments_completed}/{studentAnalytics.total_assignments}</Text>
                                    <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Assignments</Text>
                                </View>
                            </View>
                        </View>

                        {/* Performance Trend */}
                        <View style={[styles.trendCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <View style={styles.trendHeader}>
                                <Text style={[styles.trendTitle, { color: colors.text }]}>Performance Trend</Text>
                                <View style={styles.trendIndicator}>
                                    {getTrendIcon(studentAnalytics.improvement_trend)}
                                    <Text style={[styles.trendText, { color: getTrendColor(studentAnalytics.improvement_trend) }]}>
                                        {studentAnalytics.improvement_trend === 'up' ? 'Improving' :
                                            studentAnalytics.improvement_trend === 'down' ? 'Declining' : 'Stable'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.recentGrades}>
                                <Text style={[styles.recentGradesLabel, { color: colors.textSecondary }]}>Recent Grades</Text>
                                <View style={styles.gradesContainer}>
                                    {studentAnalytics.recent_grades.map((grade, index) => (
                                        <View key={index} style={[styles.gradeChip, { backgroundColor: colors.primary }]}>
                                            <Text style={styles.gradeChipText}>{grade}%</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Subject Performance */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subject Performance</Text>
                            {studentAnalytics.subjects.map((subject, index) => (
                                <View key={index} style={[styles.subjectCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={styles.subjectHeader}>
                                        <Text style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                                        <Text style={[styles.subjectGrade, { color: colors.primary }]}>{subject.grade}%</Text>
                                    </View>
                                    <View style={styles.subjectMetrics}>
                                        <View style={styles.subjectAssignments}>
                                            <Text style={[styles.assignmentCount, { color: colors.textSecondary }]}>
                                                {subject.assignments_completed}/{subject.total_assignments} assignments completed
                                            </Text>
                                            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                                                <View
                                                    style={[
                                                        styles.progressBarFill,
                                                        {
                                                            width: `${(subject.assignments_completed / subject.total_assignments) * 100}%`,
                                                            backgroundColor: colors.secondary
                                                        },
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Overall Progress */}
                        <View style={[styles.progressCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.progressTitle, { color: colors.text }]}>Overall Progress</Text>
                            <View style={styles.progressMetrics}>
                                <View style={styles.progressMetric}>
                                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Assignments Completion</Text>
                                    <View style={styles.progressBarWithValue}>
                                        {renderProgressBar((studentAnalytics.assignments_completed / studentAnalytics.total_assignments) * 100, colors.secondary)}
                                        <Text style={[styles.progressValue, { color: colors.text }]}>
                                            {Math.round((studentAnalytics.assignments_completed / studentAnalytics.total_assignments) * 100)}%
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.progressMetric}>
                                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Grade Performance</Text>
                                    <View style={styles.progressBarWithValue}>
                                        {renderProgressBar(studentAnalytics.average_grade, colors.primary)}
                                        <Text style={[styles.progressValue, { color: colors.text }]}>
                                            {studentAnalytics.average_grade}%
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    // Teacher View (existing code)
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                {/* Class Filter */}
                <View style={[styles.filterContainer , {marginTop : 20}]}>
                    <View style={[styles.studentHeaderContent , {marginBottom : 10}]}>
                        <User size={24} color={colors.primary} />
                        <Text style={[styles.studentTitle, { color: colors.text }]}>My Performance</Text>
                    </View>

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
                    {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}> */}
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
                    {/* </ScrollView> */}
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
    studentHeaderSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    studentHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginLeft: 12,
    },
    rankContainer: {
        alignItems: 'center',
    },
    rankNumber: {
        fontSize: 28,
        fontFamily: 'Inter-Bold',
    },
    rankLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    trendCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
    },
    trendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    trendTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    trendIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginLeft: 6,
    },
    recentGrades: {
        marginTop: 12,
    },
    recentGradesLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    gradesContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    gradeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    gradeChipText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: '#ffffff',
    },
    subjectCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    subjectName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    subjectGrade: {
        fontSize: 18,
        fontFamily: 'Inter-Bold',
    },
    subjectMetrics: {
        gap: 8,
    },
    subjectAssignments: {
        gap: 6,
    },
    assignmentCount: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    progressCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
    },
    progressTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    progressMetrics: {
        gap: 16,
    },
    progressMetric: {
        gap: 8,
    },
    progressLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    progressBarWithValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressValue: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        minWidth: 50,
        textAlign: 'right',
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
        marginBottom: 24,
        flex : 1,
        alignItems : "center",
        justifyContent : "center",
        paddingHorizontal : 24
    },
    overviewCards: {
        flexDirection: 'row',
        gap: 12,
    },
    overviewCard: {
        width: "31%",
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