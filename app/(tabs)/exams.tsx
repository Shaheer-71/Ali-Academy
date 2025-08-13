import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { GraduationCap, Calendar, Clock, Award, FileText, Plus, X, TrendingUp, TrendingDown, ChartBar as BarChart3, Target } from 'lucide-react-native';
import TopSections from '@/components/TopSections';

interface ExamSchedule {
  id: string;
  subject: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number: string;
  class_id: string;
  total_marks: number;
  class_name?: string;
}

interface ExamResult {
  id: string;
  student_id: string;
  exam_id: string;
  marks_obtained: number;
  total_marks: number;
  grade: string;
  percentage: number;
  student_name?: string;
  subject?: string;
  exam_date?: string;
}

interface StudentGradeReport {
  student_id: string;
  student_name: string;
  roll_number: string;
  subjects: {
    subject: string;
    marks_obtained: number;
    total_marks: number;
    percentage: number;
    grade: string;
  }[];
  overall_percentage: number;
  overall_grade: string;
  rank: number;
}

export default function ExamsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [gradeReports, setGradeReports] = useState<StudentGradeReport[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'results' | 'reports'>('schedule');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newExam, setNewExam] = useState({
    subject: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    room_number: '',
    total_marks: '',
    class_id: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchExamData();
  }, [profile]);

  useEffect(() => {
    if (selectedClass) {
      fetchExamData();
    }
  }, [selectedClass]);

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

  const fetchExamData = async () => {
    try {
      // Mock data for demonstration
      const mockSchedules: ExamSchedule[] = [
        {
          id: '1',
          subject: 'Mathematics',
          exam_date: '2025-02-15',
          start_time: '09:00',
          end_time: '12:00',
          room_number: 'Room 101',
          class_id: '1',
          total_marks: 100,
          class_name: 'Class A',
        },
        {
          id: '2',
          subject: 'Physics',
          exam_date: '2025-02-17',
          start_time: '09:00',
          end_time: '12:00',
          room_number: 'Room 102',
          class_id: '1',
          total_marks: 100,
          class_name: 'Class A',
        },
        {
          id: '3',
          subject: 'Chemistry',
          exam_date: '2025-02-19',
          start_time: '14:00',
          end_time: '17:00',
          room_number: 'Room 103',
          class_id: '1',
          total_marks: 100,
          class_name: 'Class A',
        },
      ];

      const mockResults: ExamResult[] = [
        {
          id: '1',
          student_id: '1',
          exam_id: '1',
          marks_obtained: 88,
          total_marks: 100,
          grade: 'A',
          percentage: 88,
          student_name: 'Ahmed Ali',
          subject: 'Mathematics',
          exam_date: '2025-01-15',
        },
        {
          id: '2',
          student_id: '2',
          exam_id: '1',
          marks_obtained: 91,
          total_marks: 100,
          grade: 'A+',
          percentage: 91,
          student_name: 'Fatima Khan',
          subject: 'Mathematics',
          exam_date: '2025-01-15',
        },
      ];

      const mockGradeReports: StudentGradeReport[] = [
        {
          student_id: '1',
          student_name: 'Ahmed Ali',
          roll_number: 'A001',
          subjects: [
            { subject: 'Mathematics', marks_obtained: 88, total_marks: 100, percentage: 88, grade: 'A' },
            { subject: 'Physics', marks_obtained: 82, total_marks: 100, percentage: 82, grade: 'B+' },
            { subject: 'Chemistry', marks_obtained: 90, total_marks: 100, percentage: 90, grade: 'A+' },
          ],
          overall_percentage: 87,
          overall_grade: 'A',
          rank: 2,
        },
        {
          student_id: '2',
          student_name: 'Fatima Khan',
          roll_number: 'A002',
          subjects: [
            { subject: 'Mathematics', marks_obtained: 91, total_marks: 100, percentage: 91, grade: 'A+' },
            { subject: 'Physics', marks_obtained: 89, total_marks: 100, percentage: 89, grade: 'A' },
            { subject: 'Chemistry', marks_obtained: 94, total_marks: 100, percentage: 94, grade: 'A+' },
          ],
          overall_percentage: 91,
          overall_grade: 'A+',
          rank: 1,
        },
      ];

      setExamSchedules(mockSchedules);
      setExamResults(mockResults);
      setGradeReports(mockGradeReports);
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExam = async () => {
    if (!newExam.subject || !newExam.exam_date || !newExam.start_time || !newExam.end_time || !newExam.room_number || !newExam.total_marks || !newExam.class_id) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('exam_schedules')
        .insert([{
          ...newExam,
          total_marks: parseInt(newExam.total_marks),
          created_by: profile!.id,
        }]);

      if (error) throw error;

      Alert.alert('Success', 'Exam scheduled successfully');
      setModalVisible(false);
      setNewExam({
        subject: '',
        exam_date: '',
        start_time: '',
        end_time: '',
        room_number: '',
        total_marks: '',
        class_id: '',
      });
      fetchExamData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return '#10B981';
      case 'A':
        return '#059669';
      case 'B+':
        return '#3B82F6';
      case 'B':
        return '#6366F1';
      case 'C+':
        return '#F59E0B';
      case 'C':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  const renderScheduleTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
      {examSchedules.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No exams scheduled</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {profile?.role === 'teacher' ? 'Schedule your first exam' : 'Check back later for exam schedules'}
          </Text>
        </View>
      ) : (
        examSchedules.map((exam) => (
          <View key={exam.id} style={[styles.examCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.examHeader}>
              <View style={[styles.examIcon, { backgroundColor: colors.primary }]}>
                <GraduationCap size={20} color="#ffffff" />
              </View>
              <View style={styles.examInfo}>
                <Text style={[styles.examSubject, { color: colors.text }]}>{exam.subject}</Text>
                <Text style={[styles.examClass, { color: colors.textSecondary }]}>{exam.class_name}</Text>
              </View>
              <View style={[styles.marksContainer, { backgroundColor: colors.secondary }]}>
                <Text style={styles.marksText}>{exam.total_marks} marks</Text>
              </View>
            </View>

            <View style={styles.examDetails}>
              <View style={styles.examDetail}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={[styles.examDetailText, { color: colors.text }]}>
                  {new Date(exam.exam_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.examDetail}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.examDetailText, { color: colors.text }]}>
                  {exam.start_time} - {exam.end_time}
                </Text>
              </View>
              <View style={styles.examDetail}>
                <FileText size={16} color={colors.textSecondary} />
                <Text style={[styles.examDetailText, { color: colors.text }]}>{exam.room_number}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderResultsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
      {examResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Award size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No results available</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Results will appear here after exams are conducted
          </Text>
        </View>
      ) : (
        examResults.map((result) => (
          <View key={result.id} style={[styles.resultCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.resultHeader}>
              <View style={styles.resultInfo}>
                <Text style={[styles.resultStudent, { color: colors.text }]}>{result.student_name}</Text>
                <Text style={[styles.resultSubject, { color: colors.textSecondary }]}>{result.subject}</Text>
              </View>
              <View style={[styles.gradeContainer, { backgroundColor: getGradeColor(result.grade) }]}>
                <Text style={styles.gradeText}>{result.grade}</Text>
              </View>
            </View>

            <View style={styles.resultDetails}>
              <View style={styles.resultDetail}>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Marks</Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>
                  {result.marks_obtained}/{result.total_marks}
                </Text>
              </View>
              <View style={styles.resultDetail}>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Percentage</Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>{result.percentage}%</Text>
              </View>
              <View style={styles.resultDetail}>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Date</Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>
                  {new Date(result.exam_date!).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${result.percentage}%`, backgroundColor: getGradeColor(result.grade) },
                ]}
              />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderReportsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
      {gradeReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BarChart3 size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No grade reports available</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Grade reports will be generated after exam results are published
          </Text>
        </View>
      ) : (
        gradeReports.map((report) => (
          <View key={report.student_id} style={[styles.reportCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.reportHeader}>
              <View style={styles.reportStudentInfo}>
                <Text style={[styles.reportStudentName, { color: colors.text }]}>{report.student_name}</Text>
                <Text style={[styles.reportRollNumber, { color: colors.textSecondary }]}>
                  {report.roll_number} • Rank #{report.rank}
                </Text>
              </View>
              <View style={[styles.overallGradeContainer, { backgroundColor: getGradeColor(report.overall_grade) }]}>
                <Text style={styles.overallGradeText}>{report.overall_grade}</Text>
                <Text style={styles.overallPercentageText}>{report.overall_percentage}%</Text>
              </View>
            </View>

            <View style={styles.subjectGrades}>
              {report.subjects.map((subject, index) => (
                <View key={index} style={[styles.subjectGrade, { borderBottomColor: colors.border }]}>
                  <View style={styles.subjectInfo}>
                    <Text style={[styles.subjectName, { color: colors.text }]}>{subject.subject}</Text>
                    <Text style={[styles.subjectMarks, { color: colors.textSecondary }]}>
                      {subject.marks_obtained}/{subject.total_marks}
                    </Text>
                  </View>
                  <View style={styles.subjectGradeInfo}>
                    <View style={[styles.subjectGradeBadge, { backgroundColor: getGradeColor(subject.grade) }]}>
                      <Text style={styles.subjectGradeText}>{subject.grade}</Text>
                    </View>
                    <Text style={[styles.subjectPercentage, { color: colors.text }]}>{subject.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.progressChart, { backgroundColor: colors.background }]}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>Subject Performance</Text>
              <View style={styles.progressBars}>
                {report.subjects.map((subject, index) => (
                  <View key={index} style={styles.progressItem}>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                      {subject.subject.slice(0, 4)}
                    </Text>
                    <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${subject.percentage}%`, backgroundColor: getGradeColor(subject.grade) },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressValue, { color: colors.text }]}>{subject.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSections />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
              activeTab === 'schedule' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab('schedule')}
          >
            <Calendar size={16} color={activeTab === 'schedule' ? '#ffffff' : colors.text} />
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === 'schedule' && { color: '#ffffff' },
            ]}>
              Schedule
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
              activeTab === 'results' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab('results')}
          >
            <Award size={16} color={activeTab === 'results' ? '#ffffff' : colors.text} />
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === 'results' && { color: '#ffffff' },
            ]}>
              Results
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
              activeTab === 'reports' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveTab('reports')}
          >
            <BarChart3 size={16} color={activeTab === 'reports' ? '#ffffff' : colors.text} />
            <Text style={[
              styles.tabText,
              { color: colors.text },
              activeTab === 'reports' && { color: '#ffffff' },
            ]}>
              Reports
            </Text>
          </TouchableOpacity>

          {profile?.role === 'teacher' && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Class Filter */}
        {profile?.role === 'teacher' && (
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
                    <Text style={[
                      styles.classButtonText,
                      { color: colors.text },
                      selectedClass === classItem.id && { color: '#274d71' },
                    ]}>
                      {classItem.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          {activeTab === 'schedule' && renderScheduleTab()}
          {activeTab === 'results' && renderResultsTab()}
          {activeTab === 'reports' && renderReportsTab()}
        </View>

        {/* Add Exam Modal */}
        {profile?.role === 'teacher' && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Exam</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                      value={newExam.subject}
                      onChangeText={(text) => setNewExam({ ...newExam, subject: text })}
                      placeholder="Enter subject name"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Exam Date</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                      value={newExam.exam_date}
                      onChangeText={(text) => setNewExam({ ...newExam, exam_date: text })}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.timeRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>Start Time</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                        value={newExam.start_time}
                        onChangeText={(text) => setNewExam({ ...newExam, start_time: text })}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={[styles.label, { color: colors.text }]}>End Time</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                        value={newExam.end_time}
                        onChangeText={(text) => setNewExam({ ...newExam, end_time: text })}
                        placeholder="HH:MM"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Room Number</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                      value={newExam.room_number}
                      onChangeText={(text) => setNewExam({ ...newExam, room_number: text })}
                      placeholder="Enter room number"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Total Marks</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                      value={newExam.total_marks}
                      onChangeText={(text) => setNewExam({ ...newExam, total_marks: text })}
                      placeholder="Enter total marks"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.classOptions}>
                        {classes.map((classItem) => (
                          <TouchableOpacity
                            key={classItem.id}
                            style={[
                              styles.classOption,
                              { backgroundColor: colors.cardBackground, borderColor: colors.border },
                              newExam.class_id === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setNewExam({ ...newExam, class_id: classItem.id })}
                          >
                            <Text style={[
                              styles.classOptionText,
                              { color: colors.text },
                              newExam.class_id === classItem.id && { color: '#ffffff' },
                            ]}>
                              {classItem.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleAddExam}
                  >
                    <Text style={styles.submitButtonText}>Schedule Exam</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  contentContainer: {
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  examCard: {
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
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  examIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  examInfo: {
    flex: 1,
  },
  examSubject: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  examClass: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  marksContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  marksText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
  },
  examDetails: {
    gap: 8,
  },
  examDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  examDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultInfo: {
    flex: 1,
  },
  resultStudent: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  resultSubject: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  gradeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultDetail: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  reportCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  reportStudentInfo: {
    flex: 1,
  },
  reportStudentName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  reportRollNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  overallGradeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  overallGradeText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  overallPercentageText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  subjectGrades: {
    marginBottom: 20,
  },
  subjectGrade: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  subjectMarks: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  subjectGradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subjectGradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectGradeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  subjectPercentage: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    minWidth: 40,
    textAlign: 'right',
  },
  progressChart: {
    borderRadius: 12,
    padding: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  progressBars: {
    gap: 8,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    width: 40,
  },
  progressValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    width: 40,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  modalScrollView: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  classOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  classOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  classOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  submitButton: {
    height: 50,
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