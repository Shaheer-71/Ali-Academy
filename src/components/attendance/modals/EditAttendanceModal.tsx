import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    TouchableWithoutFeedback, StyleSheet, Dimensions,
} from 'react-native';
import { X, Check, AlertCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useDialog } from '@/src/contexts/DialogContext';
import { AttendanceRecord } from '@/src/types/attendance';
import { TextSizes } from '@/src/styles/TextSizes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditAttendanceModalProps {
    visible: boolean;
    record: AttendanceRecord | null;
    onClose: () => void;
    onSave: (recordId: string, updates: any) => Promise<{ success: boolean }>;
}

const STATUS_OPTIONS = [
    { value: 'present', label: 'Present', Icon: Check,         color: '#10B981' },
    { value: 'late',    label: 'Late',    Icon: AlertCircle,   color: '#F59E0B' },
    { value: 'absent',  label: 'Absent',  Icon: XCircle,       color: '#EF4444' },
] as const;

const fmtDate = (s: string) => {
    try {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
        });
    } catch { return s; }
};

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
    visible, record, onClose, onSave,
}) => {
    const { colors } = useTheme();
    const { showSuccess, showError } = useDialog();
    const [editedRecord, setEditedRecord] = useState<AttendanceRecord | null>(null);

    useEffect(() => {
        if (record) setEditedRecord({ ...record });
    }, [record]);

    const handleSave = async () => {
        if (!editedRecord) return;
        try {
            const result = await onSave(editedRecord.id, {
                status:       editedRecord.status,
                arrival_time: editedRecord.arrival_time,
                late_minutes: editedRecord.late_minutes,
            });
            if (result.success) {
                showSuccess('Success', 'Attendance updated successfully', onClose);
            } else {
                showError('Error', 'Failed to update attendance');
            }
        } catch (e: any) {
            showError('Error', e.message);
        }
    };

    if (!editedRecord) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
            presentationStyle="overFullScreen"
        >
            <View style={s.root}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>

                <View style={[s.sheet, { backgroundColor: colors.background }]}>
                    {/* Handle */}
                    <View style={[s.handle, { backgroundColor: colors.border }]} />

                    {/* Header */}
                    <View style={[s.header, { borderBottomColor: colors.border }]}>
                        <View style={s.headerLeft}>
                            <Text allowFontScaling={false} style={[s.title, { color: colors.text }]}>
                                Edit Attendance
                            </Text>
                            {editedRecord.students && (
                                <Text allowFontScaling={false} style={[s.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {editedRecord.students.full_name}
                                    {editedRecord.students.roll_number ? `  ·  Roll ${editedRecord.students.roll_number}` : ''}
                                    {'  ·  '}{fmtDate(editedRecord.date)}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                            <X size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <View style={s.body}>
                        {/* Status chips */}
                        <Text allowFontScaling={false} style={[s.label, { color: colors.textSecondary }]}>Status</Text>
                        <View style={s.statusRow}>
                            {STATUS_OPTIONS.map(({ value, label, Icon, color }) => {
                                const active = editedRecord.status === value;
                                return (
                                    <TouchableOpacity
                                        key={value}
                                        style={[
                                            s.chip,
                                            { borderColor: colors.border, backgroundColor: colors.cardBackground },
                                            active && { backgroundColor: color, borderColor: color },
                                        ]}
                                        onPress={() => setEditedRecord({ ...editedRecord, status: value as any })}
                                    >
                                        <Icon size={14} color={active ? '#fff' : color} />
                                        <Text allowFontScaling={false} style={[s.chipText, { color: active ? '#fff' : colors.text }]}>
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Arrival time */}
                        {editedRecord.status !== 'absent' && (
                            <>
                                <Text allowFontScaling={false} style={[s.label, { color: colors.textSecondary }]}>Arrival Time</Text>
                                <TextInput
                                    style={[s.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={editedRecord.arrival_time || ''}
                                    onChangeText={text => setEditedRecord({ ...editedRecord, arrival_time: text })}
                                    placeholder="HH:MM:SS"
                                    placeholderTextColor={colors.textSecondary}
                                    allowFontScaling={false}
                                />
                            </>
                        )}
                    </View>

                    {/* Save button */}
                    <TouchableOpacity
                        style={[s.saveBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSave}
                    >
                        <Text allowFontScaling={false} style={s.saveBtnText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        height: SCREEN_HEIGHT * 0.75,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 24,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        gap: 8,
    },
    headerLeft: {
        flex: 1,
        gap: 3,
    },
    title: {
        fontSize: TextSizes.modalTitle,
        fontFamily: 'Inter-SemiBold',
    },
    subtitle: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    closeBtn: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 14,
        gap: 8,
    },
    label: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    chip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 9,
        borderWidth: 1,
        gap: 5,
    },
    chipText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
    input: {
        height: 42,
        borderWidth: 1,
        borderRadius: 9,
        paddingHorizontal: 12,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    saveBtn: {
        marginHorizontal: 16,
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },
});
