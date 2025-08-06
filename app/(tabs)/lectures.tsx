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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { sendWhatsAppMessage, formatLectureMessage } from '@/lib/whatsapp';
import * as DocumentPicker from 'expo-document-picker';
import { 
  Plus, 
  BookOpen, 
  Download, 
  Calendar,
  FileText,
  Video,
  X,
  Upload
} from 'lucide-react-native';

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
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
    return <FileText size={20} color="#274d71" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lectures</Text>
        {profile?.role === 'teacher' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lectures List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading lectures...</Text>
          </View>
        ) : lectures.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookOpen size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No lectures available</Text>
            <Text style={styles.emptySubtext}>
              {profile?.role === 'teacher' 
                ? 'Upload your first lecture to get started' 
                : 'Check back later for new lectures'}
            </Text>
          </View>
        ) : (
          lectures.map((lecture) => (
            <View key={lecture.id} style={styles.lectureCard}>
              <View style={styles.lectureHeader}>
                <View style={styles.fileIconContainer}>
                  {getFileIcon(lecture.file_type)}
                </View>
                <View style={styles.lectureInfo}>
                  <Text style={styles.lectureTitle}>{lecture.title}</Text>
                  <View style={styles.lectureDetails}>
                    <View style={styles.detailItem}>
                      <BookOpen size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{lecture.classes?.name}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Calendar size={14} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {new Date(lecture.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  {lecture.description && (
                    <Text style={styles.lectureDescription}>{lecture.description}</Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity style={styles.downloadButton}>
                <Download size={16} color="#274d71" />
                <Text style={styles.downloadButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Upload Lecture Modal */}
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
                <Text style={styles.modalTitle}>Upload Lecture</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Lecture Title</Text>
                  <TextInput
                    style={styles.input}
                    value={newLecture.title}
                    onChangeText={(text) => setNewLecture({...newLecture, title: text})}
                    placeholder="Enter lecture title"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newLecture.description}
                    onChangeText={(text) => setNewLecture({...newLecture, description: text})}
                    placeholder="Enter lecture description"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Class</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.classOptions}>
                      {classes.map((classItem) => (
                        <TouchableOpacity
                          key={classItem.id}
                          style={[
                            styles.classOption,
                            newLecture.class_id === classItem.id && styles.classOptionSelected,
                          ]}
                          onPress={() => setNewLecture({...newLecture, class_id: classItem.id})}
                        >
                          <Text style={[
                            styles.classOptionText,
                            newLecture.class_id === classItem.id && styles.classOptionTextSelected,
                          ]}>
                            {classItem.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>File</Text>
                  <TouchableOpacity
                    style={styles.filePickerButton}
                    onPress={pickDocument}
                  >
                    <Upload size={20} color="#274d71" />
                    <Text style={styles.filePickerText}>
                      {newLecture.file ? newLecture.file.name : 'Select file (PDF, Video, Image)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
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
  lectureCard: {
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
  lectureHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
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
    color: '#111827',
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
    color: '#6B7280',
    marginLeft: 4,
  },
  lectureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#274d71',
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
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  classOptionSelected: {
    backgroundColor: '#274d71',
    borderColor: '#274d71',
  },
  classOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  classOptionTextSelected: {
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