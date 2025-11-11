// components/attendance/modals/ViewAttendanceFilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Filter, X, Calendar, Users, Building, BookOpen, Eye, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface Class {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface Student {
    id: string;
    full_name: string;
    roll_number: string;
    class_id: string;
}

interface ViewFilterData {
    selectedClass: string;
    selectedSubject: string;
    startDate: string;
    endDate: string;
    status: 'all' | 'present' | 'late' | 'absent';
    dateRange: 'today' | 'week' | 'month' | 'custom';
    viewType: 'class' | 'student';
    selectedStudent: string;
}

interface ViewAttendanceFilterModalProps {
    visible: boolean;
    onClose: () => void;
    classes: Class[];
    subjects: Subject[];
    students: Student[];
    currentFilters: ViewFilterData;
    onApplyFilters: (filters: ViewFilterData) => void;
}

export const ViewAttendanceFilterModal: React.FC<ViewAttendanceFilterModalProps> = ({
    visible,
    onClose,
    classes,
    subjects,
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
        // Validate selections
        if (!filters.selectedClass || !filters.selectedSubject) {
            alert('Please select both class and subject');
            return;
        }
        if (filters.viewType === 'student' && !filters.selectedStudent) {
            alert('Please select a student for individual view');
            return;
        }
        onApplyFilters(filters);
        onClose();
    };

    const handleReset = () => {
        const today = new Date().toISOString().split('T')[0];
        const resetFilters: ViewFilterData = {
            selectedClass: classes.length > 0 ? classes[0].id : '',
            selectedSubject: subjects.length > 0 ? subjects[0].id : '',
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

    // Get students for selected class
    const classStudents = students.filter(s => s.class_id === filters.selectedClass);

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
                <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            </View>
            {children}
        </View>
    );

    const OptionButton = ({
        selected,
        onPress,
        children,
        style = {},
        disabled = false
    }: {
        selected: boolean;
        onPress: () => void;
        children: React.ReactNode;
        style?: any;
        disabled?: boolean;
    }) => (
        <TouchableOpacity
            style={[
                styles.optionButton,
                { backgroundColor: colors.background, borderColor: colors.border },
                selected && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                disabled && { opacity: 0.5 },
                style
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            {children}
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={styles.headerLeft}>
                            <Filter size={24} color={colors.primary} />
                            <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>View Attendance Filters</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* View Type Selection */}
                        <FilterSection title="View Type" icon={<Eye size={20} color={colors.primary} />}>
                            <View style={styles.viewTypeContainer}>
                                <OptionButton
                                    selected={filters.viewType === 'class'}
                                    onPress={() => setFilters(prev => ({ ...prev, viewType: 'class', selectedStudent: '' }))}
                                    style={styles.viewTypeButton}
                                >
                                    <Building size={20} color={filters.viewType === 'class' ? colors.primary : colors.text} />
                                    <View>
                                        <Text allowFontScaling={false} style={[
                                            styles.viewTypeTitle,
                                            { color: filters.viewType === 'class' ? colors.primary : colors.text }
                                        ]}>
                                            Class View
                                        </Text>
                                        <Text allowFontScaling={false} style={[styles.viewTypeDesc, { color: colors.textSecondary }]}>
                                            View all students in class
                                        </Text>
                                    </View>
                                </OptionButton>

                                <OptionButton
                                    selected={filters.viewType === 'student'}
                                    onPress={() => setFilters(prev => ({ ...prev, viewType: 'student' }))}
                                    style={styles.viewTypeButton}
                                >
                                    <Users size={20} color={filters.viewType === 'student' ? colors.primary : colors.text} />
                                    <View>
                                        <Text allowFontScaling={false} style={[
                                            styles.viewTypeTitle,
                                            { color: filters.viewType === 'student' ? colors.primary : colors.text }
                                        ]}>
                                            Student View
                                        </Text>
                                        <Text allowFontScaling={false} style={[styles.viewTypeDesc, { color: colors.textSecondary }]}>
                                            View individual student
                                        </Text>
                                    </View>
                                </OptionButton>
                            </View>
                        </FilterSection>

                        {/* Class Selection */}
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
                                        <Text allowFontScaling={false} style={[
                                            styles.optionText,
                                            { color: filters.selectedClass === classItem.id ? colors.primary : colors.text }
                                        ]}>
                                            {classItem.name}
                                        </Text>
                                    </OptionButton>
                                ))}
                            </ScrollView>
                        </FilterSection>

                        {/* Subject Selection */}
                        <FilterSection title="Select Subject" icon={<BookOpen size={20} color={colors.primary} />}>
                            {subjects.length === 0 ? (
                                <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                                    <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                        Please select a class first
                                    </Text>
                                </View>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {subjects.map((subject) => (
                                        <OptionButton
                                            key={subject.id}
                                            selected={filters.selectedSubject === subject.id}
                                            onPress={() => setFilters(prev => ({ ...prev, selectedSubject: subject.id }))}
                                            style={styles.classButton}
                                        >
                                            <Text allowFontScaling={false} style={[
                                                styles.optionText,
                                                { color: filters.selectedSubject === subject.id ? colors.primary : colors.text }
                                            ]}>
                                                {subject.name}
                                            </Text>
                                        </OptionButton>
                                    ))}
                                </ScrollView>
                            )}
                        </FilterSection>

                        {/* Student Selection - Only show if viewType is 'student' */}
                        {filters.viewType === 'student' && (
                            <FilterSection title="Select Student" icon={<Users size={20} color={colors.primary} />}>
                                {classStudents.length === 0 ? (
                                    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            No students in selected class
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.studentListContainer}>
                                        {classStudents.map((student) => (
                                            <OptionButton
                                                key={student.id}
                                                selected={filters.selectedStudent === student.id}
                                                onPress={() => setFilters(prev => ({ ...prev, selectedStudent: student.id }))}
                                                style={styles.studentButton}
                                            >
                                                <View style={styles.studentInfo}>
                                                    <Text allowFontScaling={false} style={[
                                                        styles.studentName,
                                                        { color: filters.selectedStudent === student.id ? colors.primary : colors.text }
                                                    ]}>
                                                        {student.full_name}
                                                    </Text>
                                                    <Text allowFontScaling={false} style={[styles.studentRoll, { color: colors.textSecondary }]}>
                                                        Roll: {student.roll_number}
                                                    </Text>
                                                </View>
                                            </OptionButton>
                                        ))}
                                    </View>
                                )}
                            </FilterSection>
                        )}

                        {/* Date Range */}
                        <FilterSection title="Date Range" icon={<Calendar size={20} color={colors.primary} />}>
                            <View style={styles.dateRangeGrid}>
                                <OptionButton
                                    selected={filters.dateRange === 'today'}
                                    onPress={() => handleDateRangeChange('today')}
                                    style={styles.dateRangeButton}
                                >
                                    <Text allowFontScaling={false} style={[
                                        styles.dateRangeText,
                                        { color: filters.dateRange === 'today' ? colors.primary : colors.text }
                                    ]}>Today</Text>
                                </OptionButton>

                                <OptionButton
                                    selected={filters.dateRange === 'week'}
                                    onPress={() => handleDateRangeChange('week')}
                                    style={styles.dateRangeButton}
                                >
                                    <Text allowFontScaling={false} style={[
                                        styles.dateRangeText,
                                        { color: filters.dateRange === 'week' ? colors.primary : colors.text }
                                    ]}>7 Days</Text>
                                </OptionButton>

                                <OptionButton
                                    selected={filters.dateRange === 'month'}
                                    onPress={() => handleDateRangeChange('month')}
                                    style={styles.dateRangeButton}
                                >
                                    <Text allowFontScaling={false} style={[
                                        styles.dateRangeText,
                                        { color: filters.dateRange === 'month' ? colors.primary : colors.text }
                                    ]}>30 Days</Text>
                                </OptionButton>

                                <OptionButton
                                    selected={filters.dateRange === 'custom'}
                                    onPress={() => handleDateRangeChange('custom')}
                                    style={styles.dateRangeButton}
                                >
                                    <Text allowFontScaling={false} style={[
                                        styles.dateRangeText,
                                        { color: filters.dateRange === 'custom' ? colors.primary : colors.text }
                                    ]}>Custom</Text>
                                </OptionButton>
                            </View>

                            {filters.dateRange === 'custom' && (
                                <View style={[styles.customDateContainer, { backgroundColor: colors.background }]}>
                                    <View style={styles.dateInputGroup}>
                                        <Text allowFontScaling={false} style={[styles.dateLabel, { color: colors.textSecondary }]}>From:</Text>
                                        <TextInput
                                            style={[styles.dateInput, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                            value={filters.startDate}
                                            onChangeText={(text) => setFilters(prev => ({ ...prev, startDate: text }))}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>
                                    <View style={styles.dateInputGroup}>
                                        <Text allowFontScaling={false} style={[styles.dateLabel, { color: colors.textSecondary }]}>To:</Text>
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
                        </FilterSection>

                        {/* Status Filter */}
                        <FilterSection title="Status" icon={<Users size={20} color={colors.primary} />}>
                            <View style={styles.statusGrid}>
                                <OptionButton
                                    selected={filters.status === 'all'}
                                    onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                                    style={styles.statusButton}
                                >
                                    <Text allowFontScaling={false} style={styles.statusIcon}>👥</Text>
                                    <Text allowFontScaling={false} style={[
                                        styles.statusText,
                                        { color: filters.status === 'all' ? colors.primary : colors.text }
                                    ]}>All</Text>
                                </OptionButton>

                                <OptionButton
                                    selected={filters.status === 'present'}
                                    onPress={() => setFilters(prev => ({ ...prev, status: 'present' }))}
                                    style={styles.statusButton}
                                >
                                    <Text allowFontScaling={false} style={styles.statusIcon}>✅</Text>
                                    <Text allowFontScaling={false} style={[
                                        styles.statusText,
                                        { color: filters.status === 'present' ? colors.primary : colors.text }
                                    ]}>Present</Text>
                                </OptionButton>

                                <OptionButton
                                    selected={filters.status === 'late'}
                                    onPress={() => setFilters(prev => ({ ...prev, status: 'late' }))}
                                    style={styles.statusButton}
                                >
                                    <Text allowFontScaling={false} style={styles.statusIcon}>⏰</Text>
                                    <Text allowFontScaling={false} style={[
                                        styles.statusText,
                                        { color: filters.status === 'late' ? colors.primary : colors.text }
                                    ]}>Late</Text>
                                </OptionButton>

                                <OptionButton
                                    selected={filters.status === 'absent'}
                                    onPress={() => setFilters(prev => ({ ...prev, status: 'absent' }))}
                                    style={styles.statusButton}
                                >
                                    <Text allowFontScaling={false} style={styles.statusIcon}>❌</Text>
                                    <Text allowFontScaling={false} style={[
                                        styles.statusText,
                                        { color: filters.status === 'absent' ? colors.primary : colors.text }
                                    ]}>Absent</Text>
                                </OptionButton>
                            </View>
                        </FilterSection>
                    </ScrollView>

                    {/* Actions */}
                    <View style={[styles.actions, { borderTopColor: colors.border }]}>
                        <TouchableOpacity
                            style={[styles.resetButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={handleReset}
                        >
                            <RotateCcw size={16} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset</Text>
                        </TouchableOpacity>

                        <View style={styles.mainActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={onClose}
                            >
                                <Text allowFontScaling={false} style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
                                onPress={handleApply}
                            >
                                <Text allowFontScaling={false} style={styles.applyButtonText}>Apply</Text>
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
    optionButton: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    viewTypeContainer: {
        gap: 12,
    },
    viewTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    viewTypeTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    viewTypeDesc: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },
    horizontalScroll: {
        marginHorizontal: -8,
    },
    classButton: {
        marginHorizontal: 4,
        minWidth: 100,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
    },
    emptyContainer: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    studentListContainer: {
        gap: 8,
    },
    studentButton: {
        padding: 16,
    },
    studentInfo: {
        gap: 4,
    },
    studentName: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    studentRoll: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
    },
    dateRangeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dateRangeButton: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: 12,
    },
    dateRangeText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
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
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusButton: {
        flex: 1,
        minWidth: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
    },
    statusIcon: {
        fontSize: 18,
    },
    statusText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
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