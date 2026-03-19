// ExamsScreen.tsx — flat quiz list + filter sheet
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TouchableWithoutFeedback, Dimensions, RefreshControl, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { FileText, Plus, ChevronRight, Check, Award, X, PenLine } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useQuizzes } from '@/src/hooks/useQuizzes';
import TopSections from '@/src/components/common/TopSections';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { useDialog } from '@/src/contexts/DialogContext';
import CreateQuizModal from '../components/exams/modals/CreateQuizModal';
import BulkMarkingModal from '../components/exams/modals/BulkMarkingModal';
import BulkResultsModal from '../components/exams/modals/BulkResultsModal';
import SwipeableQuizCard from '../components/exams/SwipeableQuizCard';
import QuizDetailModal from '../components/exams/modals/QuizDetailModal';
import StudentMarkModal from '../components/exams/modals/StudentMarkModal';
import StudentResultsListModal from '../components/exams/modals/StudentResultsListModal';
import { supabase } from '@/src/lib/supabase';
import { pendingNavigation } from '@/src/lib/notifications';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenAnimation } from '@/src/utils/animations';
import { handleError } from '@/src/utils/errorHandler/homeErrorHandler';
import { TextSizes } from '@/src/styles/TextSizes';

const { height } = Dimensions.get('window');

