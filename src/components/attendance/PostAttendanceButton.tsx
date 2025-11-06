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
}

export const PostAttendanceButton: React.FC<PostAttendanceButtonProps> = ({
    markedCount,
    totalCount,
    posting,
    onPress,
}) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    if (markedCount === 0) return null;

    return (
        <View style={[
            styles.container,
            { 
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom + 30, 50),
            }
        ]}>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onPress}
                disabled={posting}
                activeOpacity={0.8}
            >
                {posting ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <>
                        <Send size={20} color="#ffffff" />
                        <Text allowFontScaling={false} style={styles.buttonText}>
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
        // Universal shadow that works on both platforms
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        // Subtle border for better definition
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        flex: 1,
    },
});