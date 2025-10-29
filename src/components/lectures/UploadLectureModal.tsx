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


    useEffect(() => {
        if (visible && profile) {
            loadClasses();
        } else {
            resetForm();
        }
    }, [visible, profile]);

    useEffect(() => {
        if (formData.class_id) {
            loadClassData(formData.class_id);
        }
    }, [formData.class_id]);

    const loadClasses = async () => {
        try {
            const data = await lectureService.fetchClasses(
                profile?.role === 'teacher' ? profile.id : undefined
            );

            setClasses(data);

            if (data.length > 0) {
                // 👇 Automatically set first class as default
                setFormData(prev => ({
                    ...prev,
                    class_id: data[0].id,
                    subject_id: '' // reset subject, will be filled after subjects load
                }));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load classes');
        }
    };


    const loadClassData = async (classId: string) => {
        try {
            let subjectsData = [];
            let studentsData = [];

            try {
                subjectsData = await lectureService.fetchClassSubjects(classId);
            } catch (err) {
                console.error("Error fetching subjects:", err);
            }

            try {
                studentsData = await lectureService.fetchClassStudents(classId);
            } catch (err) {
                console.error("Error fetching students:", err);
            }


            setSubjects(subjectsData);
            setStudents(studentsData);

            if (subjectsData.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    subject_id: subjectsData[0].id
                }));
            }
        } catch (error) {
            console.error("Unexpected error in loadClassData:", error);
            Alert.alert('Error', 'Failed to load class data');
        }
    };


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

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'video/*', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                const file = result.assets[0];

                if (file.size && file.size > 50 * 1024 * 1024) {
                    Alert.alert('Error', 'File size must be less than 50MB');
                    return;
                }

                setFormData(prev => ({ ...prev, file }));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const validateYouTubeLink = (link: string) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return !link || youtubeRegex.test(link);
    };

    const handleUpload = async () => {
        // Validation
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

    const toggleStudent = (studentId: string) => {
        setFormData(prev => ({
            ...prev,
            selected_students: prev.selected_students.includes(studentId)
                ? prev.selected_students.filter(id => id !== studentId)
                : [...prev.selected_students, studentId]
        }));
    };

    useEffect(() => {
        // console.log("Subjects state updated:", subjects);
    }, [subjects]);


    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Upload Lecture</Text>
                        <TouchableOpacity onPress={onClose} disabled={isUploading}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Title */}
                        <View style={styles.field}>
                            <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
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
                            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
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
                            <Text style={[styles.label, { color: colors.text }]}>
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
                            <Text style={[styles.label, { color: colors.text }]}>Select Class *</Text>
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
                                        <Text style={[
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
                                <Text style={[styles.label, { color: colors.text }]}>Select Subject *</Text>
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
                                            <Text style={[
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

                        {/* Access Type */}
                        {students.length > 0 && (
                            <View style={styles.field}>
                                <Text style={[styles.label, { color: colors.text }]}>Access Type *</Text>
                                <View style={styles.accessTypes}>
                                    <TouchableOpacity
                                        style={[
                                            styles.accessType,
                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                            formData.access_type === 'class' && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setFormData(prev => ({ ...prev, access_type: 'class', selected_students: [] }))}
                                    >
                                        <Users size={18} color={formData.access_type === 'class' ? 'white' : colors.text} />
                                        <Text style={[
                                            styles.accessTypeText,
                                            { color: colors.text },
                                            formData.access_type === 'class' && { color: 'white' }
                                        ]}>
                                            Entire Class
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.accessType,
                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                            formData.access_type === 'individual' && { backgroundColor: colors.primary }
                                        ]}
                                        onPress={() => setFormData(prev => ({ ...prev, access_type: 'individual' }))}
                                    >
                                        <User size={18} color={formData.access_type === 'individual' ? 'white' : colors.text} />
                                        <Text style={[
                                            styles.accessTypeText,
                                            { color: colors.text },
                                            formData.access_type === 'individual' && { color: 'white' }
                                        ]}>
                                            Specific Students
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Student Selection */}
                        {formData.access_type === 'individual' && students.length > 0 && (
                            <View style={styles.field}>
                                <Text style={[styles.label, { color: colors.text }]}>
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
                                            <Text style={[
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
                            <Text style={[styles.label, { color: colors.text }]}>Select File *</Text>
                            <TouchableOpacity
                                style={[styles.filePicker, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                onPress={pickFile}
                            >
                                <Upload size={20} color={colors.primary} />
                                <Text style={[styles.fileText, { color: formData.file ? colors.text : colors.textSecondary }]}>
                                    {formData.file ? formData.file.name : 'Tap to select file (PDF, Image, Video)'}
                                </Text>
                            </TouchableOpacity>
                            {formData.file && (
                                <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
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
                                    <Text style={styles.uploadButtonText}>Upload Lecture</Text>
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
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    textArea: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    option: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
    },
    optionText: {
        fontSize: 13,
        fontWeight: '500',
    },
    accessTypes: {
        flexDirection: 'row',
        gap: 10,
    },
    accessType: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
    },
    accessTypeText: {
        fontSize: 13,
        fontWeight: '500',
    },
    studentList: {
        maxHeight: 150,
    },
    student: {
        padding: 10,
        marginBottom: 6,
        borderRadius: 6,
        borderWidth: 1,
    },
    studentName: {
        fontSize: 13,
    },
    filePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        gap: 10,
    },
    fileText: {
        flex: 1,
        fontSize: 13,
    },
    fileSize: {
        fontSize: 11,
        marginTop: 4,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 10,
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
});