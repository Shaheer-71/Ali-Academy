// components/students/SwipeableStudentCard.tsx
import React, { useState, useRef } from 'react';
import { View, Animated, PanResponder, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Hash, BookOpen, Phone, Edit, Trash2, User, Mail } from 'lucide-react-native';

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    phone_number?: string;
    parent_contact: string;
    classes?: { name: string };
}

const SWIPE_THRESHOLD = -100;
const ACTION_WIDTH = 150;

interface SwipeableStudentCardProps {
    student: Student;
    colors: any;
    isTeacher: boolean;
    onEdit: (student: Student) => void;
    onDelete: (student: Student) => void;
    onPress: (student: Student) => void;
}

export const SwipeableStudentCard = ({
    student,
    colors,
    isTeacher,
    onEdit,
    onDelete,
    onPress,
}: SwipeableStudentCardProps) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => {
                return (
                    isTeacher &&
                    Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
                    Math.abs(gesture.dx) > 10
                );
            },
            onPanResponderMove: (_, gesture) => {
                if (gesture.dx < 0) {
                    translateX.setValue(Math.max(gesture.dx, -ACTION_WIDTH));
                } else if (isSwipeOpen) {
                    translateX.setValue(Math.max(gesture.dx - ACTION_WIDTH, -ACTION_WIDTH));
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx < SWIPE_THRESHOLD) {
                    Animated.spring(translateX, {
                        toValue: -ACTION_WIDTH,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }).start();
                    setIsSwipeOpen(true);
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }).start();
                    setIsSwipeOpen(false);
                }
            },
        })
    ).current;

    const closeSwipe = () => {
        if (isSwipeOpen) {
            Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
            setIsSwipeOpen(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Action buttons (shown when swiped) */}
            {isTeacher && (
                <View style={styles.actionsBackground}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.background }]}
                        onPress={() => {
                            closeSwipe();
                            onEdit(student);
                        }}
                    >
                        <Edit size={20} color={colors.primary} />
                        <Text allowFontScaling={false} style={[styles.actionBtnText, { color: colors.primary }]}>
                            Edit
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.background }]}
                        onPress={() => {
                            closeSwipe();
                            onDelete(student);
                        }}
                    >
                        <Trash2 size={20} color="#EF4444" />
                        <Text allowFontScaling={false} style={[styles.actionBtnText, { color: '#EF4444' }]}>
                            Delete
                        </Text>
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
                {...(isTeacher ? panResponder.panHandlers : {})}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        closeSwipe();
                        onPress(student);
                    }}
                    style={[
                        styles.card,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border }
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        {/* <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                            <User size={20} color={colors.primary} />
                        </View> */}
                        <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                            <Text allowFontScaling={false} style={styles.studentInitial}>{student.full_name.charAt(0).toUpperCase()}</Text>
                        </View>

                        <View style={styles.info}>
                            <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                                {student.full_name}
                            </Text>

                            {/* Meta Info */}
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

                            {/* Upload Info */}
                            <View style={styles.uploadInfo}>
                                <Text allowFontScaling={false} style={[styles.uploadedBy, { color: colors.textSecondary }]}>
                                    Student ID: {student.roll_number}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions - Contact Info */}
                    <View style={styles.actions}>
                        {student.phone_number && (
                            <View
                                style={[
                                    styles.actionButton,
                                    { backgroundColor: colors.primary + '10', borderColor: colors.border }
                                ]}
                            >
                                <Phone size={14} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.actionText, { color: colors.primary }]}>
                                    {student.phone_number}
                                </Text>
                            </View>
                        )}

                        <View
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.primary + '10', borderColor: colors.border }
                            ]}
                        >
                            <Mail size={14} color={colors.primary} />
                            <Text allowFontScaling={false} style={[styles.actionText, { color: colors.primary }]}>
                                {student?.email}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

import { TextSizes } from '@/src/styles/TextSizes';

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
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
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
        fontFamily: 'Inter-Regular',
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
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 0,
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
});