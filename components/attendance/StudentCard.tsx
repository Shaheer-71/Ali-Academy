// components/attendance/StudentCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, XCircle, Clock, Edit3 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

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
    record?: AttendanceRecord; // Temporary attendance record (not yet posted)
    dbRecord?: AttendanceRecord | null; // Database attendance record (already posted)
    isMarkedTemporarily?: boolean; // Student is marked temporarily but not yet posted
    isMarkedInDatabase?: boolean; // Student has attendance record in database for this date
    selectedDate: string;
    onMarkAttendance: (studentId: string, status: 'present' | 'late' | 'absent', arrivalTime?: string) => void;
    onCustomTime: (studentId: string) => void;
    onEdit?: (record: AttendanceRecord) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
    student,
    record,
    dbRecord,
    isMarkedTemporarily = false,
    isMarkedInDatabase = false,
    selectedDate,
    onMarkAttendance,
    onCustomTime,
    onEdit,
}) => {
    const { colors } = useTheme();

    const getStatusIcon = (status: 'present' | 'late' | 'absent' | undefined) => {
        switch (status) {
            case 'present': return <CheckCircle size={20} color="#10B981" />;
            case 'late': return <AlertCircle size={20} color="#F59E0B" />;
            case 'absent': return <XCircle size={20} color="#EF4444" />;
            default: return <Clock size={20} color={colors.textSecondary} />;
        }
    };

    const getStatusColor = (status: 'present' | 'late' | 'absent' | undefined) => {
        switch (status) {
            case 'present': return '#10B981';
            case 'late': return '#F59E0B';
            case 'absent': return '#EF4444';
            default: return colors.textSecondary;
        }
    };

    const getStatusText = (status: 'present' | 'late' | 'absent' | undefined) => {
        switch (status) {
            case 'present': return 'Present';
            case 'late': return 'Late';
            case 'absent': return 'Absent';
            default: return 'Not marked';
        }
    };

    // Primary logic: Buttons are disabled if student already has attendance in database
    const buttonsDisabled = isMarkedInDatabase;
    
    // Determine which record to display (database record takes priority)
    const displayRecord = dbRecord || record;
    
    // Determine the source of the record
    const recordSource = dbRecord ? 'database' : (record ? 'temporary' : 'none');

    return (
        <View style={[
            styles.modernStudentCard, 
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
            isMarkedInDatabase && { borderColor: colors.primary, borderWidth: 2 }
        ]}>
            <View style={styles.studentCardHeader}>
                <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.studentInitial}>{student.full_name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{student.full_name}</Text>
                    <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>Roll: {student.roll_number}</Text>
                </View>
                <View style={styles.statusIndicator}>
                    {getStatusIcon(displayRecord?.status)}
                    {displayRecord && (
                        <Text style={[styles.statusText, { color: getStatusColor(displayRecord.status) }]}>
                            {displayRecord.status?.toUpperCase()}
                        </Text>
                    )}
                </View>
            </View>

            {/* Show arrival time info if available */}
            {displayRecord?.arrival_time && (
                <View style={[styles.timeInfo, { backgroundColor: colors.background }]}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                        Arrived at {displayRecord.arrival_time}
                        {displayRecord.late_minutes && displayRecord.late_minutes > 0 && ` (${displayRecord.late_minutes} min late)`}
                    </Text>
                </View>
            )}

            {/* Status information based on record source */}
            {recordSource === 'temporary' && (
                <View style={[styles.temporaryInfo, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.temporaryText, { color: '#92400E' }]}>
                        📝 Marked as {getStatusText(record?.status)} (Not posted yet)
                    </Text>
                </View>
            )}

            {recordSource === 'database' && (
                <View style={[styles.databaseInfo, { backgroundColor: colors.primary }]}>
                    <Text style={styles.databaseText}>
                        ✅ Attendance recorded for {new Date(selectedDate).toLocaleDateString()}
                    </Text>
                </View>
            )}

            {recordSource === 'none' && (
                <View style={[styles.noRecordInfo, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.noRecordText, { color: colors.textSecondary }]}>
                        ⏳ No attendance marked for {new Date(selectedDate).toLocaleDateString()}
                    </Text>
                </View>
            )}

            {/* Action buttons - disabled if already in database */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[
                        styles.actionButton, 
                        styles.presentButton,
                        buttonsDisabled && styles.disabledButton
                    ]}
                    onPress={() => !buttonsDisabled && onMarkAttendance(student.id, 'present')}
                    disabled={buttonsDisabled}
                    activeOpacity={buttonsDisabled ? 1 : 0.7}
                >
                    <CheckCircle size={16} color={buttonsDisabled ? "#999999" : "#ffffff"} />
                    <Text style={[
                        styles.actionButtonText,
                        buttonsDisabled && styles.disabledButtonText
                    ]}>
                        Present
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.actionButton, 
                        styles.customTimeButton,
                        buttonsDisabled && styles.disabledButton
                    ]}
                    onPress={() => !buttonsDisabled && onCustomTime(student.id)}
                    disabled={buttonsDisabled}
                    activeOpacity={buttonsDisabled ? 1 : 0.7}
                >
                    <Clock size={16} color={buttonsDisabled ? "#999999" : "#ffffff"} />
                    <Text style={[
                        styles.actionButtonText,
                        buttonsDisabled && styles.disabledButtonText
                    ]}>
                        Custom
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.actionButton, 
                        styles.absentButton,
                        buttonsDisabled && styles.disabledButton
                    ]}
                    onPress={() => !buttonsDisabled && onMarkAttendance(student.id, 'absent')}
                    disabled={buttonsDisabled}
                    activeOpacity={buttonsDisabled ? 1 : 0.7}
                >
                    <XCircle size={16} color={buttonsDisabled ? "#999999" : "#ffffff"} />
                    <Text style={[
                        styles.actionButtonText,
                        buttonsDisabled && styles.disabledButtonText
                    ]}>
                        Absent
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Edit button for database records */}
            {isMarkedInDatabase && dbRecord && onEdit && (
                <View style={styles.editContainer}>
                    <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                        onPress={() => onEdit(dbRecord)}
                    >
                        <Edit3 size={16} color={colors.primary} />
                        <Text style={[styles.editButtonText, { color: colors.primary }]}>
                            Edit Database Record
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Helper text for disabled buttons */}
            {buttonsDisabled && (
                <View style={[styles.disabledInfo, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={[styles.disabledInfoText, { color: '#991B1B' }]}>
                        🔒 Buttons disabled - attendance already recorded in database
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    modernStudentCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    studentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    studentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    studentInitial: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    rollNumber: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    statusIndicator: {
        alignItems: 'center',
    },
    statusText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        marginTop: 4,
    },
    timeInfo: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginLeft: 8,
    },
    temporaryInfo: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    temporaryText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
    databaseInfo: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    databaseText: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
    },
    noRecordInfo: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    noRecordText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    presentButton: {
        backgroundColor: '#10B981',
    },
    customTimeButton: {
        backgroundColor: '#274d71',
    },
    absentButton: {
        backgroundColor: '#EF4444',
    },
    disabledButton: {
        backgroundColor: '#E5E7EB',
        opacity: 0.6,
    },
    actionButtonText: {
        color: '#ffffff',
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
    disabledButtonText: {
        color: '#999999',
    },
    editContainer: {
        marginTop: 8,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 12,
        gap: 8,
    },
    editButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    disabledInfo: {
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
        alignItems: 'center',
    },
    disabledInfoText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
});