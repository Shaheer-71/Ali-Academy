import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, Edit3, BookOpen } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AttendanceRecord } from '@/src/types/attendance';

interface AttendanceRecordCardProps {
    record: AttendanceRecord;
    onEdit?: (record: AttendanceRecord) => void;
    showStudentInfo?: boolean;
}

export const AttendanceRecordCard: React.FC<AttendanceRecordCardProps> = ({
    record,
    onEdit,
    showStudentInfo = false,
}) => {
    const { colors } = useTheme();

    console.log("Attendance Record:", record);

    const getStatusIcon = (status: 'present' | 'late' | 'absent') => {
        switch (status) {
            case 'present': return <CheckCircle size={20} color="#10B981" />;
            case 'late': return <AlertCircle size={20} color="#F59E0B" />;
            case 'absent': return <XCircle size={20} color="#EF4444" />;
        }
    };

    const getStatusColor = (status: 'present' | 'late' | 'absent') => {
        switch (status) {
            case 'present': return '#10B981';
            case 'late': return '#F59E0B';
            case 'absent': return '#EF4444';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Get subject name from the record (already included in the query)
    const subjectName = record.subjects?.name || 'Unknown Subject';
    const className = record.classes?.name || 'Unknown Class';

    return (
        <TouchableOpacity
            style={[styles.attendanceCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => onEdit?.(record)}
            disabled={!onEdit}
        >
            <View style={styles.attendanceHeader}>
                <View style={styles.attendanceDate}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[styles.dateText, { color: colors.text }]}>
                        {formatDate(record.date)}
                    </Text>
                </View>
                <View style={styles.statusBadge}>
                    {getStatusIcon(record.status)}
                    <Text allowFontScaling={false} style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                        {record.status.toUpperCase()}
                    </Text>
                </View>
                {onEdit && (
                    <TouchableOpacity style={styles.editButton}>
                        <Edit3 size={16} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Subject Info - Always show for students to know which class it was */}
            <View style={styles.subjectInfo}>
                <BookOpen size={14} color={colors.textSecondary} />
                <Text allowFontScaling={false} style={[styles.subjectText, { color: colors.textSecondary }]}>
                    {subjectName} • {className}
                </Text>
            </View>

            {showStudentInfo && record.students && (
                <View style={styles.studentInfo}>
                    <Text allowFontScaling={false} style={[styles.studentName, { color: colors.text }]}>
                        {record.students.full_name}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.rollNumber, { color: colors.textSecondary }]}>
                        Roll: {record.students.roll_number}
                    </Text>
                </View>
            )}

            {record.arrival_time && record.status !== 'absent' && (
                <View style={[styles.timeInfo, { borderTopColor: colors.border }]}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[styles.timeText, { color: colors.textSecondary }]}>
                        Arrived at {record.arrival_time}
                        {record.late_minutes && record.late_minutes > 0 && ` (${record.late_minutes} min late)`}
                    </Text>
                </View>
            )}

        </TouchableOpacity>
    );
};

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
    attendanceCard: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    attendanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    attendanceDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: TextSizes.normal,   // using generic size
        fontFamily: 'Inter-Medium',
        marginLeft: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: TextSizes.small,    // smaller badge text
        fontFamily: 'Inter-SemiBold',
    },
    editButton: {
        padding: 6,
    },
    subjectInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 4,
    },
    subjectText: {
        fontSize: TextSizes.small,    // consistent with other labels
        fontFamily: 'Inter-Medium',
    },
    studentInfo: {
        marginBottom: 6,
    },
    studentName: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    rollNumber: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
    },
    timeText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginLeft: 6,
    },
});


// const styles = StyleSheet.create({
//     attendanceCard: {
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 12,
//         borderWidth: 1,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     attendanceHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 8,
//     },
//     attendanceDate: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     dateText: {
//         fontSize: 16,
//         fontFamily: 'Inter-Medium',
//         marginLeft: 8,
//     },
//     statusBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 4,
//     },
//     statusText: {
//         fontSize: 12,
//         fontFamily: 'Inter-SemiBold',
//     },
//     editButton: {
//         padding: 8,
//     },
//     subjectInfo: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 8,
//         gap: 6,
//     },
//     subjectText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//     },
//     studentInfo: {
//         marginBottom: 8,
//     },
//     studentName: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 2,
//     },
//     rollNumber: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//     },
//     timeInfo: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginTop: 8,
//         paddingTop: 8,
//         borderTopWidth: 1,
//     },
//     timeText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         marginLeft: 8,
//     },
// });