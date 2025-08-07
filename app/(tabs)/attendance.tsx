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
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  MessageCircle
} from 'lucide-react-native';
import TopSection from '@/components/TopSection';

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
        return <Clock size={20} color="#9CA3AF" />;
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
        return '#9CA3AF';
    }
  };

  if (profile?.role !== 'teacher') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>This section is only available for teachers.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <TopSection />
      <SafeAreaView style={styles.container} edges={[ 'left', 'right']}>
        {/* Header */}
        {/* <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#274d71" />
            <Text style={styles.dateText}>{selectedDate}</Text>
          </View>
        </View> */}

        {/* Class Selection */}
        <View style={styles.classSelection}>
          <Text style={styles.sectionLabel}>Select Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.classButtons}>
              {classes.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={[
                    styles.classButton,
                    selectedClass === classItem.id && styles.classButtonSelected,
                  ]}
                  onPress={() => setSelectedClass(classItem.id)}
                >
                  <Text style={[
                    styles.classButtonText,
                    selectedClass === classItem.id && styles.classButtonTextSelected,
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
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No students in this class</Text>
            </View>
          ) : (
            students.map((student) => {
              const record = attendance[student.id];
              return (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentHeader}>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.full_name}</Text>
                      <Text style={styles.rollNumber}>Roll: {student.roll_number}</Text>
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
                    <View style={styles.timeInfo}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.timeText}>
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
          animationType="slide"
          transparent={true}
          visible={timeModalVisible}
          onRequestClose={() => setTimeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.timeModalContent}>
              <Text style={styles.modalTitle}>Enter Arrival Time</Text>
              <TextInput
                style={styles.timeInput}
                value={customTime}
                onChangeText={setCustomTime}
                placeholder="HH:MM (24-hour format)"
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setTimeModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleCustomTimeSubmit}
                >
                  <Text style={styles.confirmButtonText}>Mark Present</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    color: '#374151',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderWidth : 1
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 8,
  },
  classSelection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  classButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  classButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
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
    color: '#374151',
    marginTop: 16,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#111827',
    marginBottom: 2,
  },
  rollNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
    borderTopColor: '#F3F4F6',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeInput: {
    height: 50,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#274d71',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});