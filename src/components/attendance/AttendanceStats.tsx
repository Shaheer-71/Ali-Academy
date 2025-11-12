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


import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 8,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statNumber: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        marginTop: 4,
    },
    statLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        marginTop: 2,
    },
    attendanceRateCard: {
        marginBottom: 16,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    attendanceRateTitle: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
        textAlign: 'center',
    },
    attendanceRateValue: {
        fontSize: TextSizes.xlarge,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
        textAlign: 'center',
    },
    progressBarContainer: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    attendanceRateSubtext: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
});