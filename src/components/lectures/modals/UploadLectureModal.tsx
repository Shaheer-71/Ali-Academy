// src/components/lectures/UploadLectureModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    Platform,
    Dimensions,
} from 'react-native';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;
import { X, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { lectureService } from '@/src/services/lecture.service';
import { Lecture, LectureFormData, Class, Subject } from '@/src/types/lectures';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import {
    handleClassFetchErrorForLectures,
    handleSubjectFetchErrorForLectures,
    handleFilePickError,
    handleLectureUploadError,
    handleLectureUpdateError,
} from '@/src/utils/errorHandler/lectureErrorHandler';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';
import { TextSizes } from '@/src/styles/TextSizes';
import { modalShell, modalForm } from '@/src/styles/creationModalStyles';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submittingRef = useRef(false);

    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
    const [keyboardHeight, setKeyboardHeight] = useState(0);

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

    const showError = (error: any, handler?: (error: any) => any) => {
        const info = handler ? handler(error) : handleError(error);
        setErrorModal({ visible: true, title: info.title, message: info.message });
    };

    /* ── Derived ──────────────────────────────────────────────────────────── */
    const isFormValid = isEditMode
        ? formData.title.trim() !== '' && formData.description.trim() !== ''
        : formData.title.trim() !== '' && formData.description.trim() !== '' && !!formData.class_id && !!formData.subject_id;

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
        if (submittingRef.current || !isFormValid) return;

        if (formData.youtube_link && !validateYouTubeLink(formData.youtube_link)) {
            showError({ message: 'Please enter a valid YouTube link' });
            return;
        }

        submittingRef.current = true;
        setIsSubmitting(true);

        try {
            if (isEditMode) {
                await lectureService.updateLecture(editLecture!.id, {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    youtube_link: formData.youtube_link.trim(),
                });
            } else {
                await lectureService.uploadLecture(formData, profile!.id);
            }
            onSuccess();
            onClose();
        } catch (error) {
            showError(error, isEditMode ? handleLectureUpdateError : handleLectureUploadError);
        } finally {
            submittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    /* ── Load helpers ─────────────────────────────────────────────────────── */
    const loadClasses = async () => {
        try {
            const data = await lectureService.fetchClasses(profile!.id, profile?.role);
            setClasses(data);
        } catch (error) {
            showError(error, handleClassFetchErrorForLectures);
        }
    };

    const loadClassData = async (classId: string) => {
        try {
            const data = await lectureService.fetchClassSubjects(classId, profile?.id, profile?.role);
            setSubjects(data);
        } catch (err) {
            showError(err, handleSubjectFetchErrorForLectures);
            setSubjects([]);
        }
    };

    const handleClassSelect = (classId: string) => {
        setFormData(prev => ({ ...prev, class_id: classId, subject_id: '' }));
        setSubjects([]);
        loadClassData(classId);
    };

    const handleSubjectSelect = (subjectId: string) => {
        setFormData(prev => ({ ...prev, subject_id: subjectId }));
    };

    /* ── Effects ──────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (visible && profile) {
            if (isEditMode && editLecture) {
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

    /* ── UI ───────────────────────────────────────────────────────────────── */
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            presentationStyle="overFullScreen"
        >
            <TouchableWithoutFeedback onPress={isSubmitting ? undefined : onClose}>
                <View style={modalShell.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={[modalShell.sheet, { backgroundColor: colors.background, height: SHEET_HEIGHT }]}>

                            {/* Header */}
                            <View style={[modalShell.header, { borderBottomColor: colors.border }]}>
                                <Text allowFontScaling={false} style={[modalShell.title, { color: colors.text }]}>
                                    {isEditMode ? 'Edit Lecture' : 'Upload Lecture'}
                                </Text>
                                <TouchableOpacity style={modalShell.closeBtn} onPress={onClose} disabled={isSubmitting}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={[modalShell.scroll, { flex: 1 }]}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={[modalShell.scrollContent, { paddingBottom: keyboardHeight + 24 }]}
                            >
                                <ErrorModal
                                    visible={errorModal.visible}
                                    title={errorModal.title}
                                    message={errorModal.message}
                                    onClose={() => setErrorModal({ ...errorModal, visible: false })}
                                />

                                {/* Title */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Title *</Text>
                                    <TextInput
                                        style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Enter lecture title"
                                        placeholderTextColor={colors.textSecondary}
                                        value={formData.title}
                                        onChangeText={t => setFormData(prev => ({ ...prev, title: t }))}
                                    />
                                </View>

                                {/* Description */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Description *</Text>
                                    <TextInput
                                        style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Enter lecture description"
                                        placeholderTextColor={colors.textSecondary}
                                        value={formData.description}
                                        onChangeText={t => setFormData(prev => ({ ...prev, description: t }))}
                                        multiline
                                        numberOfLines={4}
                                    />
                                </View>

                                {/* Class */}
                                {!isEditMode && (
                                    <View style={modalForm.group}>
                                        <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Class *</Text>
                                        {classes.length === 0 ? (
                                            <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>No classes available</Text>
                                        ) : (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                <View style={modalForm.chipRow}>
                                                    {classes.map(cls => (
                                                        <TouchableOpacity
                                                            key={cls.id}
                                                            style={[
                                                                modalForm.chip,
                                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                                formData.class_id === cls.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                            ]}
                                                            onPress={() => handleClassSelect(cls.id)}
                                                        >
                                                            <Text allowFontScaling={false} style={[
                                                                modalForm.chipText,
                                                                { color: colors.text },
                                                                formData.class_id === cls.id && { color: '#ffffff' },
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

                                {/* Subject */}
                                {!isEditMode && (
                                    <View style={modalForm.group}>
                                        <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Subject *</Text>
                                        {!formData.class_id ? (
                                            <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>Select a class first</Text>
                                        ) : subjects.length === 0 ? (
                                            <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>No subjects for this class</Text>
                                        ) : (
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                <View style={modalForm.chipRow}>
                                                    {subjects.map(sub => (
                                                        <TouchableOpacity
                                                            key={sub.id}
                                                            style={[
                                                                modalForm.chip,
                                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                                formData.subject_id === sub.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                            ]}
                                                            onPress={() => handleSubjectSelect(sub.id)}
                                                        >
                                                            <Text allowFontScaling={false} style={[
                                                                modalForm.chipText,
                                                                { color: colors.text },
                                                                formData.subject_id === sub.id && { color: '#ffffff' },
                                                            ]}>
                                                                {sub.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                            </ScrollView>
                                        )}
                                    </View>
                                )}

                                {/* Edit mode: show class & subject as read-only */}
                                {isEditMode && (
                                    <View style={[modalForm.infoBox, { backgroundColor: colors.cardBackground }]}>
                                        <Text allowFontScaling={false} style={[modalForm.infoText, { color: colors.textSecondary }]}>
                                            Class, subject, and file cannot be changed after uploading.
                                        </Text>
                                    </View>
                                )}

                                {/* YouTube Link */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>YouTube Link (Optional)</Text>
                                    <TextInput
                                        style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="https://youtube.com/watch?v=..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={formData.youtube_link}
                                        onChangeText={t => setFormData(prev => ({ ...prev, youtube_link: t }))}
                                        autoCapitalize="none"
                                        keyboardType="url"
                                    />
                                </View>

                                {/* File — create mode only */}
                                {!isEditMode && (
                                    <View style={modalForm.group}>
                                        <TouchableOpacity
                                            style={[s.accordionHeader, { borderColor: colors.border }]}
                                            onPress={pickFile}
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
                                                style={[s.accordionValue, { color: formData.file ? colors.text : colors.textSecondary, maxWidth: '45%' }]}
                                            >
                                                {formData.file ? formData.file.name : 'No file'}
                                            </Text>
                                        </TouchableOpacity>
                                        {formData.file && (
                                            <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, file: null }))}>
                                                <Text allowFontScaling={false} style={[s.removeFile, { color: '#EF4444' }]}>Remove file</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* Submit */}
                                <TouchableOpacity
                                    style={[
                                        modalForm.submitBtn,
                                        { backgroundColor: colors.primary },
                                        (!isFormValid || isSubmitting) && { opacity: 0.4 },
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={!isFormValid || isSubmitting}
                                >
                                    {isSubmitting
                                        ? <ActivityIndicator size="small" color="white" />
                                        : <Text allowFontScaling={false} style={modalForm.submitText}>
                                            {isEditMode ? 'Update Lecture' : 'Upload Lecture'}
                                          </Text>
                                    }
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const s = StyleSheet.create({
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
