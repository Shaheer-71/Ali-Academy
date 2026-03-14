// components/ResultsTab.tsx - Fixed to prevent infinite loop
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, RefreshControl } from 'react-native';
import { BookOpen, CircleCheck as CheckCircle, Circle, UserX } from 'lucide-react-native';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';
import { handleFilterApplicationError } from '@/src/utils/errorHandler/quizErrorHandler';

interface ResultsTabProps {
    colors: any;
    profile: any;
    selectedClass: string;
    selectedSubject: string;
    setSelectedSubject: (subjectId: string) => void;
    checkedFilter: 'all' | 'checked' | 'unchecked';
    setCheckedFilter: (filter: 'all' | 'checked' | 'unchecked') => void;
    getSubjectsWithAll: (selectedClass?: string) => any[];
    getFilteredResults: () => any[]; // Updated to use function that returns filtered results
    setSelectedResult: (result: any) => void;
    setMarkingModalVisible: (visible: boolean) => void;
    quizzes: any[];
    quizResults: any[];
    subjects: any[];
    classes?: any[];
    onRefresh?: () => void;
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
    onRefresh,
}) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const previousClassRef = useRef<string>();
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
                // console.log('✅ Results tab refreshed successfully');
            } catch (error) {
                console.warn('❌ Error refreshing results:', error);
                showError(error);
            } finally {
                setRefreshing(false);
            }
        }
    };

    // Only reset subject when class actually changes (not on every render)
    useEffect(() => {
        if (previousClassRef.current !== undefined && previousClassRef.current !== selectedClass) {
            // console.log('🔄 ResultsTab: Class changed from', previousClassRef.current, 'to:', selectedClass);
            setRefreshKey(prev => prev + 1);
            setSelectedSubject('all');
        }
        previousClassRef.current = selectedClass;
    }, [selectedClass, setSelectedSubject]);

    // Separate effect for data changes that don't need subject reset
    useEffect(() => {
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
        if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
            const fullQuiz = quizzes.find(quiz => quiz.id === result.quiz_id);

            const enrichedResult = {
                ...result,
                quizzes: {
                    ...result.quizzes,
                    ...fullQuiz
                }
            };

            setSelectedResult(enrichedResult);
            setMarkingModalVisible(true);
        }
    };

    // Use the centralized filtering function
    let filteredResults: any[] = [];
    try {
        filteredResults = getFilteredResults();
    } catch (error) {
        console.warn('❌ Error filtering results:', error);
        showError(error, handleFilterApplicationError);
    }

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
                    (profile?.role === 'teacher' || profile?.role === 'admin') && { opacity: 1 },
                ]}
                onPress={() => handleResultPress(result)}
                disabled={profile?.role !== 'teacher'}
            >
                <View style={styles.resultHeader}>
                    <View style={styles.resultInfo}>
                        <Text allowFontScaling={false} style={[styles.resultTitle, { color: colors.text }]}>
                            {fullQuiz?.title || 'Unknown Quiz'}
                        </Text>
                        {selectedSubject === 'all' && (
                            <Text allowFontScaling={false} style={[styles.resultSubject, { color: colors.textSecondary }]}>
                                {subject?.name || 'Unknown Subject'}
                            </Text>
                        )}
                        {selectedClass === 'all' && (
                            <Text allowFontScaling={false} style={[styles.resultClass, { color: colors.textSecondary }]}>
                                {classes.find(c => c.id === fullQuiz?.class_id)?.name || 'Unknown Class'}
                            </Text>
                        )}
                        {(profile?.role === 'teacher' || profile?.role === 'admin') && (
                            <Text allowFontScaling={false} style={[styles.studentName, { color: colors.textSecondary }]}>
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
                        <Text allowFontScaling={false} style={[styles.absentText, { color: '#EF4444' }]}>
                            Student was absent
                        </Text>
                        {result.remarks && (
                            <Text allowFontScaling={false} style={[styles.absentReason, { color: colors.textSecondary }]}>
                                Reason: {result.remarks}
                            </Text>
                        )}
                    </View>
                ) : isChecked && result.marks_obtained !== null ? (
                    <View style={styles.resultDetails}>
                        <View style={styles.resultDetail}>
                            <Text allowFontScaling={false} style={[styles.resultLabel, { color: colors.textSecondary }]}>Marks</Text>
                            <Text allowFontScaling={false} style={[styles.resultValue, { color: colors.text }]}>
                                {result.marks_obtained}/{result.total_marks}
                            </Text>
                        </View>
                        <View style={styles.resultDetail}>
                            <Text allowFontScaling={false} style={[styles.resultLabel, { color: colors.textSecondary }]}>Percentage</Text>
                            <Text allowFontScaling={false} style={[styles.resultValue, { color: colors.text }]}>
                                {result.percentage?.toFixed(1) || ((result.marks_obtained / result.total_marks) * 100).toFixed(1)}%
                            </Text>
                        </View>
                        <View style={styles.resultDetail}>
                            <Text allowFontScaling={false} style={[styles.resultLabel, { color: colors.textSecondary }]}>Grade</Text>
                            <View style={[styles.gradeContainer, {
                                backgroundColor: getGradeColor(
                                    result.grade || calculateGrade(result.percentage || ((result.marks_obtained / result.total_marks) * 100))
                                )
                            }]}>
                                <Text allowFontScaling={false} style={styles.gradeText}>
                                    {result.grade || calculateGrade(result.percentage || ((result.marks_obtained / result.total_marks) * 100))}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.pendingResult}>
                        <Text allowFontScaling={false} style={[styles.pendingText, { color: '#F59E0B' }]}>
                            {(profile?.role === 'teacher' || profile?.role === 'admin') ? 'Tap to mark this quiz' : 'Pending evaluation'}
                        </Text>
                    </View>
                )}

                {/* Teacher edit hint for checked results */}
                {(profile?.role === 'teacher' || profile?.role === 'admin') && isChecked && !isAbsent && (
                    <View style={[styles.editHintContainer, { backgroundColor: colors.background }]}>
                        <Text allowFontScaling={false} style={[styles.editHintText, { color: colors.textSecondary }]}>
                            💡 Tap to edit marks
                        </Text>
                    </View>
                )}

                {result.remarks && isChecked && !isAbsent && (
                    <View style={[styles.remarksContainer, { backgroundColor: colors.background }]}>
                        <Text allowFontScaling={false} style={[styles.remarksLabel, { color: colors.textSecondary }]}>Remarks:</Text>
                        <Text allowFontScaling={false} style={[styles.remarksText, { color: colors.text }]}>{result.remarks}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Get current filter summary for display
    const getFilterSummary = () => {
        const items = [];

        if (selectedClass !== 'all') {
            items.push(`Class: ${classes.find(c => c.id === selectedClass)?.name || 'Unknown'}`);
        }

        if (selectedSubject !== 'all') {
            const availableSubjects = getSubjectsWithAll(selectedClass);
            items.push(`Subject: ${availableSubjects.find(s => s.id === selectedSubject)?.name || 'Unknown'}`);
        }

        if (checkedFilter !== 'all') {
            items.push(`Status: ${checkedFilter.charAt(0).toUpperCase() + checkedFilter.slice(1)}`);
        }

        return items.join(' • ') || 'Showing all quiz results';
    };

    return (
        <View style={styles.resultsContainer} key={refreshKey}>
            {/* Filter Summary Banner */}
            <View style={[styles.filterSummary, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text allowFontScaling={false} style={[styles.filterSummaryText, { color: colors.textSecondary }]}>
                    {getFilterSummary()}
                </Text>
                <Text allowFontScaling={false} style={[styles.resultCount, { color: colors.primary }]}>
                    {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </Text>
            </View>

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

                <ErrorModal
                    visible={errorModal.visible}
                    title={errorModal.title}
                    message={errorModal.message}
                    onClose={() => setErrorModal({ ...errorModal, visible: false })}
                />

                {filteredResults.length === 0 ? (
                    <View style={styles.emptyResults}>
                        <BookOpen size={48} color={colors.textSecondary} />
                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>No quiz results found</Text>
                        <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            No results match your current filters. Use the Filter button to adjust your search criteria.
                        </Text>

                        {/* Helpful suggestions */}
                        <View style={[styles.suggestionsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[styles.suggestionsTitle, { color: colors.text }]}>Try:</Text>
                            <Text allowFontScaling={false} style={[styles.suggestionText, { color: colors.textSecondary }]}>
                                • Using the Filter button to adjust class/subject selection
                            </Text>
                            <Text allowFontScaling={false} style={[styles.suggestionText, { color: colors.textSecondary }]}>
                                • Selecting "All Classes" or "All Subjects"
                            </Text>
                            <Text allowFontScaling={false} style={[styles.suggestionText, { color: colors.textSecondary }]}>
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

import { TextSizes } from '@/src/styles/TextSizes'; // <--- import TextSizes

const styles = StyleSheet.create({
    resultCard: {
        borderRadius: 12,
        padding: 16,
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
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    resultSubject: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginBottom: 2,
    },
    studentName: {
        fontSize: TextSizes.medium,
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
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    resultValue: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
    gradeContainer: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    gradeText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
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
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    resultCount: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
    resultsList: {
        flex: 1,
    },
    // resultCard: {
    //     borderRadius: 16,
    //     padding: 20,
    //     marginBottom: 12,
    //     borderWidth: 1,
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.05,
    //     shadowRadius: 4,
    //     elevation: 2,
    // },
    // resultHeader: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    //     alignItems: 'center',
    //     marginBottom: 12,
    // },
    // resultInfo: {
    //     flex: 1,
    // },
    // resultTitle: {
    //     fontSize: TextSizes.large,
    //     fontFamily: 'Inter-SemiBold',
    //     marginBottom: 4,
    // },
    // resultSubject: {
    //     fontSize: TextSizes.small,
    //     fontFamily: 'Inter-Regular',
    //     marginBottom: 2,
    // },
    // resultClass: {
    //     fontSize: TextSizes.small,
    //     fontFamily: 'Inter-Regular',
    //     marginBottom: 2,
    // },
    // studentName: {
    //     fontSize: TextSizes.medium,
    //     fontFamily: 'Inter-Regular',
    // },
    // resultStatus: {
    //     marginLeft: 12,
    // },
    // resultDetails: {
    //     flexDirection: 'row',
    //     justifyContent: 'space-between',
    //     marginBottom: 12,
    // },
    // resultDetail: {
    //     alignItems: 'center',
    // },
    // resultLabel: {
    //     fontSize: TextSizes.small,
    //     fontFamily: 'Inter-Regular',
    //     marginBottom: 4,
    // },
    // resultValue: {
    //     fontSize: TextSizes.medium,
    //     fontFamily: 'Inter-SemiBold',
    // },
    // gradeContainer: {
    //     paddingHorizontal: 12,
    //     paddingVertical: 6,
    //     borderRadius: 8,
    //     alignItems: 'center',
    // },
    // gradeText: {
    //     fontSize: TextSizes.medium,
    //     fontFamily: 'Inter-SemiBold',
    //     color: '#ffffff',
    // },
    pendingResult: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    pendingText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Medium',
    },
    absentResult: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    absentText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    absentReason: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    remarksContainer: {
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    remarksLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    remarksText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        lineHeight: TextSizes.medium + 4,
    },
    emptyResults: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: TextSizes.medium,
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
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    suggestionText: {
        fontSize: TextSizes.small,
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
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        fontStyle: 'italic',
    },
});


// const styles = StyleSheet.create({
//     resultsContainer: {
//         flex: 1,
//     },
//     filterSummary: {
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 16,
//         borderWidth: 1,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     filterSummaryText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         flex: 1,
//     },
//     resultCount: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//     },
//     resultsList: {
//         flex: 1,
//     },
//     resultCard: {
//         borderRadius: 16,
//         padding: 20,
//         marginBottom: 12,
//         borderWidth: 1,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     resultHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     resultInfo: {
//         flex: 1,
//     },
//     resultTitle: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 4,
//     },
//     resultSubject: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         marginBottom: 2,
//     },
//     resultClass: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         marginBottom: 2,
//     },
//     studentName: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//     },
//     resultStatus: {
//         marginLeft: 12,
//     },
//     resultDetails: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginBottom: 12,
//     },
//     resultDetail: {
//         alignItems: 'center',
//     },
//     resultLabel: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         marginBottom: 4,
//     },
//     resultValue: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//     },
//     gradeContainer: {
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 8,
//         alignItems: 'center',
//     },
//     gradeText: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//         color: '#ffffff',
//     },
//     pendingResult: {
//         alignItems: 'center',
//         paddingVertical: 12,
//     },
//     pendingText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//     },
//     absentResult: {
//         alignItems: 'center',
//         paddingVertical: 12,
//     },
//     absentText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//         marginBottom: 4,
//     },
//     absentReason: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//     },
//     remarksContainer: {
//         borderRadius: 8,
//         padding: 12,
//         marginTop: 8,
//     },
//     remarksLabel: {
//         fontSize: 12,
//         fontFamily: 'Inter-Medium',
//         marginBottom: 4,
//     },
//     remarksText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         lineHeight: 18,
//     },
//     emptyResults: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//     },
//     emptyText: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//         marginTop: 16,
//         marginBottom: 8,
//     },
//     emptySubtext: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//         paddingHorizontal: 20,
//         marginBottom: 20,
//     },
//     suggestionsContainer: {
//         borderRadius: 12,
//         padding: 16,
//         borderWidth: 1,
//         alignSelf: 'stretch',
//         marginHorizontal: 20,
//     },
//     suggestionsTitle: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 8,
//     },
//     suggestionText: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//         marginBottom: 4,
//     },
//     editHintContainer: {
//         borderRadius: 6,
//         padding: 8,
//         marginTop: 8,
//         alignItems: 'center',
//     },
//     editHintText: {
//         fontSize: 11,
//         fontFamily: 'Inter-Regular',
//         fontStyle: 'italic',
//     },
// });

export default ResultsTab;