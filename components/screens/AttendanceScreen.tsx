import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAttendance } from '@/hooks/useAttendance';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Users, User, Filter, CreditCard as Edit3, Send, ChartBar as BarChart3, ChevronDown, X } from 'lucide-react-native';
import TopSections from '@/components/TopSections';

interface Class {
    id: string;
    name: string;
}

export default function AttendanceScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'mark' | 'view'>('mark');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [customTime, setCustomTime] = useState('');

    const {
        students,
        attendanceRecords,
        attendanceStats,
        currentAttendance,
        loading,
        posting,
        markStudentAttendance,
        postAttendance,
        updateAttendance,
        fetchAttendanceData,
        getStudentAttendanceStats,
    } = useAttendance(selectedClass);

    useEffect(() => {
        if (profile?.role === 'teacher') {
            fetchClasses();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedClass && viewMode === 'view') {
            fetchAttendanceData(startDate, endDate);
        }
    }, [selectedClass, startDate, endDate, viewMode]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setClasses(data || []);
            if (data && data.length > 0) {
                setSelectedClass(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleMarkAttendance = (
        studentId: string,
        status: 'present' | 'late' | 'absent',
        arrivalTime?: string
    ) => {
        markStudentAttendance(studentId, status, arrivalTime);
    };

    const handleCustomTime = () => {
        if (!customTime || !selectedStudent) return;

        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(customTime)) {
            Alert.alert('Error', 'Please enter time in HH:MM format');
            return;
        }

        handleMarkAttendance(selectedStudent, 'present', customTime);
        setTimeModalVisible(false);
        setCustomTime('');
        setSelectedStudent('');
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
                        const result = await postAttendance(selectedDate);
                        if (result.success) {
                            Alert.alert('Success', 'Attendance posted successfully');
                        } else {
                            Alert.alert('Error', 'Failed to post attendance');
                        }
                    },
                },
            ]
        );
    };

    const handleEditAttendance = async () => {
        if (!selectedRecord) return;

        try {
            const result = await updateAttendance(selectedRecord.id, {
                status: selectedRecord.status,
                arrival_time: selectedRecord.arrival_time,
                late_minutes: selectedRecord.late_minutes,
                notes: selectedRecord.notes,
            });

            if (result.success) {
                Alert.alert('Success', 'Attendance updated successfully');
                setEditModalVisible(false);
                setSelectedRecord(null);
            } else {
                Alert.alert('Error', 'Failed to update attendance');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const getStatusIcon = (status: 'present' | 'late' | 'absent' | undefined) => {
        switch (status) {
            case 'present':
                return <CheckCircle size={20} color="#10B981" />;
            case 'late':
                return <AlertCircle size={20} color="#F59E0B" />;
            case 'absent':
                return <XCircle size={20} color="#EF4444" />;
            default:
                return <Clock size={20} color={colors.textSecondary} />;
        }
    };

    const getStatusColor = (status: 'present' | 'late' | 'absent' | undefined) => {
        switch (status) {
            case 'present':
                return '#10B981';
            case 'late':
                return '#F59E0B';
            case 'absent':
                return '#EF4444';
            default:
                return colors.textSecondary;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Student View
    if (profile?.role === 'student') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <TopSections />
                <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                    {/* Student Header */}
                    <View style={styles.studentHeader}>
                        <View style={styles.studentHeaderContent}>
                            <User size={24} color={colors.primary} />
                            <Text style={[styles.studentTitle, { color: colors.text }]}>My Attendance</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <Filter size={16} color={colors.primary} />
                            <Text style={[styles.filterButtonText, { color: colors.primary }]}>Filter</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats Cards */}
                    <View style={styles.statsContainer}>
                        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <CheckCircle size={24} color="#10B981" />
                            <Text style={[styles.statNumber, { color: colors.text }]}>{attendanceStats.presentDays}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <AlertCircle size={24} color="#F59E0B" />
                            <Text style={[styles.statNumber, { color: colors.text }]}>{attendanceStats.lateDays}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <XCircle size={24} color="#EF4444" />
                            <Text style={[styles.statNumber, { color: colors.text }]}>{attendanceStats.absentDays}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                        </View>
                    </View>

                    {/* Attendance Rate */}
                    <View style={[styles.attendanceRateCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <Text style={[styles.attendanceRateTitle, { color: colors.text }]}>Overall Attendance Rate</Text>
                        <Text style={[styles.attendanceRateValue, { color: colors.primary }]}>{attendanceStats.attendanceRate}%</Text>
                        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${attendanceStats.attendanceRate}%`, backgroundColor: colors.primary },
                                ]}
                            />
                        </View>
                        <Text style={[styles.attendanceRateSubtext, { color: colors.textSecondary }]}>
                            {attendanceStats.presentDays + attendanceStats.lateDays} out of {attendanceStats.totalDays} days
                        </Text>
                    </View>

                    {/* Attendance History */}
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance History</Text>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading attendance...</Text>
                            </View>
                        ) : attendanceRecords.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Calendar size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.text }]}>No attendance records found</Text>
                                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                    Attendance records will appear here once marked by your teacher
                                </Text>
                            </View>
                        ) : (
                            attendanceRecords.map((record, index) => (
                                <View key={`${record.date}-${index}`} style={[styles.attendanceCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={styles.attendanceHeader}>
                                        <View style={styles.attendanceDate}>
                                            <Calendar size={16} color={colors.textSecondary} />
                                            <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(record.date)}</Text>
                                        </View>
                                        <View style={styles.statusBadge}>
                                            {getStatusIcon(record.status)}
                                            <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                                                {record.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    {record.arrival_time && (
                                        <View style={[styles.timeInfo, { borderTopColor: colors.border }]}>
                                            <Clock size={14} color={colors.textSecondary} />
                                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                                Arrived at {record.arrival_time}
                                                {record.late_minutes && ` (${record.late_minutes} min late)`}
                                            </Text>
                                        </View>
                                    )}
                                    {record.notes && (
                                        <View style={[styles.notesInfo, { backgroundColor: colors.background }]}>
                                            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{record.notes}</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {/* Filter Modal for Students */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={filterModalVisible}
                        onRequestClose={() => setFilterModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.filterModalContent, { backgroundColor: colors.background }]}>
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Attendance</Text>
                                    <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                        <X size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.filterContent}>
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>From Date</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={startDate}
                                            onChangeText={setStartDate}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>To Date</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={endDate}
                                            onChangeText={setEndDate}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.applyFilterButton, { backgroundColor: colors.primary }]}
                                        onPress={() => {
                                            fetchAttendanceData(startDate, endDate);
                                            setFilterModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.applyFilterButtonText}>Apply Filter</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </SafeAreaView>
            </View>
        );
    }

    // Teacher View
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TopSections />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
                {/* Teacher Header */}
                <View style={styles.teacherHeader}>
                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                viewMode === 'mark' && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setViewMode('mark')}
                        >
                            <CheckCircle size={16} color={viewMode === 'mark' ? '#ffffff' : colors.text} />
                            <Text style={[
                                styles.modeButtonText,
                                { color: colors.text },
                                viewMode === 'mark' && { color: '#ffffff' },
                            ]}>
                                Mark Attendance
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                viewMode === 'view' && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setViewMode('view')}
                        >
                            <BarChart3 size={16} color={viewMode === 'view' ? '#ffffff' : colors.text} />
                            <Text style={[
                                styles.modeButtonText,
                                { color: colors.text },
                                viewMode === 'view' && { color: '#ffffff' },
                            ]}>
                                View Reports
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {viewMode === 'view' && (
                        <TouchableOpacity
                            style={[styles.filterButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <Filter size={16} color={colors.primary} />
                            <Text style={[styles.filterButtonText, { color: colors.primary }]}>Filter</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Class Selection */}
                <View style={styles.classSelection}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.classButtons}>
                            {classes.map((classItem) => (
                                <TouchableOpacity
                                    key={classItem.id}
                                    style={[
                                        styles.classButton,
                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                        selectedClass === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    ]}
                                    onPress={() => setSelectedClass(classItem.id)}
                                >
                                    <Users size={16} color={selectedClass === classItem.id ? '#ffffff' : colors.text} />
                                    <Text style={[
                                        styles.classButtonText,
                                        { color: colors.text },
                                        selectedClass === classItem.id && { color: '#ffffff' },
                                    ]}>
                                        {classItem.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {viewMode === 'mark' ? (
                    // Mark Attendance Mode
                    <>
                        {/* Date Selection */}
                        <View style={styles.dateSelection}>
                            <Text style={[styles.sectionLabel, { color: colors.text }]}>Date: {formatDate(selectedDate)}</Text>
                            <TouchableOpacity
                                style={[styles.changeDateButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                onPress={() => {
                                    // Simple date picker - you can enhance this
                                    const today = new Date().toISOString().split('T')[0];
                                    setSelectedDate(today);
                                }}
                            >
                                <Calendar size={16} color={colors.primary} />
                                <Text style={[styles.changeDateText, { color: colors.primary }]}>Today</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Students List for Marking */}
                        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                            {students.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Users size={48} color={colors.textSecondary} />
                                    <Text style={[styles.emptyText, { color: colors.text }]}>No students in this class</Text>
                                </View>
                            ) : (
                                students.map((student) => {
                                    const record = currentAttendance[student.id];
                                    return (
                                        <View key={student.id} style={[styles.modernStudentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                            <View style={styles.studentCardHeader}>
                                                <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                                                    <Text style={styles.studentInitial}>{student.full_name.charAt(0).toUpperCase()}</Text>
                                                </View>
                                                <View style={styles.studentInfo}>
                                                    <Text style={[styles.studentName, { color: colors.text }]}>{student.full_name}</Text>
                                                    <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>Roll: {student.roll_number}</Text>
                                                </View>
                                                <View style={styles.statusIndicator}>
                                                    {getStatusIcon(record?.status)}
                                                    {record && (
                                                        <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                                                            {record.status?.toUpperCase()}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>

                                            {record?.arrival_time && (
                                                <View style={[styles.timeInfo, { backgroundColor: colors.background }]}>
                                                    <Clock size={14} color={colors.textSecondary} />
                                                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                                        Arrived at {record.arrival_time}
                                                        {record.late_minutes && ` (${record.late_minutes} min late)`}
                                                    </Text>
                                                </View>
                                            )}

                                            <View style={styles.actionButtons}>
                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.presentButton]}
                                                    onPress={() => handleMarkAttendance(student.id, 'present')}
                                                >
                                                    <CheckCircle size={16} color="#ffffff" />
                                                    <Text style={styles.actionButtonText}>Present</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.customTimeButton]}
                                                    onPress={() => {
                                                        setSelectedStudent(student.id);
                                                        setTimeModalVisible(true);
                                                    }}
                                                >
                                                    <Clock size={16} color="#ffffff" />
                                                    <Text style={styles.actionButtonText}>Custom</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionButton, styles.absentButton]}
                                                    onPress={() => handleMarkAttendance(student.id, 'absent')}
                                                >
                                                    <XCircle size={16} color="#ffffff" />
                                                    <Text style={styles.actionButtonText}>Absent</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>

                        {/* Post Attendance Button */}
                        {Object.keys(currentAttendance).length > 0 && (
                            <View style={[styles.postAttendanceContainer, { backgroundColor: colors.background }]}>
                                <TouchableOpacity
                                    style={[styles.postAttendanceButton, { backgroundColor: colors.primary }]}
                                    onPress={handlePostAttendance}
                                    disabled={posting}
                                >
                                    {posting ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <>
                                            <Send size={20} color="#ffffff" />
                                            <Text style={styles.postAttendanceText}>
                                                Post Attendance ({Object.keys(currentAttendance).length}/{students.length})
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                ) : (
                    // View Reports Mode
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                        {/* Class Stats */}
                        <View style={[styles.classStatsCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.classStatsTitle, { color: colors.text }]}>
                                {classes.find(c => c.id === selectedClass)?.name} - Attendance Overview
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

                        {/* Attendance Records */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance Records</Text>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading attendance...</Text>
                            </View>
                        ) : attendanceRecords.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Calendar size={48} color={colors.textSecondary} />
                                <Text style={[styles.emptyText, { color: colors.text }]}>No attendance records found</Text>
                                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                    Adjust your date range or select a different class
                                </Text>
                            </View>
                        ) : (
                            attendanceRecords.map((record) => (
                                <TouchableOpacity
                                    key={record.id}
                                    style={[styles.attendanceRecordCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={() => {
                                        setSelectedRecord(record);
                                        setEditModalVisible(true);
                                    }}
                                >
                                    <View style={styles.recordHeader}>
                                        <View style={styles.studentInfo}>
                                            <Text style={[styles.studentName, { color: colors.text }]}>{record.students?.full_name}</Text>
                                            <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>
                                                {record.students?.roll_number} • {formatDate(record.date)}
                                            </Text>
                                        </View>
                                        <View style={styles.statusBadge}>
                                            {getStatusIcon(record.status)}
                                            <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                                                {record.status.toUpperCase()}
                                            </Text>
                                        </View>
                                        <TouchableOpacity style={styles.editButton}>
                                            <Edit3 size={16} color={colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                    {record.arrival_time && (
                                        <View style={styles.recordDetails}>
                                            <Clock size={14} color={colors.textSecondary} />
                                            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                                                {record.arrival_time}
                                                {record.late_minutes && ` (${record.late_minutes} min late)`}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}

                {/* Custom Time Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={timeModalVisible}
                    onRequestClose={() => setTimeModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.timeModalContent, { backgroundColor: colors.background }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Arrival Time</Text>
                                <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.timeModalBody}>
                                <TextInput
                                    style={[styles.timeInput, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={customTime}
                                    onChangeText={setCustomTime}
                                    placeholder="HH:MM (e.g., 16:30)"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                />
                                <View style={styles.timeModalButtons}>
                                    <TouchableOpacity
                                        style={[styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                        onPress={() => setTimeModalVisible(false)}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                                        onPress={handleCustomTime}
                                    >
                                        <Text style={styles.confirmButtonText}>Mark Present</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Edit Attendance Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={editModalVisible}
                    onRequestClose={() => setEditModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.editModalContent, { backgroundColor: colors.background }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Attendance</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {selectedRecord && (
                                <ScrollView style={styles.editModalBody}>
                                    <View style={[styles.studentInfoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                        <Text style={[styles.editStudentName, { color: colors.text }]}>
                                            {selectedRecord.students?.full_name}
                                        </Text>
                                        <Text style={[styles.editStudentDetails, { color: colors.textSecondary }]}>
                                            {selectedRecord.students?.roll_number} • {formatDate(selectedRecord.date)}
                                        </Text>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Status</Text>
                                        <View style={styles.statusOptions}>
                                            {[
                                                { value: 'present', label: 'Present', icon: CheckCircle, color: '#10B981' },
                                                { value: 'late', label: 'Late', icon: AlertCircle, color: '#F59E0B' },
                                                { value: 'absent', label: 'Absent', icon: XCircle, color: '#EF4444' },
                                            ].map((option) => (
                                                <TouchableOpacity
                                                    key={option.value}
                                                    style={[
                                                        styles.statusOption,
                                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                        selectedRecord.status === option.value && { backgroundColor: option.color, borderColor: option.color },
                                                    ]}
                                                    onPress={() => setSelectedRecord({ ...selectedRecord, status: option.value })}
                                                >
                                                    <option.icon size={16} color={selectedRecord.status === option.value ? '#ffffff' : option.color} />
                                                    <Text style={[
                                                        styles.statusOptionText,
                                                        { color: colors.text },
                                                        selectedRecord.status === option.value && { color: '#ffffff' },
                                                    ]}>
                                                        {option.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>

                                    {selectedRecord.status !== 'absent' && (
                                        <View style={styles.inputGroup}>
                                            <Text style={[styles.label, { color: colors.text }]}>Arrival Time</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={selectedRecord.arrival_time || ''}
                                                onChangeText={(text) => setSelectedRecord({ ...selectedRecord, arrival_time: text })}
                                                placeholder="HH:MM"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>
                                    )}

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                                        <TextInput
                                            style={[styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={selectedRecord.notes || ''}
                                            onChangeText={(text) => setSelectedRecord({ ...selectedRecord, notes: text })}
                                            placeholder="Add notes about this attendance record"
                                            placeholderTextColor={colors.textSecondary}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                                        onPress={handleEditAttendance}
                                    >
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Filter Modal for Teachers */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={filterModalVisible}
                    onRequestClose={() => setFilterModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.filterModalContent, { backgroundColor: colors.background }]}>
                            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Attendance Records</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.filterContent}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>From Date</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        value={startDate}
                                        onChangeText={setStartDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>To Date</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        value={endDate}
                                        onChangeText={setEndDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                <View style={styles.quickFilters}>
                                    <Text style={[styles.quickFiltersLabel, { color: colors.text }]}>Quick Filters</Text>
                                    <View style={styles.quickFilterButtons}>
                                        {[
                                            { label: 'Today', days: 0 },
                                            { label: 'This Week', days: 7 },
                                            { label: 'This Month', days: 30 },
                                        ].map((filter) => (
                                            <TouchableOpacity
                                                key={filter.label}
                                                style={[styles.quickFilterButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                                onPress={() => {
                                                    const today = new Date();
                                                    const start = new Date(today);
                                                    start.setDate(today.getDate() - filter.days);
                                                    setStartDate(start.toISOString().split('T')[0]);
                                                    setEndDate(today.toISOString().split('T')[0]);
                                                }}
                                            >
                                                <Text style={[styles.quickFilterText, { color: colors.text }]}>{filter.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.applyFilterButton, { backgroundColor: colors.primary }]}
                                    onPress={() => {
                                        fetchAttendanceData(startDate, endDate);
                                        setFilterModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.applyFilterButtonText}>Apply Filter</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    studentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    studentHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    studentTitle: {
        fontSize: 24,
        fontFamily: 'Inter-SemiBold',
        marginLeft: 12,
    },
    teacherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    modeToggle: {
        flexDirection: 'row',
        gap: 8,
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 12,
        gap: 6,
    },
    modeButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 12,
        gap: 6,
    },
    filterButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    classSelection: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    classButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    classButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    classButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    dateSelection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    changeDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    changeDateText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontFamily: 'Inter-SemiBold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        marginTop: 4,
    },
    attendanceRateCard: {
        marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    attendanceRateTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    attendanceRateValue: {
        fontSize: 32,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    attendanceRateSubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
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
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginTop: 12,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    modernStudentCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    studentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    studentInitial: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    rollNumber: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    statusIndicator: {
        alignItems: 'center',
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        marginTop: 4,
    },
    timeInfo: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginLeft: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    presentButton: {
        backgroundColor: '#10B981',
    },
    customTimeButton: {
        backgroundColor: '#274d71',
    },
    absentButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
    postAttendanceContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    postAttendanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    postAttendanceText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
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
    attendanceCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    attendanceDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        marginLeft: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    notesInfo: {
        borderRadius: 8,
        padding: 8,
        marginTop: 8,
    },
    notesText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    attendanceRecordCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    recordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    editButton: {
        padding: 8,
    },
    recordDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    timeModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '40%',
    },
    filterModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    editModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    timeModalBody: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    timeInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        marginBottom: 24,
    },
    timeModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    confirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    editModalBody: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    studentInfoCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    editStudentName: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    editStudentDetails: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        height: 80,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        textAlignVertical: 'top',
    },
    statusOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    statusOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    statusOptionText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    saveButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    filterContent: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    quickFilters: {
        marginBottom: 20,
    },
    quickFiltersLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 12,
    },
    quickFilterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    quickFilterButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    quickFilterText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    applyFilterButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyFilterButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});