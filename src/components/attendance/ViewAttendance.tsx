// screens/ViewAttendance.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Users, User, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAttendance } from '@/src/hooks/useAttendance';
import { supabase } from '@/src/lib/supabase';
import { EmptyState } from '@/src/components/attendance/EmptyState';
import { LoadingState } from '@/src/components/attendance/LoadingState';
import { AttendanceRecordCard } from '@/src/components/attendance/AttendanceRecordCard';
import { ViewAttendanceFilterModal } from '@/src/components/attendance/modals/ViewAttendanceFilterModal';
import { TextSizes } from '@/src/styles/TextSizes';

interface Class {
    id: string;
    name: string;
}

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    parent_contact: string;
    class_id?: string;
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
    };
    created_at: string;
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

interface ViewAttendanceProps {
    onBack: () => void;
}

export const ViewAttendance: React.FC<ViewAttendanceProps> = ({ onBack }) => {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [classes, setClasses] = useState<Class[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

    // Filter states
    const [filters, setFilters] = useState<ViewFilterData>({
        selectedClass: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'all',
        dateRange: 'today',
        viewType: 'class',
        selectedStudent: '',
    });

    const {
        attendanceStats,
        getStudentAttendanceStats,
    } = useAttendance(filters.selectedClass);

    useEffect(() => {
        initializeData();
    }, []);

    useEffect(() => {
        if (filters.selectedClass) {
            fetchAttendanceData();
        }
    }, [filters]);

    const initializeData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchClasses(),
                fetchAllStudents(),
            ]);
        } catch (error) {
            console.error('Error initializing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setClasses(data || []);
            if (data && data.length > 0 && !filters.selectedClass) {
                setFilters(prev => ({ ...prev, selectedClass: data[0].id }));
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
                .order('full_name');

            if (error) throw error;
            setAllStudents(data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchAttendanceData = async () => {
        if (!filters.selectedClass) return;

        setLoading(true);
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
                .eq('class_id', filters.selectedClass)
                .gte('date', filters.startDate)
                .lte('date', filters.endDate)
                .order('date', { ascending: false });

            // Filter by student if individual view
            if (filters.viewType === 'student' && filters.selectedStudent) {
                query = query.eq('student_id', filters.selectedStudent);
            }

            // Filter by status
            if (filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;
            if (error) throw error;

            setAttendanceData(data || []);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await initializeData();
            await fetchAttendanceData();
        } catch (error) {
            console.error('Error during refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleApplyFilters = (newFilters: ViewFilterData) => {
        setFilters(newFilters);
    };

    const hasActiveFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        return (
            filters.startDate !== today ||
            filters.endDate !== today ||
            filters.status !== 'all' ||
            filters.dateRange !== 'today' ||
            filters.viewType !== 'class' ||
            filters.selectedStudent !== ''
        );
    };

    const getClassStudents = () => {
        return allStudents.filter(student => student.class_id === filters.selectedClass);
    };

    const getSelectedStudent = () => {
        return allStudents.find(student => student.id === filters.selectedStudent);
    };

    const calculateClassStats = () => {
        const classStudents = getClassStudents();
        const totalStudents = classStudents.length;

        if (totalStudents === 0) return null;

        const stats = {
            totalStudents,
            presentCount: 0,
            lateCount: 0,
            absentCount: 0,
            attendanceRate: 0,
        };

        // Calculate stats for the selected date range
        const uniqueDates = [...new Set(attendanceData.map(record => record.date))];

        if (uniqueDates.length > 0) {
            const totalRecords = attendanceData.length;
            stats.presentCount = attendanceData.filter(r => r.status === 'present').length;
            stats.lateCount = attendanceData.filter(r => r.status === 'late').length;
            stats.absentCount = attendanceData.filter(r => r.status === 'absent').length;
            stats.attendanceRate = totalRecords > 0 ? Math.round(((stats.presentCount + stats.lateCount) / totalRecords) * 100) : 0;
        }

        return stats;
    };

    const renderViewTypeHeader = () => {
        const selectedClass = classes.find(c => c.id === filters.selectedClass);
        const selectedStudent = getSelectedStudent();

        return (
            <View style={[styles.viewHeader, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.viewTypeInfo}>
                    {filters.viewType === 'class' ? (
                        <>
                            <Users size={24} color={colors.primary} />
                            <View>
                                <Text allowFontScaling={false} style={[styles.viewTypeTitle, { color: colors.text }]}>Class View</Text>
                                <Text allowFontScaling={false} style={[styles.viewTypeSubtitle, { color: colors.textSecondary }]}>
                                    {selectedClass?.name} ({getClassStudents().length} students)
                                </Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <User size={24} color={colors.primary} />
                            <View>
                                <Text allowFontScaling={false} style={[styles.viewTypeTitle, { color: colors.text }]}>Individual View</Text>
                                <Text allowFontScaling={false} style={[styles.viewTypeSubtitle, { color: colors.textSecondary }]}>
                                    {selectedStudent ? `${selectedStudent.full_name} (${selectedStudent.roll_number})` : 'No student selected'}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.filterButton, { backgroundColor: colors.primary }]}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Text allowFontScaling={false} style={styles.filterButtonText}>Filter</Text>
                    {hasActiveFilters() && <View style={styles.activeFilterDot} />}
                </TouchableOpacity>
            </View>
        );
    };

    const renderActiveFilters = () => {
        if (!hasActiveFilters()) return null;

        return (
            <View style={[styles.activeFiltersContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text allowFontScaling={false} style={[styles.activeFiltersTitle, { color: colors.text }]}>Active Filters:</Text>
                <View style={styles.filterTagsContainer}>
                    {filters.dateRange !== 'today' && (
                        <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                            <Text allowFontScaling={false} style={[styles.filterTagText, { color: colors.primary }]}>
                                {filters.dateRange === 'week' ? 'Last 7 days' :
                                    filters.dateRange === 'month' ? 'Last 30 days' : 'Custom range'}
                            </Text>
                        </View>
                    )}
                    {filters.status !== 'all' && (
                        <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                            <Text allowFontScaling={false} style={[styles.filterTagText, { color: colors.primary }]}>
                                {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
                            </Text>
                        </View>
                    )}
                    {filters.viewType === 'student' && (
                        <View style={[styles.filterTag, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                            <Text allowFontScaling={false} style={[styles.filterTagText, { color: colors.primary }]}>Individual</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderStatsCards = () => {
        if (filters.viewType === 'class') {
            const stats = calculateClassStats();
            if (!stats) return null;

            return (
                <View style={styles.statsContainer}>
                    <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.statsCardTitle, { color: colors.text }]}>Class Overview</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <CheckCircle size={20} color="#10B981" />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#10B981' }]}>{stats.presentCount}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                            </View>
                            <View style={styles.statItem}>
                                <AlertCircle size={20} color="#F59E0B" />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#F59E0B' }]}>{stats.lateCount}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                            </View>
                            <View style={styles.statItem}>
                                <XCircle size={20} color="#EF4444" />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#EF4444' }]}>{stats.absentCount}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                            </View>
                            <View style={styles.statItem}>
                                <TrendingUp size={20} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: colors.primary }]}>{stats.attendanceRate}%</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Rate</Text>
                            </View>
                        </View>
                    </View>
                </View>
            );
        } else {
            // Individual student stats
            const selectedStudent = getSelectedStudent();
            if (!selectedStudent) return null;

            const studentStats = getStudentAttendanceStats(
                filters.selectedStudent,
                filters.startDate,
                filters.endDate
            );

            return (
                <View style={styles.statsContainer}>
                    <View style={[styles.statsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.statsCardTitle, { color: colors.text }]}>
                            {selectedStudent.full_name}'s Attendance
                        </Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Calendar size={20} color={colors.textSecondary} />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: colors.textSecondary }]}>{studentStats.totalDays}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Total Days</Text>
                            </View>
                            <View style={styles.statItem}>
                                <CheckCircle size={20} color="#10B981" />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#10B981' }]}>{studentStats.presentDays}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                            </View>
                            <View style={styles.statItem}>
                                <AlertCircle size={20} color="#F59E0B" />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: '#F59E0B' }]}>{studentStats.lateDays}</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                            </View>
                            <View style={styles.statItem}>
                                <TrendingUp size={20} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.statValue, { color: colors.primary }]}>{studentStats.attendanceRate}%</Text>
                                <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Rate</Text>
                            </View>
                        </View>
                    </View>
                </View>
            );
        }
    };

    const renderAttendanceRecords = () => {
        if (loading) {
            return <LoadingState message="Loading attendance records..." />;
        }

        if (attendanceData.length === 0) {
            return (
                <EmptyState
                    icon={<Calendar size={48} color={colors.textSecondary} />}
                    title="No attendance records found"
                    subtitle="Try adjusting your filters or date range"
                />
            );
        }

        return (
            <View style={styles.recordsContainer}>
                <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>
                    {/* Attendance Records ({attendanceData.length}) */}
                </Text>
                {attendanceData.map((record) => (
                    <AttendanceRecordCard
                        key={record.id}
                        record={record}
                        showStudentInfo={filters.viewType === 'class'}
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderViewTypeHeader()}

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
                {renderActiveFilters()}
                {renderStatsCards()}
                {renderAttendanceRecords()}
            </ScrollView>

            <ViewAttendanceFilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                classes={classes}
                students={allStudents}
                currentFilters={filters}
                onApplyFilters={handleApplyFilters}
            />
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    viewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
    },
    viewTypeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    viewTypeTitle: {
        fontSize: TextSizes.medium, // smaller than before
        fontFamily: 'Inter-SemiBold',
    },
    viewTypeSubtitle: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginTop: 1,
    },
    filterButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        position: 'relative',
    },
    filterButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
    },
    activeFilterDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    activeFiltersContainer: {
        borderRadius: 8,
        padding: 10,
        marginTop: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    activeFiltersTitle: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    filterTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    filterTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
    },
    filterTagText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    statsContainer: {
        marginBottom: 14,
    },
    statsCard: {
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statsCardTitle: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
    },
    statValue: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
    statLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    recordsContainer: {
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
});



// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     scrollView: {
//         flex: 1,
//         paddingHorizontal: 24,
//     },
//     viewHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         padding: 20,
//         borderBottomWidth: 1,
//     },
//     viewTypeInfo: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//         flex: 1,
//     },
//     viewTypeTitle: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//     },
//     viewTypeSubtitle: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         marginTop: 2,
//     },
//     filterButton: {
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         borderRadius: 12,
//         position: 'relative',
//     },
//     filterButtonText: {
//         color: '#ffffff',
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//     },
//     activeFilterDot: {
//         position: 'absolute',
//         top: -2,
//         right: -2,
//         width: 12,
//         height: 12,
//         borderRadius: 6,
//         backgroundColor: '#EF4444',
//     },
//     activeFiltersContainer: {
//         borderRadius: 12,
//         padding: 16,
//         marginTop: 20,
//         marginBottom: 20,
//         borderWidth: 1,
//     },
//     activeFiltersTitle: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 8,
//     },
//     filterTagsContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 8,
//     },
//     filterTag: {
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 16,
//         borderWidth: 1,
//     },
//     filterTagText: {
//         fontSize: 12,
//         fontFamily: 'Inter-Medium',
//     },
//     statsContainer: {
//         marginBottom: 24,
//     },
//     statsCard: {
//         borderRadius: 16,
//         padding: 20,
//         borderWidth: 1,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     statsCardTitle: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 16,
//     },
//     statsGrid: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//     },
//     statItem: {
//         alignItems: 'center',
//         gap: 8,
//     },
//     statValue: {
//         fontSize: 20,
//         fontFamily: 'Inter-SemiBold',
//     },
//     statLabel: {
//         fontSize: 12,
//         fontFamily: 'Inter-Medium',
//     },
//     recordsContainer: {
//         marginBottom: 24,
//     },
//     sectionTitle: {
//         fontSize: 20,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 16,
//     },
// });