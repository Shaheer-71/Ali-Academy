// src/components/screens/LecturesScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { BookOpen, Plus, ChevronRight, Check } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { lectureService } from '@/src/services/lecture.service';
import { supabase } from '@/src/lib/supabase';
import { Lecture } from '@/src/types/lectures';
import LectureCard from '@/src/components/lectures/LectureCard';
import UploadLectureModal from '@/src/components/lectures/UploadLectureModal';
import TopSections from '@/src/components/common/TopSections';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenAnimation } from '@/src/utils/animations';
import {
  handleLectureFetchError,
  handleSubjectFetchErrorForLectures,
} from '@/src/utils/errorHandler/lectureErrorHandler';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';
import { TextSizes } from '@/src/styles/TextSizes';

const { height } = Dimensions.get('window');

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function LecturesScreen() {
  const { profile, student } = useAuth();
  const { colors } = useTheme();
  const screenStyle = useScreenAnimation();

  // Data
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // Filter bottom sheet
  const [filterVisible, setFilterVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'class' | 'subject' | 'date' | null>(null);

  // Applied filters
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<DateFilter>('all');

  // Pending (in-modal) filters
  const [pendingClass, setPendingClass] = useState<string | null>(null);
  const [pendingSubject, setPendingSubject] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState<DateFilter>('all');

  // Filter data
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Swipe coordination
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Error modal
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const showError = (error: any, handler?: (error: any) => any) => {
    const info = handler ? handler(error) : handleError(error);
    setErrorModal({ visible: true, title: info.title, message: info.message });
  };

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin';

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadLectures = useCallback(async () => {
    if (!profile?.id || !profile?.role) return;
    try {
      setLoading(true);
      const data = await lectureService.fetchLectures({
        userId: profile.role === 'student' ? student?.id : profile.id,
        role: profile.role,
      });
      setLectures(data || []);
    } catch (error) {
      showError(error, handleLectureFetchError);
      setLectures([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id, profile?.role, student?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLectures();
  }, [loadLectures]);

  useEffect(() => { loadLectures(); }, [profile?.id, profile?.role]);

  useFocusEffect(useCallback(() => { loadLectures(); }, [profile?.id, profile?.role]));

  // ── Filter data fetch ────────────────────────────────────────────────────────

  const isSuperAdmin = profile?.role === 'superadmin';

  const fetchClasses = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const { data, error } = await supabase.from('classes').select('id, name').order('name');
        if (error) throw error;
        setClasses(data || []);
      } else {
        const { data, error } = await supabase
          .from('teacher_subject_enrollments')
          .select('classes (id, name)')
          .eq('teacher_id', profile?.id)
          .eq('is_active', true);
        if (error) throw error;
        const unique = Array.from(
          new Map(data?.map((i: any) => i.classes).filter(Boolean).map((c: any) => [c.id, c])).values()
        );
        setClasses(unique);
      }
    } catch (error) {
      setClasses([]);
    }
  }, [profile?.id, isSuperAdmin]);

  const fetchTeacherSubjects = useCallback(async () => {
    try {
      if (isSuperAdmin) {
        const { data, error } = await supabase.from('subjects').select('id, name').eq('is_active', true).order('name');
        if (error) throw error;
        setSubjects(data || []);
      } else {
        const { data, error } = await supabase
          .from('teacher_subject_enrollments')
          .select('subject_id, subjects (id, name)')
          .eq('teacher_id', profile?.id)
          .eq('is_active', true);
        if (error) throw error;
        const unique = Array.from(
          new Map(data?.map((i: any) => i.subjects).filter(Boolean).map((s: any) => [s.id, s])).values()
        );
        setSubjects(unique);
      }
    } catch (error) {
      showError(error, handleSubjectFetchErrorForLectures);
      setSubjects([]);
    }
  }, [profile?.id, isSuperAdmin]);

  const fetchSubjectsForClass = useCallback(async (classId: string) => {
    try {
      if (!classId) { setSubjects([]); return; }
      if (isSuperAdmin) {
        const { data, error } = await supabase.from('subjects').select('id, name').eq('is_active', true).order('name');
        if (error) throw error;
        setSubjects(data || []);
        return;
      }
      const { data, error } = await supabase
        .from('teacher_subject_enrollments')
        .select('subjects (id, name)')
        .eq('teacher_id', profile?.id)
        .eq('class_id', classId)
        .eq('is_active', true);
      if (error) throw error;
      const unique = Array.from(
        new Map(data?.map((i: any) => i.subjects).filter(Boolean).map((s: any) => [s.id, s])).values()
      );
      setSubjects(unique);
    } catch (error) {
      showError(error, handleSubjectFetchErrorForLectures);
      setSubjects([]);
    }
  }, [profile?.id]);

  const fetchStudentSubjects = useCallback(async () => {
    try {
      if (!student?.id) return;
      const { data, error } = await supabase
        .from('student_subject_enrollments')
        .select('subjects (id, name)')
        .eq('student_id', student.id)
        .eq('is_active', true);
      if (error) throw error;
      setSubjects(data?.map((i: any) => i.subjects).filter(Boolean) || []);
    } catch (error) {
      showError(error, handleSubjectFetchErrorForLectures);
      setSubjects([]);
    }
  }, [student?.id]);

  useEffect(() => {
    if (isTeacher) { fetchClasses(); fetchTeacherSubjects(); }
    else { fetchStudentSubjects(); }
  }, [profile?.id, profile?.role]);

  // ── Filter modal sync ────────────────────────────────────────────────────────

  useEffect(() => {
    if (filterVisible) {
      setPendingClass(filterClass);
      setPendingSubject(filterSubject);
      setPendingDate(filterDate);
      setExpandedSection(null);
      if (isTeacher && filterClass) fetchSubjectsForClass(filterClass);
      else if (isTeacher) fetchTeacherSubjects();
    }
  }, [filterVisible]);

  const handleModalClassSelect = (classId: string | null) => {
    setPendingClass(classId);
    setPendingSubject(null);
    setExpandedSection(null);
    if (classId) fetchSubjectsForClass(classId);
    else fetchTeacherSubjects();
  };

  const toggleSection = (section: 'class' | 'subject' | 'date') => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const applyFilter = () => {
    setFilterClass(pendingClass);
    setFilterSubject(pendingSubject);
    setFilterDate(pendingDate);
    setFilterVisible(false);
  };

  const resetFilter = () => {
    setPendingClass(null); setPendingSubject(null); setPendingDate('all');
    setFilterClass(null); setFilterSubject(null); setFilterDate('all');
    setFilterVisible(false);
  };

  // ── Filtered lectures ────────────────────────────────────────────────────────

  const displayLectures = useMemo(() => {
    return lectures.filter(l => {
      if (filterClass && l.class_id !== filterClass) return false;
      if (filterSubject && l.subject_id !== filterSubject) return false;
      if (filterDate !== 'all') {
        const created = new Date(l.created_at);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (filterDate === 'today') {
          const d = new Date(created); d.setHours(0, 0, 0, 0);
          return d.getTime() === now.getTime();
        }
        if (filterDate === 'week') {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
          return created >= weekAgo;
        }
        if (filterDate === 'month') {
          const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
          return created >= monthAgo;
        }
      }
      return true;
    });
  }, [lectures, filterClass, filterSubject, filterDate]);

  const isFiltered = filterClass !== null || filterSubject !== null || filterDate !== 'all';

  // ── Edit handlers ────────────────────────────────────────────────────────────

  const handleEdit = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setUploadModalVisible(true);
  };

  const handleModalClose = () => {
    setUploadModalVisible(false);
    setSelectedLecture(null);
  };

  // ── Filter Modal ─────────────────────────────────────────────────────────────

  const renderFilterModal = () => {
    const selectedClassName = pendingClass ? classes.find(c => c.id === pendingClass)?.name : 'All Classes';
    const selectedSubjectName = pendingSubject ? subjects.find(s => s.id === pendingSubject)?.name : 'All Subjects';
    const dateLabels: Record<DateFilter, string> = { all: 'All', today: 'Today', week: 'This Week', month: 'This Month' };

    return (
      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
          <View style={s.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={[s.bottomSheet, { backgroundColor: colors.cardBackground }]}>
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />

          {isTeacher && (
            <TouchableOpacity style={[s.addBtn, { borderColor: colors.primary }]} onPress={() => { setFilterVisible(false); setSelectedLecture(null); setUploadModalVisible(true); }}>
              <Plus size={18} color={colors.primary} />
              <Text allowFontScaling={false} style={[s.addBtnText, { color: colors.primary }]}>Upload Lecture</Text>
            </TouchableOpacity>
          )}

          <View style={s.sheetHeader}>
            <Text allowFontScaling={false} style={[s.sheetTitle, { color: colors.text }]}>Filter Lectures</Text>
            {(pendingClass !== null || pendingSubject !== null || pendingDate !== 'all') && (
              <TouchableOpacity onPress={resetFilter}>
                <Text allowFontScaling={false} style={[s.resetText, { color: '#EF4444' }]}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={s.sheetScroll} showsVerticalScrollIndicator={false}>
            {/* Class accordion — teacher only */}
            {isTeacher && (
              <>
                <TouchableOpacity style={[s.accordionHeader, { borderColor: colors.border }]} onPress={() => toggleSection('class')}>
                  <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Class</Text>
                  <View style={s.accordionRight}>
                    <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedClassName}</Text>
                    <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'class' ? '270deg' : '90deg' }] }} />
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
            <TouchableOpacity style={[s.accordionHeader, { borderColor: colors.border }]} onPress={() => toggleSection('subject')}>
              <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Subject</Text>
              <View style={s.accordionRight}>
                <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedSubjectName}</Text>
                <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'subject' ? '270deg' : '90deg' }] }} />
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

            {/* Date accordion */}
            <TouchableOpacity style={[s.accordionHeader, { borderColor: colors.border }]} onPress={() => toggleSection('date')}>
              <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Date</Text>
              <View style={s.accordionRight}>
                <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{dateLabels[pendingDate]}</Text>
                <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'date' ? '270deg' : '90deg' }] }} />
              </View>
            </TouchableOpacity>
            {expandedSection === 'date' && (
              <View style={[s.accordionBody, { borderColor: colors.border }]}>
                {(['all', 'today', 'week', 'month'] as DateFilter[]).map(opt => (
                  <TouchableOpacity key={opt} style={[s.sheetOption, { borderBottomColor: colors.border }]} onPress={() => { setPendingDate(opt); setExpandedSection(null); }}>
                    <Text allowFontScaling={false} style={[s.sheetOptionText, { color: colors.text }]}>{dateLabels[opt]}</Text>
                    {pendingDate === opt && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={[s.applyBtn, { backgroundColor: colors.primary }]} onPress={applyFilter}>
            <Text allowFontScaling={false} style={s.applyBtnText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[s.container, { backgroundColor: colors.background }, screenStyle]}>
      <TopSections
        onFilterPress={() => setFilterVisible(true)}
        isFiltered={isFiltered}
      />
      <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, visible: false })}
        />

        {renderFilterModal()}

        <ScrollView
          style={{ paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[s.skeletonCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                >
                  <View style={s.skeletonHeader}>
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
                  <SkeletonBox width="100%" height={10} borderRadius={5} style={{ marginBottom: 6 }} />
                  <SkeletonBox width="75%" height={10} borderRadius={5} style={{ marginBottom: 12 }} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <SkeletonBox width="49%" height={34} borderRadius={8} />
                    <SkeletonBox width="49%" height={34} borderRadius={8} />
                  </View>
                </View>
              ))}
            </>
          ) : displayLectures.length === 0 ? (
            <View style={s.emptyContainer}>
              <BookOpen size={48} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.emptyTitle, { color: colors.text }]}>
                No lectures available
              </Text>
              <Text allowFontScaling={false} style={[s.emptySubtitle, { color: colors.textSecondary }]}>
                {isTeacher ? 'Tap the filter button to upload your first lecture' : 'Check back later for new content'}
              </Text>
            </View>
          ) : (
            displayLectures.map(lecture => (
              <LectureCard
                key={lecture.id}
                lecture={lecture}
                isOpen={openCardId === lecture.id}
                onSwipeOpen={(id) => setOpenCardId(id)}
                onSwipeClose={() => setOpenCardId(null)}
                onGestureStart={() => setScrollEnabled(false)}
                onGestureEnd={() => setScrollEnabled(true)}
                onRefresh={loadLectures}
                onEdit={handleEdit}
              />
            ))
          )}
        </ScrollView>

        <UploadLectureModal
          visible={uploadModalVisible}
          onClose={handleModalClose}
          onSuccess={loadLectures}
          editLecture={selectedLecture}
        />
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

  // skeleton
  skeletonCard: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, marginBottom: 12 },
  skeletonHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },

  // bottom sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 32, maxHeight: height * 0.65 },
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
