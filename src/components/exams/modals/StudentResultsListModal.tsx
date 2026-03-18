import React, { useMemo } from 'react';
import {
    Modal, View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { X, Award, BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.78;

interface StudentResultsListModalProps {
    visible: boolean;
    colors: any;
    quizResults: any[];
    onClose: () => void;
    onViewResult: (result: any) => void;
}

const calculateGrade = (pct: number): string => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C+';
    if (pct >= 40) return 'C';
    return 'F';
};

const gradeColor = (grade: string): string => {
    switch (grade) {
        case 'A+': return '#059669';
        case 'A':  return '#10B981';
        case 'B+': return '#3B82F6';
        case 'B':  return '#60A5FA';
        case 'C+': return '#F59E0B';
        case 'C':  return '#FBBF24';
        default:   return '#EF4444';
    }
};

const StudentResultsListModal: React.FC<StudentResultsListModalProps> = ({
    visible, colors, quizResults, onClose, onViewResult,
}) => {
    const { bottom: bottomInset } = useSafeAreaInsets();

    const { checked, pending } = useMemo(() => {
        const checked = quizResults.filter(r => r.is_checked);
        const pending = quizResults.filter(r => !r.is_checked);
        return { checked, pending };
    }, [quizResults]);

    const renderResultRow = (result: any) => {
        const isAbsent = result.submission_status === 'absent';
        const totalMarks = result.total_marks ?? result.quizzes?.total_marks ?? 100;
        const passingMarks = result.quizzes?.passing_marks ?? null;
        const marks = result.marks_obtained ?? 0;
        const pct = !isAbsent && totalMarks > 0 ? Math.round((marks / totalMarks) * 100) : null;
        const grade = pct != null ? calculateGrade(pct) : null;
        const passed = !isAbsent && pct != null && (passingMarks != null ? marks >= passingMarks : pct >= 40);
        const gColor = isAbsent ? '#EF4444' : grade ? gradeColor(grade) : colors.textSecondary;

        return (
            <TouchableOpacity
                key={result.id}
                style={[s.row, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => onViewResult(result)}
                activeOpacity={0.7}
            >
                {/* Grade pill */}
                <View style={[s.gradeBox, { backgroundColor: gColor + '20' }]}>
                    <Text allowFontScaling={false} style={[s.gradeText, { color: gColor }]}>
                        {isAbsent ? 'AB' : (grade ?? '—')}
                    </Text>
                </View>

                {/* Quiz info */}
                <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={[s.quizTitle, { color: colors.text }]} numberOfLines={1}>
                        {result.quizzes?.title || 'Quiz'}
                    </Text>
                    <View style={s.metaRow}>
                        {result.quizzes?.subjects?.name && (
                            <View style={s.metaItem}>
                                <BookOpen size={11} color={colors.textSecondary} />
                                <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                                    {result.quizzes.subjects.name}
                                </Text>
                            </View>
                        )}
                        {result.quizzes?.scheduled_date && (
                            <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                                {result.quizzes.scheduled_date}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Score + status */}
                <View style={s.scoreBox}>
                    {isAbsent ? (
                        <Text allowFontScaling={false} style={[s.scoreText, { color: '#EF4444' }]}>Absent</Text>
                    ) : (
                        <>
                            <Text allowFontScaling={false} style={[s.scoreText, { color: colors.text }]}>
                                {marks}/{totalMarks}
                            </Text>
                            <View style={s.pfRow}>
                                {passed
                                    ? <CheckCircle size={12} color="#10B981" />
                                    : <XCircle size={12} color="#EF4444" />}
                                <Text allowFontScaling={false} style={[s.pfText, { color: passed ? '#10B981' : '#EF4444' }]}>
                                    {passed ? 'Pass' : 'Fail'}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderPendingRow = (result: any) => (
        <View
            key={result.id}
            style={[s.row, { backgroundColor: colors.cardBackground, borderColor: colors.border, opacity: 0.6 }]}
        >
            <View style={[s.gradeBox, { backgroundColor: colors.border + '40' }]}>
                <Clock size={16} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={[s.quizTitle, { color: colors.text }]} numberOfLines={1}>
                    {result.quizzes?.title || 'Quiz'}
                </Text>
                {result.quizzes?.subjects?.name && (
                    <View style={s.metaItem}>
                        <BookOpen size={11} color={colors.textSecondary} />
                        <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                            {result.quizzes.subjects.name}
                        </Text>
                    </View>
                )}
            </View>
            <Text allowFontScaling={false} style={[s.pendingText, { color: colors.textSecondary }]}>
                Pending
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            presentationStyle="overFullScreen"
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={s.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={[s.sheet, { backgroundColor: colors.background, height: SHEET_HEIGHT, paddingBottom: bottomInset }]}>

                            {/* Header */}
                            <View style={[s.header, { borderBottomColor: colors.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text allowFontScaling={false} style={[s.headerTitle, { color: colors.text }]}>
                                        My Results
                                    </Text>
                                    <Text allowFontScaling={false} style={[s.headerSub, { color: colors.textSecondary }]}>
                                        {checked.length} marked · {pending.length} pending
                                    </Text>
                                </View>
                                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                                    <X size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                                showsVerticalScrollIndicator={false}
                            >
                                {quizResults.length === 0 ? (
                                    <View style={s.emptyState}>
                                        <Award size={40} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[s.emptyTitle, { color: colors.text }]}>No quizzes yet</Text>
                                        <Text allowFontScaling={false} style={[s.emptySub, { color: colors.textSecondary }]}>
                                            Your quiz results will appear here once they are marked
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        {checked.length > 0 && (
                                            <>
                                                <Text allowFontScaling={false} style={[s.sectionLabel, { color: colors.textSecondary }]}>
                                                    MARKED RESULTS
                                                </Text>
                                                {checked.map(renderResultRow)}
                                            </>
                                        )}
                                        {pending.length > 0 && (
                                            <>
                                                <Text allowFontScaling={false} style={[s.sectionLabel, { color: colors.textSecondary, marginTop: checked.length > 0 ? 16 : 0 }]}>
                                                    AWAITING MARKS
                                                </Text>
                                                {pending.map(renderPendingRow)}
                                            </>
                                        )}
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
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
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
        borderBottomWidth: 1, gap: 12,
    },
    headerTitle: { fontSize: TextSizes.modalTitle, fontFamily: 'Inter-SemiBold' },
    headerSub: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginTop: 2 },
    closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

    sectionLabel: {
        fontSize: TextSizes.small, fontFamily: 'Inter-Medium',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
    },

    row: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, borderWidth: 1,
        padding: 12, marginBottom: 8, gap: 12,
    },
    gradeBox: {
        width: 44, height: 44, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    gradeText: { fontSize: TextSizes.large, fontFamily: 'Inter-SemiBold' },

    quizTitle: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold', marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },

    scoreBox: { alignItems: 'flex-end', minWidth: 56 },
    scoreText: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold', marginBottom: 2 },
    pfRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    pfText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium' },

    pendingText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', fontStyle: 'italic' },

    emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
    emptyTitle: { fontSize: TextSizes.large, fontFamily: 'Inter-SemiBold', marginTop: 8 },
    emptySub: { fontSize: TextSizes.normal, fontFamily: 'Inter-Regular', textAlign: 'center', paddingHorizontal: 32 },
});

export default StudentResultsListModal;
