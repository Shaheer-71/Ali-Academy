// components/TeacherAnalyticsView.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Dimensions, RefreshControl, Animated, Modal, TouchableWithoutFeedback,
} from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useTeacherAnalytics } from '@/src/hooks/useTeacherAnalytics';
import { useScreenAnimation } from '@/src/utils/animations';
import { Users, Award, ClipboardCheck, Sparkles, ChevronRight, Check } from 'lucide-react-native';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { TextSizes } from '@/src/styles/TextSizes';

const { width, height } = Dimensions.get('window');

interface TeacherAnalyticsViewProps {
    filterVisible: boolean;
    onFilterClose: () => void;
    onFilterChange: (isFiltered: boolean) => void;
}

export const TeacherAnalyticsView = ({ filterVisible, onFilterClose, onFilterChange }: TeacherAnalyticsViewProps) => {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const { studentPerformances, classAnalytics, classes, subjects, loading, error, refetch } = useTeacherAnalytics(profile?.id, selectedClass, selectedSubject);

    // Reset subject filter whenever class changes
    useEffect(() => {
        setSelectedSubject('all');
    }, [selectedClass]);

    // Inside modal: which step — 'class' or 'subject'
    const [filterStep, setFilterStep] = useState<'class' | 'subject'>('class');
    // Pending selections (committed only on Apply)
    const [pendingClass, setPendingClass] = useState('all');
    const [pendingSubject, setPendingSubject] = useState('all');

    // Sync pending state when modal opens
    useEffect(() => {
        if (filterVisible) {
            setPendingClass(selectedClass);
            setPendingSubject(selectedSubject);
            setFilterStep('class');
        }
    }, [filterVisible]);

    const handlePendingClassSelect = (id: string) => {
        setPendingClass(id);
        setPendingSubject('all');
        setFilterStep('subject');
    };

    const applyFilter = () => {
        setSelectedClass(pendingClass);
        setSelectedSubject(pendingSubject);
        onFilterChange(pendingClass !== 'all' || pendingSubject !== 'all');
        onFilterClose();
    };

    const resetFilter = () => {
        setPendingClass('all');
        setPendingSubject('all');
        setSelectedClass('all');
        setSelectedSubject('all');
        onFilterChange(false);
        onFilterClose();
    };

    const isFiltered = selectedClass !== 'all' || selectedSubject !== 'all';

    const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
    const closeErrorModal = () => setErrorModal({ visible: false, title: '', message: '' });

    const screenStyle = useScreenAnimation();

    const renderProgressBar = (percentage: number, color: string) => (
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
    );

    const renderPerformanceCard = (student: any) => (
        <View style={[styles.performanceCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.studentHeader}>
                <View style={[styles.studentAvatar, { backgroundColor: colors.primary }]}>
                    <Text allowFontScaling={false} style={styles.studentInitial}>
                        {student.full_name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.studentInfo}>
                    <Text allowFontScaling={false} style={[styles.studentName, { color: colors.text }]}>
                        {student.full_name}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.rollNumber, { color: colors.textSecondary }]}>
                        {student.roll_number} • {student.class_name}{student.subject_name ? ` • ${student.subject_name}` : ''}
                    </Text>
                </View>
                <View style={[styles.gradeContainer, { backgroundColor: colors.primary }]}>
                    <Text allowFontScaling={false} style={styles.gradeText}>{student.average_grade}%</Text>
                </View>
            </View>

            <View style={styles.metricsContainer}>
                <View style={styles.metric}>
                    <Text allowFontScaling={false} style={[styles.metricLabel, { color: colors.textSecondary }]}>Attendance</Text>
                    <View style={styles.metricBar}>
                        {renderProgressBar(student.attendance_rate, '#10B981')}
                        <Text allowFontScaling={false} style={[styles.metricValue, { color: colors.text }]}>{student.attendance_rate}%</Text>
                    </View>
                </View>
                <View style={styles.metric}>
                    <Text allowFontScaling={false} style={[styles.metricLabel, { color: colors.textSecondary }]}>Quizzes</Text>
                    <View style={styles.metricBar}>
                        {renderProgressBar((student.assignments_completed / student.total_assignments) * 100, colors.secondary)}
                        <Text allowFontScaling={false} style={[styles.metricValue, { color: colors.text }]}>
                            {student.assignments_completed}/{student.total_assignments}
                        </Text>
                    </View>
                </View>
                <View style={styles.metric}>
                    <Text allowFontScaling={false} style={[styles.metricLabel, { color: colors.textSecondary }]}>Overall Grade</Text>
                    <View style={styles.metricBar}>
                        {renderProgressBar(student.average_grade, colors.primary)}
                        <Text allowFontScaling={false} style={[styles.metricValue, { color: colors.text }]}>{student.average_grade}%</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    // ── Filter bottom sheet ──────────────────────────────────────────────────
    const renderFilterModal = () => {
        // subjects relevant to pending class selection
        const modalSubjects = pendingClass === 'all' ? subjects : subjects;

        return (
            <Modal
                visible={filterVisible}
                transparent
                animationType="fade"
                onRequestClose={onFilterClose}
            >
                <TouchableWithoutFeedback onPress={onFilterClose}>
                    <View style={styles.modalOverlay} />
                </TouchableWithoutFeedback>

                <View style={[styles.bottomSheet, { backgroundColor: colors.cardBackground }]}>
                    {/* Handle */}
                    <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

                    {/* Sheet header */}
                    <View style={styles.sheetHeader}>
                        {filterStep === 'subject' && (
                            <TouchableOpacity onPress={() => setFilterStep('class')} style={styles.backBtn}>
                                <ChevronRight size={20} color={colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
                            </TouchableOpacity>
                        )}
                        <Text allowFontScaling={false} style={[styles.sheetTitle, { color: colors.text }]}>
                            {filterStep === 'class' ? 'Select Class' : 'Select Subject'}
                        </Text>
                        {isFiltered && (
                            <TouchableOpacity onPress={resetFilter}>
                                <Text allowFontScaling={false} style={[styles.resetText, { color: '#EF4444' }]}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                        {filterStep === 'class' ? (
                            <>
                                {/* All Classes option */}
                                <TouchableOpacity
                                    style={[styles.sheetOption, { borderBottomColor: colors.border }]}
                                    onPress={() => handlePendingClassSelect('all')}
                                >
                                    <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>
                                        All Classes
                                    </Text>
                                    <View style={styles.sheetOptionRight}>
                                        {pendingClass === 'all' && <Check size={16} color={colors.primary} />}
                                        <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                                    </View>
                                </TouchableOpacity>
                                {classes.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.sheetOption, { borderBottomColor: colors.border }]}
                                        onPress={() => handlePendingClassSelect(c.id)}
                                    >
                                        <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>
                                            {c.name}
                                        </Text>
                                        <View style={styles.sheetOptionRight}>
                                            {pendingClass === c.id && <Check size={16} color={colors.primary} />}
                                            <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        ) : (
                            <>
                                {/* All Subjects option */}
                                <TouchableOpacity
                                    style={[styles.sheetOption, { borderBottomColor: colors.border }]}
                                    onPress={() => setPendingSubject('all')}
                                >
                                    <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>
                                        All Subjects
                                    </Text>
                                    {pendingSubject === 'all' && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {subjects.map((s) => (
                                    <TouchableOpacity
                                        key={s.id}
                                        style={[styles.sheetOption, { borderBottomColor: colors.border }]}
                                        onPress={() => setPendingSubject(s.id)}
                                    >
                                        <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>
                                            {s.name}
                                        </Text>
                                        {pendingSubject === s.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                    </ScrollView>

                    {/* Apply button */}
                    <TouchableOpacity
                        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                        onPress={applyFilter}
                    >
                        <Text allowFontScaling={false} style={styles.applyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    // ── Error state ──────────────────────────────────────────────────────────
    if (error && !loading) {
        const isNoClasses = error.includes('No classes assigned');
        return (
            <View style={[styles.noClassesCard, { backgroundColor: isNoClasses ? '#FFF7ED' : '#FEF2F2', borderColor: isNoClasses ? '#FB923C' : '#F87171' }]}>
                <View style={[styles.noClassesIconCircle, { backgroundColor: isNoClasses ? '#FB923C20' : '#EF444420' }]}>
                    <Sparkles size={28} color={isNoClasses ? '#FB923C' : '#EF4444'} />
                </View>
                <Text allowFontScaling={false} style={[styles.noClassesTitle, { color: isNoClasses ? '#9A3412' : '#7F1D1D' }]}>
                    {isNoClasses ? 'No Classes Assigned Yet' : 'Unable to Load Analytics'}
                </Text>
                <Text allowFontScaling={false} style={[styles.noClassesSubtext, { color: isNoClasses ? '#C2410C' : '#B91C1C' }]}>
                    {isNoClasses
                        ? "You haven't been assigned to any class or subject yet. Contact your administrator to get your classes set up."
                        : error}
                </Text>
                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: isNoClasses ? '#FB923C' : '#EF4444' }]}
                    onPress={refetch}
                >
                    <Text allowFontScaling={false} style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Skeleton ─────────────────────────────────────────────────────────────
    if (loading && classAnalytics.length === 0) {
        return (
            <Animated.View style={[styles.container, screenStyle, { backgroundColor: colors.background }]}>
                <View style={[styles.overviewContainer, { marginBottom: 16 }]}>
                    <View style={styles.overviewCards}>
                        <SkeletonBox width="31%" height={90} borderRadius={12} />
                        <SkeletonBox width="31%" height={90} borderRadius={12} />
                        <SkeletonBox width="31%" height={90} borderRadius={12} />
                    </View>
                </View>
                <View style={{ paddingHorizontal: 16 }}>
                    <SkeletonBox width={160} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <SkeletonBox width={240} height={130} borderRadius={12} />
                        <SkeletonBox width={240} height={130} borderRadius={12} />
                    </View>
                    <SkeletonBox width={140} height={18} borderRadius={6} style={{ marginTop: 24, marginBottom: 12 }} />
                    <SkeletonBox height={80} borderRadius={12} style={{ marginBottom: 8 }} />
                    <SkeletonBox height={80} borderRadius={12} />
                </View>
            </Animated.View>
        );
    }

    // ── Active filter label ───────────────────────────────────────────────────
    const activeClassName = selectedClass === 'all'
        ? null
        : classes.find(c => c.id === selectedClass)?.name;
    const activeSubjectName = selectedSubject === 'all'
        ? null
        : subjects.find(s => s.id === selectedSubject)?.name;

    const filterLabel = [activeClassName, activeSubjectName].filter(Boolean).join(' • ');

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <Animated.View style={[styles.container, screenStyle, { backgroundColor: colors.background }]}>
            <ErrorModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                onClose={closeErrorModal}
            />
            {renderFilterModal()}

            {/* Active filter label */}
            {filterLabel ? (
                <View style={styles.filterRow}>
                    <Text allowFontScaling={false} style={[styles.activeFilterLabel, { color: colors.textSecondary }]}>
                        {filterLabel}
                    </Text>
                </View>
            ) : null}

            {/* Overview Cards */}
            <View style={styles.overviewContainer}>
                <View style={styles.overviewCards}>
                    <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <View style={[styles.overviewIcon, { backgroundColor: '#10B98120' }]}>
                            <Users size={24} color="#10B981" />
                        </View>
                        <Text allowFontScaling={false} style={[styles.overviewValue, { color: colors.text }]}>
                            {classAnalytics.reduce((sum, c) => sum + c.total_students, 0)}
                        </Text>
                        <Text allowFontScaling={false} style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total Students</Text>
                    </View>

                    <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <View style={[styles.overviewIcon, { backgroundColor: `${colors.secondary}20` }]}>
                            <ClipboardCheck size={24} color={colors.secondary} />
                        </View>
                        <Text allowFontScaling={false} style={[styles.overviewValue, { color: colors.text }]}>
                            {Math.round(classAnalytics.reduce((sum, c) => sum + c.average_attendance, 0) / classAnalytics.length || 0)}%
                        </Text>
                        <Text allowFontScaling={false} style={[styles.overviewLabel, { color: colors.textSecondary }]}>Avg Attendance</Text>
                    </View>

                    <View style={[styles.overviewCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                        <View style={[styles.overviewIcon, { backgroundColor: `${colors.primary}20` }]}>
                            <Award size={24} color={colors.primary} />
                        </View>
                        <Text allowFontScaling={false} style={[styles.overviewValue, { color: colors.text }]}>
                            {Math.round(classAnalytics.reduce((sum, c) => sum + c.average_grade, 0) / classAnalytics.length || 0)}%
                        </Text>
                        <Text allowFontScaling={false} style={[styles.overviewLabel, { color: colors.textSecondary }]}>Avg Grade</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && classAnalytics.length > 0}
                        onRefresh={refetch}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Student Performance */}
                <View style={styles.section}>
                    <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Student Performance</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScrollContainer}
                    >
                        {studentPerformances.length === 0 ? (
                            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {loading ? '' : 'No student data for the selected filter.'}
                            </Text>
                        ) : (
                            studentPerformances.map((student) => (
                                <View key={student.id} style={styles.horizontalCardWrapper}>
                                    {renderPerformanceCard(student)}
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>

                {/* Class Comparison */}
                <View style={styles.section}>
                    <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.text }]}>Class Comparison</Text>
                    {classAnalytics.map((classData) => (
                        <View key={classData.class_id} style={[styles.classCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                            <View style={styles.classHeader}>
                                <Text allowFontScaling={false} style={[styles.className, { color: colors.text }]}>
                                    {classData.class_name}
                                </Text>
                                <View style={[styles.studentCount, { backgroundColor: colors.primary }]}>
                                    <Text allowFontScaling={false} style={styles.studentCountText}>
                                        {classData.total_students} students
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.classMetrics}>
                                <View style={styles.classMetric}>
                                    <Text allowFontScaling={false} style={[styles.classMetricValue, { color: colors.primary }]}>
                                        {classData.average_attendance}%
                                    </Text>
                                    <Text allowFontScaling={false} style={[styles.classMetricLabel, { color: colors.textSecondary }]}>Attendance</Text>
                                </View>
                                <View style={styles.classMetric}>
                                    <Text allowFontScaling={false} style={[styles.classMetricValue, { color: colors.secondary }]}>
                                        {classData.average_grade}%
                                    </Text>
                                    <Text allowFontScaling={false} style={[styles.classMetricLabel, { color: colors.textSecondary }]}>Avg Grade</Text>
                                </View>
                                <View style={styles.classMetric}>
                                    <Award size={16} color="#10B981" />
                                    <Text allowFontScaling={false} style={[styles.topPerformer, { color: colors.text }]}>
                                        {classData.top_performer}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterRow: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    activeFilterLabel: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    // ── Bottom sheet ────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 32,
        maxHeight: height * 0.6,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    backBtn: {
        marginRight: 8,
        padding: 2,
    },
    sheetTitle: {
        flex: 1,
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
    },
    resetText: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
    },
    sheetScroll: {
        maxHeight: height * 0.35,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sheetOptionText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        flex: 1,
    },
    sheetOptionRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    applyBtn: {
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    applyBtnText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
    // ── Overview ────────────────────────────────────────────────────
    overviewContainer: {
        paddingTop: 12,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    overviewCards: {
        flexDirection: 'row',
        gap: 8,
    },
    overviewCard: {
        width: '31%',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    overviewIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    overviewValue: {
        fontSize: TextSizes.statValue,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    overviewLabel: {
        fontSize: TextSizes.statLabel,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    // ── Scroll content ──────────────────────────────────────────────
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        paddingVertical: 16,
    },
    horizontalScrollContainer: {
        paddingRight: 16,
    },
    horizontalCardWrapper: {
        marginRight: 12,
        width: width * 0.75,
    },
    performanceCard: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        elevation: 1,
        width: '100%',
    },
    studentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    studentInitial: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        color: '#fff',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: TextSizes.bannerTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    rollNumber: {
        fontSize: TextSizes.bannerSubtitle,
        fontFamily: 'Inter-Regular',
    },
    gradeContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    gradeText: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
        color: '#fff',
    },
    metricsContainer: {
        gap: 12,
    },
    metric: {
        gap: 4,
    },
    metricLabel: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
    },
    metricBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBarContainer: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    metricValue: {
        fontSize: TextSizes.statValue,
        fontFamily: 'Inter-SemiBold',
        minWidth: 40,
        textAlign: 'right',
    },
    classCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        elevation: 1,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    className: {
        fontSize: TextSizes.bannerTitle,
        fontFamily: 'Inter-SemiBold',
    },
    studentCount: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    studentCountText: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        color: '#fff',
    },
    classMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    classMetric: {
        alignItems: 'center',
        flex: 1,
    },
    classMetricValue: {
        fontSize: TextSizes.statValue,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    classMetricLabel: {
        fontSize: TextSizes.statLabel,
        fontFamily: 'Inter-Regular',
    },
    topPerformer: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginTop: 2,
        textAlign: 'center',
    },
    // ── Error card ──────────────────────────────────────────────────
    noClassesCard: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
    },
    noClassesIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    noClassesTitle: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
        textAlign: 'center',
    },
    noClassesSubtext: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 14,
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-SemiBold',
    },
});
