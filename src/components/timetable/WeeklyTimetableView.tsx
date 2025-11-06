import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TimetableCard } from './TimetableCard';
import { Calendar } from 'lucide-react-native';

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

interface WeeklyTimetableViewProps {
  timetable: TimetableEntry[];
  weekDates: Date[];
  selectedClass?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const WeeklyTimetableView: React.FC<WeeklyTimetableViewProps> = ({
  timetable,
  weekDates,
  selectedClass,
}) => {
  const getEntriesForDay = (day: string) => {
    return timetable
      .filter(entry => 
        entry.day === day && 
        (selectedClass === '' || !selectedClass || entry.class_name === selectedClass)
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .slice(0, 3); // Max 3 classes per day
  };

  return (
    <View style={styles.container}>
      {DAYS.map((day, dayIndex) => {
        const dayEntries = getEntriesForDay(day);
        const dayDate = weekDates[dayIndex];
        const isToday = dayDate && dayDate.toDateString() === new Date().toDateString();

        return (
          <View key={day} style={styles.dayRow}>
            {/* Day Header - Vertical */}
            <View style={[
              styles.dayHeader,
              isToday && styles.todayHeader
            ]}>
              <Text allowFontScaling={false} style={[
                styles.dayName,
                isToday && styles.todayText
              ]}>
                {day}
              </Text>
              <Text allowFontScaling={false} style={[
                styles.dayDate,
                isToday && styles.todayDateText
              ]}>
                {dayDate ? dayDate.getDate() : ''}
              </Text>
            </View>

            {/* Time Slots - Horizontal */}
            <View style={styles.timeSlotsContainer}>
              {dayEntries.length === 0 ? (
                <View style={styles.emptyDay}>
                  <Calendar size={20} color="#9CA3AF" />
                  <Text allowFontScaling={false} style={styles.emptyDayText}>No classes</Text>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeSlots}
                >
                  {dayEntries.map((entry, index) => (
                    <View key={entry.id} style={styles.timeSlotWrapper}>
                      <TimetableCard
                        entry={entry}
                        isFirst={index === 0}
                        isLast={index === dayEntries.length - 1}
                      />
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: 16,
    minHeight: 100,
  },
  dayHeader: {
    width: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  todayHeader: {
    backgroundColor: '#274d71',
    borderColor: '#274d71',
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  todayText: {
    color: '#ffffff',
  },
  dayDate: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
  },
  todayDateText: {
    color: '#b6d509',
  },
  timeSlotsContainer: {
    flex: 1,
  },
  timeSlots: {
    gap: 12,
    paddingRight: 16,
  },
  timeSlotWrapper: {
    width: 200,
  },
  emptyDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyDayText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
});