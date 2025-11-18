// TimetableScreen.tsx - COMPLETE FIX
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, StyleSheet, Alert, View, TouchableOpacity, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTimetable } from '@/src/hooks/useTimetable';
import TopSection from '@/src/components/common/TopSections';
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
import { useFocusEffect } from '@react-navigation/native';
import { Animated } from 'react-native';
import { useScreenAnimation, useButtonAnimation } from '@/src/utils/animations';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function TimetableScreen() {
    const { profile, student } = useAuth();
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
    const [refreshing, setRefreshing] = useState(false);
    const screenStyle = useScreenAnimation();
    const ButtonAnimation = useButtonAnimation();

    const [newEntry, setNewEntry] = useState<Partial<CreateTimetableEntry>>({
        day: undefined,
        start_time: '',
        end_time: '',
        subject: '',
        room_number: '',
        class_id: '',
        teacher_id: profile?.id || '',
    });

    if (!profile) {
        return null;
    }

    const isTeacher = profile.role === 'teacher';
    const isStudent = profile.role === 'student';

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
    }, [profile]);

    const fetchClasses = async () => {
        try {
            if (isTeacher) {
                // Get classes from teacher_subject_enrollments
                const { data: teacherEnrollments, error: enrollmentError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('class_id')
                    .eq('teacher_id', profile.id)
                    .eq('is_active', true);

                if (enrollmentError) {
                    console.warn('Error fetching teacher enrollments:', enrollmentError);
                    throw enrollmentError;
                }

                if (!teacherEnrollments || teacherEnrollments.length === 0) {
                    setClasses([]);
                    return;
                }

                const classIds = [...new Set(teacherEnrollments.map(e => e.class_id))];
                console.log('📚 Teacher enrolled class IDs:', classIds);

                const { data, error } = await supabase
                    .from('classes')
                    .select('id, name')
                    .in('id', classIds)
                    .order('name');

                if (error) throw error;
                setClasses(data || []);

                // Set first class as default filter
                if (data && data.length > 0) {
                    setFilters({ class_id: data[0].id });
                }
            } else if (isStudent && student?.class_id) {
                // For students, get their own class
                const { data, error } = await supabase
                    .from('classes')
                    .select('id, name')
                    .eq('id', student.class_id)
                    .single();

                if (error) throw error;
                if (data) {
                    setClasses([data]);
                    setFilters({ class_id: data.id });
                }
            }
        } catch (error) {
            console.warn('Error fetching classes:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            if (isTeacher) {
                // Get subjects from teacher_subject_enrollments based on selected class
                const classId = filters.class_id || classes[0]?.id;

                if (!classId) {
                    setSubjects([]);
                    return;
                }

                const { data: teacherEnrollments, error: enrollmentError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('subject_id')
                    .eq('teacher_id', profile.id)
                    .eq('class_id', classId)
                    .eq('is_active', true);

                if (enrollmentError) {
                    console.warn('Error fetching teacher subject enrollments:', enrollmentError);
                    throw enrollmentError;
                }

                if (!teacherEnrollments || teacherEnrollments.length === 0) {
                    console.log('No subjects assigned to teacher for this class');
                    setSubjects([]);
                    return;
                }

                const subjectIds = [...new Set(teacherEnrollments.map(e => e.subject_id))];
                console.log('📚 Teacher enrolled subject IDs for class:', subjectIds);

                const { data, error } = await supabase
                    .from('subjects')
                    .select('id, name')
                    .in('id', subjectIds)
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;
                setSubjects(data || []);
            } else if (isStudent && student?.id) {
                // For students, get subjects from student_subject_enrollments
                const { data: studentEnrollments, error: enrollmentError } = await supabase
                    .from('student_subject_enrollments')
                    .select('subject_id')
                    .eq('student_id', student.id)
                    .eq('is_active', true);

                if (enrollmentError) {
                    console.warn('Error fetching student enrollments:', enrollmentError);
                    throw enrollmentError;
                }

                if (!studentEnrollments || studentEnrollments.length === 0) {
                    setSubjects([]);
                    return;
                }

                const subjectIds = [...new Set(studentEnrollments.map(e => e.subject_id))];

                const { data, error } = await supabase
                    .from('subjects')
                    .select('id, name')
                    .in('id', subjectIds)
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;
                setSubjects(data || []);
            }
        } catch (error) {
            console.warn('Error fetching subjects:', error);
        }
    };

    // Refetch subjects when class filter changes
    useEffect(() => {
        if (filters.class_id && isTeacher) {
            fetchSubjects();
        }
    }, [filters.class_id]);

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
            class_id: filters.class_id || '',
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

    const handleAddButtonPress = () => {
        if (!filters.class_id) {
            Alert.alert('Select Class', 'Please select a class first');
            return;
        }
        resetForm();
        setEditingEntry(null);
        setModalVisible(true);
    };

    if (error && !loading) {
        return <ErrorState error={error} colors={colors} refreshTimetable={refreshTimetable} />;
    }

    useFocusEffect(
        useCallback(() => {
            onRefresh();
        }, [profile])
    );

    const weekDates = getCurrentWeekDates();

    return (
        <>

            <TopSection />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Animated.View style={[{ flex: 1 }, screenStyle]}>

                    {/* Class Filter with Add Button (for teachers) */}
                    {isTeacher && classes.length > 0 && (
                        <View style={styles.filterRow}>
                            <View style={styles.classFilterWrapper}>
                                <ClassFilter
                                    classes={classes}
                                    filters={filters}
                                    setFilters={setFilters}
                                    colors={colors}
                                    // loading={loading}
                                />
                            </View>
                            {isTeacher && profile.email === "rafeh@aliacademy.edu..." && classes.length > 0 && (
                                <TouchableOpacity
                                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                                    onPress={handleAddButtonPress}
                                >
                                    <Plus size={20} color="#ffffff" />
                                </TouchableOpacity>
                            )}

                        </View>
                    )}

                    {/* For students - just show their class name */}
                    {/* {isStudent && student?.class_id && (
                    <View style={styles.studentClassInfo}>
                        <Text allowFontScaling={false} style={[styles.studentClassText, { color: colors.text }]}>
                            {classes[0]?.name || 'Your Class Schedule'}
                        </Text>
                    </View>
                )} */}

                    {/* Empty State for Teachers with No Classes */}
                    {isTeacher && classes.length === 0 && !loading && (
                        <View style={styles.emptyState}>
                            <Text allowFontScaling={false} style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                No classes assigned to you yet
                            </Text>
                        </View>
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
                </Animated.View>

            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
        marginTop: -12,
    },
    pageTitle: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 24,
        gap: 12,
        width: '100%',
    },
    classFilterWrapper: {
        flex: 1,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
        marginBottom: 20,
    },
    addButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    studentClassInfo: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        marginBottom: 12,
    },
    studentClassText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    timetableContainer: {
        paddingBottom: 40,
    },
});