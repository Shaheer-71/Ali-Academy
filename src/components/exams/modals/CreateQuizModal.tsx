import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;

import { X, ChevronRight, Check } from 'lucide-react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { sendPushNotification } from '@/src/lib/notifications';
import { useDialog } from '@/src/contexts/DialogContext';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { handleQuizCreationError, handleSubjectFetchForClassError } from '@/src/utils/errorHandler/quizErrorHandler';
import { TextSizes } from '@/src/styles/TextSizes';
import { modalShell, modalForm } from '@/src/styles/creationModalStyles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Subject {
    id: string;
    name: string;
}

interface Class {
    id: string;
    name: string;
}

interface QuizData {
    title: string;
    description?: string;
    subject_id: string;
    class_id: string;
    scheduled_date: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    quiz_type: string;
    instructions?: string;
}

interface CreateQuizModalProps {
    colors: any;
    isDark?: boolean;
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    subjects: Subject[];
    classes: Class[];
    selectedClass: string;
    createQuiz: (quizData: QuizData) => { success: boolean; error?: any; data?: any };
    getSubjectsForClass: (classId: string) => Subject[];
    editingQuiz?: any;
    updateQuiz?: (quizId: string, quizData: Partial<QuizData>) => Promise<{ success: boolean; error?: any }>;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
    colors,
    isDark,
    modalVisible,
    setModalVisible,
    classes,
    selectedClass,
    createQuiz,
    getSubjectsForClass,
    editingQuiz,
    updateQuiz,
}) => {
    const isEditing = !!editingQuiz;
    const [creating, setCreating] = useState(false);
    const { profile } = useAuth();
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { showError, showSuccess, showWarning } = useDialog();

    const [newQuiz, setNewQuiz] = useState({
        title: '',
        description: '',
        subject_id: '',
        class_id: '',
        scheduled_date: '',
        duration_minutes: '60',
        total_marks: '100',
        passing_marks: '40',
        instructions: '',
    });

    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    type DropdownKey = 'class' | 'subject' | 'date' | null;
    const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
    const toggle = (key: DropdownKey) => setOpenDropdown(prev => prev === key ? null : key);

    const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
        visible: false, title: '', message: '',
    });

    const showErrorModal = (error: any, handler?: (error: any) => any) => {
        const errorInfo = handler ? handler(error) : { title: 'Error', message: error?.message || 'An error occurred' };
        setErrorModal({ visible: true, title: errorInfo.title, message: errorInfo.message });
    };

    useEffect(() => {
        if (!modalVisible) { setOpenDropdown(null); setShowDatePicker(false); }
    }, [modalVisible]);

    useEffect(() => {
        if (modalVisible) {
            if (isEditing && editingQuiz) {
                setNewQuiz({
                    title: editingQuiz.title || '',
                    description: editingQuiz.description || '',
                    subject_id: editingQuiz.subject_id || '',
                    class_id: editingQuiz.class_id || '',
                    scheduled_date: editingQuiz.scheduled_date || '',
                    duration_minutes: String(editingQuiz.duration_minutes ?? 60),
                    total_marks: String(editingQuiz.total_marks ?? 100),
                    passing_marks: String(editingQuiz.passing_marks ?? 40),
                    instructions: editingQuiz.instructions || '',
                });
            } else {
                setNewQuiz({
                    title: '',
                    description: '',
                    subject_id: '',
                    class_id: selectedClass === 'all' ? '' : selectedClass,
                    scheduled_date: '',
                    duration_minutes: '60',
                    total_marks: '100',
                    passing_marks: '40',
                    instructions: '',
                });
                setAvailableSubjects([]);
            }
        }
    }, [modalVisible, selectedClass, isEditing, editingQuiz]);

    useEffect(() => {
        const loadSubjects = async () => {
            if (newQuiz.class_id) {
                setLoadingSubjects(true);
                try {
                    const classSubjects = await getSubjectsForClass(newQuiz.class_id);
                    setAvailableSubjects(classSubjects);
                    setNewQuiz(prev => ({ ...prev, subject_id: '' }));
                } catch (error) {
                    showErrorModal(error, handleSubjectFetchForClassError);
                    setAvailableSubjects([]);
                } finally {
                    setLoadingSubjects(false);
                }
            } else {
                setAvailableSubjects([]);
                setNewQuiz(prev => ({ ...prev, subject_id: '' }));
            }
        };
        loadSubjects();
    }, [newQuiz.class_id]);

    const handleCreateQuiz = async () => {
        const missingFields: string[] = [];
        if (!newQuiz.title.trim()) missingFields.push('Title');
        if (!newQuiz.class_id) missingFields.push('Class');
        if (!newQuiz.subject_id) missingFields.push('Subject');
        if (!newQuiz.scheduled_date.trim()) missingFields.push('Scheduled Date');

        if (missingFields.length > 0) {
            showError('Error', `Please fill in: ${missingFields.join(', ')}`);
            return;
        }

        const duration = parseInt(newQuiz.duration_minutes);
        const totalMarks = parseInt(newQuiz.total_marks);
        const passingMarks = parseInt(newQuiz.passing_marks);

        if (isNaN(duration) || duration <= 0) {
            showError('Error', 'Duration must be a valid number greater than 0');
            return;
        }
        if (isNaN(totalMarks) || totalMarks <= 0) {
            showError('Error', 'Total marks must be a valid number greater than 0');
            return;
        }
        if (isNaN(passingMarks) || passingMarks < 0 || passingMarks > totalMarks) {
            showError('Error', 'Passing marks must be between 0 and total marks');
            return;
        }

        setCreating(true);
        try {
            const quizPayload = {
                ...newQuiz,
                duration_minutes: duration,
                total_marks: totalMarks,
                passing_marks: passingMarks,
                quiz_type: 'quiz',
            };

            if (isEditing && updateQuiz) {
                const result = await updateQuiz(editingQuiz.id, quizPayload);
                if (result.success) {
                    showSuccess('Success', 'Quiz updated successfully', () => setModalVisible(false));
                } else {
                    showError('Error', 'Failed to update quiz. Please try again.');
                }
                return;
            }

            // Check for duplicate: same class + subject + date
            const { data: existing } = await supabase
                .from('quizzes')
                .select('id')
                .eq('class_id', newQuiz.class_id)
                .eq('subject_id', newQuiz.subject_id)
                .eq('scheduled_date', newQuiz.scheduled_date)
                .maybeSingle();

            if (existing) {
                showWarning(
                    'Already Scheduled',
                    'A quiz for this class and subject already exists on this date. You cannot add another.',
                );
                return;
            }

            const result = await createQuiz(quizPayload);

            if (result.success && result.data) {
                showSuccess('Success', 'Quiz scheduled successfully', () => setModalVisible(false));

                // Fetch only students enrolled in this class+subject
                const { data: enrollments, error: studentError } = await supabase
                    .from('student_subject_enrollments')
                    .select('student_id')
                    .eq('class_id', newQuiz.class_id)
                    .eq('subject_id', newQuiz.subject_id)
                    .eq('is_active', true);

                if (studentError || !enrollments?.length) return;
                const students = enrollments.map(e => ({ id: e.student_id }));

                const { data: notification, error: notifError } = await supabase
                    .from('notifications')
                    .insert([{
                        type: 'quiz_added',
                        title: `Exam Scheduled – ${newQuiz.title}`,
                        message: `${newQuiz.title} is scheduled for ${newQuiz.scheduled_date}. Check the exams section for details.`,
                        entity_type: 'quiz',
                        entity_id: result.data.id,
                        created_by: profile?.id,
                        target_type: 'students',
                        target_id: newQuiz.class_id,
                        priority: 'high',
                    }])
                    .select('id')
                    .single();

                if (notifError) return;

                const recipientRows = students.map(s => ({
                    notification_id: notification.id,
                    user_id: s.id,
                    is_read: false,
                    is_deleted: false,
                }));
                await supabase.from('notification_recipients').insert(recipientRows);

                for (const student of students) {
                    try {
                        await sendPushNotification({
                            userId: student.id,
                            title: `Exam Scheduled – ${newQuiz.title}`,
                            body: `${newQuiz.title} is scheduled for ${newQuiz.scheduled_date}. Total marks: ${totalMarks}. Check the exams section for details.`,
                            data: {
                                type: 'quiz_added',
                                quizId: result.data.id,
                                className: newQuiz.class_id,
                                scheduledDate: newQuiz.scheduled_date,
                                totalMarks,
                                duration,
                                notificationId: notification.id,
                            },
                        });
                    } catch { /* continue */ }
                }
            } else {
                showErrorModal(result.error, handleQuizCreationError);
            }
        } catch (error: any) {
            showError('Error', error?.message || 'An unexpected error occurred.');
        } finally {
            setCreating(false);
        }
    };

    const selectedClassName = classes.find(c => c.id === newQuiz.class_id)?.name ?? 'Select class';
    const selectedSubjectName = availableSubjects.find(s => s.id === newQuiz.subject_id)?.name ?? 'Select subject';

    const chevronStyle = (key: DropdownKey) => ({
        marginLeft: 6,
        transform: [{ rotate: openDropdown === key ? '270deg' : '90deg' }] as any,
    });

    return (
        <Modal
            animationType="fade"
            transparent
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
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
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={StyleSheet.absoluteFillObject} />
                </TouchableWithoutFeedback>
                    <View style={[modalShell.sheet, { backgroundColor: colors.background, maxHeight: SHEET_HEIGHT, paddingBottom: bottomInset }]}>

                            {/* Header */}
                            <View style={[modalShell.header, { borderBottomColor: colors.border }]}>
                                <Text allowFontScaling={false} style={[modalShell.title, { color: colors.text }]}>
                                    {isEditing ? 'Edit Quiz' : 'Schedule Quiz'}
                                </Text>
                                <TouchableOpacity style={modalShell.closeBtn} onPress={() => setModalVisible(false)}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={modalShell.scroll}
                                keyboardShouldPersistTaps="handled"
                                automaticallyAdjustKeyboardInsets
                                contentContainerStyle={modalShell.scrollContent}
                            >

                                {/* Title */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Title *</Text>
                                    <TextInput
                                        style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        value={newQuiz.title}
                                        onChangeText={(t) => setNewQuiz({ ...newQuiz, title: t })}
                                        placeholder="Enter quiz title"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                {/* Description */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Description</Text>
                                    <TextInput
                                        style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        value={newQuiz.description}
                                        onChangeText={(t) => setNewQuiz({ ...newQuiz, description: t })}
                                        placeholder="Enter quiz description"
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                {/* Class */}
                                <View style={modalForm.group}>
                                    <TouchableOpacity
                                        style={[s.accordionHeader, { borderColor: colors.border }]}
                                        onPress={() => toggle('class')}
                                    >
                                        <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Class *</Text>
                                        <View style={s.accordionRight}>
                                            <Text allowFontScaling={false} style={[s.accordionValue, { color: newQuiz.class_id ? colors.text : colors.textSecondary }]}>
                                                {selectedClassName}
                                            </Text>
                                            <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('class')} />
                                        </View>
                                    </TouchableOpacity>
                                    {openDropdown === 'class' && (
                                        <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={s.dropdownScroll}>
                                                {classes.filter(c => c.id !== 'all').map((cls) => (
                                                    <TouchableOpacity
                                                        key={cls.id}
                                                        style={[s.option, { borderBottomColor: colors.border }]}
                                                        onPress={() => {
                                                            setNewQuiz(prev => ({ ...prev, class_id: cls.id, subject_id: '' }));
                                                            setOpenDropdown(null);
                                                        }}
                                                    >
                                                        <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{cls.name}</Text>
                                                        {newQuiz.class_id === cls.id && <Check size={16} color={colors.primary} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>

                                {/* Subject */}
                                {newQuiz.class_id ? (
                                    <View style={modalForm.group}>
                                        {loadingSubjects ? (
                                            <View style={[s.accordionHeader, { borderColor: colors.border }]}>
                                                <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Subject *</Text>
                                                <ActivityIndicator size="small" color={colors.primary} />
                                            </View>
                                        ) : availableSubjects.length === 0 ? (
                                            <Text allowFontScaling={false} style={[modalForm.hint, { color: colors.textSecondary }]}>
                                                No subjects assigned to this class
                                            </Text>
                                        ) : (
                                            <>
                                                <TouchableOpacity
                                                    style={[s.accordionHeader, { borderColor: colors.border }]}
                                                    onPress={() => toggle('subject')}
                                                >
                                                    <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Subject *</Text>
                                                    <View style={s.accordionRight}>
                                                        <Text allowFontScaling={false} style={[s.accordionValue, { color: newQuiz.subject_id ? colors.text : colors.textSecondary }]}>
                                                            {selectedSubjectName}
                                                        </Text>
                                                        <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('subject')} />
                                                    </View>
                                                </TouchableOpacity>
                                                {openDropdown === 'subject' && (
                                                    <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={s.dropdownScroll}>
                                                            {availableSubjects.map((sub) => (
                                                                <TouchableOpacity
                                                                    key={sub.id}
                                                                    style={[s.option, { borderBottomColor: colors.border }]}
                                                                    onPress={() => {
                                                                        setNewQuiz(prev => ({ ...prev, subject_id: sub.id }));
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                >
                                                                    <Text allowFontScaling={false} style={[s.optionText, { color: colors.text }]}>{sub.name}</Text>
                                                                    {newQuiz.subject_id === sub.id && <Check size={16} color={colors.primary} />}
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    </View>
                                                )}
                                            </>
                                        )}
                                    </View>
                                ) : null}

                                {/* Scheduled Date */}
                                <View style={modalForm.group}>
                                    <TouchableOpacity
                                        style={[s.accordionHeader, { borderColor: colors.border }]}
                                        onPress={() => {
                                            if (Platform.OS === 'android') {
                                                setOpenDropdown(null);
                                                setShowDatePicker(true);
                                            } else {
                                                toggle('date');
                                            }
                                        }}
                                    >
                                        <Text allowFontScaling={false} style={[s.accordionLabel, { color: colors.textSecondary }]}>Scheduled Date *</Text>
                                        <View style={s.accordionRight}>
                                            <Text allowFontScaling={false} style={[s.accordionValue, { color: newQuiz.scheduled_date ? colors.text : colors.textSecondary }]}>
                                                {newQuiz.scheduled_date || 'Select date'}
                                            </Text>
                                            <ChevronRight size={16} color={colors.textSecondary} style={chevronStyle('date')} />
                                        </View>
                                    </TouchableOpacity>

                                    {Platform.OS === 'ios' && openDropdown === 'date' && (
                                        <View style={[s.accordionBody, { borderColor: colors.border }]}>
                                            <DateTimePicker
                                                value={newQuiz.scheduled_date ? new Date(newQuiz.scheduled_date) : new Date()}
                                                mode="date"
                                                display="inline"
                                                minimumDate={new Date()}
                                                themeVariant={isDark ? 'dark' : 'light'}
                                                onChange={(_, selectedDate) => {
                                                    if (selectedDate) {
                                                        setNewQuiz(prev => ({
                                                            ...prev,
                                                            scheduled_date: selectedDate.toISOString().split('T')[0],
                                                        }));
                                                    }
                                                }}
                                            />
                                        </View>
                                    )}

                                    {showDatePicker && Platform.OS === 'android' && (
                                        <DateTimePicker
                                            value={newQuiz.scheduled_date ? new Date(newQuiz.scheduled_date) : new Date()}
                                            mode="date"
                                            display="default"
                                            minimumDate={new Date()}
                                            themeVariant={isDark ? 'dark' : 'light'}
                                            onChange={(event, selectedDate) => {
                                                setShowDatePicker(false);
                                                if (event.type !== 'dismissed' && selectedDate) {
                                                    setNewQuiz(prev => ({
                                                        ...prev,
                                                        scheduled_date: selectedDate.toISOString().split('T')[0],
                                                    }));
                                                }
                                            }}
                                        />
                                    )}
                                </View>

                                {/* Duration + Total Marks */}
                                <View style={s.rowInputs}>
                                    <View style={[modalForm.group, { flex: 1, marginRight: 8 }]}>
                                        <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Duration (min)</Text>
                                        <TextInput
                                            style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newQuiz.duration_minutes}
                                            onChangeText={(t) => setNewQuiz({ ...newQuiz, duration_minutes: t })}
                                            placeholder="60"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[modalForm.group, { flex: 1, marginLeft: 8 }]}>
                                        <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Total Marks</Text>
                                        <TextInput
                                            style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newQuiz.total_marks}
                                            onChangeText={(t) => setNewQuiz({ ...newQuiz, total_marks: t })}
                                            placeholder="100"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                {/* Passing Marks */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Passing Marks</Text>
                                    <TextInput
                                        style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        value={newQuiz.passing_marks}
                                        onChangeText={(t) => setNewQuiz({ ...newQuiz, passing_marks: t })}
                                        placeholder="40"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>

                                {/* Instructions */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Instructions</Text>
                                    <TextInput
                                        style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        value={newQuiz.instructions}
                                        onChangeText={(t) => setNewQuiz({ ...newQuiz, instructions: t })}
                                        placeholder="Enter special instructions for students"
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                {/* Submit */}
                                <TouchableOpacity
                                    style={[
                                        modalForm.submitBtn,
                                        { backgroundColor: colors.primary },
                                        (!newQuiz.class_id || !newQuiz.subject_id || loadingSubjects || creating) && { opacity: 0.4 },
                                    ]}
                                    onPress={handleCreateQuiz}
                                    disabled={creating || !newQuiz.class_id || !newQuiz.subject_id || loadingSubjects}
                                >
                                    {creating ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text allowFontScaling={false} style={modalForm.submitText}>
                                            {isEditing ? 'Save Changes' : 'Schedule Quiz'}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                            </ScrollView>
                    </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
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
    rowInputs: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
});

export default CreateQuizModal;
