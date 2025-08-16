import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    subtitle,
}) => {
    const { colors } = useTheme();

    return (
        <View style={styles.emptyContainer}>
            {icon}
            <Text style={[styles.emptyText, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 20,
    },
});