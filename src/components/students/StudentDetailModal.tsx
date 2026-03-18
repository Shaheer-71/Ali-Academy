import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native';
import { X, Users, User, Calendar, Phone, Home, Mail, UserCheck, AlertCircle } from 'lucide-react-native';
import styles from '../diary/styles';
import { useTheme } from '@/src/contexts/ThemeContext';

export const StudentDetailModal = ({
    visible,
    student,
    onClose,
}: {
    visible: boolean;
    student: any | null;
    onClose: () => void;
}) => {
    const { colors } = useTheme();
    if (!student) return null;

    const row = (icon: React.ReactNode, label: string, value: string) => (
        <View style={styles.detailSection}>
            <View style={styles.detailRow}>
                {icon}
                <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                    {label}
                </Text>
            </View>
            <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}>
                {value || '—'}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
        >
            <View style={styles.detailModalOverlay}>
                <View style={[styles.detailModalContent, { backgroundColor: colors.background }]}>

                    {/* Header */}
                    <View style={[styles.detailModalHeader, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.detailModalTitle, { color: colors.text }]}>
                            Student Details
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Scroll Content */}
                    <ScrollView style={styles.detailModalScrollView} contentContainerStyle={{ paddingBottom: 24 }}>

                        {row(<User size={16} color={colors.primary} />, 'Full Name', student.full_name)}
                        {row(<User size={16} color={colors.primary} />, 'Roll Number', student.roll_number)}
                        {row(<Users size={16} color={colors.primary} />, 'Class', student.classes?.name)}
                        {row(<Mail size={16} color={colors.primary} />, 'Email', student.email)}
                        {row(<Phone size={16} color={colors.primary} />, 'Phone Number', student.phone_number)}
                        {row(<User size={16} color={colors.primary} />, 'Gender', student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '')}
                        {row(<Home size={16} color={colors.primary} />, 'Address', student.address)}
                        {row(<Calendar size={16} color={colors.primary} />, 'Admission Date', student.admission_date)}
                        {row(<Calendar size={16} color={colors.primary} />, 'Date of Birth', student.date_of_birth)}
                        {row(<Phone size={16} color={colors.primary} />, 'Parent Contact', student.parent_contact)}
                        {row(<UserCheck size={16} color={colors.primary} />, 'Parent Name', student.parent_name)}
                        {row(<AlertCircle size={16} color={colors.primary} />, 'Emergency Contact', student.emergency_contact)}

                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity
                        style={[styles.detailCloseButton, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                    >
                        <Text allowFontScaling={false} style={styles.detailCloseButtonText}>
                            Close
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

export default StudentDetailModal;
