// TimetableScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ScrollView, RefreshControl, StyleSheet, Alert,
    View, TouchableOpacity, Text, Modal,
    TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import { Plus, Check, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTimetable } from '@/src/hooks/useTimetable';
import TopSection from '@/src/components/common/TopSections';
import DayRow from '@/src/components/timetable/DayRow';
import TimetableEntryModal from '@/src/components/timetable/TimetableEntryModal';
import ErrorState from '@/src/components/timetable/ErrorState';
import { supabase } from '@/src/lib/supabase';
import {
    Class, Subject, TimetableEntryWithDetails,
    CreateTimetableEntry, DAYS_ORDER, ThemeColors, DayOfWeek,
} from '@/src/types/timetable';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenAnimation } from '@/src/utils/animations';
import {
    handleClassesFetchError, handleSubjectsFetchError,
    handleTimetableCreateError, handleTimetableUpdateError,
    handleTimetableDeleteError, ErrorResponse,
} from '@/src/utils/errorHandler/timetableErrorHandler';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { TextSizes } from '@/src/styles/TextSizes';

const { height } = Dimensions.get('window');

const WEEK_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableScreen() {
    const { profile, student } = useAuth();
    const { colors } = useTheme() as { colors: ThemeColors };
    const {
        timetable, loading, error, filters, setFilters,
        createEntry, updateEntry, deleteEntry, getEntriesForDay, refreshTimetable,
    } = useTimetable();

    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimetableEntryWithDetails | null>(null);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const screenStyle = useScreenAnimation();
    const [errorModal, setErrorModal] = useState<ErrorResponse | null>(null);

    // Applied filters
    const [filterClass, setFilterClass] = useState<string | null>(null);
    const [filterSubject, setFilterSubject] = useState<string | null>(null);
    const [filterDay, setFilterDay] = useState<DayOfWeek | null>(null);

    // Pending (in-modal) filters
    const [filterVisible, setFilterVisible] = useState(false);
    const [expandedSection, setExpandedSection] = useState<'class' | 'subject' | 'day' | null>(null);
    const [pendingClass, setPendingClass] = useState<string | null>(null);
    const [pendingSubject, setPendingSubject] = useState<string | null>(null);
    const [pendingDay, setPendingDay] = useState<DayOfWeek | null>(null);
    const [pendingSubjects, setPendingSubjects] = useState<Subject[]>([]);

    const [newEntry, setNewEntry] = useState<Partial<CreateTimetableEntry>>({
        day: undefined, start_time: '', end_time: '',
        subject: '', room_number: '', class_id: '', teacher_id: profile?.id || '',
    });

    if (!profile) return null;

    const isSuperAdmin = profile.role === 'superadmin';
    const isTeacher = profile.role === 'teacher' || isSuperAdmin;
    const isStudent = profile.role === 'student';
    const isFiltered = filterClass !== null || filterSubject !== null || filterDay !== null;

    // ── Data fetch ────────────────────────────────────────────────────────────

    useEffect(() => { fetchClasses(); fetchAllSubjects(); }, [profile]);

    const fetchClasses = async () => {
        try {
            if (isSuperAdmin) {
                const { data, error } = await supabase.from('classes').select('id, name').order('name');
                if (error) throw error;
                setClasses(data || []);
            } else if (isTeacher) {
                const { data: enrollments, error: enrollErr } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('class_id')
                    .eq('teacher_id', profile.id)
                    .eq('is_active', true);
                if (enrollErr) throw enrollErr;
                if (!enrollments?.length) { setClasses([]); return; }
                const classIds = [...new Set(enrollments.map(e => e.class_id))];
                const { data, error } = await supabase
                    .from('classes').select('id, name')
                    .in('id', classIds).order('name');
                if (error) throw error;
                setClasses((data || []).sort((a, b) => a.name.localeCompare(b.name)));
            } else if (isStudent && student?.class_id) {
                const { data, error } = await supabase
                    .from('classes').select('id, name').eq('id', student.class_id).single();
                if (error) throw error;
                if (data) { setClasses([data]); setFilters({ class_id: data.id }); }
            }
        } catch (err: any) {
            setErrorModal(handleClassesFetchError(err));
        }
    };

    // Fetch all subjects teacher can teach (across all classes) for display
    const fetchAllSubjects = async () => {
        try {
            if (isSuperAdmin) {
                const { data, error } = await supabase.from('subjects').select('id, name').eq('is_active', true).order('name');
                if (error) throw error;
                setSubjects(data || []);
            } else if (isTeacher) {
                const { data: enrollments, error: enrollErr } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('subject_id')
                    .eq('teacher_id', profile.id)
                    .eq('is_active', true);
                if (enrollErr) throw enrollErr;
                if (!enrollments?.length) { setSubjects([]); return; }
                const subjectIds = [...new Set(enrollments.map(e => e.subject_id))];
                const { data, error } = await supabase
                    .from('subjects').select('id, name')
                    .in('id', subjectIds).eq('is_active', true).order('name');
                if (error) throw error;
                setSubjects(data || []);
            } else if (isStudent && student?.id) {
                const { data: enrollments, error: enrollErr } = await supabase
                    .from('student_subject_enrollments')
                    .select('subject_id').eq('student_id', student.id).eq('is_active', true);
                if (enrollErr) throw enrollErr;
                if (!enrollments?.length) { setSubjects([]); return; }
                const subjectIds = [...new Set(enrollments.map(e => e.subject_id))];
                const { data, error } = await supabase
                    .from('subjects').select('id, name')
                    .in('id', subjectIds).eq('is_active', true).order('name');
                if (error) throw error;
                setSubjects(data || []);
            }
        } catch (err: any) {
            setErrorModal(handleSubjectsFetchError(err));
        }
    };

    // Fetch subjects for a specific class (used inside the filter modal)
    const fetchSubjectsForClass = async (classId: string | null) => {
        try {
            if (isSuperAdmin) {
                // Superadmin: get all subjects for the class (or all subjects)
                if (classId) {
                    const { data: cs } = await supabase
                        .from('classes_subjects').select('subject_id').eq('class_id', classId);
                    const subjectIds = (cs || []).map((r: any) => r.subject_id);
                    if (!subjectIds.length) { setPendingSubjects([]); return; }
                    const { data } = await supabase.from('subjects').select('id, name').in('id', subjectIds).eq('is_active', true).order('name');
                    setPendingSubjects(data || []);
                } else {
                    await fetchAllSubjects();
                    // sync to pending
                }
                return;
            } else if (isTeacher) {
                let subjectIds: string[];
                if (classId) {
                    const { data: enrollments } = await supabase
                        .from('teacher_subject_enrollments')
                        .select('subject_id')
                        .eq('teacher_id', profile.id)
                        .eq('class_id', classId)
                        .eq('is_active', true);
                    subjectIds = [...new Set((enrollments || []).map(e => e.subject_id))];
                } else {
                    const { data: enrollments } = await supabase
                        .from('teacher_subject_enrollments')
                        .select('subject_id')
                        .eq('teacher_id', profile.id)
                        .eq('is_active', true);
                    subjectIds = [...new Set((enrollments || []).map(e => e.subject_id))];
                }
                if (!subjectIds.length) { setPendingSubjects([]); return; }
                const { data } = await supabase
                    .from('subjects').select('id, name')
                    .in('id', subjectIds).eq('is_active', true).order('name');
                setPendingSubjects(data || []);
            } else {
                setPendingSubjects(subjects);
            }
        } catch {
            setPendingSubjects(subjects);
        }
    };

    // ── Filter modal ──────────────────────────────────────────────────────────

    useEffect(() => {
        if (filterVisible) {
            setPendingClass(filterClass);
            setPendingSubject(filterSubject);
            setPendingDay(filterDay);
            setExpandedSection(null);
            fetchSubjectsForClass(filterClass);
        }
    }, [filterVisible]);

    const toggleSection = (section: 'class' | 'subject' | 'day') => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const handleModalClassSelect = (classId: string | null) => {
        setPendingClass(classId);
        setPendingSubject(null);
        setExpandedSection(null);
        fetchSubjectsForClass(classId);
    };

    const applyFilter = () => {
        setFilterClass(pendingClass);
        setFilterSubject(pendingSubject);
        setFilterDay(pendingDay);
        // Only pass class_id if explicitly selected; teacher sees all their entries otherwise
        setFilters({
            class_id: pendingClass ?? undefined,
            day: pendingDay ?? undefined,
        });
        setFilterVisible(false);
    };

    const resetFilter = () => {
        setPendingClass(null); setPendingSubject(null); setPendingDay(null);
        setFilterClass(null); setFilterSubject(null); setFilterDay(null);
        setFilters({ class_id: undefined, day: undefined });
        setFilterVisible(false);
    };

    // Client-side subject filter wrapping getEntriesForDay
    const filteredGetEntriesForDay = useCallback((day: DayOfWeek): TimetableEntryWithDetails[] => {
        let entries = getEntriesForDay(day);
        if (filterSubject) {
            entries = entries.filter(e => e.subject_id === filterSubject);
        }
        return entries;
    }, [getEntriesForDay, filterSubject]);

    // Days to render — all 5 weekdays, or just the filtered day
    const visibleDays = filterDay ? [filterDay] : WEEK_DAYS;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    // Dropdown already produces "HH:MM"; pass through unchanged so isValidTimeFormat passes
    const formatTime = (t: string) => t.substring(0, 5);
    const validateEntry = () =>
        newEntry.day && newEntry.start_time && newEntry.end_time &&
        newEntry.subject && newEntry.room_number && newEntry.class_id;

    const handleAddEntry = async () => {
        try {
            if (!validateEntry()) { Alert.alert('Error', 'Please fill in all fields'); return; }
            const result = await createEntry({
                day: newEntry.day!, start_time: formatTime(newEntry.start_time!),
                end_time: formatTime(newEntry.end_time!), subject: newEntry.subject!,
                room_number: newEntry.room_number!, class_id: newEntry.class_id!,
                teacher_id: newEntry.teacher_id || profile.id,
            });
            if (result) { setModalVisible(false); resetForm(); await refreshTimetable(); }
        } catch (err: any) { setErrorModal(handleTimetableCreateError(err)); }
    };

    const handleUpdateEntry = async () => {
        try {
            if (!editingEntry || !validateEntry()) return;
            const result = await updateEntry({
                id: editingEntry.id, day: newEntry.day,
                start_time: newEntry.start_time ? formatTime(newEntry.start_time) : undefined,
                end_time: newEntry.end_time ? formatTime(newEntry.end_time) : undefined,
                subject: newEntry.subject, room_number: newEntry.room_number,
                class_id: newEntry.class_id, teacher_id: newEntry.teacher_id,
            });
            if (result) { setModalVisible(false); setEditingEntry(null); resetForm(); }
        } catch (err: any) { setErrorModal(handleTimetableUpdateError(err)); }
    };

    const handleDeleteEntry = async (entry: TimetableEntryWithDetails) => {
        try {
            Alert.alert('Delete Entry', `Delete ${entry.subject_name} class?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        const success = await deleteEntry(entry.id);
                        if (success) {
                            setModalVisible(false);
                            setEditingEntry(null);
                            resetForm();
                            await refreshTimetable();
                        }
                    },
                },
            ]);
        } catch (err: any) { setErrorModal(handleTimetableDeleteError(err)); }
    };

    const resetForm = () => setNewEntry({
        day: undefined, start_time: '', end_time: '',
        subject: '', room_number: '',
        class_id: filters.class_id || '', teacher_id: profile.id,
    });

    const onRefresh = async () => { setRefreshing(true); await refreshTimetable(); setRefreshing(false); };

    const getCurrentWeekDates = () => {
        const startOfWeek = new Date(currentWeek);
        startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);
        return DAYS_ORDER.map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });
    };

    const handleEditEntry = (entry: TimetableEntryWithDetails) => {
        if (!isSuperAdmin) return; // teachers/students view only
        setEditingEntry(entry);
        setModalVisible(true);
    };

    const handleAddButtonPress = () => {
        resetForm(); setEditingEntry(null); setModalVisible(true);
    };

    useFocusEffect(useCallback(() => { refreshTimetable(); }, [profile]));

    if (error && !loading) {
        return <ErrorState error={error} colors={colors} refreshTimetable={refreshTimetable} />;
    }

    const weekDates = getCurrentWeekDates();

    // ── Filter Modal ──────────────────────────────────────────────────────────

    const renderFilterModal = () => {
        const selectedClassName = pendingClass
            ? classes.find(c => c.id === pendingClass)?.name
            : 'All Classes';
        const selectedSubjectName = pendingSubject
            ? pendingSubjects.find(s => s.id === pendingSubject)?.name
            : 'All Subjects';
        const selectedDayName = pendingDay ?? 'All Days';

        return (
            <Modal
                visible={filterVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
                    <View style={s.modalOverlay} />
                </TouchableWithoutFeedback>

                <View style={[s.bottomSheet, { backgroundColor: colors.cardBackground }]}>
                    <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />

                    {/* Add Entry (superadmin only) */}
                    {isSuperAdmin && (
                        <TouchableOpacity
                            style={[s.addBtn, { borderColor: colors.primary }]}
                            onPress={() => { setFilterVisible(false); handleAddButtonPress(); }}
                        >
                            <Plus size={18} color={colors.primary} />
                            <Text allowFontScaling={false} style={[s.addBtnText, { color: colors.primary }]}>
                                Add Timetable Entry
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Header */}
                    <View style={s.sheetHeader}>
                        <Text allowFontScaling={false} style={[s.sheetTitle, { color: colors.text }]}>
                            Filter Timetable
                        </Text>
                        {(pendingClass !== null || pendingSubject !== null || pendingDay !== null) && (
                            <TouchableOpacity onPress={resetFilter}>
                                <Text allowFontScaling={false} style={[s.resetText, { color: '#EF4444' }]}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={s.sheetScroll} showsVerticalScrollIndicator={false}>

                        {/* ── Class accordion (teacher only) ── */}
                        {isTeacher && classes.length > 0 && (
                            <>
                                <TouchableOpacity
                                    style={[s.accordionHeader, { borderColor: colors.border }]}
                                    onPress={() => toggleSection('class')}
                                >
                                    <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Class</Text>
                                    <View style={s.sheetOptionRight}>
                                        <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedClassName}</Text>
                                        <ChevronRight
                                            size={16} color={colors.textSecondary}
                                            style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'class' ? '270deg' : '90deg' }] }}
                                        />
                                    </View>
                                </TouchableOpacity>
                                {expandedSection === 'class' && (
                                    <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                        <TouchableOpacity
                                            style={[s.sheetOption, { borderBottomColor: colors.border }]}
                                            onPress={() => handleModalClassSelect(null)}
                                        >
                                            <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>All Classes</Text>
                                            {pendingClass === null && <Check size={16} color={colors.primary} />}
                                        </TouchableOpacity>
                                        {classes.map(c => (
                                            <TouchableOpacity
                                                key={c.id}
                                                style={[s.sheetOption, { borderBottomColor: colors.border }]}
                                                onPress={() => handleModalClassSelect(c.id)}
                                            >
                                                <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>{c.name}</Text>
                                                {pendingClass === c.id && <Check size={16} color={colors.primary} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {/* ── Subject accordion ── */}
                        <TouchableOpacity
                            style={[s.accordionHeader, { borderColor: colors.border }]}
                            onPress={() => toggleSection('subject')}
                        >
                            <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Subject</Text>
                            <View style={s.sheetOptionRight}>
                                <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedSubjectName}</Text>
                                <ChevronRight
                                    size={16} color={colors.textSecondary}
                                    style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'subject' ? '270deg' : '90deg' }] }}
                                />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'subject' && (
                            <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                <TouchableOpacity
                                    style={[s.sheetOption, { borderBottomColor: colors.border }]}
                                    onPress={() => { setPendingSubject(null); setExpandedSection(null); }}
                                >
                                    <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>All Subjects</Text>
                                    {pendingSubject === null && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {pendingSubjects.map(sub => (
                                    <TouchableOpacity
                                        key={sub.id}
                                        style={[s.sheetOption, { borderBottomColor: colors.border }]}
                                        onPress={() => { setPendingSubject(sub.id); setExpandedSection(null); }}
                                    >
                                        <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>{sub.name}</Text>
                                        {pendingSubject === sub.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* ── Day accordion ── */}
                        <TouchableOpacity
                            style={[s.accordionHeader, { borderColor: colors.border }]}
                            onPress={() => toggleSection('day')}
                        >
                            <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Day</Text>
                            <View style={s.sheetOptionRight}>
                                <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedDayName}</Text>
                                <ChevronRight
                                    size={16} color={colors.textSecondary}
                                    style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'day' ? '270deg' : '90deg' }] }}
                                />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'day' && (
                            <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                <TouchableOpacity
                                    style={[s.sheetOption, { borderBottomColor: colors.border }]}
                                    onPress={() => { setPendingDay(null); setExpandedSection(null); }}
                                >
                                    <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>All Days</Text>
                                    {pendingDay === null && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {WEEK_DAYS.map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[s.sheetOption, { borderBottomColor: colors.border }]}
                                        onPress={() => { setPendingDay(day); setExpandedSection(null); }}
                                    >
                                        <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>{day}</Text>
                                        {pendingDay === day && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                    </ScrollView>

                    <TouchableOpacity
                        style={[s.applyBtn, { backgroundColor: colors.primary }]}
                        onPress={applyFilter}
                    >
                        <Text allowFontScaling={false} style={s.applyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <TopSection
                onFilterPress={() => setFilterVisible(true)}
                isFiltered={isFiltered}
            />
            <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
                <Animated.View style={[{ flex: 1 }, screenStyle]}>
                    <ErrorModal
                        visible={!!errorModal}
                        title={errorModal?.title || 'Error'}
                        message={errorModal?.message || 'An error occurred'}
                        onClose={() => setErrorModal(null)}
                    />

                    {renderFilterModal()}

                    {isTeacher && classes.length === 0 && !loading && (
                        <View style={s.emptyState}>
                            <Text allowFontScaling={false} style={[s.emptyStateText, { color: colors.textSecondary }]}>
                                No classes assigned to you yet
                            </Text>
                        </View>
                    )}

                    <ScrollView
                        style={s.scrollView}
                        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
                    >
                        {loading ? (
                            WEEK_DAYS.map((day) => (
                                <View key={day} style={s.skeletonDayRow}>
                                    {/* Day header */}
                                    <View style={[s.skeletonDayHeader, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                        <SkeletonBox width={36} height={11} borderRadius={4} style={{ marginBottom: 8 }} />
                                        <SkeletonBox width={24} height={18} borderRadius={4} />
                                    </View>
                                    {/* Time slots */}
                                    <View style={s.skeletonSlots}>
                                        {[0, 1].map(i => (
                                            <View key={i} style={[s.skeletonSlot, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                                <View style={s.skeletonSlotTop}>
                                                    <SkeletonBox width={100} height={11} borderRadius={5} />
                                                    <SkeletonBox width={48} height={20} borderRadius={6} />
                                                </View>
                                                <SkeletonBox width="65%" height={13} borderRadius={5} style={{ marginBottom: 10 }} />
                                                <View style={s.skeletonSlotBottom}>
                                                    <SkeletonBox width={90} height={10} borderRadius={4} />
                                                    <SkeletonBox width={70} height={10} borderRadius={4} />
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ))
                        ) : (
                            visibleDays.map((day) => (
                                <DayRow
                                    key={day}
                                    day={day}
                                    dayIndex={DAYS_ORDER.indexOf(day)}
                                    weekDates={weekDates}
                                    getEntriesForDay={filteredGetEntriesForDay}
                                    colors={colors}
                                    profile={profile}
                                    handleEditEntry={handleEditEntry}
                                    handleDeleteEntry={handleDeleteEntry}
                                />
                            ))
                        )}
                    </ScrollView>

                    {isTeacher && (
                        <TimetableEntryModal
                            modalVisible={modalVisible}
                            setModalVisible={setModalVisible}
                            editingEntry={editingEntry}
                            setEditingEntry={setEditingEntry}
                            newEntry={newEntry}
                            setNewEntry={setNewEntry}
                            profile={profile}
                            colors={colors}
                            classes={classes}
                            handleAddEntry={handleAddEntry}
                            handleUpdateEntry={handleUpdateEntry}
                            handleDeleteEntry={handleDeleteEntry}
                            resetForm={resetForm}
                        />
                    )}
                </Animated.View>
            </SafeAreaView>
        </>
    );
}

const s = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1, paddingHorizontal: 16 },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyStateText: { fontSize: TextSizes.normal, fontFamily: 'Inter-Regular' },

    // bottom sheet
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    bottomSheet: {
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingTop: 12, paddingBottom: 32, maxHeight: height * 0.65,
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },

    addBtn: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: 16, marginBottom: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        borderRadius: 10, borderWidth: 1, gap: 8,
    },
    addBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

    sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    sheetTitle: { flex: 1, fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
    resetText: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium' },

    sheetScroll: { flexGrow: 0 },

    // Accordion
    accordionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginHorizontal: 16, marginBottom: 8,
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 10, borderWidth: 1,
    },
    accordionLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', flex: 1 },
    accordionValue: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
    accordionBody: {
        marginHorizontal: 16, marginBottom: 8,
        borderRadius: 10, borderWidth: 1, overflow: 'hidden',
    },

    sheetOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sheetOptionText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', flex: 1 },
    sheetOptionRight: { flexDirection: 'row', alignItems: 'center' },

    applyBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    applyBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold', color: '#ffffff' },

    // skeleton
    skeletonDayRow: { flexDirection: 'row', marginBottom: 20, minHeight: 120 },
    skeletonDayHeader: {
        width: 80, borderRadius: 12, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center', marginRight: 16,
        paddingVertical: 16,
    },
    skeletonSlots: { flex: 1, gap: 8 },
    skeletonSlot: { borderRadius: 12, borderWidth: 1, padding: 16 },
    skeletonSlotTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    skeletonSlotBottom: { flexDirection: 'row', justifyContent: 'space-between' },
});
