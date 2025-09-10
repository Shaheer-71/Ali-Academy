// src/components/ClassSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Class } from '@/src/types/lectures';

interface ClassSelectorProps {
    classes: Class[];
    selectedClassId?: string;
    onClassSelect: (classId: string) => void;
    loading?: boolean;
}

export default function ClassSelector({ classes, selectedClassId, onClassSelect, loading }: ClassSelectorProps) {
    const { colors } = useTheme();
    const isAllClassesSelected = !selectedClassId;

    return (
        <View style={styles.classFilter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.classButtons}>
                    <TouchableOpacity
                        style={[
                            styles.classButton,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                            isAllClassesSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => onClassSelect('')}
                    >
                        <Text
                            style={[
                                styles.classButtonText,
                                { color: colors.text },
                                isAllClassesSelected && { color: '#ffffff' },
                            ]}
                        >
                            All Classes
                        </Text>
                    </TouchableOpacity>

                    {classes.map((classItem) => {
                        const isSelected = selectedClassId === classItem.id;
                        return (
                            <TouchableOpacity
                                key={classItem.id}
                                style={[
                                    styles.classButton,
                                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                ]}
                                onPress={() => onClassSelect(classItem.id)}
                            >
                                <Text
                                    style={[
                                        styles.classButtonText,
                                        { color: colors.text },
                                        isSelected && { color: '#ffffff' },
                                    ]}
                                >
                                    {classItem.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
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
});