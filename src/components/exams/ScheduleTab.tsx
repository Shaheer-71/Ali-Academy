// components/ScheduleTab.tsx - Updated without filter UI (filters now centralized)
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Calendar, Clock, Target, GraduationCap, Edit3, Users, Play, Square } from 'lucide-react-native';

interface ScheduleTabProps {
    colors: any;
    profile: any;
    statusFilter: 'all' | 'scheduled' | 'completed';
    setStatusFilter: (filter: 'all' | 'scheduled' | 'completed') => void;
    getFilteredQuizzes: () => any[];
    updateQuizStatus: (quizId: string, status: string) => void;
    setActiveTab?: (tab: 'schedule' | 'results' | 'reports') => void;
    selectedClass: string;
    quizResults: any[];
    areAllResultsMarked: (quizId: string) => boolean;
    onRefresh?: () => Promise<void>;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({
    colors,
    profile,
    statusFilter,
    setStatusFilter,
    getFilteredQuizzes,
    updateQuizStatus,
    setActiveTab,
    selectedClass,
    quizResults,
    areAllResultsMarked,
    onRefresh,
}) => {
    const [refreshing, setRefreshing] = React.useState(false);
    
    const filteredQuizzes = getFilteredQuizzes();
    

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return '#3B82F6';
            case 'active': return '#10B981';
            case 'completed': return '#6B7280';
            case 'cancelled': return '#EF4444';
            default: return colors.textSecondary;
        }
    };

    const getQuizTypeColor = (type: string) => {
        switch (type) {
            case 'quiz': return '#8B5CF6';
            case 'test': return '#06B6D4';
            case 'exam': return '#EF4444';
            case 'assignment': return '#F59E0B';
            default: return colors.textSecondary;
        }
    };

    const handleStartQuiz = (quiz: any) => {
        Alert.alert(
            'Start Quiz',
            `Are you sure you want to start "${quiz.title}"? Students will be able to take the quiz.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Start Quiz',
                    onPress: () => updateQuizStatus(quiz.id, 'active')
                }
            ]
        );
    };

    const handleEndQuiz = (quiz: any) => {
        Alert.alert(
            'Complete Quiz',
            `Are you sure you want to complete "${quiz.title}"? Students will no longer be able to submit.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Complete Quiz',
                    onPress: () => updateQuizStatus(quiz.id, 'completed')
                }
            ]
        );
    };

    const handleMarkQuizzes = (quiz: any) => {
        if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
            Alert.alert(
                'Mark Quiz Results',
                `Go to Results tab to mark individual student results for "${quiz.title}"`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Go to Results',
                        onPress: () => {
                            if (setActiveTab) {
                                setActiveTab('results');
                            }
                        }
                    }
                ]
            );
        }
    };

    // Handle pull-to-refresh
    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            try {
                await onRefresh();
            } catch (error) {
                console.error('Error refreshing data:', error);
            } finally {
                setRefreshing(false);
            }
        }
    };

    // Get counts for status display
    const getResultCounts = (quizId: string) => {
        const quizResults_filtered = quizResults.filter(result => result.quiz_id === quizId);
        const markedCount = quizResults_filtered.filter(result => 
            result.is_checked || result.submission_status === 'absent'
        ).length;
        
        return {
            total: quizResults_filtered.length,
            marked: markedCount,
            pending: quizResults_filtered.length - markedCount
        };
    };

    return (
        <View style={styles.scheduleContainer}>
            {/* Filter info banner - showing current filters */}
            {(statusFilter !== 'all' || selectedClass !== 'all') && (
                <View style={[styles.filterBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text allowFontScaling={false} style={[styles.filterText, { color: colors.textSecondary }]}>
                        Active Filters:
                        {statusFilter !== 'all' && ` Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
                        {selectedClass !== 'all' && ` • Class: Selected`}
                    </Text>
                </View>
            )}

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
                {filteredQuizzes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Calendar size={48} color={colors.textSecondary} />
                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>No quizzes found</Text>
                        <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            {(profile?.role === 'teacher' || profile?.role === 'admin') ? 'Schedule your first quiz or adjust filters using the Filter button' : 'Check back later for quiz schedules or adjust filters'}
                        </Text>
                    </View>
                ) : (
                    filteredQuizzes.map((quiz) => {
                        const resultCounts = getResultCounts(quiz.id);
                        const allMarked = areAllResultsMarked(quiz.id);
                        
                        return (
                            <View key={quiz.id} style={[styles.quizCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <View style={styles.quizHeader}>
                                    <View style={[styles.quizIcon, { backgroundColor: colors.primary }]}>
                                        <GraduationCap size={20} color="#ffffff" />
                                    </View>
                                    <View style={styles.quizInfo}>
                                        <Text allowFontScaling={false} style={[styles.quizTitle, { color: colors.text }]}>{quiz.title}</Text>
                                        <Text allowFontScaling={false} style={[styles.quizSubject, { color: colors.textSecondary }]}>
                                            {quiz.subjects?.name} • {quiz.classes?.name}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quiz.status) }]}>
                                        <Text allowFontScaling={false} style={styles.statusText}>{quiz.status.toUpperCase()}</Text>
                                    </View>
                                </View>

                                {quiz.description && (
                                    <Text allowFontScaling={false} style={[styles.quizDescription, { color: colors.text }]}>{quiz.description}</Text>
                                )}

                                <View style={styles.quizDetails}>
                                    <View style={styles.quizDetail}>
                                        <Calendar size={16} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.quizDetailText, { color: colors.text }]}>
                                            {formatDate(quiz.scheduled_date)}
                                        </Text>
                                    </View>
                                    <View style={styles.quizDetail}>
                                        <Clock size={16} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.quizDetailText, { color: colors.text }]}>
                                            {quiz.duration_minutes} minutes
                                        </Text>
                                    </View>
                                    <View style={styles.quizDetail}>
                                        <Target size={16} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.quizDetailText, { color: colors.text }]}>
                                            {quiz.total_marks} marks
                                        </Text>
                                    </View>
                                </View>

                                {quiz.instructions && (
                                    <View style={[styles.instructionsContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.instructionsLabel, { color: colors.textSecondary }]}>Instructions:</Text>
                                        <Text allowFontScaling={false} style={[styles.instructionsText, { color: colors.text }]}>{quiz.instructions}</Text>
                                    </View>
                                )}

                                {/* Quiz Type Badge */}
                                <View style={styles.quizTypeBadge}>
                                    <View style={[styles.typeBadge, { backgroundColor: getQuizTypeColor(quiz.quiz_type) }]}>
                                        <Text allowFontScaling={false} style={styles.typeBadgeText}>{quiz.quiz_type.toUpperCase()}</Text>
                                    </View>
                                    {quiz.passing_marks && (
                                        <Text allowFontScaling={false} style={[styles.passingMarks, { color: colors.textSecondary }]}>
                                            Passing: {quiz.passing_marks} marks
                                        </Text>
                                    )}
                                </View>

                                {/* Results Summary for All Quizzes */}
                                {resultCounts.total > 0 && (
                                    <View style={[styles.resultsSummary, { backgroundColor: colors.background }]}>
                                        <View style={styles.resultsRow}>
                                            <Users size={14} color={colors.textSecondary} />
                                            <Text allowFontScaling={false} style={[styles.resultsText, { color: colors.textSecondary }]}>
                                                {resultCounts.marked}/{resultCounts.total} students marked
                                            </Text>
                                            {resultCounts.pending > 0 && (
                                                <View style={[styles.pendingBadge, { backgroundColor: '#F59E0B' }]}>
                                                    <Text allowFontScaling={false} style={styles.pendingBadgeText}>{resultCounts.pending} pending</Text>
                                                </View>
                                            )}
                                            {resultCounts.marked === resultCounts.total && (
                                                <View style={[styles.completeBadge, { backgroundColor: '#10B981' }]}>
                                                    <Text allowFontScaling={false} style={styles.completeBadgeText}>✓ All Marked</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}

                                {/* Teacher Actions - ENHANCED LOGIC WITH AUTO-COMPLETE */}
                                {(profile?.role === 'teacher' || profile?.role === 'admin') && (
                                    <View style={styles.teacherActions}>
                                        {/* Show Start Quiz button for scheduled quizzes (only if no marks entered) */}
                                        {quiz.status === 'scheduled' && resultCounts.marked === 0 && (
                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                                                onPress={() => handleStartQuiz(quiz)}
                                            >
                                                <Play size={16} color="#ffffff" />
                                                <Text allowFontScaling={false} style={[styles.actionButtonText, { color: '#ffffff' }]}>Start Quiz</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Show Complete Quiz button for active quizzes */}
                                        {quiz.status === 'active' && (
                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                                                onPress={() => handleEndQuiz(quiz)}
                                            >
                                                <Square size={16} color="#ffffff" />
                                                <Text allowFontScaling={false} style={[styles.actionButtonText, { color: '#ffffff' }]}>Complete Quiz</Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Show Mark Quiz button for completed quizzes OR scheduled quizzes with some marks */}
                                        {((quiz.status === 'completed' && !allMarked) || 
                                          (quiz.status === 'scheduled' && resultCounts.marked > 0) || 
                                          (quiz.status === 'active' && !allMarked)) && (
                                            <TouchableOpacity
                                                style={[styles.markingButton, { backgroundColor: colors.primary }]}
                                                onPress={() => handleMarkQuizzes(quiz)}
                                            >
                                                <Edit3 size={16} color="#ffffff" />
                                                <Text allowFontScaling={false} style={styles.markingButtonText}>
                                                    {resultCounts.marked === 0 ? 'Start Marking' : 'Continue Marking'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {/* Auto-complete info for scheduled quizzes with marks */}
                                        {quiz.status === 'scheduled' && resultCounts.marked > 0 && (
                                            <View style={[styles.autoCompleteInfo, { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' }]}>
                                                <Text allowFontScaling={false} style={[styles.autoCompleteText, { color: '#0369A1' }]}>
                                                    ℹ️ Quiz will auto-complete when you start marking
                                                </Text>
                                            </View>
                                        )}

                                        {/* Show completion message for fully marked quizzes */}
                                        {allMarked && (
                                            <View style={[styles.completedBadge, { backgroundColor: '#10B981' }]}>
                                                <Text allowFontScaling={false} style={styles.completedBadgeText}>✓ All Students Marked</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    scheduleContainer: {
        flex: 1,
    },
    filterBanner: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    filterText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    quizCard: {
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
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    quizIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    quizInfo: {
        flex: 1,
    },
    quizTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    quizSubject: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    quizDescription: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 20,
        marginBottom: 12,
    },
    quizDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    quizDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    quizDetailText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    instructionsContainer: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    instructionsLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    instructionsText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
    },
    quizTypeBadge: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeBadgeText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    passingMarks: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    resultsSummary: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    resultsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resultsText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    pendingBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pendingBadgeText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    completeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    completeBadgeText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    teacherActions: {
        marginTop: 8,
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    markingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    markingButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    autoCompleteInfo: {
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    autoCompleteText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
    completedBadge: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    completedBadgeText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
});

export default ScheduleTab;