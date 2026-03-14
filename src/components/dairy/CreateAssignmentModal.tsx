// components/diary/CreateAssignmentModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Modal, TouchableOpacity, ScrollView, TextInput,
    KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { Text } from 'react-native';
import { X, Upload, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { SkeletonBox } from '@/src/components/common/Skeleton';

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

    // Reset submitting state when modal closes
    useEffect(() => {
        if (!visible) setIsSubmitting(false);
    }, [visible]);

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

    const s = modalStyles(colors);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={s.overlay}>
                    <View style={s.sheet}>
                        {/* Header */}
                        <View style={[s.header, { borderBottomColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[s.title, { color: colors.text }]}>
                                Create Assignment
                            </Text>
                            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">

                            {/* Title */}
                            <View style={s.group}>
                                <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Title *</Text>
                                <TextInput
                                    style={[s.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    placeholder="Enter assignment title"
                                    placeholderTextColor={colors.textSecondary}
                                    value={newAssignment.title}
                                    onChangeText={(t) => setNewAssignment((p: any) => ({ ...p, title: t }))}
                                />
                            </View>

                            {/* Description */}
                            <View style={s.group}>
                                <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Description *</Text>
                                <TextInput
                                    style={[s.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    placeholder="Enter assignment description"
                                    placeholderTextColor={colors.textSecondary}
                                    value={newAssignment.description}
                                    onChangeText={(t) => setNewAssignment((p: any) => ({ ...p, description: t }))}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            {/* Due Date */}
                            <View style={s.group}>
                                <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Due Date *</Text>
                                <TextInput
                                    style={[s.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.textSecondary}
                                    value={newAssignment.due_date}
                                    onChangeText={(t) => setNewAssignment((p: any) => ({ ...p, due_date: t }))}
                                />
                            </View>

                            {/* Assign To */}
                            <View style={s.group}>
                                <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Assign To *</Text>
                                <View style={s.options}>
                                    {(['class', 'students'] as const).map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[
                                                s.option,
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
                                            <Text
                                                allowFontScaling={false}
                                                style={[s.optionText, { color: newAssignment.assignTo === opt ? '#fff' : colors.text }]}
                                            >
                                                {opt === 'class' ? 'Whole Class' : 'Specific Students'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Class Selection */}
                            <View style={s.group}>
                                <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Select Class *</Text>
                                {classes.length === 0 ? (
                                    <Text allowFontScaling={false} style={[s.hint, { color: colors.textSecondary }]}>No classes available</Text>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={s.options}>
                                            {classes.map((cls) => (
                                                <TouchableOpacity
                                                    key={cls.id}
                                                    style={[
                                                        s.option,
                                                        { borderColor: colors.border, backgroundColor: colors.cardBackground },
                                                        newAssignment.class_id === cls.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                    ]}
                                                    onPress={() => handleClassSelect(cls.id)}
                                                >
                                                    <Text
                                                        allowFontScaling={false}
                                                        style={[s.optionText, { color: newAssignment.class_id === cls.id ? '#fff' : colors.text }]}
                                                    >
                                                        {cls.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                )}
                            </View>

                            {/* Subject — only after class selected */}
                            {newAssignment.class_id ? (
                                <View style={s.group}>
                                    <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Select Subject *</Text>
                                    {subjects.length === 0 ? (
                                        <Text allowFontScaling={false} style={[s.hint, { color: colors.textSecondary }]}>No subjects for this class</Text>
                                    ) : (
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={s.options}>
                                                {subjects.map((sub) => (
                                                    <TouchableOpacity
                                                        key={sub.id}
                                                        style={[
                                                            s.option,
                                                            { borderColor: colors.border, backgroundColor: colors.cardBackground },
                                                            newAssignment.subject_id === sub.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                        ]}
                                                        onPress={() => handleSubjectSelect(sub.id)}
                                                    >
                                                        <Text
                                                            allowFontScaling={false}
                                                            style={[s.optionText, { color: newAssignment.subject_id === sub.id ? '#fff' : colors.text }]}
                                                        >
                                                            {sub.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </ScrollView>
                                    )}
                                </View>
                            ) : null}

                            {/* Students — only for 'students' mode, only after class selected */}
                            {newAssignment.assignTo === 'students' && newAssignment.class_id ? (
                                <View style={s.group}>
                                    <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Select Students *</Text>
                                    {loadingStudents ? (
                                        <View style={{ gap: 8 }}>
                                            {[...Array(4)].map((_, i) => (
                                                <SkeletonBox key={i} width="100%" height={44} borderRadius={12} />
                                            ))}
                                        </View>
                                    ) : students.length === 0 ? (
                                        <Text allowFontScaling={false} style={[s.hint, { color: colors.textSecondary }]}>
                                            {newAssignment.subject_id ? 'No students enrolled in this subject' : 'Select a subject first to load students'}
                                        </Text>
                                    ) : (
                                        <>
                                            {/* Dropdown trigger */}
                                            <TouchableOpacity
                                                style={[s.dropdownTrigger, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                                onPress={() => setStudentDropdownOpen(o => !o)}
                                            >
                                                <Text allowFontScaling={false} style={[s.dropdownTriggerText, { color: newAssignment.student_ids?.length > 0 ? colors.text : colors.textSecondary }]}>
                                                    {newAssignment.student_ids?.length > 0
                                                        ? `${newAssignment.student_ids.length} student${newAssignment.student_ids.length > 1 ? 's' : ''} selected`
                                                        : 'Tap to select students'}
                                                </Text>
                                                {studentDropdownOpen
                                                    ? <ChevronUp size={18} color={colors.textSecondary} />
                                                    : <ChevronDown size={18} color={colors.textSecondary} />}
                                            </TouchableOpacity>

                                            {/* Dropdown list */}
                                            {studentDropdownOpen && (
                                                <View style={[s.dropdownList, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
                                                        {students.map((st) => {
                                                            const selected = (newAssignment.student_ids || []).includes(st.id);
                                                            return (
                                                                <TouchableOpacity
                                                                    key={st.id}
                                                                    style={[
                                                                        s.studentRow,
                                                                        { borderBottomColor: colors.border, backgroundColor: selected ? colors.primary + '15' : 'transparent' },
                                                                    ]}
                                                                    onPress={() => toggleStudent(st.id)}
                                                                >
                                                                    <Text allowFontScaling={false} style={[s.studentName, { color: colors.text }]}>
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
                            <View style={s.group}>
                                <Text allowFontScaling={false} style={[s.label, { color: colors.text }]}>Attachment (Optional)</Text>
                                <TouchableOpacity
                                    style={[s.filePicker, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={pickDocument}
                                    disabled={uploading}
                                >
                                    <Upload size={20} color={colors.primary} />
                                    <Text allowFontScaling={false} style={[s.filePickerText, { color: colors.text }]}>
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
                                style={[s.submitBtn, { backgroundColor: colors.primary }, (isSubmitting || uploading) && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={isSubmitting || uploading}
                            >
                                <Text allowFontScaling={false} style={s.submitText}>
                                    {isSubmitting || uploading ? 'Creating...' : 'Create Assignment'}
                                </Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const modalStyles = (colors: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: TextSizes.modalTitle,
        fontFamily: 'Inter-SemiBold',
    },
    closeBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        paddingHorizontal: 24,
    },
    group: {
        marginBottom: 20,
        marginTop: 4,
    },
    label: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlignVertical: 'top',
        minHeight: 80,
    },
    hint: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Regular',
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    option: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    optionText: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    dropdownTriggerText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 6,
        overflow: 'hidden',
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    studentName: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    filePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        gap: 8,
    },
    filePickerText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },
    removeFile: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginTop: 6,
    },
    submitBtn: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    submitText: {
        color: '#ffffff',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },
});
