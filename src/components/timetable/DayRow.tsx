import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Calendar } from 'lucide-react-native';
import TimeSlot from './TimeSlot';
import { DAYS_SHORT, TimetableEntryWithDetails, DayOfWeek, UserProfile, ThemeColors } from '@/src/types/timetable';

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
    const dayDate = weekDates[dayIndex];
    const isToday = dayDate.toDateString() === new Date().toDateString();

    return (
        <View style={styles.dayRow}>
            <View style={[
                styles.dayHeader,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                isToday && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}>
                <Text allowFontScaling={false} style={[
                    styles.dayName,
                    { color: colors.text },
                    isToday && { color: '#ffffff' }
                ]}>
                    {DAYS_SHORT[day]}
                </Text>
                <Text allowFontScaling={false} style={[
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
                        <Text allowFontScaling={false} style={[styles.emptyDayText, { color: colors.textSecondary }]}>No classes scheduled</Text>
                    </View>
                ) : (
                    dayEntries.map((entry, index) => (
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

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
    dayRow: {
        flexDirection: 'row',
        marginBottom: Platform.OS === 'android' ? 12 : 20,
        minHeight: Platform.OS === 'android' ? 80 : 120,
    },
    dayHeader: {
        width: Platform.OS === 'android' ? 60 : 80,
        borderRadius: 12,
        padding: Platform.OS === 'android' ? 8 : 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Platform.OS === 'android' ? 10 : 16,
        borderWidth: 1,
    },
    dayName: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        marginBottom: Platform.OS === 'android' ? 2 : 4,
        textAlign: 'center',
    },
    dayDate: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
    },
    timeSlots: {
        flex: 1,
        gap: Platform.OS === 'android' ? 6 : 8,
    },
    emptyDay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: Platform.OS === 'android' ? 14 : 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyDayText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        marginTop: Platform.OS === 'android' ? 4 : 8,
        textAlign: 'center',
    },
});
