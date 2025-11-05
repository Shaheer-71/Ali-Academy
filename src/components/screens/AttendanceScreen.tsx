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

interface Class {
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
    date: string;
    arrival_time?: string;
    status: 'present' | 'late' | 'absent';
    late_minutes?: number;
    students?: {
        full_name: string;
        roll_number: string;
        parent_contact: string;
    };
    created_at: string;
}

interface FilterData {
    selectedClass: string;
    startDate: string;
    endDate: string;
    status: 'all' | 'present' | 'late' | 'absent';
    dateRange: 'today' | 'week' | 'month' | 'custom';
}

interface ViewFilterData {
    selectedClass: string;
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
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [viewMode, setViewMode] = useState<'mark' | 'view' | 'reports'>('mark');

    // Filter states for mark/reports modes
    const [filters, setFilters] = useState<FilterData>({
        selectedClass: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'all',
        dateRange: 'today',
    });

    // Separate filter states for view mode
    const [viewFilters, setViewFilters] = useState<ViewFilterData>({
        selectedClass: '',
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

    // Use existing hook for mark/reports modes
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
    } = useAttendance(filters.selectedClass);

    useEffect(() => {
        if (profile?.role === 'teacher') {
            fetchClasses();
            fetchAllStudents();
        }
    }, [profile]);

    // Apply filters when they change for reports mode
    useEffect(() => {
        if (filters.selectedClass && viewMode === 'reports') {
            fetchAttendanceData(filters.startDate, filters.endDate);
        }
    }, [filters.selectedClass, filters.startDate, filters.endDate, viewMode]);

    // Fetch today's attendance for mark mode
    useEffect(() => {
        if (filters.selectedClass && viewMode === 'mark') {
            fetchTodaysAttendance(filters.startDate);
        }
    }, [filters.selectedClass, filters.startDate, viewMode]);

    // Handle view mode data fetching
    useEffect(() => {
        if (viewMode === 'view' && viewFilters.selectedClass && (viewFilters.viewType === 'class' || viewFilters.selectedStudent)) {
            fetchViewAttendanceData();
        }
    }, [viewFilters, viewMode]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setClasses(data || []);
            if (data && data.length > 0) {
                const firstClassId = data[0].id;
                setFilters(prev => ({ ...prev, selectedClass: firstClassId }));
                setViewFilters(prev => ({ ...prev, selectedClass: firstClassId }));
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, full_name, roll_number, parent_contact, class_id')
                .eq('is_deleted', false)
                .order('roll_number');

            if (error) throw error;
            setAllStudents(data || []);
        } catch (error) {
            console.error('Error fetching all students:', error);
            setAllStudents([]);
        }
    };

    const fetchViewAttendanceData = async () => {
        if (!viewFilters.selectedClass) return;

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
                    )
                `)
                .eq('class_id', viewFilters.selectedClass)
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
                            } else {
                                Alert.alert('Error', 'Failed to post attendance');
                            }
                        } catch (error: any) {
                            console.error('Error posting attendance:', error);
                            Alert.alert('Error', 'Failed to post attendance');
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
            } else if (viewMode === 'reports' && filters.selectedClass) {
                await fetchAttendanceData(filters.startDate, filters.endDate);
            } else {
                await onRefresh();
                if (filters.selectedClass && filters.startDate) {
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

        if (mode === 'reports' && filters.selectedClass) {
            setTimeout(() => {
                fetchAttendanceData(filters.startDate, filters.endDate);
            }, 100);
        }

        if (mode === 'mark' && filters.selectedClass && filters.startDate) {
            setTimeout(() => {
                fetchTodaysAttendance(filters.startDate);
            }, 100);
        }

        if (mode === 'view' && viewFilters.selectedClass) {
            setTimeout(() => {
                fetchViewAttendanceData();
            }, 100);
        }
    };

    // Handle filter application for mark/reports modes
    const handleApplyFilters = (newFilters: FilterData) => {
        // Clear all data when changing class
        if (newFilters.selectedClass !== filters.selectedClass) {
            clearAllData();
            clearCurrentAttendance();
        }

        setFilters(newFilters);
    };

    // Handle filter application for view mode
    const handleApplyViewFilters = (newFilters: ViewFilterData) => {
        setViewFilters(newFilters);
    };

    // Check if any filters are active for mark/reports modes
    const hasActiveFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        const defaultFilters: FilterData = {
            selectedClass: classes.length > 0 ? classes[0].id : '',
            startDate: today,
            endDate: today,
            status: 'all',
            dateRange: 'today',
        };

        return (
            filters.selectedClass !== defaultFilters.selectedClass ||
            filters.startDate !== defaultFilters.startDate ||
            filters.endDate !== defaultFilters.endDate ||
            filters.status !== defaultFilters.status ||
            filters.dateRange !== defaultFilters.dateRange
        );
    };

    // Check if any filters are active for view mode
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

    // Get students for selected class in view mode
    const getStudentsForClass = (classId: string) => {
        return allStudents.filter(student => student.class_id === classId);
    };

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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance History</Text>
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
                {loading ? (
                    // <LoadingState message={`Loading students for ${classes.find(c => c.id === filters.selectedClass)?.name || 'selected class'}...`} />
                    <Text></Text>
                ) : students.length === 0 ? (
                    <EmptyState
                        icon={<Users size={48} color={colors.textSecondary} />}
                        title="No students in this class"
                        subtitle="Pull down to refresh or add students to this class"
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
                    <Text style={[styles.statsTitle, { color: colors.text }]}>
                        {viewFilters.viewType === 'student'
                            ? `${allStudents.find(s => s.id === viewFilters.selectedStudent)?.full_name || 'Student'} - Attendance Stats`
                            : `${classes.find(c => c.id === viewFilters.selectedClass)?.name || 'Class'} - Overview`
                        }
                    </Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textSecondary }]}>{viewAttendanceStats.totalDays}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Days</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{viewAttendanceStats.presentDays}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{viewAttendanceStats.lateDays}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#EF4444' }]}>{viewAttendanceStats.absentDays}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                    </View>
                </View>

                <View style={[styles.attendanceRateContainer, { backgroundColor: colors.primary }]}>
                    <Text style={styles.attendanceRateLabel}>Overall Attendance Rate</Text>
                    <Text style={styles.attendanceRateValue}>{viewAttendanceStats.attendanceRate}%</Text>
                </View>
            </View>

            {/* Active Filters Display */}
            {hasActiveViewFilters() && (
                <View style={[styles.activeFiltersCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.activeFiltersTitle, { color: colors.text }]}>Active Filters:</Text>
                    <View style={styles.activeFiltersList}>
                        {viewFilters.viewType === 'student' && viewFilters.selectedStudent && (
                            <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                                <Text style={[styles.filterTagText, { color: colors.primary }]}>
                                    Student: {allStudents.find(s => s.id === viewFilters.selectedStudent)?.full_name || 'Unknown'}
                                </Text>
                            </View>
                        )}
                        {viewFilters.status !== 'all' && (
                            <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                                <Text style={[styles.filterTagText, { color: colors.primary }]}>
                                    Status: {viewFilters.status.charAt(0).toUpperCase() + viewFilters.status.slice(1)}
                                </Text>
                            </View>
                        )}
                        {viewFilters.dateRange !== 'today' && (
                            <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                                <Text style={[styles.filterTagText, { color: colors.primary }]}>
                                    Range: {viewFilters.dateRange === 'week' ? 'Last 7 days' : viewFilters.dateRange === 'month' ? 'Last 30 days' : 'Custom'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Attendance Records ({viewAttendanceRecords.length})
            </Text>

            {viewLoading ? (
                <LoadingState message="Loading attendance data..." />
            ) : !viewFilters.selectedClass ? (
                <EmptyState
                    icon={<Users size={48} color={colors.textSecondary} />}
                    title="No class selected"
                    subtitle="Please use filters to select a class"
                />
            ) : viewFilters.viewType === 'student' && !viewFilters.selectedStudent ? (
                <EmptyState
                    icon={<Users size={48} color={colors.textSecondary} />}
                    title="No student selected"
                    subtitle="Please use filters to select a student for individual view"
                />
            ) : viewAttendanceRecords.length === 0 ? (
                <EmptyState
                    icon={<Calendar size={48} color={colors.textSecondary} />}
                    title="No attendance records found"
                    subtitle="No records match your current filters. Try adjusting the date range or status filter."
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
                <Text style={[styles.classStatsTitle, { color: colors.text }]}>
                    {classes.find(c => c.id === filters.selectedClass)?.name} - Attendance Overview
                </Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{attendanceStats.presentDays}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{attendanceStats.lateDays}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#EF4444' }]}>{attendanceStats.absentDays}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{attendanceStats.attendanceRate}%</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rate</Text>
                    </View>
                </View>
            </View>

            {/* Active Filters Display */}
            {(filters.status !== 'all' || filters.dateRange !== 'today') && (
                <View style={[styles.activeFiltersCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.activeFiltersTitle, { color: colors.text }]}>Active Filters:</Text>
                    <View style={styles.activeFiltersList}>
                        {filters.status !== 'all' && (
                            <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                                <Text style={[styles.filterTagText, { color: colors.primary }]}>
                                    Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                                </Text>
                            </View>
                        )}
                        {filters.dateRange !== 'today' && (
                            <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                                <Text style={[styles.filterTagText, { color: colors.primary }]}>
                                    Range: {filters.dateRange === 'week' ? 'Last 7 days' : filters.dateRange === 'month' ? 'Last 30 days' : 'Custom'}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance Records</Text>
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

        // For teachers, render based on view mode
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

    // 🔄 Automatically refresh attendance data when screen becomes active
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

                {
                    profile?.role === "teacher" && (
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
                    )
                }


                {renderContent()}

                {/* Filter Modal for Mark/Reports modes */}

                <ComprehensiveFilterModal
                    visible={filterModalVisible}
                    onClose={() => setFilterModalVisible(false)}
                    classes={classes}
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
                    students={getStudentsForClass(viewFilters.selectedClass)}
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
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    statsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    statsTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        flex: 1,
    },
    attendanceRateContainer: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    attendanceRateLabel: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    attendanceRateValue: {
        color: '#ffffff',
        fontSize: 28,
        fontFamily: 'Inter-Bold',
    },
    classInfoBanner: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    classInfoText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    dateInfoText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    activeFiltersCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    activeFiltersTitle: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    activeFiltersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    filterTagText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    classStatsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    classStatsTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
});