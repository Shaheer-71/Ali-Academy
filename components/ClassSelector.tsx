import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BookOpen } from 'lucide-react-native';

interface Class {
  id: string;
  name: string;
  description?: string;
}

interface ClassSelectorProps {
  classes: Class[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  label?: string;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  selectedClassId,
  onSelectClass,
  label = "Select Class",
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.classButtons}>
          {classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={[
                styles.classButton,
                selectedClassId === classItem.id && styles.classButtonSelected,
              ]}
              onPress={() => onSelectClass(classItem.id)}
            >
              <BookOpen 
                size={16} 
                color={selectedClassId === classItem.id ? '#ffffff' : '#374151'} 
              />
              <Text style={[
                styles.classButtonText,
                selectedClassId === classItem.id && styles.classButtonTextSelected,
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
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 24,
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    gap: 6,
  },
  classButtonSelected: {
    backgroundColor: '#274d71',
    borderColor: '#274d71',
  },
  classButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  classButtonTextSelected: {
    color: '#ffffff',
  },
});