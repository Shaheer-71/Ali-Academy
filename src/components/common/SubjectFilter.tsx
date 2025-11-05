// src/components/common/SubjectFilter.tsx

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Modal,
} from 'react-native';
import { Filter, X } from 'lucide-react-native';
import { ThemeColors } from '@/src/types/timetable';
import { useAuth } from '@/src/contexts/AuthContext';


interface Subject {
    id: string;
    name: string;
}

interface SubjectFilterProps {
    subjects: Subject[];
    selectedSubject: string | null;
    onSubjectSelect: (subjectId: string | null) => void;
    colors: ThemeColors;
    loading?: boolean;
}

export default function SubjectFilter({
    subjects,
    selectedSubject,
    onSubjectSelect,
    colors,
    loading = false,
}: SubjectFilterProps) {
    const [modalVisible, setModalVisible] = React.useState(false);



    return (
        <>
            {/* Filter Button */}
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    {
                        backgroundColor: selectedSubject ? colors.primary : colors.cardBackground,
                        borderColor: colors.border,
                    },
                ]}
                onPress={() => setModalVisible(true)}
            >
                <Filter
                    size={20}
                    color={selectedSubject ? '#ffffff' : colors.text}
                />

            </TouchableOpacity>

            {/* Filter Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Filter by Subject
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.optionsContainer}>
                            {/* Clear Filter Option */}
                            <TouchableOpacity
                                style={[
                                    styles.option,
                                    {
                                        backgroundColor:
                                            selectedSubject === null
                                                ? colors.primary
                                                : colors.cardBackground,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => {
                                    onSubjectSelect(null);
                                    setModalVisible(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        {
                                            color:
                                                selectedSubject === null ? '#ffffff' : colors.text,
                                        },
                                    ]}
                                >
                                    All Subjects
                                </Text>
                            </TouchableOpacity>

                            {/* Subject Options */}
                            {loading ? (
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Loading subjects...
                                </Text>
                            ) : subjects.length === 0 ? (
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    No subjects available
                                </Text>
                            ) : (
                                subjects.map((subject) => (
                                    <TouchableOpacity
                                        key={subject.id}
                                        style={[
                                            styles.option,
                                            {
                                                backgroundColor:
                                                    selectedSubject === subject.id
                                                        ? colors.primary
                                                        : colors.cardBackground,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                        onPress={() => {
                                            onSubjectSelect(subject.id);
                                            setModalVisible(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                {
                                                    color:
                                                        selectedSubject === subject.id
                                                            ? '#ffffff'
                                                            : colors.text,
                                                },
                                            ]}
                                        >
                                            {subject.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        maxHeight: '70%',
        width: '80%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    option: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        justifyContent: 'center',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loadingText: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
});