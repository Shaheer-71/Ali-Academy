import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, RefreshControl, StyleSheet, Alert, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTimetable } from '@/hooks/useTimetable';
import TopSection from '@/components/TopSections';
import Header from '@/components/timetable/Header';
import ClassFilter from '@/components/timetable/ClassFilter';
import DayRow from '@/components/timetable/DayRow';
import TimetableEntryModal from '@/components/timetable/TimetableEntryModal';
import ErrorState from '@/components/timetable/ErrorState';
import { supabase } from '@/lib/supabase';
import { Class, Profile, TimetableEntryWithDetails, CreateTimetableEntry, UpdateTimetableEntry, DAYS_ORDER, DayOfWeek, TimetableFilters } from '@/types/timetable';

interface Subject {
    id: string;
    name: string;
}

export default function TimetableScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
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
    const [teachers, setTeachers] = useState<Profile[]>([]);
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

    useEffect(() => {
        console.log('Profile:', profile); // Debugging
        fetchClasses();
        fetchSubjects();
        if (profile?.role === 'admin') {
            fetchTeachers();
        }
    }, [profile]);

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

    const fetchTeachers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .eq('role', 'teacher')
                .order('full_name');
            if (error) throw error;
            setTeachers(data || []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

    const handleAddEntry = async () => {
        console.log('handleAddEntry called:', newEntry); // Debugging
        if (!newEntry.day || !newEntry.start_time || !newEntry.end_time ||
            !newEntry.subject || !newEntry.room_number || !newEntry.class_id) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        const entryData: CreateTimetableEntry = {
            day: newEntry.day,
            start_time: newEntry.start_time,
            end_time: newEntry.end_time,
            subject: newEntry.subject,
            room_number: newEntry.room_number,
            class_id: newEntry.class_id,
            teacher_id: newEntry.teacher_id || profile!.id,
        };
        const result = await createEntry(entryData);
        if (result) {
            setModalVisible(false);
            resetForm();
        }
    };

    const handleUpdateEntry = async () => {
        console.log('handleUpdateEntry called:', { editingEntry, newEntry }); // Debugging
        if (!editingEntry) return;
        const entryData: UpdateTimetableEntry = {
            id: editingEntry.id,
            day: newEntry.day,
            start_time: newEntry.start_time,
            end_time: newEntry.end_time,
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
        console.log('handleDeleteEntry called:', { entryId: entry.id }); // Debugging
        Alert.alert(
            'Delete Entry',
            `Are you sure you want to delete ${entry.subject} class?`,
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
        console.log('resetForm called'); // Debugging
        setNewEntry({
            day: undefined,
            start_time: '',
            end_time: '',
            subject: '',
            room_number: '',
            class_id: '',
            teacher_id: profile?.id || '',
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

    const weekDates = getCurrentWeekDates();

    if (error && !loading) {
        return <ErrorState error={error} colors={colors} refreshTimetable={refreshTimetable} />;
    }

    return (
        <>
            <TopSection />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
                <Header
                    profile={profile}
                    colors={colors}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setModalVisible={setModalVisible}
                    resetForm={resetForm}
                    setEditingEntry={setEditingEntry}
                />
                {(profile?.role === 'teacher' || profile?.role === 'admin') && (
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
                                handleEditEntry={(entry) => {
                                    console.log('handleEditEntry called:', { entryId: entry.id }); // Debugging
                                    setEditingEntry(entry);
                                    setNewEntry({
                                        day: entry.day,
                                        start_time: entry.start_time,
                                        end_time: entry.end_time,
                                        subject: entry.subject,
                                        room_number: entry.room_number,
                                        class_id: entry.class_id,
                                        teacher_id: entry.teacher_id,
                                    });
                                    setModalVisible(true);
                                }}
                                handleDeleteEntry={handleDeleteEntry}
                            />
                        ))}
                    </View>
                </ScrollView>
                {(profile?.role === 'teacher' || profile?.role === 'admin') && (
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
                        teachers={teachers}
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
        paddingBottom: 20,
    },
});