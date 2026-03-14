// screens/DiaryScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { uploadToCloudinary } from '@/src/lib/cloudinary';
import * as DocumentPicker from 'expo-document-picker';
import { Plus, BookOpen, ChevronRight, Check } from 'lucide-react-native';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import TopSections from '@/src/components/common/TopSections';
import { SwipeableAssignmentCard } from '../dairy/SwipeableAssignmentCard';
import { AssignmentDetailModal } from '../dairy/AssignmentDetailModal';
import { CreateAssignmentModal } from '../dairy/CreateAssignmentModal';
import { EditAssignmentModal } from '../dairy/EditAssignmentModal';
import { useDiaryAssignments } from '@/src/hooks/useDiaryAssignments';
import { useDiaryFilters } from '../../hooks/useDiaryFilters';
import { useDiaryForm } from '../../hooks//useDiaryForm';
import styles from '../dairy/styles';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenAnimation } from '@/src/utils/animations';
import { Animated } from 'react-native';
import {
  handleClassFetchErrorForDiary,
  handleSubjectFetchErrorForDiary,
  handleStudentFetchErrorForDiary,
  handleAssignmentCreateError,
  handleAssignmentUpdateError,
  handleFileDownloadErrorForDiary,
} from '@/src/utils/errorHandler/diaryErrorHandler';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';
import { TextSizes } from '@/src/styles/TextSizes';

const { height } = Dimensions.get('window');

type DateFilter = 'all' | 'today' | 'week' | 'overdue';

interface DiaryAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  file_url?: string;
  class_id?: string;
  student_id?: string;
  subject_id?: string;
  created_at: string;
  classes?: { name: string };
  students?: { full_name: string };
  subjects?: { name: string };
}

