import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    startDate: string;
    endDate: string;
    onDateChange: {
        setStartDate: (date: string) => void;
        setEndDate: (date: string) => void;
    };
    onApply: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    startDate,
    endDate,
    onDateChange,
    onApply,
}) => {
    const { colors } = useTheme();

    const setQuickFilter = (days: number) => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - days);
        onDateChange.setStartDate(start.toISOString().split('T')[0]);
        onDateChange.setEndDate(today.toISOString().split('T')[0]);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.filterModalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Attendance Records</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.filterContent}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>From Date</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={startDate}
                                onChangeText={onDateChange.setStartDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>To Date</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                value={endDate}
                                onChangeText={onDateChange.setEndDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        <View style={styles.quickFilters}>
                            <Text style={[styles.quickFiltersLabel, { color: colors.text }]}>Quick Filters</Text>
                            <View style={styles.quickFilterButtons}>
                                {[
                                    { label: 'Today', days: 0 },
                                    { label: 'This Week', days: 7 },
                                    { label: 'This Month', days: 30 },
                                ].map((filter) => (
                                    <TouchableOpacity
                                        key={filter.label}
                                        style={[styles.quickFilterButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                        onPress={() => setQuickFilter(filter.days)}
                                    >
                                        <Text style={[styles.quickFilterText, { color: colors.text }]}>{filter.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.applyFilterButton, { backgroundColor: colors.primary }]}
                            onPress={onApply}
                        >
                            <Text style={styles.applyFilterButtonText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    filterModalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter-SemiBold',
    },
    filterContent: {
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    quickFilters: {
        marginBottom: 20,
    },
    quickFiltersLabel: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 12,
    },
    quickFilterButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    quickFilterButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    quickFilterText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    applyFilterButton: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyFilterButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});
