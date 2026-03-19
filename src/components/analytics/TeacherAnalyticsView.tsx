// components/TeacherAnalyticsView.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Dimensions, RefreshControl, Animated, Modal,
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
    isSuperAdmin?: boolean;
}

export const TeacherAnalyticsView = ({ filterVisible, onFilterClose, onFilterChange, isSuperAdmin = false }: TeacherAnalyticsViewProps) => {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [selectedClass, setSelectedClass] = useState('all');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const { studentPerformances, classAnalytics, classes, subjects, subjectsByClass, loading, error, refetch } = useTeacherAnalytics(profile?.id, selectedClass, selectedSubject, isSuperAdmin);

    // Reset subject filter whenever class changes
    useEffect(() => {
        setSelectedSubject('all');
    }, [selectedClass]);

    // Inside modal: which step — 'class' or 'subject'
    const [expandedSection, setExpandedSection] = useState<'class' | 'subject' | null>(null);
    const [pendingClass, setPendingClass] = useState('all');
    const [pendingSubject, setPendingSubject] = useState('all');

    useEffect(() => {
        if (filterVisible) {
            setPendingClass(selectedClass);
            setPendingSubject(selectedSubject);
            setExpandedSection(null);
        }
    }, [filterVisible]);

    const toggleSection = (section: 'class' | 'subject') => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const handlePendingClassSelect = (id: string) => {
        setPendingClass(id);
        setPendingSubject('all');
        setExpandedSection(null);
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
        const selectedClassName = pendingClass === 'all' ? 'All Classes' : classes.find(c => c.id === pendingClass)?.name ?? 'All Classes';
        // subjects available for the currently pending class selection
        const pendingSubjects = pendingClass === 'all' ? subjects : (subjectsByClass[pendingClass] ?? []);
        const selectedSubjectName = pendingSubject === 'all' ? 'All Subjects' : pendingSubjects.find(s => s.id === pendingSubject)?.name ?? subjects.find(s => s.id === pendingSubject)?.name ?? 'All Subjects';

        return (
            <Modal visible={filterVisible} transparent animationType="fade" onRequestClose={onFilterClose} statusBarTranslucent={true}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onFilterClose} />
                <View style={[styles.bottomSheet, { backgroundColor: colors.cardBackground }]}>
                    <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

                    <View style={styles.sheetHeader}>
                        <Text allowFontScaling={false} style={[styles.sheetTitle, { color: colors.text }]}>Filter Analytics</Text>
                        {isFiltered && (
                            <TouchableOpacity onPress={resetFilter}>
                                <Text allowFontScaling={false} style={[styles.resetText, { color: '#EF4444' }]}>Reset</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                        {/* Class accordion */}
                        <TouchableOpacity style={[styles.accordionHeader, { borderColor: colors.border }]} onPress={() => toggleSection('class')}>
                            <Text allowFontScaling={false} style={[styles.accordionLabel, { color: colors.textSecondary }]}>Class</Text>
                            <View style={styles.accordionRight}>
                                <Text allowFontScaling={false} style={[styles.accordionValue, { color: colors.text }]}>{selectedClassName}</Text>
                                <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'class' ? '270deg' : '90deg' }] }} />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'class' && (
                            <View style={[styles.accordionBody, { borderColor: colors.border }]}>
                                <TouchableOpacity style={[styles.sheetOption, { borderBottomColor: colors.border }]} onPress={() => handlePendingClassSelect('all')}>
                                    <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>All Classes</Text>
                                    {pendingClass === 'all' && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {[...classes].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                    <TouchableOpacity key={c.id} style={[styles.sheetOption, { borderBottomColor: colors.border }]} onPress={() => handlePendingClassSelect(c.id)}>
                                        <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>{c.name}</Text>
                                        {pendingClass === c.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Subject accordion */}
                        <TouchableOpacity style={[styles.accordionHeader, { borderColor: colors.border }]} onPress={() => toggleSection('subject')}>
                            <Text allowFontScaling={false} style={[styles.accordionLabel, { color: colors.textSecondary }]}>Subject</Text>
                            <View style={styles.accordionRight}>
                                <Text allowFontScaling={false} style={[styles.accordionValue, { color: colors.text }]}>{selectedSubjectName}</Text>
                                <ChevronRight size={16} color={colors.textSecondary} style={{ marginLeft: 6, transform: [{ rotate: expandedSection === 'subject' ? '270deg' : '90deg' }] }} />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'subject' && (
                            <View style={[styles.accordionBody, { borderColor: colors.border }]}>
                                <TouchableOpacity style={[styles.sheetOption, { borderBottomColor: colors.border }]} onPress={() => { setPendingSubject('all'); setExpandedSection(null); }}>
                                    <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>All Subjects</Text>
                                    {pendingSubject === 'all' && <Check size={16} color={colors.primary} />}
                                </TouchableOpacity>
                                {pendingSubjects.map(s => (
                                    <TouchableOpacity key={s.id} style={[styles.sheetOption, { borderBottomColor: colors.border }]} onPress={() => { setPendingSubject(s.id); setExpandedSection(null); }}>
                                        <Text allowFontScaling={false} style={[styles.sheetOptionText, { color: colors.text }]}>{s.name}</Text>
                                        {pendingSubject === s.id && <Check size={16} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={applyFilter}>
                        <Text allowFontScaling={false} style={styles.applyBtnText}>Apply Filter</Text>
                    </TouchableOpacity>
                </View>
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
    // ── Bottom sheet ────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 32,
        height: height * 0.45,
        overflow: 'hidden',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
    },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    sheetTitle: { flex: 1, fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
    resetText: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium' },
    sheetScroll: { flexGrow: 0 },
    accordionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 10, borderWidth: 1,
    },
    accordionLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', flex: 1 },
    accordionValue: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-SemiBold' },
    accordionRight: { flexDirection: 'row', alignItems: 'center' },
    accordionBody: { marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
    sheetOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sheetOptionText: { fontSize: TextSizes.medium, fontFamily: 'Inter-Regular', flex: 1 },
    applyBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    applyBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold', color: '#ffffff' },
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
