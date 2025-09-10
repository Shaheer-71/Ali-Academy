// src/components/lectures/LectureCard.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  Video,
  Image as ImageIcon,
  Download,
  Eye,
  Share2,
  Youtube,
  Calendar,
  BookOpen,
} from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Lecture } from '@/src/types/lectures';
import { lectureService } from '@/src/services/lecture.service';

interface LectureCardProps {
  lecture: Lecture;
  onRefresh?: () => void;
}

export default function LectureCard({ lecture, onRefresh }: LectureCardProps) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const getFileIcon = () => {
    const iconProps = { size: 20, color: '#fff' };

    if (lecture.file_type.includes('video')) return <Video {...iconProps} />;
    if (lecture.file_type.includes('image')) return <ImageIcon {...iconProps} />;
    return <FileText {...iconProps} />;
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)}KB` : `${mb.toFixed(1)}MB`;
  };

  // Handle view action
  const handleView = async () => {
    try {
      await lectureService.viewLecture(lecture, profile!.id);
      onRefresh?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to open the file');
    }
  };

  // Handle download action
  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      await lectureService.downloadLecture(lecture, profile!.id);
      Alert.alert('Success', 'File downloaded successfully');
      onRefresh?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to download the file');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle share action
  const handleShare = async () => {
    try {
      await lectureService.shareLecture(lecture);
    } catch (error) {
      Alert.alert('Error', 'Failed to share the lecture');
    }
  };

  // Handle YouTube link
  const handleYouTube = async () => {
    if (!lecture.youtube_link) return;

    try {
      await lectureService.openYouTubeLink(lecture.youtube_link);
    } catch (error) {
      Alert.alert('Error', 'Failed to open YouTube link');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
          {getFileIcon()}
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]}>{lecture.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <BookOpen size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {lecture.classes?.name}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <FileText size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {lecture.subjects?.name}
              </Text>
            </View>

            {lecture.file_size && (
              <Text style={[styles.sizeText, { color: colors.textSecondary }]}>
                {formatFileSize(lecture.file_size)}
              </Text>
            )}
          </View>

          {/* Description */}
          {lecture.description && (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {lecture.description}
            </Text>
          )}

          {/* Upload Info */}
          <View style={styles.uploadInfo}>
            <Text style={[styles.uploadedBy, { color: colors.textSecondary }]}>
              By {lecture.profiles?.full_name}
            </Text>
            <View style={styles.metaItem}>
              <Calendar size={10} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {new Date(lecture.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleView}
        >
          <Eye size={13} color={lecture.has_viewed ? colors.success : colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {lecture.has_viewed ? 'Viewed' : 'View'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator size={10} color={colors.primary} />
          ) : (
            <Download size={13} color={lecture.has_downloaded ? colors.success : colors.primary} />
          )}
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {isDownloading ? null : lecture.has_downloaded ? 'Downloaded' : 'Download'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              opacity: lecture.youtube_link ? 1 : 0.5
            }
          ]}
          onPress={handleYouTube}
          disabled={!lecture.youtube_link}
        >
          <Youtube size={13} color={lecture.youtube_link ? '#FF0000' : colors.textSecondary} />
          <Text style={[styles.actionText, { color: lecture.youtube_link ? colors.text : colors.textSecondary }]}>
            YouTube
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleShare}
        >
          <Share2 size={13} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  sizeText: {
    fontSize: 10,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  uploadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadedBy: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  dateText: {
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
  },
});