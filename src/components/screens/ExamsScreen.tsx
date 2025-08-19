// ExamsScreen.tsx - Updated with comprehensive filter system
import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'schedule' | 'results' | 'reports'>('schedule');
  const [modalVisible, setModalVisible] = useState(false);
  const [markingModalVisible, setMarkingModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  
  // NEW: Comprehensive filter state
  const [filters, setFilters] = useState<ExamFilterData>({
    selectedClass: 'all',
    selectedSubject: 'all',
    statusFilter: 'all',
    checkedFilter: 'all',
  });

  // NEW: Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Get data WITHOUT class filtering in the hook - we'll filter in the component
  const { 
    quizzes, 
    subjects, 
    quizResults, 
    classesSubjects,
    loading, 
    createQuiz, 
    markQuizResult, 
    updateQuizStatus,
    getFilteredResults,
    getSubjectsForClass,
    areAllResultsMarked,
    refetch,
  } = useQuizzes();

  useEffect(() => {
    fetchClasses();
  }, []);

  // Set default class when classes are loaded
  useEffect(() => {
    if (classes.length > 0 && filters.selectedClass === 'all') {
      if (profile?.role === 'student') {
        // For students, keep 'all' or set to their class if you have that logic
        setFilters(prev => ({ ...prev, selectedClass: 'all' }));
      } else {
        // For teachers, set to first class
        setFilters(prev => ({ ...prev, selectedClass: classes[0].id }));
      }
    }
  }, [classes, profile, filters.selectedClass]);

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

  // ENHANCED: Comprehensive refresh function
  const handleRefresh = async () => {
    try {
      await refetch();
      await fetchClasses();
    } catch (error) {
      console.error('❌ ExamsScreen: Error during refresh:', error);
      throw error;
    }
  };

  // NEW: Handle filter application
  const handleApplyFilters = (newFilters: ExamFilterData) => {
    setFilters(newFilters);
  };

  // NEW: Check if any filters are active
  const hasActiveFilters = () => {
    const defaultFilters: ExamFilterData = {
      selectedClass: 'all',
      selectedSubject: 'all',
      statusFilter: 'all',
      checkedFilter: 'all',
    };
    
    return (
      filters.selectedClass !== defaultFilters.selectedClass ||
      filters.selectedSubject !== defaultFilters.selectedSubject ||
      filters.statusFilter !== defaultFilters.statusFilter ||
      filters.checkedFilter !== defaultFilters.checkedFilter
    );
  };

  // Filter functions - UPDATED to use comprehensive filters
  const getFilteredQuizzes = () => {
    let filtered = quizzes;

    // Filter by class if a specific class is selected
    if (filters.selectedClass !== 'all') {
      filtered = filtered.filter(quiz => quiz.class_id === filters.selectedClass);
    }

    // Filter by subject if a specific subject is selected
    if (filters.selectedSubject !== 'all') {
      filtered = filtered.filter(quiz => quiz.subject_id === filters.selectedSubject);
    }

    // Filter by status for schedule tab
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.status === filters.statusFilter);
    }

    return filtered;
  };

  // ENHANCED: Get subjects with all option, filtered by class
  const getSubjectsWithAll = (classId?: string) => {
    const targetClass = classId || filters.selectedClass;
    
    let filteredSubjects = subjects;
    
    if (targetClass !== 'all') {
      const classQuizzes = quizzes.filter(quiz => {
        const quizClassId = String(quiz.class_id);
        const selectedClassStr = String(targetClass);
        return quizClassId === selectedClassStr;
      });
      
      const subjectIdsInClass = [...new Set(classQuizzes.map(quiz => quiz.subject_id))];
      filteredSubjects = subjects.filter(subject => 
        subjectIdsInClass.includes(subject.id)
      );
    } else {
      const allSubjectIds = [...new Set(quizzes.map(quiz => quiz.subject_id))];
      filteredSubjects = subjects.filter(subject => 
        allSubjectIds.includes(subject.id)
      );
    }
    
    return [
      { id: 'all', name: 'All Subjects' },
      ...filteredSubjects
    ];
  };

  const getClassesWithAll = () => {
    return [
      { id: 'all', name: 'All Classes' },
      ...classes
    ];
  };

  // ENHANCED: Advanced filtering function for results
  const getAdvancedFilteredResults = () => {
    return getFilteredResults(filters.selectedClass, filters.selectedSubject, filters.checkedFilter);
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
            getSubjectsWithAll={getSubjectsWithAll}
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
            quizzes={getFilteredQuizzes()} // Pass filtered quizzes
            quizResults={quizResults}
            onRefresh={handleRefresh}
          />
        );
      default:
        return null;
    }
  };

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
        <ComprehensiveExamsFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          classes={classes}
          subjects={subjects}
          currentFilters={filters}
          onApplyFilters={handleApplyFilters}
          userRole={profile?.role || 'student'}
          activeTab={activeTab}
          getSubjectsWithAll={getSubjectsWithAll}
        />

        {profile?.role === 'teacher' && (
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
  },
});