import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder,
} from 'react-native';
import { Calendar, Clock, FileText, Edit, Trash2 } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';

const ACTION_WIDTH = 90;
const SWIPE_THRESHOLD = -8;

interface SwipeableQuizCardProps {
  quiz: any;
  colors: any;
  isOpen: boolean;
  canSwipe: boolean;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: () => void;
  onGestureStart: () => void;
  onGestureEnd: () => void;
  onEdit: (quiz: any) => void;
  onDelete: (quiz: any) => void;
  onPress: (quiz: any) => void;
}

const SwipeableQuizCard: React.FC<SwipeableQuizCardProps> = ({
  quiz,
  colors,
  isOpen,
  canSwipe,
  onSwipeOpen,
  onSwipeClose,
  onGestureStart,
  onGestureEnd,
  onEdit,
  onDelete,
  onPress,
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
      {/* Action buttons — stacked vertically behind the card */}
      {canSwipe && (
        <View style={s.actionsBackground}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.cardBackground }]}
            onPress={() => { snap(0); onSwipeClose(); onEdit(quiz); }}
          >
            <Edit size={20} color={colors.primary} />
            <Text allowFontScaling={false} style={[s.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
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
          <View style={s.cardHeader}>
            <Text allowFontScaling={false} style={[s.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {quiz.title}
            </Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text allowFontScaling={false} style={[s.statusText, { color: statusColor }]}>{quiz.status}</Text>
            </View>
          </View>
          <Text allowFontScaling={false} style={[s.cardSubject, { color: colors.primary }]} numberOfLines={1}>
            {quiz.subjects?.name} · {quiz.classes?.name}
          </Text>
          <View style={[s.cardDivider, { backgroundColor: colors.border }]} />
          <View style={s.cardMeta}>
            <View style={s.metaItem}>
              <Calendar size={11} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>{quiz.scheduled_date}</Text>
            </View>
            <View style={s.metaItem}>
              <Clock size={11} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>{quiz.duration_minutes} min</Text>
            </View>
            <View style={s.metaItem}>
              <FileText size={11} color={colors.textSecondary} />
              <Text allowFontScaling={false} style={[s.metaText, { color: colors.textSecondary }]}>{quiz.total_marks} marks</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginBottom: 12, position: 'relative' },

  actionsBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

  cardWrapper: { width: '100%' },
  card: { borderRadius: 12, padding: 14, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: TextSizes.header, fontFamily: 'Inter-SemiBold', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium' },
  cardSubject: { fontSize: TextSizes.normal, fontFamily: 'Inter-Medium', marginBottom: 10 },
  cardDivider: { height: StyleSheet.hairlineWidth, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },
});

export default SwipeableQuizCard;
