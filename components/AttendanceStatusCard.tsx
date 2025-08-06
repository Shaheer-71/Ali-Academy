import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';

interface AttendanceStatusCardProps {
  studentName: string;
  rollNumber: string;
  status?: 'present' | 'late' | 'absent';
  arrivalTime?: string;
  lateMinutes?: number;
  onMarkPresent: () => void;
  onMarkLate: () => void;
  onMarkAbsent: () => void;
  onCustomTime: () => void;
}

export const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({
  studentName,
  rollNumber,
  status,
  arrivalTime,
  lateMinutes,
  onMarkPresent,
  onMarkLate,
  onMarkAbsent,
  onCustomTime,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'present':
        return <CheckCircle size={20} color="#10B981" />;
      case 'late':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'absent':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color="#9CA3AF" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'present':
        return '#10B981';
      case 'late':
        return '#F59E0B';
      case 'absent':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.rollNumber}>Roll: {rollNumber}</Text>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          {status && (
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {status.toUpperCase()}
            </Text>
          )}
        </View>
      </View>

      {arrivalTime && (
        <View style={styles.timeInfo}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.timeText}>
            Arrived at {arrivalTime}
            {lateMinutes && ` (${lateMinutes} min late)`}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.presentButton]}
          onPress={onMarkPresent}
        >
          <CheckCircle size={14} color="#ffffff" />
          <Text style={styles.actionButtonText}>Present</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.customTimeButton]}
          onPress={onCustomTime}
        >
          <Clock size={14} color="#ffffff" />
          <Text style={styles.actionButtonText}>Custom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.absentButton]}
          onPress={onMarkAbsent}
        >
          <XCircle size={14} color="#ffffff" />
          <Text style={styles.actionButtonText}>Absent</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 4,
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
  actionButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
});