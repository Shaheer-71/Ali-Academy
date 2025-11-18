// components/FeeCards/FeeDetailsModal.tsx
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    Alert,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { X, Bell, CheckCircle2 } from 'lucide-react-native';
import { feeService, FeePayment } from '@/src/services/feeService';
import { useAuth } from '@/src/contexts/AuthContext';

interface FeeDetailsModalProps {
    visible: boolean;
    studentId: string;
    studentName: string;
    feeRecords: FeePayment[];
    classId: string;
    colors: any;
    isTeacher: boolean;
    months: string[];
    currentMonth: number;
    currentYear: number;
    feeStructure: any;
    teacherId?: string;
    onClose: () => void;
    onRefresh: () => void;
    onSendNotification: (studentId: string) => void;
}

export const FeeDetailsModal: React.FC<FeeDetailsModalProps> = ({
    visible,
    studentId,
    studentName,
    feeRecords,
    classId,
    colors,
    isTeacher,
    months,
    currentMonth,
    currentYear,
    feeStructure,
    onClose,
    onRefresh,
    onSendNotification,
}) => {
    const [creatingPayment, setCreatingPayment] = useState(false);
    const { profile } = useAuth();

    // Find current month's payment record
    const currentMonthPayment = feeRecords.find(
        r => r.month === currentMonth && r.year === currentYear
    );

    const handleMarkAsPaid = async () => {
        if (!studentId || !classId) {
            Alert.alert('Error', 'Missing required data');
            return;
        }

        if (!feeStructure) {
            Alert.alert('Error', 'Fee structure not found');
            return;
        }

        setCreatingPayment(true);
        try {
            // Need to get these from the parent component props
            // For now, we'll use the existing function
            await feeService.markAsPaidWithNotification(
                studentId,
                classId,
                currentMonth,
                currentYear,
                feeStructure,
                studentName,
                profile?.id,
                months
            );

            Alert.alert(
                'Success',
                `Fee for ${months[currentMonth - 1]} marked as paid\nNotification sent to student`
            );
            onRefresh();
        } catch (error: any) {
            console.warn('Error marking fee as paid:', error);
            Alert.alert('Error', error.message || 'Failed to mark fee as paid');
        } finally {
            setCreatingPayment(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View
                    style={[styles.modalContent, { backgroundColor: colors.background }]}
                >
                    {/* Header */}
                    <View
                        style={[
                            styles.modalHeader,
                            { borderBottomColor: colors.border },
                        ]}
                    >
                        <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>
                            {studentName}
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScrollView}>
                        {/* Current Month Payment Card - Only for Teachers */}
                        {isTeacher && (
                            <View
                                style={[
                                    styles.currentMonthCard,
                                    {
                                        backgroundColor: colors.primary + '15',
                                        borderColor: colors.primary,
                                    },
                                ]}
                            >
                                <View style={styles.currentMonthHeader}>
                                    <Text
                                        style={[
                                            styles.currentMonthTitle,
                                            { color: colors.primary },
                                        ]}
                                    >
                                        {months[currentMonth - 1]} {currentYear}
                                    </Text>
                                    {currentMonthPayment?.payment_status === 'paid' && (
                                        <View style={styles.paidBadge}>
                                            <CheckCircle2 size={16} color="#10B981" />
                                            <Text allowFontScaling={false} style={styles.paidBadgeText}>Paid</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.currentMonthDetails}>
                                    <Text
                                        style={[
                                            styles.amountDueLabel,
                                            { color: colors.textSecondary },
                                        ]}
                                    >
                                        Amount Due
                                    </Text>
                                    <Text
                                        style={[styles.amountDueValue, { color: colors.text }]}
                                    >
                                        Rs {feeStructure?.amount || '0'}
                                    </Text>
                                </View>

                                {/* Show Mark as Paid button only if NOT paid */}
                                {currentMonthPayment?.payment_status !== 'paid' && (
                                    <TouchableOpacity
                                        style={[
                                            styles.markPaidButton,
                                            {
                                                backgroundColor: colors.primary,
                                                opacity: creatingPayment ? 0.6 : 1,
                                            },
                                        ]}
                                        onPress={handleMarkAsPaid}
                                        disabled={creatingPayment}
                                    >
                                        <CheckCircle2 size={18} color="#ffffff" />
                                        <Text allowFontScaling={false} style={styles.markPaidButtonText}>
                                            {creatingPayment ? 'Marking...' : 'Mark as Paid'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Show Already Paid message if paid */}
                                {currentMonthPayment?.payment_status === 'paid' && (
                                    <View
                                        style={[
                                            styles.alreadyPaidMessage,
                                            { backgroundColor: '#D1FAE5' },
                                        ]}
                                    >
                                        <CheckCircle2 size={18} color="#10B981" />
                                        <Text
                                            style={[
                                                styles.alreadyPaidText,
                                                { color: '#10B981' },
                                            ]}
                                        >
                                            Fee already paid
                                        </Text>
                                    </View>
                                )}

                                {/* Show Pending message if no record yet */}
                                {!currentMonthPayment && (
                                    <View
                                        style={[
                                            styles.pendingMessage,
                                            { backgroundColor: '#FEF3C7' },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.pendingText,
                                                { color: '#D97706' },
                                            ]}
                                        >
                                            Fee payment pending
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Payment History Section */}
                        <View style={styles.historySection}>
                            <Text
                                style={[
                                    styles.historySectionTitle,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                Payment History
                            </Text>

                            {feeRecords.length === 0 ? (
                                <View style={styles.emptyModal}>
                                    <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>
                                        No payment records
                                    </Text>
                                </View>
                            ) : (
                                feeRecords.map(record => (
                                    <View
                                        key={record.id}
                                        style={[
                                            styles.feeRecordCard,
                                            {
                                                backgroundColor: colors.cardBackground,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                    >
                                        <View style={styles.recordHeader}>
                                            <Text
                                                style={[styles.recordMonth, { color: colors.text }]}
                                            >
                                                {months[record.month - 1]} {record.year}
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
                                                    Amount Paid
                                                </Text>
                                                <Text
                                                    style={[styles.detailValue, { color: colors.text }]}
                                                >
                                                    Rs {record.amount_paid}
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
                                                    <Text
                                                        style={[
                                                            styles.detailValue,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {new Date(
                                                            record.payment_date
                                                        ).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            )}

                                            {record.payment_method && (
                                                <View style={styles.detailRow}>
                                                    <Text
                                                        style={[
                                                            styles.detailLabel,
                                                            { color: colors.textSecondary },
                                                        ]}
                                                    >
                                                        Payment Method
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.detailValue,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {record.payment_method
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            record.payment_method.slice(1)}
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
                                                        style={[
                                                            styles.detailValue,
                                                            { color: colors.text },
                                                        ]}
                                                    >
                                                        {record.notes}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Send Notification Button */}
                        {isTeacher && (
                            <TouchableOpacity
                                style={[
                                    styles.sendNotificationButton,
                                    { backgroundColor: colors.primary },
                                ]}
                                onPress={() => onSendNotification(studentId)}
                            >
                                <Bell size={20} color="#ffffff" />
                                <Text allowFontScaling={false} style={styles.sendNotificationButtonText}>
                                    Send Fee Notification
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
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
    currentMonthCard: {
        borderRadius: 16,
        borderWidth: 2,
        padding: 16,
        marginBottom: 24,
    },
    currentMonthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    currentMonthTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#D1FAE5',
        borderRadius: 6,
    },
    paidBadgeText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: '#10B981',
    },
    currentMonthDetails: {
        marginBottom: 16,
    },
    amountDueLabel: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    amountDueValue: {
        fontSize: 28,
        fontFamily: 'Inter-SemiBold',
    },
    markPaidButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    markPaidButtonText: {
        color: '#ffffff',
        fontSize: 15,
        fontFamily: 'Inter-SemiBold',
    },
    alreadyPaidMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    alreadyPaidText: {
        fontSize: 15,
        fontFamily: 'Inter-SemiBold',
    },
    pendingMessage: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    pendingText: {
        fontSize: 15,
        fontFamily: 'Inter-SemiBold',
    },
    historySection: {
        marginTop: 20,
    },
    historySectionTitle: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    emptyModal: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
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