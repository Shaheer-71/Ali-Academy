import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Plus } from 'lucide-react-native';
import { TimetableCard } from './TimetableCard';

interface TimetableEntry {
    id: string;
    day: string;
    start_time: string;
    end_time: string;
    subject: string;
    room_number: string;
    teacher_name?: string;
    class_name?: string;
}

interface TimetableGridProps {
    timetable: TimetableEntry[];
    weekDates: Date[];
    onAddEntry?: (day: string) => void;
    canEdit?: boolean;
    selectedClass?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
    timetable,
    weekDates,
    onAddEntry,
    canEdit = false,
    selectedClass,
}) => {
    const getEntriesForDay = (day: string) => {
        return timetable
            .filter(entry =>
                entry.day === day &&
                (!selectedClass || entry.class_name === selectedClass)
            )
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .slice(0, 3); // Max 3 classes per day
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.grid}>
                {DAYS.map((day, dayIndex) => {
                    const dayEntries = getEntriesForDay(day);
                    const dayDate = weekDates[dayIndex];
                    const isToday = dayDate && dayDate.toDateString() === new Date().toDateString();

                    return (
                        <View key={day} style={styles.dayColumn}>
                            {/* Day Header - Vertical Layout */}
                            <View style={[
                                styles.dayHeader,
                                isToday && styles.todayHeader
                            ]}>
                                <Text style={[
                                    styles.dayName,
                                    isToday && styles.todayText
                                ]}>
                                    {day}
                                </Text>
                                <Text style={[
                                    styles.dayDate,
                                    isToday && styles.todayDateText
                                ]}>
                                    {dayDate ? dayDate.getDate() : ''}
                                </Text>
                            </View>

                            {/* Time Slots - Horizontal Scroll */}
                            <View style={styles.timeSlotsContainer}>
                                {dayEntries.length === 0 ? (
                                    <View style={styles.emptyDay}>
                                        <Calendar size={20} color="#9CA3AF" />
                                        <Text style={styles.emptyDayText}>No classes</Text>
                                        {canEdit && onAddEntry && (
                                            <TouchableOpacity
                                                style={styles.addClassButton}
                                                onPress={() => onAddEntry(day)}
                                            >
                                                <Plus size={12} color="#274d71" />
                                                <Text style={styles.addClassText}>Add</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ) : (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.timeSlots}
                                    >
                                        {dayEntries.map((entry, index) => (
                                            <View key={entry.id} style={styles.timeSlotWrapper}>
                                                <TimetableCard
                                                    entry={entry}
                                                    isFirst={index === 0}
                                                    isLast={index === dayEntries.length - 1}
                                                />
                                            </View>
                                        ))}

                                        {/* Add button for additional classes */}
                                        {canEdit && onAddEntry && dayEntries.length < 3 && (
                                            <TouchableOpacity
                                                style={styles.addSlotButton}
                                                onPress={() => onAddEntry(day)}
                                            >
                                                <Plus size={20} color="#274d71" />
                                                <Text style={styles.addSlotText}>Add Class</Text>
                                            </TouchableOpacity>
                                        )}
                                    </ScrollView>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    grid: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    dayColumn: {
        marginBottom: 20,
    },
    dayHeader: {
        width: 80,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignSelf: 'flex-start',
    },
    todayHeader: {
        backgroundColor: '#274d71',
        borderColor: '#274d71',
    },
    dayName: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'center',
    },
    todayText: {
        color: '#ffffff',
    },
    dayDate: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: '#274d71',
    },
    todayDateText: {
        color: '#b6d509',
    },
    timeSlotsContainer: {
        marginLeft: 96, // Offset for day header
    },
    timeSlots: {
        gap: 12,
        paddingRight: 16,
    },
    timeSlotWrapper: {
        width: 200,
    },
    emptyDay: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        minHeight: 100,
    },
    emptyDayText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
        marginTop: 6,
        marginBottom: 8,
        textAlign: 'center',
    },
    addClassButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 4,
    },
    addClassText: {
        fontSize: 10,
        fontFamily: 'Inter-Medium',
        color: '#274d71',
    },
    addSlotButton: {
        width: 120,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        gap: 8,
    },
    addSlotText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        color: '#274d71',
    },
});