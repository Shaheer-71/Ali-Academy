import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomTimeModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (time: string) => void;
}

export const CustomTimeModal: React.FC<CustomTimeModalProps> = ({
    visible,
    onClose,
    onConfirm,
}) => {
    const { colors } = useTheme();
    const [customTime, setCustomTime] = useState('');

    const handleConfirm = () => {
        if (!customTime) return;

        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(customTime)) {
            Alert.alert('Error', 'Please enter time in HH:MM format');
            return;
        }

        onConfirm(customTime);
        setCustomTime('');
        onClose();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.timeModalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Arrival Time</Text>
                        <TouchableOpacity onPress={onClose}>
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
                                onPress={onClose}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.confirmButtonText}>Mark Present</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
    timeModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '40%',
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
});