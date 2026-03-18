// components/diary/CreateAssignmentModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Modal, TouchableOpacity, ScrollView, TextInput,
    Keyboard, Platform, StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import { Text } from 'react-native';
import { X, Upload, Check, ChevronRight } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { modalShell, modalForm } from '@/src/styles/creationModalStyles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CreateAssignmentModal = ({
    visible,
    onClose,
    colors,
    isDark,
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
    isDark?: boolean;
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
    const { bottom: bottomInset } = useSafeAreaInsets();
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // One open dropdown at a time
    type DropdownKey = 'assignTo' | 'class' | 'subject' | 'students' | 'date' | null;
    const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
    const toggle = (key: DropdownKey) => setOpenDropdown(prev => prev === key ? null : key);

    useEffect(() => {
        if (!visible) { setIsSubmitting(false); setOpenDropdown(null); setShowDatePicker(false); }
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

    const isFormValid =
        newAssignment.title?.trim() !== '' &&
        newAssignment.description?.trim() !== '' &&
        newAssignment.due_date?.trim() !== '' &&
        newAssignment.class_id !== '' &&
        (newAssignment.assignTo === 'class' ||
            (newAssignment.assignTo === 'students' && (newAssignment.student_ids?.length ?? 0) > 0));

    const handleSubmit = () => {
        if (isSubmitting || uploading || !isFormValid) return;
        setIsSubmitting(true);
        onSubmit();
    };

    const handleClassSelect = async (classId: string) => {
        setNewAssignment((prev: any) => ({ ...prev, class_id: classId, subject_id: '', student_ids: [] }));
        setOpenDropdown(null);
        await fetchSubjectsForClass(classId);
        if (newAssignment.assignTo === 'students') {
            setLoadingStudents(true);
            try { await fetchStudents(classId); } finally { setLoadingStudents(false); }
        }
    };

    const handleSubjectSelect = async (subjectId: string) => {
        setNewAssignment((prev: any) => ({ ...prev, subject_id: subjectId, student_ids: [] }));
        setOpenDropdown(null);
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

    const selectedClassName = classes.find(c => c.id === newAssignment.class_id)?.name ?? 'Select class';
    const selectedSubjectName = subjects.find(s => s.id === newAssignment.subject_id)?.name ?? 'Select subject';
    const assignToLabel = newAssignment.assignTo === 'class' ? 'Whole Class' : 'Specific Students';
    const studentsLabel = (newAssignment.student_ids?.length ?? 0) > 0
        ? `${newAssignment.student_ids.length} student${newAssignment.student_ids.length > 1 ? 's' : ''} selected`
        : 'Select students';

    const chevronStyle = (key: DropdownKey) => ({
        marginLeft: 6,
        transform: [{ rotate: openDropdown === key ? '270deg' : '90deg' }] as any,
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={modalShell.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={[modalShell.sheet, { backgroundColor: colors.background, paddingBottom: bottomInset }]}>
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
                            <TouchableOpacity
                                style={[s.accordionHeader, { borderColor: colors.border }]}
                                onPress={() => {
                                    if (Platform.OS === 'android') {
                                        // Android shows a native dialog — no inline body needed
                                        setOpenDropdown(null);
                                        setShowDatePicker(true);
                                    } else {
                                        toggle('date');
                                    }
                                }}
                            >
                                <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Due Date *</Text>
                                <View style={s.accordionRight}>
                                    <Text allowFontScaling={false} style={[s.accordionValue, { color: newAssignment.due_date ? colors.text : colors.textSecondary }]}>
                                        {newAssignment.due_date || 'Select date'}
                                    </Text>
                                    <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('date')} />
                                </View>
                            </TouchableOpacity>

                            {/* iOS: inline picker in accordion body */}
                            {Platform.OS === 'ios' && openDropdown === 'date' && (
                                <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                    <DateTimePicker
                                        value={newAssignment.due_date ? new Date(newAssignment.due_date) : new Date()}
                                        mode="date"
                                        display="inline"
                                        minimumDate={new Date()}
                                        themeVariant={isDark ? 'dark' : 'light'}
                                        onChange={(_, selectedDate) => {
                                            if (selectedDate) {
                                                setNewAssignment((p: any) => ({
                                                    ...p,
                                                    due_date: selectedDate.toISOString().split('T')[0],
                                                }));
                                            }
                                        }}
                                    />
                                </View>
                            )}

                            {/* Android: native dialog */}
                            {showDatePicker && Platform.OS === 'android' && (
                                <DateTimePicker
                                    value={newAssignment.due_date ? new Date(newAssignment.due_date) : new Date()}
                                    mode="date"
                                    display="default"
                                    minimumDate={new Date()}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (event.type !== 'dismissed' && selectedDate) {
                                            setNewAssignment((p: any) => ({
                                                ...p,
                                                due_date: selectedDate.toISOString().split('T')[0],
                                            }));
                                        }
                                    }}
                                />
                            )}
                        </View>

                        {/* Assign To */}
                        <View style={modalForm.group}>
                            <TouchableOpacity
                                style={[s.accordionHeader, { borderColor: colors.border }]}
                                onPress={() => toggle('assignTo')}
                            >
                                <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Assign To *</Text>
                                <View style={s.accordionRight}>
                                    <Text allowFontScaling={false} style={[s.accordionValue, { color: colors.text }]}>{assignToLabel}</Text>
                                    <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('assignTo')} />
                                </View>
                            </TouchableOpacity>
                            {openDropdown === 'assignTo' && (
                                <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                    {(['class', 'students'] as const).map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[s.option, { borderBottomColor: colors.border }]}
                                            onPress={() => {
                                                setNewAssignment((p: any) => ({ ...p, assignTo: opt, student_ids: [] }));
                                                setOpenDropdown(null);
                                                if (opt === 'students' && newAssignment.class_id && newAssignment.subject_id) {
                                                    setLoadingStudents(true);
                                                    fetchStudents(newAssignment.class_id, newAssignment.subject_id)
                                                        .finally(() => setLoadingStudents(false));
                                                }
                                            }}
                                        >
                                            <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>
                                                {opt === 'class' ? 'Whole Class' : 'Specific Students'}
                                            </Text>
                                            {newAssignment.assignTo === opt && <Check size={16} color={colors.primary} />}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Select Class */}
                        <View style={modalForm.group}>
                            {classes.length === 0 ? (
                                <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>No classes available</Text>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[s.accordionHeader, { borderColor: colors.border }]}
                                        onPress={() => toggle('class')}
                                    >
                                        <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Class *</Text>
                                        <View style={s.accordionRight}>
                                            <Text allowFontScaling={false} style={[s.accordionValue, { color: newAssignment.class_id ? colors.text : colors.textSecondary }]}>
                                                {selectedClassName}
                                            </Text>
                                            <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('class')} />
                                        </View>
                                    </TouchableOpacity>
                                    {openDropdown === 'class' && (
                                        <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={s.dropdownScroll}>
                                                {classes.map((cls) => (
                                                    <TouchableOpacity
                                                        key={cls.id}
                                                        style={[s.option, { borderBottomColor: colors.border }]}
                                                        onPress={() => handleClassSelect(cls.id)}
                                                    >
                                                        <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{cls.name}</Text>
                                                        {newAssignment.class_id === cls.id && <Check size={16} color={colors.primary} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>

                        {/* Select Subject */}
                        {newAssignment.class_id ? (
                            <View style={modalForm.group}>
                                {subjects.length === 0 ? (
                                    <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>No subjects for this class</Text>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[s.accordionHeader, { borderColor: colors.border }]}
                                            onPress={() => toggle('subject')}
                                        >
                                            <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Subject</Text>
                                            <View style={s.accordionRight}>
                                                <Text allowFontScaling={false} style={[s.accordionValue, { color: newAssignment.subject_id ? colors.text : colors.textSecondary }]}>
                                                    {selectedSubjectName}
                                                </Text>
                                                <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('subject')} />
                                            </View>
                                        </TouchableOpacity>
                                        {openDropdown === 'subject' && (
                                            <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={s.dropdownScroll}>
                                                    {subjects.map((sub) => (
                                                        <TouchableOpacity
                                                            key={sub.id}
                                                            style={[s.option, { borderBottomColor: colors.border }]}
                                                            onPress={() => handleSubjectSelect(sub.id)}
                                                        >
                                                            <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{sub.name}</Text>
                                                            {newAssignment.subject_id === sub.id && <Check size={16} color={colors.primary} />}
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        ) : null}

                        {/* Select Students */}
                        {newAssignment.assignTo === 'students' && newAssignment.class_id ? (
                            <View style={modalForm.group}>
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
                                            style={[s.accordionHeader, { borderColor: colors.border }]}
                                            onPress={() => toggle('students')}
                                        >
                                            <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Students *</Text>
                                            <View style={s.accordionRight}>
                                                <Text allowFontScaling={false} style={[s.accordionValue, { color: (newAssignment.student_ids?.length ?? 0) > 0 ? colors.text : colors.textSecondary }]}>
                                                    {studentsLabel}
                                                </Text>
                                                <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('students')} />
                                            </View>
                                        </TouchableOpacity>
                                        {openDropdown === 'students' && (
                                            <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={s.dropdownScroll}>
                                                    {students.map((st) => {
                                                        const selected = (newAssignment.student_ids || []).includes(st.id);
                                                        return (
                                                            <TouchableOpacity
                                                                key={st.id}
                                                                style={[s.option, { borderBottomColor: colors.border }]}
                                                                onPress={() => toggleStudent(st.id)}
                                                            >
                                                                <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{st.full_name}</Text>
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

                        {/* Attachment — optional */}
                        <View style={modalForm.group}>
                            <TouchableOpacity
                                style={[s.accordionHeader, { borderColor: colors.border }]}
                                onPress={pickDocument}
                                disabled={uploading}
                            >
                                <View style={s.attachLeft}>
                                    <Upload size={16} color={colors.primary} />
                                    <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary, marginLeft: 8 }]}>
                                        Attachment (Optional)
                                    </Text>
                                </View>
                                <Text
                                    allowFontScaling={false}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={[s.accordionValue, { color: newAssignment.file ? colors.text : colors.textSecondary, maxWidth: '45%' }]}
                                >
                                    {newAssignment.file ? newAssignment.file.name : 'No file'}
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
                            style={[
                                modalForm.submitBtn,
                                { backgroundColor: colors.primary },
                                (!isFormValid || isSubmitting || uploading) && { opacity: 0.4 },
                            ]}
                            onPress={handleSubmit}
                            disabled={!isFormValid || isSubmitting || uploading}
                        >
                            <Text allowFontScaling={false} style={modalForm.submitText}>
                                {isSubmitting || uploading ? 'Creating...' : 'Create Assignment'}
                            </Text>
                        </TouchableOpacity>

                    </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const s = StyleSheet.create({
    // Matches DiaryScreen filter accordion exactly
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    accordionLabel: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        flex: 1,
    },
    accordionValue: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-SemiBold',
    },
    accordionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accordionBody: {
        marginTop: 6,
        borderRadius: 10,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    optionText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    attachLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    removeFile: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginTop: 6,
    },
});
