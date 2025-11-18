// screens/DiaryScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { uploadToCloudinary } from '@/src/lib/cloudinary';
import * as DocumentPicker from 'expo-document-picker';
import {
  Plus,
  BookOpen,
  Search,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import SubjectFilter from '../common/SubjectFilter';
import { SwipeableAssignmentCard } from '../dairy/SwipeableAssignmentCard';
import { AssignmentDetailModal } from '../dairy/AssignmentDetailModal';
import { CreateAssignmentModal } from '../dairy/CreateAssignmentModal';
import { EditAssignmentModal } from '../dairy/EditAssignmentModal';
import { useDiaryAssignments } from '@/src/hooks/useDiaryAssignments';
import { useDiaryFilters } from '../../hooks/useDiaryFilters';
import { useDiaryForm } from '../../hooks//useDiaryForm';
import styles from '../dairy/styles';
import { useFocusEffect } from '@react-navigation/native';
import { useScreenAnimation, useButtonAnimation } from '@/src/utils/animations';
import { Animated } from 'react-native';

interface DiaryAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  file_url?: string;
  class_id?: string;
  student_id?: string;
  subject_id?: string;
  created_at: string;
  classes?: { name: string };
  students?: { full_name: string };
  subjects?: { name: string };
}

export default function DiaryScreen() {
  const { profile, student } = useAuth();
  const { colors } = useTheme();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<DiaryAssignment | null>(null);
  const screenStyle = useScreenAnimation();
  const addButtonAnimation = useButtonAnimation();

  // Custom Hooks
  const {
    assignments,
    loading,
    refreshing,
    fetchAssignments,
    deleteAssignment,
    handleRefresh,
  } = useDiaryAssignments(profile, student);

  const {
    searchQuery,
    setSearchQuery,
    selectedSubject,
    setSelectedSubject,
    filteredAssignments,
  } = useDiaryFilters(assignments, profile);

  const {
    uploading,
    editingAssignment,
    setEditingAssignment,
    newAssignment,
    setNewAssignment,
    resetForm,
    createAssignment,
  } = useDiaryForm(profile, fetchAssignments);

  // Fetch initial data
  useEffect(() => {
    fetchAssignments();
    if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
      fetchClasses();
    }
  }, [profile]);

  // Fetch subjects
  useEffect(() => {
    if (profile?.role === 'student' && student?.class_id) {
      fetchSubjects();
    } else if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
      fetchTeacherSubjects();
    }
  }, [profile, student?.class_id]);

  // Auto refresh on focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [profile])
  );

  // ✅ FIXED: Fetch teacher subjects from teacher_subject_enrollments
  const fetchTeacherSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_subject_enrollments')
        .select(`
          subject_id,
          subjects (
            id,
            name
          )
        `)
        .eq('teacher_id', profile?.id)
        .eq('is_active', true);

      if (error) throw error;

      // Extract unique subjects
      const uniqueSubjects = Array.from(
        new Map(
          data
            ?.map(item => item.subjects)
            .filter(Boolean)
            .map(subject => [subject.id, subject])
        ).values()
      );

      setSubjects(uniqueSubjects);
    } catch (error) {
      console.warn('❌ Error fetching teacher subjects:', error);
      setSubjects([]);
    }
  };

  // ✅ FIXED: Fetch subjects for selected class from teacher_subject_enrollments
  const fetchSubjectsForClass = async (classId: string) => {
    try {
      if (!classId) {
        console.warn('⚠️ No class selected');
        setSubjects([]);
        return;
      }

      const { data, error } = await supabase
        .from('teacher_subject_enrollments')
        .select(`
          subjects (
            id,
            name
          )
        `)
        .eq('teacher_id', profile?.id)
        .eq('class_id', classId)
        .eq('is_active', true);

      if (error) throw error;


      const uniqueSubjects = Array.from(
        new Map(
          data
            ?.map(item => item.subjects)
            .filter(Boolean)
            .map(subject => [subject.id, subject])
        ).values()
      );

      setSubjects(uniqueSubjects);
    } catch (error) {
      console.log('❌ Error fetching subjects for class:', error);
      setSubjects([]);
    }
  };

  // Student subjects - unchanged
  const fetchSubjects = async () => {
    try {
      if (!student?.id) {
        console.warn('No student ID found');
        return;
      }

      const { data, error } = await supabase
        .from('student_subject_enrollments')
        .select(`
          subjects (
            id,
            name
          )
        `)
        .eq('student_id', student.id)
        .eq('is_active', true);

      if (error) throw error;


      const subjectsList = data
        ?.map(item => item.subjects)
        .filter(Boolean) || [];

      setSubjects(subjectsList);
    } catch (error) {
      console.warn('❌ Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  // ✅ FIXED: Fetch classes from teacher_subject_enrollments
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_subject_enrollments')
        .select(`
          classes (
            id,
            name
          )
        `)
        .eq('teacher_id', profile?.id)
        .eq('is_active', true);

      if (error) throw error;


      const uniqueClasses = Array.from(
        new Map(
          data
            ?.map(item => item.classes)
            .filter(Boolean)
            .map(cls => [cls.id, cls])
        ).values()
      );

      setClasses(uniqueClasses);
    } catch (error) {
      console.warn('❌ Error fetching classes:', error);
      setClasses([]);
    }
  };

  // ✅ FIXED: Fetch students from student_subject_enrollments based on teacher's class-subject
  const fetchStudents = async (classId: string) => {
    try {
      if (!newAssignment.subject_id) {
        console.warn('⚠️ No subject selected');
        setStudents([]);
        return;
      }

      // Get student IDs enrolled in this class-subject combination
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from('student_subject_enrollments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('subject_id', newAssignment.subject_id)
        .eq('is_active', true);

      if (enrollError) throw enrollError;

      const studentIds = enrollmentsData?.map(e => e.student_id) || [];

      if (studentIds.length === 0) {
        setStudents([]);
        return;
      }

      // Fetch student details from profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds)
        .eq('role', 'student')
        .order('full_name');

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.warn('❌ Error fetching students:', error);
      setStudents([]);
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
      console.warn('Error picking document:', error);
    }
  };

  const handleEditAssignment = (assignment: DiaryAssignment) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      class_id: assignment.class_id || '',
      student_id: assignment.student_id || '',
      assignTo: assignment.class_id ? 'class' : 'student',
      file: null,
      subject_id: assignment.subject_id || '',
    });
    setEditModalVisible(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let fileUrl: string | undefined = editingAssignment.file_url;

      if (newAssignment.file) {
        const uploadResult = await uploadToCloudinary(newAssignment.file, 'raw');
        fileUrl = uploadResult.secure_url;
      }

      const updateData = {
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.due_date,
        file_url: fileUrl,
        class_id: newAssignment.assignTo === 'class' ? newAssignment.class_id : null,
        student_id: newAssignment.assignTo === 'student' ? newAssignment.student_id : null,
        subject_id: newAssignment.subject_id || null,
      };

      const { error } = await supabase
        .from('diary_assignments')
        .update(updateData)
        .eq('id', editingAssignment.id);

      if (error) throw error;

      alert('Assignment updated successfully');
      setEditModalVisible(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDetailPress = (assignment: DiaryAssignment) => {
    setSelectedAssignment(assignment);
    setDetailModalVisible(true);
  };

  // Utility functions
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

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.description || !newAssignment.due_date) {
      alert('Please fill in all required fields');
      return;
    }

    if (newAssignment.assignTo === 'class' && !newAssignment.class_id) {
      alert('Please select a class');
      return;
    }

    if (newAssignment.assignTo === 'student' && !newAssignment.student_id) {
      alert('Please select a student');
      return;
    }

    try {
      let fileUrl: string | undefined;

      if (newAssignment.file) {
        const uploadResult = await uploadToCloudinary(newAssignment.file, 'raw');
        fileUrl = uploadResult.secure_url;
      }

      const assignmentData = {
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.due_date,
        file_url: fileUrl,
        class_id: newAssignment.assignTo === 'class' ? newAssignment.class_id : null,
        student_id: newAssignment.assignTo === 'student' ? newAssignment.student_id : null,
        subject_id: newAssignment.subject_id || null,
        assigned_by: profile?.id,
      };

      const { error } = await supabase
        .from('diary_assignments')
        .insert([assignmentData]);

      if (error) throw error;

      alert('Assignment created successfully');
      setModalVisible(false);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSections />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>

        {/* Search & Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border, marginRight: 8 }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search assignments..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {profile?.role === 'student' && (
            <SubjectFilter
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSubjectSelect={setSelectedSubject}
              colors={colors}
              loading={false}
            />
          )}

          {(profile?.role === 'teacher') && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Assignments List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text allowFontScaling={false} style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading assignments...
              </Text>
            </View>
          ) : filteredAssignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>
                No assignments yet
              </Text>
              <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {(profile?.role === 'teacher' || profile?.role === 'admin')
                  ? 'Create your first assignment to get started'
                  : 'Your assignments will appear here'}
              </Text>
            </View>
          ) : (
            filteredAssignments.map(assignment => (
              <SwipeableAssignmentCard
                key={assignment.id}
                assignment={assignment}
                colors={colors}
                isTeacher={(profile?.role === 'teacher')}
                onEdit={handleEditAssignment}
                onDelete={deleteAssignment}
                onPress={handleDetailPress}
                isOverdue={isOverdue}
                formatDate={formatDate}
              />
            ))
          )}
        </ScrollView>

        {/* Create Assignment Modal */}
        {profile?.role === 'teacher' && (
          <CreateAssignmentModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              resetForm();
            }}
            colors={colors}
            newAssignment={newAssignment}
            setNewAssignment={setNewAssignment}
            classes={classes}
            students={students}
            subjects={subjects}
            uploading={uploading}
            onSubmit={handleCreateAssignment}
            pickDocument={pickDocument}
            fetchStudents={fetchStudents}
            fetchSubjectsForClass={fetchSubjectsForClass}
          />
        )}

        {/* Edit Assignment Modal */}
        {(profile?.role === 'teacher') && (
          <EditAssignmentModal
            visible={editModalVisible}
            onClose={() => {
              setEditModalVisible(false);
              setEditingAssignment(null);
              resetForm();
            }}
            colors={colors}
            newAssignment={newAssignment}
            setNewAssignment={setNewAssignment}
            uploading={uploading}
            onSubmit={handleUpdateAssignment}
            pickDocument={pickDocument}
          />
        )}

        {/* Assignment Detail Modal */}
        <AssignmentDetailModal
          visible={detailModalVisible}
          assignment={selectedAssignment}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedAssignment(null);
          }}
          colors={colors}
          isOverdue={isOverdue}
          formatDate={formatDate}
        />

      </SafeAreaView>
    </Animated.View >
  );
}