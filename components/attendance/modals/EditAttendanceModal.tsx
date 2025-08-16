import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { X, CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AttendanceRecord } from '@/types/attendance';

interface EditAttendanceModalProps {
    visible: boolean;
    record: AttendanceRecord | null;
    onClose: () => void;
    onSave: (recordId: string, updates: any) => Promise<{ success: boolean }>;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
    visible,
    record,
    onClose,
    onSave,
}) => {
    const { colors } = useTheme();
    const [editedRecord, setEditedRecord] = useState<AttendanceRecord | null>(null);

    useEffect(() => {
        if (record) {
            setEditedRecord({ ...record });
        }
    }, [record]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleSave = async () => {
        if (!editedRecord) return;

        try {
            // Only send fields that exist in your schema
            const updates = {
                status: editedRecord.status,
                arrival_time: editedRecord.arrival_time,
                late_minutes: editedRecord.late_minutes,
            };

            const result = await onSave(editedRecord.id, updates);

            if (result.success) {
                Alert.alert('Success', 'Attendance updated successfully');
                onClose();
            } else {
                Alert.alert('Error', 'Failed to update attendance');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    if (!editedRecord) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.editModalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Attendance</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.editModalBody}>
                        <View style={[styles.studentInfoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.editStudentName, { color: colors.text }]}>
                                {editedRecord.students?.full_name}
                            </Text>
                            <Text style={[styles.editStudentDetails, { color: colors.textSecondary }]}>
                                {editedRecord.students?.roll_number} • {formatDate(editedRecord.date)}
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
                                            editedRecord.status === option.value && { backgroundColor: option.color, borderColor: option.color },
                                        ]}
                                        onPress={() => setEditedRecord({ ...editedRecord, status: option.value as any })}
                                    >
                                        <option.icon size={16} color={editedRecord.status === option.value ? '#ffffff' : option.color} />
                                        <Text style={[
                                            styles.statusOptionText,
                                            { color: colors.text },
                                            editedRecord.status === option.value && { color: '#ffffff' },
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {editedRecord.status !== 'absent' && (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Arrival Time</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={editedRecord.arrival_time || ''}
                                    onChangeText={(text) => setEditedRecord({ ...editedRecord, arrival_time: text })}
                                    placeholder="HH:MM:SS"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
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
});