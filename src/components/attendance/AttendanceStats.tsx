// components/attendance/AttendanceStats.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AttendanceStats as StatsType } from '@/src/types/attendance';

interface AttendanceStatsProps {
    stats: StatsType;
}

export const AttendanceStats: React.FC<AttendanceStatsProps> = ({ stats }) => {
    const { colors } = useTheme();

    return (
        <>
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <CheckCircle size={24} color="#10B981" />
                    <Text allowFontScaling={false} style={[styles.statNumber, { color: colors.text }]}>{stats.presentDays}</Text>
                    <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <AlertCircle size={24} color="#F59E0B" />
                    <Text allowFontScaling={false} style={[styles.statNumber, { color: colors.text }]}>{stats.lateDays}</Text>
                    <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <XCircle size={24} color="#EF4444" />
                    <Text allowFontScaling={false} style={[styles.statNumber, { color: colors.text }]}>{stats.absentDays}</Text>
                    <Text allowFontScaling={false} style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                </View>
            </View>

            <View style={[styles.attendanceRateCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <Text allowFontScaling={false} style={[styles.attendanceRateTitle, { color: colors.text }]}>Overall Attendance Rate</Text>
                <Text allowFontScaling={false} style={[styles.attendanceRateValue, { color: colors.primary }]}>{stats.attendanceRate}%</Text>
                <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${stats.attendanceRate}%`, backgroundColor: colors.primary },
                        ]}
                    />
                </View>
                <Text allowFontScaling={false} style={[styles.attendanceRateSubtext, { color: colors.textSecondary }]}>
                    {stats.presentDays + stats.lateDays} out of {stats.totalDays} days
                </Text>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        // paddingHorizontal: 24,
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontFamily: 'Inter-SemiBold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        marginTop: 4,
    },
    attendanceRateCard: {
        // marginHorizontal: 24,
        marginBottom: 24,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    attendanceRateTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    attendanceRateValue: {
        fontSize: 32,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    attendanceRateSubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
});