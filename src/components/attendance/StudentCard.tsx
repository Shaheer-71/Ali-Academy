import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X, Edit3, Clock } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { TextSizes } from '@/src/styles/TextSizes';

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    parent_contact: string;
}

interface AttendanceRecord {
    id: string;
    student_id: string;
    class_id: string;
    date: string;
    arrival_time?: string;
    status: 'present' | 'late' | 'absent';
    late_minutes?: number;
}

interface StudentCardProps {
    student: Student;
    record?: AttendanceRecord;
    dbRecord?: AttendanceRecord | null;
    isMarkedTemporarily?: boolean;
    isMarkedInDatabase?: boolean;
    selectedDate: string;
    onMarkAttendance: (studentId: string, status: 'present' | 'late' | 'absent', arrivalTime?: string) => void;
    onEdit?: (record: AttendanceRecord) => void;
}

const STATUS_COLOR: Record<string, string> = {
    present: '#10B981',
    late:    '#F59E0B',
    absent:  '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
    present: 'Present',
    late:    'Late',
    absent:  'Absent',
};

export const StudentCard: React.FC<StudentCardProps> = ({
    student,
    record,
    dbRecord,
    isMarkedTemporarily = false,
    isMarkedInDatabase = false,
    selectedDate,
    onMarkAttendance,
    onEdit,
}) => {
    const { colors } = useTheme();

    const displayRecord = dbRecord || record;
    const status = displayRecord?.status;
    const stripColor = status ? STATUS_COLOR[status] : colors.border;
    const buttonsDisabled = isMarkedInDatabase;

    const initials = student.full_name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <View style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
            isMarkedInDatabase && { borderColor: stripColor },
        ]}>
            {/* Left status strip */}
            <View style={[styles.strip, { backgroundColor: stripColor }]} />

            <View style={styles.body}>
                {/* Header row */}
                <View style={styles.headerRow}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                        <Text allowFontScaling={false} style={[styles.avatarText, { color: colors.primary }]}>
                            {initials}
                        </Text>
                    </View>

                    {/* Name + roll */}
                    <View style={styles.info}>
                        <Text allowFontScaling={false} style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                            {student.full_name}
                        </Text>
                        <Text allowFontScaling={false} style={[styles.roll, { color: colors.textSecondary }]}>
                            Roll {student.roll_number}
                        </Text>
                    </View>

                    {/* Status badge */}
                    {status ? (
                        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] + '18', borderColor: STATUS_COLOR[status] + '40' }]}>
                            <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
                            <Text allowFontScaling={false} style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
                                {STATUS_LABEL[status]}
                            </Text>
                            {isMarkedTemporarily && !isMarkedInDatabase && (
                                <Clock size={10} color={STATUS_COLOR[status]} />
                            )}
                        </View>
                    ) : (
                        <View style={[styles.badge, { backgroundColor: colors.border + '40', borderColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[styles.badgeText, { color: colors.textSecondary }]}>—</Text>
                        </View>
                    )}
                </View>

                {/* Action buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.btn, buttonsDisabled ? styles.btnDisabled : styles.btnPresent]}
                        onPress={() => !buttonsDisabled && onMarkAttendance(student.id, 'present')}
                        disabled={buttonsDisabled}
                        activeOpacity={0.75}
                    >
                        <Check size={13} color={buttonsDisabled ? '#9CA3AF' : '#fff'} />
                        <Text allowFontScaling={false} style={[styles.btnText, buttonsDisabled && styles.btnTextDisabled]}>
                            Present
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, buttonsDisabled ? styles.btnDisabled : styles.btnAbsent]}
                        onPress={() => !buttonsDisabled && onMarkAttendance(student.id, 'absent')}
                        disabled={buttonsDisabled}
                        activeOpacity={0.75}
                    >
                        <X size={13} color={buttonsDisabled ? '#9CA3AF' : '#fff'} />
                        <Text allowFontScaling={false} style={[styles.btnText, buttonsDisabled && styles.btnTextDisabled]}>
                            Absent
                        </Text>
                    </TouchableOpacity>

                    {isMarkedInDatabase && dbRecord && onEdit && (
                        <TouchableOpacity
                            style={[styles.btn, styles.btnEdit, { borderColor: colors.border }]}
                            onPress={() => onEdit(dbRecord)}
                            activeOpacity={0.75}
                        >
                            <Edit3 size={13} color={colors.primary} />
                            <Text allowFontScaling={false} style={[styles.btnText, { color: colors.primary }]}>
                                Edit
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
        overflow: 'hidden',
    },
    strip: {
        width: 4,
    },
    body: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 9,
        gap: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
    },
    info: {
        flex: 1,
        gap: 2,
    },
    name: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
    },
    roll: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
        flexShrink: 0,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    badgeText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-SemiBold',
    },
    actions: {
        flexDirection: 'row',
        gap: 6,
    },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        borderRadius: 8,
        gap: 4,
    },
    btnPresent: { backgroundColor: '#10B981' },
    btnAbsent:  { backgroundColor: '#EF4444' },
    btnDisabled: { backgroundColor: '#F3F4F6' },
    btnEdit: {
        flex: 0,
        paddingHorizontal: 14,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    btnText: {
        color: '#fff',
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
    btnTextDisabled: {
        color: '#9CA3AF',
    },
});
