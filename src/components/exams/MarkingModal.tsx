// components/MarkingModal.tsx
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
    StyleSheet,
    Keyboard
} from 'react-native';
import { X, Save } from 'lucide-react-native';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { handleMarkingError } from '@/src/utils/errorHandler/quizErrorHandler';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';

interface MarkingModalProps {
    colors: any;
    markingModalVisible: boolean;
    setMarkingModalVisible: (visible: boolean) => void;
    selectedResult: any;
    setSelectedResult: (result: any) => void;
    markQuizResult: (resultId: string, marks: number, remarks?: string) => { success: boolean };
}

const MarkingModal: React.FC<MarkingModalProps> = ({
    colors,
    markingModalVisible,
    setMarkingModalVisible,
    selectedResult,
    setSelectedResult,
    markQuizResult,
}) => {
    const [marking, setMarking] = useState(false);
    const [markingData, setMarkingData] = useState({
        marks: '',
        remarks: '',
    });
    const [errorModal, setErrorModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
    }>({ visible: false, title: '', message: '' });

    const showError = (error: any, handler?: (error: any) => any) => {
        const errorInfo = handler ? handler(error) : handleError(error);
        setErrorModal({
            visible: true,
            title: errorInfo.title,
            message: errorInfo.message,
        });
    };

    // Update marking data when selectedResult changes
    useEffect(() => {
        if (selectedResult) {
            setMarkingData({
                marks: selectedResult.marks_obtained?.toString() || '',
                remarks: selectedResult.remarks || '',
            });
        }
    }, [selectedResult]);

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const handleMarkResult = async () => {
        if (!selectedResult || !markingData.marks) {
            showError({ message: 'Please enter marks' });
            return;
        }

        const marks = parseInt(markingData.marks);
        if (marks < 0 || marks > selectedResult.total_marks) {
            showError({
                message: `Marks must be between 0 and ${selectedResult.total_marks}`
            });
            return;
        }

        setMarking(true);
        try {
            const result = await markQuizResult(
                selectedResult.id,
                marks,
                markingData.remarks
            );

            if (result.success) {
                Alert.alert('Success', 'Quiz marked successfully');
                setMarkingModalVisible(false);
                setSelectedResult(null);
                setMarkingData({ marks: '', remarks: '' });
            } else {
                showError(result.error, handleMarkingError);
            }
        } catch (error: any) {
            showError(error, handleMarkingError);
        } finally {
            setMarking(false);
        }
    };

    const handleClose = () => {
        setMarkingModalVisible(false);
        setSelectedResult(null);
        setMarkingData({ marks: '', remarks: '' });
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={markingModalVisible}
            onRequestClose={handleClose}
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
        >

            <ErrorModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() => setErrorModal({ ...errorModal, visible: false })}
            />

            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={dismissKeyboard}
            >
                <View style={[styles.markingModalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>Mark Quiz</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                        >
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {selectedResult && (
                        <ScrollView style={styles.markingContent} contentContainerStyle={styles.markingScrollContent}>
                            <View style={[styles.quizInfoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <Text allowFontScaling={false} style={[styles.quizInfoTitle, { color: colors.text }]}>
                                    {selectedResult.quizzes?.title}
                                </Text>
                                <Text allowFontScaling={false} style={[styles.quizInfoStudent, { color: colors.textSecondary }]}>
                                    Student: {selectedResult.students?.full_name} ({selectedResult.students?.roll_number})
                                </Text>
                                <Text allowFontScaling={false} style={[styles.quizInfoMarks, { color: colors.primary }]}>
                                    Total Marks: {selectedResult.total_marks}
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Marks Obtained</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={markingData.marks}
                                    onChangeText={(text) => setMarkingData({ ...markingData, marks: text })}
                                    placeholder={`Enter marks (0-${selectedResult.total_marks})`}
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    returnKeyType="done"
                                    onSubmitEditing={dismissKeyboard}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Remarks (Optional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={markingData.remarks}
                                    onChangeText={(text) => setMarkingData({ ...markingData, remarks: text })}
                                    placeholder="Add remarks or feedback"
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={3}
                                    returnKeyType="done"
                                    onSubmitEditing={dismissKeyboard}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                onPress={handleMarkResult}
                                disabled={marking}
                            >
                                {marking ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <>
                                        <Save size={16} color="#ffffff" />
                                        <Text allowFontScaling={false} style={styles.submitButtonText}>Save Marks</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    markingModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    markingContent: {
        maxHeight: '70%',
    },
    markingScrollContent: {
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
    quizInfoCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    quizInfoTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    quizInfoStudent: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    quizInfoMarks: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
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

export default MarkingModal;