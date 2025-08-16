// components/attendance/AttendanceHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Filter } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AttendanceHeaderProps {
    userRole: 'teacher' | 'student';
    viewMode: 'mark' | 'reports' | 'view';
    onViewModeChange: (mode: 'mark' | 'reports' | 'view') => void;
    onFilterPress: () => void;
    hasActiveFilters?: boolean;
}

export const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
    userRole,
    viewMode,
    onViewModeChange,
    onFilterPress,
    hasActiveFilters = false,
}) => {
    const { colors } = useTheme();

    const HeaderButton = ({ 
        title, 
        isActive, 
        onPress, 
        icon,
        hasIndicator = false 
    }: { 
        title: string; 
        isActive: boolean; 
        onPress: () => void; 
        icon?: React.ReactNode;
        hasIndicator?: boolean;
    }) => (
        <TouchableOpacity
            style={[
                styles.headerButton,
                { 
                    backgroundColor: isActive ? colors.primary : colors.background,
                    borderColor: colors.border 
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {icon && icon}
            <Text style={[
                styles.headerButtonText,
                { color: isActive ? '#ffffff' : colors.text }
            ]}>
                {title}
            </Text>
            {hasIndicator && (
                <View style={styles.activeFilterIndicator}>
                    <View style={styles.activeFilterDot} />
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.headerContainer, { backgroundColor: colors.background}]}>
            <View style={styles.mainHeader}>
                {userRole === 'teacher' ? (
                    <>
                        {/* Mark Button */}
                        <HeaderButton
                            title="Mark"
                            isActive={viewMode === 'mark'}
                            onPress={() => onViewModeChange('mark')}
                        />

                        {/* View Button */}
                        <HeaderButton
                            title="View"
                            isActive={viewMode === 'view'}
                            onPress={() => onViewModeChange('view')}
                        />

                        {/* Reports Button */}
                        <HeaderButton
                            title="Reports"
                            isActive={viewMode === 'reports'}
                            onPress={() => onViewModeChange('reports')}
                        />

                        {/* Filter Button */}
                        <HeaderButton
                            title="Filter"
                            isActive={false}
                            onPress={onFilterPress}
                            icon={<Filter size={16} color={colors.text} />}
                            hasIndicator={hasActiveFilters}
                        />
                    </>
                ) : (
                    // For students, just show the filter button centered
                    <HeaderButton
                        title="Filter"
                        isActive={false}
                        onPress={onFilterPress}
                        icon={<Filter size={16} color={colors.text} />}
                        hasIndicator={hasActiveFilters}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    mainHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly', // Evenly distribute all buttons
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 8, // Small gap between buttons
    },
    headerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
        flex: 1, // Equal width for all buttons
        maxWidth: 80, // Prevent buttons from getting too wide
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        position: 'relative',
    },
    headerButtonText: {
        fontSize: 13,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
    },
    activeFilterIndicator: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeFilterDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ffffff',
    },
});