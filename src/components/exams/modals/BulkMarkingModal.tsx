import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
    Modal, View, Text, FlatList, TouchableOpacity, TouchableWithoutFeedback,
    TextInput, ActivityIndicator, Alert, StyleSheet, Dimensions, Platform,
    InteractionManager,
} from 'react-native';
import { X, ChevronLeft, Save, UserX, BookOpen, PenLine, Lock } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { sendPushNotification } from '@/src/lib/notifications';
import { useAuth } from '@/src/contexts/AuthContext';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;

interface BulkMarkingModalProps {
    colors: any;
    visible: boolean;
    onClose: () => void;
    quizzes: any[];
    quizResults: any[];
    classes: any[];
    subjects: any[];
    bulkMarkQuizResults: (
        entries: Array<{ resultId: string; marks: number | null; remarks?: string; isAbsent?: boolean }>,
        quizId: string
    ) => Promise<{ success: boolean; failed: number; results: any[] }>;
    onRefresh?: () => Promise<void>;
}

type MarkEntry = {
    marks: string;
    remarks: string;
    isAbsent: boolean;
};

// ── Memoized student card ────────────────────────────────────────────────────
interface StudentCardProps {
    result: any;
    entry: MarkEntry;
    totalMarks: number;
    colors: any;
    remarksOpen: boolean;
    canEdit: boolean;
    onUpdateMarks: (id: string, value: string) => void;
    onUpdateRemarks: (id: string, value: string) => void;
    onToggleAbsent: (id: string) => void;
    onToggleRemarks: (id: string) => void;
}

