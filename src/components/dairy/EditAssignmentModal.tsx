// components/diary/EditAssignmentModal.tsx
import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Text } from 'react-native';
import { X, Upload } from 'lucide-react-native';
import styles from './styles';

export const EditAssignmentModal = ({
    visible,
    onClose,
    colors,
    newAssignment,
    setNewAssignment,
    uploading,
    onSubmit,
    pickDocument,
}: {
    visible: boolean;
    onClose: () => void;
    colors: any;
    newAssignment: any;
    setNewAssignment: (val: any) => void;
    uploading: boolean;
    onSubmit: () => void;
    pickDocument: () => void;
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>
                            Edit Assignment
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScrollView}>
                        {/* Title Input */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Title</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter assignment title"
                                value={newAssignment.title}
                                onChangeText={(text) => setNewAssignment(prev => ({ ...prev, title: text }))}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter assignment description"
                                value={newAssignment.description}
                                onChangeText={(text) => setNewAssignment(prev => ({ ...prev, description: text }))}
                                multiline
                                numberOfLines={4}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Due Date Input */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Due Date</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                placeholder="YYYY-MM-DD"
                                value={newAssignment.due_date}
                                onChangeText={(text) => setNewAssignment(prev => ({ ...prev, due_date: text }))}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* File Picker */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Attachment (Optional)</Text>
                            <TouchableOpacity
                                style={[styles.filePickerButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                onPress={pickDocument}
                            >
                                <Upload size={20} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.filePickerText, { color: colors.text }]}>
                                    {newAssignment.file ? newAssignment.file.name : 'Update file (PDF, Image)'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }, uploading && styles.submitButtonDisabled]}
                            onPress={onSubmit}
                            disabled={uploading}
                        >
                            <Text allowFontScaling={false} style={styles.submitButtonText}>
                                {uploading ? 'Updating...' : 'Update Assignment'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};