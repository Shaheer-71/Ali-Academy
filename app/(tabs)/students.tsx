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
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
  Plus,
  Search,
  Users,
  Phone,
  Hash,
  BookOpen,
  X,
  CreditCard as Edit,
  Trash2
} from 'lucide-react-native';
import TopSection from '@/components/TopSections';

  
interface Student  {
  id: string;
  full_name: string;
  roll_number: string;
  parent_contact: string;
  class_id: string;
  classes?: { name: string };
}

interface Class {
  id: string;
  name: string;
}

export default function StudentsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    roll_number: '',
    parent_contact: '',
    class_id: '',
  });

  useEffect(() => {
    if (profile?.role === 'teacher') {
      fetchStudents();
      fetchClasses();
    }
  }, [profile]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (name)
        `)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const handleAddStudent = async () => {
    if (!newStudent.full_name || !newStudent.roll_number || !newStudent.parent_contact || !newStudent.class_id) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .insert([newStudent]);

      if (error) throw error;

      Alert.alert('Success', 'Student added successfully');
      setModalVisible(false);
      setNewStudent({
        full_name: '',
        roll_number: '',
        parent_contact: '',
        class_id: '',
      });
      fetchStudents();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <TopSection />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        {/* Header */}

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search students..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Students List */}
        <ScrollView style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: 50,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading students...</Text>
            </View>
          ) : filteredStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No students found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {searchQuery ? 'Try adjusting your search' : 'Add your first student to get started'}
              </Text>
            </View>
          ) : (
            filteredStudents.map((student) => (
              <View key={student.id} style={[styles.studentCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.studentHeader}>
                  <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.studentInitial}>
                      {student.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{student.full_name}</Text>
                    <View style={styles.studentDetails}>
                      <View style={styles.detailItem}>
                        <Hash size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{student.roll_number}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <BookOpen size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{student.classes?.name}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={[styles.contactInfo, { borderTopColor: colors.border }]}>
                  <Phone size={16} color={colors.textSecondary} />
                  <Text style={[styles.contactText, { color: colors.text }]}>{student.parent_contact}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Add Student Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Student</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Student Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                    value={newStudent.full_name}
                    onChangeText={(text) => setNewStudent({ ...newStudent, full_name: text })}
                    placeholder="Enter student name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Roll Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                    value={newStudent.roll_number}
                    onChangeText={(text) => setNewStudent({ ...newStudent, roll_number: text })}
                    placeholder="Enter roll number"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>Parent Contact</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                    value={newStudent.parent_contact}
                    onChangeText={(text) => setNewStudent({ ...newStudent, parent_contact: text })}
                    placeholder="Enter parent contact number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
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
                            newStudent.class_id === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setNewStudent({ ...newStudent, class_id: classItem.id })}
                        >
                          <Text style={[
                            styles.classOptionText,
                            { color: colors.text },
                            newStudent.class_id === classItem.id && { color: '#ffffff' },
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
                  onPress={handleAddStudent}
                >
                  <Text style={styles.submitButtonText}>Add Student</Text>
                </TouchableOpacity>
              </ScrollView>
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
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft : 5
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    flexDirection : "row",
    justifyContent : 'center',
    alignContent : 'center',
    alignItems : "center"
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    flex :1
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  studentInitial: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  studentDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    paddingVertical: 24,
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