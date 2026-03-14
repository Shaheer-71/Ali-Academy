// components/attendance/modals/ComprehensiveFilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Filter, X, Calendar, Users, Building, BookOpen, Clock, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

interface Class {
    id: string;
    name: string;
}

interface Subject {
    id: string;
    name: string;
}

interface FilterData {
    selectedClass: string;
    selectedSubject: string;
    startDate: string;
    endDate: string;
    status: 'all' | 'present' | 'late' | 'absent';
    dateRange: 'today' | 'week' | 'month' | 'custom';
}

interface ComprehensiveFilterModalProps {
    visible: boolean;
    onClose: () => void;
    classes: Class[];
    subjects: Subject[];
    currentFilters: FilterData;
    onApplyFilters: (filters: FilterData) => void;
    userRole: 'teacher' | 'student';
    viewMode: 'mark' | 'view';
    teacherId?: string;
}

export const ComprehensiveFilterModal: React.FC<ComprehensiveFilterModalProps> = ({
    visible,
    onClose,
    classes,
    subjects: initialSubjects,
    currentFilters,
    onApplyFilters,
    userRole,
    viewMode,
    teacherId,
}) => {
    const { colors } = useTheme();
    const { profile } = useAuth();
    const [filters, setFilters] = useState<FilterData>(currentFilters);
    const [localSubjects, setLocalSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    // Reset filters when modal opens
    useEffect(() => {
        if (visible) {
            setFilters(currentFilters);

            // Clear subjects initially - they'll be fetched when class is selected
            if (!currentFilters.selectedClass) {
                setLocalSubjects([]);
            }
        }
    }, [visible]);

    // Fetch subjects when class changes (only if we have a valid class selected)
    useEffect(() => {
        if (visible && filters.selectedClass && profile) {
            fetchSubjectsForClass(filters.selectedClass);
        } else if (visible && !filters.selectedClass) {
            setLocalSubjects([]);
        }
    }, [filters.selectedClass, visible, teacherId]);

    const fetchSubjectsForClass = async (classId: string) => {
        if (!profile?.id || !classId) {
            return;
        }

        setLoadingSubjects(true);
        try {

            const { data: subjectIDData, error: subjectIDError } = await supabase
                .from('teacher_subject_enrollments')
                .select('subject_id')
                .eq('teacher_id', profile?.id)
                .eq('class_id', classId);

            if (subjectIDError) {
                console.warn("❌ Error fetching subject enrollments:", subjectIDError);
                throw subjectIDError;
            }


            let enrolledSubjects = [...new Set(subjectIDData?.map(item => item.subject_id) || [])];

            if (enrolledSubjects.length === 0) {
                setLocalSubjects([]);
                setFilters(prev => ({ ...prev, selectedSubject: '' }));
                return;
            }

            const { data, error } = await supabase
                .from('subjects')
                .select('id, name')
                .in('id', enrolledSubjects)
                .order('name');

            if (error) {
                console.warn("❌ Error fetching subjects details:", error);
                throw error;
            }

            setLocalSubjects(data || []);

            // Only auto-select if there's no current selection or if current selection is invalid
            if (data && data.length > 0) {
                const currentSubjectExists = data.some(s => s.id === filters.selectedSubject);
                if (!currentSubjectExists) {
                    console.log("🔄 Current subject not found, auto-selecting first subject");
                    setFilters(prev => ({ ...prev, selectedSubject: data[0].id }));
                }
            } else {
                setFilters(prev => ({ ...prev, selectedSubject: '' }));
            }
        } catch (error) {
            console.warn('❌ Modal: Error fetching subjects:', error);
            setLocalSubjects([]);
            setFilters(prev => ({ ...prev, selectedSubject: '' }));
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleClassChange = (classId: string) => {
        console.log("🏫 Modal: Class changed to:", classId);
        setFilters(prev => ({
            ...prev,
            selectedClass: classId,
            selectedSubject: '' // Clear subject when class changes
        }));
        fetchSubjectsForClass(classId);
        // Note: fetchSubjectsForClass will be called by the useEffect
    };

    const handleApply = () => {
        // Validate that both class and subject are selected for teachers
        if (userRole === 'teacher' && (!filters.selectedClass || !filters.selectedSubject)) {
            alert('Please select both class and subject');
            return;
        }
        console.log("✅ Applying filters:", filters);
        onApplyFilters(filters);
        onClose();
    };

    const handleReset = () => {
        const today = new Date().toISOString().split('T')[0];
        const resetFilters: FilterData = {
            selectedClass: '', // Start with no class selected
            selectedSubject: '',
            startDate: today,
            endDate: today,
            status: 'all',
            dateRange: 'today',
        };
        setFilters(resetFilters);
        setLocalSubjects([]); // Clear subjects when resetting
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
        { value: 'all' as const, label: 'All Students', icon: '👥', color: colors.textSecondary },
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

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={styles.headerLeft}>
                            <Filter size={24} color={colors.primary} />
                            <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>Filter Options</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* All your filter sections here - unchanged */}
                        {/* Class Filter - Only for Teachers */}
                        {userRole === 'teacher' && (
                            <FilterSection title="Select Class" icon={<Building size={20} color={colors.primary} />}>
                                {classes.length === 0 ? (
                                    <View style={[styles.emptySubjectsContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            No classes available
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {classes.map((classItem) => (
                                            <OptionButton
                                                key={classItem.id}
                                                selected={filters.selectedClass === classItem.id}
                                                onPress={() => handleClassChange(classItem.id)}
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
                                )}
                            </FilterSection>
                        )}

                        {/* Subject Filter - Only for Teachers */}
                        {userRole === 'teacher' && (
                            <FilterSection title="Select Subject" icon={<BookOpen size={20} color={colors.primary} />}>
                                {loadingSubjects ? (
                                    <View style={[styles.emptySubjectsContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            Loading subjects...
                                        </Text>
                                    </View>
                                ) : !filters.selectedClass ? (
                                    <View style={[styles.emptySubjectsContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            Please select a class first
                                        </Text>
                                    </View>
                                ) : localSubjects.length === 0 ? (
                                    <View style={[styles.emptySubjectsContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            No subjects found for this class
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {localSubjects.map((subject) => (
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
                                            <Text allowFontScaling={false} style={[
                                                styles.optionText,
                                                { color: filters.dateRange === option.value ? colors.primary : colors.text }
                                            ]}>
                                                {option.label}
                                            </Text>
                                            <Text allowFontScaling={false} style={[styles.optionDescription, { color: colors.textSecondary }]}>
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
                                        <Text allowFontScaling={false} style={[styles.dateLabel, { color: colors.textSecondary }]}>From Date:</Text>
                                        <TextInput
                                            style={[styles.dateInput, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
                                            value={filters.startDate}
                                            onChangeText={(text) => setFilters(prev => ({ ...prev, startDate: text }))}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={colors.textSecondary}
                                        />
                                    </View>
                                    <View style={styles.dateInputGroup}>
                                        <Text allowFontScaling={false} style={[styles.dateLabel, { color: colors.textSecondary }]}>To Date:</Text>
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
                                <Text allowFontScaling={false} style={[styles.currentRangeText, { color: colors.textSecondary }]}>
                                    {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </FilterSection>

                        {/* Status Filter - Only for View Mode */}
                        {viewMode === 'view' && (
                            <FilterSection title="Attendance Status" icon={<Users size={20} color={colors.primary} />}>
                                <View style={styles.statusContainer}>
                                    {statusOptions.map((option) => (
                                        <OptionButton
                                            key={option.value}
                                            selected={filters.status === option.value}
                                            onPress={() => setFilters(prev => ({ ...prev, status: option.value }))}
                                            style={styles.statusButton}
                                        >
                                            <Text allowFontScaling={false} style={styles.statusIcon}>{option.icon}</Text>
                                            <Text allowFontScaling={false} style={[
                                                styles.optionText,
                                                { color: filters.status === option.value ? colors.primary : colors.text }
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </OptionButton>
                                    ))}
                                </View>
                            </FilterSection>
                        )}

                        {/* Applied Filters Summary */}
                        {/* <View style={[styles.summarySection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[styles.summaryTitle, { color: colors.text }]}>Current Filters:</Text>

                            {userRole === 'teacher' && (
                                <>
                                    <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                        • Class: {filters.selectedClass ? (classes.find(c => c.id === filters.selectedClass)?.name || 'Unknown') : 'None selected'}
                                    </Text>
                                    <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                        • Subject: {filters.selectedSubject ? (localSubjects.find(s => s.id === filters.selectedSubject)?.name || 'Unknown') : 'None selected'}
                                    </Text>
                                </>
                            )}

                            <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                • Date: {dateRangeOptions.find(d => d.value === filters.dateRange)?.label}
                            </Text>

                            {viewMode === 'view' && (
                                <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                    • Status: {statusOptions.find(s => s.value === filters.status)?.label}
                                </Text>
                            )}
                        </View> */}
                    </ScrollView>

                    {/* Fixed Bottom Actions - OUTSIDE ScrollView */}
                    <View style={[styles.actions, { backgroundColor: colors.cardBackground, borderTopColor: colors.border }]}>
                        <View style={styles.mainActions}>
                            <TouchableOpacity
                                style={[styles.resetButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={handleReset}
                            >
                                <RotateCcw size={16} color={colors.textSecondary} />
                                <Text allowFontScaling={false} style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
                                onPress={handleApply}
                            >
                                <Text allowFontScaling={false} style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '65%',
        overflow: 'hidden',
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
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
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
        fontSize: TextSizes.medium,
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
    emptySubjectsContainer: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    dateRangeContainer: {
        gap: 8,
    },
    dateRangeButton: {
        padding: 16,
    },
    optionText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },
    optionDescription: {
        fontSize: TextSizes.small,
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
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Medium',
    },
    dateInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: TextSizes.normal,
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
        fontSize: TextSizes.small,
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
        fontSize: TextSizes.normal,
    },
    summarySection: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    summaryItem: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        marginBottom: 4,
    },
    actions: {
        borderTopWidth: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
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
        fontSize: TextSizes.small,
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
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
    applyButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
});

// const styles = StyleSheet.create({
//     overlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         justifyContent: 'flex-end',
//     },
//     modalContainer: {
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         maxHeight: '90%',
//         minHeight: '60%',
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         padding: 24,
//         borderBottomWidth: 1,
//     },
//     headerLeft: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//     },
//     title: {
//         fontSize: 20,
//         fontFamily: 'Inter-SemiBold',
//     },
//     closeButton: {
//         padding: 4,
//     },
//     content: {
//         flex: 1,
//         padding: 24,
//     },
//     section: {
//         marginBottom: 32,
//         borderBottomWidth: 1,
//         paddingBottom: 24,
//     },
//     sectionHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         marginBottom: 16,
//     },
//     sectionTitle: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//     },
//     horizontalScroll: {
//         marginHorizontal: -8,
//     },
//     optionButton: {
//         padding: 12,
//         borderRadius: 12,
//         borderWidth: 1,
//         marginBottom: 8,
//     },
//     classButton: {
//         marginHorizontal: 4,
//         minWidth: 100,
//         alignItems: 'center',
//     },
//     emptySubjectsContainer: {
//         padding: 16,
//         borderRadius: 12,
//         alignItems: 'center',
//     },
//     emptyText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//     },
//     dateRangeContainer: {
//         gap: 8,
//     },
//     dateRangeButton: {
//         padding: 16,
//     },
//     optionText: {
//         fontSize: 16,
//         fontFamily: 'Inter-Medium',
//     },
//     optionDescription: {
//         fontSize: 13,
//         fontFamily: 'Inter-Regular',
//         marginTop: 2,
//     },
//     customDateContainer: {
//         borderRadius: 12,
//         padding: 16,
//         marginTop: 12,
//         gap: 12,
//     },
//     dateInputGroup: {
//         gap: 8,
//     },
//     dateLabel: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//     },
//     dateInput: {
//         borderWidth: 1,
//         borderRadius: 8,
//         padding: 12,
//         fontSize: 16,
//         fontFamily: 'Inter-Regular',
//     },
//     currentRangeDisplay: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//         padding: 12,
//         borderRadius: 8,
//         marginTop: 12,
//     },
//     currentRangeText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//     },
//     statusContainer: {
//         gap: 8,
//     },
//     statusButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//         padding: 16,
//     },
//     statusIcon: {
//         fontSize: 20,
//     },
//     summarySection: {
//         borderRadius: 12,
//         borderWidth: 1,
//         padding: 16,
//         marginTop: 8,
//     },
//     summaryTitle: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 8,
//     },
//     summaryItem: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         marginBottom: 4,
//     },
//     actions: {
//         borderTopWidth: 1,
//         padding: 24,
//         gap: 16,
//     },
//     resetButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//         padding: 12,
//         borderRadius: 8,
//         borderWidth: 1,
//     },
//     resetButtonText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Medium',
//     },
//     mainActions: {
//         flexDirection: 'row',
//         gap: 12,
//     },
//     button: {
//         flex: 1,
//         paddingVertical: 16,
//         paddingHorizontal: 20,
//         borderRadius: 12,
//         alignItems: 'center',
//     },
//     cancelButton: {
//         borderWidth: 1,
//     },
//     applyButton: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     buttonText: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//     },
//     applyButtonText: {
//         color: '#ffffff',
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//     },
// });