// components/TabNavigation.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Calendar, Award, BarChart3, Plus, Filter } from 'lucide-react-native';

interface TabNavigationProps {
    colors: any;
    profile: any;
    activeTab: 'schedule' | 'results' | 'reports';
    setActiveTab: (tab: 'schedule' | 'results' | 'reports') => void;
    setModalVisible: (visible: boolean) => void;
    onFilterPress?: () => void;
    hasActiveFilters?: boolean;
    isModalVisible?: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
    colors,
    profile,
    activeTab,
    setActiveTab,
    setModalVisible,
    onFilterPress,
    hasActiveFilters = false,
    isModalVisible = false,
}) => {
    const TabButton = ({
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
        <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.mainHeader}>
                {/* Main navigation buttons container */}
                <View style={styles.navigationContainer}>
                    {/* Schedule Button */}
                    <TabButton
                        title="Schedule"
                        isActive={activeTab === 'schedule'}
                        onPress={() => setActiveTab('schedule')}
                        icon={<Calendar size={14} color={activeTab === 'schedule' ? '#ffffff' : colors.text} />}
                    />

                    {/* Results Button */}
                    <TabButton
                        title="Results"
                        isActive={activeTab === 'results'}
                        onPress={() => setActiveTab('results')}
                        icon={<Award size={14} color={activeTab === 'results' ? '#ffffff' : colors.text} />}
                    />

                    {/* Reports Button */}
                    {/* {(profile?.role === 'teacher' || profile?.role === 'admin') && ( */}
                        <TabButton
                            title="Reports"
                            isActive={activeTab === 'reports'}
                            onPress={() => setActiveTab('reports')}
                            icon={<BarChart3 size={14} color={activeTab === 'reports' ? '#ffffff' : colors.text} />}
                        />
                    {/* )} */}

                    {/* Add Button (only for teachers) */}
                    {(profile?.role === 'teacher' || profile?.role === 'admin') && (
                        <TabButton
                            title="Add"
                            isActive={isModalVisible}
                            onPress={() => setModalVisible(true)}
                            icon={<Plus size={14} color={isModalVisible ? '#ffffff' : colors.text} />}
                        />
                    )}
                </View>

                {/* Filter Button - Icon only */}
                <TabButton
                    title="Filter"
                    isActive={false}
                    onPress={onFilterPress}
                    icon={<Filter size={16} color={hasActiveFilters ? colors.primary : colors.text} />}
                    hasIndicator={hasActiveFilters}
                    isIconOnly={true}
                />
            </View>
        </View>
    );
};


import { TextSizes } from '@/src/styles/TextSizes'; // <--- import TextSizes

const styles = StyleSheet.create({
    headerContainer: {
        marginBottom: 25,
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
        minHeight: 52,
    },
    headerButtonText: {
        fontSize: TextSizes.small, // <--- use TextSizes
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        lineHeight: TextSizes.small + 2, // optional, slightly bigger than fontSize
        flexShrink: 1,
        maxWidth: '100%',
        numberOfLines: 1,
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


// const styles = StyleSheet.create({
//     // Exact copy from AttendanceHeader
//     headerContainer: {
//         marginBottom: 25,
//     },
//     mainHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingHorizontal: 24,
//         gap: 8,
//     },
//     navigationContainer: {
//         flex: 1,
//         flexDirection: 'row',
//         gap: 3,
//     },
//     headerButton: {
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingHorizontal: 1,
//         paddingVertical: 8,
//         borderRadius: 8,
//         borderWidth: 1,
//         gap: 3,
//         flex: 1,
//         minHeight: 52,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.05,
//         shadowRadius: 2,
//         elevation: 1,
//         position: 'relative',
//     },
//     iconButton: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingHorizontal: 12,
//         paddingVertical: 14,
//         borderRadius: 8,
//         borderWidth: 1,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.05,
//         shadowRadius: 2,
//         elevation: 1,
//         position: 'relative',
//         minWidth: 44,
//         minHeight: 52,
//     },
//     headerButtonText: {
//         fontSize: 10,
//         fontFamily: 'Inter-SemiBold',
//         textAlign: 'center',
//         lineHeight: 11,
//         flexShrink: 1,
//         maxWidth: '100%',
//         numberOfLines: 1,
//     },
//     activeFilterIndicator: {
//         position: 'absolute',
//         top: -2,
//         right: -2,
//         width: 12,
//         height: 12,
//         borderRadius: 6,
//         backgroundColor: '#EF4444',
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     activeFilterDot: {
//         width: 6,
//         height: 6,
//         borderRadius: 3,
//         backgroundColor: '#ffffff',
//     },
// });

export default TabNavigation;