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
import TopSection from '../common/TopSections';

export default function LecturesScreen() {
  const { profile, student } = useAuth();
  const { colors } = useTheme();

  // State
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Initialize
  useEffect(() => {
    loadLectures();
  }, [profile]);

  // Filter lectures when search changes
  useEffect(() => {
    if (!lectures.length) return;

    let updatedLectures = [...lectures];

    // 👩‍🎓 If student, only show lectures of their class
    if (profile?.role === "student" && student?.class_id) {
      updatedLectures = updatedLectures.filter(
        item => item.class_id === student.class_id
      );
    }

    // 🔍 If search query is entered, filter further
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      updatedLectures = updatedLectures.filter(
        lecture =>
          lecture.title?.toLowerCase().includes(query) ||
          lecture.description?.toLowerCase().includes(query) ||
          lecture.classes?.name?.toLowerCase().includes(query) ||
          lecture.subjects?.name?.toLowerCase().includes(query)
      );
      console.log("🔍 After search filter:", updatedLectures.length);
    }

    setFilteredLectures(updatedLectures);
  }, [lectures, searchQuery, profile, student]);

  const loadLectures = async () => {
    if (!profile) return;

    try {
      const data = await lectureService.fetchLectures({ userId: profile.id });

      let filteredData = data;

      // 👩‍🎓 If student, only keep their class lectures
      if (profile.role === "student" && student?.class_id) {
        filteredData = data.filter(item => item.class_id === student.class_id);
      }

      setLectures(filteredData);
      setFilteredLectures(filteredData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load lectures');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLectures();
  }, [profile]);


  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BookOpen size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'No lectures found' : 'No lectures available'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {profile?.role === 'teacher' && !searchQuery
          ? 'Tap the + button to upload your first lecture'
          : 'Check back later for new content'}
      </Text>
    </View>
  );

  const renderLecture = ({ item }: { item: Lecture }) => (
    <LectureCard lecture={item} onRefresh={loadLectures} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
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

          {/* <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity> */}

          {profile?.role === 'teacher' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
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
        // ListEmptyComponent={!loading ? renderEmpty : null}
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
      {profile?.role === 'teacher' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setUploadModalVisible(true)}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Upload Modal */}
      <UploadLectureModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={loadLectures}
      />
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    // borderWidth: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    // marginTop: 16,
    // marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
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
    // paddingHorizontal: 24,
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
    fontSize: 16,
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