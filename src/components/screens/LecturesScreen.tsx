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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { uploadToCloudinary } from '@/src/lib/cloudinary';
import { sendWhatsAppMessage, formatLectureMessage } from '@/src/lib/whatsapp';
import * as DocumentPicker from 'expo-document-picker';
import {
  Plus,
  BookOpen,
  Download,
  Calendar,
  FileText,
  Video,
  X,
  Upload,
  Search
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';

interface Lecture {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  class_id: string;
  created_at: string;
  classes?: { name: string };
  profiles?: { full_name: string };
}

export default function LecturesScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [newLecture, setNewLecture] = useState({
    title: '',
    description: '',
    class_id: '',
    file: null as any,
  });

  useEffect(() => {
    fetchLectures();
    if (profile?.role === 'teacher') {
      fetchClasses();
    }
  }, [profile]);

  const fetchLectures = async () => {
    try {
      let query = supabase
        .from('lectures')
        .select(`
          *,
          classes (name),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      // If student/parent, filter by their class
      if (profile?.role !== 'teacher') {
        // This would need additional logic to determine student's class
        // For now, show all lectures
      }

      const { data, error } = await query;

      if (error) throw error;
      setLectures(data || []);
    } catch (error) {
      console.error('Error fetching lectures:', error);
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

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'video/*', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setNewLecture(prev => ({
          ...prev,
          file: result.assets[0],
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUploadLecture = async () => {
    if (!newLecture.title || !newLecture.class_id || !newLecture.file) {
      Alert.alert('Error', 'Please fill in all required fields and select a file');
      return;
    }

    setUploading(true);
    try {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(newLecture.file, 'raw');

      // Save to database
      const { data, error } = await supabase
        .from('lectures')
        .insert([{
          title: newLecture.title,
          description: newLecture.description,
          file_url: uploadResult.secure_url,
          file_type: newLecture.file.mimeType || 'application/pdf',
          class_id: newLecture.class_id,
          uploaded_by: profile!.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp messages to all students in the class
      const { data: students } = await supabase
        .from('students')
        .select('parent_contact')
        .eq('class_id', newLecture.class_id);

      const className = classes.find(c => c.id === newLecture.class_id)?.name;

      if (students && className) {
        const message = formatLectureMessage(newLecture.title, className);

        for (const student of students) {
          if (student.parent_contact) {
            await sendWhatsAppMessage({
              to: student.parent_contact,
              message,
              type: 'lecture',
            });
          }
        }
      }

      Alert.alert('Success', 'Lecture uploaded successfully');
      setModalVisible(false);
      setNewLecture({
        title: '',
        description: '',
        class_id: '',
        file: null,
      });
      fetchLectures();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('video')) {
      return <Video size={20} color="#8B5CF6" />;
    }
    return <FileText size={20} color="#fff" />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSections />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        {/* Header */}
        {/* <View style={styles.header}>
          <Text style={styles.title}>Lectures</Text>
          
        </View> */}

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
          {profile?.role === 'teacher' && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>


        {/* Lectures List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading lectures...</Text>
            </View>
          ) : lectures.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No lectures available</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {profile?.role === 'teacher'
                  ? 'Upload your first lecture to get started'
                  : 'Check back later for new lectures'}
              </Text>
            </View>
          ) : (
            lectures.map((lecture) => (
              <View key={lecture.id} style={[styles.lectureCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.lectureHeader}>
                  <View style={[styles.fileIconContainer, { backgroundColor: colors.primary }]}>
                    {getFileIcon(lecture.file_type)}
                  </View>
                  <View style={styles.lectureInfo}>
                    <Text style={[styles.lectureTitle, { color: colors.text }]}>{lecture.title}</Text>
                    <View style={styles.lectureDetails}>
                      <View style={styles.detailItem}>
                        <BookOpen size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>{lecture.classes?.name}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          {new Date(lecture.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    {lecture.description && (
                      <Text style={[styles.lectureDescription, { color: colors.textSecondary }]}>{lecture.description}</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={[styles.downloadButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Download size={16} color={colors.primary} />
                  <Text style={[styles.downloadButtonText, { color: colors.primary }]}>Download</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Upload Lecture Modal */}
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
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Upload Lecture</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <X size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScrollView}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Lecture Title</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                      value={newLecture.title}
                      onChangeText={(text) => setNewLecture({ ...newLecture, title: text })}
                      placeholder="Enter lecture title"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                      value={newLecture.description}
                      onChangeText={(text) => setNewLecture({ ...newLecture, description: text })}
                      placeholder="Enter lecture description"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={3}
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
                              newLecture.class_id === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => setNewLecture({ ...newLecture, class_id: classItem.id })}
                          >
                            <Text style={[
                              styles.classOptionText,
                              { color: colors.text },
                              newLecture.class_id === classItem.id && { color: '#ffffff' },
                            ]}>
                              {classItem.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>File</Text>
                    <TouchableOpacity
                      style={[styles.filePickerButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                      onPress={pickDocument}
                    >
                      <Upload size={20} color={colors.primary} />
                      <Text style={[styles.filePickerText, { color: colors.text }]}>
                        {newLecture.file ? newLecture.file.name : 'Select file (PDF, Video, Image)'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }, uploading && styles.submitButtonDisabled]}
                    onPress={handleUploadLecture}
                    disabled={uploading}
                  >
                    <Text style={styles.submitButtonText}>
                      {uploading ? 'Uploading...' : 'Upload Lecture'}
                    </Text>
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
  lectureCard: {
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
  lectureHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  lectureInfo: {
    flex: 1,
  },
  lectureTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  lectureDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 4,
  },
  lectureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
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
    paddingBottom: 24,
    paddingTop: 24,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
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
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  filePickerText: {
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
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
});