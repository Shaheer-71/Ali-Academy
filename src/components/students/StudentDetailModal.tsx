import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Linking, useColorScheme } from 'react-native';
import { Text } from 'react-native';
import { X, Users, User, Calendar, Phone, Home, Mail, FileText } from 'lucide-react-native';
import styles from '../dairy/styles';
import { useTheme } from '@react-navigation/native';

export const StudentDetailModal = ({
    visible,
    student,
    onClose,
}: {
    visible: boolean;
    student: any | null;
    onClose: () => void;
}) => {

    const { isDark } = useTheme();
    if (!student) return null;


    // Hardcoded theme colors
    const theme = isDark
        ? {
            background: '#0D0D0F',
            card: '#161618',
            text: '#E6E6E6',
            textSecondary: '#9AA1A4',
            border: '#242628',
            primary: '#3E6D73',
        }
        : {
            background: '#FFFFFF',
            card: '#F4F7F8',
            text: '#1F3F4A',
            textSecondary: '#5A7A80',
            border: '#D5DFE1',
            primary: '#1F3F4A',
        };

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
                <View style={[styles.detailModalContent, { backgroundColor: theme.background }]}>

                    {/* Header */}
                    <View style={[styles.detailModalHeader, { borderBottomColor: theme.border }]}>
                        <Text allowFontScaling={false} style={[styles.detailModalTitle, { color: theme.text }]}>
                            Student Details
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Scroll Content */}
                    <ScrollView style={styles.detailModalScrollView}>

                        {/* Name */}
                        <View style={styles.detailSection}>
                            <Text allowFontScaling={false} style={[styles.detailLabel, { color: theme.textSecondary }]}>
                                Full Name
                            </Text>
                            <Text allowFontScaling={false} style={[styles.detailValue, { color: theme.text }]}>
                                {student.full_name}
                            </Text>
                        </View>

                        {/* Roll Number */}
                        {student.roll_number && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <User size={16} color={theme.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: theme.textSecondary, marginLeft: 8 }]}
                                    >
                                        Roll Number
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: theme.text, marginLeft: 24 }]}
                                >
                                    {student.roll_number}
                                </Text>
                            </View>
                        )}

                        {/* Class */}
                        {student.classes?.name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Users size={16} color={theme.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: theme.textSecondary, marginLeft: 8 }]}
                                    >
                                        Class
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: theme.text, marginLeft: 24 }]}
                                >
                                    {student.classes.name}
                                </Text>
                            </View>
                        )}

                        {/* Date of Birth */}
                        {student.date_of_birth && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Calendar size={16} color={theme.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: theme.textSecondary, marginLeft: 8 }]}
                                    >
                                        Date of Birth
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: theme.text, marginLeft: 24 }]}
                                >
                                    {student.date_of_birth}
                                </Text>
                            </View>
                        )}

                        {/* Address */}
                        {student.address && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Home size={16} color={theme.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: theme.textSecondary, marginLeft: 8 }]}
                                    >
                                        Address
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailDescription, { color: theme.text, marginLeft: 24 }]}
                                >
                                    {student.address}
                                </Text>
                            </View>
                        )}

                        {/* Parent Contact */}
                        {student.parent_contact && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Phone size={16} color={theme.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: theme.textSecondary, marginLeft: 8 }]}
                                    >
                                        Parent Contact
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: theme.text, marginLeft: 24 }]}
                                >
                                    {student.parent_contact}
                                </Text>
                            </View>
                        )}

                        {/* Email */}
                        {student.email && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Mail size={16} color={theme.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: theme.textSecondary, marginLeft: 8 }]}
                                    >
                                        Email
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: theme.text, marginLeft: 24 }]}
                                >
                                    {student.email}
                                </Text>
                            </View>
                        )}

                        {/* Admission Date */}
                        {student.admission_date && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Calendar size={16} color={theme.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: theme.textSecondary, marginLeft: 8 }]}
                                    >
                                        Admission Date
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: theme.text, marginLeft: 24 }]}
                                >
                                    {student.admission_date}
                                </Text>
                            </View>
                        )}

                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity
                        style={[styles.detailCloseButton, { backgroundColor: theme.primary }]}
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