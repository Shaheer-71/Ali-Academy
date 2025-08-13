import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { DayScheduleCard } from './DayScheduleCard';

interface TimetableEntry {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    subject: string;
    room_number: string;
    teacher_name?: string;
}

interface TimetableWeekViewProps {
    timetable: TimetableEntry[];
    currentWeek: Date;
    onWeekChange: (date: Date) => void;
    onAddEntry?: (day: string) => void;
    canEdit?: boolean;
    selectedClass?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableWeekView: React.FC<TimetableWeekViewProps> = ({
    timetable,
    currentWeek,
    onWeekChange,
    onAddEntry,
    canEdit = false,
    selectedClass,
}) => {
    const getCurrentWeekDates = () => {
        const startOfWeek = new Date(currentWeek);
        startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1); // Monday

        return DAYS.map((_, index) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + index);
            return date;
        });
    };

    const getEntriesForDay = (day: string) => {
        return timetable
            .filter(entry =>
                entry.day === day &&
                (!selectedClass || entry?.class_id === selectedClass)
            )
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .slice(0, 3); // Max 3 classes per day
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
        onWeekChange(newWeek);
    };

    const weekDates = getCurrentWeekDates();

    return (
        <View style={styles.container}>
            {/* Week Navigation */}
            <View style={styles.weekNavigation}>
                <TouchableOpacity
                    style={styles.weekNavButton}
                    onPress={() => navigateWeek('prev')}
                >
                    <ChevronLeft size={20} color="#274d71" />
                </TouchableOpacity>

                <Text style={styles.weekText}>
                    {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                    {weekDates[5].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>

                <TouchableOpacity
                    style={styles.weekNavButton}
                    onPress={() => navigateWeek('next')}
                >
                    <ChevronRight size={20} color="#274d71" />
                </TouchableOpacity>
            </View>

            {/* Days Schedule */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {DAYS.map((day, dayIndex) => {
                    const dayEntries = getEntriesForDay(day);
                    const dayDate = weekDates[dayIndex];
                    const isToday = dayDate.toDateString() === new Date().toDateString();

                    return (
                        <DayScheduleCard
                            key={day}
                            day={day}
                            date={dayDate}
                            entries={dayEntries}
                            isToday={isToday}
                            onAddEntry={() => onAddEntry?.(day)}
                            canEdit={canEdit}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    weekText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#111827',
        textAlign: 'center',
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
});