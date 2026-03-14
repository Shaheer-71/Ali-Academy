// src/components/lectures/UploadLectureModal.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { X, Upload, Youtube } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { lectureService } from '@/src/services/lecture.service';
import { Lecture, LectureFormData, Class, Subject, Student } from '@/src/types/lectures';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import {
    handleClassFetchErrorForLectures,
    handleSubjectFetchErrorForLectures,
    handleStudentFetchErrorForLectures,
    handleFilePickError,
    handleLectureUploadError,
    handleLectureUpdateError,
} from '@/src/utils/errorHandler/lectureErrorHandler';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';
import { TextSizes } from '@/src/styles/TextSizes';

interface UploadLectureModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editLecture?: Lecture | null;
}

export default function UploadLectureModal({
    visible,
    onClose,
    onSuccess,
    editLecture,
}: UploadLectureModalProps) {
    const { colors } = useTheme();
    const { profile } = useAuth();

    const isEditMode = !!editLecture;

    const [formData, setFormData] = useState<LectureFormData>({
        title: '',
        description: '',
        file: null,
        youtube_link: '',
        class_id: '',
        subject_id: '',
        access_type: 'class',
        selected_students: [],
    });

    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

    const showError = (error: any, handler?: (error: any) => any) => {
        const info = handler ? handler(error) : handleError(error);
        setErrorModal({ visible: true, title: info.title, message: info.message });
    };

    /* ── Reset ────────────────────────────────────────────────────────────── */
    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            file: null,
            youtube_link: '',
            class_id: '',
            subject_id: '',
            access_type: 'class',
            selected_students: [],
        });
        setSubjects([]);
        setStudents([]);
    };

    /* ── File picker ──────────────────────────────────────────────────────── */
    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'video/*', 'image/*'],
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets[0]) {
                const file = result.assets[0];
                if (file.size && file.size > 50 * 1024 * 1024) {
                    showError({ message: 'File size must be less than 50MB' });
                    return;
                }
                setFormData(prev => ({ ...prev, file }));
            }
        } catch (error) {
            showError(error, handleFilePickError);
        }
    };

    /* ── YouTube validation ────────────────────────────────────────────────── */
    const validateYouTubeLink = (link: string) => {
        const re = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return !link || re.test(link);
    };

    /* ── Submit ───────────────────────────────────────────────────────────── */
    const handleSubmit = async () => {
        if (!formData.title.trim()) { Alert.alert('Error', 'Please enter a title'); return; }
        if (formData.youtube_link && !validateYouTubeLink(formData.youtube_link)) {
            Alert.alert('Error', 'Please enter a valid YouTube link'); return;
        }

        if (isEditMode) {
            // ── Edit mode ──────────────────────────────────────────────────
            setIsSubmitting(true);
            try {
                await lectureService.updateLecture(editLecture!.id, {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    youtube_link: formData.youtube_link.trim(),
                });
                Alert.alert('Success', 'Lecture updated successfully', [
                    { text: 'OK', onPress: () => { onSuccess(); onClose(); } },
                ]);
            } catch (error) {
                showError(error, handleLectureUpdateError);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // ── Create mode ────────────────────────────────────────────────
            if (!formData.class_id) { Alert.alert('Error', 'Please select a class'); return; }
            if (!formData.subject_id) { Alert.alert('Error', 'Please select a subject'); return; }
            if (!formData.file) { Alert.alert('Error', 'Please select a file'); return; }
            if (formData.access_type === 'individual' && formData.selected_students.length === 0) {
                Alert.alert('Error', 'Please select at least one student'); return;
            }
            setIsSubmitting(true);
            try {
                await lectureService.uploadLecture(formData, profile!.id);
                Alert.alert('Success', 'Lecture uploaded successfully', [
                    { text: 'OK', onPress: () => { onSuccess(); onClose(); } },
                ]);
            } catch (error) {
                showError(error, handleLectureUploadError);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    /* ── Student toggle ───────────────────────────────────────────────────── */
    const toggleStudent = (studentId: string) => {
        setFormData(prev => ({
            ...prev,
            selected_students: prev.selected_students.includes(studentId)
                ? prev.selected_students.filter(id => id !== studentId)
                : [...prev.selected_students, studentId],
        }));
    };

    /* ── Load helpers ─────────────────────────────────────────────────────── */
    const loadStudentsForSubject = async (classId: string, subjectId: string) => {
        try {
            const data = await lectureService.fetchClassStudents(classId, subjectId);
            setStudents(data);
        } catch (err) {
            showError(err, handleStudentFetchErrorForLectures);
        }
    };

    const loadClasses = async () => {
        try {
            const data = await lectureService.fetchClasses(profile!.id, profile?.role);
            setClasses(data);
            if (!isEditMode && data.length > 0) {
                setFormData(prev => ({ ...prev, class_id: data[0].id, subject_id: '' }));
            }
        } catch (error) {
            showError(error, handleClassFetchErrorForLectures);
        }
    };

    const loadClassData = async (classId: string) => {
        try {
            const subjectsData = await lectureService.fetchClassSubjects(classId, profile?.id, profile?.role);
            setSubjects(subjectsData);
            if (!isEditMode && subjectsData.length > 0) {
                setFormData(prev => ({ ...prev, subject_id: subjectsData[0].id }));
            }
        } catch (err) {
            showError(err, handleSubjectFetchErrorForLectures);
            setSubjects([]);
        }
    };

    /* ── Effects ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (visible && profile) {
            if (isEditMode && editLecture) {
                // Pre-populate for edit
                setFormData({
                    title: editLecture.title || '',
                    description: editLecture.description || '',
                    file: null,
                    youtube_link: editLecture.youtube_link || '',
                    class_id: editLecture.class_id || '',
                    subject_id: editLecture.subject_id || '',
                    access_type: 'class',
                    selected_students: [],
                });
                // Load classes/subjects for display (read-only chips)
                loadClasses();
                if (editLecture.class_id) loadClassData(editLecture.class_id);
            } else {
                resetForm();
                loadClasses();
            }
        } else if (!visible) {
            resetForm();
        }
    }, [visible, editLecture]);

    useEffect(() => {
        if (!isEditMode && formData.class_id) {
            loadClassData(formData.class_id);
        }
    }, [formData.class_id]);

    useEffect(() => {
        if (!isEditMode && formData.class_id && formData.subject_id) {
            loadStudentsForSubject(formData.class_id, formData.subject_id);
        }
    }, [formData.subject_id]);

    /* ── UI ───────────────────────────────────────────────────────────────── */
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            presentationStyle="overFullScreen"
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.backdrop} />
                <View style={[styles.modal, { backgroundColor: colors.background }]}>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                            {isEditMode ? 'Edit Lecture' : 'Upload Lecture'}
                        </Text>
                        <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <ErrorModal
                            visible={errorModal.visible}
                            title={errorModal.title}
                            message={errorModal.message}
                            onClose={() => setErrorModal({ ...errorModal, visible: false })}
                        />

                        {/* Title */}
                        <View style={styles.field}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Title *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                                placeholder="Enter lecture title"
                                value={formData.title}
                                onChangeText={text => setFormData(prev => ({ ...prev, title: text }))}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.field}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text }]}
                                placeholder="Enter description (optional)"
                                value={formData.description}
                                onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
                                multiline
                                numberOfLines={3}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* YouTube Link */}
                        <View style={styles.field}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                <Youtube size={16} color={colors.text} /> YouTube Link (Optional)
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                                placeholder="https://youtube.com/watch?v=..."
                                value={formData.youtube_link}
                                onChangeText={text => setFormData(prev => ({ ...prev, youtube_link: text }))}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Class Selection */}
                        <View style={styles.field}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                {isEditMode ? 'Class' : 'Select Class *'}
                            </Text>
                            <View style={styles.options}>
                                {classes.map(cls => (
                                    <TouchableOpacity
                                        key={cls.id}
                                        style={[
                                            styles.option,
                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                            formData.class_id === cls.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                        ]}
                                        onPress={() => {
                                            if (!isEditMode) setFormData(prev => ({ ...prev, class_id: cls.id, subject_id: '' }));
                                        }}
                                        disabled={isEditMode}
                                    >
                                        <Text allowFontScaling={false} style={[
                                            styles.optionText,
                                            { color: formData.class_id === cls.id ? '#fff' : colors.text },
                                        ]}>
                                            {cls.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Subject Selection */}
                        {subjects.length > 0 && (
                            <View style={styles.field}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                    {isEditMode ? 'Subject' : 'Select Subject *'}
                                </Text>
                                <View style={styles.options}>
                                    {subjects.map(subject => (
                                        <TouchableOpacity
                                            key={subject.id}
                                            style={[
                                                styles.option,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                formData.subject_id === subject.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                            ]}
                                            onPress={() => {
                                                if (!isEditMode) setFormData(prev => ({ ...prev, subject_id: subject.id }));
                                            }}
                                            disabled={isEditMode}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.optionText,
                                                { color: formData.subject_id === subject.id ? '#fff' : colors.text },
                                            ]}>
                                                {subject.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Students (create mode only) */}
                        {!isEditMode && formData.access_type === 'individual' && students.length > 0 && (
                            <View style={styles.field}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                    Select Students ({formData.selected_students.length}/{students.length})
                                </Text>
                                <ScrollView style={styles.studentList} nestedScrollEnabled>
                                    {students.map(student => (
                                        <TouchableOpacity
                                            key={student.id}
                                            style={[
                                                styles.student,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                formData.selected_students.includes(student.user_id) && {
                                                    backgroundColor: colors.primary + '20',
                                                    borderColor: colors.primary,
                                                },
                                            ]}
                                            onPress={() => toggleStudent(student.user_id)}
                                        >
                                            <Text allowFontScaling={false} style={[styles.studentName, { color: colors.text }]}>
                                                {student.profiles?.full_name || `Roll: ${student.roll_number}`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* File Picker — create mode only */}
                        {!isEditMode && (
                            <View style={styles.field}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Select File *</Text>
                                <TouchableOpacity
                                    style={[styles.filePicker, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                    onPress={pickFile}
                                >
                                    <Upload size={20} color={colors.primary} />
                                    <Text allowFontScaling={false} style={[styles.fileText, { color: formData.file ? colors.text : colors.textSecondary }]}>
                                        {formData.file ? formData.file.name : 'Tap to select file (PDF, Image, Video)'}
                                    </Text>
                                </TouchableOpacity>
                                {formData.file && (
                                    <Text allowFontScaling={false} style={[styles.fileSize, { color: colors.textSecondary }]}>
                                        Size: {((formData.file.size || 0) / (1024 * 1024)).toFixed(1)} MB
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Edit mode note */}
                        {isEditMode && (
                            <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
                                <Text allowFontScaling={false} style={[styles.infoText, { color: colors.textSecondary }]}>
                                    Class, subject, and file cannot be changed after uploading.
                                </Text>
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: isSubmitting ? colors.textSecondary : colors.primary }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Upload size={20} color="white" />
                                    <Text allowFontScaling={false} style={styles.submitButtonText}>
                                        {isEditMode ? 'Update Lecture' : 'Upload Lecture'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        flex: 1,
    },
    modal: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '75%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: TextSizes.modalTitle,
        fontFamily: 'Inter-SemiBold',
    },
    content: {
        padding: 20,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        fontSize: TextSizes.modalText,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    input: {
        borderRadius: 8,
        padding: 12,
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    option: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
    },
    optionText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
    studentList: {
        maxHeight: 150,
    },
    student: {
        padding: 8,
        marginBottom: 4,
        borderRadius: 6,
        borderWidth: 1,
    },
    studentName: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    filePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    fileText: {
        flex: 1,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
    fileSize: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
    },
    infoBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    infoText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 6,
        marginTop: 6,
        marginBottom: 24,
    },
    submitButtonText: {
        color: 'white',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },
});
