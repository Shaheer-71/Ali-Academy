import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, MapPin, User, Calendar, ChevronRight } from 'lucide-react-native';

interface TimetableEntry {
  id: string;
  start_time: string;
  end_time: string;
  subject: string;
  room_number: string;
  teacher_name?: string;
}

interface TodayScheduleProps {
  entries: TimetableEntry[];
  onViewAll?: () => void;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
  entries,
  onViewAll,
}) => {
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCurrentClass = (startTime: string, endTime: string) => {
    const currentTime = getCurrentTime();
    return currentTime >= startTime && currentTime <= endTime;
  };

  const getNextClass = () => {
    const currentTime = getCurrentTime();
    return entries.find(entry => entry.start_time > currentTime);
  };

  const nextClass = getNextClass();
  const currentClass = entries.find(entry => isCurrentClass(entry.start_time, entry.end_time));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Schedule</Text>
        {onViewAll && (
          <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
            <ChevronRight size={16} color="#274d71" />
          </TouchableOpacity>
        )}
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>No classes today</Text>
          <Text style={styles.emptySubtext}>Enjoy your free day!</Text>
        </View>
      ) : (
        <View style={styles.scheduleList}>
          {/* Current Class */}
          {currentClass && (
            <View style={styles.currentClassContainer}>
              <Text style={styles.currentClassLabel}>Current Class</Text>
              <View style={[styles.classCard, styles.currentClassCard]}>
                <View style={styles.classHeader}>
                  <View style={styles.timeInfo}>
                    <Clock size={14} color="#ffffff" />
                    <Text style={styles.currentClassTime}>
                      {currentClass.start_time} - {currentClass.end_time}
                    </Text>
                  </View>
                  <View style={styles.currentRoomBadge}>
                    <MapPin size={10} color="#274d71" />
                    <Text style={styles.currentRoomText}>{currentClass.room_number}</Text>
                  </View>
                </View>
                <Text style={styles.currentClassSubject}>{currentClass.subject}</Text>
                {currentClass.teacher_name && (
                  <View style={styles.currentTeacherInfo}>
                    <User size={12} color="#b6d509" />
                    <Text style={styles.currentTeacherText}>{currentClass.teacher_name}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Next Class */}
          {nextClass && (
            <View style={styles.nextClassContainer}>
              <Text style={styles.nextClassLabel}>Next Class</Text>
              <View style={[styles.classCard, styles.nextClassCard]}>
                <View style={styles.classHeader}>
                  <View style={styles.timeInfo}>
                    <Clock size={14} color="#274d71" />
                    <Text style={styles.nextClassTime}>
                      {nextClass.start_time} - {nextClass.end_time}
                    </Text>
                  </View>
                  <View style={styles.roomBadge}>
                    <MapPin size={10} color="#274d71" />
                    <Text style={styles.roomText}>{nextClass.room_number}</Text>
                  </View>
                </View>
                <Text style={styles.nextClassSubject}>{nextClass.subject}</Text>
                {nextClass.teacher_name && (
                  <View style={styles.teacherInfo}>
                    <User size={12} color="#6B7280" />
                    <Text style={styles.teacherText}>{nextClass.teacher_name}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* All Classes Summary */}
          <View style={styles.allClassesContainer}>
            <Text style={styles.allClassesLabel}>All Classes ({entries.length})</Text>
            <View style={styles.classesTimeline}>
              {entries.map((entry, index) => (
                <View key={entry.id} style={styles.timelineItem}>
                  <View style={[
                    styles.timelineDot,
                    isCurrentClass(entry.start_time, entry.end_time) && styles.currentTimelineDot,
                  ]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTime}>{entry.start_time}</Text>
                    <Text style={styles.timelineSubject}>{entry.subject}</Text>
                    <Text style={styles.timelineRoom}>{entry.room_number}</Text>
                  </View>
                  {index < entries.length - 1 && <View style={styles.timelineConnector} />}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#274d71',
  },
  emptyState: {
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
    marginTop: 4,
  },
  scheduleList: {
    gap: 16,
  },
  currentClassContainer: {
    marginBottom: 8,
  },
  currentClassLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#b6d509',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nextClassContainer: {
    marginBottom: 8,
  },
  nextClassLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  classCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  currentClassCard: {
    backgroundColor: '#274d71',
    borderColor: '#274d71',
  },
  nextClassCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentClassTime: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 6,
  },
  nextClassTime: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
    marginLeft: 6,
  },
  currentRoomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b6d509',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  currentRoomText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
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
  currentClassSubject: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 6,
  },
  nextClassSubject: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  currentTeacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTeacherText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#b6d509',
    marginLeft: 4,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  allClassesContainer: {
    marginTop: 8,
  },
  allClassesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  classesTimeline: {
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  currentTimelineDot: {
    backgroundColor: '#b6d509',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineTime: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
    marginBottom: 2,
  },
  timelineSubject: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  timelineRoom: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  timelineConnector: {
    position: 'absolute',
    left: 3,
    top: 14,
    bottom: -8,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
});