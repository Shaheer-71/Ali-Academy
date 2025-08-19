import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, MapPin, User, BookOpen } from 'lucide-react-native';
import { TimetableEntryWithDetails, UserProfile, ThemeColors } from '@/src/types/timetable';

interface TimeSlotProps {
    entry: TimetableEntryWithDetails;
    index: number;
    colors: ThemeColors;
    handleEditEntry: (entry: TimetableEntryWithDetails) => void;
    handleDeleteEntry: (entry: TimetableEntryWithDetails) => void;
    isFirst: boolean;
    isLast: boolean;
    profile: UserProfile | null;
}

export default function TimeSlot({
    entry,
    index,
    colors,
    profile,
    handleEditEntry,
    handleDeleteEntry,
    isFirst,
    isLast
}: TimeSlotProps) {
    const canPress =  (profile?.role === 'teacher' && entry.teacher_id === profile.id);

    // Convert time from HH:MM:SS to HH:MM format for display
    const formatTime = (time: string) => {
        return time.substring(0, 5); // Remove seconds part
    };

    return (
        <TouchableOpacity
            style={[
                styles.timeSlot,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                isFirst && styles.firstTimeSlot,
                isLast && styles.lastTimeSlot,
            ]}
            onPress={() => {
                console.log('TimeSlot pressed:', { entryId: entry.id, canPress }); // Debugging
                if (canPress) handleEditEntry(entry);
            }}
            disabled={!canPress}
        >
            <View style={styles.timeSlotContent}>
                <View style={styles.timeSlotHeader}>
                    <View style={styles.timeInfo}>
                        <Clock size={14} color={colors.primary} />
                        <Text style={[styles.timeText, { color: colors.primary }]}>
                            {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                        </Text>
                    </View>
                    <View style={styles.timeSlotActions}>
                        <View style={[styles.roomBadge, { backgroundColor: colors.secondary }]}>
                            <MapPin size={10} color="#274d71" />
                            <Text style={styles.roomText}>{entry.room_number}</Text>
                        </View>
                    </View>
                </View>
                <Text style={[styles.subjectText, { color: colors.text }]}>{entry.subject_name}</Text>
                <View style={styles.entryDetails}>
                    {entry.teacher_name && (
                        <View style={styles.teacherInfo}>
                            <User size={12} color={colors.textSecondary} />
                            <Text style={[styles.teacherText, { color: colors.textSecondary }]}>{entry.teacher_name}</Text>
                        </View>
                    )}
                    {entry.class_name && (
                        <View style={styles.classInfo}>
                            <BookOpen size={12} color={colors.textSecondary} />
                            <Text style={[styles.classText, { color: colors.textSecondary }]}>{entry.class_name}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
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
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    timeSlotActions: {
        alignItems: 'flex-end',
        gap: 6,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
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
    entryDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    teacherText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginLeft: 4,
    },
    classInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    classText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginLeft: 4,
    },
});