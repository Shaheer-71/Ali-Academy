// src/components/lectures/LectureCard.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Animated, PanResponder,
} from 'react-native';
import {
  FileText, Youtube, Calendar, BookOpen, Edit, Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Lecture } from '@/src/types/lectures';
import { lectureService } from '@/src/services/lecture.service';
import { TextSizes } from '@/src/styles/TextSizes';
import {
  handleLectureDeleteError, handleFileDownloadError, handleYouTubeLinkError,
} from '@/src/utils/errorHandler/lectureErrorHandler';
import { handleError } from '@/src/utils/errorHandler/attendanceErrorHandler';
import { ErrorModal } from '../common/ErrorModal';
import { LectureDetailModal } from '@/src/components/lectures/LectureDetailModal';

const ACTION_WIDTH = 90;
const SWIPE_THRESHOLD = -8;

interface LectureCardProps {
  lecture: Lecture;
  isOpen: boolean;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: () => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
  onRefresh?: () => void;
  onEdit?: (lecture: Lecture) => void;
}

export default function LectureCard({
  lecture, isOpen, onSwipeOpen, onSwipeClose,
  onGestureStart, onGestureEnd, onRefresh, onEdit,
}: LectureCardProps) {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });

  const showError = (error: any, handler?: (error: any) => any) => {
    const info = handler ? handler(error) : handleError(error);
    setErrorModal({ visible: true, title: info.title, message: info.message });
  };

  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const snap = (toValue: number) => {
    Animated.spring(translateX, { toValue, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
  };

  useEffect(() => { snap(isOpen ? -ACTION_WIDTH : 0); }, [isOpen]);

  const onGestureStartRef = useRef(onGestureStart);
  const onGestureEndRef = useRef(onGestureEnd);
  onGestureStartRef.current = onGestureStart;
  onGestureEndRef.current = onGestureEnd;

  const canSwipe = profile?.role === 'teacher' || profile?.role === 'admin';

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        canSwipe && Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 5,

      onPanResponderGrant: () => {
        onGestureStartRef.current();
        translateX.stopAnimation();
        translateX.setOffset((translateX as any)._value);
        translateX.setValue(0);
      },

      onPanResponderMove: (_, g) => {
        const base = isOpenRef.current ? -ACTION_WIDTH : 0;
        const next = base + g.dx;
        if (next <= 0 && next >= -ACTION_WIDTH) translateX.setValue(g.dx);
      },

      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        onGestureEndRef.current();
        if (g.dx < SWIPE_THRESHOLD && !isOpenRef.current) {
          snap(-ACTION_WIDTH);
          onSwipeOpen(lecture.id);
        } else if (g.dx > -SWIPE_THRESHOLD && isOpenRef.current) {
          snap(0);
          onSwipeClose();
        } else {
          snap(isOpenRef.current ? -ACTION_WIDTH : 0);
        }
      },

      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        onGestureEndRef.current();
        snap(isOpenRef.current ? -ACTION_WIDTH : 0);
      },
    })
  ).current;

  const handleCardPress = () => {
    if (isOpen) { onSwipeClose(); return; }
    setShowDetails(true);
  };

  const handleEdit = () => { onSwipeClose(); onEdit?.(lecture); };

  const handleDelete = () => {
    onSwipeClose();
    Alert.alert(
      'Delete Lecture',
      `Are you sure you want to delete "${lecture.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await lectureService.deleteLecture(lecture.id);
              Alert.alert('Success', 'Lecture deleted successfully');
              onRefresh?.();
            } catch (error) {
              showError(error, handleLectureDeleteError);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleView = async () => {
    try { await lectureService.viewLecture(lecture, profile!.id); onRefresh?.(); }
    catch (error) { showError(error, handleFileDownloadError); }
  };

  const handleYouTube = async () => {
    if (!lecture.youtube_link) return;
    try { await lectureService.openYouTubeLink(lecture.youtube_link); }
    catch (error) { showError(error, handleYouTubeLinkError); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <View style={s.container}>
      {/* Actions behind card */}
      {canSwipe && (
        <View style={s.actionsBackground}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.cardBackground }]}
            onPress={handleEdit}
            disabled={isDeleting}
          >
            <Edit size={20} color={colors.primary} />
            <Text allowFontScaling={false} style={[s.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.cardBackground }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <>
                  <Trash2 size={20} color="#EF4444" />
                  <Text allowFontScaling={false} style={[s.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Sliding card */}
      <Animated.View
        style={[s.cardWrapper, { transform: [{ translateX }] }]}
        {...(canSwipe ? panResponder.panHandlers : {})}
      >
        <ErrorModal
          visible={errorModal.visible}
          title={errorModal.title}
          message={errorModal.message}
          onClose={() => setErrorModal({ ...errorModal, visible: false })}
        />
        <LectureDetailModal
          visible={showDetails}
          lecture={lecture}
          onClose={() => setShowDetails(false)}
          colors={colors}
          formatDate={formatDate}
        />

        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCardPress}
          style={[s.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={[s.iconBox, { backgroundColor: colors.primary }]}>
              <FileText size={20} color="#ffffff" />
            </View>
            <View style={s.info}>
              <Text allowFontScaling={false} style={[s.title, { color: colors.text }]}>
                {lecture.title}
              </Text>
              <View style={s.metaRow}>
                {lecture.classes?.name && (
                  <View style={s.metaItem}>
                    <BookOpen size={12} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                      {lecture.classes.name}
                    </Text>
                  </View>
                )}
                {lecture.subjects?.name && (
                  <View style={s.metaItem}>
                    <FileText size={12} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                      {lecture.subjects.name}
                    </Text>
                  </View>
                )}
              </View>
              <View style={s.byDateRow}>
                <Text allowFontScaling={false} style={[s.byText, { color: colors.textSecondary }]}>
                  By: {lecture.profiles?.full_name ?? '—'}
                </Text>
                <View style={s.metaItem}>
                  <Calendar size={12} color={colors.textSecondary} />
                  <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                    {formatDate(lecture.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {lecture.description ? (
            <Text
              allowFontScaling={false}
              style={[s.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {lecture.description}
            </Text>
          ) : null}

          {/* Action buttons */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.actionButton, { backgroundColor: colors.primary + '10', borderColor: colors.border }]}
              onPress={handleView}
            >
              <FileText size={14} color={colors.primary} />
              <Text allowFontScaling={false} style={[s.actionText, { color: colors.primary }]}>Attachment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionButton, { backgroundColor: colors.primary + '10', borderColor: colors.border, opacity: lecture.youtube_link ? 1 : 0.5 }]}
              onPress={handleYouTube}
              disabled={!lecture.youtube_link}
            >
              <Youtube size={14} color={lecture.youtube_link ? '#FF0000' : colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.actionText, { color: lecture.youtube_link ? colors.primary : colors.textSecondary }]}>
                YouTube
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 12, position: 'relative' },
  actionsBackground: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: ACTION_WIDTH, flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtn: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
  cardWrapper: { width: '100%' },
  card: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1 },
  header: { flexDirection: 'row', marginBottom: 8 },
  iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold', marginBottom: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular' },
  byDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  byText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Italic' },
  description: { fontSize: TextSizes.large, fontFamily: 'Inter-Regular', lineHeight: 18, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: 8, borderWidth: 1, gap: 6,
  },
  actionText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
});
