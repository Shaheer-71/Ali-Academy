import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage, formatAttendanceMessage } from '@/lib/whatsapp';
import { Calendar, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Users, MessageCircle } from 'lucide-react-native';
import TopSections from '@/components/TopSections';
import { useTheme } from '@/contexts/ThemeContext';

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  parent_contact: string;
  class_id: string;
  classes?: { name: string };
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'late' | 'absent';
  arrival_time?: string;
  late_minutes?: number;
}

export default function AttendanceScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme(); // Removed isDark since we're using colors object like in students screen
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [customTime, setCustomTime] = useState('');

  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchClasses();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (name)
        `)
        .eq('class_id', selectedClass)
        .order('roll_number');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      if (error) throw error;

      const attendanceMap: Record<string, AttendanceRecord> = {};
      data?.forEach((record) => {
        attendanceMap[record.student_id] = {
          student_id: record.student_id,
          status: record.status,
          arrival_time: record.arrival_time,
          late_minutes: record.late_minutes || undefined,
        };
      });

      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'late' | 'absent', arrivalTime?: string) => {
    try {
      const classStartTime = new Date(`${selectedDate}T16:00:00`); // 4:00 PM
      const cutoffTime = new Date(`${selectedDate}T16:15:00`); // 4:15 PM

      let finalStatus = status;
      let lateMinutes: number | undefined;
      let finalArrivalTime = arrivalTime || new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      if (status === 'present' && arrivalTime) {
        const [hours, minutes] = arrivalTime.split(':').map(Number);
        const arrivalDateTime = new Date(`${selectedDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);

        if (arrivalDateTime > cutoffTime) {
          finalStatus = 'late';
          lateMinutes = Math.ceil((arrivalDateTime.getTime() - classStartTime.getTime()) / (1000 * 60));
        }
      }

      // Update local state
      setAttendance(prev => ({
        ...prev,
        [studentId]: {
          student_id: studentId,
          status: finalStatus,
          arrival_time: finalArrivalTime,
          late_minutes: lateMinutes,
        }
      }));

      // Save to database
      const { error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          class_id: selectedClass,
          date: selectedDate,
          arrival_time: finalArrivalTime,
          status: finalStatus,
          late_minutes: lateMinutes,
          marked_by: profile!.id,
        });

      if (error) throw error;

      // Send WhatsApp message
      const student = students.find(s => s.id === studentId);
      if (student && student.parent_contact) {
        const message = formatAttendanceMessage(
          student.full_name,
          finalArrivalTime,
          finalStatus === 'late',
          lateMinutes
        );

        await sendWhatsAppMessage({
          to: student.parent_contact,
          message,
          type: 'attendance',
        });
      }

      Alert.alert('Success', 'Attendance marked successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCustomTimeSubmit = () => {
    if (!customTime || !selectedStudent) return;

    markAttendance(selectedStudent, 'present', customTime);
    setTimeModalVisible(false);
    setCustomTime('');
    setSelectedStudent('');
  };

  const getStatusIcon = (status: 'present' | 'late' | 'absent' | undefined) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={20} color="#10B981" />;
      case 'late':
        return <AlertCircle size={20} color="#F59E0B" />;
      case 'absent':
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color={colors.textSecondary} />;
    }
  };

  const getStatusColor = (status: 'present' | 'late' | 'absent' | undefined) => {
    switch (status) {
      case 'present':
        return '#10B981';
      case 'late':
        return '#F59E0B';
      case 'absent':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  if (profile?.role !== 'teacher') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>Access Denied</Text>
            <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>This section is only available for teachers.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSections />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        {/* Class Selection */}
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
                  onPress={() => setSelectedClass(classItem.id)}
                >
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

        {/* Students List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
          {students.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No students in this class</Text>
            </View>
          ) : (
            students.map((student) => {
              const record = attendance[student.id];
              return (
                <View key={student.id} style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                  <View style={styles.studentHeader}>
                    <View style={styles.studentInfo}>
                      <Text style={[styles.studentName, { color: colors.text }]}>{student.full_name}</Text>
                      <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>Roll: {student.roll_number}</Text>
                    </View>
                    <View style={styles.statusIndicator}>
                      {getStatusIcon(record?.status)}
                      {record && (
                        <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                          {record.status.toUpperCase()}
                        </Text>
                      )}
                    </View>
                  </View>

                  {record?.arrival_time && (
                    <View style={[styles.timeInfo, { borderTopColor: colors.border }]}>
                      <Clock size={16} color={colors.textSecondary} />
                      <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                        Arrived at {record.arrival_time}
                        {record.late_minutes && ` (${record.late_minutes} min late)`}
                      </Text>
                    </View>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.presentButton]}
                      onPress={() => markAttendance(student.id, 'present')}
                    >
                      <CheckCircle size={16} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Present</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.customTimeButton]}
                      onPress={() => {
                        setSelectedStudent(student.id);
                        setTimeModalVisible(true);
                      }}
                    >
                      <Clock size={16} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Custom Time</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.absentButton]}
                      onPress={() => markAttendance(student.id, 'absent')}
                    >
                      <XCircle size={16} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Absent</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Custom Time Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={timeModalVisible}
          onRequestClose={() => setTimeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.timeModalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Arrival Time</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setTimeModalVisible(false)}
                >
                  <XCircle size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <TextInput
                  style={[styles.timeInput, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                  value={customTime}
                  onChangeText={setCustomTime}
                  placeholder="HH:MM (24-hour format)"
                  placeholderTextColor={colors.textSecondary}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                    onPress={() => setTimeModalVisible(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                    onPress={handleCustomTimeSubmit}
                  >
                    <Text style={styles.confirmButtonText}>Mark Present</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  classSelection: {
    paddingHorizontal: 24,
    marginBottom: 20,
    paddingTop: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  classButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
  },
  studentCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  presentButton: {
    backgroundColor: '#10B981',
  },
  customTimeButton: {
    backgroundColor: '#274d71',
  },
  absentButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timeModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  timeInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});