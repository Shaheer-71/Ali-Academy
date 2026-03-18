import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder, Platform,
} from 'react-native';
import { Calendar, Clock, FileText, Edit, Trash2, BookOpen, PenLine, Award } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';

const ACTION_WIDTH = 90;
const SWIPE_THRESHOLD = -8;

interface SwipeableQuizCardProps {
  quiz: any;
  colors: any;
  isOpen: boolean;
  canSwipe: boolean;
  canEdit: boolean;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: () => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
  onEdit: (quiz: any) => void;
  onDelete: (quiz: any) => void;
  onPress: (quiz: any) => void;
  onViewMarks?: (quiz: any) => void;
  hasMarks?: boolean;
}

const SwipeableQuizCard: React.FC<SwipeableQuizCardProps> = ({
  quiz,
  colors,
  isOpen,
  canSwipe,
  canEdit,
  onSwipeOpen,
  onSwipeClose,
  onGestureStart,
  onGestureEnd,
  onEdit,
  onDelete,
  onPress,
  onViewMarks,
  hasMarks,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const snap = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  useEffect(() => { snap(isOpen ? -ACTION_WIDTH : 0); }, [isOpen]);

  const onGestureStartRef = useRef(onGestureStart);
  const onGestureEndRef = useRef(onGestureEnd);
  onGestureStartRef.current = onGestureStart;
  onGestureEndRef.current = onGestureEnd;

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
          onSwipeOpen(quiz.id);
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
    if (isOpen) { snap(0); onSwipeClose(); return; }
    onPress(quiz);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3B82F6';
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      case 'cancelled': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const statusColor = getStatusColor(quiz.status);

  return (
    <View style={s.container}>
      {/* Action buttons behind card */}
      {canSwipe && (
        <View style={s.actionsBackground}>
          {canEdit && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.cardBackground }]}
              onPress={() => { snap(0); onSwipeClose(); onEdit(quiz); }}
            >
              <Edit size={20} color={colors.primary} />
              <Text allowFontScaling={false} style={[s.actionBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.cardBackground }]}
            onPress={() => { snap(0); onSwipeClose(); onDelete(quiz); }}
          >
            <Trash2 size={20} color="#EF4444" />
            <Text allowFontScaling={false} style={[s.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sliding card */}
      <Animated.View
        style={[s.cardWrapper, { transform: [{ translateX }] }]}
        {...(canSwipe ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCardPress}
          style={[s.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
        >
          {/* Header: icon + title + class/subject + date */}
          <View style={s.header}>
            <View style={[s.iconBox, { backgroundColor: colors.primary }]}>
              <PenLine size={Platform.OS === 'android' ? 17 : 20} color="#ffffff" />
            </View>
            <View style={s.info}>
              <View style={s.titleRow}>
                <Text allowFontScaling={false} style={[s.title, { color: colors.text }]} numberOfLines={1}>
                  {quiz.title}
                </Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text allowFontScaling={false} style={[s.statusText, { color: statusColor }]}>
                    {quiz.status?.charAt(0).toUpperCase() + quiz.status?.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={s.metaRow}>
                {quiz.classes?.name && (
                  <View style={s.metaItem}>
                    <BookOpen size={12} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                      {quiz.classes.name}
                    </Text>
                  </View>
                )}
                {quiz.subjects?.name && (
                  <View style={s.metaItem}>
                    <FileText size={12} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>
                      {quiz.subjects.name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Footer meta: date | duration | marks */}
          <View style={[s.footer, { borderTopColor: colors.border }]}>
            <View style={s.metaItem}>
              <Calendar size={11} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.footerText, { color: colors.textSecondary }]}>
                {quiz.scheduled_date}
              </Text>
            </View>
            <View style={s.metaItem}>
              <Clock size={11} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.footerText, { color: colors.textSecondary }]}>
                {quiz.duration_minutes} min
              </Text>
            </View>
            <View style={s.metaItem}>
              <FileText size={11} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.footerText, { color: colors.textSecondary }]}>
                {quiz.total_marks} marks
              </Text>
            </View>
          </View>

          {/* View My Marks button — students only, shown when result is checked */}
          {onViewMarks && (
            <TouchableOpacity
              style={[
                s.marksBtn,
                hasMarks
                  ? { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }
                  : { backgroundColor: colors.border + '30', borderColor: colors.border },
              ]}
              onPress={(e) => {
                e.stopPropagation?.();
                if (hasMarks) onViewMarks(quiz);
              }}
              activeOpacity={hasMarks ? 0.7 : 1}
            >
              <Award size={13} color={hasMarks ? colors.primary : colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.marksBtnText, { color: hasMarks ? colors.primary : colors.textSecondary }]}>
                {hasMarks ? 'View My Marks' : 'Not Marked Yet'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginBottom: Platform.OS === 'android' ? 8 : 12, position: 'relative' },

  actionsBackground: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: ACTION_WIDTH, flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtn: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

  cardWrapper: { width: '100%' },
  card: {
    borderRadius: 12,
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
    borderWidth: 1,
  },

  header: { flexDirection: 'row', marginBottom: Platform.OS === 'android' ? 8 : 10 },
  iconBox: {
    width: Platform.OS === 'android' ? 34 : 40,
    height: Platform.OS === 'android' ? 34 : 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Platform.OS === 'android' ? 10 : 12,
  },
  info: { flex: 1 },

  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular' },

  footer: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
  },
  footerText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },

  marksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Platform.OS === 'android' ? 8 : 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  marksBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
});

export default SwipeableQuizCard;
