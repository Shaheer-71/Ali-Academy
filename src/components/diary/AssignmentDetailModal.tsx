// components/diary/AssignmentDetailModal.tsx
import React from 'react';
import {
    View, Modal, TouchableOpacity, ScrollView,
    Linking, StyleSheet, Text, TouchableWithoutFeedback, Dimensions,
} from 'react-native';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.6;
import { X, Calendar, Users, User, FileText, Clock, Download, BookOpen, NotebookPen } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DiaryAssignment {
    id: string;
    title: string;
    description: string;
    due_date: string;
    file_url?: string;
    class_id?: string;
    student_id?: string;
    student_ids?: string[];
    subject_id?: string;
    created_at: string;
    classes?: { name: string };
    students?: { full_name: string };
    subjects?: { name: string };
    profiles?: { full_name: string };
}

export const AssignmentDetailModal = ({
    visible,
    assignment,
    onClose,
    colors,
    isOverdue,
    formatDate,
    studentsMap = {},
}: {
    visible: boolean;
    assignment: DiaryAssignment | null;
    onClose: () => void;
    colors: any;
    isOverdue: (date: string) => boolean;
    formatDate: (date: string) => string;
    studentsMap?: Record<string, string>;
}) => {
    const { bottom: bottomInset } = useSafeAreaInsets();

    if (!assignment) return null;

    const overdue = isOverdue(assignment.due_date);

    const handleOpenAttachment = () => {
        if (assignment.file_url) {
            Linking.openURL(assignment.file_url).catch(err =>
                console.warn('Failed to open attachment:', err)
            );
        }
    };

    const assignedTo = assignment.student_ids && assignment.student_ids.length > 0
        ? assignment.student_ids.map(id => studentsMap[id] ?? id).join(', ')
        : assignment.classes?.name
            ? `${assignment.classes.name} (Whole Class)`
            : null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={s.container}>
                {/* Tap outside to close */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={s.overlay} />
                </TouchableWithoutFeedback>

                {/* Sheet */}
                <View style={[s.sheet, { backgroundColor: colors.background }]}>
                    {/* Handle */}
                    <View style={[s.handle, { backgroundColor: colors.border }]} />

                    {/* Header */}
                    <View style={[s.header, { borderBottomColor: colors.border }]}>
                        <View style={[s.iconBox, { backgroundColor: colors.primary }]}>
                            <NotebookPen size={18} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text allowFontScaling={false} style={[s.headerTitle, { color: colors.text }]} numberOfLines={2}>
                                {assignment.title}
                            </Text>
                            {overdue && (
                                <View style={s.overdueBadge}>
                                    <Clock size={10} color="#EF4444" />
                                    <Text allowFontScaling={false} style={s.overdueBadgeText}>OVERDUE</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.cardBackground }]} onPress={onClose}>
                            <X size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingBottom: Math.max(24, bottomInset + 12) }]}>

                        {/* Info Card */}
                        <View style={[s.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>

                            {/* Due Date */}
                            <InfoRow
                                icon={<Calendar size={15} color={colors.primary} />}
                                label="Due Date"
                                value={formatDate(assignment.due_date)}
                                colors={colors}
                                valueColor={overdue ? '#EF4444' : colors.text}
                            />

                            {/* Assigned To */}
                            {assignedTo && (
                                <InfoRow
                                    icon={assignment.student_ids?.length ? <User size={15} color={colors.primary} /> : <Users size={15} color={colors.primary} />}
                                    label="Assigned To"
                                    value={assignedTo}
                                    colors={colors}
                                />
                            )}

                            {/* Subject */}
                            {assignment.subjects?.name && (
                                <InfoRow
                                    icon={<BookOpen size={15} color={colors.primary} />}
                                    label="Subject"
                                    value={assignment.subjects.name}
                                    colors={colors}
                                />
                            )}

                            {/* Assigned By */}
                            {assignment.profiles?.full_name && (
                                <InfoRow
                                    icon={<User size={15} color={colors.primary} />}
                                    label="Assigned By"
                                    value={assignment.profiles.full_name}
                                    colors={colors}
                                    isLast={!assignment.description}
                                />
                            )}

                            {/* Created On */}
                            <InfoRow
                                icon={<Calendar size={15} color={colors.primary} />}
                                label="Created"
                                value={formatDate(assignment.created_at)}
                                colors={colors}
                                isLast={!assignment.description}
                            />
                        </View>

                        {/* Description */}
                        {assignment.description ? (
                            <View style={s.descSection}>
                                <Text allowFontScaling={false} style={[s.descLabel, { color: colors.textSecondary }]}>
                                    Description
                                </Text>
                                <Text allowFontScaling={false} style={[s.descText, { color: colors.text }]}>
                                    {assignment.description}
                                </Text>
                            </View>
                        ) : null}

                        {/* Attachment */}
                        {assignment.file_url && (
                            <TouchableOpacity
                                style={[s.attachmentBtn, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}
                                onPress={handleOpenAttachment}
                                activeOpacity={0.7}
                            >
                                <FileText size={18} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text allowFontScaling={false} style={[s.attachTitle, { color: colors.primary }]}>Attachment</Text>
                                    <Text allowFontScaling={false} style={[s.attachSub, { color: colors.textSecondary }]}>Tap to open</Text>
                                </View>
                                <Download size={16} color={colors.primary} />
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const InfoRow = ({ icon, label, value, colors, isLast = false, valueColor }: any) => (
    <View style={[s.infoRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
        <View style={s.infoLeft}>
            {icon}
            <Text allowFontScaling={false} style={[s.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <Text allowFontScaling={false} style={[s.infoValue, { color: valueColor ?? colors.text }]} numberOfLines={2}>
            {value}
        </Text>
    </View>
);

const s = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: SHEET_HEIGHT,
    },
    scroll: {
        flex: 1,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        flex: 1,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overdueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    overdueBadgeText: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-SemiBold',
        color: '#EF4444',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        gap: 12,
    },
    infoCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 8,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    infoLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    infoValue: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'right',
        flex: 1,
    },
    descSection: {
        gap: 6,
    },
    descLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginLeft: 2,
    },
    descText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        lineHeight: 20,
    },
    attachmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    attachTitle: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
    attachSub: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginTop: 1,
    },
});
