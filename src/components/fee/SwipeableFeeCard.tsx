// components/FeeCards/SwipeableFeeCard.tsx
import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PanResponder,
} from 'react-native';
import { User, Check, AlertCircle, Clock } from 'lucide-react-native';
import { StudentWithFeeStatus } from '@/src/services/feeService';

interface SwipeableFeeCardProps {
    student: StudentWithFeeStatus;
    colors: any;
    isTeacher: boolean;
    onSelect: (student: StudentWithFeeStatus) => void;
}

export const SwipeableFeeCard: React.FC<SwipeableFeeCardProps> = ({
    student,
    colors,
    isTeacher,
    onSelect,
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const [isSwipeOpen, setIsSwipeOpen] = useState(false);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => isTeacher,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return (
                    isTeacher &&
                    Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
                    Math.abs(gestureState.dx) > 10
                );
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dx < 0) {
                    translateX.setValue(Math.max(gestureState.dx, -150));
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx < -100) {
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

    const getStatusIcon = () => {
        switch (student.current_month_payment_status) {
            case 'paid':
                return <Check size={16} color="#10B981" />;
            case 'overdue':
                return <AlertCircle size={16} color="#EF4444" />;
            case 'partial':
                return <Clock size={16} color="#F59E0B" />;
            default:
                return <Clock size={16} color="#6B7280" />;
        }
    };

    const getStatusColor = () => {
        switch (student.current_month_payment_status) {
            case 'paid':
                return '#10B981';
            case 'overdue':
                return '#EF4444';
            case 'partial':
                return '#F59E0B';
            default:
                return '#6B7280';
        }
    };

    return (
        <View style={styles.swipeContainer}>
            <Animated.View
                style={[
                    styles.feeCard,
                    {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        transform: [{ translateX }],
                    },
                ]}
                {...(isTeacher ? panResponder.panHandlers : {})}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={closeSwipe}
                    style={styles.cardContent}
                >
                    <TouchableOpacity
                        style={styles.cardMain}
                        onPress={() => {
                            closeSwipe();
                            onSelect(student);
                        }}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: colors.primary + '15' },
                            ]}
                        >
                            <User size={20} color={colors.primary} />
                        </View>

                        <View style={styles.studentInfo}>
                            <Text allowFontScaling={false} style={[styles.studentName, { color: colors.text }]}>
                                {student.full_name}
                            </Text>
                            <View style={styles.feeStatusRow}>
                                <View style={styles.statusBadge}>
                                    {getStatusIcon()}
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: getStatusColor() },
                                        ]}
                                    >
                                        {student.current_month_payment_status
                                            .charAt(0)
                                            .toUpperCase() +
                                            student.current_month_payment_status.slice(1)}
                                    </Text>
                                </View>
                                {student.current_month_amount && (
                                    <Text allowFontScaling={false} style={[styles.amountText, { color: colors.text }]}>
                                        Rs {student.current_month_amount}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    swipeContainer: {
        marginBottom: 12,
        position: 'relative',
    },
    feeCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flex: 1,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    feeStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    amountText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
    },
});
