// src/components/ClassSelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { BookOpen } from 'lucide-react-native';
import { Class } from '@/src/types/lectures';

interface ClassSelectorProps {
    classes: Class[];
    selectedClassId?: string;
    onClassSelect: (classId: string) => void;
}

export default function ClassSelector({ classes, selectedClassId, onClassSelect }: ClassSelectorProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                {/* All Classes Option */}
                <TouchableOpacity
                    style={[
                        styles.classOption,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        !selectedClassId && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => onClassSelect('')}
                >
                    {/* <BookOpen size={16} color={!selectedClassId ? '#ffffff' : colors.textSecondary} />  */}
                    <Text
                        style={[
                            styles.classOptionText,
                            { color: colors.text },
                            !selectedClassId && { color: '#ffffff' },
                        ]}
                    >
                        All Classes
                    </Text>
                </TouchableOpacity>

                {/* Individual Classes */}
                {classes.map((classItem) => (
                    <TouchableOpacity
                        key={classItem.id}
                        style={[
                            styles.classOption,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                            selectedClassId === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => onClassSelect(classItem.id)}
                    >
                        {/* <BookOpen size={16} color={selectedClassId === classItem.id ? '#ffffff' : colors.textSecondary} /> */}
                        <Text
                            style={[
                                styles.classOptionText,
                                { color: colors.text },
                                selectedClassId === classItem.id && { color: '#ffffff' },
                            ]}
                        >
                            {classItem.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

import { TextSizes } from '@/src/styles/TextSizes';
const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    scrollContainer: {
        paddingHorizontal: 24,
        gap: 12,
    },
    classOption: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 2,
        borderRadius: 12,
        gap: 4,
    },
    classOptionText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
    },
});

// const styles = StyleSheet.create({
//     container: {
//         marginVertical: 16,
//     },
//     scrollContainer: {
//         paddingHorizontal: 24,
//         gap: 12,
//     },
//     classOption: {
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         minWidth: 100,
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         borderWidth: 2,
//         borderRadius: 12,
//         gap: 4,
//     },
//     classOptionText: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//         textAlign: 'center',
//     },
// });