const StudentMarkCard = memo<StudentCardProps>(({
    result, entry, totalMarks, colors, remarksOpen, canEdit,
    onUpdateMarks, onUpdateRemarks, onToggleAbsent, onToggleRemarks,
}) => {
    const isLocked = result.is_checked && !canEdit;

    return (
        <View
            style={[
                sc.studentCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                isLocked && { opacity: 0.75 },
                !isLocked && entry.isAbsent && { borderColor: '#EF444460' },
                !isLocked && result.is_checked && !entry.isAbsent && { borderColor: '#10B98140' },
            ]}
        >
            {/* Student header */}
            <View style={sc.studentHeader}>
                <View style={[sc.studentAvatar, { backgroundColor: colors.primary + '20' }]}>
                    <Text allowFontScaling={false} style={[sc.studentAvatarText, { color: colors.primary }]}>
                        {result.students?.full_name?.charAt(0) || '?'}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={[sc.studentName, { color: colors.text }]}>
                        {result.students?.full_name || 'Unknown'}
                    </Text>
                    <Text allowFontScaling={false} style={[sc.studentRoll, { color: colors.textSecondary }]}>
                        {result.students?.roll_number || '—'}
                    </Text>
                </View>

                {isLocked ? (
                    <View style={sc.lockedBadge}>
                        <Lock size={12} color={colors.textSecondary} />
                        <Text allowFontScaling={false} style={[sc.lockedText, { color: colors.textSecondary }]}>Locked</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[sc.absentBtn, {
                            borderColor: entry.isAbsent ? '#EF4444' : colors.border,
                            backgroundColor: entry.isAbsent ? '#EF444415' : 'transparent',
                        }]}
                        onPress={() => onToggleAbsent(result.id)}
                    >
                        <UserX size={14} color={entry.isAbsent ? '#EF4444' : colors.textSecondary} />
                        <Text allowFontScaling={false} style={[sc.absentBtnText, { color: entry.isAbsent ? '#EF4444' : colors.textSecondary }]}>
                            Absent
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Locked: show read-only result */}
            {isLocked ? (
                <View style={[sc.lockedResult, { borderTopColor: colors.border }]}>
                    {entry.isAbsent ? (
                        <Text allowFontScaling={false} style={[sc.lockedResultText, { color: '#EF4444' }]}>Absent</Text>
                    ) : (
                        <Text allowFontScaling={false} style={[sc.lockedResultText, { color: colors.text }]}>
                            {entry.marks || (result.marks_obtained ?? '—')} / {totalMarks}
                        </Text>
                    )}
                    <Text allowFontScaling={false} style={[sc.lockedHint, { color: colors.textSecondary }]}>
                        Only admin can edit
                    </Text>
                </View>
            ) : (
                <>
                    {!entry.isAbsent && (
                        <View style={sc.marksRow}>
                            <Text allowFontScaling={false} style={[sc.marksLabel, { color: colors.textSecondary }]}>
                                Marks (0–{totalMarks})
                            </Text>
                            <TextInput
                                style={[sc.marksInput, {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text,
                                }]}
                                value={entry.marks}
                                onChangeText={(t) => onUpdateMarks(result.id, t)}
                                placeholder={`0–${totalMarks}`}
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                returnKeyType="done"
                            />
                        </View>
                    )}

                    <TouchableOpacity style={sc.remarksToggle} onPress={() => onToggleRemarks(result.id)}>
                        <Text allowFontScaling={false} style={[sc.remarksToggleText, { color: colors.textSecondary }]}>
                            {remarksOpen ? 'Hide remarks' : entry.remarks ? `Remarks: ${entry.remarks}` : 'Add remarks (optional)'}
                        </Text>
                    </TouchableOpacity>

                    {remarksOpen && (
                        <TextInput
                            style={[sc.remarksInput, {
                                backgroundColor: colors.background,
                                borderColor: colors.border,
                                color: colors.text,
                            }]}
                            value={entry.remarks}
                            onChangeText={(t) => onUpdateRemarks(result.id, t)}
                            placeholder="Add remarks or feedback"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={2}
                            returnKeyType="done"
                        />
                    )}

                    {result.is_checked && (
                        <View style={sc.alreadyMarkedBadge}>
                            <Text allowFontScaling={false} style={[sc.alreadyMarkedText, { color: '#10B981' }]}>
                                Previously marked • will update
                            </Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
});

// ── Memoized quiz row ────────────────────────────────────────────────────────
interface QuizRowProps {
    quiz: any;
    pendingCount: number;
    totalCount: number;
    className?: string;
    subjectName?: string;
    colors: any;
    onPress: (quiz: any) => void;
}

const QuizRow = memo<QuizRowProps>(({ quiz, pendingCount, totalCount, className, subjectName, colors, onPress }) => (
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
        </View>
        <View style={[s.pendingBadge, { backgroundColor: pendingCount > 0 ? '#F59E0B20' : '#10B98120' }]}>
            <Text allowFontScaling={false} style={[s.pendingBadgeText, { color: pendingCount > 0 ? '#F59E0B' : '#10B981' }]}>
                {pendingCount > 0 ? `${pendingCount} pending` : 'All marked'}
            </Text>
            <Text allowFontScaling={false} style={[s.pendingTotal, { color: colors.textSecondary }]}>
                {totalCount} students
            </Text>
        </View>
    </TouchableOpacity>
));

// ── Main modal ───────────────────────────────────────────────────────────────
const BulkMarkingModal: React.FC<BulkMarkingModalProps> = ({
    colors, visible, onClose, quizzes, quizResults, classes, subjects,
    bulkMarkQuizResults, onRefresh,
}) => {
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { profile } = useAuth();
    const isSuperAdmin = profile?.role === 'superadmin';
    const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
    const [selectedTotalMarks, setSelectedTotalMarks] = useState<number>(100);
    const [transitioning, setTransitioning] = useState(false);
    const [markingData, setMarkingData] = useState<Record<string, MarkEntry>>({});
    const [saving, setSaving] = useState(false);
    const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!visible) {
            setSelectedQuiz(null);
            setSelectedTotalMarks(100);
            setMarkingData({});
            setExpandedRemarks({});
            setTransitioning(false);
        }
    }, [visible]);

    useEffect(() => {
        if (!selectedQuiz) return;
        const resultsForQuiz = quizResults.filter(r => r.quiz_id === selectedQuiz.id);
        const initial: Record<string, MarkEntry> = {};
        for (const r of resultsForQuiz) {
            initial[r.id] = {
                marks: r.marks_obtained != null ? String(r.marks_obtained) : '',
                remarks: r.remarks || '',
                isAbsent: r.submission_status === 'absent',
            };
        }
        setMarkingData(initial);
    }, [selectedQuiz, quizResults]);

    // ── Stable callbacks ─────────────────────────────────────────────────────
    const handleUpdateMarks = useCallback((id: string, value: string) => {
        setMarkingData(prev => ({ ...prev, [id]: { ...prev[id], marks: value } }));
    }, []);

    const handleUpdateRemarks = useCallback((id: string, value: string) => {
        setMarkingData(prev => ({ ...prev, [id]: { ...prev[id], remarks: value } }));
    }, []);

    const handleToggleAbsent = useCallback((id: string) => {
        setMarkingData(prev => ({ ...prev, [id]: { ...prev[id], isAbsent: !prev[id].isAbsent } }));
    }, []);

    const handleToggleRemarks = useCallback((id: string) => {
        setExpandedRemarks(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    // ── Derived data (memoized) ──────────────────────────────────────────────
    const quizzesWithResults = useMemo(() =>
        quizzes.filter(q => quizResults.some(r => r.quiz_id === q.id)),
        [quizzes, quizResults]
    );

    const quizMeta = useMemo(() => {
        const meta: Record<string, { pending: number; total: number; className?: string; subjectName?: string }> = {};
        for (const q of quizzesWithResults) {
            const results = quizResults.filter(r => r.quiz_id === q.id);
            meta[q.id] = {
                pending: results.filter(r => !r.is_checked).length,
                total: results.length,
                className: classes.find(c => c.id === q.class_id)?.name,
                subjectName: subjects.find(s => s.id === q.subject_id)?.name,
            };
        }
        return meta;
    }, [quizzesWithResults, quizResults, classes, subjects]);

    const resultsForSelectedQuiz = useMemo(() =>
        selectedQuiz ? quizResults.filter(r => r.quiz_id === selectedQuiz.id) : [],
        [selectedQuiz, quizResults]
    );

    const allFilled = useMemo(() =>
        resultsForSelectedQuiz.every(r => {
            if (r.is_checked && !isSuperAdmin) return true; // locked — skip validation
            const entry = markingData[r.id];
            return entry && (entry.isAbsent || entry.marks.trim() !== '');
        }),
        [resultsForSelectedQuiz, markingData, isSuperAdmin]
    );

    const handleSaveAll = useCallback(async () => {
        if (!selectedQuiz) return;
        const totalMarks = selectedQuiz.total_marks;

        for (const r of resultsForSelectedQuiz) {
            const entry = markingData[r.id];
            if (!entry || entry.isAbsent) continue;
            if (!entry.marks.trim()) {
                Alert.alert('Missing Marks', `Please enter marks for ${r.students?.full_name || 'a student'}, or mark them as absent.`);
                return;
            }
            const m = parseInt(entry.marks);
            if (isNaN(m) || m < 0 || m > totalMarks) {
                Alert.alert('Invalid Marks', `Marks for ${r.students?.full_name} must be between 0 and ${totalMarks}.`);
                return;
            }
        }

        setSaving(true);
        try {
            // Teachers can only save unmarked entries; superadmin can save all
            const editableResults = resultsForSelectedQuiz.filter(r => !r.is_checked || isSuperAdmin);
            const entries = editableResults
                .map(r => {
                    const entry = markingData[r.id];
                    if (!entry) return null;

                    // Skip entries where nothing has changed
                    const original = quizResults.find(q => q.id === r.id);
                    const wasAbsent = original?.submission_status === 'absent';
                    const oldMarks = original?.marks_obtained ?? null;
                    const oldRemarks = original?.remarks ?? '';
                    const newMarks = entry.isAbsent ? null : parseInt(entry.marks);
                    const unchanged =
                        entry.isAbsent === wasAbsent &&
                        (entry.isAbsent || String(newMarks) === String(oldMarks)) &&
                        (entry.remarks ?? '') === oldRemarks;
                    if (unchanged) return null;

                    return {
                        resultId: r.id,
                        marks: entry.isAbsent ? null : parseInt(entry.marks),
                        remarks: entry.remarks || undefined,
                        isAbsent: entry.isAbsent,
                    };
                })
                .filter(Boolean) as any[];

            if (entries.length === 0) {
                Alert.alert('No Changes', 'No marks have been changed.');
                return;
            }

            const result = await bulkMarkQuizResults(entries, selectedQuiz.id);

            if (result.failed === 0) {
                Alert.alert('Success', 'All marks saved successfully!');
                onClose();
                onRefresh?.();

                // Fire notifications in background — only for students whose data changed
                (async () => {
                    for (const savedRow of result.results) {
                        if (!savedRow?.student_id) continue;
                        const entry = entries.find(e => e.resultId === savedRow.id);
                        if (!entry) continue;

                        // Skip if nothing changed
                        const original = quizResults.find(r => r.id === savedRow.id);
                        const wasAbsent = original?.submission_status === 'absent';
                        const oldMarks = original?.marks_obtained ?? null;
                        const oldRemarks = original?.remarks ?? '';
                        const noChange =
                            entry.isAbsent === wasAbsent &&
                            (entry.isAbsent || String(entry.marks ?? '') === String(oldMarks ?? '')) &&
                            (entry.remarks ?? '') === oldRemarks;
                        if (noChange) continue;
                        const isAbsent = entry.isAbsent;
                        try {
                            const { data: notif, error: notifErr } = await supabase
                                .from('notifications')
                                .insert([{
                                    type: 'quiz_marked',
                                    title: `${selectedQuiz.title} Marked`,
                                    message: isAbsent
                                        ? `You were marked absent for ${selectedQuiz.title}.`
                                        : `Your quiz has been marked. Tap to see your result!`,
                                    entity_type: 'quiz_result',
                                    entity_id: savedRow.id,
                                    created_by: profile?.id,
                                    target_type: 'individual',
                                    target_id: savedRow.student_id,
                                    priority: 'medium',
                                }])
                                .select('id')
                                .single();
                            if (!notifErr && notif) {
                                await supabase.from('notification_recipients').insert({
                                    notification_id: notif.id,
                                    user_id: savedRow.student_id,
                                    is_read: false,
                                    is_deleted: false,
                                });
                                await sendPushNotification({
                                    userId: savedRow.student_id,
                                    title: `📝 ${selectedQuiz.title} Marked`,
                                    body: isAbsent
                                        ? `You were marked absent for ${selectedQuiz.title}.`
                                        : `Your quiz has been marked. Tap to see your result!`,
                                    data: {
                                        type: 'quiz_marked',
                                        quizId: selectedQuiz.id,
                                        resultId: savedRow.id,
                                        notificationId: notif.id,
                                    },
                                });
                            }
                        } catch { /* non-critical */ }
                    }
                })();
            } else {
                Alert.alert('Partial Save', `${result.failed} mark(s) failed to save. Please try again.`);
            }
        } catch {
            Alert.alert('Error', 'Failed to save marks. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [selectedQuiz, resultsForSelectedQuiz, markingData, quizResults, bulkMarkQuizResults, onClose, onRefresh, profile]);

    // ── FlatList render functions ────────────────────────────────────────────
    const handleSelectQuiz = useCallback((quiz: any) => {
        setTransitioning(true);
        InteractionManager.runAfterInteractions(() => {
            setSelectedQuiz(quiz);
            setSelectedTotalMarks(quiz.total_marks ?? 100);
            setTransitioning(false);
        });
    }, []);

    const renderQuizItem = useCallback(({ item: quiz }: { item: any }) => {
        const meta = quizMeta[quiz.id] ?? { pending: 0, total: 0 };
        return (
            <QuizRow
                quiz={quiz}
                pendingCount={meta.pending}
                totalCount={meta.total}
                className={meta.className}
                subjectName={meta.subjectName}
                colors={colors}
                onPress={handleSelectQuiz}
            />
        );
    }, [quizMeta, colors, handleSelectQuiz]);

    const renderMarkingItem = useCallback(({ item: result }: { item: any }) => {
        const entry = markingData[result.id];
        if (!entry) return null;
        return (
            <StudentMarkCard
                result={result}
                entry={entry}
                totalMarks={selectedTotalMarks}
                colors={colors}
                remarksOpen={!!expandedRemarks[result.id]}
                canEdit={!result.is_checked || isSuperAdmin}
                onUpdateMarks={handleUpdateMarks}
                onUpdateRemarks={handleUpdateRemarks}
                onToggleAbsent={handleToggleAbsent}
                onToggleRemarks={handleToggleRemarks}
            />
        );
    }, [markingData, expandedRemarks, selectedTotalMarks, colors, isSuperAdmin, handleUpdateMarks, handleUpdateRemarks, handleToggleAbsent, handleToggleRemarks]);

    const keyExtractor = useCallback((item: any) => item.id, []);

    const editableCount = useMemo(() =>
        resultsForSelectedQuiz.filter(r => !r.is_checked || isSuperAdmin).length,
        [resultsForSelectedQuiz, isSuperAdmin]
    );

    const markingFooter = useMemo(() => (
        <TouchableOpacity
            style={[
                s.saveAllBtn,
                { backgroundColor: colors.primary },
                (!allFilled || saving || editableCount === 0) && { opacity: 0.4 },
            ]}
            onPress={handleSaveAll}
            disabled={!allFilled || saving || editableCount === 0}
        >
            {saving ? (
                <ActivityIndicator color="#ffffff" />
            ) : (
                <>
                    <Save size={18} color="#ffffff" />
                    <Text allowFontScaling={false} style={s.saveAllText}>
                        Save Marks ({editableCount} student{editableCount !== 1 ? 's' : ''})
                    </Text>
                </>
            )}
        </TouchableOpacity>
    ), [allFilled, saving, colors.primary, handleSaveAll, editableCount]);

    // ── Quiz list (step 1) ────────────────────────────────────────────────────
    const renderQuizList = () => (
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
                    <PenLine size={40} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[s.emptyTitle, { color: colors.text }]}>No quizzes to mark</Text>
                    <Text allowFontScaling={false} style={[s.emptySubtitle, { color: colors.textSecondary }]}>
                        Quizzes with student results will appear here
                    </Text>
                </View>
            }
        />
    );

    // ── Marking form (step 2) ─────────────────────────────────────────────────
    const renderMarkingForm = () => {
        const totalMarks = selectedQuiz?.total_marks;
        const className = classes.find(c => c.id === selectedQuiz?.class_id)?.name;

        return (
            <View style={{ flex: 1 }}>
                <View style={[s.quizInfoBar, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={s.quizInfoRow}>
                        <Text allowFontScaling={false} style={[s.quizInfoLabel, { color: colors.textSecondary }]}>Total Marks</Text>
                        <Text allowFontScaling={false} style={[s.quizInfoValue, { color: colors.primary }]}>{totalMarks}</Text>
                    </View>
                    {className && (
                        <View style={s.quizInfoRow}>
                            <Text allowFontScaling={false} style={[s.quizInfoLabel, { color: colors.textSecondary }]}>Class</Text>
                            <Text allowFontScaling={false} style={[s.quizInfoValue, { color: colors.text }]}>{className}</Text>
                        </View>
                    )}
                    <View style={s.quizInfoRow}>
                        <Text allowFontScaling={false} style={[s.quizInfoLabel, { color: colors.textSecondary }]}>Students</Text>
                        <Text allowFontScaling={false} style={[s.quizInfoValue, { color: colors.text }]}>{resultsForSelectedQuiz.length}</Text>
                    </View>
                </View>

                <FlatList
                    data={resultsForSelectedQuiz}
                    keyExtractor={keyExtractor}
                    renderItem={renderMarkingItem}
                    extraData={{ markingData, expandedRemarks }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    automaticallyAdjustKeyboardInsets
                    removeClippedSubviews={false}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    initialNumToRender={6}
                    ListFooterComponent={markingFooter}
                />
            </View>
        );
    };

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
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>
                <View style={[s.sheet, { backgroundColor: colors.background, height: SHEET_HEIGHT, paddingBottom: bottomInset }]}>
                    <View style={[s.header, { borderBottomColor: colors.border }]}>
                        {selectedQuiz ? (
                            <TouchableOpacity style={s.backBtn} onPress={() => setSelectedQuiz(null)}>
                                <ChevronLeft size={22} color={colors.text} />
                            </TouchableOpacity>
                        ) : (
                            <View style={s.backBtn} />
                        )}
                        <View style={{ flex: 1 }}>
                            <Text allowFontScaling={false} style={[s.headerTitle, { color: colors.text }]} numberOfLines={1}>
                                {selectedQuiz ? selectedQuiz.title : 'Mark Quizzes'}
                            </Text>
                            {!selectedQuiz && (
                                <Text allowFontScaling={false} style={[s.headerSubtitle, { color: colors.textSecondary }]}>
                                    Select a quiz to mark all students at once
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                            <X size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {transitioning ? (
                        <View style={s.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : selectedQuiz ? renderMarkingForm() : renderQuizList()}
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
        borderBottomWidth: 1, gap: 8,
    },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
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
    quizRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaChipText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },
    pendingBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
    pendingBadgeText: { fontSize: TextSizes.small, fontFamily: 'Inter-SemiBold' },
    pendingTotal: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginTop: 2 },

    quizInfoBar: {
        flexDirection: 'row', justifyContent: 'space-around',
        marginHorizontal: 16, marginTop: 12, borderRadius: 10, borderWidth: 1, paddingVertical: 10,
    },
    quizInfoRow: { alignItems: 'center' },
    quizInfoLabel: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginBottom: 2 },
    quizInfoValue: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold' },

    saveAllBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 52, borderRadius: 12, gap: 8, marginTop: 4, marginBottom: 8,
    },
    saveAllText: { color: '#ffffff', fontSize: TextSizes.buttonText, fontFamily: 'Inter-SemiBold' },
});

const sc = StyleSheet.create({
    studentCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
    studentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    studentAvatarText: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold' },
    studentName: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold' },
    studentRoll: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', marginTop: 1 },

    absentBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
    },
    absentBtnText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium' },

    marksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    marksLabel: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', flex: 1 },
    marksInput: {
        width: 90, height: 40, borderWidth: 1, borderRadius: 8,
        paddingHorizontal: 12, textAlign: 'center',
        fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold',
    },

    remarksToggle: { paddingVertical: 4 },
    remarksToggleText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },
    remarksInput: {
        marginTop: 6, borderWidth: 1, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 8,
        fontSize: TextSizes.medium, fontFamily: 'Inter-Regular',
        textAlignVertical: 'top', minHeight: 60,
    },

    alreadyMarkedBadge: { marginTop: 8, alignItems: 'flex-end' },
    alreadyMarkedText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', fontStyle: 'italic' },

    lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    lockedText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium' },
    lockedResult: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth,
    },
    lockedResultText: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold' },
    lockedHint: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular', fontStyle: 'italic' },
});

export default BulkMarkingModal;
