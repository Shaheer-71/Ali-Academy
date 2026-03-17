// AttendanceScreen.tsx — flat view + filter sheet with Mark action
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity,
  TouchableWithoutFeedback, RefreshControl, Alert,
  Dimensions, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar, Users, ChevronRight, Check, X, PenTool,
} from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAttendance } from '@/src/hooks/useAttendance';
import { supabase } from '@/src/lib/supabase';
import TopSections from '@/src/components/common/TopSections';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { StudentCard } from '@/src/components/attendance/StudentCard';
import { AttendanceRecordCard } from '@/src/components/attendance/AttendanceRecordCard';
import { PostAttendanceButton } from '@/src/components/attendance/PostAttendanceButton';
import { EmptyState } from '@/src/components/attendance/EmptyState';
import { EditAttendanceModal } from '@/src/components/attendance/modals/EditAttendanceModal';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenAnimation } from '@/src/utils/animations';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { TextSizes } from '@/src/styles/TextSizes';

const { height } = Dimensions.get('window');

// ── Date helpers ──────────────────────────────────────────────────────────────
const getToday = () => new Date().toISOString().split('T')[0];
const getWeekAgo = () => {
  const d = new Date(); d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
};
const getMonthAgo = () => {
  const d = new Date(); d.setDate(d.getDate() - 29);
  return d.toISOString().split('T')[0];
};

type DateRange = 'today' | 'week' | 'month' | 'custom';

interface Class { id: string; name: string; }
interface AttendanceRecord {
  id: string; student_id: string; class_id: string;
  date: string; status: 'present' | 'late' | 'absent';
  arrival_time?: string; late_minutes?: number; marked_by?: string;
  students?: { full_name: string; roll_number: string; parent_contact: string; };
  classes?: { name: string; };
  created_at: string;
}

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const screenStyle = useScreenAnimation();
  const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin';
  const isSuperAdmin = profile?.role === 'superadmin';

  // ── Shared data ──────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<Class[]>([]);

  // ── Error modal ──────────────────────────────────────────────────────────────
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const showError = (title: string, message: string) =>
    setErrorModal({ visible: true, title, message });

  // ── View state ───────────────────────────────────────────────────────────────
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [startDate, setStartDate] = useState(getWeekAgo());
  const [endDate, setEndDate] = useState(getToday());

  const [viewRecords, setViewRecords] = useState<AttendanceRecord[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, absent: 0, rate: 0 });

  // ── Filter sheet state ────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'class' | 'subject' | null>(null);
  const [pendingClass, setPendingClass] = useState<string | null>(null);
  const [pendingRange, setPendingRange] = useState<DateRange>('week');
  const [pendingStart, setPendingStart] = useState(getWeekAgo());
  const [pendingEnd, setPendingEnd] = useState(getToday());

  // ── Date picker state ─────────────────────────────────────────────────────────
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  // ── Mark panel state ─────────────────────────────────────────────────────────
  const [markVisible, setMarkVisible] = useState(false);
  const [markClass, setMarkClass] = useState('');
  const [markExpandSection, setMarkExpandSection] = useState<'class' | null>(null);

  // ── Mark modals ──────────────────────────────────────────────────────────────
