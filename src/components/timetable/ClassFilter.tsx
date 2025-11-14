// ClassFilter.tsx - FIXED
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Class, TimetableFilters, ThemeColors } from '@/src/types/timetable';

interface ClassFilterProps {
    classes: Class[];
    filters: TimetableFilters;
    setFilters: (filters: Partial<TimetableFilters>) => void;
    colors: ThemeColors;
    loading: boolean;
}

export default function ClassFilter({ classes, filters, setFilters, colors, loading }: ClassFilterProps) {
    return (
        <View style={styles.classFilter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.classButtons}>
                    {classes.map((classItem) => {
                        const isSelected = filters.class_id === classItem.id;
                        return (
                            <TouchableOpacity
                                key={classItem.id}
                                style={[
                                    styles.classButton,
                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => setFilters({ class_id: classItem.id })}
                            >
                                <Text allowFontScaling={false} style={[
                                    styles.classButtonText,
                                    { color: colors.text },
                                    isSelected && { color: '#ffffff' },
                                ]}>
                                    {classItem.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
            {loading && (
                <View style={styles.loadingIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            )}
        </View>
    );
}

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
    classFilter: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    classButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    classButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    classButtonText: {
        fontSize: TextSizes.medium, // updated from 14
        fontFamily: 'Inter-Medium',
    },
    loadingIndicator: {
        alignItems: 'center',
        paddingVertical: 12,
    },
});
