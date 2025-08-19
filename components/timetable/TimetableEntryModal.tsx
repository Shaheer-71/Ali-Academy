import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import { X, Trash2 } from 'lucide-react-native';
import { 
    DAYS_ORDER, 
    DAYS_SHORT, 
    DayOfWeek, 
    TimetableEntryWithDetails, 
    CreateTimetableEntry, 
    UserProfile,
    Class,
    Subject,
    ThemeColors
} from '@/types/timetable';

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
    teachers: UserProfile[]; // This won't be used since no admin role
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
    teachers, // Keeping for future use
    handleAddEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    resetForm
}: TimetableEntryModalProps) {
    // Only teachers can delete their own entries
    const canDelete = profile?.role === 'teacher' && editingEntry?.teacher_id === profile?.id;

    useEffect(() => {
        console.log('Modal opened:', { modalVisible, editingEntry, newEntry, canDelete });
    }, [modalVisible, editingEntry, newEntry, canDelete]);

    const formatTimeForInput = (time: string) => {
        // Convert HH:MM:SS to HH:MM for display in input
        return time ? time.substring(0, 5) : '';
    };

    const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
        // Ensure time is in HH:MM format and add seconds if needed
        const formattedTime = value.includes(':') ? value : value + ':00';
        setNewEntry({ ...newEntry, [field]: formattedTime });
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
                console.log('Modal closed');
                setModalVisible(false);
                setEditingEntry(null);
                resetForm();
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                console.log('Close button pressed');
                                setModalVisible(false);
                                setEditingEntry(null);
                                resetForm();
                            }}
                        >
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalScrollView}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Day</Text>
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
                                            onPress={() => {
                                                console.log('Day selected:', day);
                                                setNewEntry({ ...newEntry, day });
                                            }}
                                        >
                                            <Text style={[
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
                                <Text style={[styles.label, { color: colors.text }]}>Start Time</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                    value={formatTimeForInput(newEntry.start_time || '')}
                                    onChangeText={(text) => handleTimeChange('start_time', text)}
                                    placeholder="09:00"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[styles.label, { color: colors.text }]}>End Time</Text>
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
                            <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
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
                                            onPress={() => {
                                                console.log('Subject selected:', subject.name);
                                                setNewEntry({ ...newEntry, subject: subject.name });
                                            }}
                                        >
                                            <Text style={[
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
                            <Text style={[styles.label, { color: colors.text }]}>Room Number</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={newEntry.room_number}
                                onChangeText={(text) => setNewEntry({ ...newEntry, room_number: text })}
                                placeholder="Enter room number"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Class</Text>
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
                                            onPress={() => {
                                                console.log('Class selected:', classItem.name);
                                                setNewEntry({ ...newEntry, class_id: classItem.id });
                                            }}
                                        >
                                            <Text style={[
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
                        
                        {/* Removed teacher selection since only teachers can create entries for themselves */}
                        
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    console.log('Submit button pressed:', { editingEntry, newEntry });
                                    editingEntry ? handleUpdateEntry() : handleAddEntry();
                                }}
                            >
                                <Text style={styles.submitButtonText}>
                                    {editingEntry ? 'Update Entry' : 'Add to Timetable'}
                                </Text>
                            </TouchableOpacity>
                            {editingEntry && canDelete && (
                                <TouchableOpacity
                                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                                    onPress={() => {
                                        console.log('Delete button pressed:', { entryId: editingEntry.id });
                                        handleDeleteEntry(editingEntry);
                                    }}
                                >
                                    <Trash2 size={20} color="#ffffff" />
                                    <Text style={styles.deleteButtonText}>Delete Entry</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

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
        fontSize: 20,
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
        fontSize: 12,
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
        fontSize: 14,
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
        fontSize: 14,
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
        fontSize: 16,
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
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});