// components/attendance/DateSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface DateSelectorProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
    selectedDate,
    onDateChange,
}) => {
    const { colors } = useTheme();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        onDateChange(today);
    };

    return (
        <View style={styles.dateSelection}>
            <TouchableOpacity
                style={[styles.changeDateButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={setToday}
            >
                <Calendar size={16} color={colors.primary} />
                <Text style={[styles.changeDateText, { color: colors.primary }]}>Today</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    dateSelection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    changeDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    changeDateText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
});