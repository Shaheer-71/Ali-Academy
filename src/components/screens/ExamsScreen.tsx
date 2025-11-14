// ExamsScreen.tsx - Fixed with correct table usage
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useQuizzes } from '@/src/hooks/useQuizzes';
import TopSections from '@/src/components/common/TopSections';
import TabNavigation from '../exams/TabNavigation';
import ScheduleTab from '../exams/ScheduleTab';
import ResultsTab from '../exams/ResultsTab';
import ReportsTab from '../exams/ReportsTab';
import CreateQuizModal from '../exams/CreateQuizModal';
import MarkingModal from '../exams/MarkingModal';
import { ComprehensiveExamsFilterModal } from '../exams/modals/ComprehensiveExamsFilterModal';
import { supabase } from '@/src/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

interface ExamFilterData {
  selectedClass: string;
  selectedSubject: string;
  statusFilter: 'all' | 'scheduled' | 'completed';
  checkedFilter: 'all' | 'checked' | 'unchecked';
}

export default function ExamsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();

  // State management
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'results' | 'reports'>('schedule');
  const [modalVisible, setModalVisible] = useState(false);
  const [markingModalVisible, setMarkingModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Comprehensive filter state
  const [filters, setFilters] = useState<ExamFilterData>({
    selectedClass: '',
    selectedSubject: '',
    statusFilter: 'all',
    checkedFilter: 'all',
  });

  // Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Get data from hook
  const {
    quizzes,
    quizResults,
    loading,
    createQuiz,
    markQuizResult,
    updateQuizStatus,
    areAllResultsMarked,
    refetch,
  } = useQuizzes();

  useEffect(() => {
    if (profile?.role === 'teacher' || profile?.role === 'admin') {
      fetchClassesAndSubjects();
    }
  }, [profile]);

  // Set default class when data is loaded
  useEffect(() => {
    if (classes.length > 0 && !filters.selectedClass) {
      const firstClassId = classes[0].id;
      setFilters(prev => ({ ...prev, selectedClass: firstClassId }));
    }
  }, [classes]);

  const fetchClassesAndSubjects = async () => {
    try {
      // Use teacher_subject_enrollments table
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('teacher_subject_enrollments')
        .select('class_id, subject_id')
        .eq('teacher_id', profile?.id);

      if (enrollmentError) throw enrollmentError;


      // Get unique class IDs
      const classIDs = [...new Set(enrollments?.map(item => item.class_id) || [])];

      // Get unique subject IDs
      const subjectIDs = [...new Set(enrollments?.map(item => item.subject_id) || [])];


      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIDs)
        .order('name');

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .in('id', subjectIDs)
        .order('name');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

    } catch (error) {
      console.error('❌ Error fetching classes and subjects:', error);
    }
  };

  // Get subjects for selected class
  const getSubjectsForClass = useCallback(async (classId: string) => {
    if (!classId || !profile?.id) {
      return [];
    }

    try {

      const { data: enrollments, error } = await supabase
        .from('teacher_subject_enrollments')
        .select('subject_id')
        .eq('teacher_id', profile?.id)
        .eq('class_id', classId);

      if (error) throw error;


      const subjectIDs = [...new Set(enrollments?.map(item => item.subject_id) || [])];

      // Fetch full subject details
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .in('id', subjectIDs)
        .order('name');

      if (subjectsError) throw subjectsError;


      return subjectsData || [];
    } catch (error) {
      console.error('❌ Error fetching subjects for class:', error);
      return [];
    }
  }, [profile]);

  // Comprehensive refresh function
  const handleRefresh = async () => {
    try {
      await refetch();
      if (profile?.role === 'teacher' || profile?.role === 'admin') {
        await fetchClassesAndSubjects();
      }
    } catch (error) {
      console.error('❌ ExamsScreen: Error during refresh:', error);
      throw error;
    }
  };

  // Handle filter application
  const handleApplyFilters = (newFilters: ExamFilterData) => {
    setFilters(newFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.selectedClass !== '' ||
      filters.selectedSubject !== '' ||
      filters.statusFilter !== 'all' ||
      filters.checkedFilter !== 'all'
    );
  };

  // Filter quizzes based on selected class and subject
  const getFilteredQuizzes = () => {
    let filtered = quizzes;

    
    // Filter by class if selected
    if (filters.selectedClass) {
      filtered = filtered.filter(quiz => quiz.class_id === filters.selectedClass);
    }

    // Filter by subject if selected
    if (filters.selectedSubject) {
      filtered = filtered.filter(quiz => quiz.subject_id === filters.selectedSubject);
    }

    // Filter by status for schedule tab
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.status === filters.statusFilter);
    }

    return filtered;
  };

  // Get filtered results based on class, subject, and checked status
  const getAdvancedFilteredResults = () => {
    let filtered = quizResults;

    // Filter by class
    if (filters.selectedClass) {
      const classQuizIds = quizzes
        .filter(quiz => quiz.class_id === filters.selectedClass)
        .map(quiz => quiz.id);
      filtered = filtered.filter(result => classQuizIds.includes(result.quiz_id));
    }

    // Filter by subject
    if (filters.selectedSubject) {
      const subjectQuizIds = quizzes
        .filter(quiz =>
          quiz.subject_id === filters.selectedSubject &&
          (!filters.selectedClass || quiz.class_id === filters.selectedClass)
        )
        .map(quiz => quiz.id);
      filtered = filtered.filter(result => subjectQuizIds.includes(result.quiz_id));
    }

    // Filter by checked status
    if (filters.checkedFilter === 'checked') {
      filtered = filtered.filter(result => result.is_checked);
    } else if (filters.checkedFilter === 'unchecked') {
      filtered = filtered.filter(result => !result.is_checked);
    }

    return filtered;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        return (
          <ScheduleTab
            colors={colors}
            profile={profile}
            statusFilter={filters.statusFilter}
            setStatusFilter={(filter) => setFilters(prev => ({ ...prev, statusFilter: filter }))}
            getFilteredQuizzes={getFilteredQuizzes}
            updateQuizStatus={updateQuizStatus}
            setActiveTab={setActiveTab}
            selectedClass={filters.selectedClass}
            quizResults={quizResults}
            areAllResultsMarked={areAllResultsMarked}
            onRefresh={handleRefresh}
          />
        );
      case 'results':
        return (
          <ResultsTab
            colors={colors}
            profile={profile}
            selectedClass={filters.selectedClass}
            selectedSubject={filters.selectedSubject}
            setSelectedSubject={(subject) => setFilters(prev => ({ ...prev, selectedSubject: subject }))}
            checkedFilter={filters.checkedFilter}
            setCheckedFilter={(filter) => setFilters(prev => ({ ...prev, checkedFilter: filter }))}
            getSubjectsWithAll={() => []} // Not used anymore
            getFilteredResults={getAdvancedFilteredResults}
            setSelectedResult={setSelectedResult}
            setMarkingModalVisible={setMarkingModalVisible}
            quizzes={quizzes}
            quizResults={quizResults}
            subjects={subjects}
            classes={classes}
            onRefresh={handleRefresh}
          />
        );
      case 'reports':
        return (
          <ReportsTab
            colors={colors}
            profile={profile}
            selectedClass={filters.selectedClass}
            classes={classes}
            subjects={subjects}
            quizzes={getFilteredQuizzes()}
            quizResults={quizResults}
            onRefresh={handleRefresh}
          />
        );
      default:
        return null;
    }
  };

  // Automatically refresh whenever the screen becomes active
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [profile])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSections />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        <TabNavigation
          colors={colors}
          profile={profile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setModalVisible={setModalVisible}
          onFilterPress={() => setFilterModalVisible(true)}
          hasActiveFilters={hasActiveFilters()}
        />

        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>

        {/* Comprehensive Filter Modal */}
        {(profile?.role === 'teacher') ? (
          <ComprehensiveExamsFilterModal
            visible={filterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            classes={classes}
            subjects={subjects}
            currentFilters={filters}
            onApplyFilters={handleApplyFilters}
            userRole={profile?.role || 'student'}
            activeTab={activeTab}
            getSubjectsForClass={getSubjectsForClass}
          />
        ) :
          null
        }


        {(profile?.role === 'teacher' || profile?.role === 'admin') && (
          <>
            <CreateQuizModal
              colors={colors}
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              subjects={subjects}
              classes={classes}
              selectedClass={filters.selectedClass}
              createQuiz={createQuiz}
              getSubjectsForClass={getSubjectsForClass}
            />

            <MarkingModal
              colors={colors}
              markingModalVisible={markingModalVisible}
              setMarkingModalVisible={setMarkingModalVisible}
              selectedResult={selectedResult}
              setSelectedResult={setSelectedResult}
              markQuizResult={markQuizResult}
            />
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -10
  },
});