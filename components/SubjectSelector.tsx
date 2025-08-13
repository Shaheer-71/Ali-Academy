import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from 'react-native';
import { BookOpen, ChevronDown, Plus, X } from 'lucide-react-native';

interface SubjectSelectorProps {
  label: string;
  value: string;
  onSubjectSelect: (subject: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
}

const COMMON_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Computer Science',
  'History',
  'Geography',
  'Islamic Studies',
  'Urdu',
  'Art & Craft',
  'Physical Education',
  'Economics',
  'Psychology',
  'Sociology',
];

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  label,
  value,
  onSubjectSelect,
  placeholder = "Select subject",
  allowCustom = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSubjectSelect = (subject: string) => {
    onSubjectSelect(subject);
    setModalVisible(false);
    setShowCustomInput(false);
    setCustomSubject('');
  };

  const handleCustomSubject = () => {
    if (customSubject.trim()) {
      handleSubjectSelect(customSubject.trim());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.subjectButton}
        onPress={() => setModalVisible(true)}
      >
        <BookOpen size={16} color="#6B7280" />
        <Text style={[styles.subjectText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setShowCustomInput(false);
                  setCustomSubject('');
                }}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.subjectList}>
              {/* Custom Subject Input */}
              {allowCustom && (
                <View style={styles.customSection}>
                  {!showCustomInput ? (
                    <TouchableOpacity
                      style={styles.addCustomButton}
                      onPress={() => setShowCustomInput(true)}
                    >
                      <Plus size={16} color="#274d71" />
                      <Text style={styles.addCustomText}>Add Custom Subject</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.customInputContainer}>
                      <TextInput
                        style={styles.customInput}
                        value={customSubject}
                        onChangeText={setCustomSubject}
                        placeholder="Enter custom subject"
                        placeholderTextColor="#9CA3AF"
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.customSubmitButton}
                        onPress={handleCustomSubject}
                      >
                        <Text style={styles.customSubmitText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Common Subjects */}
              <View style={styles.subjectsGrid}>
                {COMMON_SUBJECTS.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectOption,
                      value === subject && styles.selectedSubjectOption,
                    ]}
                    onPress={() => handleSubjectSelect(subject)}
                  >
                    <BookOpen 
                      size={16} 
                      color={value === subject ? "#ffffff" : "#274d71"} 
                    />
                    <Text style={[
                      styles.subjectOptionText,
                      value === subject && styles.selectedSubjectOptionText,
                    ]}>
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  subjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  subjectText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subjectList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  addCustomText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#274d71',
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  customSubmitButton: {
    backgroundColor: '#274d71',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    minWidth: '45%',
  },
  selectedSubjectOption: {
    backgroundColor: '#274d71',
    borderColor: '#274d71',
  },
  subjectOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  selectedSubjectOptionText: {
    color: '#ffffff',
  },
});