const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // ── useAttendance hook for marking ───────────────────────────────────────────
  const {
    students, currentAttendance, todaysAttendance, loading: markLoading, posting,
    markStudentAttendance, postAttendance, fetchTodaysAttendance,
    clearCurrentAttendance, isStudentMarkedForDate, getStudentRecordForDate,
    updateAttendance,
  } = useAttendance(markClass);

  // ── Fetch classes ─────────────────────────────────────────────────────────────
  const fetchClasses = useCallback(async (): Promise<{ classes: Class[] }> => {
    if (!isTeacher || !profile?.id) return { classes: [] };
    try {
      let uniqueClasses: Class[] = [];
      if (profile.role === 'superadmin') {
        const { data } = await supabase.from('classes').select('id, name').order('name');
        uniqueClasses = (data || []) as Class[];
      } else {
        const { data: enrollData } = await supabase
          .from('teacher_subject_enrollments')
          .select('class_id, classes(id, name)')
          .eq('teacher_id', profile.id)
          .eq('is_active', true);
        uniqueClasses = Array.from(
          new Map(enrollData?.map((i: any) => i.classes).filter(Boolean).map((c: any) => [c.id, c])).values()
        ) as Class[];
      }
      setClasses(uniqueClasses);
      return { classes: uniqueClasses };
    } catch (e) { console.warn('Error fetching classes:', e); return { classes: [] }; }
  }, [profile?.id]);

  // ── Fetch view attendance ─────────────────────────────────────────────────────
  const fetchViewData = useCallback(async (
    classId: string | null,
    from: string,
    to: string,
    classesOverride?: Class[],
  ) => {
    if (!profile?.id) return;
    setViewLoading(true);
    try {
      let query = supabase
        .from('attendance')
        .select('*, students(full_name, roll_number, parent_contact), classes(name)')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false });

      if (isTeacher) {
        // No teacher_id column — filter by class_id using teacher's enrolled classes
        const teacherClassIds = (classesOverride ?? classes).map(c => c.id);
        if (classId) {
          query = query.eq('class_id', classId);
        } else if (teacherClassIds.length > 0) {
          query = query.in('class_id', teacherClassIds);
        }
      } else {
        query = query.eq('student_id', profile.id);
        if (classId) query = query.eq('class_id', classId);
      }

      const { data, error } = await query;
      if (error) throw error;
      const records = (data || []) as AttendanceRecord[];
      setViewRecords(records);
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const late = records.filter(r => r.status === 'late').length;
      const absent = records.filter(r => r.status === 'absent').length;
      setStats({ total, present, late, absent, rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0 });
    } catch (e: any) {
      showError('Error', e.message || 'Failed to load attendance');
    } finally {
      setViewLoading(false);
    }
  }, [profile?.id, isTeacher]);

  // ── Apply filter ─────────────────────────────────────────────────────────────
  const applyFilter = () => {
    setFilterClass(pendingClass);
    setDateRange(pendingRange);
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
    setFilterVisible(false);
    fetchViewData(pendingClass, pendingStart, pendingEnd);
  };

  const resetFilter = () => {
    const from = getWeekAgo(); const to = getToday();
    setPendingClass(null);
    setPendingRange('week'); setPendingStart(from); setPendingEnd(to);
    setFilterClass(null);
    setDateRange('week'); setStartDate(from); setEndDate(to);
    setFilterVisible(false);
    fetchViewData(null, from, to);
  };

  const isFiltered = filterClass !== null || dateRange !== 'week';

  // ── Filter sheet sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (filterVisible) {
      setPendingClass(filterClass);
      setPendingRange(dateRange);
      setPendingStart(startDate);
      setPendingEnd(endDate);
      setExpandedSection(null);
    }
  }, [filterVisible]);

  const handlePendingClassSelect = (classId: string | null) => {
    setPendingClass(classId);
    setExpandedSection(null);
  };

  const handlePendingRangeChange = (r: DateRange) => {
    setPendingRange(r);
    const to = getToday();
    if (r === 'today') { setPendingStart(to); setPendingEnd(to); }
    else if (r === 'week') { setPendingStart(getWeekAgo()); setPendingEnd(to); }
    else if (r === 'month') { setPendingStart(getMonthAgo()); setPendingEnd(to); }
    // custom: keep existing values
  };

  // ── Mark panel helpers ────────────────────────────────────────────────────────
  const openMark = () => {
    setMarkClass(filterClass || '');
    setMarkExpandSection(null);
    clearCurrentAttendance();
    setFilterVisible(false);
    setMarkVisible(true);
  };

  useEffect(() => {
    if (markVisible && markClass) {
      fetchTodaysAttendance(getToday());
    }
  }, [markClass, markVisible]);

  const handleMarkClassSelect = (classId: string) => {
    setMarkClass(classId);
    setMarkExpandSection(null);
  };

  const handlePostAttendance = async () => {
    const markedCount = Object.keys(currentAttendance).length;
    if (markedCount === 0) { showError('No Students Marked', 'Please mark at least one student.'); return; }
    Alert.alert('Post Attendance', `Post attendance for ${markedCount} of ${students.length} students?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Post', onPress: async () => {
          const result = await postAttendance(getToday());
          if (result.success) {
            Alert.alert('Success', 'Attendance posted successfully');
            setMarkVisible(false);
            fetchViewData(filterClass, startDate, endDate);
          } else {
            showError('Failed', result.error || 'Failed to post attendance');
          }
        }
      }
    ]);
  };

  // ── Refresh ───────────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchViewData(filterClass, startDate, endDate);
    setRefreshing(false);
  }, [filterClass, startDate, endDate, fetchViewData]);

  // ── Initial load — fetch classes first, pass them to avoid stale closure ─────
  useEffect(() => {
    fetchClasses().then(({ classes: freshClasses }) => {
      fetchViewData(filterClass, startDate, endDate, freshClasses);
    });
  }, [profile?.id]);

  useFocusEffect(useCallback(() => {
    fetchViewData(filterClass, startDate, endDate);
  }, [profile?.id]));

  // ── Date picker helpers ───────────────────────────────────────────────────────
  const strToDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const dateToStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fmtDisplay = (s: string) => { try { return strToDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return s; } };

  const handlePickerChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!selected) return;
    const str = dateToStr(selected);
    if (pickerTarget === 'start') setPendingStart(str);
    else if (pickerTarget === 'end') setPendingEnd(str);
  };

  // ── Filter sheet render ───────────────────────────────────────────────────────
  const renderFilterSheet = () => {
    const selectedClassName = pendingClass ? classes.find(c => c.id === pendingClass)?.name : 'All Classes';
    const hasChanges = pendingClass !== null || pendingRange !== 'week';

    return (
      <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={() => setFilterVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
          <View style={s.overlay} />
        </TouchableWithoutFeedback>
        <View style={[s.sheet, { backgroundColor: colors.cardBackground }]}>
          <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />

          {/* Mark action button — teacher only */}
          {isTeacher && (
            <View style={s.actionRow}>
              <TouchableOpacity style={[s.actionBtn, { borderColor: colors.primary }]} onPress={openMark}>
                <PenTool size={15} color={colors.primary} />
                <Text allowFontScaling={false} style={[s.actionBtnText, { color: colors.primary }]}>Mark Attendance</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.sheetHeader}>
            <Text allowFontScaling={false} style={[s.sheetTitle, { color: colors.text }]}>Filter Attendance</Text>
            {hasChanges && (
              <TouchableOpacity onPress={resetFilter}>
                <Text allowFontScaling={false} style={[s.resetText, { color: '#EF4444' }]}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={s.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Date range chips */}
            <Text allowFontScaling={false} style={[s.fieldLabel, { color: colors.textSecondary }]}>Date Range</Text>
            <View style={s.chipRow}>
              {(['today', 'week', 'month', 'custom'] as DateRange[]).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.chip, { borderColor: colors.border }, pendingRange === r && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => handlePendingRangeChange(r)}
                >
                  <Text allowFontScaling={false} style={[s.chipText, { color: pendingRange === r ? '#fff' : colors.text }]}>
                    {r === 'today' ? 'Today' : r === 'week' ? 'Weekly' : r === 'month' ? 'Monthly' : 'Custom'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom date pickers */}
            {pendingRange === 'custom' && (
              <View style={[s.customDateBox, { borderColor: colors.border }]}>
                <TouchableOpacity style={s.dateInputRow} onPress={() => setPickerTarget('start')}>
                  <Text allowFontScaling={false} style={[s.dateInputLabel, { color: colors.textSecondary }]}>From</Text>
                  <Text allowFontScaling={false} style={[s.dateInputValue, { color: colors.text }]}>{fmtDisplay(pendingStart)}</Text>
                  <Calendar size={14} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={[s.dateInputDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={s.dateInputRow} onPress={() => setPickerTarget('end')}>
                  <Text allowFontScaling={false} style={[s.dateInputLabel, { color: colors.textSecondary }]}>To</Text>
                  <Text allowFontScaling={false} style={[s.dateInputValue, { color: colors.text }]}>{fmtDisplay(pendingEnd)}</Text>
                  <Calendar size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Class accordion */}
            {isTeacher && (
              <>
                <TouchableOpacity
                  style={[s.accordion, { borderColor: colors.border }]}
                  onPress={() => setExpandedSection(prev => prev === 'class' ? null : 'class')}
                >
                  <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Class</Text>
                  <View style={s.accordionRight}>
                    <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{selectedClassName}</Text>
                    <ChevronRight size={16} color={colors.textSecondary}
                      style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'class' ? '270deg' : '90deg' }] }} />
                  </View>
                </TouchableOpacity>
                {expandedSection === 'class' && (
                  <View style={[s.accordionBody, { borderColor: colors.border }]}>
                    <TouchableOpacity style={[s.option, { borderBottomColor: colors.border }]} onPress={() => handlePendingClassSelect(null)}>
                      <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>All Classes</Text>
                      {pendingClass === null && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                    {classes.map(c => (
                      <TouchableOpacity key={c.id} style={[s.option, { borderBottomColor: colors.border }]} onPress={() => handlePendingClassSelect(c.id)}>
                        <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{c.name}</Text>
                        {pendingClass === c.id && <Check size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

          </ScrollView>

          <TouchableOpacity style={[s.applyBtn, { backgroundColor: colors.primary }]} onPress={applyFilter}>
            <Text allowFontScaling={false} style={s.applyBtnText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Date picker — iOS inline modal, Android native dialog */}
        {pickerTarget !== null && (
          Platform.OS === 'ios' ? (
            <Modal transparent animationType="fade" onRequestClose={() => setPickerTarget(null)}>
              <TouchableWithoutFeedback onPress={() => setPickerTarget(null)}>
                <View style={s.overlay} />
              </TouchableWithoutFeedback>
              <View style={[s.pickerSheet, { backgroundColor: colors.cardBackground }]}>
                <View style={[s.pickerHeader, { borderBottomColor: colors.border }]}>
                  <Text allowFontScaling={false} style={[s.pickerTitle, { color: colors.text }]}>
                    {pickerTarget === 'start' ? 'From Date' : 'To Date'}
                  </Text>
                  <TouchableOpacity onPress={() => setPickerTarget(null)}>
                    <Text allowFontScaling={false} style={[s.pickerDone, { color: colors.primary }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={strToDate(pickerTarget === 'start' ? pendingStart : pendingEnd)}
                  mode="date"
                  display="spinner"
                  onChange={handlePickerChange}
                  maximumDate={new Date()}
                  textColor={colors.text}
                />
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={strToDate(pickerTarget === 'start' ? pendingStart : pendingEnd)}
              mode="date"
              display="calendar"
              onChange={handlePickerChange}
              maximumDate={new Date()}
            />
          )
        )}
      </Modal>
    );
  };

  // ── Mark panel render ─────────────────────────────────────────────────────────
  const renderMarkPanel = () => {
    const markClassName = markClass ? classes.find(c => c.id === markClass)?.name : null;
    const today = getToday();
    const alreadyMarked = Object.keys(todaysAttendance).length > 0;

    return (
      <Modal
        visible={markVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMarkVisible(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={s.panelOverlay}>
          <View style={[s.panelSheet, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[s.panelHeader, { borderBottomColor: colors.border }]}>
              <Text allowFontScaling={false} style={[s.panelTitle, { color: colors.text }]}>Mark Attendance</Text>
              <TouchableOpacity style={s.panelCloseBtn} onPress={() => setMarkVisible(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Class + Date selectors */}
            <View style={[s.markSelectors, { borderBottomColor: colors.border }]}>
              {/* Class */}
              <TouchableOpacity
                style={[s.selectorBtn, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                onPress={() => setMarkExpandSection(p => p === 'class' ? null : 'class')}
              >
                <Text allowFontScaling={false} style={[s.selectorLabel, { color: colors.textSecondary }]}>Class</Text>
                <Text allowFontScaling={false} style={[s.selectorValue, { color: markClassName ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                  {markClassName || 'Select'}
                </Text>
              </TouchableOpacity>
              {/* Date — fixed to today */}
              <View style={[s.selectorBtn, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                <Text allowFontScaling={false} style={[s.selectorLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text allowFontScaling={false} style={[s.selectorValue, { color: colors.text }]}>{today}</Text>
              </View>
            </View>

            {/* Class dropdown */}
            {markExpandSection === 'class' && (
              <View style={[s.markDropdown, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {classes.map(c => (
                  <TouchableOpacity key={c.id} style={[s.option, { borderBottomColor: colors.border }]} onPress={() => handleMarkClassSelect(c.id)}>
                    <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{c.name}</Text>
                    {markClass === c.id && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Student list */}
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!markClass ? (
                <EmptyState
                  icon={<Users size={40} color={colors.textSecondary} />}
                  title="Select a Class"
                  subtitle="Choose a class above to load students"
                />
              ) : alreadyMarked ? (
                <EmptyState
                  icon={<Check size={40} color="#10B981" />}
                  title="Already Marked Today"
                  subtitle="Attendance for this class has already been recorded today"
                />
              ) : markLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={[s.skeletonCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <View style={s.skeletonRow}>
                      <SkeletonBox width={120} height={13} borderRadius={6} />
                      <SkeletonBox width={40} height={13} borderRadius={6} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <SkeletonBox width="48%" height={34} borderRadius={8} />
                      <SkeletonBox width="48%" height={34} borderRadius={8} />
                    </View>
                  </View>
                ))
              ) : students.length === 0 ? (
                <EmptyState
                  icon={<Users size={40} color={colors.textSecondary} />}
                  title="No students found"
                  subtitle="No students found in this class"
                />
              ) : (
                <>
                  {students.map(student => {
                    const isMarkedDB = isStudentMarkedForDate(student.id, today);
                    const dbRecord = getStudentRecordForDate(student.id, today);
                    const isMarkedTemp = !!currentAttendance[student.id];
                    return (
                      <StudentCard
                        key={student.id}
                        student={student}
                        record={currentAttendance[student.id]}
                        dbRecord={dbRecord}
                        isMarkedTemporarily={isMarkedTemp}
                        isMarkedInDatabase={isMarkedDB}
                        selectedDate={today}
                        onMarkAttendance={(id, status, time) => markStudentAttendance(id, status, time)}
                        onEdit={isSuperAdmin ? (record) => { setSelectedRecord(record as any); setEditModalVisible(true); } : undefined}
                      />
                    );
                  })}
                  <PostAttendanceButton
                    markedCount={Object.keys(currentAttendance).length}
                    totalCount={students.length}
                    posting={posting}
                    onPress={handlePostAttendance}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>

<EditAttendanceModal
          visible={editModalVisible}
          record={selectedRecord}
          onClose={() => { setEditModalVisible(false); setSelectedRecord(null); }}
          onSave={updateAttendance}
        />
      </Modal>
    );
  };

  // ── Stats bar ─────────────────────────────────────────────────────────────────
  const renderStats = () =>
    viewLoading ? (
      <View style={[s.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={s.statsRow}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={s.statItem}>
              <SkeletonBox width={32} height={18} borderRadius={6} style={{ marginBottom: 6 }} />
              <SkeletonBox width={28} height={10} borderRadius={4} />
            </View>
          ))}
          <SkeletonBox width={52} height={44} borderRadius={8} />
        </View>
      </View>
    ) : (
      <View style={[s.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text allowFontScaling={false} style={[s.statValue, { color: colors.textSecondary }]}>{stats.total}</Text>
            <Text allowFontScaling={false} style={[s.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={s.statItem}>
            <Text allowFontScaling={false} style={[s.statValue, { color: '#10B981' }]}>{stats.present}</Text>
            <Text allowFontScaling={false} style={[s.statLabel, { color: colors.textSecondary }]}>Present</Text>
          </View>
          <View style={s.statItem}>
            <Text allowFontScaling={false} style={[s.statValue, { color: '#F59E0B' }]}>{stats.late}</Text>
            <Text allowFontScaling={false} style={[s.statLabel, { color: colors.textSecondary }]}>Late</Text>
          </View>
          <View style={s.statItem}>
            <Text allowFontScaling={false} style={[s.statValue, { color: '#EF4444' }]}>{stats.absent}</Text>
            <Text allowFontScaling={false} style={[s.statLabel, { color: colors.textSecondary }]}>Absent</Text>
          </View>
          <View style={[s.rateBox, { backgroundColor: colors.primary }]}>
            <Text allowFontScaling={false} style={s.rateValue}>{stats.rate}%</Text>
            <Text allowFontScaling={false} style={s.rateLabel}>Rate</Text>
          </View>
        </View>
      </View>
    );

  // ── Main render ───────────────────────────────────────────────────────────────
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
        {isTeacher && renderMarkPanel()}

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
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
          {renderStats()}

          {viewLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[s.skeletonCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={s.skeletonRow}>
                  <SkeletonBox width={140} height={13} borderRadius={6} />
                  <SkeletonBox width={64} height={13} borderRadius={6} />
                </View>
                <SkeletonBox width="50%" height={11} borderRadius={5} style={{ marginBottom: 10 }} />
                <SkeletonBox width="70%" height={11} borderRadius={5} />
              </View>
            ))
          ) : viewRecords.length === 0 ? (
            <EmptyState
              icon={<Calendar size={48} color={colors.textSecondary} />}
              title="No attendance records"
              subtitle={isTeacher ? 'Tap filter to mark attendance or adjust the date range' : 'No records for the selected period'}
            />
          ) : (
            viewRecords.map(record => (
              <AttendanceRecordCard
                key={record.id}
                record={record}
                showStudentInfo={true}
                onEdit={isSuperAdmin ? (r) => { setSelectedRecord(r as any); setEditModalVisible(true); } : undefined}
              />
            ))
          )}
        </ScrollView>

        {/* EditAttendanceModal outside mark panel for records edited from view */}
        <EditAttendanceModal
          visible={editModalVisible && !markVisible}
          record={selectedRecord}
          onClose={() => { setEditModalVisible(false); setSelectedRecord(null); }}
          onSave={async (id, data) => {
            const result = await updateAttendance(id, data);
            if (result.success) fetchViewData(filterClass, startDate, endDate);
            return result;
          }}
        />

      </SafeAreaView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  // stats
  statsCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: TextSizes.statValue, fontFamily: 'Inter-SemiBold', marginBottom: 2 },
  statLabel: { fontSize: TextSizes.statLabel, fontFamily: 'Inter-Medium' },
  rateBox: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  rateValue: { color: '#fff', fontSize: TextSizes.large, fontFamily: 'Inter-SemiBold' },
  rateLabel: { color: '#fff', fontSize: TextSizes.tiny, fontFamily: 'Inter-Medium' },

  // filter sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 12, paddingBottom: 32, maxHeight: height * 0.78,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },

  actionRow: { marginHorizontal: 16, marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 10, borderWidth: 1, gap: 6,
  },
  actionBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sheetTitle: { flex: 1, fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
  resetText: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium' },
  sheetScroll: { flexGrow: 0, paddingHorizontal: 16 },

  fieldLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  chipText: { fontSize: TextSizes.small, fontFamily: 'Inter-SemiBold' },

  customDateBox: { borderRadius: 10, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  dateInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  dateInputLabel: { width: 36, fontSize: TextSizes.medium, fontFamily: 'Inter-Medium' },
  dateInputValue: { flex: 1, fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
  dateInputDivider: { height: StyleSheet.hairlineWidth },

  pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
  pickerDone: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

  accordion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1,
  },
  accordionLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', flex: 1 },
  accordionRight: { flexDirection: 'row', alignItems: 'center' },
  accordionValue: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
  accordionBody: { marginBottom: 8, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', flex: 1 },

  applyBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  applyBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold', color: '#fff' },

  // mark panel
  panelOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  panelSheet: { height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  panelTitle: { fontSize: TextSizes.modalTitle, fontFamily: 'Inter-SemiBold' },
  panelCloseBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  markSelectors: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  selectorBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  selectorLabel: { fontSize: TextSizes.tiny, fontFamily: 'Inter-Medium', marginBottom: 2 },
  selectorValue: { fontSize: TextSizes.small, fontFamily: 'Inter-SemiBold' },

  markDropdown: {
    marginHorizontal: 16, marginBottom: 4, borderRadius: 10, borderWidth: 1,
    maxHeight: 180, overflow: 'hidden',
  },

  // skeleton
  skeletonCard: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
});
