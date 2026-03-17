import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import { X, Calendar, Clock, FileText, BookOpen, Award, Info, Hash } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';

interface QuizDetailModalProps {
  visible: boolean;
  quiz: any;
  colors: any;
  onClose: () => void;
}

const QuizDetailModal: React.FC<QuizDetailModalProps> = ({ visible, quiz, colors, onClose }) => {
  if (!quiz) return null;

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

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <View style={[s.row, { borderBottomColor: colors.border }]}>
      <View style={s.rowLeft}>
        {icon}
        <Text allowFontScaling={false} style={[s.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text allowFontScaling={false} style={[s.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay} />
      </TouchableWithoutFeedback>

      <View style={[s.sheet, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <View style={s.headerLeft}>
            <Text allowFontScaling={false} style={[s.title, { color: colors.text }]} numberOfLines={2}>
              {quiz.title}
            </Text>
            <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text allowFontScaling={false} style={[s.statusText, { color: statusColor }]}>
                {quiz.status?.charAt(0).toUpperCase() + quiz.status?.slice(1)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Details */}
          <View style={[s.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Row
              icon={<BookOpen size={15} color={colors.textSecondary} />}
              label="Subject"
              value={quiz.subjects?.name || '—'}
            />
            <Row
              icon={<Hash size={15} color={colors.textSecondary} />}
              label="Class"
              value={quiz.classes?.name || '—'}
            />
            <Row
              icon={<Calendar size={15} color={colors.textSecondary} />}
              label="Scheduled Date"
              value={quiz.scheduled_date || '—'}
            />
            <Row
              icon={<Clock size={15} color={colors.textSecondary} />}
              label="Duration"
              value={`${quiz.duration_minutes} minutes`}
            />
            <Row
              icon={<FileText size={15} color={colors.textSecondary} />}
              label="Quiz Type"
              value={quiz.quiz_type ? quiz.quiz_type.charAt(0).toUpperCase() + quiz.quiz_type.slice(1) : '—'}
            />
          </View>

          {/* Marks */}
          <View style={[s.marksCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text allowFontScaling={false} style={[s.sectionTitle, { color: colors.textSecondary }]}>Marks</Text>
            <View style={s.marksRow}>
              <View style={s.markBox}>
                <Text allowFontScaling={false} style={[s.markValue, { color: colors.text }]}>{quiz.total_marks}</Text>
                <Text allowFontScaling={false} style={[s.markLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
              <View style={[s.markDivider, { backgroundColor: colors.border }]} />
              <View style={s.markBox}>
                <Text allowFontScaling={false} style={[s.markValue, { color: '#10B981' }]}>{quiz.passing_marks}</Text>
                <Text allowFontScaling={false} style={[s.markLabel, { color: colors.textSecondary }]}>Passing</Text>
              </View>
              <View style={[s.markDivider, { backgroundColor: colors.border }]} />
              <View style={s.markBox}>
                <Text allowFontScaling={false} style={[s.markValue, { color: '#EF4444' }]}>
                  {quiz.total_marks && quiz.passing_marks ? quiz.total_marks - quiz.passing_marks : '—'}
                </Text>
                <Text allowFontScaling={false} style={[s.markLabel, { color: colors.textSecondary }]}>Failing</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {!!quiz.description && (
            <View style={[s.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={s.descHeader}>
                <Info size={15} color={colors.textSecondary} />
                <Text allowFontScaling={false} style={[s.sectionTitle, { color: colors.textSecondary }]}>Description</Text>
              </View>
              <Text allowFontScaling={false} style={[s.descText, { color: colors.text }]}>{quiz.description}</Text>
            </View>
          )}

          {/* Instructions */}
          {!!quiz.instructions && (
            <View style={[s.section, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={s.descHeader}>
                <Award size={15} color={colors.textSecondary} />
                <Text allowFontScaling={false} style={[s.sectionTitle, { color: colors.textSecondary }]}>Instructions</Text>
              </View>
              <Text allowFontScaling={false} style={[s.descText, { color: colors.text }]}>{quiz.instructions}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 6 },
  title: { fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold', lineHeight: 22 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium' },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  section: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular' },
  rowValue: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },

  marksCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  marksRow: { flexDirection: 'row', alignItems: 'center' },
  markBox: { flex: 1, alignItems: 'center' },
  markValue: { fontSize: TextSizes.xlarge + 4, fontFamily: 'Inter-SemiBold', marginBottom: 4 },
  markLabel: { fontSize: TextSizes.small, fontFamily: 'Inter-Regular' },
  markDivider: { width: 1, height: 40 },

  descHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  descText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', lineHeight: 20, paddingHorizontal: 16, paddingBottom: 14 },
});

export default QuizDetailModal;
