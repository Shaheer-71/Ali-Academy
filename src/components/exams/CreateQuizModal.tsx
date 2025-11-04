// components/CreateQuizModal.tsx - Fixed TypeScript issues
import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    StyleSheet
} from 'react-native';
import { X } from 'lucide-react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { sendPushNotification } from '@/src/lib/notifications';

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
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    subjects: Subject[];
    classes: Class[];
    selectedClass: string;
    createQuiz: (quizData: QuizData) => Promise<{ success: boolean; error?: any }>;
    getSubjectsForClass: (classId: string) => Subject[];
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
    colors,
    modalVisible,
    setModalVisible,
    subjects,
    classes,
    selectedClass,
    createQuiz,
    getSubjectsForClass,
}) => {
    const [creating, setCreating] = useState<boolean>(false);
    const { profile } = useAuth();
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

    // Available subjects based on selected class
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

    // Reset form when modal is opened
    useEffect(() => {
        if (modalVisible) {
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
        }
    }, [modalVisible, selectedClass]);

    // Update available subjects when class changes
    useEffect(() => {
        if (newQuiz.class_id && newQuiz.class_id !== '') {
            const classSubjects = getSubjectsForClass(newQuiz.class_id);
            setAvailableSubjects(classSubjects);
            // Reset subject selection when class changes
            setNewQuiz(prev => ({ ...prev, subject_id: '' }));
        } else {
            setAvailableSubjects([]);
            setNewQuiz(prev => ({ ...prev, subject_id: '' }));
        }
    }, [newQuiz.class_id, getSubjectsForClass]);

    const handleCreateQuiz = async (): Promise<void> => {
        // Validation
        const missingFields: string[] = [];
        if (!newQuiz.title.trim()) missingFields.push('Title');
        if (!newQuiz.class_id) missingFields.push('Class');
        if (!newQuiz.subject_id) missingFields.push('Subject');
        if (!newQuiz.scheduled_date.trim()) missingFields.push('Scheduled Date');

        if (missingFields.length > 0) {
            Alert.alert('Error', `Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newQuiz.scheduled_date)) {
            Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
            return;
        }

        const duration = parseInt(newQuiz.duration_minutes);
        const totalMarks = parseInt(newQuiz.total_marks);
        const passingMarks = parseInt(newQuiz.passing_marks);

        if (isNaN(duration) || duration <= 0) {
            Alert.alert('Error', 'Duration must be a valid number greater than 0');
            return;
        }

        if (isNaN(totalMarks) || totalMarks <= 0) {
            Alert.alert('Error', 'Total marks must be a valid number greater than 0');
            return;
        }

        if (isNaN(passingMarks) || passingMarks < 0 || passingMarks > totalMarks) {
            Alert.alert('Error', 'Passing marks must be between 0 and total marks');
            return;
        }

        setCreating(true);
        try {
            const result = await createQuiz({
                ...newQuiz,
                duration_minutes: duration,
                total_marks: totalMarks,
                passing_marks: passingMarks,
                quiz_type: 'quiz',
            });

            if (result.success && result.data) {
                Alert.alert('Success', 'Quiz scheduled successfully');
                setModalVisible(false);

                // ✅ 1️⃣ Fetch all students in the class
                const { data: students, error: studentError } = await supabase
                    .from('students')
                    .select('id')
                    .eq('class_id', newQuiz.class_id);

                if (studentError) {
                    console.error('Error fetching students:', studentError);
                    return;
                }

                if (!students || students.length === 0) {
                    console.warn('No students found for class:', newQuiz.class_id);
                    return;
                }

                // ✅ 2️⃣ Create one notification for this quiz
                const { data: notification, error: notifError } = await supabase
                    .from('notifications')
                    .insert([
                        {
                            type: 'quiz_added',
                            title: `${newQuiz.title} Scheduled`,
                            message: `A new quiz has been scheduled for ${newQuiz.scheduled_date}. Prepare well!`,
                            entity_type: 'quiz',
                            entity_id: result.data.id, // quiz ID
                            created_by: profile?.id, // teacher
                            target_type: 'students',
                            target_id: newQuiz.class_id,
                            priority: 'high',
                        },
                    ])
                    .select('id')
                    .single();

                if (notifError) {
                    console.error('Error creating notification:', notifError);
                    return;
                }

                // ✅ 3️⃣ Add all students as recipients
                const recipientRows = students.map(s => ({
                    notification_id: notification.id,
                    user_id: s.id,
                    is_read: false,
                    is_deleted: false,
                }));

                const { error: recipientError } = await supabase
                    .from('notification_recipients')
                    .insert(recipientRows);

                // ✅ 4️⃣ SEND PUSH NOTIFICATIONS TO ALL STUDENTS
                console.log(`📱 [QUIZ] Sending push notifications to ${students.length} students...`);
                let sentCount = 0;
                let failedCount = 0;

                for (let i = 0; i < students.length; i++) {
                    const student = students[i];
                    try {
                        console.log(`📤 [QUIZ] Sending notification to student ${i + 1}/${students.length}...`);

                        await sendPushNotification({
                            userId: student.id,
                            title: `📝 ${newQuiz.title}`,
                            body: `A new quiz has been scheduled for ${newQuiz.scheduled_date}. Total marks: ${totalMarks}. Prepare well!`,
                            data: {
                                type: 'quiz_added',
                                quizId: result.data.id,
                                className: newQuiz.class_id,
                                scheduledDate: newQuiz.scheduled_date,
                                totalMarks: totalMarks,
                                duration: duration,
                                notificationId: notification.id,
                            },
                        });

                        console.log(`✅ [QUIZ] Push notification sent to student ${i + 1}`);
                        sentCount++;
                    } catch (studentError) {
                        console.error(`❌ [QUIZ] Failed to send notification to student ${i + 1}:`, studentError);
                        failedCount++;
                        // Continue with next student instead of stopping
                        continue;
                    }
                }

                console.log(`📊 [QUIZ] Push notification summary: ${sentCount} sent, ${failedCount} failed out of ${students.length} students`);

                if (sentCount > 0) {
                    console.log(`✅ [QUIZ] Successfully notified ${sentCount} students`);
                }

                if (recipientError) {
                    console.error('Error adding recipients:', recipientError);
                } else {
                    console.log(`Notification sent to ${students.length} students`);
                }
            } else {
                Alert.alert('Error', result.error?.message || 'Failed to create quiz');
            }

        } catch (error: any) {
            console.error('Error creating quiz:', error);
            Alert.alert('Error', error.message);
        } finally {
            setCreating(false);
        }
    };


    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Quiz</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollViewContent}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Quiz Title *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={newQuiz.title}
                                onChangeText={(text) => setNewQuiz({ ...newQuiz, title: text })}
                                placeholder="Enter quiz title"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={newQuiz.description}
                                onChangeText={(text) => setNewQuiz({ ...newQuiz, description: text })}
                                placeholder="Enter quiz description"
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* STEP 1: Select Class First */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Class *</Text>
                            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                                {newQuiz.class_id ? `Selected: ${classes.find(c => c.id === newQuiz.class_id)?.name}` : 'Please select a class first'}
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.options}>
                                    {classes.filter(c => c.id !== 'all').map((classItem) => (
                                        <TouchableOpacity
                                            key={classItem.id}
                                            style={[
                                                styles.option,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                newQuiz.class_id === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                            ]}
                                            onPress={() => setNewQuiz({ ...newQuiz, class_id: classItem.id })}
                                        >
                                            <Text style={[
                                                styles.optionText,
                                                { color: colors.text },
                                                newQuiz.class_id === classItem.id && { color: '#ffffff' },
                                            ]}>
                                                {classItem.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* STEP 2: Select Subject (only after class is selected) */}
                        {newQuiz.class_id && (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.text }]}>Subject *</Text>
                                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                                    {newQuiz.subject_id
                                        ? `Selected: ${availableSubjects.find(s => s.id === newQuiz.subject_id)?.name}`
                                        : `Available subjects for ${classes.find(c => c.id === newQuiz.class_id)?.name}`
                                    }
                                </Text>
                                {availableSubjects.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View style={styles.options}>
                                            {availableSubjects.map((subject) => (
                                                <TouchableOpacity
                                                    key={subject.id}
                                                    style={[
                                                        styles.option,
                                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                        newQuiz.subject_id === subject.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                    ]}
                                                    onPress={() => setNewQuiz({ ...newQuiz, subject_id: subject.id })}
                                                >
                                                    <Text style={[
                                                        styles.optionText,
                                                        { color: colors.text },
                                                        newQuiz.subject_id === subject.id && { color: '#ffffff' },
                                                    ]}>
                                                        {subject.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                ) : (
                                    <View style={[styles.noSubjectsContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                        <Text style={[styles.noSubjectsText, { color: colors.textSecondary }]}>
                                            No subjects assigned to this class. Please contact admin to assign subjects.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Scheduled Date *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={newQuiz.scheduled_date}
                                onChangeText={(text) => setNewQuiz({ ...newQuiz, scheduled_date: text })}
                                placeholder="YYYY-MM-DD (e.g., 2025-08-20)"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.rowInputs}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Duration (min)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={newQuiz.duration_minutes}
                                    onChangeText={(text) => setNewQuiz({ ...newQuiz, duration_minutes: text })}
                                    placeholder="60"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Total Marks</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={newQuiz.total_marks}
                                    onChangeText={(text) => setNewQuiz({ ...newQuiz, total_marks: text })}
                                    placeholder="100"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Passing Marks</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={newQuiz.passing_marks}
                                onChangeText={(text) => setNewQuiz({ ...newQuiz, passing_marks: text })}
                                placeholder="40"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Instructions</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={newQuiz.instructions}
                                onChangeText={(text) => setNewQuiz({ ...newQuiz, instructions: text })}
                                placeholder="Enter special instructions for students"
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Quiz Type Info (hardcoded) */}
                        <View style={[styles.infoContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                ℹ️ Quiz Type: <Text style={[styles.infoValue, { color: colors.text }]}>Quiz</Text>
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: colors.primary },
                                (!newQuiz.class_id || !newQuiz.subject_id) && { backgroundColor: colors.textSecondary }
                            ]}
                            onPress={handleCreateQuiz}
                            disabled={creating || !newQuiz.class_id || !newQuiz.subject_id}
                        >
                            {creating ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Schedule Quiz</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalScrollView: {
        maxHeight: '80%',
    },
    modalScrollViewContent: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 16,
    },
    rowInputs: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    options: {
        flexDirection: 'row',
        gap: 8,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    optionText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    noSubjectsContainer: {
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
    },
    noSubjectsText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    infoContainer: {
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    infoValue: {
        fontFamily: 'Inter-SemiBold',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderRadius: 12,
        marginTop: 12,
        gap: 8,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});

export default CreateQuizModal;