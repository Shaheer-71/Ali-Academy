// src/components/lectures/LectureCard.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
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
  Edit,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Lecture } from '@/src/types/lectures';
import { lectureService } from '@/src/services/lecture.service';
import { TextSizes } from '@/src/styles/TextSizes';

interface LectureCardProps {
  lecture: Lecture;
  onRefresh?: () => void;
  onEdit?: (lecture: Lecture) => void;
}

export default function LectureCard({ lecture, onRefresh, onEdit }: LectureCardProps) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Swipe animation
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);

  const SWIPE_THRESHOLD = -100;
  const ACTION_WIDTH = 150;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
          (profile?.role === 'teacher' || profile?.role === 'admin') &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
          Math.abs(gesture.dx) > 10
        );
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dx < 0) {
          translateX.setValue(Math.max(gesture.dx, -ACTION_WIDTH));
        } else if (isSwipedLeft) {
          translateX.setValue(Math.max(gesture.dx - ACTION_WIDTH, -ACTION_WIDTH));
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < SWIPE_THRESHOLD) {
          setIsSwipedLeft(true);
          Animated.spring(translateX, {
            toValue: -ACTION_WIDTH,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        } else {
          setIsSwipedLeft(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const resetSwipe = () => {
    setIsSwipedLeft(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const getFileIcon = () => {
    const iconProps = { size: 20, color: "#ffffff" };

    if (lecture.file_type.includes('video')) return <Video {...iconProps} />;
    if (lecture.file_type.includes('image')) return <ImageIcon {...iconProps} />;
    return <FileText {...iconProps} />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)}KB` : `${mb.toFixed(1)}MB`;
  };

  const handleView = async () => {
    try {
      await lectureService.viewLecture(lecture, profile!.id);
      onRefresh?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to open the file');
    }
  };

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

  const handleShare = async () => {
    try {
      await lectureService.shareLecture(lecture);
    } catch (error) {
      Alert.alert('Error', 'Failed to share the lecture');
    }
  };

  const handleYouTube = async () => {
    if (!lecture.youtube_link) return;

    try {
      await lectureService.openYouTubeLink(lecture.youtube_link);
    } catch (error) {
      Alert.alert('Error', 'Failed to open YouTube link');
    }
  };

  const handleEdit = () => {
    resetSwipe();
    onEdit?.(lecture);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lecture',
      `Are you sure you want to delete "${lecture.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await lectureService.deleteLecture(lecture.id);
              Alert.alert('Success', 'Lecture deleted successfully');
              onRefresh?.();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lecture');
            } finally {
              setIsDeleting(false);
              resetSwipe();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canSwipe = profile?.role === 'teacher' || profile?.role === 'admin';

  return (
    <View style={styles.container}>
      {/* Action buttons (shown when swiped) */}
      {canSwipe && (
        <View style={styles.actionsBackground}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
            onPress={handleEdit}
            disabled={isDeleting}
          >
            <Edit size={20} color={colors.primary} />
            <Text allowFontScaling={false} style={[styles.actionBtnText, { color: colors.primary }]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.background }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Trash2 size={20} color="#EF4444" />
                <Text allowFontScaling={false} style={[styles.actionBtnText, { color: '#EF4444' }]}>
                  Delete
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Main card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateX }],
          },
        ]}
        {...(canSwipe ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={resetSwipe}
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.quizIcon, { backgroundColor: colors.primary }]}>
              {getFileIcon()}
            </View>

            <View style={styles.info}>
              <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                {lecture.title}
              </Text>

              {/* Meta Info */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <BookOpen size={12} color={colors.textSecondary} />
                  <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textSecondary }]}>
                    {lecture.classes?.name}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <FileText size={12} color={colors.textSecondary} />
                  <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textSecondary }]}>
                    {lecture.subjects?.name}
                  </Text>
                </View>

                {/* {lecture.file_size && (
                  <Text allowFontScaling={false} style={[styles.sizeText, { color: colors.textSecondary }]}>
                    {formatFileSize(lecture.file_size)}
                  </Text>
                )} */}
              </View>

              {/* Description */}


              {/* Upload Info */}
              <View style={styles.uploadInfo}>
                <Text allowFontScaling={false} style={[styles.uploadedBy, { color: colors.textSecondary }]}>
                  By {lecture.profiles?.full_name}
                </Text>
                <View style={styles.metaItem}>
                  <Calendar size={10} color={colors.textSecondary} />
                  <Text allowFontScaling={false} style={[styles.dateText, { color: colors.textSecondary }]}>
                    {formatDate(lecture.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {lecture.description && (
            <Text
              allowFontScaling={false}
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {lecture.description}
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary + '10', borderColor: colors.border }
              ]}
              onPress={handleView}
            >
              <Eye size={14} color={lecture.has_viewed ? colors.success : colors.primary} />
              <Text allowFontScaling={false} style={[styles.actionText, { color: colors.primary }]}>
                {lecture.has_viewed ? 'Viewed' : 'View'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.primary + '10',
                  borderColor: colors.border,
                  opacity: lecture.youtube_link ? 1 : 0.5
                }
              ]}
              onPress={handleYouTube}
              disabled={!lecture.youtube_link}
            >
              <Youtube size={14} color={lecture.youtube_link ? '#FF0000' : colors.textSecondary} />
              <Text
                allowFontScaling={false}
                style={[
                  styles.actionText,
                  { color: lecture.youtube_link ? colors.primary : colors.textSecondary }
                ]}
              >
                YouTube
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.primary + '10', borderColor: colors.border }
              ]}
              onPress={handleShare}
            >
              <Share2 size={14} color={colors.primary} />
              <Text allowFontScaling={false} style={[styles.actionText, { color: colors.primary }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>

        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  quizIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  container: {
    marginBottom: 12,
    position: 'relative',
  },
  actionsBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
  },
  actionBtn: {
    width: 75,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fff',
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    borderRadius: 12,
    padding: 16,
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
    fontSize: TextSizes.xlarge,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 4,
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  sizeText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  uploadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  uploadedBy: {
    fontSize: 11,
    fontFamily: 'Inter-Italic',
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
    fontFamily: 'Inter-SemiBold',
  },
});