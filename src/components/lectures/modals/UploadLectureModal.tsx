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
    Dimensions,
} from 'react-native';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;

import { X, Upload, ChevronRight, Check } from 'lucide-react-native';
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

type DropdownKey = 'class' | 'subject' | null;

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
    const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
    const toggle = (key: DropdownKey) => setOpenDropdown(prev => prev === key ? null : key);
    const chevronStyle = (key: DropdownKey) => ({
        marginLeft: 6,
        transform: [{ rotate: openDropdown === key ? '270deg' : '90deg' }] as any,
    });

    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

    const showError = (error: any, handler?: (error: any) => any) => {
        const info = handler ? handler(error) : handleError(error);
        setErrorModal({ visible: true, title: info.title, message: info.message });
    };

    const selectedClassName = formData.class_id
        ? classes.find(c => c.id === formData.class_id)?.name ?? 'Select class'
        : 'Select class';

    const selectedSubjectName = formData.subject_id
        ? subjects.find(s => s.id === formData.subject_id)?.name ?? 'Select subject'
        : 'Select subject';

    const isFormValid = isEditMode
        ? formData.title.trim() !== '' && formData.description.trim() !== ''
        : formData.title.trim() !== '' && formData.description.trim() !== '' && !!formData.class_id && !!formData.subject_id;

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
        setOpenDropdown(null);
    };

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

    const validateYouTubeLink = (link: string) => {
        const re = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return !link || re.test(link);
    };

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
        setOpenDropdown(null);
        loadClassData(classId);
    };

    const handleSubjectSelect = (subjectId: string) => {
        setFormData(prev => ({ ...prev, subject_id: subjectId }));
        setOpenDropdown(null);
    };

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

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            presentationStyle="overFullScreen"
        >
            <ErrorModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() => setErrorModal({ ...errorModal, visible: false })}
            />

            <View style={s.root}>
                <TouchableWithoutFeedback onPress={isSubmitting ? undefined : onClose}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>

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
                        style={modalShell.scroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        automaticallyAdjustKeyboardInsets
                        contentContainerStyle={modalShell.scrollContent}
                    >
                        {/* Title */}
                        <View style={modalForm.group}>
                            <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Title *</Text>
                            <TextInput
                                style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                placeholder="Enter lecture title"
                                placeholderTextColor={colors.textSecondary}
                                value={formData.title}
                                onChangeText={t => setFormData(prev => ({ ...prev, title: t }))}
                                allowFontScaling={false}
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
                                numberOfLines={3}
                                allowFontScaling={false}
                            />
                        </View>

                        {/* Class — create mode only */}
                        {!isEditMode && (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Class *</Text>
                                <TouchableOpacity
                                    style={[s.accordionHeader, { borderColor: colors.border }]}
                                    onPress={() => toggle('class')}
                                >
                                    <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Class</Text>
                                    <View style={s.accordionRight}>
                                        <Text allowFontScaling={false} style={[s.accordionValue, { color: formData.class_id ? colors.text : colors.textSecondary }]}>
                                            {selectedClassName}
                                        </Text>
                                        <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('class')} />
                                    </View>
                                </TouchableOpacity>
                                {openDropdown === 'class' && (
                                    <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={s.dropdownScroll}>
                                            {classes.length === 0 ? (
                                                <View style={s.option}>
                                                    <Text allowFontScaling={false} style={[s.optionText, { color: colors.textSecondary }]}>No classes available</Text>
                                                </View>
                                            ) : classes.map(cls => (
                                                <TouchableOpacity
                                                    key={cls.id}
                                                    style={[s.option, { borderBottomColor: colors.border }]}
                                                    onPress={() => handleClassSelect(cls.id)}
                                                >
                                                    <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{cls.name}</Text>
                                                    {formData.class_id === cls.id && <Check size={16} color={colors.primary} />}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Subject — create mode only */}
                        {!isEditMode && (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Subject *</Text>
                                <TouchableOpacity
                                    style={[s.accordionHeader, { borderColor: colors.border }, !formData.class_id && s.accordionDisabled]}
                                    onPress={() => formData.class_id && toggle('subject')}
                                    disabled={!formData.class_id}
                                >
                                    <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Subject</Text>
                                    <View style={s.accordionRight}>
                                        <Text allowFontScaling={false} style={[s.accordionValue, { color: formData.subject_id ? colors.text : colors.textSecondary }]}>
                                            {!formData.class_id ? 'Select class first' : selectedSubjectName}
                                        </Text>
                                        <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('subject')} />
                                    </View>
                                </TouchableOpacity>
                                {openDropdown === 'subject' && subjects.length > 0 && (
                                    <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={s.dropdownScroll}>
                                            {subjects.map(sub => (
                                                <TouchableOpacity
                                                    key={sub.id}
                                                    style={[s.option, { borderBottomColor: colors.border }]}
                                                    onPress={() => handleSubjectSelect(sub.id)}
                                                >
                                                    <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{sub.name}</Text>
                                                    {formData.subject_id === sub.id && <Check size={16} color={colors.primary} />}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Edit mode info */}
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
                                allowFontScaling={false}
                            />
                        </View>

                        {/* File picker — create mode only */}
                        {!isEditMode && (
                            <View style={modalForm.group}>
                                <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Attachment (Optional)</Text>
                                <TouchableOpacity
                                    style={[s.accordionHeader, { borderColor: formData.file ? colors.primary : colors.border }]}
                                    onPress={pickFile}
                                >
                                    <Upload size={15} color={formData.file ? colors.primary : colors.textSecondary} />
                                    <Text
                                        allowFontScaling={false}
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        style={[s.fileText, { color: formData.file ? colors.text : colors.textSecondary }]}
                                    >
                                        {formData.file ? formData.file.name : 'Tap to choose a file'}
                                    </Text>
                                    {formData.file && (
                                        <TouchableOpacity
                                            onPress={e => { e.stopPropagation?.(); setFormData(prev => ({ ...prev, file: null })); }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <X size={15} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
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
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        gap: 8,
    },
    accordionDisabled: {
        opacity: 0.5,
    },
    accordionLabel: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        flex: 1,
    },
    accordionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accordionValue: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-SemiBold',
    },
    accordionBody: {
        marginTop: 6,
        borderRadius: 10,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 180,
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
    fileText: {
        flex: 1,
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
    },
});
