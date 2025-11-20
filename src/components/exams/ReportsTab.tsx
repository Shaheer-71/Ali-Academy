// components/ReportsTab.tsx - FIXED for students
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl } from 'react-native';
import { TrendingUp, Target, Users, BookOpen } from 'lucide-react-native';
import {
    handleError,
} from '@/src/utils/errorHandler/attendanceErrorHandler';

interface ReportsTabProps {
    colors: any;
    profile: any;
    selectedClass: string;
    classes: any[];
    subjects: any[];
    quizzes: any[];
    quizResults: any[];
    onRefresh?: () => void;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
    colors,
    profile,
    selectedClass,
    classes,
    subjects,
    quizzes,
    quizResults,
    onRefresh,
}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
});

    const showError = (error: any, handler?: (error: any) => any) => {
        const errorInfo = handler ? handler(error) : handleError(error);
        setErrorModal({
            visible: true,
            title: errorInfo.title,
            message: errorInfo.message,
        });
    };

    // Handle pull-to-refresh
    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            try {
                await onRefresh();
            } catch (error) {
                console.warn('❌ Error refreshing reports:', error);
                showError(error);
            } finally {
                setRefreshing(false);
            }
        }
    };

    // FIXED: Separate filtering logic for students and teachers
    const getFilteredDataForReports = () => {
        if (profile?.role === 'student') {
            // For students: show ALL their quizzes and results (no class filtering)
            const studentQuizzes = quizzes;
            const studentResults = quizResults.filter(r => r.student_id === profile?.id);


            return {
                filteredQuizzes: studentQuizzes,
                filteredResults: studentResults
            };
        } else {
            // For teachers: filter by selected class
            let filteredQuizzes = [...quizzes];
            let filteredResults = [...quizResults];

            if (selectedClass && selectedClass !== 'all') {
                filteredQuizzes = quizzes.filter(quiz => quiz.class_id === selectedClass);
                const classQuizIds = filteredQuizzes.map(quiz => quiz.id);
                filteredResults = quizResults.filter(result =>
                    classQuizIds.includes(result.quiz_id)
                );
            }

            return { filteredQuizzes, filteredResults };
        }
    };

    const { filteredQuizzes, filteredResults } = getFilteredDataForReports();

    // Calculate overall statistics
    const getOverallStats = () => {
        // For students, only show their own results
        const relevantResults = profile?.role === 'student'
            ? filteredResults.filter(r => r.student_id === profile?.id)
            : filteredResults;

        const checkedResults = relevantResults.filter(r => r.is_checked && r.marks_obtained !== null);
        const absentResults = relevantResults.filter(r => r.submission_status === 'absent');

        const totalMarks = checkedResults.reduce((sum, r) => sum + (r.marks_obtained || 0), 0);
        const totalPossible = checkedResults.reduce((sum, r) => sum + r.total_marks, 0);
        const averagePercentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;



        return {
            totalQuizzes: relevantResults.length,
            checkedQuizzes: checkedResults.length,
            uncheckedQuizzes: relevantResults.length - checkedResults.length - absentResults.length,
            absentQuizzes: absentResults.length,
            averagePercentage: Math.round(averagePercentage),
            totalMarks,
            totalPossible,
        };
    };

    // Get subject-wise performance
    const getSubjectWisePerformance = () => {
        const relevantResults = profile?.role === 'student'
            ? filteredResults.filter(r => r.student_id === profile?.id)
            : filteredResults;

        // Get subjects that have quizzes in the filtered data
        const subjectIdsWithQuizzes = [...new Set(filteredQuizzes.map(quiz => quiz.subject_id))];
        const availableSubjects = subjects.filter(subject =>
            subjectIdsWithQuizzes.includes(subject.id)
        );

        return availableSubjects.map(subject => {
            const subjectQuizIds = filteredQuizzes
                .filter(quiz => quiz.subject_id === subject.id)
                .map(quiz => quiz.id);

            const subjectResults = relevantResults.filter(result =>
                subjectQuizIds.includes(result.quiz_id) &&
                result.is_checked &&
                result.marks_obtained !== null
            );

            const subjectMarks = subjectResults.reduce((sum, r) => sum + (r.marks_obtained || 0), 0);
            const subjectTotal = subjectResults.reduce((sum, r) => sum + r.total_marks, 0);
            const subjectPercentage = subjectTotal > 0 ? (subjectMarks / subjectTotal) * 100 : 0;

            return {
                id: subject.id,
                name: subject.name,
                totalQuizzes: subjectQuizIds.length,
                checkedQuizzes: subjectResults.length,
                totalMarks: subjectMarks,
                totalPossible: subjectTotal,
                percentage: subjectPercentage,
            };
        }).filter(subject => subject.totalQuizzes > 0); // Only show subjects with quizzes
    };

    const calculateGrade = (percentage: number): string => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C';
        return 'F';
    };

    const getGradeColor = (grade?: string) => {
        switch (grade) {
            case 'A+': return '#10B981';
            case 'A': return '#059669';
            case 'B+': return '#3B82F6';
            case 'B': return '#6366F1';
            case 'C+': return '#F59E0B';
            case 'C': return '#EF4444';
            case 'F': return '#DC2626';
            default: return colors.textSecondary;
        }
    };

    const overallStats = getOverallStats();
    const subjectWisePerformance = getSubjectWisePerformance();

    // FIXED: Better context display for students
    const getContextDisplay = () => {
        if (profile?.role === 'student') {
            return {
                title: 'My Performance Report',
                subtitle: 'Overall academic performance across all subjects'
            };
        } else {
            const selectedClassName = selectedClass === 'all' ? 'All Classes' : classes.find(c => c.id === selectedClass)?.name;
            return {
                title: 'Performance Report',
                subtitle: `${selectedClassName} • Class Overview`
            };
        }
    };

    const contextDisplay = getContextDisplay();

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    title="Pull to refresh"
                    titleColor={colors.textSecondary}
                />
            }
        >
            {/* Header Context */}
            <View style={[styles.contextCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.contextHeader}>
                    <Users size={20} color={colors.primary} />
                    <Text allowFontScaling={false} style={[styles.contextTitle, { color: colors.text }]}>
                        {contextDisplay.title}
                    </Text>
                </View>
                <Text allowFontScaling={false} style={[styles.contextSubtitle, { color: colors.textSecondary }]}>
                    {contextDisplay.subtitle}
                </Text>
            </View>

            {/* Overall Performance Card */}
            <View style={[styles.reportCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text allowFontScaling={false} style={[styles.reportTitle, { color: colors.text }]}>
                    Overall Performance Summary
                </Text>

                {overallStats.totalQuizzes === 0 ? (
                    <View style={styles.noDataContainer}>
                        <BookOpen size={48} color={colors.textSecondary} />
                        <Text allowFontScaling={false} style={[styles.noDataText, { color: colors.textSecondary }]}>
                            {profile?.role === 'student'
                                ? 'No quiz data available yet. Check back once your teacher creates quizzes!'
                                : `No quiz data available for ${contextDisplay.subtitle}`
                            }
                        </Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text allowFontScaling={false} style={[styles.statValue, { color: colors.primary }]}>{overallStats.totalQuizzes}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Total Quizzes</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#10B981' }]}>{overallStats.checkedQuizzes}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Evaluated</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#F59E0B' }]}>{overallStats.uncheckedQuizzes}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#EF4444' }]}>{overallStats.absentQuizzes}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                            </View>
                        </View>

                        {overallStats.checkedQuizzes > 0 && (
                            <>
                                <View style={styles.progressSection}>
                                    <Text allowFontScaling={false} style={[styles.progressLabel, { color: colors.textSecondary }]}>
                                        Average Performance: {overallStats.averagePercentage}%
                                    </Text>
                                    <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${overallStats.averagePercentage}%`,
                                                    backgroundColor: getGradeColor(calculateGrade(overallStats.averagePercentage))
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text allowFontScaling={false} style={[styles.progressText, { color: colors.text }]}>
                                        {overallStats.totalMarks}/{overallStats.totalPossible} total marks
                                    </Text>
                                </View>

                                <View style={styles.gradeSection}>
                                    <Text allowFontScaling={false} style={[styles.gradeLabel, { color: colors.textSecondary }]}>Current Grade</Text>
                                    <View style={[
                                        styles.gradeBadge,
                                        { backgroundColor: getGradeColor(calculateGrade(overallStats.averagePercentage)) }
                                    ]}>
                                        <Text allowFontScaling={false} style={styles.gradeBadgeText}>
                                            {calculateGrade(overallStats.averagePercentage)}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </>
                )}
            </View>

            {/* Subject-wise Performance */}
            {/* {overallStats.totalQuizzes > 0 && (
                <View style={[styles.reportCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text allowFontScaling={false} style={[styles.reportTitle, { color: colors.text }]}>
                        Subject-wise Performance
                    </Text>

                    {subjectWisePerformance.length === 0 ? (
                        <View style={styles.emptySubjects}>
                            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No subjects with quiz data found
                            </Text>
                        </View>
                    ) : (
                        subjectWisePerformance.map((subject) => (
                            <View key={subject.id} style={[styles.subjectReport, { borderBottomColor: colors.border }]}>
                                <View style={styles.subjectHeader}>
                                    <Text allowFontScaling={false} style={[styles.subjectName, { color: colors.text }]}>{subject.name}</Text>
                                    {subject.checkedQuizzes > 0 ? (
                                        <Text allowFontScaling={false} style={[styles.subjectPercentage, { color: getGradeColor(calculateGrade(subject.percentage)) }]}>
                                            {subject.percentage.toFixed(1)}%
                                        </Text>
                                    ) : (
                                        <Text allowFontScaling={false} style={[styles.noDataBadge, { color: colors.textSecondary }]}>No data</Text>
                                    )}
                                </View>
                                
                                {subject.checkedQuizzes > 0 ? (
                                    <>
                                        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                                            <View
                                                style={[
                                                    styles.progressBarFill,
                                                    { 
                                                        width: `${subject.percentage}%`, 
                                                        backgroundColor: getGradeColor(calculateGrade(subject.percentage))
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text allowFontScaling={false} style={[styles.subjectStats, { color: colors.textSecondary }]}>
                                            {subject.checkedQuizzes}/{subject.totalQuizzes} quizzes evaluated • {subject.totalMarks}/{subject.totalPossible} marks
                                        </Text>
                                    </>
                                ) : (
                                    <Text allowFontScaling={false} style={[styles.subjectStats, { color: colors.textSecondary }]}>
                                        {subject.totalQuizzes} quizzes available • No evaluated results yet
                                    </Text>
                                )}
                            </View>
                        ))
                    )}
                </View>
            )} */}

            {/* Performance Analysis */}
            {overallStats.checkedQuizzes > 0 && (
                <View style={[styles.reportCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text allowFontScaling={false} style={[styles.reportTitle, { color: colors.text }]}>Performance Analysis</Text>

                    <View style={styles.analysisGrid}>
                        <View style={styles.analysisItem}>
                            <View style={[styles.analysisIcon, { backgroundColor: getGradeColor(calculateGrade(overallStats.averagePercentage)) }]}>
                                <TrendingUp size={20} color="#ffffff" />
                            </View>
                            <Text allowFontScaling={false} style={[styles.analysisLabel, { color: colors.textSecondary }]}>Performance Level</Text>
                            <Text allowFontScaling={false} style={[styles.analysisValue, { color: colors.text }]}>
                                {overallStats.averagePercentage >= 90 ? 'Excellent' :
                                    overallStats.averagePercentage >= 80 ? 'Very Good' :
                                        overallStats.averagePercentage >= 70 ? 'Good' :
                                            overallStats.averagePercentage >= 60 ? 'Average' :
                                                overallStats.averagePercentage >= 40 ? 'Below Average' : 'Needs Improvement'}
                            </Text>
                        </View>

                        <View style={styles.analysisItem}>
                            <View style={[styles.analysisIcon, { backgroundColor: colors.primary }]}>
                                <Target size={20} color="#ffffff" />
                            </View>
                            <Text allowFontScaling={false} style={[styles.analysisLabel, { color: colors.textSecondary }]}>Completion Rate</Text>
                            <Text allowFontScaling={false} style={[styles.analysisValue, { color: colors.text }]}>
                                {Math.round((overallStats.checkedQuizzes / overallStats.totalQuizzes) * 100)}%
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.summaryContainer, { backgroundColor: colors.background }]}>
                        <Text allowFontScaling={false} style={[styles.summaryText, { color: colors.textSecondary }]}>
                            {profile?.role === 'student'
                                ? `You have completed ${overallStats.checkedQuizzes} out of ${overallStats.totalQuizzes} quizzes with an average score of ${overallStats.averagePercentage}%.`
                                : `Students have completed ${overallStats.checkedQuizzes} out of ${overallStats.totalQuizzes} total quiz attempts with an average performance of ${overallStats.averagePercentage}%.`
                            }
                            {overallStats.uncheckedQuizzes > 0 && ` ${overallStats.uncheckedQuizzes} quiz${overallStats.uncheckedQuizzes > 1 ? 'zes are' : ' is'} still pending evaluation.`}
                            {overallStats.absentQuizzes > 0 && ` ${overallStats.absentQuizzes} quiz${overallStats.absentQuizzes > 1 ? 'zes were' : ' was'} marked as absent.`}
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

import { TextSizes } from '@/src/styles/TextSizes';


const styles = StyleSheet.create({
    contextCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    contextHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    contextTitle: {
        fontSize: TextSizes.large,       // adjusted from 18
        fontFamily: 'Inter-SemiBold',
    },
    contextSubtitle: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-Regular',
    },
    reportCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reportTitle: {
        fontSize: TextSizes.large,       // adjusted from 18
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    noDataContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noDataText: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: TextSizes.large,  // adjusted from 24
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: TextSizes.small,       // adjusted from 12
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    progressSection: {
        marginBottom: 16,
    },
    progressLabel: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: TextSizes.small,       // adjusted from 12
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    gradeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gradeLabel: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-Medium',
    },
    gradeBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    gradeBadgeText: {
        fontSize: TextSizes.large,       // adjusted from 16
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    subjectReport: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    subjectName: {
        fontSize: TextSizes.large,       // adjusted from 16
        fontFamily: 'Inter-SemiBold',
    },
    subjectPercentage: {
        fontSize: TextSizes.large,  // adjusted from 18
        fontFamily: 'Inter-SemiBold',
    },
    noDataBadge: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
    subjectStats: {
        fontSize: TextSizes.small,       // adjusted from 12
        fontFamily: 'Inter-Regular',
        marginTop: 6,
    },
    emptySubjects: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    analysisGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    analysisItem: {
        alignItems: 'center',
        flex: 1,
    },
    analysisIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    analysisLabel: {
        fontSize: TextSizes.small,       // adjusted from 12
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
        textAlign: 'center',
    },
    analysisValue: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
    },
    summaryContainer: {
        borderRadius: 8,
        padding: 16,
    },
    summaryText: {
        fontSize: TextSizes.medium,      // adjusted from 14
        fontFamily: 'Inter-Regular',
        lineHeight: TextSizes.medium + 6,
        textAlign: 'center',
    },
});


// const styles = StyleSheet.create({
//     contextCard: {
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 20,
//         borderWidth: 1,
//     },
//     contextHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 4,
//         gap: 8,
//     },
//     contextTitle: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//     },
//     contextSubtitle: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//     },
//     reportCard: {
//         borderRadius: 16,
//         padding: 20,
//         marginBottom: 20,
//         borderWidth: 1,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     reportTitle: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 16,
//     },
//     noDataContainer: {
//         alignItems: 'center',
//         paddingVertical: 40,
//     },
//     noDataText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//         marginTop: 12,
//         paddingHorizontal: 20,
//     },
//     statsGrid: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginBottom: 20,
//     },
//     statItem: {
//         alignItems: 'center',
//         flex: 1,
//     },
//     statValue: {
//         fontSize: 24,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 4,
//     },
//     statLabel: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//     },
//     progressSection: {
//         marginBottom: 16,
//     },
//     progressLabel: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//         marginBottom: 8,
//     },
//     progressBarContainer: {
//         height: 8,
//         borderRadius: 4,
//         overflow: 'hidden',
//         marginBottom: 8,
//     },
//     progressBarFill: {
//         height: '100%',
//         borderRadius: 4,
//     },
//     progressText: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//     },
//     gradeSection: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     gradeLabel: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//     },
//     gradeBadge: {
//         paddingHorizontal: 16,
//         paddingVertical: 8,
//         borderRadius: 12,
//     },
//     gradeBadgeText: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         color: '#ffffff',
//     },
//     subjectReport: {
//         paddingVertical: 16,
//         borderBottomWidth: 1,
//     },
//     subjectHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 8,
//     },
//     subjectName: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//     },
//     subjectPercentage: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//     },
//     noDataBadge: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         fontStyle: 'italic',
//     },
//     subjectStats: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         marginTop: 6,
//     },
//     emptySubjects: {
//         alignItems: 'center',
//         paddingVertical: 20,
//     },
//     emptyText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//     },
//     analysisGrid: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         marginBottom: 20,
//     },
//     analysisItem: {
//         alignItems: 'center',
//         flex: 1,
//     },
//     analysisIcon: {
//         width: 48,
//         height: 48,
//         borderRadius: 24,
//         alignItems: 'center',
//         justifyContent: 'center',
//         marginBottom: 8,
//     },
//     analysisLabel: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         marginBottom: 4,
//         textAlign: 'center',
//     },
//     analysisValue: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//         textAlign: 'center',
//     },
//     summaryContainer: {
//         borderRadius: 8,
//         padding: 16,
//     },
//     summaryText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         lineHeight: 20,
//         textAlign: 'center',
//     },
// });

export default ReportsTab;