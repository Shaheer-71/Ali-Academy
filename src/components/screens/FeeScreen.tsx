import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
    RefreshControl,
    Animated,
    PanResponder,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { sendWhatsAppMessage, formatFeeMessage } from '@/src/lib/whatsapp';
import {
    Calendar,
    Users,
    User,
    X,
    ChevronRight,
    AlertCircle,
    Check,
    Clock,
    TrendingUp,
    Bell,
    DollarSign,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';

interface FeePayment {
    id: string;
    student_id: string;
    student_name: string;
    class_id: string;
    class_name: string;
    month: number;
    year: number;
    amount_paid?: number;
    payment_status: 'pending' | 'paid' | 'partial' | 'overdue';
    payment_date?: string;
    amount_due: number;
    parent_contact?: string;
}

interface StudentWithFeeStatus {
    id: string;
    full_name: string;
    class_id: string;
    email?: string;
    parent_contact?: string;
    fee_status: {
        pending: number;
        paid: number;
        partial: number;
        overdue: number;
    };
}

interface StudentFeeRecord {
    id: string;
    student_id: string;
    student_name: string;
    class_id: string;
    amount_due: number;
    monthly_payments: FeePayment[];
}

interface FeeStructure {
    id: string;
    class_id: string;
    class_name: string;
    amount: number;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENT_YEAR = new Date().getFullYear();
const ACADEMIC_YEAR = `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`;

// Swipeable Fee Card Component
const SwipeableFeeCard = ({
    student,
    colors,
    isTeacher,
    onSelect,
    onNotify,
}: any) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isTeacher,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return isTeacher && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -150));
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx < -100) {
                    Animated.spring(translateX, {
                        toValue: -120,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }).start();
                    setIsSwipeOpen(true);
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }).start();
                    setIsSwipeOpen(false);
                }
            },
        })
    ).current;

    const closeSwipe = () => {
        if (isSwipeOpen) {
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
            setIsSwipeOpen(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return '#10B981';
            case 'overdue':
                return '#EF4444';
            case 'partial':
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return <Check size={16} color="#10B981" />;
            case 'overdue':
                return <AlertCircle size={16} color="#EF4444" />;
            case 'partial':
                return <Clock size={16} color="#F59E0B" />;
            default:
                return <Clock size={16} color="#6B7280" />;
        }
    };

    return (
        <View style={styles.swipeContainer}>


            <Animated.View
                style={[
                    styles.feeCard,
                    {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        transform: [{ translateX }],
                    },
                ]}
                {...(isTeacher ? panResponder.panHandlers : {})}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={closeSwipe}
                    style={styles.cardContent}
                >
                    <TouchableOpacity
                        style={styles.cardMain}
                        onPress={() => {
                            closeSwipe();
                            onSelect(student);
                        }}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <User size={20} color={colors.primary} />
                        </View>

                        <View style={styles.studentInfo}>
                            <Text style={[styles.studentName, { color: colors.text }]}>
                                {student.full_name}
                            </Text>
                            <View style={styles.feeStatusRow}>
                                <View style={styles.statusBadge}>
                                    {getStatusIcon(student.fee_status.overdue > 0 ? 'overdue' : 'pending')}
                                    <Text style={[styles.statusText, {
                                        color: student.fee_status.overdue > 0 ? '#EF4444' : '#6B7280'
                                    }]}>
                                        {student.fee_status.overdue > 0 ? 'Overdue' : 'Pending'}
                                    </Text>
                                </View>
                                <Text style={[styles.amountText, { color: colors.text }]}>
                                    {student.fee_status.pending + student.fee_status.overdue} month(s)
                                </Text>
                            </View>
                        </View>

                        {/* <ChevronRight size={24} color={colors.textSecondary} /> */}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

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
    const [selectedStudent, setSelectedStudent] = useState<StudentFeeRecord | null>(null);
    const [feeRecords, setFeeRecords] = useState<FeePayment[]>([]);

    useEffect(() => {
        if (profile?.role === 'teacher') {
            fetchClasses();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudentsAndFees();
        }
    }, [selectedMonth, selectedYear, selectedClass]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('name');

            if (error) throw error;
            setClasses(data || []);
            if (data && data.length > 0) {
                setSelectedClass(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            Alert.alert('Error', 'Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsAndFees = async () => {
        try {
            setLoading(true);

            // Fetch all students in the class
            const { data: studentsData, error: studentsError } = await supabase
                .from('students')
                .select(`
          id,
          full_name,
          class_id,
          email,
          parent_contact
        `)
                .eq('class_id', selectedClass)
                .order('full_name');

            if (studentsError) throw studentsError;

            if (!studentsData || studentsData.length === 0) {
                setStudents([]);
                return;
            }

            // Fetch fee payments for the selected month/year
            const { data: feesData, error: feesError } = await supabase
                .from('fee_payments')
                .select(`
          *,
          student_fees (amount_due)
        `)
                .eq('class_id', selectedClass)
                .eq('month', selectedMonth)
                .eq('year', selectedYear);

            if (feesError) throw feesError;

            // Create a map for quick lookup
            const feeMap = new Map();
            feesData?.forEach(fee => {
                feeMap.set(fee.student_id, fee);
            });

            // Combine students with fee status
            const studentsWithFees = studentsData.map(student => ({
                ...student,
                fee_status: {
                    pending: feeMap.has(student.id) &&
                        feeMap.get(student.id).payment_status === 'pending' ? 1 : 0,
                    paid: feeMap.has(student.id) &&
                        feeMap.get(student.id).payment_status === 'paid' ? 1 : 0,
                    partial: feeMap.has(student.id) &&
                        feeMap.get(student.id).payment_status === 'partial' ? 1 : 0,
                    overdue: feeMap.has(student.id) &&
                        feeMap.get(student.id).payment_status === 'overdue' ? 1 : 0,
                },
            }));

            setStudents(studentsWithFees);
        } catch (error) {
            console.error('Error fetching students and fees:', error);
            Alert.alert('Error', 'Failed to fetch fee data');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = async (student: StudentWithFeeStatus) => {
        try {
            // Fetch all monthly fee records for the student
            const { data: feePayments, error } = await supabase
                .from('fee_payments')
                .select('*')
                .eq('student_id', student.id)
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (error) throw error;

            setSelectedStudent({
                id: student.id,
                student_id: student.id,
                student_name: student.full_name,
                class_id: student.class_id,
                amount_due: 0, // This should come from fee_structures
                monthly_payments: feePayments || [],
            });

            setFeeRecords(feePayments || []);
            setModalVisible(true);
        } catch (error) {
            console.error('Error fetching student fee records:', error);
            Alert.alert('Error', 'Failed to fetch fee records');
        }
    };

    const handleNotifyStudent = (student: StudentWithFeeStatus) => {
        Alert.alert(
            'Notify Student',
            `Send fee reminder to ${student.full_name} for ${MONTHS[selectedMonth - 1]}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: () => sendFeeNotification(student, 'single'),
                },
            ]
        );
    };

    const sendFeeNotification = async (
        student: StudentWithFeeStatus,
        type: 'single' | 'all'
    ) => {
        try {
            let recipientList: StudentWithFeeStatus[] = [];

            if (type === 'single') {
                recipientList = [student];
            } else {
                // Notify all students with pending fees
                recipientList = students.filter(
                    s => s.fee_status.pending > 0 || s.fee_status.overdue > 0
                );
            }

            for (const recipient of recipientList) {
                // Create notification in database
                const { data: notif, error: notifError } = await supabase
                    .from('fee_notifications')
                    .insert([
                        {
                            type: 'fee_reminder',
                            title: `Fee Reminder for ${MONTHS[selectedMonth - 1]}`,
                            message: `Please pay the fee for ${MONTHS[selectedMonth - 1]} ${selectedYear}. Contact the school for more details.`,
                            entity_type: 'fee_payment',
                            created_by: profile!.id,
                            target_type: type === 'single' ? 'student' : 'class',
                            target_id: type === 'single' ? recipient.id : selectedClass,
                            priority: 'medium',
                        },
                    ])
                    .select('id')
                    .single();

                if (notifError) {
                    console.error('Error creating notification:', notifError);
                    continue;
                }

                // Add recipient
                if (notif) {
                    await supabase.from('fee_notification_recipients').insert([
                        {
                            notification_id: notif.id,
                            user_id: recipient.id,
                            is_read: false,
                            is_deleted: false,
                        },
                    ]);

                    // Send WhatsApp message
                    if (recipient.parent_contact) {
                        const message = formatFeeMessage(
                            recipient.full_name,
                            MONTHS[selectedMonth - 1],
                            selectedYear
                        );

                        try {
                            await sendWhatsAppMessage({
                                to: recipient.parent_contact,
                                message,
                                type: 'fee',
                            });
                        } catch (whatsappError) {
                            console.error('WhatsApp error:', whatsappError);
                        }
                    }
                }
            }

            Alert.alert(
                'Success',
                `Fee reminder sent to ${recipientList.length} student(s)`
            );
            fetchStudentsAndFees();
        } catch (error: any) {
            console.error('Error sending notifications:', error);
            Alert.alert('Error', error.message || 'Failed to send notifications');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStudentsAndFees();
        setRefreshing(false);
    };

    const getPaymentStats = () => {
        const stats = {
            pending: students.reduce((sum, s) => sum + s.fee_status.pending, 0),
            paid: students.reduce((sum, s) => sum + s.fee_status.paid, 0),
            partial: students.reduce((sum, s) => sum + s.fee_status.partial, 0),
            overdue: students.reduce((sum, s) => sum + s.fee_status.overdue, 0),
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
                {/* Header */}
                {/* <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Fee Management</Text>
                </View> */}

                {/* Filter Section */}
                <View style={styles.filterSection}>
                    {/* Month & Year Selection */}
                    <View style={styles.filterRow}>
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
                    </View>

                    {/* Class Selection */}
                    {profile?.role === 'teacher' && classes.length > 0 && (
                        <View style={styles.filterGroup}>
                            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
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
                                                    color: selectedClass === cls.id ? '#ffffff' : colors.text,
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
                    <View
                        style={[
                            styles.statCard,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.statContent}>
                            <Clock size={20} color="#6B7280" />
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Pending
                            </Text>
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending}</Text>
                    </View>

                    <View
                        style={[
                            styles.statCard,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.statContent}>
                            <Check size={20} color="#10B981" />
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Paid
                            </Text>
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.paid}</Text>
                    </View>

                    <View
                        style={[
                            styles.statCard,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        ]}
                    >
                        <View style={styles.statContent}>
                            <AlertCircle size={20} color="#EF4444" />
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Overdue
                            </Text>
                        </View>
                        <Text style={[styles.statValue, { color: colors.text }]}>{stats.overdue}</Text>
                    </View>
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
                                onNotify={handleNotifyStudent}
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
                                    `Send fee reminders for ${MONTHS[selectedMonth - 1]} to all students?`,
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Send',
                                            onPress: () => sendFeeNotification({ id: '' } as any, 'all'),
                                        },
                                    ]
                                );
                            }}
                        >
                            <Bell size={20} color="#ffffff" />
                            <Text style={styles.notifyAllButtonText}>Notify All Students</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Student Fee Details Modal */}
                <Modal
                    visible={modalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View
                            style={[
                                styles.modalContent,
                                { backgroundColor: colors.background },
                            ]}
                        >
                            <View
                                style={[
                                    styles.modalHeader,
                                    { borderBottomColor: colors.border },
                                ]}
                            >
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    {selectedStudent?.student_name}
                                </Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => {
                                        setModalVisible(false);
                                        setSelectedStudent(null);
                                    }}
                                >
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalScrollView}>
                                {feeRecords.length === 0 ? (
                                    <View style={styles.emptyModal}>
                                        <Text style={[styles.emptyText, { color: colors.text }]}>
                                            No fee records
                                        </Text>
                                    </View>
                                ) : (
                                    feeRecords.map(record => (
                                        <View
                                            key={record.id}
                                            style={[
                                                styles.feeRecordCard,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                            ]}
                                        >
                                            <View style={styles.recordHeader}>
                                                <Text style={[styles.recordMonth, { color: colors.text }]}>
                                                    {MONTHS[record.month - 1]} {record.year}
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.statusBadgeModal,
                                                        {
                                                            backgroundColor:
                                                                record.payment_status === 'paid'
                                                                    ? '#D1FAE5'
                                                                    : record.payment_status === 'overdue'
                                                                        ? '#FEE2E2'
                                                                        : '#FEF3C7',
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.statusBadgeText,
                                                            {
                                                                color:
                                                                    record.payment_status === 'paid'
                                                                        ? '#10B981'
                                                                        : record.payment_status === 'overdue'
                                                                            ? '#EF4444'
                                                                            : '#D97706',
                                                            },
                                                        ]}
                                                    >
                                                        {record.payment_status.toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.recordDetails}>
                                                <View style={styles.detailRow}>
                                                    <Text
                                                        style={[
                                                            styles.detailLabel,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                    >
                                                        Amount Due
                                                    </Text>
                                                    <Text style={[styles.detailValue, { color: colors.text }]}>
                                                        Rs {record.amount_paid || 0}
                                                    </Text>
                                                </View>

                                                {record.payment_date && (
                                                    <View style={styles.detailRow}>
                                                        <Text
                                                            style={[
                                                                styles.detailLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            Paid On
                                                        </Text>
                                                        <Text style={[styles.detailValue, { color: colors.text }]}>
                                                            {new Date(record.payment_date).toLocaleDateString()}
                                                        </Text>
                                                    </View>
                                                )}

                                                {record.notes && (
                                                    <View style={styles.detailRow}>
                                                        <Text
                                                            style={[
                                                                styles.detailLabel,
                                                                { color: colors.textSecondary },
                                                            ]}
                                                        >
                                                            Notes
                                                        </Text>
                                                        <Text
                                                            style={[styles.detailValue, { color: colors.text }]}
                                                        >
                                                            {record.notes}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                )}

                                {selectedStudent && profile?.role === 'teacher' && (
                                    <TouchableOpacity
                                        style={[styles.sendNotificationButton, { backgroundColor: colors.primary }]}
                                        onPress={() => {
                                            setModalVisible(false);
                                            Alert.alert(
                                                'Send Notification',
                                                `Notify ${selectedStudent.student_name} about fee?`,
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    {
                                                        text: 'Send',
                                                        onPress: () =>
                                                            sendFeeNotification(
                                                                { id: selectedStudent.student_id } as any,
                                                                'single'
                                                            ),
                                                    },
                                                ]
                                            );
                                        }}
                                    >
                                        <Bell size={20} color="#ffffff" />
                                        <Text style={styles.sendNotificationButtonText}>
                                            Send Fee Notification
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
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
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Inter-SemiBold',
    },
    filterSection: {
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 16,
    },
    filterRow: {
        gap: 12,
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
    swipeContainer: {
        marginBottom: 12,
        position: 'relative',
    },
    actionButtons: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    actionButton: {
        width: 60,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    feeCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flex: 1,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    feeStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    amountText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 20,
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
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScrollView: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    emptyModal: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    feeRecordCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recordMonth: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    statusBadgeModal: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 11,
        fontFamily: 'Inter-SemiBold',
    },
    recordDetails: {
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
    },
    detailValue: {
        fontSize: 13,
        fontFamily: 'Inter-SemiBold',
    },
    sendNotificationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        marginTop: 20,
        marginBottom: 20,
    },
    sendNotificationButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});