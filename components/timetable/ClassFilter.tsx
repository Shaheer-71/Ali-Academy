import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Class, TimetableFilters, ThemeColors } from '@/types/timetable';

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
                    <TouchableOpacity
                        style={[
                            styles.classButton,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                            !filters.class_id && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setFilters({ class_id: undefined })}
                    >
                        <Text style={[
                            styles.classButtonText,
                            { color: colors.text },
                            !filters.class_id && { color: '#ffffff' },
                        ]}>
                            All Classes
                        </Text>
                    </TouchableOpacity>
                    {classes.map((classItem) => (
                        <TouchableOpacity
                            key={classItem.id}
                            style={[
                                styles.classButton,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                filters.class_id === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setFilters({ class_id: classItem.id })}
                        >
                            <Text style={[
                                styles.classButtonText,
                                { color: colors.text },
                                filters.class_id === classItem.id && { color: '#ffffff' },
                            ]}>
                                {classItem.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
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
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    loadingIndicator: {
        alignItems: 'center',
        paddingVertical: 12,
    },
});