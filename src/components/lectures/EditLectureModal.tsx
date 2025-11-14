// src/components/lectures/EditLectureModal.tsx

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
import { X, Save, Youtube } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { lectureService } from '@/src/services/lecture.service';
import { Lecture } from '@/src/types/lectures';

interface EditLectureModalProps {
    visible: boolean;
    lecture: Lecture | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditLectureModal({
    visible,
    lecture,
    onClose,
    onSuccess
}: EditLectureModalProps) {
    const { colors } = useTheme();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [youtubeLink, setYoutubeLink] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (lecture) {
            setTitle(lecture.title || '');
            setDescription(lecture.description || '');
            setYoutubeLink(lecture.youtube_link || '');
        }
    }, [lecture]);

    const validateYouTubeLink = (link: string) => {
        if (!link) return true;
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return youtubeRegex.test(link);
    };

    const handleUpdate = async () => {
        if (!lecture) return;

        // Validation
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (youtubeLink && !validateYouTubeLink(youtubeLink)) {
            Alert.alert('Error', 'Please enter a valid YouTube link');
            return;
        }

        setIsUpdating(true);
        try {
            await lectureService.updateLecture(lecture.id, {
                title: title.trim(),
                description: description.trim(),
                youtube_link: youtubeLink.trim(),
            });

            Alert.alert('Success', 'Lecture updated successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        onSuccess();
                        onClose();
                    }
                }
            ]);
        } catch (error: any) {
            Alert.alert('Update Failed', error.message || 'Failed to update lecture');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleClose = () => {
        if (!isUpdating) {
            onClose();
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                            Edit Lecture
                        </Text>
                        <TouchableOpacity onPress={handleClose} disabled={isUpdating}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Title */}
                        <View style={styles.field}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                Title *
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text }]}
                                placeholder="Enter lecture title"
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Description */}
                        <View style={styles.field}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                Description
                            </Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, color: colors.text }]}
                                placeholder="Enter description (optional)"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
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
                                value={youtubeLink}
                                onChangeText={setYoutubeLink}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Info */}
                        <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
                            <Text allowFontScaling={false} style={[styles.infoText, { color: colors.textSecondary }]}>
                                Note: You can only edit the title, description, and YouTube link.
                                Class, subject, and file cannot be changed.
                            </Text>
                        </View>

                        {/* Update Button */}
                        <TouchableOpacity
                            style={[
                                styles.updateButton,
                                { backgroundColor: isUpdating ? colors.textSecondary : colors.primary }
                            ]}
                            onPress={handleUpdate}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Save size={20} color="white" />
                                    <Text allowFontScaling={false} style={styles.updateButtonText}>
                                        Update Lecture
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}


import { TextSizes } from '@/src/styles/TextSizes';
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '90%',
        maxHeight: '70%',
        borderRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
    },
    content: {
        padding: 20,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    input: {
        borderRadius: 8,
        padding: 12,
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    infoBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoText: {
        fontSize: TextSizes.small,
        lineHeight: 18,
        fontFamily: 'Inter-Regular',
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 8,
        gap: 8,
    },
    updateButtonText: {
        color: 'white',
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
});


// const styles = StyleSheet.create({
//     overlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     modal: {
//         width: '90%',
//         maxHeight: '70%',
//         borderRadius: 20,
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         padding: 20,
//         borderBottomWidth: 1,
//     },
//     title: {
//         fontSize: 18,
//         fontWeight: 'bold',
//     },
//     content: {
//         padding: 20,
//     },
//     field: {
//         marginBottom: 20,
//     },
//     label: {
//         fontSize: 14,
//         fontWeight: '600',
//         marginBottom: 8,
//     },
//     input: {
//         borderRadius: 8,
//         padding: 12,
//         fontSize: 14,
//     },
//     textArea: {
//         minHeight: 80,
//         textAlignVertical: 'top',
//     },
//     infoBox: {
//         padding: 12,
//         borderRadius: 8,
//         marginBottom: 20,
//     },
//     infoText: {
//         fontSize: 12,
//         lineHeight: 18,
//     },
//     updateButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: 14,
//         borderRadius: 8,
//         gap: 8,
//     },
//     updateButtonText: {
//         color: 'white',
//         fontSize: 15,
//         fontWeight: '600',
//     },
// });