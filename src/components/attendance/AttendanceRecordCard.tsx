import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Edit3 } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AttendanceRecord } from '@/src/types/attendance';
import { TextSizes } from '@/src/styles/TextSizes';

interface AttendanceRecordCardProps {
    record: AttendanceRecord;
    onEdit?: (record: AttendanceRecord) => void;
    showStudentInfo?: boolean;
}

const STATUS_COLOR = {
    present: '#10B981',
    late:    '#F59E0B',
    absent:  '#EF4444',
};

const STATUS_LABEL = {
    present: 'Present',
    late:    'Late',
    absent:  'Absent',
};

const formatDate = (dateString: string) => {
    try {
        const [y, m, d] = dateString.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
        });
    } catch { return dateString; }
};

export const AttendanceRecordCard: React.FC<AttendanceRecordCardProps> = ({
    record,
    onEdit,
    showStudentInfo = false,
}) => {
    const { colors } = useTheme();
    const statusColor = STATUS_COLOR[record.status];
    const className = record.classes?.name ?? '';

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => onEdit?.(record)}
            disabled={!onEdit}
            activeOpacity={onEdit ? 0.7 : 1}
        >
            {/* Colored left strip */}
            <View style={[styles.strip, { backgroundColor: statusColor }]} />

            <View style={styles.body}>
                {/* Row 1 — name / class label  +  date */}
                <View style={styles.row}>
                    <Text
                        allowFontScaling={false}
                        style={[styles.primary, { color: colors.text }]}
                        numberOfLines={1}
                    >
                        {showStudentInfo && record.students
                            ? record.students.full_name
                            : className}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.date, { color: colors.textSecondary }]}>
                        {formatDate(record.date)}
                    </Text>
                </View>

                {/* Row 2 — meta  +  status pill */}
                <View style={[styles.row, styles.metaRow]}>
                    <Text
                        allowFontScaling={false}
                        style={[styles.meta, { color: colors.textSecondary }]}
                        numberOfLines={1}
                    >
                        {showStudentInfo && record.students
                            ? `Roll ${record.students.roll_number}${className ? `  ·  ${className}` : ''}`
                            : ''}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
                        <View style={[styles.dot, { backgroundColor: statusColor }]} />
                        <Text allowFontScaling={false} style={[styles.badgeText, { color: statusColor }]}>
                            {STATUS_LABEL[record.status]}
                        </Text>
                    </View>
                </View>

                {/* Row 3 — arrival time (optional) */}
                {record.arrival_time && record.status !== 'absent' && (
                    <View style={styles.timeRow}>
                        <Clock size={11} color={colors.textSecondary} />
                        <Text allowFontScaling={false} style={[styles.time, { color: colors.textSecondary }]}>
                            {record.arrival_time}
                            {record.late_minutes && record.late_minutes > 0
                                ? `  ·  ${record.late_minutes} min late` : ''}
                        </Text>
                    </View>
                )}
            </View>

            {/* Edit icon */}
            {onEdit && (
                <View style={styles.editWrap}>
                    <Edit3 size={14} color={colors.textSecondary} />
                </View>
            )}
        </TouchableOpacity>
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
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaRow: {
        gap: 6,
    },
    primary: {
        flex: 1,
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        marginRight: 8,
    },
    date: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        flexShrink: 0,
    },
    meta: {
        flex: 1,
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginRight: 6,
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
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    time: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    editWrap: {
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
});
