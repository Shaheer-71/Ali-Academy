import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, MapPin, User, BookOpen, Calendar } from 'lucide-react-native';

interface TimetableEntry {
  id: string;
  start_time: string;
  end_time: string;
  subject: string;
  room_number: string;
  teacher_name?: string;
}

interface DayScheduleCardProps {
  day: string;
  date: Date;
  entries: TimetableEntry[];
  isToday?: boolean;
  onAddEntry?: () => void;
  canEdit?: boolean;
}

export const DayScheduleCard: React.FC<DayScheduleCardProps> = ({
  day,
  date,
  entries,
  isToday = false,
  onAddEntry,
  canEdit = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Day Header */}
      <View style={[styles.dayHeader, isToday && styles.todayHeader]}>
        <Text allowFontScaling={false} style={[styles.dayName, isToday && styles.todayText]}>
          {day}
        </Text>
        <Text allowFontScaling={false} style={[styles.dayDate, isToday && styles.todayDateText]}>
          {date.getDate()}
        </Text>
        <Text allowFontScaling={false} style={[styles.dayMonth, isToday && styles.todayText]}>
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </Text>
      </View>

      {/* Schedule Content */}
      <View style={styles.scheduleContent}>
        {entries.length === 0 ? (
          <View style={styles.emptySchedule}>
            <Calendar size={32} color="#9CA3AF" />
            <Text allowFontScaling={false} style={styles.emptyText}>No classes</Text>
            <Text allowFontScaling={false} style={styles.emptySubtext}>scheduled for today</Text>
            {canEdit && onAddEntry && (
              <TouchableOpacity style={styles.addButton} onPress={onAddEntry}>
                <Text allowFontScaling={false} style={styles.addButtonText}>Add Class</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={[
                styles.entryCard,
                index === 0 && styles.firstEntry,
                index === entries.length - 1 && styles.lastEntry,
              ]}>
                <View style={styles.entryHeader}>
                  <View style={styles.timeContainer}>
                    <Clock size={12} color="#274d71" />
                    <Text allowFontScaling={false} style={styles.timeText}>
                      {entry.start_time} - {entry.end_time}
                    </Text>
                  </View>
                  <View style={styles.roomBadge}>
                    <MapPin size={8} color="#274d71" />
                    <Text allowFontScaling={false} style={styles.roomText}>{entry.room_number}</Text>
                  </View>
                </View>
                
                <Text allowFontScaling={false} style={styles.subjectText}>{entry.subject}</Text>
                
                {entry.teacher_name && (
                  <View style={styles.teacherContainer}>
                    <User size={10} color="#6B7280" />
                    <Text allowFontScaling={false} style={styles.teacherText}>{entry.teacher_name}</Text>
                  </View>
                )}
              </View>
            ))}
            
            {canEdit && onAddEntry && entries.length < 3 && (
              <TouchableOpacity style={styles.addEntryButton} onPress={onAddEntry}>
                <Text allowFontScaling={false} style={styles.addEntryText}>+ Add Class</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  dayHeader: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  todayHeader: {
    backgroundColor: '#274d71',
  },
  dayName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  todayText: {
    color: '#ffffff',
  },
  dayDate: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
    marginBottom: 2,
  },
  todayDateText: {
    color: '#b6d509',
  },
  dayMonth: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  scheduleContent: {
    padding: 20,
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#274d71',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  firstEntry: {
    borderLeftWidth: 4,
    borderLeftColor: '#b6d509',
  },
  lastEntry: {
    borderRightWidth: 4,
    borderRightColor: '#274d71',
  },
  entryHeader: {
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
  subjectText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  addEntryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addEntryText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});