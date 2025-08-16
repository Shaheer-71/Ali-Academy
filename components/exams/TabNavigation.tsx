// components/TabNavigation.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Calendar, Award, BarChart3, Plus } from 'lucide-react-native';

interface TabNavigationProps {
    colors: any;
    profile: any;
    activeTab: 'schedule' | 'results' | 'reports';
    setActiveTab: (tab: 'schedule' | 'results' | 'reports') => void;
    setModalVisible: (visible: boolean) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
    colors,
    profile,
    activeTab,
    setActiveTab,
    setModalVisible,
}) => {
    return (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[
                    styles.tab,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    activeTab === 'schedule' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setActiveTab('schedule')}
            >
                <Calendar size={16} color={activeTab === 'schedule' ? '#ffffff' : colors.text} />
                <Text style={[
                    styles.tabText,
                    { color: colors.text },
                    activeTab === 'schedule' && { color: '#ffffff' },
                ]}>
                    Schedule
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.tab,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    activeTab === 'results' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setActiveTab('results')}
            >
                <Award size={16} color={activeTab === 'results' ? '#ffffff' : colors.text} />
                <Text style={[
                    styles.tabText,
                    { color: colors.text },
                    activeTab === 'results' && { color: '#ffffff' },
                ]}>
                    Results
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.tab,
                    { backgroundColor: colors.cardBackground, borderColor: colors.border },
                    activeTab === 'reports' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setActiveTab('reports')}
            >
                <BarChart3 size={16} color={activeTab === 'reports' ? '#ffffff' : colors.text} />
                <Text style={[
                    styles.tabText,
                    { color: colors.text },
                    activeTab === 'reports' && { color: '#ffffff' },
                ]}>
                    Reports
                </Text>
            </TouchableOpacity>

            {profile?.role === 'teacher' && (
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Plus size={20} color="#ffffff" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        gap: 6,
    },
    tabText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default TabNavigation;