import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BookOpen, Download, Calendar, Video, FileText, User } from 'lucide-react-native';

interface Lecture {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  created_at: string;
  classes?: { name: string };
  profiles?: { full_name: string };
}

interface LectureCardProps {
  lecture: Lecture;
  onDownload?: () => void;
  onPress?: () => void;
}

export const LectureCard: React.FC<LectureCardProps> = ({
  lecture,
  onDownload,
  onPress,
}) => {
  const getFileIcon = () => {
    if (lecture.file_type.includes('video')) {
      return <Video size={20} color="#8B5CF6" />;
    }
    return <FileText size={20} color="#274d71" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          {getFileIcon()}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {lecture.title}
          </Text>
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <BookOpen size={12} color="#6B7280" />
              <Text style={styles.metadataText}>{lecture.classes?.name}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Calendar size={12} color="#6B7280" />
              <Text style={styles.metadataText}>{formatDate(lecture.created_at)}</Text>
            </View>
            {lecture.profiles && (
              <View style={styles.metadataItem}>
                <User size={12} color="#6B7280" />
                <Text style={styles.metadataText}>{lecture.profiles.full_name}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {lecture.description && (
        <Text style={styles.description} numberOfLines={2}>
          {lecture.description}
        </Text>
      )}

      <TouchableOpacity style={styles.downloadButton} onPress={onDownload}>
        <Download size={16} color="#274d71" />
        <Text style={styles.downloadText}>Download</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
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
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 6,
  },
  metadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  downloadText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#274d71',
  },
});