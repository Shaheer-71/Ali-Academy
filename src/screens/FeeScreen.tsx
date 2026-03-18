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
    Modal,
} from 'react-native';
import {
    Clock,
    Check,
    DollarSign,
    Bell,
    ChevronDown,
    X,
    Users,
} from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import TopSections from '@/src/components/common/TopSections';
import { FeeDetailsModal } from '../components/fee/modals/FeeDetailsModal';
import { feeService, StudentWithFeeStatus, FeePayment } from '@/src/services/feeService';
import { classService } from '@/src/services/feeService';
import { notificationService } from '@/src/services/feeService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { sendPushNotification } from '@/src/lib/notifications';
import { Animated } from 'react-native';
import { useScreenAnimation } from '@/src/utils/animations';
import { TextSizes } from '@/src/styles/TextSizes';
import { SkeletonBox } from '@/src/components/common/Skeleton';

const MONTHS = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function FeeScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const screenStyle = useScreenAnimation();

    // Filters
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);

    // Dropdown state inside modal
    const [monthOpen, setMonthOpen] = useState(false);
    const [yearOpen, setYearOpen] = useState(false);
    const [classOpen, setClassOpen] = useState(false);

    // Data
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<StudentWithFeeStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Detail modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedStudentName, setSelectedStudentName] = useState('');
    const [feeRecords, setFeeRecords] = useState<FeePayment[]>([]);
    const [feeStructure, setFeeStructure] = useState<any>(null);


    useEffect(() => {
        if (profile?.role === 'teacher' || profile?.role === 'superadmin') {
            initializeClasses();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedClass) {
            loadStudentsAndFees();
        }
    }, [selectedMonth, selectedYear, selectedClass]);

    const initializeClasses = async () => {
        try {
            const classesData = await classService.getTeacherClasses() as any[];
            setClasses(classesData);
            if (classesData.length > 0) {
                const class10 = classesData.find((c: any) => c.name?.includes('10'));
                setSelectedClass((class10 ?? classesData[0]).id);
            }
        } catch {
            Alert.alert('Error', 'Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const loadStudentsAndFees = async () => {
        try {
            setLoading(true);
            const data = await feeService.getStudentsWithFeeStatus(selectedClass, selectedMonth, selectedYear);
            setStudents(data);
        } catch {
            Alert.alert('Error', 'Failed to load fee data');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = async (student: StudentWithFeeStatus) => {
        try {
            const [payments, studentFs] = await Promise.all([
                feeService.getStudentFeePayments(student.id),
                feeService.getFeeStructureForStudent(student.id, student.class_id),
            ]);
            setSelectedStudentId(student.id);
            setSelectedStudentName(student.full_name);
            setFeeRecords(payments);
            setFeeStructure(studentFs);
            setModalVisible(true);
        } catch {
            Alert.alert('Error', 'Failed to fetch fee records');
        }
    };

    const handleRefreshModal = async () => {
        const payments = await feeService.getStudentFeePayments(selectedStudentId);
        setFeeRecords(payments);
        await loadStudentsAndFees();
    };

    const handleSendNotification = (studentId: string) => {
        Alert.alert('Send Notification', 'Notify this student about their fee?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send', onPress: () => sendFeeNotification([studentId], 'single') },
        ]);
    };

    const sendFeeNotification = async (studentIds: string[], type: 'single' | 'all') => {
        try {
            let recipientList: any[] = [];
            if (type === 'single') {
                recipientList = students.filter(s => studentIds.includes(s.id));
            } else {
                const { data: allStudents } = await supabase
                    .from('students').select('id, full_name').eq('class_id', selectedClass);
                const { data: paidStudents } = await supabase
                    .from('fee_payments').select('student_id')
                    .eq('class_id', selectedClass).eq('month', selectedMonth)
                    .eq('year', selectedYear).eq('payment_status', 'paid');
                const paidIds = new Set((paidStudents as any[] || []).map((p: any) => p.student_id));
                recipientList = (allStudents as any[] || []).filter((s: any) => !paidIds.has(s.id));
            }
            if (!recipientList.length) { Alert.alert('Info', 'No students to notify'); return; }

            const notif: any = await notificationService.createNotification({
                type: 'fee_reminder',
                title: `Fee Reminder — ${MONTHS[selectedMonth - 1]} ${selectedYear}`,
                message: `Please submit your fee for ${MONTHS[selectedMonth - 1]} ${selectedYear}.`,
                entity_type: 'fee_payment',
                created_by: profile!.id,
                target_type: type === 'single' ? 'individual' : 'all',
                target_id: type === 'single' ? studentIds[0] : selectedClass,
                priority: 'high',
            });

            await notificationService.addNotificationRecipients(
                recipientList.map((s: any) => ({ notification_id: notif.id, user_id: s.id, is_read: false, is_deleted: false }))
            );

            for (const s of recipientList as any[]) {
                try {
                    await sendPushNotification({
                        userId: s.id,
                        title: `Fee Reminder — ${MONTHS[selectedMonth - 1]}`,
                        body: `Please pay your fee for ${MONTHS[selectedMonth - 1]} ${selectedYear}.`,
                        data: { type: 'fee_reminder', notificationId: notif.id },
                    });
                } catch {}
            }

            Alert.alert('Sent', `Fee reminder sent to ${recipientList.length} student(s)`);
            await loadStudentsAndFees();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to send notifications');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadStudentsAndFees();
        setRefreshing(false);
    };

    const applyFilters = () => setFilterVisible(false);

    // Derive displayed list
    const displayedStudents = showUnpaidOnly
        ? students.filter(s => s.current_month_payment_status !== 'paid')
        : students;

    const stats = {
        unpaid: students.filter(s => s.current_month_payment_status !== 'paid').length,
        paid: students.filter(s => s.current_month_payment_status === 'paid').length,
    };


    return (
        <Animated.View style={[{ flex: 1, backgroundColor: colors.background }, screenStyle]}>
            <TopSections
                onFilterPress={() => setFilterVisible(true)}
            />
            <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>

                {/* Stats Row */}
                <View style={[styles.statsRow, { paddingHorizontal: 24 }]}>
                    <StatPillThemed icon="clock" label="Unpaid" value={stats.unpaid} colors={colors} />
                    <StatPillThemed icon="check" label="Paid" value={stats.paid} colors={colors} isPrimary />
                </View>

                {/* Student List */}
                <ScrollView
                    style={styles.list}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
                >
                    {loading ? (
                        <>
                            {[...Array(6)].map((_, i) => (
                                <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={[styles.skeletonAccent, { backgroundColor: colors.border }]} />
                                    <View style={styles.skeletonBody}>
                                        <SkeletonBox width="55%" height={14} borderRadius={6} />
                                        <SkeletonBox width="35%" height={11} borderRadius={4} />
                                    </View>
                                    <SkeletonBox width={52} height={24} borderRadius={6} style={{ marginRight: 8 }} />
                                    <View style={styles.skeletonRight}>
                                        <SkeletonBox width={16} height={16} borderRadius={8} />
                                        <SkeletonBox width={34} height={34} borderRadius={8} />
                                    </View>
                                </View>
                            ))}
                        </>
                    ) : displayedStudents.length === 0 ? (
                        <View style={styles.centered}>
                            <DollarSign size={48} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
                                {showUnpaidOnly ? 'All fees paid!' : 'No students found'}
                            </Text>
                            <Text allowFontScaling={false} style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                {showUnpaidOnly
                                    ? `Every student has paid for ${MONTHS[selectedMonth - 1]}`
                                    : 'Select a class to view fee records'}
                            </Text>
                        </View>
                    ) : (
                        displayedStudents.map(student => (
                            <StudentFeeCard
                                key={student.id}
                                student={student}
                                colors={colors}
                                onPress={() => handleSelectStudent(student)}
                                onNotify={() => handleSendNotification(student.id)}
                            />
                        ))
                    )}
                </ScrollView>

                {/* Notify All FAB */}
                {displayedStudents.length > 0 && (
                    <View style={styles.fabContainer}>
                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: colors.primary }]}
                            onPress={() => Alert.alert(
                                'Notify All Unpaid',
                                `Send fee reminders for ${MONTHS[selectedMonth - 1]} to all unpaid students?`,
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Send', onPress: () => sendFeeNotification([], 'all') },
                                ]
                            )}
                        >
                            <Bell size={18} color="#fff" />
                            <Text allowFontScaling={false} style={styles.fabText}>Notify Unpaid</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Filter Modal */}
                <Modal
                    visible={filterVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setFilterVisible(false)}
                    statusBarTranslucent
                >
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setFilterVisible(false)}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            style={[styles.filterSheet, { backgroundColor: colors.background }]}
                            onPress={e => e.stopPropagation()}
                        >
                            {/* Sheet Header */}
                            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
                                <Text allowFontScaling={false} style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
                                <TouchableOpacity onPress={() => setFilterVisible(false)}>
                                    <X size={22} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 24 }}>

                                {/* Month Dropdown */}
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.textSecondary }]}>Month</Text>
                                <TouchableOpacity
                                    style={[styles.dropdown, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={() => { setMonthOpen(p => !p); setYearOpen(false); setClassOpen(false); }}
                                >
                                    <Text allowFontScaling={false} style={[styles.dropdownText, { color: colors.text }]}>
                                        {MONTHS[selectedMonth - 1]}
                                    </Text>
                                    <ChevronDown size={16} color={colors.textSecondary} style={{ transform: [{ rotate: monthOpen ? '180deg' : '0deg' }] }} />
                                </TouchableOpacity>
                                {monthOpen && (
                                    <ScrollView
                                        style={[styles.dropdownList, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxHeight: 132 }]}
                                        nestedScrollEnabled
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {MONTHS.map((m, i) => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[styles.dropdownItem, i + 1 === selectedMonth && { backgroundColor: colors.primary + '20' }]}
                                                onPress={() => { setSelectedMonth(i + 1); setMonthOpen(false); }}
                                            >
                                                <Text allowFontScaling={false} style={[styles.dropdownItemText, { color: i + 1 === selectedMonth ? colors.primary : colors.text }]}>
                                                    {m}
                                                </Text>
                                                {i + 1 === selectedMonth && <Check size={14} color={colors.primary} />}
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}

                                {/* Year Dropdown */}
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Year</Text>
                                <TouchableOpacity
                                    style={[styles.dropdown, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={() => { setYearOpen(p => !p); setMonthOpen(false); setClassOpen(false); }}
                                >
                                    <Text allowFontScaling={false} style={[styles.dropdownText, { color: colors.text }]}>{selectedYear}</Text>
                                    <ChevronDown size={16} color={colors.textSecondary} style={{ transform: [{ rotate: yearOpen ? '180deg' : '0deg' }] }} />
                                </TouchableOpacity>
                                {yearOpen && (
                                    <View style={[styles.dropdownList, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                        {YEARS.map(y => (
                                            <TouchableOpacity
                                                key={y}
                                                style={[styles.dropdownItem, y === selectedYear && { backgroundColor: colors.primary + '20' }]}
                                                onPress={() => { setSelectedYear(y); setYearOpen(false); }}
                                            >
                                                <Text allowFontScaling={false} style={[styles.dropdownItemText, { color: y === selectedYear ? colors.primary : colors.text }]}>
                                                    {y}
                                                </Text>
                                                {y === selectedYear && <Check size={14} color={colors.primary} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* Class Dropdown */}
                                {classes.length > 0 && (
                                    <>
                                        <Text allowFontScaling={false} style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Class</Text>
                                        <TouchableOpacity
                                            style={[styles.dropdown, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                            onPress={() => { setClassOpen(p => !p); setMonthOpen(false); setYearOpen(false); }}
                                        >
                                            <Text allowFontScaling={false} style={[styles.dropdownText, { color: colors.text }]}>
                                                {classes.find(c => c.id === selectedClass)?.name || 'Select Class'}
                                            </Text>
                                            <ChevronDown size={16} color={colors.textSecondary} style={{ transform: [{ rotate: classOpen ? '180deg' : '0deg' }] }} />
                                        </TouchableOpacity>
                                        {classOpen && (
                                            <ScrollView
                                                style={[styles.dropdownList, { backgroundColor: colors.cardBackground, borderColor: colors.border, maxHeight: 132 }]}
                                                nestedScrollEnabled
                                                showsVerticalScrollIndicator={false}
                                            >
                                                {classes.map(cls => (
                                                    <TouchableOpacity
                                                        key={cls.id}
                                                        style={[styles.dropdownItem, cls.id === selectedClass && { backgroundColor: colors.primary + '20' }]}
                                                        onPress={() => { setSelectedClass(cls.id); setClassOpen(false); }}
                                                    >
                                                        <Text allowFontScaling={false} style={[styles.dropdownItemText, { color: cls.id === selectedClass ? colors.primary : colors.text }]}>
                                                            {cls.name}
                                                        </Text>
                                                        {cls.id === selectedClass && <Check size={14} color={colors.primary} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        )}
                                    </>
                                )}

                                {/* Show Unpaid Only Toggle */}
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>Show</Text>
                                <View style={styles.toggleRow}>
                                    <TouchableOpacity
                                        style={[styles.toggleOption, { backgroundColor: showUnpaidOnly ? colors.primary : colors.cardBackground, borderColor: showUnpaidOnly ? colors.primary : colors.border }]}
                                        onPress={() => setShowUnpaidOnly(true)}
                                    >
                                        <Clock size={14} color={showUnpaidOnly ? '#fff' : colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.toggleText, { color: showUnpaidOnly ? '#fff' : colors.text }]}>Unpaid Only</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleOption, { backgroundColor: !showUnpaidOnly ? colors.primary : colors.cardBackground, borderColor: !showUnpaidOnly ? colors.primary : colors.border }]}
                                        onPress={() => setShowUnpaidOnly(false)}
                                    >
                                        <Users size={14} color={!showUnpaidOnly ? '#fff' : colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.toggleText, { color: !showUnpaidOnly ? '#fff' : colors.text }]}>All Students</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Apply Button */}
                                <TouchableOpacity
                                    style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                                    onPress={applyFilters}
                                >
                                    <Text allowFontScaling={false} style={styles.applyBtnText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>

                {/* Fee Details Modal */}
                <FeeDetailsModal
                    visible={modalVisible}
                    studentId={selectedStudentId}
                    studentName={selectedStudentName}
                    feeRecords={feeRecords}
                    classId={selectedClass}
                    colors={colors}
                    isTeacher={profile?.role === 'teacher' || profile?.role === 'superadmin'}
                    months={MONTHS}
                    currentMonth={selectedMonth}
                    currentYear={selectedYear}
                    feeStructure={feeStructure}
                    teacherId={profile?.id}
                    onClose={() => { setModalVisible(false); setSelectedStudentId(''); setSelectedStudentName(''); setFeeRecords([]); }}
                    onRefresh={handleRefreshModal}
                    onSendNotification={handleSendNotification}
                />
            </SafeAreaView>
        </Animated.View>
    );
}

// ── Student Fee Card ────────────────────────────────────────────────────────
interface StudentFeeCardProps {
    student: StudentWithFeeStatus;
    colors: any;
    onPress: () => void;
    onNotify: () => void;
}

const StudentFeeCard: React.FC<StudentFeeCardProps> = ({ student, colors, onPress, onNotify }) => {
    const isPaid = student.current_month_payment_status === 'paid';

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Left accent */}
            <View style={[styles.cardAccent, { backgroundColor: isPaid ? colors.primary : colors.border }]} />

            <View style={styles.cardBody}>
                <Text allowFontScaling={false} style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>
                    {student.full_name}
                </Text>
                {isPaid && student.current_month_amount ? (
                    <Text allowFontScaling={false} style={[styles.amountText, { color: colors.textSecondary }]}>
                        Rs. {student.current_month_amount}
                    </Text>
                ) : !isPaid && (student.amount_due ?? student.current_month_amount) ? (
                    <Text allowFontScaling={false} style={[styles.amountText, { color: colors.textSecondary }]}>
                        Due: Rs. {student.amount_due ?? student.current_month_amount}
                    </Text>
                ) : null}
            </View>

            <View style={[
                styles.statusBadge,
                isPaid
                    ? { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }
                    : { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}>
                <Text allowFontScaling={false} style={[
                    styles.statusText,
                    { color: isPaid ? colors.secondary : colors.textSecondary },
                ]}>
                    {isPaid ? 'Paid' : 'Unpaid'}
                </Text>
            </View>

            <View style={styles.cardRight}>
                {isPaid
                    ? <Check size={16} color={colors.secondary} />
                    : <Clock size={16} color={colors.border} />
                }
                <TouchableOpacity
                    style={[styles.notifyBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={e => { e.stopPropagation(); onNotify(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Bell size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// ── Stat Pill ───────────────────────────────────────────────────────────────
const StatPillThemed = ({ icon, label, value, colors, isPrimary }: any) => (
    <View style={[
        styles.statPill,
        {
            backgroundColor: isPrimary ? colors.secondary + '20' : colors.cardBackground,
            borderWidth: 1,
            borderColor: isPrimary ? colors.secondary : colors.border,
        },
    ]}>
        {icon === 'check'
            ? <Check size={14} color={isPrimary ? colors.secondary : colors.textSecondary} />
            : <Clock size={14} color={isPrimary ? colors.secondary : colors.textSecondary} />
        }
        <Text allowFontScaling={false} style={[styles.statPillValue, { color: isPrimary ? colors.secondary : colors.text }]}>{value}</Text>
        <Text allowFontScaling={false} style={[styles.statPillLabel, { color: isPrimary ? colors.secondary : colors.textSecondary }]}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    filterSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    filterChips: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
        flex: 1,
    },
    chip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    editFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingLeft: 12,
    },
    editFilterText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 14,
    },
    statPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 8,
        borderRadius: 10,
    },
    statPillValue: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
    },
    statPillLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    list: {
        flex: 1,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyTitle: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
    },
    emptySubtitle: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    cardAccent: {
        width: 4,
        alignSelf: 'stretch',
    },
    cardBody: {
        flex: 1,
        padding: 14,
        gap: 4,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    cardBadgeRow: {
        alignItems: 'center',
    },
    skeletonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        overflow: 'hidden',
        height: 64,
    },
    skeletonAccent: {
        width: 4,
        alignSelf: 'stretch',
    },
    skeletonBody: {
        flex: 1,
        padding: 14,
        gap: 6,
    },
    skeletonRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 12,
    },
    studentName: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        marginRight: 8,
    },
    statusText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
    },
    amountText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 12,
    },
    notifyBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    fabText: {
        color: '#fff',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },
    // Filter Sheet
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    sheetTitle: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
    },
    label: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    dropdownText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 4,
        overflow: 'hidden',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    dropdownItemText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 10,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    toggleText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },
    applyBtn: {
        marginTop: 24,
        marginBottom: 32,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#fff',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },
});
