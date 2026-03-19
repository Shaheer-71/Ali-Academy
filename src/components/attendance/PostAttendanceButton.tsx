// components/attendance/PostAttendanceButton.tsx (Universal Inline Solution)

import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Send } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PostAttendanceButtonProps {
    markedCount: number;
    totalCount: number;
    posting: boolean;
    onPress: () => void;
    alreadyPosted?: boolean;
}

export const PostAttendanceButton: React.FC<PostAttendanceButtonProps> = ({
    markedCount,
    totalCount,
    posting,
    onPress,
    alreadyPosted = false,
}) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const isDisabled = posting || alreadyPosted || markedCount < totalCount;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom + 30, 50),
            }
        ]}>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, isDisabled && styles.buttonDisabled]}
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.8}
            >
                {posting ? (
                    <ActivityIndicator color="#ffffff" />
                ) : alreadyPosted ? (
                    <>
                        <Send size={20} color="#9CA3AF" />
                        <Text allowFontScaling={false} style={[styles.buttonText, styles.buttonTextDisabled]}>
                            Attendance Already Posted
                        </Text>
                    </>
                ) : (
                    <>
                        <Send size={20} color={isDisabled ? '#9CA3AF' : '#ffffff'} />
                        <Text allowFontScaling={false} style={[styles.buttonText, isDisabled && !alreadyPosted && styles.buttonTextDisabled]}>
                            Post Attendance ({markedCount}/{totalCount})
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 24,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 8,
        minHeight: 56,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonDisabled: {
        backgroundColor: '#F3F4F6',
        shadowOpacity: 0,
        elevation: 0,
        borderColor: '#E5E7EB',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        flex: 1,
    },
    buttonTextDisabled: {
        color: '#9CA3AF',
    },
});