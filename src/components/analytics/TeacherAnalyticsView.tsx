// components/TeacherAnalyticsView.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTeacherAnalytics} from '@/src/hooks/useTeacherAnalytics';
import { User, Users, Award, ClipboardCheck } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export const TeacherAnalyticsView = () => {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [selectedClass, setSelectedClass] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const { studentPerformances, classAnalytics, classes, loading, error } = useTeacherAnalytics(profile?.id, selectedClass);

    const renderProgressBar = (percentage: number, color: string) => (
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
    );

    const onRefresh = async () => {
        setRefreshing(true);
        // await fetchAllData();
        setRefreshing(false);
    };


    const renderPerformanceCard = (student: any) => (
        <View style={[styles.performanceCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.studentHeader}>
                <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.studentInitial}>
                        {student.full_name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>
                        {student.full_name}
                    </Text>
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
                        {renderProgressBar(student.attendance_rate, '#10B981')}
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                            {student.attendance_rate}%
                        </Text>
                    </View>
                </View>

                <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Quizzes</Text>
                    <View style={styles.metricBar}>
                        {renderProgressBar((student.assignments_completed / student.total_assignments) * 100, colors.secondary)}
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                            {student.assignments_completed}/{student.total_assignments}
                        </Text>
                    </View>
                </View>

                <View style={styles.metric}>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Overall Grade</Text>
                    <View style={styles.metricBar}>
                        {renderProgressBar(student.average_grade, colors.primary)}
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                            {student.average_grade}%
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );

    // if (loading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
    //                 Loading analytics...
    //             </Text>
    //         </View>
    //     );
    // }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: colors.text }]}>Error</Text>
                <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.filterContainer, { marginTop: 20 }]}>
                <View style={[styles.studentHeaderContent, { marginBottom: 10 }]}>
                    <User size={24} color={colors.primary} />
                    <Text style={[styles.studentTitle, { color: colors.text }]}>Class Analytics</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                        title="Pull to refresh"
                        titleColor={colors.textSecondary}
                    />
                }>
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

            {/* Overview Cards */}
            <View style={styles.overviewContainer}>
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
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Student Performance - Horizontal Scroll */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Student Performance</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScrollContainer}
                    >
                        {studentPerformances.map((student) => (
                            <View key={student.id} style={styles.horizontalCardWrapper}>
                                {renderPerformanceCard(student)}
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Class Comparison */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Class Comparison</Text>
                    {classAnalytics.map((classData) => (
                        <View key={classData.class_id} style={[styles.classCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <View style={styles.classHeader}>
                                <Text style={[styles.className, { color: colors.text }]}>
                                    {classData.class_name}
                                </Text>
                                <View style={[styles.studentCount, { backgroundColor: colors.primary }]}>
                                    <Text style={styles.studentCountText}>
                                        {classData.total_students} students
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.classMetrics}>
                                <View style={styles.classMetric}>
                                    <Text style={[styles.classMetricValue, { color: colors.primary }]}>
                                        {classData.average_attendance}%
                                    </Text>
                                    <Text style={[styles.classMetricLabel, { color: colors.textSecondary }]}>
                                        Attendance
                                    </Text>
                                </View>
                                <View style={styles.classMetric}>
                                    <Text style={[styles.classMetricValue, { color: colors.secondary }]}>
                                        {classData.average_grade}%
                                    </Text>
                                    <Text style={[styles.classMetricLabel, { color: colors.textSecondary }]}>
                                        Avg Grade
                                    </Text>
                                </View>
                                <View style={styles.classMetric}>
                                    <Award size={16} color="#10B981" />
                                    <Text style={[styles.topPerformer, { color: colors.text }]}>
                                        {classData.top_performer}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
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
    studentHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginLeft: 12,
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
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24
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
    horizontalScrollContainer: {
        paddingRight: 24,
    },
    horizontalCardWrapper: {
        marginRight: 16,
        width: width * 0.8,
    },
    performanceCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        width: '100%',
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

