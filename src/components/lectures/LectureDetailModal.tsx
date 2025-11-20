// components/lectures/LectureDetailModal.tsx

import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Text } from 'react-native';
import { X, Calendar, Users, User, FileText, Clock, Download, BookOpen, Youtube } from 'lucide-react-native';
import styles from '../dairy/styles';

export const LectureDetailModal = ({
    visible,
    lecture,
    onClose,
    colors,
    formatDate,
}: {
    visible: boolean;
    lecture: any | null;
    onClose: () => void;
    colors: any;
    formatDate: (date: string) => string;
}) => {

    if (!lecture) return null;

    const handleOpenAttachment = () => {
        if (lecture.file_url) {
            Linking.openURL(lecture.file_url).catch(err =>
                console.warn('Failed to open attachment:', err)
            );
        }
    };

    const getFileIcon = () => {
        if (!lecture.file_type) return <FileText size={20} color={colors.primary} />;

        if (lecture.file_type.includes('video'))
            return <Youtube size={20} color={colors.primary} />;

        if (lecture.file_type.includes('image'))
            return <FileText size={20} color={colors.primary} />;

        return <FileText size={20} color={colors.primary} />;
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
                <View style={[styles.detailModalContent, { backgroundColor: colors.background }]}>

                    {/* Header */}
                    <View style={[styles.detailModalHeader, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.detailModalTitle, { color: colors.text }]}>
                            Lecture Details
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Scroll Area */}
                    <ScrollView style={styles.detailModalScrollView}>

                        {/* Title */}
                        <View style={styles.detailSection}>
                            <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Title
                            </Text>
                            <Text allowFontScaling={false} style={[styles.detailValue, { color: colors.text }]}>
                                {lecture.title}
                            </Text>
                        </View>

                        {/* Class */}
                        {lecture.classes?.name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <Users size={16} color={colors.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}
                                    >
                                        Class
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}
                                >
                                    {lecture.classes.name}
                                </Text>
                            </View>
                        )}

                        {/* Subject */}
                        {lecture.subjects?.name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <BookOpen size={16} color={colors.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}
                                    >
                                        Subject
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}
                                >
                                    {lecture.subjects.name}
                                </Text>
                            </View>
                        )}

                        {/* Uploaded By */}
                        {lecture.profiles?.full_name && (
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <User size={16} color={colors.primary} />
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.detailLabel, { color: colors.textSecondary, marginLeft: 8 }]}
                                    >
                                        Uploaded By
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    style={[styles.detailValue, { color: colors.text, marginLeft: 24 }]}
                                >
                                    {lecture.profiles.full_name}
                                </Text>
                            </View>
                        )}

                        {/* Description */}
                        <View style={styles.detailSection}>
                            <Text allowFontScaling={false} style={[styles.detailLabel, { color: colors.textSecondary }]}>
                                Description
                            </Text>
                            <Text
                                allowFontScaling={false}
                                style={[styles.detailDescription, { color: colors.text }]}
                            >
                                {lecture.description}
                            </Text>
                        </View>

                        {/* Attachment */}
                        {lecture.file_url && (
                            <View style={styles.detailSection}>
                                <TouchableOpacity
                                    style={[
                                        styles.attachmentCard,
                                        { backgroundColor: colors.primary + '10', borderColor: colors.primary },
                                    ]}
                                    onPress={handleOpenAttachment}
                                >
                                    {getFileIcon()}
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text
                                            allowFontScaling={false}
                                            style={[styles.attachmentTitle, { color: colors.primary }]}
                                        >
                                            Attachment
                                        </Text>
                                        <Text
                                            allowFontScaling={false}
                                            style={[styles.attachmentSubtitle, { color: colors.textSecondary }]}
                                        >
                                            Tap to view or download
                                        </Text>
                                    </View>
                                    <Download size={20} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Created Date */}
                        <View style={styles.detailSection}>
                            <Text
                                allowFontScaling={false}
                                style={[styles.createdDate, { color: colors.textSecondary }]}
                            >
                                Uploaded on {formatDate(lecture.created_at)}
                            </Text>
                        </View>
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
