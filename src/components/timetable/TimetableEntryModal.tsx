import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { 
    DAYS_ORDER, 
    DAYS_SHORT, 
    TimetableEntryWithDetails, 
    CreateTimetableEntry, 
    UserProfile,
    Class,
    Subject,
    ThemeColors
} from '@/src/types/timetable';

interface TimetableEntryModalProps {
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    editingEntry: TimetableEntryWithDetails | null;
    setEditingEntry: (entry: TimetableEntryWithDetails | null) => void;
    newEntry: Partial<CreateTimetableEntry>;
    setNewEntry: (entry: Partial<CreateTimetableEntry>) => void;
    profile: UserProfile | null;
    colors: ThemeColors;
    classes: Class[];
    subjects: Subject[];
    teachers: UserProfile[];
    handleAddEntry: () => void;
    handleUpdateEntry: () => void;
    handleDeleteEntry: (entry: TimetableEntryWithDetails) => void;
    resetForm: () => void;
}

export default function TimetableEntryModal({
    modalVisible,
    setModalVisible,
    editingEntry,
    setEditingEntry,
    newEntry,
    setNewEntry,
    profile,
    colors,
    classes,
    subjects,
    handleAddEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    resetForm
}: TimetableEntryModalProps) {
    const canDelete = (profile?.role === 'teacher') && editingEntry?.teacher_id === profile?.id;

    const formatTimeForInput = (time: string) => time.substring(0, 5);

    const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
        setNewEntry({ ...newEntry, [field]: value });
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingEntry(null);
        resetForm();
    };

    const handleSubmit = () => {
        editingEntry ? handleUpdateEntry() : handleAddEntry();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>
                            {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.modalScrollView}>
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Day</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.dayOptions}>
                                    {DAYS_ORDER.map((day) => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[
                                                styles.dayOption,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                newEntry.day === day && { backgroundColor: colors.primary, borderColor: colors.primary },
                                            ]}
                                            onPress={() => setNewEntry({ ...newEntry, day })}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.dayOptionText,
                                                { color: colors.text },
                                                newEntry.day === day && { color: '#ffffff' },
                                            ]}>
                                                {DAYS_SHORT[day]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                        
                        <View style={styles.timeRow}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Start Time</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={formatTimeForInput(newEntry.start_time || '')}
                                    onChangeText={(text) => handleTimeChange('start_time', text)}
                                    placeholder="09:00"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>End Time</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={formatTimeForInput(newEntry.end_time || '')}
                                    onChangeText={(text) => handleTimeChange('end_time', text)}
                                    placeholder="10:00"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Subject</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.subjectOptions}>
                                    {subjects.map((subject) => (
                                        <TouchableOpacity
                                            key={subject.id}
                                            style={[
                                                styles.subjectOption,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                newEntry.subject === subject.name && { backgroundColor: colors.primary, borderColor: colors.primary },
                                            ]}
                                            onPress={() => setNewEntry({ ...newEntry, subject: subject.name })}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.subjectOptionText,
                                                { color: colors.text },
                                                newEntry.subject === subject.name && { color: '#ffffff' },
                                            ]}>
                                                {subject.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Room Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={newEntry.room_number || ''}
                                onChangeText={(text) => setNewEntry({ ...newEntry, room_number: text })}
                                placeholder="Enter room number"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Class</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.classOptions}>
                                    {classes.map((classItem) => (
                                        <TouchableOpacity
                                            key={classItem.id}
                                            style={[
                                                styles.classOption,
                                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                newEntry.class_id === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                            ]}
                                            onPress={() => setNewEntry({ ...newEntry, class_id: classItem.id })}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.classOptionText,
                                                { color: colors.text },
                                                newEntry.class_id === classItem.id && { color: '#ffffff' },
                                            ]}>
                                                {classItem.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                        
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                onPress={handleSubmit}
                            >
                                <Text allowFontScaling={false} style={styles.submitButtonText}>
                                    {editingEntry ? 'Update Entry' : 'Add to Timetable'}
                                </Text>
                            </TouchableOpacity>
                            {editingEntry && canDelete && (
                                <TouchableOpacity
                                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                                    onPress={() => handleDeleteEntry(editingEntry)}
                                >
                                    <Trash2 size={20} color="#ffffff" />
                                    <Text allowFontScaling={false} style={styles.deleteButtonText}>Delete Entry</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
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
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScrollView: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    dayOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    dayOption: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    dayOptionText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    classOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    classOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    classOptionText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Medium',
    },
    subjectOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    subjectOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    subjectOptionText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Medium',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    submitButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
    deleteButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    deleteButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
});
