import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import TopSection from '@/src/components/common/TopSection';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors } from '@/src/types/timetable';

interface ErrorStateProps {
    error: string;
    colors: ThemeColors;
    refreshTimetable: () => void;
}

export default function ErrorState({ error, colors, refreshTimetable }: ErrorStateProps) {
    return (
        <>
            <TopSection />
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
                <View style={styles.errorContainer}>
                    <AlertCircle size={48} color={colors.error} />
                    <Text allowFontScaling={false} style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={refreshTimetable}
                    >
                        <Text allowFontScaling={false} style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </>
    );
}

import { TextSizes } from '@/src/styles/TextSizes';
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        marginVertical: 16,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
});
