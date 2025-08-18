// components/exams/modals/ComprehensiveExamsFilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Filter, X, Building, BookOpen, Calendar, CheckCircle, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Class {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface ExamFilterData {
    selectedClass: string;
    selectedSubject: string;
    statusFilter: 'all' | 'scheduled' | 'completed'; // For Schedule tab
    checkedFilter: 'all' | 'checked' | 'unchecked'; // For Results tab
}

interface ComprehensiveExamsFilterModalProps {
    visible: boolean;
    onClose: () => void;
    classes: Class[];
    subjects: Subject[];
    currentFilters: ExamFilterData;
    onApplyFilters: (filters: ExamFilterData) => void;
    userRole: 'teacher' | 'student';
    activeTab: 'schedule' | 'results' | 'reports';
    getSubjectsWithAll: (classId?: string) => Subject[];
}

export const ComprehensiveExamsFilterModal: React.FC<ComprehensiveExamsFilterModalProps> = ({
    visible,
    onClose,
    classes,
    subjects,
    currentFilters,
    onApplyFilters,
    userRole,
    activeTab,
    getSubjectsWithAll,
}) => {
    const { colors } = useTheme();
    const [filters, setFilters] = useState<ExamFilterData>(currentFilters);

    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters, visible]);

    const handleApply = () => {
        onApplyFilters(filters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters: ExamFilterData = {
            selectedClass: 'all',
            selectedSubject: 'all',
            statusFilter: 'all',
            checkedFilter: 'all',
        };
        setFilters(resetFilters);
        // 🎯 IMMEDIATE APPLY - This fixes the red dot issue
        onApplyFilters(resetFilters);
        onClose(); // Close modal immediately after reset
    };

    const statusOptions = [
        { value: 'all' as const, label: 'All Status', icon: '📊', color: colors.textSecondary },
        { value: 'scheduled' as const, label: 'Scheduled', icon: '📅', color: '#3B82F6' },
        { value: 'completed' as const, label: 'Completed', icon: '✅', color: '#10B981' },
    ];

    const evaluationOptions = [
        { value: 'all' as const, label: 'All Results', icon: '📋', color: colors.textSecondary },
        { value: 'checked' as const, label: 'Evaluated', icon: '✅', color: '#10B981' },
        { value: 'unchecked' as const, label: 'Pending', icon: '⏳', color: '#F59E0B' },
    ];

    const FilterSection = ({ 
        title, 
        icon, 
        children 
    }: { 
        title: string; 
        icon: React.ReactNode; 
        children: React.ReactNode; 
    }) => (
        <View style={[styles.section, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
                {icon}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            </View>
            {children}
        </View>
    );

    const OptionButton = ({ 
        selected, 
        onPress, 
        children, 
        style = {} 
    }: { 
        selected: boolean; 
        onPress: () => void; 
        children: React.ReactNode; 
        style?: any; 
    }) => (
        <TouchableOpacity
            style={[
                styles.optionButton,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                selected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                style
            ]}
            onPress={onPress}
        >
            {children}
        </TouchableOpacity>
    );

    // Get classes with "All" option
    const getClassesWithAll = () => [
        { id: 'all', name: 'All Classes' },
        ...classes
    ];

    // Get available subjects based on selected class
    const getAvailableSubjects = () => {
        return getSubjectsWithAll(filters.selectedClass);
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={styles.headerLeft}>
                            <Filter size={24} color={colors.primary} />
                            <Text style={[styles.title, { color: colors.text }]}>Exam Filters</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Class Filter - Only for Teachers */}
                        {userRole === 'teacher' && (
                            <FilterSection title="Select Class" icon={<Building size={20} color={colors.primary} />}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {getClassesWithAll().map((classItem) => (
                                        <OptionButton
                                            key={classItem.id}
                                            selected={filters.selectedClass === classItem.id}
                                            onPress={() => setFilters(prev => ({ 
                                                ...prev, 
                                                selectedClass: classItem.id,
                                                selectedSubject: 'all' // Reset subject when class changes
                                            }))}
                                            style={styles.classButton}
                                        >
                                            <Text style={[
                                                styles.optionText, 
                                                { color: filters.selectedClass === classItem.id ? colors.primary : colors.text }
                                            ]}>
                                                {classItem.name}
                                            </Text>
                                        </OptionButton>
                                    ))}
                                </ScrollView>
                            </FilterSection>
                        )}

                        {/* Subject Filter */}
                        <FilterSection title="Select Subject" icon={<BookOpen size={20} color={colors.primary} />}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                {getAvailableSubjects().map((subject) => (
                                    <OptionButton
                                        key={subject.id}
                                        selected={filters.selectedSubject === subject.id}
                                        onPress={() => setFilters(prev => ({ ...prev, selectedSubject: subject.id }))}
                                        style={styles.subjectButton}
                                    >
                                        <Text style={[
                                            styles.optionText, 
                                            { color: filters.selectedSubject === subject.id ? colors.primary : colors.text }
                                        ]}>
                                            {subject.name}
                                        </Text>
                                    </OptionButton>
                                ))}
                            </ScrollView>
                        </FilterSection>

                        {/* Status Filter - For Schedule Tab */}
                        {(activeTab === 'schedule' || activeTab === 'reports') && (
                            <FilterSection title="Quiz Status" icon={<Calendar size={20} color={colors.primary} />}>
                                <View style={styles.statusContainer}>
                                    {statusOptions.map((option) => (
                                        <OptionButton
                                            key={option.value}
                                            selected={filters.statusFilter === option.value}
                                            onPress={() => setFilters(prev => ({ ...prev, statusFilter: option.value }))}
                                            style={styles.statusButton}
                                        >
                                            <Text style={styles.statusIcon}>{option.icon}</Text>
                                            <Text style={[
                                                styles.optionText, 
                                                { color: filters.statusFilter === option.value ? colors.primary : colors.text }
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </OptionButton>
                                    ))}
                                </View>
                            </FilterSection>
                        )}

                        {/* Evaluation Status Filter - For Results Tab and Teachers only */}
                        {activeTab === 'results' && userRole === 'teacher' && (
                            <FilterSection title="Evaluation Status" icon={<CheckCircle size={20} color={colors.primary} />}>
                                <View style={styles.statusContainer}>
                                    {evaluationOptions.map((option) => (
                                        <OptionButton
                                            key={option.value}
                                            selected={filters.checkedFilter === option.value}
                                            onPress={() => setFilters(prev => ({ ...prev, checkedFilter: option.value }))}
                                            style={styles.statusButton}
                                        >
                                            <Text style={styles.statusIcon}>{option.icon}</Text>
                                            <Text style={[
                                                styles.optionText, 
                                                { color: filters.checkedFilter === option.value ? colors.primary : colors.text }
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </OptionButton>
                                    ))}
                                </View>
                            </FilterSection>
                        )}

                        {/* Applied Filters Summary */}
                        <View style={[styles.summarySection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.summaryTitle, { color: colors.text }]}>Current Filters:</Text>
                            
                            {userRole === 'teacher' && (
                                <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                    • Class: {getClassesWithAll().find(c => c.id === filters.selectedClass)?.name || 'All Classes'}
                                </Text>
                            )}
                            
                            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                • Subject: {getAvailableSubjects().find(s => s.id === filters.selectedSubject)?.name || 'All Subjects'}
                            </Text>
                            
                            {(activeTab === 'schedule' || activeTab === 'reports') && (
                                <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                    • Status: {statusOptions.find(s => s.value === filters.statusFilter)?.label}
                                </Text>
                            )}
                            
                            {activeTab === 'results' && userRole === 'teacher' && (
                                <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                    • Evaluation: {evaluationOptions.find(e => e.value === filters.checkedFilter)?.label}
                                </Text>
                            )}

                            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                • Active Tab: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={[styles.actions, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.resetButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={handleReset}
                        >
                            <RotateCcw size={16} color={colors.textSecondary} />
                            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset & Apply</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.mainActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
                                onPress={handleApply}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    section: {
        marginBottom: 32,
        borderBottomWidth: 1,
        paddingBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    horizontalScroll: {
        marginHorizontal: -8,
    },
    optionButton: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    classButton: {
        marginHorizontal: 4,
        minWidth: 100,
        alignItems: 'center',
    },
    subjectButton: {
        marginHorizontal: 4,
        minWidth: 120,
        alignItems: 'center',
    },
    statusContainer: {
        gap: 8,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    statusIcon: {
        fontSize: 20,
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
    summarySection: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    summaryItem: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    actions: {
        borderTopWidth: 1,
        padding: 24,
        gap: 16,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    resetButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    mainActions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    applyButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    applyButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});