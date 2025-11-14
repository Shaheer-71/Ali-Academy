// screens/AttendanceScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Users } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAttendance } from '@/src/hooks/useAttendance';
import { supabase } from '@/src/lib/supabase';
import TopSections from '@/src/components/common/TopSections';
import { AttendanceHeader } from '@/src/components/attendance/AttendanceHeader';
import { AttendanceStats } from '@/src/components/attendance/AttendanceStats';
import { StudentCard } from '@/src/components/attendance/StudentCard';
import { AttendanceRecordCard } from '@/src/components/attendance/AttendanceRecordCard';
import { PostAttendanceButton } from '@/src/components/attendance/PostAttendanceButton';
import { DateSelector } from '@/src/components/attendance/DateSelector';
import { EmptyState } from '@/src/components/attendance/EmptyState';
import { LoadingState } from '@/src/components/attendance/LoadingState';
import { CustomTimeModal } from '@/src/components/attendance/modals/CustomTimeModal';
import { EditAttendanceModal } from '@/src/components/attendance/modals/EditAttendanceModal';
import { ComprehensiveFilterModal } from '@/src/components/attendance/modals/ComprehensiveFilterModal';
import { ViewAttendanceFilterModal } from '@/src/components/attendance/modals/ViewAttendanceFilterModal';
import { useFocusEffect } from '@react-navigation/native';
import { TextSizes } from '@/src/styles/TextSizes';


interface Class {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    parent_contact: string;
    class_id: string;
}

interface AttendanceRecord {
    id: string;
    student_id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    date: string;
    arrival_time?: string;
    status: 'present' | 'late' | 'absent';
    late_minutes?: number;
    students?: {
        full_name: string;
        roll_number: string;
        parent_contact: string;
    };
    subjects?: {
        name: string;
    };
    created_at: string;
}

interface FilterData {
    selectedClass: string;
    selectedSubject: string;
    startDate: string;
    endDate: string;
    status: 'all' | 'present' | 'late' | 'absent';
    dateRange: 'today' | 'week' | 'month' | 'custom';
}

interface ViewFilterData {
    selectedClass: string;
    selectedSubject: string;
    startDate: string;
    endDate: string;
    status: 'all' | 'present' | 'late' | 'absent';
    dateRange: 'today' | 'week' | 'month' | 'custom';
    viewType: 'class' | 'student';
    selectedStudent: string;
}

interface AttendanceStats {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    attendanceRate: number;
}

