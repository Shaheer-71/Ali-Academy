import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
    Modal, View, Text, FlatList, TouchableOpacity, TouchableWithoutFeedback,
    StyleSheet, Dimensions, Platform, ActivityIndicator, InteractionManager,
} from 'react-native';
import { X, ChevronLeft, PenLine, BookOpen, Award } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.60;

interface BulkResultsModalProps {
    colors: any;
    visible: boolean;
    onClose: () => void;
    quizzes: any[];
    quizResults: any[];
    classes: any[];
    subjects: any[];
}

const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
};

const gradeColor = (grade: string): string => {
    switch (grade) {
        case 'A+': return '#10B981';
        case 'A':  return '#059669';
        case 'B+': return '#3B82F6';
        case 'B':  return '#6366F1';
        case 'C+': return '#F59E0B';
        case 'C':  return '#EF4444';
        default:   return '#DC2626';
    }
};

// ── Memoized result card ─────────────────────────────────────────────────────
interface ResultCardProps {
    result: any;
    totalMarks: number;
    passingMarks: number;
    colors: any;
}

const ResultCard = memo<ResultCardProps>(({ result, totalMarks, passingMarks, colors }) => {
    const isAbsent = result.submission_status === 'absent';
    const pct = result.percentage ?? (result.marks_obtained != null ? (result.marks_obtained / totalMarks) * 100 : null);
    const grade = pct != null ? calculateGrade(pct) : null;
    const passed = result.marks_obtained != null && result.marks_obtained >= passingMarks;

    return (
        <View
            style={[
                rc.resultCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                isAbsent && { borderColor: '#EF444440' },
                !isAbsent && passed && { borderColor: '#10B98130' },
                !isAbsent && !passed && pct != null && { borderColor: '#EF444430' },
            ]}
        >
            <View style={rc.resultStudentRow}>
                <View style={[rc.studentAvatar, { backgroundColor: isAbsent ? '#EF444420' : colors.primary + '20' }]}>
                    <Text allowFontScaling={false} style={[rc.studentAvatarText, { color: isAbsent ? '#EF4444' : colors.primary }]}>
                        {result.students?.full_name?.charAt(0) || '?'}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={[rc.studentName, { color: colors.text }]}>
                        {result.students?.full_name || 'Unknown'}
                    </Text>
                    <Text allowFontScaling={false} style={[rc.studentRoll, { color: colors.textSecondary }]}>
                        {result.students?.roll_number || '—'}
                    </Text>
                </View>
                {isAbsent ? (
                    <View style={rc.absentTag}>
                        <Text allowFontScaling={false} style={rc.absentTagText}>Absent</Text>
                    </View>
                ) : grade ? (
                    <View style={[rc.gradePill, { backgroundColor: gradeColor(grade) }]}>
                        <Text allowFontScaling={false} style={rc.gradePillText}>{grade}</Text>
                    </View>
                ) : null}
            </View>

            {!isAbsent && result.marks_obtained != null && (
                <View style={[rc.marksDetail, { borderTopColor: colors.border }]}>
                    <View style={rc.marksDetailItem}>
                        <Text allowFontScaling={false} style={[rc.marksDetailLabel, { color: colors.textSecondary }]}>Marks</Text>
                        <Text allowFontScaling={false} style={[rc.marksDetailValue, { color: colors.text }]}>
                            {result.marks_obtained}/{totalMarks}
                        </Text>
                    </View>
                    <View style={rc.marksDetailItem}>
                        <Text allowFontScaling={false} style={[rc.marksDetailLabel, { color: colors.textSecondary }]}>Percentage</Text>
                        <Text allowFontScaling={false} style={[rc.marksDetailValue, { color: colors.text }]}>
                            {pct?.toFixed(1)}%
                        </Text>
                    </View>
                    <View style={rc.marksDetailItem}>
                        <Text allowFontScaling={false} style={[rc.marksDetailLabel, { color: colors.textSecondary }]}>Status</Text>
                        <Text allowFontScaling={false} style={[rc.marksDetailValue, { color: passed ? '#10B981' : '#EF4444' }]}>
                            {passed ? 'Pass' : 'Fail'}
                        </Text>
                    </View>
                </View>
            )}

            {!!result.remarks && (
                <Text allowFontScaling={false} style={[rc.remarks, { color: colors.textSecondary, borderTopColor: colors.border }]}>
                    Remarks: {result.remarks}
                </Text>
            )}
        </View>
    );
});

