// components/diary/SwipeableAssignmentCard.tsx
import React, { useRef, useEffect } from 'react';
import { View, Animated, PanResponder, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { NotebookPen, Calendar, FileText, Clock, Edit, Trash2, BookOpen } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';

const ACTION_WIDTH = 90;
const SWIPE_THRESHOLD = -8;

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

interface SwipeableAssignmentCardProps {
    assignment: DiaryAssignment;
    colors: any;
    isTeacher: boolean;
    isOpen: boolean;
    onSwipeOpen: (id: string) => void;
    onSwipeClose: () => void;
    onEdit: (assignment: DiaryAssignment) => void;
    onDelete: (assignment: DiaryAssignment) => void;
    onPress: (assignment: DiaryAssignment) => void;
    onGestureStart: () => void;
    onGestureEnd: () => void;
    isOverdue: (date: string) => boolean;
    formatDate: (date: string) => string;
}

export const SwipeableAssignmentCard = ({
    assignment,
    colors,
    isTeacher,
    isOpen,
    onSwipeOpen,
    onSwipeClose,
    onEdit,
    onDelete,
    onPress,
    onGestureStart,
    onGestureEnd,
    isOverdue,
    formatDate,
}: SwipeableAssignmentCardProps) => {
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

    useEffect(() => {
        snap(isOpen ? -ACTION_WIDTH : 0);
    }, [isOpen]);

    const onGestureStartRef = useRef(onGestureStart);
    const onGestureEndRef = useRef(onGestureEnd);
    onGestureStartRef.current = onGestureStart;
    onGestureEndRef.current = onGestureEnd;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, g) =>
                isTeacher &&
                Math.abs(g.dx) > Math.abs(g.dy) * 1.5 &&
                Math.abs(g.dx) > 5,

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
                const current = (translateX as any)._value;
                if (g.dx < SWIPE_THRESHOLD && !isOpenRef.current) {
                    snap(-ACTION_WIDTH);
                    onSwipeOpen(assignment.id);
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
        onPress(assignment);
    };

    const overdue = isOverdue(assignment.due_date);

    return (
        <View style={cardStyles.container}>
            {/* Action buttons behind card */}
            {isTeacher && (
                <View style={cardStyles.actionsBackground}>
                    <TouchableOpacity
                        style={[cardStyles.actionBtn, { backgroundColor: colors.cardBackground }]}
                        onPress={() => { onSwipeClose(); onEdit(assignment); }}
                    >
                        <Edit size={20} color={colors.primary} />
                        <Text allowFontScaling={false} style={[cardStyles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[cardStyles.actionBtn, { backgroundColor: colors.cardBackground }]}
                        onPress={() => { onSwipeClose(); onDelete(assignment); }}
                    >
                        <Trash2 size={20} color="#EF4444" />
                        <Text allowFontScaling={false} style={[cardStyles.actionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Sliding card */}
            <Animated.View
                style={[cardStyles.cardWrapper, { transform: [{ translateX }] }]}
                {...(isTeacher ? panResponder.panHandlers : {})}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleCardPress}
                    style={[
                        cardStyles.card,
                        {
                            backgroundColor: overdue ? '#FEF2F2' : colors.cardBackground,
                            borderColor: overdue ? '#FEE2E2' : colors.border,
                        },
                    ]}
                >
                    {/* Header: icon + title + meta */}
                    <View style={cardStyles.header}>
                        <View style={[cardStyles.iconBox, { backgroundColor: colors.primary }]}>
                            <NotebookPen size={Platform.OS === 'android' ? 17 : 20} color="#ffffff" />
                        </View>
                        <View style={cardStyles.info}>
                            <Text allowFontScaling={false} style={[cardStyles.title, { color: colors.text }]}>
                                {assignment.title}
                            </Text>
                            <View style={cardStyles.metaRow}>
                                {assignment.classes?.name && (
                                    <View style={cardStyles.metaItem}>
                                        <BookOpen size={12} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[cardStyles.metaText, { color: colors.textSecondary }]}>
                                            {assignment.classes.name}
                                        </Text>
                                    </View>
                                )}
                                {assignment.subjects?.name && (
                                    <View style={cardStyles.metaItem}>
                                        <BookOpen size={12} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[cardStyles.metaText, { color: colors.textSecondary }]}>
                                            {assignment.subjects.name}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={cardStyles.byDateRow}>
                                <Text allowFontScaling={false} style={[cardStyles.byText, { color: colors.textSecondary }]}>
                                    By: {assignment?.profiles?.full_name ?? '—'}
                                </Text>
                                <View style={cardStyles.metaItem}>
                                    <Calendar size={12} color={colors.textSecondary} />
                                    <Text allowFontScaling={false} style={[cardStyles.metaText, { color: colors.textSecondary }]}>
                                        {formatDate(assignment.created_at)}
                                    </Text>
                                </View>
                            </View>

                        </View>
                    </View>

                    {/* Description */}
                    <Text
                        allowFontScaling={false}
                        style={[cardStyles.description, { color: colors.textSecondary }]}
                        numberOfLines={2}
                    >
                        {assignment.description}
                    </Text>

                    {/* Attachment button */}
                    <TouchableOpacity
                        style={[
                            cardStyles.attachmentBtn,
                            {
                                backgroundColor: colors.primary + '10',
                                borderColor: colors.border,
                                opacity: assignment.file_url ? 1 : 0.5,
                            },
                        ]}
                        onPress={() => { onSwipeClose(); onPress(assignment); }}
                        disabled={!assignment.file_url}
                    >
                        <FileText size={14} color={assignment.file_url ? colors.primary : colors.textSecondary} />
                        <Text
                            allowFontScaling={false}
                            style={[cardStyles.attachmentText, { color: assignment.file_url ? colors.primary : colors.textSecondary }]}
                        >
                            Attachment
                        </Text>
                    </TouchableOpacity>

                    {/* Overdue badge */}
                    {overdue && (
                        <View style={cardStyles.overdueBadge}>
                            <Clock size={10} color="#EF4444" />
                            <Text allowFontScaling={false} style={cardStyles.overdueBadgeText}>OVERDUE</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const cardStyles = StyleSheet.create({
    container: {
        marginBottom: Platform.OS === 'android' ? 8 : 12,
        position: 'relative',
    },
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
    actionBtnText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
    cardWrapper: {
        width: '100%',
    },
    card: {
        borderRadius: 12,
        paddingVertical: Platform.OS === 'android' ? 10 : 12,
        paddingHorizontal: Platform.OS === 'android' ? 12 : 16,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        marginBottom: Platform.OS === 'android' ? 6 : 8,
    },
    iconBox: {
        width: Platform.OS === 'android' ? 34 : 40,
        height: Platform.OS === 'android' ? 34 : 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Platform.OS === 'android' ? 10 : 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 6,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
    },
    byDateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    byText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Italic',
    },
    description: {
        fontSize: TextSizes.xlarge,
        fontFamily: 'Inter-Regular',
        lineHeight: Platform.OS === 'android' ? 16 : 18,
        marginBottom: Platform.OS === 'android' ? 8 : 10,
    },
    attachmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Platform.OS === 'android' ? 6 : 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
        marginBottom: 4,
    },
    attachmentText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Medium',
    },
    overdueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
        gap: 4,
        marginTop: 6,
    },
    overdueBadgeText: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-SemiBold',
        color: '#EF4444',
    },
});
