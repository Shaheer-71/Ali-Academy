// components/diary/AssignmentDetailModal.tsx
import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text } from 'react-native';
import { X, Calendar, Users, User, FileText, Clock, Download } from 'lucide-react-native';
import styles from './styles';

interface DiaryAssignment {
    id: string;
    title: string;
    description: string;
    due_date: string;
    file_url?: string;
    class_id?: string;
    student_id?: string;
    subject_id?: string;
    created_at: string;
    classes?: { name: string };
    students?: { full_name: string };
    subjects?: { name: string };
}

export const AssignmentDetailModal = ({
    visible,
    assignment,
    onClose,
    colors,
    isOverdue,
    formatDate,
}: {
    visible: boolean;
    assignment: DiaryAssignment | null;
    onClose: () => void;
    colors: any;
    isOverdue: (date: string) => boolean;
    formatDate: (date: string) => string;
}) => {
    if (!assignment) return null;

    const handleOpenAttachment = () => {
        if (assignment.file_url) {
            Linking.openURL(assignment.file_url).catch(err =>
                console.error('Failed to open attachment:', err)
            );
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.detailModalOverlay}>
                <View style={[styles.detailModalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.detailModalHeader, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.detailModalTitle, { color: colors.text }]}>
                            Assignment Details
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.detailModalScrollView}>
                        {/* Title */}
                        <View style={styles.detailSection}>
                            <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Title
                            </Text>
                            <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text }]}>
                                {assignment.title}
                            </Text>
                        </View>

                        {/* Status Badge */}
                        {isOverdue(assignment.due_date) && (
                            <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                                <Clock size={14} color="#EF4444" />
                                <Text allowFontScaling={false} style={styles.statusBadgeText}>OVERDUE</Text>
                            </View>
                        )}

                        {/* Due Date */}
                        <View style={styles.detailSection}>
                            <View style={styles.detailRow}>
                                <Calendar size={16} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                                    Due Date
                                </Text>
                            </View>
                            <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}>
                                {formatDate(assignment.due_date)}
                            </Text>
                        </View>

                        {/* Class Info */}
                        {assignment.classes?.name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Users size={16} color={colors.primary} />
                                    <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                                        Class
                                    </Text>
                                </View>
                                <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}>
                                    {assignment.classes.name}
                                </Text>
                            </View>
                        )}

                        {/* Student Info */}
                        {assignment.students?.full_name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <User size={16} color={colors.primary} />
                                    <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                                        Student
                                    </Text>
                                </View>
                                <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}>
                                    {assignment.students.full_name}
                                </Text>
                            </View>
                        )}

                        {/* Subject */}
                        {assignment.subjects?.name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <FileText size={16} color={colors.primary} />
                                    <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                                        Subject
                                    </Text>
                                </View>
                                <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}>
                                    {assignment.subjects.name}
                                </Text>
                            </View>
                        )}

                        {/* Assigned By (Teacher) */}
                        {assignment.profiles?.full_name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <User size={16} color={colors.primary} />
                                    <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                                        Assigned By
                                    </Text>
                                </View>
                                <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}>
                                    {assignment.profiles.full_name}
                                </Text>
                            </View>
                        )}

                        {/* Description */}
                        <View style={styles.detailSection}>
                            <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Description
                            </Text>
                            <Text allowFontScaling={false} style={[styles.detailDescription, { color: colors.text }]}>
                                {assignment.description}
                            </Text>
                        </View>

                        {/* Attachment */}
                        {assignment.file_url && (
                            <View style={styles.detailSection}>
                                <TouchableOpacity
                                    style={[styles.attachmentCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
                                    onPress={handleOpenAttachment}
                                >
                                    <FileText size={20} color={colors.primary} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text allowFontScaling={false} style={[styles.attachmentTitle, { color: colors.primary }]}>
                                            Attachment
                                        </Text>
                                        <Text allowFontScaling={false} style={[styles.attachmentSubtitle, { color: colors.textSecondary }]}>
                                            Tap to view or download
                                        </Text>
                                    </View>
                                    <Download size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Created Date */}
                        <View style={styles.detailSection}>
                            <Text allowFontScaling={false} style={[styles.createdDate, { color: colors.textSecondary }]}>
                                Created on {formatDate(assignment.created_at)}
                            </Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.detailCloseButton, { backgroundColor: colors.primary }]}
                        onPress={onClose}
                    >
                        <Text allowFontScaling={false} style={styles.detailCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};