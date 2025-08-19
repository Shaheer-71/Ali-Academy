// TimetableScreen.tsx - FIXED TYPE ISSUES
import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, StyleSheet, Alert, View } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTimetable } from '@/src/hooks/useTimetable';
import TopSection from '@/src/components/common/TopSections';
import Header from '@/src/components/timetable/Header';
import ClassFilter from '@/src/components/timetable/ClassFilter';
import DayRow from '@/src/components/timetable/DayRow';
import TimetableEntryModal from '@/src/components/timetable/TimetableEntryModal';
import ErrorState from '@/src/components/timetable/ErrorState';
import { supabase } from '@/src/lib/supabase';
import { 
    Class, 
    Subject,
    TimetableEntryWithDetails, 
    CreateTimetableEntry, 
    DAYS_ORDER, 
    ThemeColors
} from '@/src/types/timetable';

export default function TimetableScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme() as { colors: ThemeColors };
    const {
        timetable,
        loading,
        error,
        filters,
        setFilters,
        createEntry,
        updateEntry,
        deleteEntry,
        getEntriesForDay,
        refreshTimetable
    } = useTimetable();

    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimetableEntryWithDetails | null>(null);
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const [newEntry, setNewEntry] = useState<Partial<CreateTimetableEntry>>({
        day: undefined,
        start_time: '',
        end_time: '',
        subject: '',
        room_number: '',
        class_id: '',
        teacher_id: profile?.id || '',
    });

    // Early return if no profile - this prevents type issues
    if (!profile) {
        return null; // or a loading spinner
    }

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
    }, []);

    useEffect(() => {
        setFilters({ search_query: searchQuery });
    }, [searchQuery, setFilters]);

    const fetchClasses = async () => {
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('id, name')
                .order('name');
            if (error) throw error;
            setClasses(data || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const { data, error } = await supabase
                .from('subjects')
                .select('id, name')
                .order('name');
            if (error) throw error;
            setSubjects(data || []);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        }
    };

    const formatTime = (time: string) => time.includes(':') && time.split(':').length === 2 ? time + ':00' : time;

    const validateEntry = () => {
        return newEntry.day && newEntry.start_time && newEntry.end_time &&
               newEntry.subject && newEntry.room_number && newEntry.class_id;
    };

    const handleAddEntry = async () => {
        if (!validateEntry()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const entryData: CreateTimetableEntry = {
            day: newEntry.day!,
            start_time: formatTime(newEntry.start_time!),
            end_time: formatTime(newEntry.end_time!),
            subject: newEntry.subject!,
            room_number: newEntry.room_number!,
            class_id: newEntry.class_id!,
            teacher_id: newEntry.teacher_id || profile.id,
        };

        const result = await createEntry(entryData);
        if (result) {
            setModalVisible(false);
            resetForm();
        }
    };

    const handleUpdateEntry = async () => {
        if (!editingEntry || !validateEntry()) return;

        const entryData = {
            id: editingEntry.id,
            day: newEntry.day,
            start_time: newEntry.start_time ? formatTime(newEntry.start_time) : undefined,
            end_time: newEntry.end_time ? formatTime(newEntry.end_time) : undefined,
            subject: newEntry.subject,
            room_number: newEntry.room_number,
            class_id: newEntry.class_id,
            teacher_id: newEntry.teacher_id,
        };

        const result = await updateEntry(entryData);
        if (result) {
            setModalVisible(false);
            setEditingEntry(null);
            resetForm();
        }
    };

    const handleDeleteEntry = async (entry: TimetableEntryWithDetails) => {
        Alert.alert(
            'Delete Entry',
            `Delete ${entry.subject_name} class?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteEntry(entry.id);
                        if (success) {
                            setModalVisible(false);
                            setEditingEntry(null);
                            resetForm();
                        }
                    },
                },
            ]
        );
    };

    const resetForm = () => {
        setNewEntry({
            day: undefined,
            start_time: '',
            end_time: '',
            subject: '',
            room_number: '',
            class_id: '',
            teacher_id: profile.id,
        });
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshTimetable();
        setRefreshing(false);
    };

    const getCurrentWeekDates = () => {
        const startOfWeek = new Date(currentWeek);
        startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);
        return DAYS_ORDER.map((_, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            return date;
        });
    };

    const handleEditEntry = (entry: TimetableEntryWithDetails) => {
        setEditingEntry(entry);
        
        const formatTimeForInput = (time: string) => time.substring(0, 5);

        setNewEntry({
            day: entry.day,
            start_time: formatTimeForInput(entry.start_time),
            end_time: formatTimeForInput(entry.end_time),
            subject: entry.subject_name,
            room_number: entry.room_number,
            class_id: entry.class_id,
            teacher_id: entry.teacher_id,
        });
        setModalVisible(true);
    };

    if (error && !loading) {
        return <ErrorState error={error} colors={colors} refreshTimetable={refreshTimetable} />;
    }

    const weekDates = getCurrentWeekDates();
    const isTeacher = profile.role === 'teacher';

    return (
        <>
            <TopSection />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Header
                    profile={profile}
                    colors={colors}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setModalVisible={setModalVisible}
                    resetForm={resetForm}
                    setEditingEntry={setEditingEntry}
                />
                {isTeacher && ( 
                    <ClassFilter
                        classes={classes}
                        filters={filters}
                        setFilters={setFilters}
                        colors={colors}
                        loading={loading}
                    />
                )}
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.timetableContainer}>
                        {DAYS_ORDER.map((day, dayIndex) => (
                            <DayRow
                                key={day}
                                day={day}
                                dayIndex={dayIndex}
                                weekDates={weekDates}
                                getEntriesForDay={getEntriesForDay}
                                colors={colors}
                                profile={profile}
                                handleEditEntry={handleEditEntry}
                                handleDeleteEntry={handleDeleteEntry}
                            />
                        ))}
                    </View>
                </ScrollView>
                {isTeacher && (
                    <TimetableEntryModal
                        modalVisible={modalVisible}
                        setModalVisible={setModalVisible}
                        editingEntry={editingEntry}
                        setEditingEntry={setEditingEntry}
                        newEntry={newEntry}
                        setNewEntry={setNewEntry}
                        profile={profile}
                        colors={colors}
                        classes={classes}
                        subjects={subjects}
                        teachers={[]}
                        handleAddEntry={handleAddEntry}
                        handleUpdateEntry={handleUpdateEntry}
                        handleDeleteEntry={handleDeleteEntry}
                        resetForm={resetForm}
                    />
                )}
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    timetableContainer: {
        paddingBottom: 40,
    },
});