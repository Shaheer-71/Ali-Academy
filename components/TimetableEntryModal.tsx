import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Clock, BookOpen, MapPin } from 'lucide-react-native';

interface TimetableEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (entry: any) => void;
  classes: any[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimetableEntryModal: React.FC<TimetableEntryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  classes,
}) => {
  const [entry, setEntry] = useState({
    day: '',
    start_time: '',
    end_time: '',
    subject: '',
    room_number: '',
    class_id: '',
  });

  const handleSubmit = () => {
    if (!entry.day || !entry.start_time || !entry.end_time || !entry.subject || !entry.room_number || !entry.class_id) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(entry.start_time) || !timeRegex.test(entry.end_time)) {
      Alert.alert('Error', 'Please enter valid time in HH:MM format');
      return;
    }

    // Check if end time is after start time
    const startMinutes = parseInt(entry.start_time.split(':')[0]) * 60 + parseInt(entry.start_time.split(':')[1]);
    const endMinutes = parseInt(entry.end_time.split(':')[0]) * 60 + parseInt(entry.end_time.split(':')[1]);
    
    if (endMinutes <= startMinutes) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    onSubmit(entry);
    setEntry({
      day: '',
      start_time: '',
      end_time: '',
      subject: '',
      room_number: '',
      class_id: '',
    });
  };

  const handleClose = () => {
    setEntry({
      day: '',
      start_time: '',
      end_time: '',
      subject: '',
      room_number: '',
      class_id: '',
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Timetable Entry</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            {/* Day Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  {DAYS.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.option,
                        entry.day === day && styles.optionSelected,
                      ]}
                      onPress={() => setEntry({ ...entry, day })}
                    >
                      <Text style={[
                        styles.optionText,
                        entry.day === day && styles.optionTextSelected,
                      ]}>
                        {day.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.timeRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Start Time</Text>
                <View style={styles.inputContainer}>
                  <Clock size={16} color="#6B7280" />
                  <TextInput
                    style={styles.timeInput}
                    value={entry.start_time}
                    onChangeText={(text) => setEntry({ ...entry, start_time: text })}
                    placeholder="09:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>End Time</Text>
                <View style={styles.inputContainer}>
                  <Clock size={16} color="#6B7280" />
                  <TextInput
                    style={styles.timeInput}
                    value={entry.end_time}
                    onChangeText={(text) => setEntry({ ...entry, end_time: text })}
                    placeholder="10:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Subject */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject</Text>
              <View style={styles.inputContainer}>
                <BookOpen size={16} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={entry.subject}
                  onChangeText={(text) => setEntry({ ...entry, subject: text })}
                  placeholder="Enter subject name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Room Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Room Number</Text>
              <View style={styles.inputContainer}>
                <MapPin size={16} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={entry.room_number}
                  onChangeText={(text) => setEntry({ ...entry, room_number: text })}
                  placeholder="Enter room number"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Class Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsRow}>
                  {classes.map((classItem) => (
                    <TouchableOpacity
                      key={classItem.id}
                      style={[
                        styles.option,
                        entry.class_id === classItem.id && styles.optionSelected,
                      ]}
                      onPress={() => setEntry({ ...entry, class_id: classItem.id })}
                    >
                      <Text style={[
                        styles.optionText,
                        entry.class_id === classItem.id && styles.optionTextSelected,
                      ]}>
                        {classItem.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add to Timetable</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginLeft: 12,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginLeft: 12,
    textAlign: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#274d71',
    borderColor: '#274d71',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    height: 50,
    backgroundColor: '#274d71',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});