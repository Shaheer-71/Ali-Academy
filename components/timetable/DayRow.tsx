import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import TimeSlot from './TimeSlot';
import { DAYS_SHORT, TimetableEntryWithDetails, DayOfWeek, UserProfile, ThemeColors } from '@/types/timetable';

interface DayRowProps {
    day: DayOfWeek;
    dayIndex: number;
    weekDates: Date[];
    getEntriesForDay: (day: DayOfWeek) => TimetableEntryWithDetails[];
    colors: ThemeColors;
    profile: UserProfile | null;
    handleEditEntry: (entry: TimetableEntryWithDetails) => void;
    handleDeleteEntry: (entry: TimetableEntryWithDetails) => void;
}

export default function DayRow({
    day,
    dayIndex,
    weekDates,
    getEntriesForDay,
    colors,
    profile,
    handleEditEntry,
    handleDeleteEntry
}: DayRowProps) {
    const dayEntries = getEntriesForDay(day);
    // Safe to access weekDates[dayIndex] as dayIndex aligns with DAYS_ORDER
    const dayDate = weekDates[dayIndex];
    const isToday = dayDate.toDateString() === new Date().toDateString();

    return (
        <View style={styles.dayRow}>
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
                    {DAYS_SHORT[day]}
                </Text>
                <Text style={[
                    styles.dayDate,
                    { color: colors.primary },
                    isToday && { color: '#b6d509' }
                ]}>
                    {dayDate.getDate()}
                </Text>
            </View>
            <View style={styles.timeSlots}>
                {dayEntries.length === 0 ? (
                    <View style={[styles.emptyDay, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <Calendar size={24} color={colors.textSecondary} />
                        <Text style={[styles.emptyDayText, { color: colors.textSecondary }]}>No classes scheduled</Text>
                    </View>
                ) : (
                    dayEntries.slice(0, 3).map((entry, index) => (
                        <TimeSlot
                            key={entry.id}
                            entry={entry}
                            index={index}
                            colors={colors}
                            profile={profile}
                            handleEditEntry={handleEditEntry}
                            handleDeleteEntry={handleDeleteEntry}
                            isFirst={index === 0}
                            isLast={index === dayEntries.length - 1}
                        />
                    ))
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
});