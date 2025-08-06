import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { sendWhatsAppMessage, formatDiaryMessage } from '@/lib/whatsapp';
import * as DocumentPicker from 'expo-document-picker';
import { 
  Plus, 
  NotebookPen, 
  Calendar,
  Clock,
  Users,
  User,
  FileText,
  X,
  Upload
} from 'lucide-react-native';

interface DiaryAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  file_url?: string;
  class_id?: string;
  student_id?: string;
  created_at: string;
  classes?: { name: string };
  students?: { full_name: string };
}

export default function DiaryScreen() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<DiaryAssignment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    due_date: '',
    class_id: '',
    student_id: '',
    assignTo: 'class' as 'class' | 'student',
    file: null as any,
  });

  useEffect(() => {
    fetchAssignments();
    if (profile?.role === 'teacher') {
      fetchClasses();
    }
  }, [profile]);

  const fetchAssignments = async () => {
    try {
      let query = supabase
        .from('diary_assignments')
        .select(`
          *,
          classes (name),
          students (full_name)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (profile?.role !== 'teacher') {
        // For students/parents, show only their assignments
        // This would need additional logic to determine student's assignments
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setNewAssignment(prev => ({
          ...prev,
          file: result.assets[0],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (newAssignment.assignTo === 'class' && !newAssignment.class_id) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    if (newAssignment.assignTo === 'student' && !newAssignment.student_id) {
      Alert.alert('Error', 'Please select a student');
      return;
    }

    setUploading(true);
    try {
      let fileUrl: string | undefined;

      // Upload file if provided
      if (newAssignment.file) {
        const uploadResult = await uploadToCloudinary(newAssignment.file, 'raw');
        fileUrl = uploadResult.secure_url;
      }

      // Create assignment
      const assignmentData = {
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.due_date,
        file_url: fileUrl,
        class_id: newAssignment.assignTo === 'class' ? newAssignment.class_id : null,
        student_id: newAssignment.assignTo === 'student' ? newAssignment.student_id : null,
        assigned_by: profile!.id,
      };

      const { error } = await supabase
        .from('diary_assignments')
        .insert([assignmentData]);

      if (error) throw error;

      // Send WhatsApp messages
      if (newAssignment.assignTo === 'class' && newAssignment.class_id) {
        const { data: classStudents } = await supabase
          .from('students')
          .select('full_name, parent_contact')
          .eq('class_id', newAssignment.class_id);

        if (classStudents) {
          for (const student of classStudents) {
            if (student.parent_contact) {
              const message = formatDiaryMessage(
                newAssignment.title,
                student.full_name,
                newAssignment.due_date
              );

              await sendWhatsAppMessage({
                to: student.parent_contact,
                message,
                type: 'diary',
              });
            }
          }
        }
      } else if (newAssignment.assignTo === 'student' && newAssignment.student_id) {
        const { data: student } = await supabase
          .from('students')
          .select('full_name, parent_contact')
          .eq('id', newAssignment.student_id)
          .single();

        if (student && student.parent_contact) {
          const message = formatDiaryMessage(
            newAssignment.title,
            student.full_name,
            newAssignment.due_date
          );

          await sendWhatsAppMessage({
            to: student.parent_contact,
            message,
            type: 'diary',
          });
        }
      }

      Alert.alert('Success', 'Assignment created successfully');
      setModalVisible(false);
      setNewAssignment({
        title: '',
        description: '',
        due_date: '',
        class_id: '',
        student_id: '',
        assignTo: 'class',
        file: null,
      });
      fetchAssignments();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Diary & Homework</Text>
        {profile?.role === 'teacher' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Assignments List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading assignments...</Text>
          </View>
        ) : assignments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <NotebookPen size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No assignments yet</Text>
            <Text style={styles.emptySubtext}>
              {profile?.role === 'teacher' 
                ? 'Create your first assignment to get started' 
                : 'Check back later for new assignments'}
            </Text>
          </View>
        ) : (
          assignments.map((assignment) => {
            const overdue = isOverdue(assignment.due_date);
            return (
              <View key={assignment.id} style={[
                styles.assignmentCard,
                overdue && styles.overdueCard
              ]}>
                <View style={styles.assignmentHeader}>
                  <View style={styles.iconContainer}>
                    <NotebookPen size={20} color="#274d71" />
                  </View>
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <View style={styles.assignmentDetails}>
                      <View style={styles.detailItem}>
                        <Calendar size={14} color="#6B7280" />
                        <Text style={[
                          styles.detailText,
                          overdue && styles.overdueText
                        ]}>
                          Due: {formatDate(assignment.due_date)}
                        </Text>
                      </View>
                      {assignment.class_id ? (
                        <View style={styles.detailItem}>
                          <Users size={14} color="#6B7280" />
                          <Text style={styles.detailText}>{assignment.classes?.name}</Text>
                        </View>
                      ) : (
                        <View style={styles.detailItem}>
                          <User size={14} color="#6B7280" />
                          <Text style={styles.detailText}>{assignment.students?.full_name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.assignmentDescription}>
                  {assignment.description}
                </Text>

                {assignment.file_url && (
                  <TouchableOpacity style={styles.attachmentButton}>
                    <FileText size={16} color="#274d71" />
                    <Text style={styles.attachmentText}>View Attachment</Text>
                  </TouchableOpacity>
                )}

                {overdue && (
                  <View style={styles.overdueLabel}>
                    <Clock size={12} color="#EF4444" />
                    <Text style={styles.overdueLabelText}>OVERDUE</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Assignment Modal */}
      {profile?.role === 'teacher' && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Assignment</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Assignment Title</Text>
                  <TextInput
                    style={styles.input}
                    value={newAssignment.title}
                    onChangeText={(text) => setNewAssignment({...newAssignment, title: text})}
                    placeholder="Enter assignment title"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newAssignment.description}
                    onChangeText={(text) => setNewAssignment({...newAssignment, description: text})}
                    placeholder="Enter assignment description"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Due Date</Text>
                  <TextInput
                    style={styles.input}
                    value={newAssignment.due_date}
                    onChangeText={(text) => setNewAssignment({...newAssignment, due_date: text})}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Assign To</Text>
                  <View style={styles.assignToButtons}>
                    <TouchableOpacity
                      style={[
                        styles.assignToButton,
                        newAssignment.assignTo === 'class' && styles.assignToButtonSelected,
                      ]}
                      onPress={() => setNewAssignment({...newAssignment, assignTo: 'class', student_id: ''})}
                    >
                      <Users size={16} color={newAssignment.assignTo === 'class' ? '#ffffff' : '#374151'} />
                      <Text style={[
                        styles.assignToButtonText,
                        newAssignment.assignTo === 'class' && styles.assignToButtonTextSelected,
                      ]}>
                        Entire Class
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.assignToButton,
                        newAssignment.assignTo === 'student' && styles.assignToButtonSelected,
                      ]}
                      onPress={() => setNewAssignment({...newAssignment, assignTo: 'student', class_id: ''})}
                    >
                      <User size={16} color={newAssignment.assignTo === 'student' ? '#ffffff' : '#374151'} />
                      <Text style={[
                        styles.assignToButtonText,
                        newAssignment.assignTo === 'student' && styles.assignToButtonTextSelected,
                      ]}>
                        Individual Student
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {newAssignment.assignTo === 'class' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select Class</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.options}>
                        {classes.map((classItem) => (
                          <TouchableOpacity
                            key={classItem.id}
                            style={[
                              styles.option,
                              newAssignment.class_id === classItem.id && styles.optionSelected,
                            ]}
                            onPress={() => {
                              setNewAssignment({...newAssignment, class_id: classItem.id});
                              fetchStudents(classItem.id);
                            }}
                          >
                            <Text style={[
                              styles.optionText,
                              newAssignment.class_id === classItem.id && styles.optionTextSelected,
                            ]}>
                              {classItem.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {newAssignment.assignTo === 'student' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Select Student</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.options}>
                        {students.map((student) => (
                          <TouchableOpacity
                            key={student.id}
                            style={[
                              styles.option,
                              newAssignment.student_id === student.id && styles.optionSelected,
                            ]}
                            onPress={() => setNewAssignment({...newAssignment, student_id: student.id})}
                          >
                            <Text style={[
                              styles.optionText,
                              newAssignment.student_id === student.id && styles.optionTextSelected,
                            ]}>
                              {student.full_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Attachment (Optional)</Text>
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={pickDocument}
                  >
                    <Upload size={20} color="#274d71" />
                    <Text style={styles.filePickerText}>
                      {newAssignment.file ? newAssignment.file.name : 'Select file (PDF, Image)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                  onPress={handleCreateAssignment}
                  disabled={uploading}
                >
                  <Text style={styles.submitButtonText}>
                    {uploading ? 'Creating...' : 'Create Assignment'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#274d71',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  assignmentCard: {
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
  overdueCard: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  assignmentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  assignmentDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  overdueText: {
    color: '#EF4444',
    fontFamily: 'Inter-Medium',
  },
  assignmentDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  attachmentText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#274d71',
  },
  overdueLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  overdueLabelText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
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
  input: {
    height: 50,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  assignToButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  assignToButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    gap: 6,
  },
  assignToButtonSelected: {
    backgroundColor: '#274d71',
    borderColor: '#274d71',
  },
  assignToButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  assignToButtonTextSelected: {
    color: '#ffffff',
  },
  options: {
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
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 8,
  },
  filePickerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  submitButton: {
    height: 50,
    backgroundColor: '#274d71',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});