import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import {
    Calendar,
    Clock,
    MapPin,
    BookOpen,
    User,
    Search,
    Edit3,
    Trash2,
    AlertCircle,
    Plus,
    X
} from 'lucide-react-native';
import {
    TimetableEntryWithDetails,
    DayOfWeek,
    DAYS_SHORT,
    Class,
    Subject,
    Teacher,
    Profile
} from '@/types/timetable';

interface TimetableHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddPress?: () => void;
    showAddButton: boolean;
    colors: any;
}

export const TimetableHeader: React.FC<TimetableHeaderProps> = ({
    searchQuery,
    onSearchChange,
    onAddPress,
    showAddButton,
    colors
}) => (
    <View style={styles.header}>
        <View style={styles.searchContainer}>
            <View style={[
                styles.searchInputContainer,
                { backgroundColor: colors.cardBackground, borderColor: colors.border }
            ]}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search lecture..."
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>
            {showAddButton && (
                <TouchableOpacity
                    style={[styles.addHeaderButton, { backgroundColor: colors.primary }]}
                    onPress={onAddPress}
                >
                    <Plus size={20} color="#ffffff" />
                </TouchableOpacity>
            )}
        </View>
    </View>
);

interface ClassFilterProps {
    classes: Class[];
    selectedClassId?: string;
    onClassSelect: (classId?: string) => void;
    colors: any;
}

