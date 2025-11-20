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
} from 'react-native';
import { X, Upload, Youtube, Users, User } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { lectureService } from '@/src/services/lecture.service';
import { LectureFormData, Class, Subject, Student } from '@/src/types/lectures';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import {
    handleClassFetchErrorForLectures,
    handleSubjectFetchErrorForLectures,
    handleStudentFetchErrorForLectures,
    handleFilePickError,
    handleLectureUploadError
} from '@/src/utils/errorHandler/lectureErrorHandler';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';
import { TextSizes } from '@/src/styles/TextSizes';


interface UploadLectureModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UploadLectureModal({
    visible,
    onClose,
    onSuccess
}: UploadLectureModalProps) {

    const { colors } = useTheme();
    const { profile } = useAuth();

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
    const [isUploading, setIsUploading] = useState(false);

    const [errorModal, setErrorModal] = useState({
        visible: false,
        title: '',
        message: '',
    });

    const showError = (error: any, handler?: (error: any) => any) => {
        const errorInfo = handler ? handler(error) : handleError(error);
        setErrorModal({
            visible: true,
            title: errorInfo.title,
            message: errorInfo.message,
        });
    };

    /* ------------------------------------------
     * RESET FORM
     -------------------------------------------*/
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

    /* ------------------------------------------
     * FILE PICKER
     -------------------------------------------*/
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

    /* ------------------------------------------
     * YOUTUBE VALIDATION
     -------------------------------------------*/
    const validateYouTubeLink = (link: string) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return !link || youtubeRegex.test(link);
    };

    /* ------------------------------------------
     * UPLOAD HANDLER
     -------------------------------------------*/
    const handleUpload = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        if (!formData.class_id) {
            Alert.alert('Error', 'Please select a class');
            return;
        }
        if (!formData.subject_id) {
            Alert.alert('Error', 'Please select a subject');
            return;
        }
        if (!formData.file) {
            Alert.alert('Error', 'Please select a file');
            return;
        }
        if (formData.youtube_link && !validateYouTubeLink(formData.youtube_link)) {
            Alert.alert('Error', 'Please enter a valid YouTube link');
            return;
        }
        if (formData.access_type === 'individual' && formData.selected_students.length === 0) {
            Alert.alert('Error', 'Please select at least one student');
            return;
        }

        setIsUploading(true);
        try {
            await lectureService.uploadLecture(formData, profile!.id);
            Alert.alert('Success', 'Lecture uploaded successfully', [
                { text: 'OK', onPress: () => { onSuccess(); onClose(); } }
            ]);
        } catch (error: any) {
            Alert.alert('Upload Failed', error.message || 'Failed to upload lecture');
        } finally {
            setIsUploading(false);
        }
    };

    /* ------------------------------------------
     * STUDENT TOGGLE
     -------------------------------------------*/
    const toggleStudent = (studentId: string) => {
        setFormData(prev => ({
            ...prev,
            selected_students: prev.selected_students.includes(studentId)
                ? prev.selected_students.filter(id => id !== studentId)
                : [...prev.selected_students, studentId]
        }));
    };

    /* ------------------------------------------
     * LOAD STUDENTS FOR SUBJECT
     -------------------------------------------*/
    const loadStudentsForSubject = async (classId: string, subjectId: string) => {
        try {
            const studentsData = await lectureService.fetchClassStudents(classId, subjectId);
            setStudents(studentsData);
        } catch (err) {
            console.warn("Error fetching students:", err);
            showError(err, handleStudentFetchErrorForLectures);
        }
    };

    /* ------------------------------------------
     * LOAD CLASSES
     -------------------------------------------*/
    const loadClasses = async () => {
        try {
            const data = await lectureService.fetchClasses(profile.id, profile?.role);
            setClasses(data);

            if (data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    class_id: data[0].id,
                    subject_id: ''
                }));
            }
        } catch (error) {
            showError(error, handleClassFetchErrorForLectures);
        }
    };

    /* ------------------------------------------
     * LOAD SUBJECTS + OPTIONAL STUDENTS
     -------------------------------------------*/
    const loadClassData = async (classId: string) => {
        try {
            let subjectsData = [];
            let studentsData = [];

            try {
                subjectsData = await lectureService.fetchClassSubjects(classId, profile?.id, profile?.role);
            } catch (err) {
                showError(err, handleSubjectFetchErrorForLectures);
            }

            if (formData.subject_id) {
                try {
                    studentsData = await lectureService.fetchClassStudents(classId, formData.subject_id);
                } catch (err) {
                    console.warn("Error fetching students:", err);
                }
            }

            setSubjects(subjectsData);
            setStudents(studentsData);

            if (subjectsData.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    subject_id: subjectsData[0].id
                }));
            }
        } catch (err) {
            console.warn("Error fetching students:", err);
            showError(err, handleStudentFetchErrorForLectures);
        }
    };

    /* ------------------------------------------
     * EFFECT: WHEN MODAL OPENS
     -------------------------------------------*/
    useEffect(() => {
        if (visible && profile) {
            loadClasses();
        } else {
            resetForm();
        }
    }, [visible, profile]);

    /* ------------------------------------------
     * EFFECT: WHEN CLASS CHANGES
     -------------------------------------------*/
    useEffect(() => {
        if (formData.class_id) {
            loadClassData(formData.class_id);
        }
    }, [formData.class_id]);

    /* ------------------------------------------
     * EFFECT: WHEN SUBJECT CHANGES → LOAD STUDENTS
     -------------------------------------------*/
    useEffect(() => {
        if (formData.class_id && formData.subject_id) {
            loadStudentsForSubject(formData.class_id, formData.subject_id);
        }
    }, [formData.subject_id]);

    /* ------------------------------------------
     * UI RETURN
     -------------------------------------------*/
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent={true}
            presentationStyle="overFullScreen">
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.background }]}>

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>Upload Lecture</Text>
                        <TouchableOpacity onPress={onClose} disabled={isUploading}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

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
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Select Class *</Text>
                            <View style={styles.options}>
                                {classes.map(cls => (
                                    <TouchableOpacity
                                        key={cls.id}
                                        style={[
                                            styles.option,
                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                            formData.class_id === cls.id && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setFormData(prev => ({ ...prev, class_id: cls.id, subject_id: '' }))}
                                    >
                                        <Text allowFontScaling={false} style={[
                                            styles.optionText,
                                            { color: colors.text },
                                            formData.class_id === cls.id && { color: 'white' }
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
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Select Subject *</Text>
                                <View style={styles.options}>
                                    {subjects.map(subject => (
                                        <TouchableOpacity
                                            key={subject.id}
                                            style={[
                                                styles.option,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                formData.subject_id === subject.id && { backgroundColor: colors.primary }
                                            ]}
                                            onPress={() => setFormData(prev => ({ ...prev, subject_id: subject.id }))}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.optionText,
                                                { color: colors.text },
                                                formData.subject_id === subject.id && { color: 'white' }
                                            ]}>
                                                {subject.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Students (Only if access type individual) */}
                        {formData.access_type === 'individual' && students.length > 0 && (
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
                                                    borderColor: colors.primary
                                                }
                                            ]}
                                            onPress={() => toggleStudent(student.user_id)}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.studentName,
                                                { color: colors.text }
                                            ]}>
                                                {student.profiles?.full_name || `Roll: ${student.roll_number}`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* File Picker */}
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

                        {/* Upload Button */}
                        <TouchableOpacity
                            style={[
                                styles.uploadButton,
                                { backgroundColor: isUploading ? colors.textSecondary : colors.primary }
                            ]}
                            onPress={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Upload size={20} color="white" />
                                    <Text allowFontScaling={false} style={styles.uploadButtonText}>Upload Lecture</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '65%',
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
        fontSize: TextSizes.medium,
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
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        gap: 6,
        marginTop: 10,
        marginBottom: 40,
    },
    uploadButtonText: {
        color: 'white',
        fontSize: TextSizes.buttonText,
        fontFamily: 'Inter-SemiBold',
    },
});
