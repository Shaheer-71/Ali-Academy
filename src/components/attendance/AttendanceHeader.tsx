// components/attendance/AttendanceHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Filter, PenTool, Eye, BarChart3, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface AttendanceHeaderProps {
    userRole: 'teacher' | 'student';
    viewMode: 'mark' | 'reports' | 'view' | 'analytics';
    onViewModeChange: (mode: 'mark' | 'reports' | 'view' | 'analytics') => void;
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
        hasIndicator = false,
        isIconOnly = false
    }: { 
        title: string; 
        isActive: boolean; 
        onPress: () => void; 
        icon?: React.ReactNode;
        hasIndicator?: boolean;
        isIconOnly?: boolean;
    }) => (
        <TouchableOpacity
            style={[
                isIconOnly ? styles.iconButton : styles.headerButton,
                { 
                    backgroundColor: isActive ? colors.primary : colors.background,
                    borderColor: colors.border 
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {icon && icon}
            {!isIconOnly && (
                <Text allowFontScaling={false} style={[
                    styles.headerButtonText,
                    { color: isActive ? '#ffffff' : colors.text }
                ]}>
                    {title}
                </Text>
            )}
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
                        {/* Main navigation buttons container */}
                        <View style={styles.navigationContainer}>
                            {/* Mark Button */}
                            <HeaderButton
                                title="Mark"
                                isActive={viewMode === 'mark'}
                                onPress={() => onViewModeChange('mark')}
                                icon={<PenTool size={14} color={viewMode === 'mark' ? '#ffffff' : colors.text} />}
                            />

                            {/* View Button */}
                            <HeaderButton
                                title="View"
                                isActive={viewMode === 'view'}
                                onPress={() => onViewModeChange('view')}
                                icon={<Eye size={14} color={viewMode === 'view' ? '#ffffff' : colors.text} />}
                            />

                            {/* Reports Button */}
                            <HeaderButton
                                title="Reports"
                                isActive={viewMode === 'reports'}
                                onPress={() => onViewModeChange('reports')}
                                icon={<BarChart3 size={14} color={viewMode === 'reports' ? '#ffffff' : colors.text} />}
                            />

                            {/* Analytics Button */}
                            <HeaderButton
                                title="Analytics"
                                isActive={viewMode === 'analytics'}
                                onPress={() => onViewModeChange('analytics')}
                                icon={<TrendingUp size={14} color={viewMode === 'analytics' ? '#ffffff' : colors.text} />}
                            />
                        </View>

                        {/* Filter Button - Icon only */}
                        <HeaderButton
                            title="Filter"
                            isActive={false}
                            onPress={onFilterPress}
                            icon={<Filter size={16} color={colors.text} />}
                            hasIndicator={hasActiveFilters}
                            isIconOnly={true}
                        />
                    </>
                ) : (
                    <>
                        {/* Student navigation container */}
                        <View style={styles.navigationContainer}>
                            {/* View Button */}
                            <HeaderButton
                                title="View"
                                isActive={viewMode === 'view'}
                                onPress={() => onViewModeChange('view')}
                                icon={<Eye size={14} color={viewMode === 'view' ? '#ffffff' : colors.text} />}
                            />

                            {/* Analytics Button */}
                            <HeaderButton
                                title="Analytics"
                                isActive={viewMode === 'analytics'}
                                onPress={() => onViewModeChange('analytics')}
                                icon={<TrendingUp size={14} color={viewMode === 'analytics' ? '#ffffff' : colors.text} />}
                            />
                        </View>

                        {/* Filter Button - Icon only */}
                        <HeaderButton
                            title="Filter"
                            isActive={false}
                            onPress={onFilterPress}
                            icon={<Filter size={16} color={colors.text} />}
                            hasIndicator={hasActiveFilters}
                            isIconOnly={true}
                        />
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        marginBottom: 20,
    },
    mainHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 8,
    },
    navigationContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 3,
    },
    headerButton: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 1, 
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        gap: 3, 
        flex: 1, 
        minHeight: 52,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        position: 'relative',
    },
    iconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        position: 'relative',
        minWidth: 44,
        minHeight: 52, // Match navigation button height
    },
    headerButtonText: {
        fontSize: 10, // Increased from 9px
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        lineHeight: 11,
        flexShrink: 1, // Allow text to shrink if needed
        maxWidth: '100%', // Ensure text doesn't overflow
        numberOfLines: 1, // Single line only
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