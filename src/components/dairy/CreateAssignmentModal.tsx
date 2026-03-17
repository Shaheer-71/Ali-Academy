// components/diary/CreateAssignmentModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Modal, TouchableOpacity, ScrollView, TextInput,
    Keyboard, Platform, StyleSheet,
} from 'react-native';
import { Text } from 'react-native';
import { X, Upload, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { modalShell, modalForm } from '@/src/styles/creationModalStyles';

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
    fetchStudents: (classId: string, subjectId?: string) => void;
    fetchSubjectsForClass: (classId: string) => void;
    showError?: (error: any, handler?: (error: any) => any) => void;
}) => {

    const [loadingStudents, setLoadingStudents] = useState(false);
    const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (!visible) setIsSubmitting(false);
    }, [visible]);

    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            e => setKeyboardHeight(e.endCoordinates.height)
        );
        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );
        return () => { show.remove(); hide.remove(); };
    }, []);

    const handleSubmit = () => {
        if (isSubmitting || uploading) return;
        setIsSubmitting(true);
        onSubmit();
    };

    const handleClassSelect = async (classId: string) => {
        setNewAssignment((prev: any) => ({ ...prev, class_id: classId, subject_id: '', student_ids: [] }));
        setStudentDropdownOpen(false);
        await fetchSubjectsForClass(classId);
        if (newAssignment.assignTo === 'students') {
            setLoadingStudents(true);
            try { await fetchStudents(classId); } finally { setLoadingStudents(false); }
        }
    };

    const handleSubjectSelect = async (subjectId: string) => {
        setNewAssignment((prev: any) => ({ ...prev, subject_id: subjectId, student_ids: [] }));
        setStudentDropdownOpen(false);
        if (newAssignment.assignTo === 'students' && newAssignment.class_id) {
            setLoadingStudents(true);
            try { await fetchStudents(newAssignment.class_id, subjectId); } finally { setLoadingStudents(false); }
        }
    };

    const toggleStudent = (studentId: string) => {
        const current: string[] = newAssignment.student_ids || [];
        const updated = current.includes(studentId)
            ? current.filter((id: string) => id !== studentId)
            : [...current, studentId];
        setNewAssignment((prev: any) => ({ ...prev, student_ids: updated }));
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
            <View style={modalShell.overlay}>
                <View style={[modalShell.sheet, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[modalShell.header, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[modalShell.title, { color: colors.text }]}>
                            Create Assignment
                        </Text>
                        <TouchableOpacity style={modalShell.closeBtn} onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={modalShell.scroll} keyboardShouldPersistTaps="handled"
                        contentContainerStyle={[modalShell.scrollContent, { paddingBottom: keyboardHeight + 24 }]}>

                        {/* Title */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Title *</Text>
                            <TextInput
                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                placeholder="Enter assignment title"
                                placeholderTextColor={colors.textSecondary}
                                value={newAssignment.title}
                                onChangeText={(t) => setNewAssignment((p: any) => ({ ...p, title: t }))}
                            />
                        </View>

                        {/* Description */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Description *</Text>
                            <TextInput
                                style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                placeholder="Enter assignment description"
                                placeholderTextColor={colors.textSecondary}
                                value={newAssignment.description}
                                onChangeText={(t) => setNewAssignment((p: any) => ({ ...p, description: t }))}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        {/* Due Date */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Due Date *</Text>
                            <TextInput
                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.textSecondary}
                                value={newAssignment.due_date}
                                onChangeText={(t) => setNewAssignment((p: any) => ({ ...p, due_date: t }))}
                            />
                        </View>

                        {/* Assign To */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Assign To *</Text>
                            <View style={modalForm.chipRow}>
                                {(['class', 'students'] as const).map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[
                                            modalForm.chip,
                                            { borderColor: colors.border, backgroundColor: colors.cardBackground },
                                            newAssignment.assignTo === opt && { backgroundColor: colors.primary, borderColor: colors.primary },
                                        ]}
                                        onPress={() => {
                                            setNewAssignment((p: any) => ({ ...p, assignTo: opt, student_ids: [] }));
                                            if (opt === 'students' && newAssignment.class_id && newAssignment.subject_id) {
                                                setLoadingStudents(true);
                                                fetchStudents(newAssignment.class_id, newAssignment.subject_id)
                                                    .finally(() => setLoadingStudents(false));
                                            }
                                        }}
                                    >
                                        <Text allowFontScaling={false} style={[modalForm.chipText, { color: newAssignment.assignTo === opt ? '#fff' : colors.text }]}>
                                            {opt === 'class' ? 'Whole Class' : 'Specific Students'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Class Selection */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Select Class *</Text>
                            {classes.length === 0 ? (
                                <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>No classes available</Text>
                            ) : (
                                <View style={modalForm.chipRow}>
                                    {classes.map((cls) => (
                                        <TouchableOpacity
                                            key={cls.id}
                                            style={[
                                                modalForm.chip,
                                                { borderColor: colors.border, backgroundColor: colors.cardBackground },
                                                newAssignment.class_id === cls.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                            ]}
                                            onPress={() => handleClassSelect(cls.id)}
                                        >
                                            <Text allowFontScaling={false} style={[modalForm.chipText, { color: newAssignment.class_id === cls.id ? '#fff' : colors.text }]}>
                                                {cls.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Subject — only after class selected */}
                        {newAssignment.class_id ? (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Select Subject *</Text>
                                {subjects.length === 0 ? (
                                    <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>No subjects for this class</Text>
                                ) : (
                                    <View style={modalForm.chipRow}>
                                        {subjects.map((sub) => (
                                            <TouchableOpacity
                                                key={sub.id}
                                                style={[
                                                    modalForm.chip,
                                                    { borderColor: colors.border, backgroundColor: colors.cardBackground },
                                                    newAssignment.subject_id === sub.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                ]}
                                                onPress={() => handleSubjectSelect(sub.id)}
                                            >
                                                <Text allowFontScaling={false} style={[modalForm.chipText, { color: newAssignment.subject_id === sub.id ? '#fff' : colors.text }]}>
                                                    {sub.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {/* Students — only for 'students' mode */}
                        {newAssignment.assignTo === 'students' && newAssignment.class_id ? (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Select Students *</Text>
                                {loadingStudents ? (
                                    <View style={{ gap: 8 }}>
                                        {[...Array(4)].map((_, i) => (
                                            <SkeletonBox key={i} width="100%" height={50} borderRadius={12} />
                                        ))}
                                    </View>
                                ) : students.length === 0 ? (
                                    <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>
                                        {newAssignment.subject_id ? 'No students enrolled in this subject' : 'Select a subject first to load students'}
                                    </Text>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[modalForm.pickerRow, { backgroundColor: colors.cardBackground, borderColor: studentDropdownOpen ? colors.primary : colors.border }]}
                                            onPress={() => setStudentDropdownOpen(o => !o)}
                                        >
                                            <Text allowFontScaling={false} style={[modalForm.pickerValue, { color: newAssignment.student_ids?.length > 0 ? colors.text : colors.textSecondary }]}>
                                                {newAssignment.student_ids?.length > 0
                                                    ? `${newAssignment.student_ids.length} student${newAssignment.student_ids.length > 1 ? 's' : ''} selected`
                                                    : 'Tap to select students'}
                                            </Text>
                                            {studentDropdownOpen
                                                ? <ChevronUp size={18} color={colors.textSecondary} />
                                                : <ChevronDown size={18} color={colors.textSecondary} />}
                                        </TouchableOpacity>
                                        {studentDropdownOpen && (
                                            <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={modalForm.dropdownScroll}>
                                                    {students.map((st) => {
                                                        const selected = (newAssignment.student_ids || []).includes(st.id);
                                                        return (
                                                            <TouchableOpacity
                                                                key={st.id}
                                                                style={[modalForm.dropdownOption, { borderBottomColor: colors.border, backgroundColor: selected ? colors.primary + '18' : 'transparent' }]}
                                                                onPress={() => toggleStudent(st.id)}
                                                            >
                                                                <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: colors.text }]}>
                                                                    {st.full_name}
                                                                </Text>
                                                                {selected && <Check size={16} color={colors.primary} />}
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        ) : null}

                        {/* Attachment */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Attachment (Optional)</Text>
                            <TouchableOpacity
                                style={[modalForm.filePicker, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                onPress={pickDocument}
                                disabled={uploading}
                            >
                                <Upload size={20} color={colors.primary} />
                                <Text allowFontScaling={false} style={[modalForm.filePickerText, { color: newAssignment.file ? colors.text : colors.textSecondary }]}>
                                    {newAssignment.file ? newAssignment.file.name : 'Select file (PDF, Image)'}
                                </Text>
                            </TouchableOpacity>
                            {newAssignment.file && (
                                <TouchableOpacity onPress={() => setNewAssignment((p: any) => ({ ...p, file: null }))}>
                                    <Text allowFontScaling={false} style={[s.removeFile, { color: '#EF4444' }]}>Remove file</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            style={[modalForm.submitBtn, { backgroundColor: colors.primary }, (isSubmitting || uploading) && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || uploading}
                        >
                            <Text allowFontScaling={false} style={modalForm.submitText}>
                                {isSubmitting || uploading ? 'Creating...' : 'Create Assignment'}
                            </Text>
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    removeFile: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginTop: 6,
    },
});
