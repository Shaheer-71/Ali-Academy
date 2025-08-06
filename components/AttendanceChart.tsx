import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface AttendanceData {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
}

interface AttendanceChartProps {
  data: AttendanceData;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  const { totalDays, presentDays, lateDays, absentDays } = data;
  
  const getPercentage = (value: number) => {
    return totalDays > 0 ? Math.round((value / totalDays) * 100) : 0;
  };

  const chartWidth = width - 80;
  const presentWidth = (presentDays / totalDays) * chartWidth;
  const lateWidth = (lateDays / totalDays) * chartWidth;
  const absentWidth = (absentDays / totalDays) * chartWidth;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Overview</Text>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {presentDays > 0 && (
            <View style={[styles.progressSegment, styles.presentSegment, { width: presentWidth }]} />
          )}
          {lateDays > 0 && (
            <View style={[styles.progressSegment, styles.lateSegment, { width: lateWidth }]} />
          )}
          {absentDays > 0 && (
            <View style={[styles.progressSegment, styles.absentSegment, { width: absentWidth }]} />
          )}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.legendText}>Present</Text>
          <Text style={styles.legendValue}>{presentDays} ({getPercentage(presentDays)}%)</Text>
        </View>
        
        <View style={styles.legendItem}>
          <AlertCircle size={16} color="#F59E0B" />
          <Text style={styles.legendText}>Late</Text>
          <Text style={styles.legendValue}>{lateDays} ({getPercentage(lateDays)}%)</Text>
        </View>
        
        <View style={styles.legendItem}>
          <XCircle size={16} color="#EF4444" />
          <Text style={styles.legendText}>Absent</Text>
          <Text style={styles.legendValue}>{absentDays} ({getPercentage(absentDays)}%)</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total Days: {totalDays} • Attendance Rate: {getPercentage(presentDays + lateDays)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressSegment: {
    height: '100%',
  },
  presentSegment: {
    backgroundColor: '#10B981',
  },
  lateSegment: {
    backgroundColor: '#F59E0B',
  },
  absentSegment: {
    backgroundColor: '#EF4444',
  },
  legend: {
    gap: 8,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  legendValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  summary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  summaryText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});