export default function ExamsScreen() {
  const { profile, student } = useAuth();
  const { colors, isDark } = useTheme();
  const screenStyle = useScreenAnimation();
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';
  const { showConfirm } = useDialog();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'class' | 'subject' | null>(null);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [pendingClass, setPendingClass] = useState<string | null>(null);
  const [pendingSubject, setPendingSubject] = useState<string | null>(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [bulkMarkingVisible, setBulkMarkingVisible] = useState(false);
  const [studentResultsVisible, setStudentResultsVisible] = useState(false);

  // ── Swipeable card state ─────────────────────────────────────────────────────
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [detailQuiz, setDetailQuiz] = useState<any>(null);
  const [studentMarkResult, setStudentMarkResult] = useState<any>(null);

  // ── Deep-link pending refs ───────────────────────────────────────────────────
  const pendingQuizIdRef = useRef<string | null>(null);
  const pendingResultIdRef = useRef<string | null>(null);

  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const showError = (error: any, handler?: (e: any) => any) => {
    const info = handler ? handler(error) : handleError(error);
    setErrorModal({ visible: true, title: info.title, message: info.message });
  };

  const {
    quizzes, quizResults, loading,
    subjects: enrolledSubjects,
    createQuiz, updateQuiz, deleteQuiz, markQuizResult, bulkMarkQuizResults, refetch,
  } = useQuizzes();

  // For students: populate subjects from their quiz enrollments (already enrollment-filtered in useQuizzes)
  useEffect(() => {
    if (!isTeacher && enrolledSubjects.length > 0) {
      setSubjects(enrolledSubjects);
    }
  }, [isTeacher, enrolledSubjects]);

  // ── Fetch classes + subjects ─────────────────────────────────────────────────
  const fetchClassesAndSubjects = useCallback(async () => {
    if (!profile?.id) return;
    try {
      if (isSuperAdmin) {
        const [{ data: allClasses }, { data: allSubjects }] = await Promise.all([
          supabase.from('classes').select('id, name').order('name'),
          supabase.from('subjects').select('id, name').eq('is_active', true).order('name'),
        ]);
        setClasses(allClasses || []);
        setSubjects(allSubjects || []);
      } else if (isTeacher) {
        const { data, error } = await supabase
          .from('teacher_subject_enrollments')
          .select('class_id, subject_id, classes(id, name), subjects(id, name)')
          .eq('teacher_id', profile.id)
          .eq('is_active', true);
        if (error) throw error;
        const uniqueClasses = Array.from(
          new Map(data?.map((i: any) => i.classes).filter(Boolean).map((c: any) => [c.id, c])).values()
        ) as any[];
        const uniqueSubjects = Array.from(
          new Map(data?.map((i: any) => i.subjects).filter(Boolean).map((s: any) => [s.id, s])).values()
        ) as any[];
        setClasses(uniqueClasses);
        setSubjects(uniqueSubjects);
      } else if (student?.id) {
        // Student: fetch their enrolled subjects
        const { data, error } = await supabase
          .from('student_subject_enrollments')
          .select('subject_id, subjects(id, name)')
          .eq('student_id', student.id)
          .eq('is_active', true);
        if (error) throw error;
        const uniqueSubjects = Array.from(
          new Map((data || []).map((e: any) => e.subjects).filter(Boolean).map((s: any) => [s.id, s])).values()
        ) as any[];
        setSubjects(uniqueSubjects);
      }
    } catch (error) { showError(error); }
  }, [profile?.id, isSuperAdmin, isTeacher, student?.id]);

  const getSubjectsForClass = useCallback(async (classId: string) => {
    if (!classId || !profile?.id) return [];
    try {
      // Step 1: get all subjects for this class from classes_subjects
      const { data: classSubjects, error: csError } = await supabase
        .from('classes_subjects')
        .select('subject_id, subjects(id, name)')
        .eq('class_id', classId)
        .eq('is_active', true);
      if (csError) throw csError;
      const allSubjects = (classSubjects || []).map((i: any) => i.subjects).filter(Boolean);

      if (isSuperAdmin) {
        return Array.from(new Map(allSubjects.map((s: any) => [s.id, s])).values()) as any[];
      }

      // Step 2 (teacher): intersect with teacher_subject_enrollments
      const { data: teacherEnrollments, error: teError } = await supabase
        .from('teacher_subject_enrollments')
        .select('subject_id')
        .eq('teacher_id', profile.id)
        .eq('class_id', classId)
        .eq('is_active', true);
      if (teError) throw teError;
      const teacherSubjectIds = new Set((teacherEnrollments || []).map((e: any) => e.subject_id));
      return allSubjects.filter((s: any) => teacherSubjectIds.has(s.id)) as any[];
    } catch { return []; }
  }, [profile?.id, isSuperAdmin]);

  const fetchSubjectsForClass = useCallback(async (classId: string) => {
    const subs = await getSubjectsForClass(classId);
    setSubjects(subs);
  }, [getSubjectsForClass]);

  useEffect(() => { fetchClassesAndSubjects(); }, [profile?.id, student?.id]);

  // ── Refresh ──────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      await fetchClassesAndSubjects();
    } catch (e) { showError(e); }
    finally { setRefreshing(false); }
  }, [refetch, fetchClassesAndSubjects]);

  useFocusEffect(useCallback(() => {
    if (pendingNavigation.quizId) {
      pendingQuizIdRef.current = pendingNavigation.quizId;
      pendingNavigation.quizId = null;
    }
    if (pendingNavigation.quizMarkedResultId) {
      pendingResultIdRef.current = pendingNavigation.quizMarkedResultId;
      pendingNavigation.quizMarkedResultId = null;
    }
    refetch();
    fetchClassesAndSubjects();
  }, [profile?.id]));

  // AppState: handles background→foreground when exams is already the active tab
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        if (pendingNavigation.quizId) {
          pendingQuizIdRef.current = pendingNavigation.quizId;
          pendingNavigation.quizId = null;
        }
        if (pendingNavigation.quizMarkedResultId) {
          pendingResultIdRef.current = pendingNavigation.quizMarkedResultId;
          pendingNavigation.quizMarkedResultId = null;
        }
      }
    });
    return () => sub.remove();
  }, []);

  // Open QuizDetailModal when quizzes load and we have a pending quiz id
  useEffect(() => {
    if (!pendingQuizIdRef.current || quizzes.length === 0) return;
    const found = quizzes.find(q => q.id === pendingQuizIdRef.current);
    if (found) {
      pendingQuizIdRef.current = null;
      setDetailQuiz(found);
    }
  }, [quizzes]);

  // Open StudentMarkModal when quizResults load and we have a pending result id
  useEffect(() => {
    if (!pendingResultIdRef.current || quizResults.length === 0) return;
    const found = quizResults.find(r => r.id === pendingResultIdRef.current);
    if (found) {
      pendingResultIdRef.current = null;
      setStudentMarkResult(found);
    }
  }, [quizResults]);

  // ── Filter sheet sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (filterVisible) {
      setPendingClass(filterClass);
      setPendingSubject(filterSubject);
      setExpandedSection(null);
      if (filterClass) fetchSubjectsForClass(filterClass);
      else fetchClassesAndSubjects();
    }
  }, [filterVisible]);

  const handleModalClassSelect = (classId: string | null) => {
    setPendingClass(classId);
    setPendingSubject(null);
    setExpandedSection(null);
    if (classId) fetchSubjectsForClass(classId);
    else fetchClassesAndSubjects();
  };

  const applyFilter = () => {
    setFilterClass(pendingClass);
    setFilterSubject(pendingSubject);
    setFilterVisible(false);
  };

  const resetFilter = () => {
    setPendingClass(null); setPendingSubject(null);
    setFilterClass(null); setFilterSubject(null);
    setFilterVisible(false);
  };

  // ── Filtered quizzes (teacher sees only their own) ───────────────────────────
  const displayQuizzes = useMemo(() => quizzes.filter(q => {
    if (isTeacher && q.created_by !== profile?.id) return false;
    if (filterClass && q.class_id !== filterClass) return false;
    if (filterSubject && q.subject_id !== filterSubject) return false;
    return true;
  }), [quizzes, filterClass, filterSubject, profile?.id, isTeacher]);

  const isFiltered = filterClass !== null || filterSubject !== null;

  // For student "My Results" modal — filter results to match the active subject filter
  const filteredStudentResults = useMemo(() => {
    if (!filterSubject) return quizResults;
    const filteredIds = new Set(displayQuizzes.map(q => q.id));
    return quizResults.filter(r => filteredIds.has(r.quiz_id));
  }, [quizResults, displayQuizzes, filterSubject]);

  const openResults = () => { setFilterVisible(false); setResultsVisible(true); };
  const openMarking = () => { setFilterVisible(false); setBulkMarkingVisible(true); };


  // ── Filter bottom sheet ──────────────────────────────────────────────────────
  const renderFilterSheet = () => {
    const selectedClassName = pendingClass ? classes.find(c => c.id === pendingClass)?.name : 'All Classes';
    const selectedSubjectName = pendingSubject ? subjects.find(s => s.id === pendingSubject)?.name : 'All Subjects';
    const hasChanges = pendingClass !== null || pendingSubject !== null;

    return (
      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)} statusBarTranslucent presentationStyle="overFullScreen">
        <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[s.bottomSheet, { backgroundColor: colors.cardBackground }]}>
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />

          {/* Action buttons — teacher only */}
          {isTeacher && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: colors.primary }]}
                onPress={() => { setFilterVisible(false); setCreateModalVisible(true); }}>
                <Plus size={15} color={colors.primary} />
                <Text allowFontScaling={false} style={[s.actionBtnText, { color: colors.primary }]}>Add Quiz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: '#F59E0B' }]}
                onPress={openMarking}>
                <PenLine size={15} color='#F59E0B' />
                <Text allowFontScaling={false} style={[s.actionBtnText, { color: '#F59E0B' }]}>Marking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: colors.border }]}
                onPress={openResults}>
                <Award size={15} color={colors.text} />
                <Text allowFontScaling={false} style={[s.actionBtnText, { color: colors.text }]}>Results</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* My Results button — student only */}
          {!isTeacher && (
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.actionBtn, { borderColor: colors.primary }]}
                onPress={() => { setFilterVisible(false); setStudentResultsVisible(true); }}>
                <Award size={15} color={colors.primary} />
                <Text allowFontScaling={false} style={[s.actionBtnText, { color: colors.primary }]}>My Results</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.sheetHeader}>
            <Text allowFontScaling={false} style={[s.sheetTitle, { color: colors.text }]}>Filter Quizzes</Text>
            {hasChanges && (
              <TouchableOpacity onPress={resetFilter}>
                <Text allowFontScaling={false} style={[s.resetText, { color: '#EF4444' }]}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={s.sheetScroll} showsVerticalScrollIndicator={false}>
            {/* Class accordion */}
            {isTeacher && (
              <>
                <TouchableOpacity
                  style={[s.accordionHeader, { borderColor: colors.border }]}
                  onPress={() => setExpandedSection(prev => prev === 'class' ? null : 'class')}>
                  <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Class</Text>
                  <View style={s.accordionRight}>
                    <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedClassName}</Text>
                    <ChevronRight size={16} color={colors.textSecondary}
                      style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'class' ? '270deg' : '90deg' }] }} />
                  </View>
                </TouchableOpacity>
                {expandedSection === 'class' && (
                  <View style={[s.accordionBody, { borderColor: colors.border }]}>
                    <TouchableOpacity style={[s.sheetOption, { borderBottomColor: colors.border }]} onPress={() => handleModalClassSelect(null)}>
                      <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>All Classes</Text>
                      {pendingClass === null && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                    {classes.map(c => (
                      <TouchableOpacity key={c.id} style={[s.sheetOption, { borderBottomColor: colors.border }]} onPress={() => handleModalClassSelect(c.id)}>
                        <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>{c.name}</Text>
                        {pendingClass === c.id && <Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Subject accordion */}
            <TouchableOpacity
              style={[s.accordionHeader, { borderColor: colors.border }]}
              onPress={() => setExpandedSection(prev => prev === 'subject' ? null : 'subject')}>
              <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Subject</Text>
              <View style={s.accordionRight}>
                <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedSubjectName}</Text>
                <ChevronRight size={16} color={colors.textSecondary}
                  style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'subject' ? '270deg' : '90deg' }] }} />
              </View>
            </TouchableOpacity>
            {expandedSection === 'subject' && (
              <View style={[s.accordionBody, { borderColor: colors.border }]}>
                <TouchableOpacity style={[s.sheetOption, { borderBottomColor: colors.border }]} onPress={() => { setPendingSubject(null); setExpandedSection(null); }}>
                  <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>All Subjects</Text>
                  {pendingSubject === null && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
                {subjects.map(sub => (
                  <TouchableOpacity key={sub.id} style={[s.sheetOption, { borderBottomColor: colors.border }]} onPress={() => { setPendingSubject(sub.id); setExpandedSection(null); }}>
                    <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>{sub.name}</Text>
                    {pendingSubject === sub.id && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={[s.applyBtn, { backgroundColor: colors.primary }]} onPress={applyFilter}>
            <Text allowFontScaling={false} style={s.applyBtnText}>Apply Filter</Text>
          </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // ── Quiz edit / delete ───────────────────────────────────────────────────────
  const handleEditQuiz = (quiz: any) => {
    if (!isSuperAdmin) return;
    setEditingQuiz(quiz);
    setCreateModalVisible(true);
  };

  const handleDeleteQuiz = (quiz: any) => {
    showConfirm({
      title: 'Delete Quiz',
      message: `Delete "${quiz.title}"? This will also remove all student results.`,
      confirmText: 'Delete',
      destructive: true,
      onConfirm: async () => {
        const result = await deleteQuiz(quiz.id);
        if (!result.success) showError(result.error);
      },
    });
  };

  // ── Student: view marks for a quiz ──────────────────────────────────────────
  const handleViewStudentMark = useCallback((quiz: any) => {
    const result = quizResults.find(r => r.quiz_id === quiz.id && r.is_checked);
    if (result) setStudentMarkResult(result);
  }, [quizResults]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[s.container, { backgroundColor: colors.background }, screenStyle]}>
      <TopSections onFilterPress={() => setFilterVisible(true)} isFiltered={isFiltered} />
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>

        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, visible: false })}
        />

        {renderFilterSheet()}

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {loading ? (
            [...Array(4)].map((_, i) => (
              <View key={i} style={[s.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <SkeletonBox width="55%" height={12} borderRadius={6} />
                  <SkeletonBox width={64} height={20} borderRadius={10} />
                </View>
                <SkeletonBox width="35%" height={10} borderRadius={5} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <SkeletonBox width={80} height={10} borderRadius={5} />
                  <SkeletonBox width={60} height={10} borderRadius={5} />
                  <SkeletonBox width={70} height={10} borderRadius={5} />
                </View>
              </View>
            ))
          ) : displayQuizzes.length === 0 ? (
            <View style={s.emptyContainer}>
              <FileText size={48} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.emptyTitle, { color: colors.text }]}>No quizzes found</Text>
              <Text allowFontScaling={false} style={[s.emptySubtitle, { color: colors.textSecondary }]}>
                {isTeacher ? 'Tap the filter button to add a quiz' : 'Check back later for upcoming quizzes'}
              </Text>
            </View>
          ) : (
            displayQuizzes.map(quiz => (
              <SwipeableQuizCard
                key={quiz.id}
                quiz={quiz}
                colors={colors}
                canSwipe={isTeacher}
                canEdit={isSuperAdmin}
                isOpen={openCardId === quiz.id}
                onSwipeOpen={(id) => setOpenCardId(id)}
                onSwipeClose={() => setOpenCardId(null)}
                onGestureStart={() => setScrollEnabled(false)}
                onGestureEnd={() => setScrollEnabled(true)}
                onEdit={handleEditQuiz}
                onDelete={handleDeleteQuiz}
                onPress={(q) => setDetailQuiz(q)}
                onViewMarks={!isTeacher ? handleViewStudentMark : undefined}
                hasMarks={!isTeacher && quizResults.some(r => r.quiz_id === quiz.id && r.is_checked)}
              />
            ))
          )}
        </ScrollView>

        {/* Results modal — quiz-grouped results */}
        <BulkResultsModal
          colors={colors}
          visible={resultsVisible}
          onClose={() => setResultsVisible(false)}
          quizzes={displayQuizzes}
          quizResults={quizResults}
          classes={classes}
          subjects={subjects}
        />

        {/* Bulk marking modal — mark all students for a quiz at once */}
        {isTeacher && (
          <BulkMarkingModal
            colors={colors}
            visible={bulkMarkingVisible}
            onClose={() => setBulkMarkingVisible(false)}
            quizzes={displayQuizzes}
            quizResults={quizResults}
            classes={classes}
            subjects={subjects}
            bulkMarkQuizResults={bulkMarkQuizResults}
            onRefresh={handleRefresh}
          />
        )}

        <QuizDetailModal
          visible={!!detailQuiz}
          quiz={detailQuiz}
          colors={colors}
          onClose={() => setDetailQuiz(null)}
        />

        <StudentMarkModal
          visible={!!studentMarkResult}
          result={studentMarkResult}
          colors={colors}
          onClose={() => setStudentMarkResult(null)}
        />

        {!isTeacher && (
          <StudentResultsListModal
            visible={studentResultsVisible}
            colors={colors}
            quizResults={filteredStudentResults}
            onClose={() => setStudentResultsVisible(false)}
            onViewResult={(result) => { setStudentResultsVisible(false); setStudentMarkResult(result); }}
          />
        )}

        {isTeacher && (
          <CreateQuizModal
            colors={colors}
            isDark={isDark}
            modalVisible={createModalVisible}
            setModalVisible={(v) => { setCreateModalVisible(v); if (!v) setEditingQuiz(null); }}
            subjects={subjects}
            classes={classes}
            selectedClass={filterClass || ''}
            createQuiz={createQuiz}
            updateQuiz={updateQuiz}
            editingQuiz={editingQuiz}
            getSubjectsForClass={getSubjectsForClass}
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  // empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: TextSizes.large, fontFamily: 'Inter-SemiBold', marginTop: 16 },
  emptySubtitle: { fontSize: TextSizes.normal, fontFamily: 'Inter-Regular', textAlign: 'center', paddingHorizontal: 40, marginTop: 8 },

  // skeleton card placeholder (matches SwipeableQuizCard dimensions)
  card: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },

  // bottom sheet
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 32, height: height * 0.45 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },

  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 10, borderWidth: 1, gap: 6,
  },
  actionBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  sheetTitle: { flex: 1, fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
  resetText: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium' },
  sheetScroll: { flex: 1 },

  accordionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1,
  },
  accordionLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', flex: 1 },
  accordionValue: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
  accordionRight: { flexDirection: 'row', alignItems: 'center' },
  accordionBody: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', flex: 1 },

  applyBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  applyBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold', color: '#ffffff' },

});