export default function AttendanceScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [viewMode, setViewMode] = useState<'mark' | 'view' | 'reports'>('mark');

    // Filter states for mark/reports modes
    const [filters, setFilters] = useState<FilterData>({
        selectedClass: '',
        selectedSubject: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'all',
        dateRange: 'today',
    });

    // Separate filter states for view mode
    const [viewFilters, setViewFilters] = useState<ViewFilterData>({
        selectedClass: '',
        selectedSubject: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'all',
        dateRange: 'today',
        viewType: 'class',
        selectedStudent: '',
    });

    // View mode data states
    const [viewAttendanceRecords, setViewAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [viewAttendanceStats, setViewAttendanceStats] = useState<AttendanceStats>({
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        attendanceRate: 0,
    });
    const [viewLoading, setViewLoading] = useState(false);

    // Modal states
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [viewFilterModalVisible, setViewFilterModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

    // Use existing hook for mark/reports modes - NOW WITH SUBJECT
    const {
        students,
        attendanceRecords,
        attendanceStats,
        currentAttendance,
        todaysAttendance,
        loading,
        posting,
        refreshing,
        markStudentAttendance,
        postAttendance,
        updateAttendance,
        fetchAttendanceData,
        fetchTodaysAttendance,
        onRefresh,
        clearCurrentAttendance,
        clearAllData,
        isStudentMarkedForDate,
        getStudentRecordForDate,
    } = useAttendance(filters.selectedClass, filters.selectedSubject);

    useEffect(() => {
        if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
            fetchClasses();
        }
    }, [profile]);

    // Fetch subjects when class changes
    useEffect(() => {
        if (filters.selectedClass) {
            fetchSubjectsForClass(filters.selectedClass);
        }
    }, [filters.selectedClass]);

    // Apply filters when they change for reports mode
    useEffect(() => {
        if (filters.selectedClass && filters.selectedSubject && viewMode === 'reports') {
            fetchAttendanceData(filters.startDate, filters.endDate);
        }
    }, [filters.selectedClass, filters.selectedSubject, filters.startDate, filters.endDate, viewMode]);

    // Fetch today's attendance for mark mode
    useEffect(() => {
        if (filters.selectedClass && filters.selectedSubject && viewMode === 'mark') {
            fetchTodaysAttendance(filters.startDate);
        }
    }, [filters.selectedClass, filters.selectedSubject, filters.startDate, viewMode]);

    // Handle view mode data fetching
    useEffect(() => {
        if (viewMode === 'view' && viewFilters.selectedClass && viewFilters.selectedSubject &&
            (viewFilters.viewType === 'class' || viewFilters.selectedStudent)) {
            fetchViewAttendanceData();
        }
    }, [viewFilters, viewMode]);

    const fetchClasses = async () => {
        try {
            const { data: classesIDData, error: classesIDError } = await supabase
                .from('teacher_subject_enrollments') // FIXED: Changed table name
                .select('class_id')
                .eq('teacher_id', profile?.id)
                .eq('is_active', true);

            if (classesIDError) throw classesIDError;

            let enrolledClasses = [...new Set(classesIDData?.map(item => item.class_id) || [])];

            const { data, error } = await supabase
                .from('classes')
                .select('id, name')
                .in('id', enrolledClasses)
                .order('name');

            if (error) throw error;
            setClasses(data || []);

            // REMOVED: Auto-selection of first class
            // Users must manually select class and subject
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSubjectsForClass = async (classId: string) => {
        try {

            const { data: subjectIDData, error: subjectIDError } = await supabase
                .from('teacher_subject_enrollments') // FIXED: Changed table name
                .select('subject_id')
                .eq('teacher_id', profile?.id)
                .eq('class_id', classId)
                .eq('is_active', true);

            if (subjectIDError) {
                console.error("Error fetching subject enrollments:", subjectIDError);
                throw subjectIDError;
            }


            let enrolledSubjects = [...new Set(subjectIDData?.map(item => item.subject_id) || [])];

            if (enrolledSubjects.length === 0) {
                // console.log("⚠️ No subjects found for this class");
                setSubjects([]);
                setFilters(prev => ({ ...prev, selectedSubject: '' }));
                setViewFilters(prev => ({ ...prev, selectedSubject: '' }));
                return;
            }

            const { data, error } = await supabase
                .from('subjects')
                .select('id, name')
                .in('id', enrolledSubjects)
                .order('name');

            if (error) {
                console.error("Error fetching subjects details:", error);
                throw error;
            }

            // console.log("✅ Fetched subjects:", data);
            setSubjects(data || []);

            // REMOVED: Auto-selection of first subject
            // Only clear if current selection is invalid
            if (data && data.length > 0) {
                const currentSubjectExists = data.some(s => s.id === filters.selectedSubject);
                if (!currentSubjectExists) {
                    setFilters(prev => ({ ...prev, selectedSubject: '' }));
                    setViewFilters(prev => ({ ...prev, selectedSubject: '' }));
                }
            } else {
                setFilters(prev => ({ ...prev, selectedSubject: '' }));
                setViewFilters(prev => ({ ...prev, selectedSubject: '' }));
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setSubjects([]);
            setFilters(prev => ({ ...prev, selectedSubject: '' }));
            setViewFilters(prev => ({ ...prev, selectedSubject: '' }));
        }
    };

    const fetchViewAttendanceData = async () => {
        if (!viewFilters.selectedClass || !viewFilters.selectedSubject) return;

        setViewLoading(true);
        try {
            let query = supabase
                .from('attendance')
                .select(`
                    *,
                    students (
                        full_name,
                        roll_number,
                        parent_contact
                    ),
                    subjects (name)
                `)
                .eq('class_id', viewFilters.selectedClass)
                .eq('subject_id', viewFilters.selectedSubject)
                .gte('date', viewFilters.startDate)
                .lte('date', viewFilters.endDate)
                .order('date', { ascending: false });

            // If viewing individual student, filter by student
            if (viewFilters.viewType === 'student' && viewFilters.selectedStudent) {
                query = query.eq('student_id', viewFilters.selectedStudent);
            }

            const { data, error } = await query;
            if (error) throw error;

            let filteredData = data || [];

            // Apply status filter
            if (viewFilters.status !== 'all') {
                filteredData = filteredData.filter(record => record.status === viewFilters.status);
            }

            setViewAttendanceRecords(filteredData);
            calculateViewStats(filteredData);
        } catch (error) {
            console.error('Error fetching view attendance data:', error);
            setViewAttendanceRecords([]);
        } finally {
            setViewLoading(false);
        }
    };

    const calculateViewStats = (records: AttendanceRecord[]) => {
        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'present').length;
        const lateDays = records.filter(r => r.status === 'late').length;
        const absentDays = records.filter(r => r.status === 'absent').length;
        const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

        setViewAttendanceStats({
            totalDays,
            presentDays,
            lateDays,
            absentDays,
            attendanceRate,
        });
    };

    const handleMarkAttendance = (
        studentId: string,
        status: 'present' | 'late' | 'absent',
        arrivalTime?: string
    ) => {
        markStudentAttendance(studentId, status, arrivalTime);
    };

    const handleCustomTime = (studentId: string) => {
        setSelectedStudent(studentId);
        setTimeModalVisible(true);
    };

    const handlePostAttendance = async () => {
        const markedCount = Object.keys(currentAttendance).length;
        const totalStudents = students.length;

        if (markedCount === 0) {
            Alert.alert('Error', 'Please mark attendance for at least one student');
            return;
        }

        Alert.alert(
            'Post Attendance',
            `Post attendance for ${markedCount} out of ${totalStudents} students?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Post',
                    onPress: async () => {
                        try {
                            const result = await postAttendance(filters.startDate);
                            if (result.success) {
                                Alert.alert('Success', 'Attendance posted successfully');
                                handleRefresh();
                            } else {
                                Alert.alert('Error', result.error || 'Failed to post attendance');
                            }
                        } catch (error: any) {
                            console.error('Error posting attendance:', error);
                            Alert.alert('Error', error.message || 'Failed to post attendance');
                        }
                    },
                },
            ]
        );
    };

    const handleEditRecord = (record: AttendanceRecord) => {
        setSelectedRecord(record);
        setEditModalVisible(true);
    };

    const handleRefresh = async () => {
        try {
            if (viewMode === 'view') {
                await fetchViewAttendanceData();
            } else if (viewMode === 'reports' && filters.selectedClass && filters.selectedSubject) {
                await fetchAttendanceData(filters.startDate, filters.endDate);
            } else {
                await onRefresh();
                if (filters.selectedClass && filters.selectedSubject && filters.startDate) {
                    await fetchTodaysAttendance(filters.startDate);
                }
            }
        } catch (error) {
            console.error('Error during refresh:', error);
        }
    };

    const handleViewModeChange = (mode: 'mark' | 'view' | 'reports') => {
        setViewMode(mode);
        clearCurrentAttendance();

        if (mode === 'reports' && filters.selectedClass && filters.selectedSubject) {
            setTimeout(() => {
                fetchAttendanceData(filters.startDate, filters.endDate);
            }, 100);
        }

        if (mode === 'mark' && filters.selectedClass && filters.selectedSubject && filters.startDate) {
            setTimeout(() => {
                fetchTodaysAttendance(filters.startDate);
            }, 100);
        }

        if (mode === 'view' && viewFilters.selectedClass && viewFilters.selectedSubject) {
            setTimeout(() => {
                fetchViewAttendanceData();
            }, 100);
        }
    };

    // Handle filter application for mark/reports modes
    const handleApplyFilters = (newFilters: FilterData) => {
        // Clear all data when changing class or subject
        if (newFilters.selectedClass !== filters.selectedClass ||
            newFilters.selectedSubject !== filters.selectedSubject) {
            clearAllData();
            clearCurrentAttendance();
        }

        setFilters(newFilters);
    };

    // Handle filter application for view mode
    const handleApplyViewFilters = (newFilters: ViewFilterData) => {
        setViewFilters(newFilters);
    };

    // Check if any filters are active
    const hasActiveFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        return (
            filters.dateRange !== 'today' ||
            filters.status !== 'all' ||
            filters.startDate !== today ||
            filters.endDate !== today
        );
    };

    const hasActiveViewFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        return (
            viewFilters.dateRange !== 'today' ||
            viewFilters.status !== 'all' ||
            viewFilters.viewType !== 'class' ||
            viewFilters.startDate !== today ||
            viewFilters.endDate !== today
        );
    };

    // Filter attendance records based on status for reports mode
    const filteredAttendanceRecords = filters.status === 'all'
        ? attendanceRecords
        : attendanceRecords.filter(record => record.status === filters.status);

    const renderStudentContent = () => (
        <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    title="Refreshing attendance data..."
                    titleColor={colors.textSecondary}
                />
            }
        >
            <AttendanceStats stats={attendanceStats} />
            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Attendance History</Text>
            {loading ? (
                <LoadingState message="Loading attendance..." />
            ) : filteredAttendanceRecords.length === 0 ? (
                <EmptyState
                    icon={<Calendar size={48} color={colors.textSecondary} />}
                    title="No attendance records found"
                    subtitle="Pull down to refresh or wait for teacher to mark attendance"
                />
            ) : (
                filteredAttendanceRecords.map((record, index) => (
                    <AttendanceRecordCard
                        key={`${record.date}-${index}`}
                        record={record}
                    />
                ))
            )}
        </ScrollView>
    );

    const renderTeacherMarkMode = () => (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                        title="Refreshing students and attendance..."
                        titleColor={colors.textSecondary}
                    />
                }
            >
                {/* Class and Subject Info Banner */}
                {filters.selectedClass && filters.selectedSubject && (
                    <View style={[styles.classInfoBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                        <Text allowFontScaling={false} style={[styles.classInfoText, { color: colors.primary }]}>
                            {classes.find(c => c.id === filters.selectedClass)?.name} - {subjects.find(s => s.id === filters.selectedSubject)?.name}
                        </Text>
                        <Text allowFontScaling={false} style={[styles.dateInfoText, { color: colors.primary }]}>
                            Date: {new Date(filters.startDate).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                {!filters.selectedClass || !filters.selectedSubject ? (
                    <EmptyState
                        icon={<Users size={48} color={colors.textSecondary} />}
                        title="Select Class and Subject"
                        subtitle="Please use filters to select a class and subject to mark attendance"
                    />
                ) : loading ? (
                    <LoadingState message="Loading students..." />
                ) : students.length === 0 ? (
                    <EmptyState
                        icon={<Users size={48} color={colors.textSecondary} />}
                        title="No students enrolled"
                        subtitle="No students are enrolled in this class and subject combination"
                    />
                ) : (
                    <>
                        {students.map((student) => {
                            const isMarkedInDatabase = isStudentMarkedForDate(student.id, filters.startDate);
                            const dbRecord = getStudentRecordForDate(student.id, filters.startDate);
                            const isMarkedTemporarily = !!currentAttendance[student.id];

                            return (
                                <StudentCard
                                    key={student.id}
                                    student={student}
                                    record={currentAttendance[student.id]}
                                    dbRecord={dbRecord}
                                    isMarkedTemporarily={isMarkedTemporarily}
                                    isMarkedInDatabase={isMarkedInDatabase}
                                    selectedDate={filters.startDate}
                                    onMarkAttendance={handleMarkAttendance}
                                    onCustomTime={handleCustomTime}
                                    onEdit={handleEditRecord}
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
    );

    const renderTeacherViewMode = () => (
        <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
            refreshControl={
                <RefreshControl
                    refreshing={viewLoading}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    title="Refreshing attendance data..."
                    titleColor={colors.textSecondary}
                />
            }
        >
            {/* Statistics Card */}
            <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.statsHeader}>
                    <Text allowFontScaling={false} style={[styles.statsTitle, { color: colors.text }]}>
                        {viewFilters.viewType === 'student'
                            ? `Student Attendance Stats`
                            : `${classes.find(c => c.id === viewFilters.selectedClass)?.name} - ${subjects.find(s => s.id === viewFilters.selectedSubject)?.name}`
                        }
                    </Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: colors.textSecondary }]}>{viewAttendanceStats.totalDays}</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Total Days</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#10B981' }]}>{viewAttendanceStats.presentDays}</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#F59E0B' }]}>{viewAttendanceStats.lateDays}</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#EF4444' }]}>{viewAttendanceStats.absentDays}</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                    </View>
                </View>

                <View style={[styles.attendanceRateContainer, { backgroundColor: colors.primary }]}>
                    <Text allowFontScaling={false} style={styles.attendanceRateLabel}>Overall Attendance Rate</Text>
                    <Text allowFontScaling={false} style={styles.attendanceRateValue}>{viewAttendanceStats.attendanceRate}%</Text>
                </View>
            </View>

            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                Attendance Records ({viewAttendanceRecords.length})
            </Text>

            {viewLoading ? (
                <LoadingState message="Loading attendance data..." />
            ) : !viewFilters.selectedClass || !viewFilters.selectedSubject ? (
                <EmptyState
                    icon={<Users size={48} color={colors.textSecondary} />}
                    title="Select Class and Subject"
                    subtitle="Please use filters to select a class and subject"
                />
            ) : viewAttendanceRecords.length === 0 ? (
                <EmptyState
                    icon={<Calendar size={48} color={colors.textSecondary} />}
                    title="No attendance records found"
                    subtitle="No records match your current filters"
                />
            ) : (
                viewAttendanceRecords.map((record) => (
                    <AttendanceRecordCard
                        key={record.id}
                        record={record}
                        showStudentInfo={viewFilters.viewType === 'class'}
                        onEdit={handleEditRecord}
                    />
                ))
            )}
        </ScrollView>
    );

    const renderTeacherReportsMode = () => (
        <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 50 }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    title="Refreshing attendance reports..."
                    titleColor={colors.textSecondary}
                />
            }
        >
            <View style={[styles.classStatsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text allowFontScaling={false} style={[styles.classStatsTitle, { color: colors.text }]}>
                    {classes.find(c => c.id === filters.selectedClass)?.name} - {subjects.find(s => s.id === filters.selectedSubject)?.name}
                </Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#10B981' }]}>{attendanceStats.presentDays}</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#F59E0B' }]}>{attendanceStats.lateDays}</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: '#EF4444' }]}>{attendanceStats.absentDays}</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text allowFontScaling={false} style={[styles.statValue, { color: colors.primary }]}>{attendanceStats.attendanceRate}%</Text>
                        <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Rate</Text>
                    </View>
                </View>
            </View>

            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Attendance Records</Text>
            {loading ? (
                <LoadingState message="Loading attendance reports..." />
            ) : filteredAttendanceRecords.length === 0 ? (
                <EmptyState
                    icon={<Calendar size={48} color={colors.textSecondary} />}
                    title="No attendance records found"
                    subtitle="Pull down to refresh or adjust your filters"
                />
            ) : (
                filteredAttendanceRecords.map((record) => (
                    <AttendanceRecordCard
                        key={record.id}
                        record={record}
                        onEdit={handleEditRecord}
                        showStudentInfo={true}
                    />
                ))
            )}
        </ScrollView>
    );

    const renderContent = () => {
        if (profile?.role === 'student') {
            return renderStudentContent();
        }

        switch (viewMode) {
            case 'mark':
                return renderTeacherMarkMode();
            case 'view':
                return renderTeacherViewMode();
            case 'reports':
                return renderTeacherReportsMode();
            default:
                return renderTeacherMarkMode();
        }
    };

    useFocusEffect(
        useCallback(() => {
            handleRefresh();
        }, [profile, viewMode, filters, viewFilters])
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TopSections />
            <SafeAreaView
                style={[styles.container, { backgroundColor: colors.background }]}
                edges={['left', 'right', 'bottom']}
            >
                {profile?.role === "teacher" && (
                    <AttendanceHeader
                        userRole={profile?.role || 'student'}
                        viewMode={viewMode}
                        onViewModeChange={handleViewModeChange}
                        onFilterPress={() => {
                            if (viewMode === 'view') {
                                setViewFilterModalVisible(true);
                            } else {
                                setFilterModalVisible(true);
                            }
                        }}
                        hasActiveFilters={viewMode === 'view' ? hasActiveViewFilters() : hasActiveFilters()}
                    />
                )}

                {renderContent()}

                {/* Filter Modal for Mark/Reports modes */}
                <ComprehensiveFilterModal
                    visible={filterModalVisible}
                    onClose={() => setFilterModalVisible(false)}
                    classes={classes}
                    subjects={subjects}
                    currentFilters={filters}
                    onApplyFilters={handleApplyFilters}
                    userRole={profile?.role || 'student'}
                    viewMode={viewMode === 'reports' ? 'view' : viewMode}
                />

                {/* Filter Modal for View mode */}
                <ViewAttendanceFilterModal
                    visible={viewFilterModalVisible}
                    onClose={() => setViewFilterModalVisible(false)}
                    classes={classes}
                    subjects={subjects}
                    students={allStudents}
                    currentFilters={viewFilters}
                    onApplyFilters={handleApplyViewFilters}
                />

                <CustomTimeModal
                    visible={timeModalVisible}
                    onClose={() => {
                        setTimeModalVisible(false);
                        setSelectedStudent('');
                    }}
                    onConfirm={(time) => {
                        handleMarkAttendance(selectedStudent, 'present', time);
                        setSelectedStudent('');
                    }}
                />

                <EditAttendanceModal
                    visible={editModalVisible}
                    record={selectedRecord}
                    onClose={() => {
                        setEditModalVisible(false);
                        setSelectedRecord(null);
                    }}
                    onSave={updateAttendance}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    statsCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    statsTitle: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        flex: 1,
    },
    attendanceRateContainer: {
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        marginTop: 12,
    },
    attendanceRateLabel: {
        color: '#ffffff',
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    attendanceRateValue: {
        color: '#ffffff',
        fontSize: TextSizes.xlarge,
        fontFamily: 'Inter-Bold',
    },
    classInfoBanner: {
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
    },
    classInfoText: {
        fontSize: TextSizes.bannerTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    dateInfoText: {
        fontSize: TextSizes.bannerSubtitle,
        fontFamily: 'Inter-Regular',
    },
    activeFiltersCard: {
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
    },
    activeFiltersTitle: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    activeFiltersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    filterTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterTagText: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-Medium',
    },
    classStatsCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    classStatsTitle: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: TextSizes.statValue,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: TextSizes.statLabel,
        fontFamily: 'Inter-Medium',
    },
});