export const ClassFilter: React.FC<ClassFilterProps> = ({
    classes,
    selectedClassId,
    onClassSelect,
    colors
}) => (
    <View style={styles.classFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.classButtons}>
                <TouchableOpacity
                    style={[
                        styles.classButton,
                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                        !selectedClassId && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => onClassSelect(undefined)}
                >
                    <Text style={[
                        styles.classButtonText,
                        { color: colors.text },
                        !selectedClassId && { color: '#ffffff' },
                    ]}>
                        All Classes
                    </Text>
                </TouchableOpacity>
                {classes.map((classItem) => (
                    <TouchableOpacity
                        key={classItem.id}
                        style={[
                            styles.classButton,
                            { backgroundColor: colors.cardBackground, borderColor: colors.border },
                            selectedClassId === classItem.id && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => onClassSelect(classItem.id)}
                    >
                        <Text style={[
                            styles.classButtonText,
                            { color: colors.text },
                            selectedClassId === classItem.id && { color: '#ffffff' },
                        ]}>
                            {classItem.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    </View>
);

interface DayHeaderProps {
    day: DayOfWeek;
    date: Date;
    isToday: boolean;
    colors: any;
}

export const DayHeader: React.FC<DayHeaderProps> = ({
    day,
    date,
    isToday,
    colors
}) => (
    <View style={[
        styles.dayHeader,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
        isToday && { backgroundColor: colors.primary, borderColor: colors.primary }
    ]}>
        <Text style={[
            styles.dayName,
            { color: colors.text },
            isToday && { color: '#ffffff' }
        ]}>
            {DAYS_SHORT[day]}
        </Text>
        <Text style={[
            styles.dayDate,
            { color: colors.primary },
            isToday && { color: '#b6d509' }
        ]}>
            {date.getDate()}
        </Text>
    </View>
);

interface TimeSlotProps {
    entry: TimetableEntryWithDetails;
    onEdit?: (entry: TimetableEntryWithDetails) => void;
    onDelete?: (entry: TimetableEntryWithDetails) => void;
    canEdit: boolean;
    isFirst: boolean;
    isLast: boolean;
    colors: any;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
    entry,
    onEdit,
    onDelete,
    canEdit,
    isFirst,
    isLast,
    colors
}) => (
    <View style={[
        styles.timeSlot,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
        isFirst && styles.firstTimeSlot,
        isLast && styles.lastTimeSlot,
    ]}>
        <TouchableOpacity
            style={styles.timeSlotContent}
            onPress={() => canEdit && onEdit?.(entry)}
            disabled={!canEdit}
        >
            <View style={styles.timeSlotHeader}>
                <View style={styles.timeInfo}>
                    <Clock size={14} color={colors.primary} />
                    <Text style={[styles.timeText, { color: colors.primary }]}>
                        {entry.start_time} - {entry.end_time}
                    </Text>
                </View>
                <View style={styles.timeSlotActions}>
                    <View style={[styles.roomBadge, { backgroundColor: colors.secondary }]}>
                        <MapPin size={10} color="#274d71" />
                        <Text style={styles.roomText}>{entry.room_number}</Text>
                    </View>
                    {canEdit && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                onPress={() => onEdit?.(entry)}
                            >
                                <Edit3 size={12} color="#ffffff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.error }]}
                                onPress={() => onDelete?.(entry)}
                            >
                                <Trash2 size={12} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            <Text style={[styles.subjectText, { color: colors.text }]}>
                {entry.subject_name}
            </Text>

            <View style={styles.entryDetails}>
                {entry.teacher_name && (
                    <View style={styles.teacherInfo}>
                        <User size={12} color={colors.textSecondary} />
                        <Text style={[styles.teacherText, { color: colors.textSecondary }]}>
                            {entry.teacher_name}
                        </Text>
                    </View>
                )}
                {entry.class_name && (
                    <View style={styles.classInfo}>
                        <BookOpen size={12} color={colors.textSecondary} />
                        <Text style={[styles.classText, { color: colors.textSecondary }]}>
                            {entry.class_name}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    </View>
);

interface EmptyDayProps {
    colors: any;
}

export const EmptyDay: React.FC<EmptyDayProps> = ({ colors }) => (
    <View style={[
        styles.emptyDay,
        { backgroundColor: colors.cardBackground, borderColor: colors.border }
    ]}>
        <Calendar size={24} color={colors.textSecondary} />
        <Text style={[styles.emptyDayText, { color: colors.textSecondary }]}>
            No classes scheduled
        </Text>
    </View>
);

interface LoadingStateProps {
    colors: any;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ colors }) => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading timetable...
        </Text>
    </View>
);

interface ErrorStateProps {
    error: string;
    onRetry: () => void;
    colors: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, colors }) => (
    <View style={styles.errorContainer}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRetry}
        >
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
    </View>
);

interface OptionSelectorProps<T> {
    options: T[];
    selectedId?: string;
    onSelect: (id: string) => void;
    getLabel: (option: T) => string;
    getId: (option: T) => string;
    colors: any;
}

export function OptionSelector<T>({
    options,
    selectedId,
    onSelect,
    getLabel,
    getId,
    colors
}: OptionSelectorProps<T>) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsContainer}>
                {options.map((option) => {
                    const id = getId(option);
                    const isSelected = selectedId === id;
                    
                    return (
                        <TouchableOpacity
                            key={id}
                            style={[
                                styles.option,
                                { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                            ]}
                            onPress={() => onSelect(id)}
                        >
                            <Text style={[
                                styles.optionText,
                                { color: colors.text },
                                isSelected && { color: '#ffffff' },
                            ]}>
                                {getLabel(option)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}

interface ModalHeaderProps {
    title: string;
    onClose: () => void;
    colors: any;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, colors }) => (
    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 0,
    },
    searchContainer: {
        paddingHorizontal: 0,
        marginBottom: 20,
        flexDirection: "row",
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: "center",
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        flex: 1
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginLeft: 12,
    },
    addHeaderButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5
    },
    classFilter: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    classButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    classButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    classButtonText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    dayHeader: {
        width: 80,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
    },
    dayName: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
        textAlign: 'center',
    },
    dayDate: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    timeSlot: {
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    firstTimeSlot: {
        borderTopWidth: 3,
        borderTopColor: '#b6d509',
    },
    lastTimeSlot: {
        borderBottomWidth: 3,
        borderBottomColor: '#274d71',
    },
    timeSlotContent: {
        padding: 16,
    },
    timeSlotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        fontFamily: 'Inter-SemiBold',
        marginLeft: 6,
    },
    timeSlotActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    roomBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    roomText: {
        fontSize: 10,
        fontFamily: 'Inter-SemiBold',
        color: '#274d71',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 4,
    },
    actionButton: {
        width: 24,
        height: 24,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subjectText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
    },
    entryDetails: {
        gap: 4,
    },
    teacherInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    teacherText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    classInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    classText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    emptyDay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    emptyDayText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        marginTop: 8,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        marginVertical: 12,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    optionsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    option: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
    },
    optionText: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
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
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
});