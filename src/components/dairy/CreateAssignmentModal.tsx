// components/diary/CreateAssignmentModal.tsx
import React from 'react';
import { View, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Text } from 'react-native';
import { X, Upload, Users, User } from 'lucide-react-native';
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

                        {/* Assign To Toggle */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Assign To</Text>
                            <View style={styles.assignToButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.assignToButton,
                                        {
                                            backgroundColor: newAssignment.assignTo === 'class' ? colors.primary : colors.cardBackground,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                    onPress={() => setNewAssignment(prev => ({ ...prev, assignTo: 'class' }))}
                                >
                                    <Users size={16} color={newAssignment.assignTo === 'class' ? '#ffffff' : colors.text} />
                                    <Text allowFontScaling={false} style={[
                                        styles.assignToButtonText,
                                        { color: newAssignment.assignTo === 'class' ? '#ffffff' : colors.text }
                                    ]}>
                                        Class
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.assignToButton,
                                        {
                                            backgroundColor: newAssignment.assignTo === 'student' ? colors.primary : colors.cardBackground,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                    onPress={() => setNewAssignment(prev => ({ ...prev, assignTo: 'student' }))}
                                >
                                    <User size={16} color={newAssignment.assignTo === 'student' ? '#ffffff' : colors.text} />
                                    <Text allowFontScaling={false} style={[
                                        styles.assignToButtonText,
                                        { color: newAssignment.assignTo === 'student' ? '#ffffff' : colors.text }
                                    ]}>
                                        Student
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Class Selection */}
                        {newAssignment.assignTo === 'class' && (
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Select Class</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.options}>
                                        {classes.map(cls => (
                                            <TouchableOpacity
                                                key={cls.id}
                                                style={[
                                                    styles.option,
                                                    {
                                                        backgroundColor: newAssignment.class_id === cls.id ? colors.primary : colors.cardBackground,
                                                        borderColor: colors.border,
                                                    }
                                                ]}
                                                onPress={() => setNewAssignment(prev => ({ ...prev, class_id: cls.id }))}
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
                            </View>
                        )}

                        {/* Student Selection */}
                        {newAssignment.assignTo === 'student' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Select Class First</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.options}>
                                            {classes.map(cls => (
                                                <TouchableOpacity
                                                    key={cls.id}
                                                    style={[
                                                        styles.option,
                                                        {
                                                            backgroundColor: newAssignment.class_id === cls.id ? colors.primary : colors.cardBackground,
                                                            borderColor: colors.border,
                                                        }
                                                    ]}
                                                    onPress={() => {
                                                        setNewAssignment(prev => ({ ...prev, class_id: cls.id, student_id: '' }));
                                                        fetchStudents(cls.id);
                                                    }}
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
                                </View>

                                {newAssignment.class_id && students.length > 0 && (
                                    <View style={styles.inputGroup}>
                                        <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Select Student</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.options}>
                                                {students.map(student => (
                                                    <TouchableOpacity
                                                        key={student.id}
                                                        style={[
                                                            styles.option,
                                                            {
                                                                backgroundColor: newAssignment.student_id === student.id ? colors.primary : colors.cardBackground,
                                                                borderColor: colors.border,
                                                            }
                                                        ]}
                                                        onPress={() => setNewAssignment(prev => ({ ...prev, student_id: student.id }))}
                                                    >
                                                        <Text allowFontScaling={false} style={[
                                                            styles.optionText,
                                                            { color: newAssignment.student_id === student.id ? '#ffffff' : colors.text }
                                                        ]}>
                                                            {student.full_name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    </View>
                                )}
                            </>
                        )}

                        {/* Subject Selection */}
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Select Subject</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.options}>
                                    {subjects && subjects.length > 0 ? (
                                        subjects.map((subject) => (
                                            <TouchableOpacity
                                                key={subject.id}
                                                style={[
                                                    styles.option,
                                                    {
                                                        backgroundColor: newAssignment.subject_id === subject.id ? colors.primary : colors.cardBackground,
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
                                        ))
                                    ) : (
                                        <Text allowFontScaling={false} style={[styles.optionText, { color: colors.textSecondary }]}>
                                            No subjects available
                                        </Text>
                                    )}
                                </View>
                            </ScrollView>
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
                                    {newAssignment.file ? newAssignment.file.name : 'Select file (PDF, Image)'}
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
                                {uploading ? 'Creating...' : 'Create Assignment'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );