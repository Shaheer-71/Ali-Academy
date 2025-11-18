// components/ClassFilter.tsx
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ClassFilterProps {
    colors: any;
    selectedClass: string;
    setSelectedClass: (classId: string) => void;
    classes: Array<{ id: string; name: string }>;
}

const ClassFilter: React.FC<ClassFilterProps> = ({
    colors,
    selectedClass,
    setSelectedClass,
    classes,
}) => {
    return (
        <View style={styles.classFilter}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.classButtons}>
                    {classes.map((classItem) => (
                        <TouchableOpacity
                            key={classItem.id}
                            style={[
                                styles.classButton,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                selectedClass === classItem.id && { backgroundColor: colors.secondary, borderColor: colors.secondary },
                            ]}
                            onPress={() => setSelectedClass(classItem.id)}
                        >
                            <Text allowFontScaling={false} style={[
                                styles.classButtonText,
                                { color: colors.text },
                                selectedClass === classItem.id && { color: '#204040' },
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
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
    },
    classButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
});

export default ClassFilter;