export default function DiaryScreen() {
  const { profile, student } = useAuth();
  const { colors } = useTheme();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<DiaryAssignment | null>(null);
  const screenStyle = useScreenAnimation();

  // Filter bottom sheet state
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterStep, setFilterStep] = useState<'class' | 'subject'>('class');
  const [pendingClass, setPendingClass] = useState<string | null>(null);
  const [pendingSubject, setPendingSubject] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<DateFilter>('all');
  const [selectedDate, setSelectedDate] = useState<DateFilter>('all');

  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const showError = (error: any, handler?: (error: any) => any) => {
    const errorInfo = handler ? handler(error) : handleError(error);
    setErrorModal({ visible: true, title: errorInfo.title, message: errorInfo.message });
  };

  // Custom Hooks
  const { assignments, studentsMap, loading, refreshing, fetchAssignments, deleteAssignment, handleRefresh } =
    useDiaryAssignments(profile, student);

  const {
    selectedClass: filterClass,
    setSelectedClass: setFilterClass,
    selectedSubject,
    setSelectedSubject,
    filteredAssignments,
  } = useDiaryFilters(assignments, profile);

  const { uploading, editingAssignment, setEditingAssignment, newAssignment, setNewAssignment, resetForm, createAssignment } =
    useDiaryForm(profile, fetchAssignments);

  // Sync pending state when filter modal opens
  useEffect(() => {
    if (filterVisible) {
      setPendingClass(filterClass);
      setPendingSubject(selectedSubject);
      setPendingDate(selectedDate);
      setFilterStep('class');
    }
  }, [filterVisible]);

  // When teacher changes class filter, reload subjects for that class
  useEffect(() => {
    setSelectedSubject(null);
    if (profile?.role === 'teacher') {
      if (filterClass) fetchSubjectsForClass(filterClass);
      else fetchTeacherSubjects();
    }
  }, [filterClass]);

  // Fetch initial data
  useEffect(() => {
    fetchAssignments();
    if (profile?.role === 'teacher' || profile?.role === 'admin') fetchClasses();
  }, [profile]);

  // Fetch subjects
  useEffect(() => {
    if (profile?.role === 'student' && student?.class_id) fetchSubjects();
    else if (profile?.role === 'teacher' || profile?.role === 'admin') fetchTeacherSubjects();
  }, [profile, student?.class_id]);

  // Auto refresh on focus
  useFocusEffect(useCallback(() => { handleRefresh(); }, [profile]));

  // Apply date filter on top of class/subject filtered assignments
  const displayAssignments = useMemo(() => {
    return filteredAssignments.filter(a => {
      if (selectedDate === 'all') return true;
      const due = new Date(a.due_date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (selectedDate === 'today') {
        const dueDay = new Date(due);
        dueDay.setHours(0, 0, 0, 0);
        return dueDay.getTime() === now.getTime();
      }
      if (selectedDate === 'week') {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        return due >= now && due <= weekEnd;
      }
      if (selectedDate === 'overdue') return due < now;
      return true;
    });
  }, [filteredAssignments, selectedDate]);

  const isFiltered = filterClass !== null || selectedSubject !== null || selectedDate !== 'all';

  const applyDiaryFilter = () => {
    setFilterClass(pendingClass);
    setSelectedSubject(pendingSubject);
    setSelectedDate(pendingDate);
    setFilterVisible(false);
  };

  const resetDiaryFilter = () => {
    setPendingClass(null);
    setPendingSubject(null);
    setPendingDate('all');
    setFilterClass(null);
    setSelectedSubject(null);
    setSelectedDate('all');
    setFilterVisible(false);
  };

  const handleModalClassSelect = (classId: string | null) => {
    setPendingClass(classId);
    setPendingSubject(null);
    setFilterStep('subject');
    if (classId) fetchSubjectsForClass(classId);
    else fetchTeacherSubjects();
  };

  const fetchTeacherSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_subject_enrollments')
        .select('subject_id, subjects (id, name)')
        .eq('teacher_id', profile?.id)
        .eq('is_active', true);
      if (error) throw error;
      const uniqueSubjects = Array.from(
        new Map(data?.map(item => item.subjects).filter(Boolean).map((s: any) => [s.id, s])).values()
      );
      setSubjects(uniqueSubjects);
    } catch (error) {
      showError(error, handleSubjectFetchErrorForDiary);
      setSubjects([]);
    }
  };

  const fetchSubjectsForClass = async (classId: string) => {
    try {
      if (!classId) { setSubjects([]); return; }
      const { data, error } = await supabase
        .from('teacher_subject_enrollments')
        .select('subjects (id, name)')
        .eq('teacher_id', profile?.id)
        .eq('class_id', classId)
        .eq('is_active', true);
      if (error) throw error;
      const uniqueSubjects = Array.from(
        new Map(data?.map(item => item.subjects).filter(Boolean).map((s: any) => [s.id, s])).values()
      );
      setSubjects(uniqueSubjects);
    } catch (error) {
      showError(error, handleSubjectFetchErrorForDiary);
      setSubjects([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      if (!student?.id) return;
      const { data, error } = await supabase
        .from('student_subject_enrollments')
        .select('subjects (id, name)')
        .eq('student_id', student.id)
        .eq('is_active', true);
      if (error) throw error;
      setSubjects(data?.map((item: any) => item.subjects).filter(Boolean) || []);
    } catch (error) {
      showError(error, handleSubjectFetchErrorForDiary);
      setSubjects([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_subject_enrollments')
        .select('classes (id, name)')
        .eq('teacher_id', profile?.id)
        .eq('is_active', true);
      if (error) throw error;
      const uniqueClasses = Array.from(
        new Map(data?.map((item: any) => item.classes).filter(Boolean).map((c: any) => [c.id, c])).values()
      );
      setClasses(uniqueClasses);
    } catch (error) {
      showError(error, handleClassFetchErrorForDiary);
      setClasses([]);
    }
  };

  const fetchStudents = async (classId: string, subjectId?: string) => {
    try {
      const sid = subjectId ?? newAssignment.subject_id;
      if (!sid) { setStudents([]); return; }
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from('student_subject_enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('subject_id', sid)
        .eq('is_active', true);
      if (enrollError) throw enrollError;
      const studentIds = enrollmentsData?.map((e: any) => e.student_id) || [];
      if (studentIds.length === 0) { setStudents([]); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds)
        .eq('role', 'student')
        .order('full_name');
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      showError(error, handleStudentFetchErrorForDiary);
      setStudents([]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) setNewAssignment(prev => ({ ...prev, file: result.assets[0] }));
    } catch (error) {
      showError(error, handleFileDownloadErrorForDiary);
    }
  };

  const handleEditAssignment = (assignment: DiaryAssignment) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      class_id: assignment.class_id || '',
      student_ids: (assignment as any).student_ids || [],
      assignTo: ((assignment as any).student_ids?.length > 0) ? 'students' : 'class',
      file: null,
      subject_id: assignment.subject_id || '',
    });
    setEditModalVisible(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;
    if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      let fileUrl: string | undefined = editingAssignment.file_url;
      if (newAssignment.file) {
        const uploadResult = await uploadToCloudinary(newAssignment.file, 'raw');
        fileUrl = uploadResult.secure_url;
      }
      const updateData: any = {
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.due_date,
        file_url: fileUrl,
        class_id: newAssignment.class_id || null,
        student_ids: newAssignment.assignTo === 'students' ? newAssignment.student_ids : [],
        subject_id: newAssignment.subject_id || null,
      };
      const { error } = await (supabase.from('diary_assignments') as any).update(updateData).eq('id', editingAssignment.id);
      if (error) throw error;
      alert('Assignment updated successfully');
      setEditModalVisible(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      showError(error, handleAssignmentUpdateError);
    }
  };

  const handleDetailPress = (assignment: DiaryAssignment) => {
    setSelectedAssignment(assignment);
    setDetailModalVisible(true);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
      alert('Please fill in all required fields');
      return;
    }
    if (!newAssignment.class_id) { alert('Please select a class'); return; }
    if (newAssignment.assignTo === 'students' && newAssignment.student_ids.length === 0) { alert('Please select at least one student'); return; }
    try {
      let fileUrl: string | undefined;
      if (newAssignment.file) {
        const uploadResult = await uploadToCloudinary(newAssignment.file, 'raw');
        fileUrl = uploadResult.secure_url;
      }
      const assignmentData: any = {
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.due_date,
        file_url: fileUrl,
        class_id: newAssignment.class_id || null,
        student_ids: newAssignment.assignTo === 'students' ? newAssignment.student_ids : [],
        subject_id: newAssignment.subject_id || null,
        assigned_by: profile?.id,
      };
      const { error } = await (supabase.from('diary_assignments') as any).insert([assignmentData]);
      if (error) throw error;
      alert('Assignment created successfully');
      setModalVisible(false);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      showError(error, handleAssignmentCreateError);
    }
  };

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';

  const renderFilterModal = () => (
    <Modal
      visible={filterVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setFilterVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
        <View style={localStyles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View style={[localStyles.bottomSheet, { backgroundColor: colors.cardBackground }]}>
        {/* Handle */}
        <View style={[localStyles.sheetHandle, { backgroundColor: colors.border }]} />

        {/* Add Assignment (teacher only) */}
        {isTeacher && (
          <TouchableOpacity
            style={[localStyles.addAssignmentBtn, { borderColor: colors.primary }]}
            onPress={() => { setFilterVisible(false); resetForm(); setModalVisible(true); }}
          >
            <Plus size={18} color={colors.primary} />
            <Text allowFontScaling={false} style={[localStyles.addAssignmentText, { color: colors.primary }]}>
              Add New Assignment
            </Text>
          </TouchableOpacity>
        )}

        {/* Sheet header */}
        <View style={localStyles.sheetHeader}>
          {isTeacher && filterStep === 'subject' && (
            <TouchableOpacity onPress={() => setFilterStep('class')} style={localStyles.backBtn}>
              <ChevronRight size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          )}
          <Text allowFontScaling={false} style={[localStyles.sheetTitle, { color: colors.text }]}>
            {isTeacher
              ? filterStep === 'class' ? 'Select Class' : 'Select Subject'
              : 'Filter Assignments'}
          </Text>
          {(pendingClass !== null || pendingSubject !== null || pendingDate !== 'all') && (
            <TouchableOpacity onPress={resetDiaryFilter}>
              <Text allowFontScaling={false} style={[localStyles.resetText, { color: '#EF4444' }]}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={localStyles.sheetScroll} showsVerticalScrollIndicator={false}>
          {/* Class / Subject list */}
          {isTeacher ? (
            filterStep === 'class' ? (
              <>
                <TouchableOpacity
                  style={[localStyles.sheetOption, { borderBottomColor: colors.border }]}
                  onPress={() => handleModalClassSelect(null)}
                >
                  <Text allowFontScaling={false} style={[localStyles.sheetOptionText, { color: colors.text }]}>All Classes</Text>
                  <View style={localStyles.sheetOptionRight}>
                    {pendingClass === null && <Check size={16} color={colors.primary} />}
                    <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>
                {classes.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[localStyles.sheetOption, { borderBottomColor: colors.border }]}
                    onPress={() => handleModalClassSelect(c.id)}
                  >
                    <Text allowFontScaling={false} style={[localStyles.sheetOptionText, { color: colors.text }]}>{c.name}</Text>
                    <View style={localStyles.sheetOptionRight}>
                      {pendingClass === c.id && <Check size={16} color={colors.primary} />}
                      <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[localStyles.sheetOption, { borderBottomColor: colors.border }]}
                  onPress={() => setPendingSubject(null)}
                >
                  <Text allowFontScaling={false} style={[localStyles.sheetOptionText, { color: colors.text }]}>All Subjects</Text>
                  {pendingSubject === null && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
                {subjects.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[localStyles.sheetOption, { borderBottomColor: colors.border }]}
                    onPress={() => setPendingSubject(s.id)}
                  >
                    <Text allowFontScaling={false} style={[localStyles.sheetOptionText, { color: colors.text }]}>{s.name}</Text>
                    {pendingSubject === s.id && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </>
            )
          ) : (
            // Student: subject filter
            <>
              <TouchableOpacity
                style={[localStyles.sheetOption, { borderBottomColor: colors.border }]}
                onPress={() => setPendingSubject(null)}
              >
                <Text allowFontScaling={false} style={[localStyles.sheetOptionText, { color: colors.text }]}>All Subjects</Text>
                {pendingSubject === null && <Check size={16} color={colors.primary} />}
              </TouchableOpacity>
              {subjects.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[localStyles.sheetOption, { borderBottomColor: colors.border }]}
                  onPress={() => setPendingSubject(s.id)}
                >
                  <Text allowFontScaling={false} style={[localStyles.sheetOptionText, { color: colors.text }]}>{s.name}</Text>
                  {pendingSubject === s.id && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Date filter — always visible */}
          <View style={[localStyles.dateSectionHeader, { borderTopColor: colors.border }]}>
            <Text allowFontScaling={false} style={[localStyles.dateSectionTitle, { color: colors.textSecondary }]}>
              Filter by Date
            </Text>
          </View>
          <View style={localStyles.dateChips}>
            {(['all', 'today', 'week', 'overdue'] as DateFilter[]).map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  localStyles.dateChip,
                  { borderColor: colors.border, backgroundColor: colors.cardBackground },
                  pendingDate === opt && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setPendingDate(opt)}
              >
                <Text
                  allowFontScaling={false}
                  style={[localStyles.dateChipText, { color: pendingDate === opt ? '#fff' : colors.text }]}
                >
                  {opt === 'all' ? 'All' : opt === 'today' ? 'Today' : opt === 'week' ? 'This Week' : 'Overdue'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Apply button */}
        <TouchableOpacity
          style={[localStyles.applyBtn, { backgroundColor: colors.primary }]}
          onPress={applyDiaryFilter}
        >
          <Text allowFontScaling={false} style={localStyles.applyBtnText}>Apply Filter</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSections
        onFilterPress={() => setFilterVisible(true)}
        isFiltered={isFiltered}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, visible: false })}
        />
        {renderFilterModal()}

        {/* Assignments List */}
        <ScrollView
          style={[styles.scrollView, { paddingHorizontal: 16 }]}
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
            <>
              {[...Array(5)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    skeletonStyles.card,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  ]}
                >
                  {/* Icon + title + meta row */}
                  <View style={skeletonStyles.cardHeader}>
                    <SkeletonBox width={40} height={40} borderRadius={8} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <SkeletonBox width="65%" height={12} borderRadius={6} style={{ marginBottom: 8 }} />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <SkeletonBox width={56} height={10} borderRadius={5} />
                        <SkeletonBox width={56} height={10} borderRadius={5} />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <SkeletonBox width={72} height={10} borderRadius={5} />
                        <SkeletonBox width={72} height={10} borderRadius={5} />
                      </View>
                    </View>
                  </View>
                  {/* Description lines */}
                  <SkeletonBox width="100%" height={10} borderRadius={5} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="75%" height={10} borderRadius={5} style={{ marginBottom: 12 }} />
                  {/* Attachment button */}
                  <SkeletonBox width="100%" height={34} borderRadius={8} />
                </View>
              ))}
            </>
          ) : displayAssignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>
                No assignments yet
              </Text>
              <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {isTeacher
                  ? 'Create your first assignment to get started'
                  : 'Your assignments will appear here'}
              </Text>
            </View>
          ) : (
            displayAssignments.map(assignment => (
              <SwipeableAssignmentCard
                key={assignment.id}
                assignment={assignment}
                colors={colors}
                isTeacher={isTeacher}
                isOpen={openCardId === assignment.id}
                onSwipeOpen={(id) => setOpenCardId(id)}
                onSwipeClose={() => setOpenCardId(null)}
                onGestureStart={() => setScrollEnabled(false)}
                onGestureEnd={() => setScrollEnabled(true)}
                onEdit={handleEditAssignment}
                onDelete={deleteAssignment}
                onPress={handleDetailPress}
                isOverdue={isOverdue}
                formatDate={formatDate}
              />
            ))
          )}
        </ScrollView>

        {/* Create Assignment Modal */}
        {isTeacher && (
          <CreateAssignmentModal
            visible={modalVisible}
            onClose={() => { setModalVisible(false); resetForm(); }}
            colors={colors}
            newAssignment={newAssignment}
            setNewAssignment={setNewAssignment}
            classes={classes}
            students={students}
            subjects={subjects}
            uploading={uploading}
            onSubmit={handleCreateAssignment}
            pickDocument={pickDocument}
            fetchStudents={fetchStudents}
            fetchSubjectsForClass={fetchSubjectsForClass}
            showError={showError}
          />
        )}

        {/* Edit Assignment Modal */}
        {isTeacher && (
          <EditAssignmentModal
            visible={editModalVisible}
            onClose={() => { setEditModalVisible(false); setEditingAssignment(null); resetForm(); }}
            colors={colors}
            newAssignment={newAssignment}
            setNewAssignment={setNewAssignment}
            uploading={uploading}
            onSubmit={handleUpdateAssignment}
            pickDocument={pickDocument}
          />
        )}

        {/* Assignment Detail Modal */}
        <AssignmentDetailModal
          visible={detailModalVisible}
          assignment={selectedAssignment}
          onClose={() => { setDetailModalVisible(false); setSelectedAssignment(null); }}
          colors={colors}
          isOverdue={isOverdue}
          formatDate={formatDate}
          studentsMap={studentsMap}
        />
      </SafeAreaView>
    </Animated.View>
  );
}

const localStyles = StyleSheet.create({
  // ── Bottom sheet ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: height * 0.65,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  addAssignmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  addAssignmentText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backBtn: {
    marginRight: 8,
    padding: 2,
  },
  sheetTitle: {
    flex: 1,
    fontSize: TextSizes.sectionTitle,
    fontFamily: 'Inter-SemiBold',
  },
  resetText: {
    fontSize: TextSizes.filterLabel,
    fontFamily: 'Inter-Medium',
  },
  sheetScroll: {
    maxHeight: height * 0.38,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetOptionText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  sheetOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  dateSectionTitle: {
    fontSize: TextSizes.filterLabel,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateChipText: {
    fontSize: TextSizes.filterLabel,
    fontFamily: 'Inter-Medium',
  },
  applyBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});

const skeletonStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
});
