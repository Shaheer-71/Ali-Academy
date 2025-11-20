// components/exams/modals/ComprehensiveExamsFilterModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Filter, X, Building, BookOpen, Calendar, CheckCircle, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

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
    statusFilter: 'all' | 'scheduled' | 'completed';
    checkedFilter: 'all' | 'checked' | 'unchecked';
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
    getSubjectsForClass: (classId: string) => Subject[];
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
    getSubjectsForClass,
}) => {
    const { colors } = useTheme();
    const [filters, setFilters] = useState<ExamFilterData>(currentFilters);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters, visible]);

    // Fetch subjects when class changes
    useEffect(() => {
        if (filters.selectedClass) {
            loadSubjectsForClass(filters.selectedClass);
        } else {
            setAvailableSubjects([]);
        }
    }, [filters.selectedClass]);

    const loadSubjectsForClass = async (classId: string) => {
        setLoadingSubjects(true);
        try {
            const classSubjects = await getSubjectsForClass(classId);
            setAvailableSubjects(classSubjects);
        } catch (error) {
            console.warn('Error loading subjects:', error);
            setAvailableSubjects([]);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleApply = () => {
        // Validate selections
        if (!filters.selectedClass || !filters.selectedSubject) {
            alert('Please select both class and subject');
            return;
        }
        onApplyFilters(filters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters: ExamFilterData = {
            selectedClass: classes.length > 0 ? classes[0].id : '',
            selectedSubject: '',
            statusFilter: 'all',
            checkedFilter: 'all',
        };
        setFilters(resetFilters);

        // Load subjects for first class
        if (classes.length > 0) {
            loadSubjectsForClass(classes[0].id);
        }
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
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
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
            transparent animationType="fade"
            statusBarTranslucent={true}  // ← ADD THIS
            presentationStyle="overFullScreen">
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={styles.headerLeft}>
                            <Filter size={24} color={colors.primary} />
                            <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>Exam Filters</Text>
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
                                    {classes.map((classItem) => (
                                        <OptionButton
                                            key={classItem.id}
                                            selected={filters.selectedClass === classItem.id}
                                            onPress={() => setFilters(prev => ({
                                                ...prev,
                                                selectedClass: classItem.id,
                                                selectedSubject: '' // Reset subject when class changes
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
                        )}

                        {/* Subject Filter */}
                        {userRole === 'teacher' && (
                            <FilterSection title="Select Subject" icon={<BookOpen size={20} color={colors.primary} />}>
                                {!filters.selectedClass ? (
                                    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            Please select a class first
                                        </Text>
                                    </View>
                                ) : loadingSubjects ? (
                                    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            Loading subjects...
                                        </Text>
                                    </View>
                                ) : availableSubjects.length === 0 ? (
                                    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
                                        <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                            No subjects assigned to this class
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                        {availableSubjects.map((subject) => (
                                            <OptionButton
                                                key={subject.id}
                                                selected={filters.selectedSubject === subject.id}
                                                onPress={() => setFilters(prev => ({ ...prev, selectedSubject: subject.id }))}
                                                style={styles.subjectButton}
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
                                            <Text allowFontScaling={false} style={styles.statusIcon}>{option.icon}</Text>
                                            <Text allowFontScaling={false} style={[
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
                                            <Text allowFontScaling={false} style={styles.statusIcon}>{option.icon}</Text>
                                            <Text allowFontScaling={false} style={[
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
                        {/* <View style={[styles.summarySection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[styles.summaryTitle, { color: colors.text }]}>Current Filters:</Text>

                            {userRole === 'teacher' && (
                                <>
                                    <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                        • Class: {classes.find(c => c.id === filters.selectedClass)?.name || 'None selected'}
                                    </Text>
                                    <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                        • Subject: {availableSubjects.find(s => s.id === filters.selectedSubject)?.name || 'None selected'}
                                    </Text>
                                </>
                            )}

                            {(activeTab === 'schedule' || activeTab === 'reports') && (
                                <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                    • Status: {statusOptions.find(s => s.value === filters.statusFilter)?.label}
                                </Text>
                            )}

                            {activeTab === 'results' && userRole === 'teacher' && (
                                <Text allowFontScaling={false} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                                    • Evaluation: {evaluationOptions.find(e => e.value === filters.checkedFilter)?.label}
                                </Text>
                            )}
                        </View> */}
                    </ScrollView>

                    {/* Actions */}
                    <View style={[styles.actions, { borderTopColor: colors.border }]}>


                        <View style={styles.mainActions}>

                            <TouchableOpacity
                                style={[styles.resetButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={handleReset}
                            >
                                <RotateCcw size={16} color={colors.textSecondary} />
                                <Text allowFontScaling={false} style={[styles.resetButtonText, { color: colors.textSecondary }]}>Reset & Apply</Text>
                            </TouchableOpacity>
                            {/* <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={onClose}
                            >
                                <Text allowFontScaling={false} style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity> */}

                            <TouchableOpacity
                                style={[styles.button, styles.applyButton, { backgroundColor: colors.primary }]}
                                onPress={handleApply}
                            >
                                <Text allowFontScaling={false} style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
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
        maxHeight: '65%',
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
        fontSize: TextSizes.extraLarge, // from 20
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
        fontSize: TextSizes.large, // from 18
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
    emptyContainer: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: TextSizes.medium, // from 14
        fontFamily: 'Inter-Regular',
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
        fontSize: TextSizes.extraLarge, // from 20
    },
    optionText: {
        fontSize: TextSizes.medium, // from 16
        fontFamily: 'Inter-Medium',
    },
    summarySection: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: TextSizes.medium, // from 16
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    summaryItem: {
        fontSize: TextSizes.small, // from 14
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
        fontSize: TextSizes.small, // from 14
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
        fontSize: TextSizes.medium, // from 16
        fontFamily: 'Inter-SemiBold',
    },
    applyButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.medium, // from 16
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
//         maxHeight: '85%',
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
//     subjectButton: {
//         marginHorizontal: 4,
//         minWidth: 120,
//         alignItems: 'center',
//     },
//     emptyContainer: {
//         padding: 16,
//         borderRadius: 12,
//         alignItems: 'center',
//     },
//     emptyText: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
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
//     optionText: {
//         fontSize: 16,
//         fontFamily: 'Inter-Medium',
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