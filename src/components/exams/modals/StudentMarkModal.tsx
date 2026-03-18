import React from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet,
    TouchableWithoutFeedback, Dimensions, ScrollView,
} from 'react-native';
import { X, CheckCircle, XCircle } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.65;

interface StudentMarkModalProps {
    visible: boolean;
    result: any;
    colors: any;
    onClose: () => void;
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

const StudentMarkModal: React.FC<StudentMarkModalProps> = ({ visible, result, colors, onClose }) => {
    const { bottom: bottomInset } = useSafeAreaInsets();

    if (!result) return null;

    const isAbsent = result.submission_status === 'absent';
    const marksObtained = result.marks_obtained ?? 0;
    const totalMarks = result.total_marks ?? result.quizzes?.total_marks ?? 100;
    const passingMarks = result.quizzes?.passing_marks ?? null;
    const pct = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
    const grade = isAbsent ? '—' : calculateGrade(pct);
    const passed = !isAbsent && (passingMarks != null ? marksObtained >= passingMarks : pct >= 40);
    const gColor = isAbsent ? colors.textSecondary : gradeColor(grade);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            presentationStyle="overFullScreen"
        >
            <View style={s.root}>
                {/* Tappable backdrop */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={s.backdrop} />
                </TouchableWithoutFeedback>

                {/* Sheet */}
                <View style={[s.sheet, { backgroundColor: colors.background, paddingBottom: bottomInset }]}>
                    {/* Header */}
                    <View style={[s.header, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                            <Text allowFontScaling={false} style={[s.title, { color: colors.text }]} numberOfLines={2}>
                                {result.quizzes?.title || 'Quiz Result'}
                            </Text>
                            {result.quizzes?.subjects?.name && (
                                <Text allowFontScaling={false} style={[s.subtitle, { color: colors.textSecondary }]}>
                                    {result.quizzes.subjects.name}
                                </Text>
                            )}
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
                        {isAbsent ? (
                            <View style={[s.absentCard, { backgroundColor: '#EF444415', borderColor: '#EF444440' }]}>
                                <XCircle size={32} color="#EF4444" />
                                <Text allowFontScaling={false} style={s.absentText}>Absent</Text>
                                <Text allowFontScaling={false} style={[s.absentSub, { color: colors.textSecondary }]}>
                                    You were marked absent for this quiz
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Score card */}
                                <View style={[s.scoreCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={s.scoreCenter}>
                                        <Text allowFontScaling={false} style={[s.scoreFraction, { color: colors.text }]}>
                                            <Text style={{ color: gColor }}>{marksObtained}</Text>
                                            <Text style={{ color: colors.textSecondary, fontSize: TextSizes.large }}>/{totalMarks}</Text>
                                        </Text>
                                        <Text allowFontScaling={false} style={[s.scorePct, { color: colors.textSecondary }]}>
                                            {pct}%
                                        </Text>
                                    </View>

                                    <View style={[s.dividerV, { backgroundColor: colors.border }]} />

                                    <View style={s.gradeBox}>
                                        <View style={[s.gradePill, { backgroundColor: gColor + '20', borderColor: gColor + '60' }]}>
                                            <Text allowFontScaling={false} style={[s.gradeText, { color: gColor }]}>{grade}</Text>
                                        </View>
                                        <View style={[s.pfPill, { backgroundColor: passed ? '#10B98120' : '#EF444415' }]}>
                                            <Text allowFontScaling={false} style={[s.pfText, { color: passed ? '#10B981' : '#EF4444' }]}>
                                                {passed ? 'Pass' : 'Fail'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Details */}
                                <View style={[s.detailCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                                        <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.textSecondary }]}>Marks Obtained</Text>
                                        <Text allowFontScaling={false} style={[s.detailValue, { color: colors.text }]}>{marksObtained}</Text>
                                    </View>
                                    <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                                        <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.textSecondary }]}>Total Marks</Text>
                                        <Text allowFontScaling={false} style={[s.detailValue, { color: colors.text }]}>{totalMarks}</Text>
                                    </View>
                                    {passingMarks != null && (
                                        <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.textSecondary }]}>Passing Marks</Text>
                                            <Text allowFontScaling={false} style={[s.detailValue, { color: '#10B981' }]}>{passingMarks}</Text>
                                        </View>
                                    )}
                                    <View style={s.detailRow}>
                                        <Text allowFontScaling={false} style={[s.detailLabel, { color: colors.textSecondary }]}>Result</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            {passed
                                                ? <CheckCircle size={14} color="#10B981" />
                                                : <XCircle size={14} color="#EF4444" />}
                                            <Text allowFontScaling={false} style={[s.detailValue, { color: passed ? '#10B981' : '#EF4444' }]}>
                                                {passed ? 'Pass' : 'Fail'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}

                        {/* Remarks */}
                        {!!result.remarks && (
                            <View style={[s.remarksCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <Text allowFontScaling={false} style={[s.remarksLabel, { color: colors.textSecondary }]}>
                                    REMARKS
                                </Text>
                                <Text allowFontScaling={false} style={[s.remarksText, { color: colors.text }]}>
                                    {result.remarks}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        height: SHEET_HEIGHT,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        gap: 12,
    },
    title: { fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold', lineHeight: 22, marginBottom: 4 },
    subtitle: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular' },
    closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

    absentCard: {
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
        gap: 8,
    },
    absentText: { fontSize: TextSizes.xlarge, fontFamily: 'Inter-SemiBold', color: '#EF4444', marginTop: 4 },
    absentSub: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', textAlign: 'center' },

    scoreCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    scoreCenter: { flex: 1, alignItems: 'center' },
    scoreFraction: { fontSize: TextSizes.xlarge + 8, fontFamily: 'Inter-SemiBold', lineHeight: 44 },
    scorePct: { fontSize: TextSizes.large, fontFamily: 'Inter-Regular', marginTop: 4 },
    dividerV: { width: 1, height: 60, marginHorizontal: 16 },
    gradeBox: { flex: 1, alignItems: 'center', gap: 10 },
    gradePill: {
        paddingHorizontal: 18,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    gradeText: { fontSize: TextSizes.xlarge, fontFamily: 'Inter-SemiBold' },
    pfPill: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 10,
    },
    pfText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

    detailCard: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    detailLabel: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular' },
    detailValue: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

    remarksCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
    },
    remarksLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    remarksText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', lineHeight: 20 },
});

export default StudentMarkModal;
