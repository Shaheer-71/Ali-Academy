import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import {
    Calendar,
    Clock,
    MapPin,
    BookOpen,
    Plus,
    X,
    ChevronLeft,
    ChevronRight,
    User,
} from 'lucide-react-native';
import TopSection from '@/components/TopSections';

interface TimetableEntry {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    subject: string;
    room_number: string;
    class_id: string;
    teacher_id: string;
    class_name?: string;
    teacher_name?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TimetableScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentWeek, setCurrentWeek] = useState(new Date());

    // Form states
    const [newEntry, setNewEntry] = useState({
        day: '',
        start_time: '',
        end_time: '',
        subject: '',
        room_number: '',
        class_id: '',
    });

    useEffect(() => {
        fetchClasses();
        fetchTimetable();
    }, [profile]);

    useEffect(() => {
        if (selectedClass) {
            fetchTimetable();
        }
    }, [selectedClass]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('name');

            if (error) throw error;
            setClasses(data || []);
            if (data && data.length > 0 && profile?.role === 'teacher') {
                setSelectedClass(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchTimetable = async () => {
        try {
            // Mock data for demonstration - replace with actual Supabase query
            const mockTimetable: TimetableEntry[] = [
                {
                    id: '1',
                    day: 'Mon',
                    start_time: '09:00',
                    end_time: '10:00',
                    subject: 'Mathematics',
                    room_number: 'Room 101',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Mr. Ahmed',
                },
                {
                    id: '2',
                    day: 'Mon',
                    start_time: '10:30',
                    end_time: '11:30',
                    subject: 'Physics',
                    room_number: 'Room 102',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Ms. Fatima',
                },
                {
                    id: '3',
                    day: 'Mon',
                    start_time: '14:00',
                    end_time: '15:00',
                    subject: 'Chemistry',
                    room_number: 'Lab 1',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Dr. Hassan',
                },
                {
                    id: '4',
                    day: 'Tue',
                    start_time: '09:00',
                    end_time: '10:00',
                    subject: 'English',
                    room_number: 'Room 201',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Ms. Aisha',
                },
                {
                    id: '5',
                    day: 'Tue',
                    start_time: '11:00',
                    end_time: '12:00',
                    subject: 'Biology',
                    room_number: 'Room 104',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Dr. Omar',
                },
                {
                    id: '6',
                    day: 'Wed',
                    start_time: '10:00',
                    end_time: '11:00',
                    subject: 'Computer Science',
                    room_number: 'Lab 2',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Mr. Ali',
                },
                {
                    id: '7',
                    day: 'Thu',
                    start_time: '09:00',
                    end_time: '10:00',
                    subject: 'History',
                    room_number: 'Room 301',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Ms. Zara',
                },
                {
                    id: '8',
                    day: 'Thu',
                    start_time: '15:00',
                    end_time: '16:00',
                    subject: 'Geography',
                    room_number: 'Room 302',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Mr. Tariq',
                },
                {
                    id: '9',
                    day: 'Fri',
                    start_time: '09:00',
                    end_time: '10:00',
                    subject: 'Islamic Studies',
                    room_number: 'Room 401',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Maulana Saeed',
                },
                {
                    id: '10',
                    day: 'Fri',
                    start_time: '11:00',
                    end_time: '12:00',
                    subject: 'Art & Craft',
                    room_number: 'Art Room',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Ms. Noor',
                },
                {
                    id: '11',
                    day: 'Sat',
                    start_time: '09:00',
                    end_time: '10:00',
                    subject: 'Sports',
                    room_number: 'Playground',
                    class_id: selectedClass || '1',
                    teacher_id: profile?.id || '',
                    class_name: 'Class A',
                    teacher_name: 'Coach Imran',
                },
            ];

            setTimetable(mockTimetable);
        } catch (error) {
            console.error('Error fetching timetable:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = async () => {
        if (!newEntry.day || !newEntry.start_time || !newEntry.end_time || !newEntry.subject || !newEntry.room_number || !newEntry.class_id) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            // In a real implementation, save to Supabase
            const newId = Date.now().toString();
            const entry: TimetableEntry = {
                ...newEntry,
                id: newId,
                teacher_id: profile!.id,
                class_name: classes.find(c => c.id === newEntry.class_id)?.name,
                teacher_name: profile?.full_name,
            };

            setTimetable(prev => [...prev, entry]);
            Alert.alert('Success', 'Timetable entry added successfully');
            setModalVisible(false);
            setNewEntry({
                day: '',
                start_time: '',
                end_time: '',
                subject: '',
                room_number: '',
                class_id: '',
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const getEntriesForDay = (day: string) => {
        return timetable
            .filter(entry => entry.day === day && (selectedClass === '' || entry.class_id === selectedClass))
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .slice(0, 3); // Max 3 classes per day
    };

    const getCurrentWeekDates = () => {
        const startOfWeek = new Date(currentWeek);
        startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Monday

        return DAYS.map((_, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            return date;
        });
    };

    const weekDates = getCurrentWeekDates();

    return (
        <>
            <TopSection />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    {profile?.role === 'teacher' && (
                        <TouchableOpacity
                            style={[styles.addHeaderButton, { backgroundColor: colors.primary }]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Plus size={20} color="#ffffff" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Week Navigation */}
                <View style={styles.weekNavigation}>
                    <TouchableOpacity
                        style={[styles.weekNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                        onPress={() => {
                            const prevWeek = new Date(currentWeek);
                            prevWeek.setDate(currentWeek.getDate() - 7);
                            setCurrentWeek(prevWeek);
                        }}
                    >
                        <ChevronLeft size={20} color={colors.primary} />
                    </TouchableOpacity>

                    <Text style={[styles.weekText, { color: colors.text }]}>
                        {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                        {weekDates[5].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>

                    <TouchableOpacity
                        style={[styles.weekNavButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                        onPress={() => {
                            const nextWeek = new Date(currentWeek);
                            nextWeek.setDate(currentWeek.getDate() + 7);
                            setCurrentWeek(nextWeek);
                        }}
                    >
                        <ChevronRight size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Class Filter */}
                {profile?.role === 'teacher' && (
                    <View style={styles.classFilter}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.classButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.classButton,
                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                        selectedClass === '' && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    ]}
                                    onPress={() => setSelectedClass('')}
                                >
                                    <Text style={[
                                        styles.classButtonText,
                                        { color: colors.text },
                                        selectedClass === '' && { color: '#ffffff' },
                                    ]}>
                                        All Classes
                                    </Text>
                                </TouchableOpacity>
                                {classes.map((classItem) => (
                                    <TouchableOpacity
                                        key={classItem.id}
                                        style={[
                                            styles.classButton,
                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                            selectedClass === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                                        ]}
                                        onPress={() => setSelectedClass(classItem.id)}
                                    >
                                        <Text style={[
                                            styles.classButtonText,
                                            { color: colors.text },
                                            selectedClass === classItem.id && { color: '#ffffff' },
                                        ]}>
                                            {classItem.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Timetable */}
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.timetableContainer}>
                        {DAYS.map((day, dayIndex) => {
                            const dayEntries = getEntriesForDay(day);
                            const dayDate = weekDates[dayIndex];
                            const isToday = dayDate.toDateString() === new Date().toDateString();

                            return (
                                <View key={day} style={styles.dayRow}>
                                    {/* Day Header */}
                                    <View style={[
                                        styles.dayHeader,
                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                        isToday && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}>
                                        <Text style={[
                                            styles.dayName,
                                            { color: colors.text },
                                            isToday && { color: '#ffffff' }
                                        ]}>
                                            {day}
                                        </Text>
                                        <Text style={[
                                            styles.dayDate,
                                            { color: colors.primary },
                                            isToday && { color: '#b6d509' }
                                        ]}>
                                            {dayDate.getDate()}
                                        </Text>
                                    </View>

                                    {/* Time Slots */}
                                    <View style={styles.timeSlots}>
                                        {dayEntries.length === 0 ? (
                                            <View style={[styles.emptyDay, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                                <Calendar size={24} color={colors.textSecondary} />
                                                <Text style={[styles.emptyDayText, { color: colors.textSecondary }]}>No classes scheduled</Text>
                                            </View>
                                        ) : (
                                            dayEntries.map((entry, index) => (
                                                <View key={entry.id} style={[
                                                    styles.timeSlot,
                                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                    index === 0 && styles.firstTimeSlot,
                                                    index === dayEntries.length - 1 && styles.lastTimeSlot,
                                                ]}>
                                                    <View style={styles.timeSlotContent}>
                                                        <View style={styles.timeSlotHeader}>
                                                            <View style={styles.timeInfo}>
                                                                <Clock size={14} color={colors.primary} />
                                                                <Text style={[styles.timeText, { color: colors.primary }]}>
                                                                    {entry.start_time} - {entry.end_time}
                                                                </Text>
                                                            </View>
                                                            <View style={[styles.roomBadge, { backgroundColor: colors.secondary }]}>
                                                                <MapPin size={10} color="#274d71" />
                                                                <Text style={styles.roomText}>{entry.room_number}</Text>
                                                            </View>
                                                        </View>

                                                        <Text style={[styles.subjectText, { color: colors.text }]}>{entry.subject}</Text>

                                                        {entry.teacher_name && (
                                                            <View style={styles.teacherInfo}>
                                                                <User size={12} color={colors.textSecondary} />
                                                                <Text style={[styles.teacherText, { color: colors.textSecondary }]}>{entry.teacher_name}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Add Entry Modal */}
                {profile?.role === 'teacher' && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>Add Timetable Entry</Text>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <X size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalScrollView}>
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Day</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <View style={styles.dayOptions}>
                                                {DAYS.map((day) => (
                                                    <TouchableOpacity
                                                        key={day}
                                                        style={[
                                                            styles.dayOption,
                                                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                                            newEntry.day === day && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                        ]}
                                                        onPress={() => setNewEntry({ ...newEntry, day })}
                                                    >
                                                        <Text style={[
                                                            styles.dayOptionText,
                                                            { color: colors.text },
                                                            newEntry.day === day && { color: '#ffffff' },
                                                        ]}>
                                                            {day.slice(0, 3)}
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
                                                value={newEntry.start_time}
                                                onChangeText={(text) => setNewEntry({ ...newEntry, start_time: text })}
                                                placeholder="09:00"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>
                                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                            <Text style={[styles.label, { color: colors.text }]}>End Time</Text>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                                value={newEntry.end_time}
                                                onChangeText={(text) => setNewEntry({ ...newEntry, end_time: text })}
                                                placeholder="10:00"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                            value={newEntry.subject}
                                            onChangeText={(text) => setNewEntry({ ...newEntry, subject: text })}
                                            placeholder="Enter subject name"
                                            placeholderTextColor={colors.textSecondary}
                                        />
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
                                                        onPress={() => setNewEntry({ ...newEntry, class_id: classItem.id })}
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

                                    <TouchableOpacity
                                        style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                        onPress={handleAddEntry}
                                    >
                                        <Text style={styles.submitButtonText}>Add to Timetable</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                )}
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Inter-SemiBold',
    },
    addHeaderButton: {
        flex: 1, 
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    weekNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginBottom: 16,
    },
    weekNavButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    weekText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        flex: 1,
    },
    classFilter: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    classButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    classButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    classButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    timetableContainer: {
        paddingBottom: 20,
    },
    dayRow: {
        flexDirection: 'row',
        marginBottom: 20,
        minHeight: 120,
    },
    dayHeader: {
        width: 80,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
    },
    dayName: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
        textAlign: 'center',
    },
    dayDate: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    timeSlots: {
        flex: 1,
        gap: 8,
    },
    emptyDay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyDayText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginTop: 8,
        textAlign: 'center',
    },
    timeSlot: {
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    firstTimeSlot: {
        borderTopWidth: 3,
        borderTopColor: '#b6d509',
    },
    lastTimeSlot: {
        borderBottomWidth: 3,
        borderBottomColor: '#274d71',
    },
    timeSlotContent: {
        padding: 16,
    },
    timeSlotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        marginLeft: 6,
    },
    roomBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    roomText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#274d71',
    },
    subjectText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teacherText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginLeft: 4,
    },
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
    submitButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});