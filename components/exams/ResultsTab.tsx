// components/ResultsTab.tsx - Fixed with pull-to-refresh and real-time updates
import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, RefreshControl } from 'react-native';
import { BookOpen, CircleCheck as CheckCircle, Circle, UserX } from 'lucide-react-native';

interface ResultsTabProps {
    colors: any;
    profile: any;
    selectedClass: string;
    selectedSubject: string;
    setSelectedSubject: (subjectId: string) => void;
    checkedFilter: 'all' | 'checked' | 'unchecked';
    setCheckedFilter: (filter: 'all' | 'checked' | 'unchecked') => void;
    getSubjectsWithAll: (selectedClass?: string) => any[];
    getFilteredResults: (selectedClass: string, selectedSubject: string, checkedFilter: 'all' | 'checked' | 'unchecked') => any[];
    setSelectedResult: (result: any) => void;
    setMarkingModalVisible: (visible: boolean) => void;
    quizzes: any[];
    quizResults: any[];
    subjects: any[];
    classes?: any[];
    onRefresh?: () => Promise<void>; // NEW: Add refresh function
}

const ResultsTab: React.FC<ResultsTabProps> = ({
    colors,
    profile,
    selectedClass,
    selectedSubject,
    setSelectedSubject,
    checkedFilter,
    setCheckedFilter,
    getSubjectsWithAll,
    getFilteredResults,
    setSelectedResult,
    setMarkingModalVisible,
    quizzes,
    quizResults,
    subjects,
    classes = [],
    onRefresh, // NEW: Accept refresh function
}) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false); // NEW: Add refreshing state

    // NEW: Handle pull-to-refresh
    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            try {
                await onRefresh();
                console.log('✅ Results tab refreshed successfully');
            } catch (error) {
                console.error('❌ Error refreshing results:', error);
            } finally {
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        console.log('🔄 ResultsTab: Class changed to:', selectedClass);
        setRefreshKey(prev => prev + 1);
        // Reset subject selection when class changes
        setSelectedSubject('all');
    }, [selectedClass, setSelectedSubject]);

    useEffect(() => {
        // console.log('📊 ResultsTab: Data updated - Quizzes:', quizzes.length, 'Subjects:', subjects.length);
        setRefreshKey(prev => prev + 1);
    }, [quizzes, subjects]);

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

    const calculateGrade = (percentage: number): string => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C+';
        if (percentage >= 40) return 'C';
        return 'F';
    };

    const handleResultPress = (result: any) => {
        if (profile?.role === 'teacher') {
            // Allow editing for both checked and unchecked results
            const fullQuiz = quizzes.find(quiz => quiz.id === result.quiz_id);

            const enrichedResult = {
                ...result,
                quizzes: {
                    ...result.quizzes,
                    ...fullQuiz
                }
            };

            // console.log('Opening marking modal for result:', enrichedResult);
            setSelectedResult(enrichedResult);
            setMarkingModalVisible(true);
        }
    };

    // UPDATED: Use the new advanced filtering function
    const filteredResults = getFilteredResults(selectedClass, selectedSubject, checkedFilter);

    // UPDATED: Get available subjects using the improved function
    const getAvailableSubjects = () => {
        // console.log('🎯 RESULTS TAB: Getting available subjects for class:', selectedClass);

        const availableSubjects = getSubjectsWithAll(selectedClass);

        // console.log('🎯 RESULTS TAB: Available subjects:', availableSubjects.map(s => s.name));

        return availableSubjects;
    };

    const renderResultCard = (result: any) => {
        const fullQuiz = quizzes.find(quiz => quiz.id === result.quiz_id);
        const subject = subjects.find(s => s.id === fullQuiz?.subject_id);

        const isAbsent = result.submission_status === 'absent';
        const isChecked = result.is_checked;

        return (
            <TouchableOpacity
                key={result.id}
                style={[
                    styles.resultCard,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    !isChecked && !isAbsent && { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' },
                    isAbsent && { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
                    profile?.role === 'teacher' && { opacity: 1 }, // Always clickable for teachers
                ]}
                onPress={() => handleResultPress(result)}
                disabled={profile?.role !== 'teacher'} // Only teachers can click
            >
                <View style={styles.resultHeader}>
                    <View style={styles.resultInfo}>
                        <Text style={[styles.resultTitle, { color: colors.text }]}>
                            {fullQuiz?.title || 'Unknown Quiz'}
                        </Text>
                        {selectedSubject === 'all' && (
                            <Text style={[styles.resultSubject, { color: colors.textSecondary }]}>
                                {subject?.name || 'Unknown Subject'}
                            </Text>
                        )}
                        {selectedClass === 'all' && (
                            <Text style={[styles.resultClass, { color: colors.textSecondary }]}>
                                {classes.find(c => c.id === fullQuiz?.class_id)?.name || 'Unknown Class'}
                            </Text>
                        )}
                        {profile?.role === 'teacher' && (
                            <Text style={[styles.studentName, { color: colors.textSecondary }]}>
                                {result.students?.full_name} ({result.students?.roll_number})
                            </Text>
                        )}
                    </View>
                    <View style={styles.resultStatus}>
                        {isAbsent ? (
                            <UserX size={20} color="#EF4444" />
                        ) : isChecked ? (
                            <CheckCircle size={20} color="#10B981" />
                        ) : (
                            <Circle size={20} color="#F59E0B" />
                        )}
                    </View>
                </View>

                {isAbsent ? (
                    <View style={styles.absentResult}>
                        <Text style={[styles.absentText, { color: '#EF4444' }]}>
                            Student was absent
                        </Text>
                        {result.remarks && (
                            <Text style={[styles.absentReason, { color: colors.textSecondary }]}>
                                Reason: {result.remarks}
                            </Text>
                        )}
                    </View>
                ) : isChecked && result.marks_obtained !== null ? (
                    <View style={styles.resultDetails}>
                        <View style={styles.resultDetail}>
                            <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Marks</Text>
                            <Text style={[styles.resultValue, { color: colors.text }]}>
                                {result.marks_obtained}/{result.total_marks}
                            </Text>
                        </View>
                        <View style={styles.resultDetail}>
                            <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Percentage</Text>
                            <Text style={[styles.resultValue, { color: colors.text }]}>
                                {result.percentage?.toFixed(1) || ((result.marks_obtained / result.total_marks) * 100).toFixed(1)}%
                            </Text>
                        </View>
                        <View style={styles.resultDetail}>
                            <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Grade</Text>
                            <View style={[styles.gradeContainer, { backgroundColor: getGradeColor(
                                result.grade || calculateGrade(result.percentage || ((result.marks_obtained / result.total_marks) * 100))
                            ) }]}>
                                <Text style={styles.gradeText}>
                                    {result.grade || calculateGrade(result.percentage || ((result.marks_obtained / result.total_marks) * 100))}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.pendingResult}>
                        <Text style={[styles.pendingText, { color: '#F59E0B' }]}>
                            {profile?.role === 'teacher' ? 'Tap to mark this quiz' : 'Pending evaluation'}
                        </Text>
                    </View>
                )}

                {/* Teacher edit hint for checked results */}
                {profile?.role === 'teacher' && isChecked && !isAbsent && (
                    <View style={[styles.editHintContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.editHintText, { color: colors.textSecondary }]}>
                            💡 Tap to edit marks
                        </Text>
                    </View>
                )}

                {result.remarks && isChecked && !isAbsent && (
                    <View style={[styles.remarksContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.remarksLabel, { color: colors.textSecondary }]}>Remarks:</Text>
                        <Text style={[styles.remarksText, { color: colors.text }]}>{result.remarks}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const availableSubjects = getAvailableSubjects();

    // console.log('🎯 RESULTS TAB RENDER:', {
    //     selectedClass,
    //     selectedSubject,
    //     checkedFilter,
    //     availableSubjectsCount: availableSubjects.length,
    //     availableSubjectNames: availableSubjects.map(s => s.name),
    //     filteredResultsCount: filteredResults.length,
    //     refreshKey
    // });

    return (
        <View style={styles.resultsContainer} key={refreshKey}>
            {/* Filter Summary */}
            {/* <View style={[styles.filterSummary, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text style={[styles.filterSummaryText, { color: colors.textSecondary }]}>
                    {selectedClass !== 'all' && `Class: ${classes.find(c => c.id === selectedClass)?.name || 'Unknown'}`}
                    {selectedClass !== 'all' && selectedSubject !== 'all' && ' • '}
                    {selectedSubject !== 'all' && `Subject: ${availableSubjects.find(s => s.id === selectedSubject)?.name || 'Unknown'}`}
                    {checkedFilter !== 'all' && ` • Status: ${checkedFilter.charAt(0).toUpperCase() + checkedFilter.slice(1)}`}
                    {selectedClass === 'all' && selectedSubject === 'all' && checkedFilter === 'all' && 'Showing all quiz results'}
                </Text>
                <Text style={[styles.resultCount, { color: colors.primary }]}>
                    {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </Text>
            </View> */}

            {/* Subject Filter */}
            <View style={styles.subjectFilter}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                    Select Subject {selectedClass !== 'all' && `(${classes.find(c => c.id === selectedClass)?.name || 'Unknown Class'})`}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.subjectButtons}>
                        {availableSubjects.map((subject) => (
                            <TouchableOpacity
                                key={`${subject.id}-${refreshKey}`}
                                style={[
                                    styles.subjectButton,
                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    selectedSubject === subject.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => {
                                    // console.log('🎯 Subject selected:', subject.name);
                                    setSelectedSubject(subject.id);
                                }}
                            >
                                <BookOpen size={16} color={selectedSubject === subject.id ? '#ffffff' : colors.text} />
                                <Text style={[
                                    styles.subjectButtonText,
                                    { color: colors.text },
                                    selectedSubject === subject.id && { color: '#ffffff' },
                                ]}>
                                    {subject.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Checked/Unchecked Filter */}
            {profile?.role === 'teacher' && (
                <View style={styles.checkedFilter}>
                    <Text style={[styles.filterLabel, { color: colors.text }]}>Evaluation Status</Text>
                    <View style={styles.filterButtons}>
                        {[
                            { key: 'all', label: 'All', icon: Circle },
                            { key: 'checked', label: 'Evaluated', icon: CheckCircle },
                            { key: 'unchecked', label: 'Pending', icon: Circle },
                        ].map((filter) => (
                            <TouchableOpacity
                                key={filter.key}
                                style={[
                                    styles.filterButton,
                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    checkedFilter === filter.key && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                                ]}
                                onPress={() => setCheckedFilter(filter.key as any)}
                            >
                                <filter.icon size={16} color={checkedFilter === filter.key ? '#274d71' : colors.text} />
                                <Text style={[
                                    styles.filterButtonText,
                                    { color: colors.text },
                                    checkedFilter === filter.key && { color: '#274d71' },
                                ]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Results List */}
            <ScrollView 
                style={styles.resultsList} 
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
                {filteredResults.length === 0 ? (
                    <View style={styles.emptyResults}>
                        <BookOpen size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.text }]}>No quiz results found</Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            {selectedClass !== 'all' && selectedSubject !== 'all'
                                ? `No ${checkedFilter === 'all' ? '' : checkedFilter + ' '}results found for the selected class and subject combination`
                                : selectedClass !== 'all'
                                    ? `No ${checkedFilter === 'all' ? '' : checkedFilter + ' '}results found for the selected class`
                                    : selectedSubject !== 'all'
                                        ? `No ${checkedFilter === 'all' ? '' : checkedFilter + ' '}results found for the selected subject`
                                        : checkedFilter !== 'all'
                                            ? `No ${checkedFilter} quiz results available`
                                            : 'No quiz results available'
                            }
                        </Text>
                        
                        {/* Helpful suggestions */}
                        <View style={[styles.suggestionsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.suggestionsTitle, { color: colors.text }]}>Try:</Text>
                            <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                                • Selecting "All Classes" or "All Subjects"
                            </Text>
                            <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                                • Checking if quizzes exist for this combination
                            </Text>
                            <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                                • Changing the evaluation status filter
                            </Text>
                        </View>
                    </View>
                ) : (
                    filteredResults.map(renderResultCard)
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    resultsContainer: {
        flex: 1,
    },
    filterSummary: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterSummaryText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    resultCount: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    subjectFilter: {
        marginBottom: 20,
    },
    filterLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    subjectButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    subjectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    subjectButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    checkedFilter: {
        marginBottom: 20,
    },
    filterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    filterButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    resultsList: {
        flex: 1,
    },
    resultCard: {
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
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    resultSubject: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    resultClass: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    studentName: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    resultStatus: {
        marginLeft: 12,
    },
    resultDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    resultDetail: {
        alignItems: 'center',
    },
    resultLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    gradeContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    gradeText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    pendingResult: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    pendingText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    absentResult: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    absentText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    absentReason: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    remarksContainer: {
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    remarksLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    remarksText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
    },
    emptyResults: {
        flex: 1,
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
        marginBottom: 20,
    },
    suggestionsContainer: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        alignSelf: 'stretch',
        marginHorizontal: 20,
    },
    suggestionsTitle: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    editHintContainer: {
        borderRadius: 6,
        padding: 8,
        marginTop: 8,
        alignItems: 'center',
    },
    editHintText: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
});

export default ResultsTab;