// ── Memoized quiz row ────────────────────────────────────────────────────────
interface QuizRowProps {
    quiz: any;
    markedCount: number;
    totalCount: number;
    avg: number | null;
    passCount: number;
    className?: string;
    subjectName?: string;
    colors: any;
    onPress: (quiz: any) => void;
}

const QuizResultRow = memo<QuizRowProps>(({ quiz, markedCount, totalCount, avg, passCount, className, subjectName, colors, onPress }) => (
    <TouchableOpacity
        style={[s.quizRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        onPress={() => onPress(quiz)}
    >
        <View style={[s.quizIconBox, { backgroundColor: colors.primary + '20' }]}>
            <PenLine size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={[s.quizRowTitle, { color: colors.text }]} numberOfLines={1}>
                {quiz.title}
            </Text>
            <View style={s.quizRowMeta}>
                {className && (
                    <View style={s.metaChip}>
                        <BookOpen size={11} color={colors.textSecondary} />
                        <Text allowFontScaling={false} style={[s.metaChipText, { color: colors.textSecondary }]}>{className}</Text>
                    </View>
                )}
                {subjectName && (
                    <Text allowFontScaling={false} style={[s.metaChipText, { color: colors.textSecondary }]}>{subjectName}</Text>
                )}
            </View>
            <View style={s.statsRow}>
                <Text allowFontScaling={false} style={[s.statText, { color: colors.textSecondary }]}>
                    {markedCount}/{totalCount} marked
                </Text>
                {avg != null && (
                    <Text allowFontScaling={false} style={[s.statText, { color: colors.textSecondary }]}>
                        • Avg {avg.toFixed(1)}%
                    </Text>
                )}
                <Text allowFontScaling={false} style={[s.statText, { color: '#10B981' }]}>
                    • {passCount} passed
                </Text>
            </View>
        </View>
        {avg != null && (
            <View style={[s.gradeBadge, { backgroundColor: gradeColor(calculateGrade(avg)) }]}>
                <Text allowFontScaling={false} style={s.gradeBadgeText}>
                    {calculateGrade(avg)}
                </Text>
            </View>
        )}
    </TouchableOpacity>
));

// ── Main modal ───────────────────────────────────────────────────────────────
const BulkResultsModal: React.FC<BulkResultsModalProps> = ({
    colors, visible, onClose, quizzes, quizResults, classes, subjects,
}) => {
    const { bottom: bottomInset } = useSafeAreaInsets();
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        if (!visible) { setSelectedQuiz(null); setTransitioning(false); }
    }, [visible]);

    const quizStats = useMemo(() => {
        const stats: Record<string, { markedCount: number; totalCount: number; avg: number | null; passCount: number; absentCount: number; results: any[]; className?: string; subjectName?: string }> = {};
        for (const quiz of quizzes) {
            const allResults = quizResults.filter(r => r.quiz_id === quiz.id);
            const marked = allResults.filter(r => r.is_checked);
            const nonAbsent = marked.filter(r => r.submission_status !== 'absent' && r.marks_obtained != null);
            const avg = nonAbsent.length > 0
                ? nonAbsent.reduce((sum, r) => sum + (r.percentage ?? (r.marks_obtained / r.total_marks) * 100), 0) / nonAbsent.length
                : null;
            const passCount = nonAbsent.filter(r => r.marks_obtained >= quiz.passing_marks).length;
            const absentCount = marked.filter(r => r.submission_status === 'absent').length;
            stats[quiz.id] = {
                markedCount: marked.length, totalCount: allResults.length,
                avg, passCount, absentCount, results: marked,
                className: classes.find(c => c.id === quiz.class_id)?.name,
                subjectName: subjects.find(s => s.id === quiz.subject_id)?.name,
            };
        }
        return stats;
    }, [quizzes, quizResults, classes, subjects]);

    const quizzesWithResults = useMemo(() =>
        quizzes.filter(q => (quizStats[q.id]?.markedCount ?? 0) > 0),
        [quizzes, quizStats]
    );

    const selectedQuizResults = useMemo(() =>
        selectedQuiz ? quizStats[selectedQuiz.id]?.results ?? [] : [],
        [selectedQuiz, quizStats]
    );

    const keyExtractor = useCallback((item: any) => item.id, []);

    // ── FlatList render functions ────────────────────────────────────────────
    const handleSelectQuiz = useCallback((quiz: any) => {
        setTransitioning(true);
        InteractionManager.runAfterInteractions(() => {
            setSelectedQuiz(quiz);
            setTransitioning(false);
        });
    }, []);

    const renderQuizItem = useCallback(({ item: quiz }: { item: any }) => {
        const stat = quizStats[quiz.id] ?? { markedCount: 0, totalCount: 0, avg: null, passCount: 0 };
        return (
            <QuizResultRow
                quiz={quiz}
                markedCount={stat.markedCount}
                totalCount={stat.totalCount}
                avg={stat.avg}
                passCount={stat.passCount}
                className={stat.className}
                subjectName={stat.subjectName}
                colors={colors}
                onPress={handleSelectQuiz}
            />
        );
    }, [quizStats, colors, handleSelectQuiz]);

    const renderResultItem = useCallback(({ item: result }: { item: any }) => (
        <ResultCard
            result={result}
            totalMarks={selectedQuiz?.total_marks}
            passingMarks={selectedQuiz?.passing_marks}
            colors={colors}
        />
    ), [selectedQuiz, colors]);

    // ── Summary bar (ListHeaderComponent for results detail) ─────────────────
    const summaryHeader = useMemo(() => {
        if (!selectedQuiz) return null;
        const { avg, passCount, absentCount } = quizStats[selectedQuiz.id] ?? { avg: null, passCount: 0, absentCount: 0 };
        return (
            <View style={[s.summaryBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={s.summaryItem}>
                    <Text allowFontScaling={false} style={[s.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
                    <Text allowFontScaling={false} style={[s.summaryValue, { color: colors.text }]}>{selectedQuiz.total_marks}</Text>
                </View>
                <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
                <View style={s.summaryItem}>
                    <Text allowFontScaling={false} style={[s.summaryLabel, { color: colors.textSecondary }]}>Pass</Text>
                    <Text allowFontScaling={false} style={[s.summaryValue, { color: '#10B981' }]}>{selectedQuiz.passing_marks}+</Text>
                </View>
                <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
                {avg != null && (
                    <>
                        <View style={s.summaryItem}>
                            <Text allowFontScaling={false} style={[s.summaryLabel, { color: colors.textSecondary }]}>Avg</Text>
                            <Text allowFontScaling={false} style={[s.summaryValue, { color: colors.primary }]}>{avg.toFixed(1)}%</Text>
                        </View>
                        <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
                    </>
                )}
                <View style={s.summaryItem}>
                    <Text allowFontScaling={false} style={[s.summaryLabel, { color: colors.textSecondary }]}>Passed</Text>
                    <Text allowFontScaling={false} style={[s.summaryValue, { color: '#10B981' }]}>{passCount}</Text>
                </View>
                {absentCount > 0 && (
                    <>
                        <View style={[s.summaryDivider, { backgroundColor: colors.border }]} />
                        <View style={s.summaryItem}>
                            <Text allowFontScaling={false} style={[s.summaryLabel, { color: colors.textSecondary }]}>Absent</Text>
                            <Text allowFontScaling={false} style={[s.summaryValue, { color: '#EF4444' }]}>{absentCount}</Text>
                        </View>
                    </>
                )}
            </View>
        );
    }, [selectedQuiz, quizStats, colors]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            presentationStyle="overFullScreen"
        >
            <View style={s.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={s.dismissArea} />
                </TouchableWithoutFeedback>

                <View style={[s.sheet, { backgroundColor: colors.background, height: SHEET_HEIGHT, paddingBottom: bottomInset }]}>
                    {/* Header */}
                    <View style={[s.header, { borderBottomColor: colors.border }]}>
                        {selectedQuiz ? (
                            <TouchableOpacity style={s.iconBtn} onPress={() => setSelectedQuiz(null)}>
                                <ChevronLeft size={22} color={colors.text} />
                            </TouchableOpacity>
                        ) : (
                            <View style={s.iconBtn} />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text allowFontScaling={false} style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
                                {selectedQuiz ? selectedQuiz.title : 'Results'}
                            </Text>
                            {!selectedQuiz && (
                                <Text allowFontScaling={false} style={[s.headerSubtitle, { color: colors.textSecondary }]}>
                                    Tap a quiz to view student results
                                </Text>
                            )}
                            {selectedQuiz && (
                                <Text allowFontScaling={false} style={[s.headerSubtitle, { color: colors.textSecondary }]}>
                                    {quizStats[selectedQuiz.id]?.className ?? ''}
                                    {quizStats[selectedQuiz.id]?.subjectName ? ` · ${quizStats[selectedQuiz.id].subjectName}` : ''}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity style={s.iconBtn} onPress={onClose}>
                            <X size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {transitioning ? (
                        <View style={s.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : selectedQuiz ? (
                        <FlatList
                            data={selectedQuizResults}
                            keyExtractor={keyExtractor}
                            renderItem={renderResultItem}
                            ListHeaderComponent={summaryHeader}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={Platform.OS === 'android'}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            initialNumToRender={8}
                        />
                    ) : (
                        <FlatList
                            data={quizzesWithResults}
                            keyExtractor={keyExtractor}
                            renderItem={renderQuizItem}
                            contentContainerStyle={quizzesWithResults.length === 0 ? s.emptyContainer : { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                            removeClippedSubviews={Platform.OS === 'android'}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            ListEmptyComponent={
                                <View style={s.emptyState}>
                                    <Award size={40} color={colors.textSecondary} />
                                    <Text allowFontScaling={false} style={[s.emptyTitle, { color: colors.text }]}>No results yet</Text>
                                    <Text allowFontScaling={false} style={[s.emptySubtitle, { color: colors.textSecondary }]}>
                                        Mark quizzes first to see results here
                                    </Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
        borderBottomWidth: 1, gap: 8,
    },
    dismissArea: { flex: 1 },
    iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: TextSizes.modalTitle, fontFamily: 'Inter-SemiBold' },
    headerSubtitle: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginTop: 2 },

    emptyContainer: { flex: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: TextSizes.large, fontFamily: 'Inter-SemiBold', marginTop: 16 },
    emptySubtitle: { fontSize: TextSizes.normal, fontFamily: 'Inter-Regular', textAlign: 'center', paddingHorizontal: 32, marginTop: 8 },

    quizRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12,
    },
    quizIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    quizRowTitle: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold', marginBottom: 4 },
    quizRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaChipText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },
    gradeBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    gradeBadgeText: { color: '#ffffff', fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },

    summaryBar: {
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
        marginBottom: 12, borderRadius: 10, borderWidth: 1, paddingVertical: 10,
    },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryLabel: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginBottom: 2 },
    summaryValue: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold' },
    summaryDivider: { width: 1, height: 28 },
});

const rc = StyleSheet.create({
    resultCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
    resultStudentRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    studentAvatarText: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold' },
    studentName: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold' },
    studentRoll: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginTop: 1 },
    absentTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#EF444415' },
    absentTagText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium', color: '#EF4444' },
    gradePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    gradePillText: { color: '#ffffff', fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
    marksDetail: {
        flexDirection: 'row', justifyContent: 'space-around',
        paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: StyleSheet.hairlineWidth,
    },
    marksDetailItem: { alignItems: 'center' },
    marksDetailLabel: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginBottom: 2 },
    marksDetailValue: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
    remarks: {
        fontSize: TextSizes.small, fontFamily: 'Inter-Regular', fontStyle: 'italic',
        paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth,
    },
});

export default BulkResultsModal;
