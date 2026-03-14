// components/students/SwipeableStudentCard.tsx
import React, { useRef, useEffect } from 'react';
import { View, Animated, PanResponder, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Hash, BookOpen, Phone, Edit, UserX, Mail } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    phone_number?: string;
    parent_contact: string;
    classes?: { name: string };
    email?: string;
}

const ACTION_WIDTH = 90;
const SWIPE_THRESHOLD = -8; // minimum drag to trigger open

interface SwipeableStudentCardProps {
    student: Student;
    colors: any;
    isTeacher: boolean;
    isOpen: boolean;
    onSwipeOpen: (id: string) => void;
    onSwipeClose: () => void;
    onEdit: (student: Student) => void;
    onDeactivate: (student: Student) => void;
    onPress: (student: Student) => void;
    onGestureStart: () => void;   // called when horizontal drag starts → parent disables scroll
    onGestureEnd: () => void;     // called when drag ends → parent re-enables scroll
}

export const SwipeableStudentCard = ({
    student,
    colors,
    isTeacher,
    isOpen,
    onSwipeOpen,
    onSwipeClose,
    onEdit,
    onDeactivate,
    onPress,
    onGestureStart,
    onGestureEnd,
}: SwipeableStudentCardProps) => {
    const translateX = useRef(new Animated.Value(0)).current;
    // Keep isOpen in a ref — panResponder is created once so props are stale inside it
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

    // Parent controls open/close state — react to isOpen changes
    useEffect(() => {
        snap(isOpen ? -ACTION_WIDTH : 0);
    }, [isOpen]);

    const onGestureStartRef = useRef(onGestureStart);
    const onGestureEndRef   = useRef(onGestureEnd);
    onGestureStartRef.current = onGestureStart;
    onGestureEndRef.current   = onGestureEnd;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            // Claim any clearly horizontal gesture early, before ScrollView can take it
            onMoveShouldSetPanResponder: (_, g) =>
                isTeacher &&
                Math.abs(g.dx) > Math.abs(g.dy) * 1.5 &&
                Math.abs(g.dx) > 5,

            onPanResponderGrant: () => {
                translateX.stopAnimation();
                onGestureStartRef.current();
            },

            onPanResponderMove: (_, g) => {
                const base = isOpenRef.current ? -ACTION_WIDTH : 0;
                const clamped = Math.min(0, Math.max(base + g.dx, -ACTION_WIDTH));
                translateX.setValue(clamped);
            },

            onPanResponderRelease: (_, g) => {
                onGestureEndRef.current();
                const currentlyOpen = isOpenRef.current;
                const shouldOpen = currentlyOpen
                    ? g.dx > -(ACTION_WIDTH / 2)
                    : g.dx < SWIPE_THRESHOLD;

                if (shouldOpen && !currentlyOpen) {
                    onSwipeOpen(student.id);
                } else if (!shouldOpen && currentlyOpen) {
                    onSwipeClose();
                } else {
                    snap(currentlyOpen ? -ACTION_WIDTH : 0);
                }
            },

            onPanResponderTerminate: () => {
                onGestureEndRef.current();
                snap(isOpenRef.current ? -ACTION_WIDTH : 0);
            },
        })
    ).current;

    const handleCardPress = () => {
        if (isOpen) {
            onSwipeClose();
        } else {
            onPress(student);
        }
    };

    return (
        <View style={styles.container}>
            {/* Action buttons revealed behind the card */}
            {isTeacher && (
                <View style={[styles.actionsBackground, { backgroundColor: colors.cardBackground }]}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.cardBackground }]}
                        onPress={() => { onSwipeClose(); onEdit(student); }}
                    >
                        <Edit size={20} color={colors.primary} />
                        <Text allowFontScaling={false} style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.cardBackground }]}
                        onPress={() => { onSwipeClose(); onDeactivate(student); }}
                    >
                        <UserX size={20} color="#EF4444" />
                        <Text allowFontScaling={false} style={[styles.actionBtnText, { color: '#EF4444' }]}>Deactivate</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Sliding card */}
            <Animated.View
                style={[styles.cardWrapper, { transform: [{ translateX }] }]}
                {...(isTeacher ? panResponder.panHandlers : {})}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleCardPress}
                    style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                >
                    <View style={styles.header}>
                        <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                            <Text allowFontScaling={false} style={styles.studentInitial}>
                                {student.full_name.charAt(0).toUpperCase()}
                            </Text>
                        </View>

                        <View style={styles.info}>
                            <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                                {student.full_name}
                            </Text>

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <Hash size={12} color={colors.textSecondary} />
                                    <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textSecondary }]}>
                                        {student.roll_number}
                                    </Text>
                                </View>
                                {student.classes?.name && (
                                    <View style={styles.metaItem}>
                                        <BookOpen size={12} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.metaText, { color: colors.textSecondary }]}>
                                            {student.classes.name}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        {student.phone_number && (
                            <View style={[styles.actionButton, { backgroundColor: colors.primary + '10', borderColor: colors.border }]}>
                                <Phone size={14} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.actionText, { color: colors.primary }]}>
                                    {student.phone_number}
                                </Text>
                            </View>
                        )}
                        {student.email && (
                            <View style={[styles.actionButton, { backgroundColor: colors.primary + '10', borderColor: colors.border }]}>
                                <Mail size={14} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.actionText, { color: colors.primary }]}>
                                    {student.email}
                                </Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
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
        fontSize: 11,
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
    studentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    studentInitial: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
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
        fontFamily: 'Inter-SemiBold',
    },
});
