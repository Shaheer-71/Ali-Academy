// components/attendance/ClassSelector.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Class } from '@/types/attendance';

interface ClassSelectorProps {
    classes: Class[];
    selectedClass: string;
    onClassSelect: (classId: string) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
    classes,
    selectedClass,
    onClassSelect,
}) => {
    const { colors } = useTheme();

    return (
        <View style={styles.classSelection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.classButtons}>
                    {classes.map((classItem) => (
                        <TouchableOpacity
                            key={classItem.id}
                            style={[
                                styles.classButton,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                selectedClass === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => onClassSelect(classItem.id)}
                        >
                            <Users size={16} color={selectedClass === classItem.id ? '#ffffff' : colors.text} />
                            <Text style={[
                                styles.classButtonText,
                                { color: colors.text },
                                selectedClass === classItem.id && { color: '#ffffff' },
                            ]}>
                                {classItem.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    classSelection: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    classButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    classButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    classButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
});
