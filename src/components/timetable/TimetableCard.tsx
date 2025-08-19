import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, MapPin, User, BookOpen } from 'lucide-react-native';

interface TimetableEntry {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  room_number: string;
  teacher_name?: string;
  class_name?: string;
}

interface TimetableCardProps {
  entry: TimetableEntry;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TimetableCard: React.FC<TimetableCardProps> = ({
  entry,
  onPress,
  isFirst = false,
  isLast = false,
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isFirst && styles.firstCard,
        isLast && styles.lastCard,
      ]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Clock size={14} color="#274d71" />
          <Text style={styles.timeText}>
            {entry.start_time} - {entry.end_time}
          </Text>
        </View>
        <View style={styles.roomBadge}>
          <MapPin size={10} color="#274d71" />
          <Text style={styles.roomText}>{entry.room_number}</Text>
        </View>
      </View>
      
      <Text style={styles.subject}>{entry.subject}</Text>
      
      {entry.teacher_name && (
        <View style={styles.teacherContainer}>
          <User size={12} color="#6B7280" />
          <Text style={styles.teacherText}>{entry.teacher_name}</Text>
        </View>
      )}

      {entry.class_name && (
        <View style={styles.classContainer}>
          <BookOpen size={12} color="#6B7280" />
          <Text style={styles.classText}>{entry.class_name}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  firstCard: {
    borderTopWidth: 3,
    borderTopColor: '#b6d509',
  },
  lastCard: {
    borderBottomWidth: 3,
    borderBottomColor: '#274d71',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
    marginLeft: 6,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b6d509',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roomText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
  },
  subject: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teacherText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  classContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
});