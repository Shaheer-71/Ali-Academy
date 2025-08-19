// components/attendance/modals/DateRangeModal.tsx
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface DateRangeModalProps {
    visible: boolean;
    onClose: () => void;
    startDate: string;
    endDate: string;
    onApply: (startDate: string, endDate: string) => void;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
    visible,
    onClose,
    startDate,
    endDate,
    onApply,
}) => {
    const { colors } = useTheme();
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

    const handleApply = () => {
        onApply(tempStartDate, tempEndDate);
    };

    const presetRanges = [
        { label: 'Today', days: 0 },
        { label: 'Last 7 days', days: 7 },
        { label: 'Last 30 days', days: 30 },
        { label: 'This Month', days: 'month' as const },
    ];

    const handlePresetRange = (preset: typeof presetRanges[0]) => {
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        
        let startDate: string;
        if (preset.days === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate = firstDay.toISOString().split('T')[0];
        } else {
            const startDay = new Date(today);
            startDay.setDate(today.getDate() - preset.days);
            startDate = startDay.toISOString().split('T')[0];
        }
        
        setTempStartDate(startDate);
        setTempEndDate(endDate);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Select Date Range</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={[styles.label, { color: colors.text }]}>Quick Select:</Text>
                        <View style={styles.presetContainer}>
                            {presetRanges.map((preset, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.presetButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={() => handlePresetRange(preset)}
                                >
                                    <Text style={[styles.presetText, { color: colors.text }]}>{preset.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { color: colors.text }]}>Custom Range:</Text>
                        <View style={styles.dateInputs}>
                            <View style={styles.dateInput}>
                                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From:</Text>
                                <Text style={[styles.dateValue, { color: colors.text }]}>
                                    {new Date(tempStartDate).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.dateInput}>
                                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To:</Text>
                                <Text style={[styles.dateValue, { color: colors.text }]}>
                                    {new Date(tempEndDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { backgroundColor: colors.background }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
                            onPress={handleApply}
                        >
                            <Text style={styles.applyButtonText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// components/attendance/modals/StatusFilterModal.tsx
interface StatusFilterModalProps {
    visible: boolean;
    onClose: () => void;
    selectedStatus: 'all' | 'present' | 'late' | 'absent';
    onApply: (status: 'all' | 'present' | 'late' | 'absent') => void;
}

export const StatusFilterModal: React.FC<StatusFilterModalProps> = ({
    visible,
    onClose,
    selectedStatus,
    onApply,
}) => {
    const { colors } = useTheme();
    const [tempStatus, setTempStatus] = useState(selectedStatus);

    const statusOptions = [
        { value: 'all' as const, label: 'All Students', color: colors.textSecondary, icon: '👥' },
        { value: 'present' as const, label: 'Present', color: '#10B981', icon: '✅' },
        { value: 'late' as const, label: 'Late', color: '#F59E0B', icon: '⏰' },
        { value: 'absent' as const, label: 'Absent', color: '#EF4444', icon: '❌' },
    ];

    const handleApply = () => {
        onApply(tempStatus);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Filter by Status</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {statusOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.statusOption,
                                    { backgroundColor: colors.background, borderColor: colors.border },
                                    tempStatus === option.value && { borderColor: colors.primary, borderWidth: 2 }
                                ]}
                                onPress={() => setTempStatus(option.value)}
                            >
                                <Text style={styles.statusIcon}>{option.icon}</Text>
                                <Text style={[styles.statusLabel, { color: colors.text }]}>{option.label}</Text>
                                {tempStatus === option.value && (
                                    <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { backgroundColor: colors.background }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
                            onPress={handleApply}
                        >
                            <Text style={styles.applyButtonText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// components/attendance/modals/StatsModal.tsx
interface StatsModalProps {
    visible: boolean;
    onClose: () => void;
    stats: {
        totalDays: number;
        presentDays: number;
        lateDays: number;
        absentDays: number;
        attendanceRate: number;
    };
    className: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({
    visible,
    onClose,
    stats,
    className,
}) => {
    const { colors } = useTheme();

    const statItems = [
        { label: 'Total Days', value: stats.totalDays, color: colors.textSecondary, icon: '📅' },
        { label: 'Present Days', value: stats.presentDays, color: '#10B981', icon: '✅' },
        { label: 'Late Days', value: stats.lateDays, color: '#F59E0B', icon: '⏰' },
        { label: 'Absent Days', value: stats.absentDays, color: '#EF4444', icon: '❌' },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Attendance Statistics</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={[styles.className, { color: colors.textSecondary }]}>{className}</Text>
                        
                        <View style={[styles.attendanceRateCard, { backgroundColor: colors.primary }]}>
                            <Text style={styles.attendanceRateText}>Overall Attendance Rate</Text>
                            <Text style={styles.attendanceRateValue}>{stats.attendanceRate}%</Text>
                        </View>

                        <View style={styles.statsGrid}>
                            {statItems.map((item, index) => (
                                <View key={index} style={[styles.statCard, { backgroundColor: colors.background }]}>
                                    <Text style={styles.statIcon}>{item.icon}</Text>
                                    <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
                            onPress={onClose}
                        >
                            <Text style={styles.applyButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
        marginTop: 16,
    },
    presetContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    presetButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    presetText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    dateInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    dateInput: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    statusOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
        position: 'relative',
    },
    statusIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    statusLabel: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        flex: 1,
    },
    selectedIndicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        position: 'absolute',
        right: 16,
    },
    className: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
        marginBottom: 16,
    },
    attendanceRateCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    attendanceRateText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    attendanceRateValue: {
        color: '#ffffff',
        fontSize: 32,
        fontFamily: 'Inter-Bold',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    applyButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    applyButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});