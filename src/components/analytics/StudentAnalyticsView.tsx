// components/StudentAnalyticsView.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useStudentAnalytics } from '@/src/hooks/useStudentAnalytics';
import { User, Award, ClipboardCheck, BookOpen, TrendingUp, TrendingDown, Activity } from 'lucide-react-native';

export const StudentAnalyticsView = () => {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const { analytics, loading, error } = useStudentAnalytics(profile?.id);



    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <TrendingUp size={16} color="#10B981" />;
            case 'down': return <TrendingDown size={16} color="#EF4444" />;
            default: return <Activity size={16} color={colors.textSecondary} />;
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return '#10B981';
            case 'down': return '#EF4444';
            default: return colors.textSecondary;
        }
    };

    const renderProgressBar = (percentage: number, color: string) => (
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text allowFontScaling={false} style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Loading your analytics...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text allowFontScaling={false} style={[styles.errorText, { color: colors.text }]}>Error</Text>
                <Text allowFontScaling={false} style={[styles.errorSubtext, { color: colors.textSecondary }]}>{error}</Text>
            </View>
        );
    }

    if (!analytics) {
        return (
            <View style={styles.errorContainer}>
                <Text allowFontScaling={false} style={[styles.errorText, { color: colors.text }]}>No Data</Text>
                <Text allowFontScaling={false} style={[styles.errorSubtext, { color: colors.textSecondary }]}>
                    No analytics data available
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.studentHeaderSection}>
                <View style={styles.studentHeaderContent}>
                    <User size={24} color={colors.primary} />
                    <Text allowFontScaling={false} style={[styles.studentTitle, { color: colors.text }]}>My Performance</Text>
                </View>
                <View style={styles.rankContainer}>
                    <Text allowFontScaling={false} style={[styles.rankNumber, { color: colors.primary }]}>
                        #{analytics.rank_in_class}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.rankLabel, { color: colors.textSecondary }]}>
                        of {analytics.total_students}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Overview Cards */}
                <View style={styles.overviewContainer}>
                    <View style={styles.overviewCards}>
                        <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <View style={[styles.overviewIcon, { backgroundColor: '#10B98120' }]}>
                                <ClipboardCheck size={20} color="#10B981" />
                            </View>
                            <Text allowFontScaling={false} style={[styles.overviewValue, { color: colors.text }]}>
                                {analytics.attendance_rate}%
                            </Text>
                            <Text allowFontScaling={false} style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                                Attendance
                            </Text>
                        </View>

                        <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <View style={[styles.overviewIcon, { backgroundColor: `${colors.primary}20` }]}>
                                <Award size={20} color={colors.primary} />
                            </View>
                            <Text allowFontScaling={false} style={[styles.overviewValue, { color: colors.text }]}>
                                {analytics.average_grade}%
                            </Text>
                            <Text allowFontScaling={false} style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                                Avg Grade
                            </Text>
                        </View>

                        <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <View style={[styles.overviewIcon, { backgroundColor: `${colors.secondary}20` }]}>
                                <BookOpen size={20} color={colors.secondary} />
                            </View>
                            <Text allowFontScaling={false} style={[styles.overviewValue, { color: colors.text }]}>
                                {analytics.assignments_completed}/{analytics.total_assignments}
                            </Text>
                            <Text allowFontScaling={false} style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                                Quizzes
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Performance Trend */}
                <View style={[styles.trendCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={styles.trendHeader}>
                        <Text allowFontScaling={false} style={[styles.trendTitle, { color: colors.text }]}>Performance Trend</Text>
                        <View style={styles.trendIndicator}>
                            {getTrendIcon(analytics.improvement_trend)}
                            <Text allowFontScaling={false} style={[styles.trendText, { color: getTrendColor(analytics.improvement_trend) }]}>
                                {analytics.improvement_trend === 'up' ? 'Improving' :
                                 analytics.improvement_trend === 'down' ? 'Declining' : 'Stable'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.recentGrades}>
                        <Text allowFontScaling={false} style={[styles.recentGradesLabel, { color: colors.textSecondary }]}>
                            Recent Grades
                        </Text>
                        <View style={styles.gradesContainer}>
                            {analytics.recent_grades.map((grade, index) => (
                                <View key={index} style={[styles.gradeChip, { backgroundColor: colors.primary }]}>
                                    <Text allowFontScaling={false} style={styles.gradeChipText}>{grade}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Subject Performance */}
                <View style={styles.section}>
                    <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Subject Performance</Text>
                    {analytics.subjects.map((subject, index) => (
                        <View key={index} style={[styles.subjectCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <View style={styles.subjectHeader}>
                                <Text allowFontScaling={false} style={[styles.subjectName, { color: colors.text }]}>
                                    {subject.name}
                                </Text>
                                <Text allowFontScaling={false} style={[styles.subjectGrade, { color: colors.primary }]}>
                                    {subject.grade}%
                                </Text>
                            </View>
                            <View style={styles.subjectMetrics}>
                                <Text allowFontScaling={false} style={[styles.assignmentCount, { color: colors.textSecondary }]}>
                                    {subject.assignments_completed}/{subject.total_assignments} quizzes completed
                                </Text>
                                {renderProgressBar(
                                    (subject.assignments_completed / subject.total_assignments) * 100, 
                                    colors.secondary
                                )}
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
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    overviewContainer: {
        marginBottom: 24,
        alignItems: "center",
        justifyContent: "center",
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
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
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
    assignmentCount: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 6,
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
});