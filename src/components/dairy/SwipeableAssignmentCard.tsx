// components/diary/SwipeableAssignmentCard.tsx
import React, { useState, useRef } from 'react';
import { View, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { NotebookPen, Calendar, Users, User, FileText, Clock, Edit3, Trash2, BookOpen, Edit } from 'lucide-react-native';
import styles from './styles';

interface DiaryAssignment {
    id: string;
    title: string;
    description: string;
    due_date: string;
    file_url?: string;
    class_id?: string;
    student_id?: string;
    subject_id?: string;
    created_at: string;
    classes?: { name: string };
    students?: { full_name: string };
}

const SWIPE_THRESHOLD = -100;

export const SwipeableAssignmentCard = ({
    assignment,
    colors,
    isTeacher,
    onEdit,
    onDelete,
    onPress,
    isOverdue,
    formatDate
}: {
    assignment: DiaryAssignment;
    colors: any;
    isTeacher: boolean;
    onEdit: (assignment: DiaryAssignment) => void;
    onDelete: (assignment: DiaryAssignment) => void;
    onPress: (assignment: DiaryAssignment) => void;
    isOverdue: (date: string) => boolean;
    formatDate: (date: string) => string;
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isTeacher,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return isTeacher && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -150));
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx < SWIPE_THRESHOLD) {
                    Animated.spring(translateX, {
                        toValue: -120,
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
        <TouchableOpacity style={styles.swipeContainer}>
            {isTeacher && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.background }]}
                        onPress={() => {
                            closeSwipe();
                            onEdit(assignment);
                        }}
                    >
                        <Edit size={20} color={colors.primary} />
                        <Text allowFontScaling={false} style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.background }]}
                        onPress={() => {
                            closeSwipe();
                            onDelete(assignment);
                        }}
                    >
                        <Trash2 size={20} color="#EF4444" />
                        <Text allowFontScaling={false} style={[styles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Animated.View
                style={[
                    styles.assignmentCard,
                    {
                        backgroundColor: colors.cardBackground,
                        borderColor: isOverdue(assignment.due_date) ? '#FEE2E2' : colors.border,
                        transform: [{ translateX }],
                    },
                    isOverdue(assignment.due_date) && styles.overdueCard,
                ]}
                {...(isTeacher ? panResponder.panHandlers : {})}
            >
                <TouchableOpacity activeOpacity={1} onPress={() => { closeSwipe(); onPress(assignment); }}>
                    <View style={styles.assignmentHeader}>
                        <View style={[styles.quizIcon, { backgroundColor: colors.primary }]}>
                            <NotebookPen size={20} color="#ffffff" />
                        </View>
                        <View style={styles.assignmentInfo}>
                            <Text allowFontScaling={false} style={[styles.assignmentTitle, { color: colors.text }]}>
                                {assignment.title}
                            </Text>
                            <View style={styles.assignmentDetails}>
                                {/* <View style={styles.detailItem}>
                                    <Calendar size={12} color={colors.textSecondary} />
                                    <Text
                                        style={[
                                            styles.detailText,
                                            { color: colors.textSecondary },
                                            isOverdue(assignment.due_date) && styles.overdueText,
                                        ]}
                                    >
                                        {formatDate(assignment.due_date)}
                                    </Text>
                                </View> */}
                                {assignment.classes?.name && (
                                    <View style={styles.detailItem}>
                                        <BookOpen size={12} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.detailText, { color: colors.textSecondary }]}>
                                            {assignment.classes.name}
                                        </Text>
                                    </View>
                                )}
                                {assignment.subjects?.name && (
                                    <View style={styles.detailItem}>
                                        <BookOpen size={12} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.detailText, { color: colors.textSecondary }]}>
                                            {assignment.subjects.name}
                                        </Text>
                                    </View>
                                )}
                                {assignment.students?.full_name && (
                                    <View style={styles.detailItem}>
                                        <User size={12} color={colors.textSecondary} />
                                        <Text allowFontScaling={false} style={[styles.detailText, { color: colors.textSecondary }]}>
                                            {assignment.students.full_name}
                                        </Text>
                                    </View>
                                )}


                            </View>


                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 }}>

                                <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        // borderWidth : 1,
                                        // borderColor : "#000"   // ⭐ Center here
                                    }}>
                                    <Text allowFontScaling={false} style={[{ fontSize: 11, fontFamily: 'Inter-Italic', color: colors.textSecondary }]}>
                                        By : {assignment?.profiles?.full_name}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center', 
                                        // marginBottom: 8,
                                        // borderWidth : 1,
                                        // borderColor : "#000", 
                             
                                    }}
                                >
                                    <Calendar size={12} color={colors.textSecondary} />
                                    <Text allowFontScaling={false} style={[styles.detailText, { color: colors.textSecondary }]}>
                                        {formatDate(assignment.created_at)}
                                    </Text>
                                </View>

                            </View>


                        </View>


                    </View>


                    <Text
                        allowFontScaling={false}
                        style={[{ fontSize: 13, lineHeight: 18, fontFamily: 'Inter-Regular', marginBottom: 4, color: colors.textSecondary }]}
                        numberOfLines={2}
                    >
                        {assignment.description}
                    </Text>

                    {assignment.file_url && (
                        <TouchableOpacity
                            style={[styles.attachmentButton, { backgroundColor: colors.primary + '10' }]}
                        >
                            <FileText size={14} color={colors.primary} />
                            <Text allowFontScaling={false} style={[styles.attachmentText, { color: colors.primary }]}>
                                View Attachment
                            </Text>
                        </TouchableOpacity>
                    )}


                    {isOverdue(assignment.due_date) && (
                        <View style={styles.overdueLabel}>
                            <Clock size={10} color="#EF4444" />
                            <Text allowFontScaling={false} style={styles.overdueLabelText}>OVERDUE</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </TouchableOpacity>
    );
};