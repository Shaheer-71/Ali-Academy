// components/attendance/modals/ViewAttendanceFilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Filter, X, Calendar, Users, Building, Clock, RotateCcw, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface Class {
    id: string;
    name: string;
}

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    parent_contact: string;
}

interface ViewFilterData {
    selectedClass: string;
    startDate: string;
    endDate: string;
    status: 'all' | 'present' | 'late' | 'absent';
    dateRange: 'today' | 'week' | 'month' | 'custom';
    viewType: 'class' | 'student'; // New: view by class or individual student
    selectedStudent: string; // New: selected student for individual view
}

interface ViewAttendanceFilterModalProps {
    visible: boolean;
    onClose: () => void;
    classes: Class[];
    students: Student[];
    currentFilters: ViewFilterData;
    onApplyFilters: (filters: ViewFilterData) => void;
}

export const ViewAttendanceFilterModal: React.FC<ViewAttendanceFilterModalProps> = ({
    visible,
    onClose,
    classes,
    students,
    currentFilters,
    onApplyFilters,
}) => {
    const { colors } = useTheme();
    const [filters, setFilters] = useState<ViewFilterData>(currentFilters);

    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters, visible]);

    const handleApply = () => {
        onApplyFilters(filters);
        onClose();
    };

    const handleReset = () => {
        const today = new Date().toISOString().split('T')[0];
        const resetFilters: ViewFilterData = {
            selectedClass: classes.length > 0 ? classes[0].id : '',
            startDate: today,
            endDate: today,
            status: 'all',
            dateRange: 'today',
            viewType: 'class',
            selectedStudent: '',
        };
        setFilters(resetFilters);
    };

    const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'custom') => {
        const today = new Date();
        let startDate: string;
        let endDate: string = today.toISOString().split('T')[0];

        switch (range) {
            case 'today':
                startDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                startDate = weekAgo.toISOString().split('T')[0];
                break;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                startDate = monthAgo.toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = filters.startDate;
                endDate = filters.endDate;
                break;
        }

        setFilters(prev => ({
            ...prev,
            dateRange: range,
            startDate,
            endDate,
        }));
    };

    const statusOptions = [
        { value: 'all' as const, label: 'All Records', icon: '📊', color: colors.textSecondary },
        { value: 'present' as const, label: 'Present Only', icon: '✅', color: '#10B981' },
        { value: 'late' as const, label: 'Late Only', icon: '⏰', color: '#F59E0B' },
        { value: 'absent' as const, label: 'Absent Only', icon: '❌', color: '#EF4444' },
    ];

    const dateRangeOptions = [
        { value: 'today' as const, label: 'Today', description: 'Current day only' },
        { value: 'week' as const, label: 'Last 7 Days', description: 'Past week' },
        { value: 'month' as const, label: 'Last 30 Days', description: 'Past month' },
        { value: 'custom' as const, label: 'Custom Range', description: 'Select specific dates' },
    ];

    const viewTypeOptions = [
        { value: 'class' as const, label: 'Class View', description: 'View all students in class', icon: '👥' },
        { value: 'student' as const, label: 'Individual Student', description: 'View single student records', icon: '👤' },
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
                { backgroundColor: colors.background, borderColor: colors.border },
                selected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                style
            ]}
            onPress={onPress}
        >
            {children}
        </TouchableOpacity>
    );

    // Filter students based on selected class
    const filteredStudents = students.filter(student => 
        !filters.selectedClass || student.class_id === filters.selectedClass
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={styles.headerLeft}>
                            <Filter size={24} color={colors.primary} />
                            <Text style={[styles.title, { color: colors.text }]}>View Attendance Filters</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* View Type Selection */}
                        <FilterSection title="View Type" icon={<User size={20} color={colors.primary} />}>
                            <View style={styles.viewTypeContainer}>
                                {viewTypeOptions.map((option) => (
                                    <OptionButton
                                        key={option.value}
                                        selected={filters.viewType === option.value}
                                        onPress={() => setFilters(prev => ({ 
                                            ...prev, 
                                            viewType: option.value,
                                            selectedStudent: option.value === 'class' ? '' : prev.selectedStudent
                                        }))}
                                        style={styles.viewTypeButton}
                                    >
                                        <Text style={styles.viewTypeIcon}>{option.icon}</Text>
                                        <View style={styles.viewTypeText}>
                                            <Text style={[
                                                styles.optionText, 
                                                { color: filters.viewType === option.value ? colors.primary : colors.text }
                                            ]}>
                                                {option.label}
                                            </Text>
                                            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                                {option.description}
                                            </Text>
                                        </View>
                                    </OptionButton>
                                ))}
                            </View>
                        </FilterSection>

                        {/* Class Filter */}
                        <FilterSection title="Select Class" icon={<Building size={20} color={colors.primary} />}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                {classes.map((classItem) => (
                                    <OptionButton
                                        key={classItem.id}
                                        selected={filters.selectedClass === classItem.id}
                                        onPress={() => setFilters(prev => ({ 
                                            ...prev, 
                                            selectedClass: classItem.id,
                                            selectedStudent: '' // Reset student when class changes
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

                        {/* Student Selection - Only show if individual view is selected */}
                        {filters.viewType === 'student' && (
                            <FilterSection title="Select Student" icon={<Users size={20} color={colors.primary} />}>
                                <ScrollView style={styles.studentScrollContainer} nestedScrollEnabled>
                                    {filteredStudents.length === 0 ? (
                                        <Text style={[styles.noStudentsText, { color: colors.textSecondary }]}>
                                            {filters.selectedClass ? 'No students in selected class' : 'Please select a class first'}
                                        </Text>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <OptionButton
                                                key={student.id}
                                                selected={filters.selectedStudent === student.id}
                                                onPress={() => setFilters(prev => ({ ...prev, selectedStudent: student.id }))}
                                                style={styles.studentButton}
                                            >
                                                <View style={styles.studentInfo}>
                                                    <Text style={[
                                                        styles.studentName, 
                                                        { color: filters.selectedStudent === student.id ? colors.primary : colors.text }
                                                    ]}>
                                                        {student.full_name}
                                                    </Text>
                                                    <Text style={[styles.studentRoll, { color: colors.textSecondary }]}>
                                                        Roll: {student.roll_number}
                                                    </Text>
                                                </View>
                                            </OptionButton>
                                        ))
                                    )}
                                </ScrollView>
                            </FilterSection>
                        )}

                        {/* Date Range Filter */}
                        <FilterSection title="Date Range" icon={<Calendar size={20} color={colors.primary} />}>
                            <View style={styles.dateRangeContainer}>
                                {dateRangeOptions.map((option) => (
                                    <OptionButton
                                        key={option.value}
                                        selected={filters.dateRange === option.value}
                                        onPress={() => handleDateRangeChange(option.value)}
                                        style={styles.dateRangeButton}
                                    >
                                        <View>
                                            <Text style={[
                                                styles.optionText, 
                                                { color: filters.dateRange === option.value ? colors.primary : colors.text }
                                            ]}>
                                                {option.label}
                                            </Text>
                                            <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                                {option.description}
                                            </Text>
                                        </View>
                                    </OptionButton>
                                ))}
                            </View>

                            {/* Custom Date Inputs */}
                            {filters.dateRange === 'custom' && (
                                <View style={[styles.customDateContainer, { backgroundColor: colors.background }]}>
                                    <View style={styles.dateInputGroup}>
                                        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From Date:</Text>
                                        <TextInput
                                            style={[styles.dateInput, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                            value={filters.startDate}
                                            onChangeText={(text) => setFilters(prev => ({ ...prev, startDate: text }))}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>
                                    <View style={styles.dateInputGroup}>
                                        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To Date:</Text>
                                        <TextInput
                                            style={[styles.dateInput, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                            value={filters.endDate}
                                            onChangeText={(text) => setFilters(prev => ({ ...prev, endDate: text }))}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Current Date Range Display */}
                            <View style={[styles.currentRangeDisplay, { backgroundColor: colors.background }]}>
                                <Clock size={16} color={colors.textSecondary} />
                                <Text style={[styles.currentRangeText, { color: colors.textSecondary }]}>
                                    {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </FilterSection>

                        {/* Status Filter */}
                        <FilterSection title="Attendance Status" icon={<Users size={20} color={colors.primary} />}>
                            <View style={styles.statusContainer}>
                                {statusOptions.map((option) => (
                                    <OptionButton
                                        key={option.value}
                                        selected={filters.status === option.value}
                                        onPress={() => setFilters(prev => ({ ...prev, status: option.value }))}
                                        style={styles.statusButton}
                                    >
                                        <Text style={styles.statusIcon}>{option.icon}</Text>
                                        <Text style={[
                                            styles.optionText, 
                                            { color: filters.status === option.value ? colors.primary : colors.text }
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </OptionButton>
                                ))}
                            </View>
                        </FilterSection>

                        {/* Applied Filters Summary */}
                        <View style={[styles.summarySection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.summaryTitle, { color: colors.text }]}>Current Filters:</Text>
                            
                            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                • View: {viewTypeOptions.find(v => v.value === filters.viewType)?.label}
                            </Text>
                            
                            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                • Class: {classes.find(c => c.id === filters.selectedClass)?.name || 'None selected'}
                            </Text>
                            
                            {filters.viewType === 'student' && filters.selectedStudent && (
                                <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                    • Student: {filteredStudents.find(s => s.id === filters.selectedStudent)?.full_name || 'None selected'}
                                </Text>
                            )}
                            
                            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                • Date: {dateRangeOptions.find(d => d.value === filters.dateRange)?.label}
                            </Text>
                            
                            <Text style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                • Status: {statusOptions.find(s => s.value === filters.status)?.label}
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
                            <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset</Text>
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
        maxHeight: '90%',
        minHeight: '70%',
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
    viewTypeContainer: {
        gap: 12,
    },
    viewTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 16,
    },
    viewTypeIcon: {
        fontSize: 24,
    },
    viewTypeText: {
        flex: 1,
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
    studentScrollContainer: {
        maxHeight: 200,
    },
    studentButton: {
        padding: 16,
    },
    studentInfo: {
        alignItems: 'flex-start',
    },
    studentName: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        marginBottom: 2,
    },
    studentRoll: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
    },
    noStudentsText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        padding: 20,
    },
    dateRangeContainer: {
        gap: 8,
    },
    dateRangeButton: {
        padding: 16,
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
    optionDescription: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },
    customDateContainer: {
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        gap: 12,
    },
    dateInputGroup: {
        gap: 8,
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    dateInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    currentRangeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    currentRangeText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
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