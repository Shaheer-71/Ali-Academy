// components/diary/CreateAssignmentModal.tsx
import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Text } from 'react-native';
import { X, Upload } from 'lucide-react-native';
import styles from './styles';

export const CreateAssignmentModal = ({
    visible,
    onClose,
    colors,
    newAssignment,
    setNewAssignment,
    classes,
    students,
    subjects,
    uploading,
    onSubmit,
    pickDocument,
    fetchStudents,
    fetchSubjectsForClass,
    showError,
}: {
    visible: boolean;
    onClose: () => void;
    colors: any;
    newAssignment: any;
    setNewAssignment: (val: any) => void;
    classes: any[];
    students: any[];
    subjects: any[];
    uploading: boolean;
    onSubmit: () => void;
    pickDocument: () => void;
    fetchStudents: (classId: string) => void;
    fetchSubjectsForClass: (classId: string) => void;
    showError?: (error: any, handler?: (error: any) => any) => void;
}) => {
    
    const handleClassSelect = async (classId: string) => {
        try {
            setNewAssignment(prev => ({ ...prev, class_id: classId, subject_id: '' }));
            await fetchSubjectsForClass(classId);
        } catch (error) {
            console.warn('❌ Error selecting class:', error);
            if (showError) {
                showError(error);
            }
        }
    };

    const handleStudentClassSelect = async (classId: string) => {
        try {
            setNewAssignment(prev => ({ 
                ...prev, 
                class_id: classId, 
                student_id: '', 
                subject_id: '' 
            }));
            await Promise.all([
                fetchStudents(classId),
                fetchSubjectsForClass(classId)
            ]);
        } catch (error) {
            console.warn('❌ Error selecting class for student:', error);
            if (showError) {
                showError(error);
            }
        }
    };

    const handleDocumentPick = async () => {
        try {
            await pickDocument();
        } catch (error) {
            console.warn('❌ Error picking document:', error);
            if (showError) {
                showError(error);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            await onSubmit();
        } catch (error) {
            console.warn('❌ Error submitting assignment:', error);
            if (showError) {
                showError(error);
            }
        }
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
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>
                            Create Assignment
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
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                Title *
                            </Text>
                            <TextInput
                                style={[styles.input, { 
                                    backgroundColor: colors.cardBackground, 
                                    color: colors.text, 
                                    borderColor: colors.border 
                                }]}
                                placeholder="Enter assignment title"
                                value={newAssignment.title}
                                onChangeText={(text) => setNewAssignment(prev => ({ ...prev, title: text }))}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                Description *
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { 
                                    backgroundColor: colors.cardBackground, 
                                    color: colors.text, 
                                    borderColor: colors.border 
                                }]}
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
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                Due Date *
                            </Text>
                            <TextInput
                                style={[styles.input, { 
                                    backgroundColor: colors.cardBackground, 
                                    color: colors.text, 
                                    borderColor: colors.border 
                                }]}
                                placeholder="YYYY-MM-DD"
                                value={newAssignment.due_date}
                                onChangeText={(text) => setNewAssignment(prev => ({ ...prev, due_date: text }))}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Class Selection */}
                        {newAssignment.assignTo === 'class' && (
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                    Select Class *
                                </Text>
                                {classes.length === 0 ? (
                                    <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                            No classes available
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.options}>
                                            {classes.map(cls => (
                                                <TouchableOpacity
                                                    key={cls.id}
                                                    style={[
                                                        styles.option,
                                                        {
                                                            backgroundColor: newAssignment.class_id === cls.id 
                                                                ? colors.primary 
                                                                : colors.cardBackground,
                                                            borderColor: colors.border,
                                                        }
                                                    ]}
                                                    onPress={() => handleClassSelect(cls.id)}
                                                >
                                                    <Text allowFontScaling={false} style={[
                                                        styles.optionText,
                                                        { color: newAssignment.class_id === cls.id ? '#ffffff' : colors.text }
                                                    ]}>
                                                        {cls.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                )}
                            </View>
                        )}

                        {/* Subject Selection */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                Select Subject *
                            </Text>
                            {!newAssignment.class_id ? (
                                <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
                                    <Text allowFontScaling={false} style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                        Please select a class first
                                    </Text>
                                </View>
                            ) : subjects.length === 0 ? (
                                <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
                                    <Text allowFontScaling={false} style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                        No subjects available for this class
                                    </Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.options}>
                                        {subjects.map((subject) => (
                                            <TouchableOpacity
                                                key={subject.id}
                                                style={[
                                                    styles.option,
                                                    {
                                                        backgroundColor: newAssignment.subject_id === subject.id 
                                                            ? colors.primary 
                                                            : colors.cardBackground,
                                                        borderColor: colors.border,
                                                    }
                                                ]}
                                                onPress={() => setNewAssignment(prev => ({ ...prev, subject_id: subject.id }))}
                                            >
                                                <Text allowFontScaling={false} style={[
                                                    styles.optionText,
                                                    { color: newAssignment.subject_id === subject.id ? '#ffffff' : colors.text }
                                                ]}>
                                                    {subject.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            )}
                        </View>

                        {/* File Picker */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                Attachment (Optional)
                            </Text>
                            <TouchableOpacity
                                style={[styles.filePickerButton, { 
                                    backgroundColor: colors.cardBackground, 
                                    borderColor: colors.border 
                                }]}
                                onPress={handleDocumentPick}
                                disabled={uploading}
                            >
                                <Upload size={20} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.filePickerText, { color: colors.text }]}>
                                    {newAssignment.file ? newAssignment.file.name : 'Select file (PDF, Image)'}
                                </Text>
                            </TouchableOpacity>
                            {newAssignment.file && (
                                <TouchableOpacity
                                    style={styles.removeFileButton}
                                    onPress={() => setNewAssignment(prev => ({ ...prev, file: null }))}
                                >
                                    <Text allowFontScaling={false} style={[styles.removeFileText, { color: colors.error }]}>
                                        Remove file
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton, 
                                { backgroundColor: colors.primary, marginBottom: 40 }, 
                                uploading && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={uploading}
                        >
                            <Text allowFontScaling={false} style={styles.submitButtonText}>
                                {uploading ? 'Creating...' : 'Create Assignment'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}