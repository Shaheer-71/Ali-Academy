// ExamsScreen.tsx - Updated with refresh functionality
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import TopSections from '@/components/TopSections';
import TabNavigation from '../exams/TabNavigation';
import ClassFilter from '../exams/ClassFilter';
import ScheduleTab from '../exams/ScheduleTab';
import ResultsTab from '../exams/ResultsTab';
import ReportsTab from '../exams/ReportsTab';
import CreateQuizModal from '../exams/CreateQuizModal';
import MarkingModal from '../exams/MarkingModal';
import { supabase } from '@/lib/supabase';

export default function ExamsScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  
  // State management
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'schedule' | 'results' | 'reports'>('schedule');
  const [modalVisible, setModalVisible] = useState(false);
  const [markingModalVisible, setMarkingModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [checkedFilter, setCheckedFilter] = useState<'all' | 'checked' | 'unchecked'>('all');

  // Get data WITHOUT class filtering in the hook - we'll filter in the component
  const { 
    quizzes, 
    subjects, 
    quizResults, 
    classesSubjects, // NEW: Get class-subject relationships
    loading, 
    createQuiz, 
    markQuizResult, 
    updateQuizStatus,
    getFilteredResults, // NEW: Get advanced filtering function
    getSubjectsForClass, // NEW: Get subjects for specific class
    areAllResultsMarked, // NEW: Check if all results are marked
    refetch, // Get the refetch function from the hook
  } = useQuizzes();

  useEffect(() => {
    fetchClasses();
  }, []);

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
      // Use the refetch function from the hook to refresh quiz data
      await refetch();
      
      // Also refresh classes data
      await fetchClasses();
      
      // console.log('✅ ExamsScreen: Refresh completed successfully');
    } catch (error) {
      console.error('❌ ExamsScreen: Error during refresh:', error);
      throw error; // Re-throw so components can handle loading states
    }
  };

  // Filter functions
  const getFilteredQuizzes = () => {
    let filtered = quizzes;

    // Filter by class if a specific class is selected
    if (selectedClass !== 'all') {
      filtered = filtered.filter(quiz => quiz.class_id === selectedClass);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quiz => quiz.status === statusFilter);
    }

    return filtered;
  };

  // FIXED: Rename function to match what ResultsTab expects
  const getSubjectsWithAll = (classId?: string) => {
    // Use the passed classId parameter or fall back to selectedClass
    const targetClass = classId || selectedClass;
    
    // console.log('=== REAL-TIME SUBJECTS FILTERING ===');
    // console.log('Target class:', targetClass, typeof targetClass);
    // console.log('All subjects:', subjects.map(s => ({id: s.id, name: s.name})));
    // console.log('All quizzes:', quizzes.map(q => ({
    //   id: q.id, 
    //   title: q.title, 
    //   class_id: q.class_id, 
    //   subject_id: q.subject_id
    // })));
    
    let filteredSubjects = subjects;
    
    if (targetClass !== 'all') {
      // Get all quizzes for the selected class - ensure type matching
      const classQuizzes = quizzes.filter(quiz => {
        // Convert both to strings for comparison to avoid type issues
        const quizClassId = String(quiz.class_id);
        const selectedClassStr = String(targetClass);
        const match = quizClassId === selectedClassStr;
        
        // console.log(`Quiz "${quiz.title}": quiz.class_id="${quizClassId}" vs targetClass="${selectedClassStr}", match: ${match}`);
        return match;
      });
      
      // console.log('Class quizzes found:', classQuizzes.length);
      // console.log('Class quizzes details:', classQuizzes.map(q => ({title: q.title, subject_id: q.subject_id})));
      
      // Get unique subject IDs from those quizzes
      const subjectIdsInClass = [...new Set(classQuizzes.map(quiz => quiz.subject_id))];
      // console.log('Subject IDs in class:', subjectIdsInClass);
      
      // Filter subjects to only those that have quizzes in this class
      filteredSubjects = subjects.filter(subject => {
        const included = subjectIdsInClass.includes(subject.id);
        // console.log(`Subject "${subject.name}" (${subject.id}) included: ${included}`);
        return included;
      });
      
      // console.log('Filtered subjects for class:', filteredSubjects.map(s => s.name));
    } else {
      // For "all classes", show all subjects that have any quizzes
      const allSubjectIds = [...new Set(quizzes.map(quiz => quiz.subject_id))];
      filteredSubjects = subjects.filter(subject => 
        allSubjectIds.includes(subject.id)
      );
      // console.log('All classes - subjects with quizzes:', filteredSubjects.map(s => s.name));
    }
    
    const result = [
      { id: 'all', name: 'All Subjects' },
      ...filteredSubjects
    ];
    
    // console.log('Final subjects list:', result.map(s => s.name));
    // console.log('Expected for Class 10: All Subjects, Mathematics, Physics, Chemistry, Computer Science');
    // console.log('==========================================');
    
    return result;
  };

  const getClassesWithAll = () => {
    return [
      { id: 'all', name: 'All Classes' },
      ...classes
    ];
  };

  // Reset selectedSubject when class changes
  useEffect(() => {
    // console.log('🔄 Class changed to:', selectedClass);
    setSelectedSubject('all');
  }, [selectedClass]);

  // Add useEffect to trigger re-render when data changes
  useEffect(() => {
    // console.log('📊 Data updated - Quizzes:', quizzes.length, 'Subjects:', subjects.length);
  }, [quizzes, subjects]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        return (
          <ScheduleTab
            colors={colors}
            profile={profile}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            getFilteredQuizzes={getFilteredQuizzes}
            updateQuizStatus={updateQuizStatus}
            setActiveTab={setActiveTab}
            selectedClass={selectedClass}
            quizResults={quizResults} // ADDED: Pass quiz results for marking status
            areAllResultsMarked={areAllResultsMarked} // NEW: Pass function to check marking status
            onRefresh={handleRefresh} // ADDED: Pass refresh function
          />
        );
      case 'results':
        return (
          <ResultsTab
            colors={colors}
            profile={profile}
            selectedClass={selectedClass}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            checkedFilter={checkedFilter}
            setCheckedFilter={setCheckedFilter}
            getSubjectsWithAll={getSubjectsWithAll}
            getFilteredResults={getFilteredResults} // NEW: Pass the advanced filtering function
            setSelectedResult={setSelectedResult}
            setMarkingModalVisible={setMarkingModalVisible}
            quizzes={quizzes}
            quizResults={quizResults}
            subjects={subjects}
            classes={classes}
            onRefresh={handleRefresh} // NEW: Pass refresh function to ResultsTab
          />
        );
      case 'reports':
        // console.log('🔄 ExamsScreen: Rendering ReportsTab with onRefresh:', !!handleRefresh);
        return (
          <ReportsTab
            colors={colors}
            profile={profile}
            selectedClass={selectedClass}
            classes={classes}
            subjects={subjects}
            quizzes={quizzes}
            quizResults={quizResults}
            onRefresh={handleRefresh} // NEW: Pass refresh function to ReportsTab
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
        />

        {profile?.role === 'teacher' && (
          <ClassFilter
            colors={colors}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            classes={getClassesWithAll()}
          />
        )}

        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>

        {profile?.role === 'teacher' && (
          <>
            <CreateQuizModal
              colors={colors}
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              subjects={subjects}
              classes={classes}
              selectedClass={selectedClass}
              createQuiz={createQuiz}
              getSubjectsForClass={getSubjectsForClass} // NEW: Pass the function to get subjects for class
            />

            <MarkingModal
              colors={colors}
              markingModalVisible={markingModalVisible}
              setMarkingModalVisible={setMarkingModalVisible}
              selectedResult={selectedResult}
              setSelectedResult={setSelectedResult}
              markQuizResult={markQuizResult} // Use the hook's function for automatic data refresh
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
    paddingBottom : 20
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
});