// src/screens/LecturesScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Filter, BookOpen, X } from 'lucide-react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { lectureService } from '@/src/services/lecture.service';
import { Lecture } from '@/src/types/lectures';
import LectureCard from '@/src/components/lectures/LectureCard';
import UploadLectureModal from '@/src/components/lectures/UploadLectureModal';
import EditLectureModal from '@/src/components/lectures/EditLectureModal';
import TopSection from '../common/TopSections';
import { useFocusEffect } from '@react-navigation/native';
import SubjectFilter from '../common/SubjectFilter';
import { supabase } from '@/src/lib/supabase';
import { Animated } from 'react-native';
import { useScreenAnimation, useButtonAnimation } from '@/src/utils/animations';


export default function LecturesScreen() {
  const { profile, student } = useAuth();
  const { colors } = useTheme();
  const screenStyle = useScreenAnimation();
  const ButtonAnimation = useButtonAnimation();

  // State
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (profile?.id && profile?.role) {
      loadLectures();
    }
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    if (profile?.id && profile?.role) {
      fetchSubjects();
    }
  }, [profile?.id, profile?.role]);

  const fetchSubjects = async () => {
    try {
      if (!profile?.id || !profile?.role) {
        // console.log('⚠️ Profile or role not available yet');
        return;
      }

      // console.log('🔍 Fetching subjects for:', profile.role, profile.id);

      // For students, get their class_id from student table
      let userClassId = null;

      if (profile.role === 'student') {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('class_id')
          .eq('id', profile.id)
          .single();

        if (studentError) {
          console.error('Error fetching student class:', studentError);
          return;
        }

        userClassId = studentData?.class_id;

        if (!userClassId) {
          return;
        }
      }

      // Fetch subjects from enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_subject_enrollments')
        .select('subject_id')
        .eq(profile.role === 'teacher' ? 'teacher_id' : 'student_id', profile.id)
        .eq('is_active', true);

      if (enrollmentError) {
        console.error('Error fetching enrollments:', enrollmentError);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        setSubjects([]);
        return;
      }

      // Get unique subject IDs
      const subjectIds = [...new Set(enrollments.map(e => e.subject_id))];


      // Fetch subject details
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, description')
        .in('id', subjectIds)
        .eq('is_active', true)
        .order('name');

      if (subjectsError) throw subjectsError;

      setSubjects(subjectsData || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  // Filter lectures when search changes
  useEffect(() => {
    if (!lectures.length) {
      setFilteredLectures([]);
      return;
    }

    let updatedLectures = [...lectures];

    // Filter by selected subject
    if (selectedSubject) {
      updatedLectures = updatedLectures.filter(
        lecture => lecture.subject_id === selectedSubject
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      updatedLectures = updatedLectures.filter(
        lecture =>
          lecture.title?.toLowerCase().includes(query) ||
          lecture.description?.toLowerCase().includes(query) ||
          lecture.classes?.name?.toLowerCase().includes(query) ||
          lecture.subjects?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredLectures(updatedLectures);
  }, [lectures, searchQuery, selectedSubject]);

  // 🔄 Automatically refresh when the screen becomes active
  useFocusEffect(
    useCallback(() => {
      if (profile?.id && profile?.role) {
        onRefresh();
      }
    }, [profile?.id, profile?.role])
  );

  const loadLectures = async () => {
    if (!profile?.id || !profile?.role) {
      return;
    }

    try {
      setLoading(true);


      const data = await lectureService.fetchLectures({
        userId: profile.id,
        role: profile.role,
      });


      setLectures(data || []);
      setFilteredLectures(data || []);
    } catch (error) {
      console.error('Error loading lectures:', error);
      Alert.alert('Error', 'Failed to load lectures');
      setLectures([]);
      setFilteredLectures([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLectures();
  }, [profile?.id, profile?.role]);

  const handleEdit = (lecture: Lecture) => {
    setSelectedLecture(lecture);
    setEditModalVisible(true);
  };

  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setSelectedLecture(null);
    loadLectures();
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BookOpen size={48} color={colors.textSecondary} />
      <Text allowFontScaling={false} style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No lectures found' : 'No lectures available'}
      </Text>
      <Text allowFontScaling={false} style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {(profile?.role === 'teacher' || profile?.role === 'admin') && !searchQuery
          ? 'Tap the + button to upload your first lecture'
          : 'Check back later for new content'}
      </Text>
    </View>
  );

  const renderLecture = ({ item }: { item: Lecture }) => (
    <LectureCard
      lecture={item}
      onRefresh={loadLectures}
      onEdit={handleEdit}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <Animated.View style={screenStyle}>
        <TopSection />

        <View style={styles.header}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search lectures..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
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

            {(profile?.role === 'teacher' || profile?.role === 'admin') && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setUploadModalVisible(true)}
              >
                <Plus size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Lectures List */}
        <FlatList
          data={filteredLectures}
          renderItem={renderLecture}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? renderEmpty : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Upload Button (Teachers Only) */}
        {/* {(profile?.role === 'teacher' || profile?.role === 'admin') && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setUploadModalVisible(true)}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        )} */}

        {/* Upload Modal */}
        <UploadLectureModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          onSuccess={loadLectures}
        />

        {/* Edit Modal */}
        <EditLectureModal
          visible={editModalVisible}
          lecture={selectedLecture}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedLecture(null);
          }}
          onSuccess={handleEditSuccess}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

import { TextSizes } from '@/src/styles/TextSizes';


export const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    marginLeft: 12,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    marginTop: -12,
  },
  title: {
    fontSize: TextSizes.header, // 14
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: TextSizes.large, // 12
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: TextSizes.normal, // 10
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16, // 👈 bigger for usability
    marginLeft: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});


// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     paddingHorizontal: 24,
//     marginTop: -12
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 15,
//   },
//   searchBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     height: 44,
//     borderWidth: 1,
//   },
//   listContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 100,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginTop: 16,
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     textAlign: 'center',
//     paddingHorizontal: 40,
//     marginTop: 8,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     paddingTop: 16,
//     paddingBottom: 16,
//     gap: 12,
//   },
//   searchInputContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     borderWidth: 1,
//   },
//   searchInput: {
//     flex: 1,
//     height: 48,
//     fontSize: 16,
//     marginLeft: 12,
//   },
//   actionButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1,
//   },
// });