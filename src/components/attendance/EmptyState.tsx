import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { TextSizes } from '@/src/styles/TextSizes';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    subtitle,
}) => {
    const { colors } = useTheme();

    return (
        <View style={styles.emptyContainer}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                {title}
            </Text>
            {subtitle && (
                <Text allowFontScaling={false} style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {subtitle}
                </Text>
            )}
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
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: TextSizes.sectionTitle, // matches AttendanceScreen sectionTitle
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: TextSizes.small, // matches small/subtext usage
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 20,
    },
});
