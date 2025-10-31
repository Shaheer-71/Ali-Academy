// screens/FeeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import {
    Clock,
    Check,
    AlertCircle,
    DollarSign,
    Bell,
} from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import TopSections from '@/src/components/common/TopSections';
import { SwipeableFeeCard } from '../fee/SwipeableFeeCard';
import { FeeDetailsModal } from '../fee/FeeDetailsModal';

import {
    feeService,
    StudentWithFeeStatus,
    FeePayment,
} from '@/src/services/feeService';
import { classService } from '@/src/services/feeService';
import { notificationService } from '@/src/services/feeService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const CURRENT_YEAR = new Date().getFullYear();

export default function FeeScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();

    // State Management
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [students, setStudents] = useState<StudentWithFeeStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');
    const [feeRecords, setFeeRecords] = useState<FeePayment[]>([]);
    const [feeStructure, setFeeStructure] = useState<any>(null);

    // Load classes on component mount
    useEffect(() => {
        if (profile?.role === 'teacher') {
            initializeClasses();
        }
    }, [profile]);

    // Load students and fees when class, month, or year changes
    useEffect(() => {
        if (selectedClass) {
            loadStudentsAndFees();
            loadFeeStructure();
        }
    }, [selectedMonth, selectedYear, selectedClass]);

    const initializeClasses = async () => {
        try {
            const classesData = await classService.getTeacherClasses();
            setClasses(classesData);
            if (classesData.length > 0) {
                setSelectedClass(classesData[0].id);
            }
        } catch (error) {
            console.error('Error loading classes:', error);
            Alert.alert('Error', 'Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const loadStudentsAndFees = async () => {
        try {
            setLoading(true);
            const studentsData = await feeService.getStudentsWithFeeStatus(
                selectedClass,
                selectedMonth,
                selectedYear
            );
            setStudents(studentsData);
        } catch (error) {
            console.error('Error loading students and fees:', error);
            Alert.alert('Error', 'Failed to load fee data');
        } finally {
            setLoading(false);
        }
    };

    const loadFeeStructure = async () => {
        try {
            const structure = await feeService.getFeeStructure(selectedClass);
            setFeeStructure(structure);
        } catch (error) {
            console.error('Error loading fee structure:', error);
        }
    };

    const handleSelectStudent = async (student: StudentWithFeeStatus) => {
        try {
            const payments = await feeService.getStudentFeePayments(student.id);
            setSelectedStudentId(student.id);
            setSelectedStudentName(student.full_name);
            setFeeRecords(payments);
            setModalVisible(true);
        } catch (error) {
            console.error('Error fetching student fee records:', error);
            Alert.alert('Error', 'Failed to fetch fee records');
        }
    };

    const handleRefreshModal = async () => {
        try {
            // Refresh fee records
            const payments = await feeService.getStudentFeePayments(selectedStudentId);
            setFeeRecords(payments);

            // Refresh students list
            await loadStudentsAndFees();
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    const handleSendNotification = (studentId: string) => {
        Alert.alert(
            'Send Notification',
            `Notify this student about the fee payment?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: () => sendFeeNotification([studentId], 'single'),
                },
            ]
        );
    };

    // const sendFeeNotification = async (
    //     studentIds: string[],
    //     type: 'single' | 'all'
    // ) => {
    //     try {
    //         let recipientList: any[] = [];

    //         if (type === 'single') {
    //             recipientList = students.filter(s => studentIds.includes(s.id));
    //         } else {
    //             // get all students in the class
    //             const { data: allStudents } = await supabase
    //                 .from('students')
    //                 .select('id, full_name, parent_contact')
    //                 .eq('class_id', selectedClass);

    //             // get paid students for month/year
    //             const { data: paidStudents } = await supabase
    //                 .from('fee_payments')
    //                 .select('student_id')
    //                 .eq('class_id', selectedClass)
    //                 .eq('month', selectedMonth)
    //                 .eq('year', selectedYear)
    //                 .eq('payment_status', 'paid');

    //             const paidIds = new Set(paidStudents?.map(p => p.student_id) || []);
    //             recipientList = allStudents.filter(s => !paidIds.has(s.id));
    //         }

    //         if (!recipientList.length) {
    //             Alert.alert('Info', 'No students to notify');
    //             return;
    //         }

    //         // ✅ target_type fixed
    //         const notif = await notificationService.createNotification({
    //             type: 'fee_reminder',
    //             title: `Fee Reminder for ${MONTHS[selectedMonth - 1]}`,
    //             message: `Please pay the fee for ${MONTHS[selectedMonth - 1]} ${selectedYear}.`,
    //             entity_type: 'fee_payment',
    //             created_by: profile!.id,
    //             target_type: type === 'single' ? 'individual' : 'class',
    //             target_id: type === 'single' ? studentIds[0] : selectedClass,
    //             priority: 'medium',
    //         });

    //         const recipients = recipientList.map(s => ({
    //             notification_id: notif.id,
    //             user_id: s.id,
    //             is_read: false,
    //             is_deleted: false,
    //         }));

    //         await notificationService.addNotificationRecipients(recipients);

    //         Alert.alert('Success', `Fee reminder sent to ${recipientList.length} student(s)`);
    //         await loadStudentsAndFees();
    //     } catch (error: any) {
    //         console.error('Error sending notifications:', error);
    //         Alert.alert('Error', error.message || 'Failed to send notifications');
    //     }
    // };

    const sendFeeNotification = async (
        studentIds: string[],
        type: 'single' | 'all'
    ) => {
        try {
            let recipientList: any[] = [];

            if (type === 'single') {
                recipientList = students.filter(s => studentIds.includes(s.id));
            } else {
                // get all students in the class
                const { data: allStudents } = await supabase
                    .from('students')
                    .select('id, full_name, parent_contact')
                    .eq('class_id', selectedClass);

                // get paid students for month/year
                const { data: paidStudents } = await supabase
                    .from('fee_payments')
                    .select('student_id')
                    .eq('class_id', selectedClass)
                    .eq('month', selectedMonth)
                    .eq('year', selectedYear)
                    .eq('payment_status', 'paid');

                const paidIds = new Set(paidStudents?.map(p => p.student_id) || []);
                recipientList = allStudents.filter(s => !paidIds.has(s.id));
            }

            if (!recipientList.length) {
                Alert.alert('Info', 'No students to notify');
                return;
            }

            // ✅ target_type fixed
            const notif = await notificationService.createNotification({
                type: 'fee_reminder',
                title: `Fee Reminder for ${MONTHS[selectedMonth - 1]}`,
                message: `Please pay the fee for ${MONTHS[selectedMonth - 1]} ${selectedYear}.`,
                entity_type: 'fee_payment',
                created_by: profile!.id,
                target_type: type === 'single' ? 'individual' : 'students',
                target_id: type === 'single' ? studentIds[0] : selectedClass,
                priority: 'medium',
            });

            const recipients = recipientList.map(s => ({
                notification_id: notif.id,
                user_id: s.id,
                is_read: false,
                is_deleted: false,
            }));

            await notificationService.addNotificationRecipients(recipients);

            Alert.alert('Success', `Fee reminder sent to ${recipientList.length} student(s)`);
            await loadStudentsAndFees();
        } catch (error: any) {
            console.error('Error sending notifications:', error);
            Alert.alert('Error', error.message || 'Failed to send notifications');
        }
    };


    const handleRefresh = async () => {
        setRefreshing(true);
        await loadStudentsAndFees();
        setRefreshing(false);
    };

    const getPaymentStats = () => {
        const stats = {
            pending: students.filter(
                s => s.current_month_payment_status === 'pending'
            ).length,
            paid: students.filter(s => s.current_month_payment_status === 'paid')
                .length,
            partial: students.filter(
                s => s.current_month_payment_status === 'partial'
            ).length,
            overdue: students.filter(
                s => s.current_month_payment_status === 'overdue'
            ).length,
        };
        return stats;
    };

    const stats = getPaymentStats();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TopSections />
            <SafeAreaView
                style={[styles.container, { backgroundColor: colors.background }]}
                edges={['left', 'right', 'bottom']}
            >
                {/* Filter Section */}
                <View style={styles.filterSection}>
                    {/* Month Selection */}
                    <View style={styles.filterGroup}>
                        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                            Month
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.monthSelector}
                        >
                            {MONTHS.map((month, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.monthButton,
                                        {
                                            backgroundColor:
                                                selectedMonth === index + 1
                                                    ? colors.primary
                                                    : colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => setSelectedMonth(index + 1)}
                                >
                                    <Text
                                        style={[
                                            styles.monthButtonText,
                                            {
                                                color:
                                                    selectedMonth === index + 1
                                                        ? '#ffffff'
                                                        : colors.text,
                                            },
                                        ]}
                                    >
                                        {month.slice(0, 3)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Year Selection */}
                    <View style={styles.filterGroup}>
                        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
                            Year
                        </Text>
                        <View style={styles.yearSelector}>
                            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                                <TouchableOpacity
                                    key={year}
                                    style={[
                                        styles.yearButton,
                                        {
                                            backgroundColor:
                                                selectedYear === year
                                                    ? colors.primary
                                                    : colors.cardBackground,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => setSelectedYear(year)}
                                >
                                    <Text
                                        style={[
                                            styles.yearButtonText,
                                            {
                                                color: selectedYear === year ? '#ffffff' : colors.text,
                                            },
                                        ]}
                                    >
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Class Selection */}
                    {profile?.role === 'teacher' && classes.length > 0 && (
                        <View style={styles.filterGroup}>
                            <Text
                                style={[
                                    styles.filterLabel,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                Select Class
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.classSelector}
                            >
                                {classes.map(cls => (
                                    <TouchableOpacity
                                        key={cls.id}
                                        style={[
                                            styles.classButton,
                                            {
                                                backgroundColor:
                                                    selectedClass === cls.id
                                                        ? colors.primary
                                                        : colors.cardBackground,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                        onPress={() => setSelectedClass(cls.id)}
                                    >
                                        <Text
                                            style={[
                                                styles.classButtonText,
                                                {
                                                    color:
                                                        selectedClass === cls.id
                                                            ? '#ffffff'
                                                            : colors.text,
                                                },
                                            ]}
                                        >
                                            {cls.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Statistics */}
                <View style={styles.statsContainer}>
                    <StatCard
                        icon={<Clock size={20} color="#6B7280" />}
                        label="Pending"
                        value={stats.pending}
                        colors={colors}
                    />
                    <StatCard
                        icon={<Check size={20} color="#10B981" />}
                        label="Paid"
                        value={stats.paid}
                        colors={colors}
                    />
                    <StatCard
                        icon={<AlertCircle size={20} color="#EF4444" />}
                        label="Overdue"
                        value={stats.overdue}
                        colors={colors}
                    />
                </View>

                {/* Students List */}
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                        />
                    }
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                Loading fee records...
                            </Text>
                        </View>
                    ) : students.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <DollarSign size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>
                                No students found
                            </Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Select a class to view fee records
                            </Text>
                        </View>
                    ) : (
                        students.map(student => (
                            <SwipeableFeeCard
                                key={student.id}
                                student={student}
                                colors={colors}
                                isTeacher={profile?.role === 'teacher'}
                                onSelect={handleSelectStudent}
                            />
                        ))
                    )}
                </ScrollView>

                {/* Notify All Button */}
                {profile?.role === 'teacher' && students.length > 0 && (
                    <View style={styles.bottomButtonContainer}>
                        <TouchableOpacity
                            style={[styles.notifyAllButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                Alert.alert(
                                    'Notify All',
                                    `Send fee reminders for ${MONTHS[selectedMonth - 1]} to unpaid students?`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Send',
                                            onPress: () => sendFeeNotification([], 'all'),
                                        },
                                    ]
                                );
                            }}
                        >
                            <Bell size={20} color="#ffffff" />
                            <Text style={styles.notifyAllButtonText}>Notify Unpaid Students</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Fee Details Modal */}
                <FeeDetailsModal
                    visible={modalVisible}
                    studentId={selectedStudentId}
                    studentName={selectedStudentName}
                    feeRecords={feeRecords}
                    classId={selectedClass}
                    colors={colors}
                    isTeacher={profile?.role === 'teacher'}
                    months={MONTHS}
                    currentMonth={selectedMonth}
                    currentYear={selectedYear}
                    feeStructure={feeStructure}
                    teacherId={profile?.id}
                    onClose={() => {
                        setModalVisible(false);
                        setSelectedStudentId('');
                        setSelectedStudentName('');
                        setFeeRecords([]);
                    }}
                    onRefresh={handleRefreshModal}
                    onSendNotification={handleSendNotification}
                />
            </SafeAreaView>
        </View>
    );
}

// StatCard Component
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    colors: any;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, colors }) => (
    <View
        style={[
            styles.statCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
        ]}
    >
        <View style={styles.statContent}>
            {icon}
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {label}
            </Text>
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterSection: {
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 16,
    },
    filterGroup: {
        gap: 8,
    },
    filterLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    monthSelector: {
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    monthButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
    },
    monthButtonText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
    yearSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    yearButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    yearButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    classSelector: {
        marginHorizontal: -24,
        paddingHorizontal: 24,
    },
    classButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
    },
    classButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    statsContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statContent: {
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: 'Inter-Medium',
        marginTop: 4,
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
        marginBottom: 10,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
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
    bottomButtonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        paddingTop: 10,
    },
    notifyAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    notifyAllButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});