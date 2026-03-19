// screens/NotificationScreen.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TouchableWithoutFeedback,
    TextInput,
    Modal,
    RefreshControl,
    ActivityIndicator,
    Platform,
    Dimensions,
    Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useDialog } from '@/src/contexts/DialogContext';
import {
    Plus,
    Send,
    Users,
    User,
    Globe,
    Clock,
    AlertCircle,
    X,
    Check,
    ChevronDown,
    ChevronUp,
    Calendar,
    Bell,
    BookOpen,
    Megaphone,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { SkeletonBox } from '@/src/components/common/Skeleton';
import { modalShell, modalForm } from '@/src/styles/creationModalStyles';
import { useNotificationForm } from '../hooks/useNotificationForm';
import { useNotificationHistory } from '../hooks/useNotificationHistory';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import { useScreenAnimation } from '@/src/utils/animations';

const { height } = Dimensions.get('window');
const screenHeight = Dimensions.get('screen').height;


interface NotificationFormData {
    title: string;
    message: string;
    type: 'announcement' | 'assignment_added' | 'event' | 'reminder' | 'other';
    priority: 'low' | 'medium' | 'high';
    target_type: 'all' | 'students' | 'individual';
    target_id: string;
    entity_type: string;
    entity_id: string;
}

const NOTIFICATION_TEMPLATES = [
    { label: 'Fee Due',          title: 'Fee Due',                  message: 'Your monthly fee is due. Please clear your dues at the earliest.',                                                              type: 'reminder'         as const },
    { label: 'Payment Received', title: 'Payment Confirmed',        message: 'Your fee payment has been received successfully. Thank you.',                                                                   type: 'announcement'     as const },
    { label: 'New Assignment',   title: 'New Assignment Posted',    message: 'A new assignment has been posted. Please check the diary section and submit before the deadline.',                             type: 'assignment_added' as const },
    { label: 'Assignment Due',   title: 'Assignment Due Tomorrow',  message: 'Your assignment is due tomorrow. Make sure to submit on time.',                                                                 type: 'reminder'         as const },
    { label: 'New Lecture',      title: 'New Lecture Available',    message: 'A new lecture has been uploaded. Check the lectures section to view and download the material.',                               type: 'announcement'     as const },
    { label: 'Timetable Change', title: 'Timetable Updated',        message: 'The class timetable has been updated. Check the timetable section for the revised schedule.',                                  type: 'announcement'     as const },
    { label: 'Exam Scheduled',   title: 'Exam Notice',              message: 'An exam has been scheduled. Please check the exams section for the date, time, and syllabus.',                                 type: 'event'            as const },
    { label: 'Results Out',      title: 'Results Published',        message: 'Exam results are now available. Check the exams section to view your score.',                                                  type: 'announcement'     as const },
    { label: 'Attendance',       title: 'Attendance Marked',        message: 'Your attendance has been recorded for today. Contact your teacher if there is a discrepancy.',                                 type: 'reminder'         as const },
    { label: 'Academy Notice',   title: 'Academy Notice',           message: 'An important notice has been issued by the administration. Please review at your earliest convenience.',                       type: 'announcement'     as const },
];

const AUDIENCE_OPTIONS = [
    { value: 'all' as const, label: 'All', icon: Globe },
    { value: 'students' as const, label: 'Students', icon: Users },
    { value: 'teachers' as const, label: 'Teachers', icon: User },
];

const DATE_RANGE_OPTIONS = [
    { value: 'today' as const, label: 'Today' },
    { value: 'week' as const, label: 'Last 7 Days' },
    { value: 'month' as const, label: 'Last 30 Days' },
    { value: 'custom' as const, label: 'Custom' },
];

export default function NotificationScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const { showError } = useDialog();
    const [modalVisible, setModalVisible] = useState(false);
    const [allProfiles, setAllProfiles] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
    const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
    const [individualDropdownOpen, setIndividualDropdownOpen] = useState(false);
    const [audience, setAudience] = useState<'all' | 'students' | 'teachers'>('all');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [startDate, setStartDate] = useState<Date>(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; });
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const screenStyle = useScreenAnimation();

    const {
        formData,
        setFormData,
        sending,
        sendNotification,
        resetForm,
    } = useNotificationForm(profile);

    const {
        notifications,
        loading,
        fetchNotifications,
    } = useNotificationHistory(profile);

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const show = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            e => setKeyboardHeight(e.endCoordinates.height)
        );
        const hide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );
        return () => { show.remove(); hide.remove(); };
    }, []);

    // Fetch all profiles for individual selection
    useEffect(() => {
        if (formData.target_type === 'individual' && allProfiles.length === 0) {
            fetchAllProfiles();
        }
    }, [formData.target_type]);

    const fetchAllProfiles = async () => {
        try {
            const { supabase } = require('@/src/lib/supabase');
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, role')
                .order('full_name');
            if (error) throw error;
            setAllProfiles(data || []);
        } catch (error) {
            console.warn('Error fetching profiles:', error);
        }
    };

    const roleLabel = (role: string) => {
        switch (role) {
            case 'student':    return 'Student';
            case 'teacher':    return 'Teacher';
            case 'admin':      return 'Admin';
            case 'superadmin': return 'Super Admin';
            default:           return role;
        }
    };

    const handleSendNotification = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            showError('Error', 'Please fill in title and message');
            return;
        }

        if (formData.target_type === 'individual' && !formData.target_id) {
            showError('Error', 'Please select a recipient');
            return;
        }

        const success = await sendNotification();
        if (success) {
            setModalVisible(false);
            fetchNotifications();
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    };


    if (profile?.role !== 'teacher' && profile?.role !== 'admin' && profile?.role !== 'superadmin') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <TopSections />
                <View style={styles.restrictedContainer}>
                    <AlertCircle size={48} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[styles.restrictedText, { color: colors.text }]}>
                        Only teachers and admins can create notifications
                    </Text>
                </View>
            </SafeAreaView>
        );
    }


    const handleDateRangeChange = (range: typeof dateRange) => {
        const now = new Date();
        setDateRange(range);
        if (range === 'today') { setStartDate(now); setEndDate(now); }
        else if (range === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); setStartDate(w); setEndDate(now); }
        else if (range === 'month') { const m = new Date(now); m.setMonth(now.getMonth() - 1); setStartDate(m); setEndDate(now); }
    };

    const handleResetFilters = () => {
        setAudience('all');
        setDateRange('month');
        const m = new Date(); m.setMonth(m.getMonth() - 1);
        setStartDate(m);
        setEndDate(new Date());
    };

    const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const filteredNotifications = useMemo(() => notifications.filter(n => {
        if (audience === 'students' && n.target_type !== 'students' && n.target_type !== 'individual') return false;
        if (audience === 'teachers' && n.target_type !== 'teachers') return false;
        if (n.created_at) {
            const created = new Date(n.created_at);
            const start = new Date(startDate); start.setHours(0, 0, 0, 0);
            const end = new Date(endDate); end.setHours(23, 59, 59, 999);
            if (created < start || created > end) return false;
        }
        return true;
    }), [notifications, audience, startDate, endDate]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
            <TopSections onFilterPress={() => setFilterVisible(true)} />

            <Animated.View style={[{ flex: 1 }, screenStyle]}>

                {/* Notifications List */}
                <ScrollView
                    style={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                        />
                    }
                >
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                <View style={styles.skeletonRow}>
                                    <SkeletonBox width={40} height={40} borderRadius={8} />
                                    <View style={{ flex: 1, gap: 6 }}>
                                        <SkeletonBox width="70%" height={13} borderRadius={6} />
                                        <SkeletonBox width="50%" height={11} borderRadius={5} />
                                        <SkeletonBox width="40%" height={11} borderRadius={5} />
                                    </View>
                                </View>
                                <SkeletonBox width="90%" height={11} borderRadius={5} style={{ marginTop: 4 }} />
                                <SkeletonBox width="60%" height={11} borderRadius={5} style={{ marginTop: 6 }} />
                            </View>
                        ))
                    ) : notifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Send size={48} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>
                                No notifications sent yet
                            </Text>
                            <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Create your first notification to get started
                            </Text>
                        </View>
                    ) : filteredNotifications.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Send size={48} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.emptyText, { color: colors.text }]}>
                                No notifications found
                            </Text>
                            <Text allowFontScaling={false} style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                                Try adjusting your filters
                            </Text>
                        </View>
                    ) : (
                        filteredNotifications.map((notif) => (
                            <NotificationCard
                                key={notif.id}
                                notification={notif}
                                colors={colors}
                                onPress={() => setSelectedNotification(notif)}
                            />
                        ))
                    )}
                </ScrollView>

                {/* Notification Detail Modal */}
                {selectedNotification && (
                    <NotificationDetailModal
                        notification={selectedNotification}
                        colors={colors}
                        onClose={() => setSelectedNotification(null)}
                    />
                )}

                {/* Filter Modal */}
                <Modal
                    visible={filterVisible}
                    transparent
                    statusBarTranslucent
                    animationType="fade"
                    onRequestClose={() => setFilterVisible(false)}
                >
                    <View style={styles.overlay}>
                        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setFilterVisible(false)} />

                    <View style={[styles.sheet, { backgroundColor: colors.cardBackground }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

                        {/* Create Notification action button */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: colors.primary }]}
                                onPress={() => { setFilterVisible(false); resetForm(); setModalVisible(true); }}
                            >
                                <Plus size={15} color={colors.primary} />
                                <Text allowFontScaling={false} style={[styles.actionBtnText, { color: colors.primary }]}>Create Notification</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Header */}
                        <View style={styles.sheetHeader}>
                            <Text allowFontScaling={false} style={[styles.sheetTitle, { color: colors.text }]}>Filter</Text>
                            <TouchableOpacity onPress={handleResetFilters}>
                                <Text allowFontScaling={false} style={[styles.resetText, { color: '#EF4444' }]}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                            {/* Date Range */}
                            <Text allowFontScaling={false} style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date Range</Text>
                            <View style={styles.chipRow}>
                                {DATE_RANGE_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.chip, { borderColor: colors.border },
                                            dateRange === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                        onPress={() => handleDateRangeChange(opt.value)}
                                    >
                                        <Text allowFontScaling={false} style={[styles.chipText, { color: dateRange === opt.value ? '#fff' : colors.text }]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Custom date pickers */}
                            {dateRange === 'custom' && (
                                <View style={[styles.customDateBox, { borderColor: colors.border }]}>
                                    <TouchableOpacity style={styles.dateInputRow} onPress={() => setShowStartPicker(true)}>
                                        <Text allowFontScaling={false} style={[styles.dateInputLabel, { color: colors.textSecondary }]}>From</Text>
                                        <Text allowFontScaling={false} style={[styles.dateInputValue, { color: colors.text }]}>{fmtDate(startDate)}</Text>
                                        <Calendar size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <View style={[styles.dateInputDivider, { backgroundColor: colors.border }]} />
                                    <TouchableOpacity style={styles.dateInputRow} onPress={() => setShowEndPicker(true)}>
                                        <Text allowFontScaling={false} style={[styles.dateInputLabel, { color: colors.textSecondary }]}>To</Text>
                                        <Text allowFontScaling={false} style={[styles.dateInputValue, { color: colors.text }]}>{fmtDate(endDate)}</Text>
                                        <Calendar size={14} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Audience */}
                            <Text allowFontScaling={false} style={[styles.fieldLabel, { color: colors.textSecondary }]}>Audience</Text>
                            <View style={styles.chipRow}>
                                {AUDIENCE_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.chip, { borderColor: colors.border },
                                            audience === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                        onPress={() => setAudience(opt.value)}
                                    >
                                        <opt.icon size={13} color={audience === opt.value ? '#fff' : colors.text} />
                                        <Text allowFontScaling={false} style={[styles.chipText, { color: audience === opt.value ? '#fff' : colors.text }]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setFilterVisible(false)}
                        >
                            <Text allowFontScaling={false} style={styles.applyBtnText}>Apply Filter</Text>
                        </TouchableOpacity>
                    </View>
                    </View>

                    {/* iOS date pickers as nested modals */}
                    {showStartPicker && Platform.OS === 'ios' && (
                        <Modal transparent animationType="fade" onRequestClose={() => setShowStartPicker(false)}>
                            <TouchableWithoutFeedback onPress={() => setShowStartPicker(false)}>
                                <View style={styles.overlay} />
                            </TouchableWithoutFeedback>
                            <View style={[styles.pickerSheet, { backgroundColor: colors.cardBackground }]}>
                                <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                                    <Text allowFontScaling={false} style={[styles.pickerTitle, { color: colors.text }]}>From Date</Text>
                                    <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                                        <Text allowFontScaling={false} style={[styles.pickerDone, { color: colors.primary }]}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker value={startDate} mode="date" display="spinner" maximumDate={endDate}
                                    onChange={(_, d) => { if (d) setStartDate(d); }} />
                            </View>
                        </Modal>
                    )}
                    {showEndPicker && Platform.OS === 'ios' && (
                        <Modal transparent animationType="fade" onRequestClose={() => setShowEndPicker(false)}>
                            <TouchableWithoutFeedback onPress={() => setShowEndPicker(false)}>
                                <View style={styles.overlay} />
                            </TouchableWithoutFeedback>
                            <View style={[styles.pickerSheet, { backgroundColor: colors.cardBackground }]}>
                                <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                                    <Text allowFontScaling={false} style={[styles.pickerTitle, { color: colors.text }]}>To Date</Text>
                                    <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                                        <Text allowFontScaling={false} style={[styles.pickerDone, { color: colors.primary }]}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker value={endDate} mode="date" display="spinner" minimumDate={startDate} maximumDate={new Date()}
                                    onChange={(_, d) => { if (d) setEndDate(d); }} />
                            </View>
                        </Modal>
                    )}
                </Modal>

                {/* Android date pickers — outside modal */}
                {showStartPicker && Platform.OS === 'android' && (
                    <DateTimePicker value={startDate} mode="date" display="calendar" maximumDate={endDate}
                        onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }} />
                )}
                {showEndPicker && Platform.OS === 'android' && (
                    <DateTimePicker value={endDate} mode="date" display="calendar" minimumDate={startDate} maximumDate={new Date()}
                        onChange={(_, d) => { setShowEndPicker(false); if (d) setEndDate(d); }} />
                )}

                {/* Create Notification Modal */}
                <Modal
                    visible={modalVisible}
                    transparent
                    animationType="fade"
                    statusBarTranslucent
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                            <View style={{ flex: 1 }} />
                        </TouchableWithoutFeedback>
                        <View style={[modalShell.sheet, { backgroundColor: colors.background, marginBottom: keyboardHeight, height: Math.min(height * 0.75, height - keyboardHeight) }]}>

                            {/* Header */}
                            <View style={[modalShell.header, { borderBottomColor: colors.border }]}>
                                <Text allowFontScaling={false} style={[modalShell.title, { color: colors.text }]}>
                                    Create Notification
                                </Text>
                                <TouchableOpacity style={modalShell.closeBtn} onPress={() => setModalVisible(false)}>
                                    <X size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={modalShell.scroll}
                                keyboardShouldPersistTaps="handled"
                                automaticallyAdjustKeyboardInsets
                                contentContainerStyle={modalShell.scrollContent}
                            >
                                {/* Quick Templates */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Quick Templates</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, flexDirection: 'row' }}>
                                        {NOTIFICATION_TEMPLATES.map((t, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[styles.templateChip, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                                                onPress={() => setFormData({ ...formData, title: t.title, message: t.message, type: t.type })}
                                            >
                                                <Text allowFontScaling={false} style={[styles.templateChipText, { color: colors.text }]}>{t.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Title */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Title *</Text>
                                    <TextInput
                                        style={[modalForm.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Notification title"
                                        placeholderTextColor={colors.textSecondary}
                                        value={formData.title}
                                        onChangeText={t => setFormData({ ...formData, title: t })}
                                        maxLength={100}
                                    />
                                </View>

                                {/* Message */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Message *</Text>
                                    <TextInput
                                        style={[modalForm.textArea, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
                                        placeholder="Write your notification message..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={formData.message}
                                        onChangeText={t => setFormData({ ...formData, message: t })}
                                        multiline
                                        numberOfLines={4}
                                        maxLength={500}
                                    />
                                </View>

                                {/* Type — dropdown */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Type</Text>
                                    <TouchableOpacity
                                        style={[modalForm.pickerRow, { backgroundColor: colors.cardBackground, borderColor: typeDropdownOpen ? colors.primary : colors.border }]}
                                        onPress={() => { setTypeDropdownOpen(o => !o); setPriorityDropdownOpen(false); setIndividualDropdownOpen(false); }}
                                    >
                                        <Text allowFontScaling={false} style={[modalForm.pickerValue, { color: colors.text }]}>
                                            {({ announcement: 'Announcement', assignment_added: 'Assignment', event: 'Event', reminder: 'Reminder', other: 'Other' } as any)[formData.type] || 'Select type'}
                                        </Text>
                                        {typeDropdownOpen ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
                                    </TouchableOpacity>
                                    {typeDropdownOpen && (
                                        <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 250 }}>
                                                {[
                                                    { value: 'announcement', label: 'Announcement' },
                                                    { value: 'assignment_added', label: 'Assignment' },
                                                    { value: 'event', label: 'Event' },
                                                    { value: 'reminder', label: 'Reminder' },
                                                    { value: 'other', label: 'Other' },
                                                ].map(opt => (
                                                    <TouchableOpacity
                                                        key={opt.value}
                                                        style={[modalForm.dropdownOption, { borderBottomColor: colors.border, backgroundColor: formData.type === opt.value ? colors.primary + '18' : 'transparent' }]}
                                                        onPress={() => { setFormData({ ...formData, type: opt.value as any }); setTypeDropdownOpen(false); }}
                                                    >
                                                        <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: colors.text }]}>{opt.label}</Text>
                                                        {formData.type === opt.value && <Check size={16} color={colors.primary} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>

                                {/* Priority — dropdown */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Priority</Text>
                                    <TouchableOpacity
                                        style={[modalForm.pickerRow, { backgroundColor: colors.cardBackground, borderColor: priorityDropdownOpen ? colors.primary : colors.border }]}
                                        onPress={() => { setPriorityDropdownOpen(o => !o); setTypeDropdownOpen(false); setIndividualDropdownOpen(false); }}
                                    >
                                        <Text allowFontScaling={false} style={[modalForm.pickerValue, { color: colors.text }]}>
                                            {({ low: 'Low', medium: 'Medium', high: 'High' } as any)[formData.priority] || 'Select priority'}
                                        </Text>
                                        {priorityDropdownOpen ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
                                    </TouchableOpacity>
                                    {priorityDropdownOpen && (
                                        <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 250 }}>
                                                {[
                                                    { value: 'low', label: 'Low', color: '#10B981' },
                                                    { value: 'medium', label: 'Medium', color: '#F59E0B' },
                                                    { value: 'high', label: 'High', color: '#EF4444' },
                                                ].map(opt => (
                                                    <TouchableOpacity
                                                        key={opt.value}
                                                        style={[modalForm.dropdownOption, { borderBottomColor: colors.border, backgroundColor: formData.priority === opt.value ? colors.primary + '18' : 'transparent' }]}
                                                        onPress={() => { setFormData({ ...formData, priority: opt.value as any }); setPriorityDropdownOpen(false); }}
                                                    >
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: opt.color }} />
                                                            <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: colors.text }]}>{opt.label}</Text>
                                                        </View>
                                                        {formData.priority === opt.value && <Check size={16} color={colors.primary} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>

                                {/* Send To */}
                                <View style={modalForm.group}>
                                    <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Send To *</Text>
                                    <View style={modalForm.chipRow}>
                                        {[
                                            { value: 'all', label: 'All Users', Icon: Globe },
                                            { value: 'students', label: 'All Students', Icon: Users },
                                            { value: 'individual', label: 'Individual', Icon: User },
                                        ].map(({ value, label, Icon }) => (
                                            <TouchableOpacity
                                                key={value}
                                                style={[
                                                    modalForm.chip,
                                                    { borderColor: colors.border, backgroundColor: colors.cardBackground, flexDirection: 'row', alignItems: 'center', gap: 6 },
                                                    formData.target_type === value && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                ]}
                                                onPress={() => { setFormData({ ...formData, target_type: value as any, target_id: '' }); setIndividualDropdownOpen(false); }}
                                            >
                                                <Icon size={15} color={formData.target_type === value ? '#fff' : colors.primary} />
                                                <Text allowFontScaling={false} style={[modalForm.chipText, { color: formData.target_type === value ? '#fff' : colors.text }]}>
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Individual — dropdown with all profiles + role */}
                                {formData.target_type === 'individual' && (
                                    <View style={modalForm.group}>
                                        <Text allowFontScaling={false} style={[modalForm.label, { color: colors.text }]}>Select Recipient *</Text>
                                        <TouchableOpacity
                                            style={[modalForm.pickerRow, { backgroundColor: colors.cardBackground, borderColor: individualDropdownOpen ? colors.primary : colors.border }]}
                                            onPress={() => { setIndividualDropdownOpen(o => !o); setTypeDropdownOpen(false); setPriorityDropdownOpen(false); }}
                                        >
                                            <Text allowFontScaling={false} style={[modalForm.pickerValue, { color: formData.target_id ? colors.text : colors.textSecondary }]}>
                                                {formData.target_id
                                                    ? (() => { const p = allProfiles.find(p => p.id === formData.target_id); return p ? `${p.full_name} (${roleLabel(p.role)})` : 'Selected'; })()
                                                    : 'Tap to select a person'}
                                            </Text>
                                            {individualDropdownOpen ? <ChevronUp size={18} color={colors.textSecondary} /> : <ChevronDown size={18} color={colors.textSecondary} />}
                                        </TouchableOpacity>
                                        {individualDropdownOpen && (
                                            <View style={[modalForm.dropdown, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                                                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 250 }}>
                                                    {allProfiles.length === 0 ? (
                                                        <View style={modalForm.dropdownEmptyOption}>
                                                            <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: colors.textSecondary }]}>Loading...</Text>
                                                        </View>
                                                    ) : allProfiles.map(p => (
                                                        <TouchableOpacity
                                                            key={p.id}
                                                            style={[modalForm.dropdownOption, { borderBottomColor: colors.border, backgroundColor: formData.target_id === p.id ? colors.primary + '18' : 'transparent' }]}
                                                            onPress={() => { setFormData({ ...formData, target_id: p.id }); setIndividualDropdownOpen(false); }}
                                                        >
                                                            <View style={{ flex: 1 }}>
                                                                <Text allowFontScaling={false} style={[modalForm.dropdownOptionText, { color: colors.text }]}>{p.full_name}</Text>
                                                                <Text allowFontScaling={false} style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 1 }}>
                                                                    {roleLabel(p.role)}
                                                                </Text>
                                                            </View>
                                                            {formData.target_id === p.id && <Check size={16} color={colors.primary} />}
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Submit */}
                                <TouchableOpacity
                                    style={[modalForm.submitBtn, { backgroundColor: colors.primary }, sending && { opacity: 0.6 }]}
                                    onPress={handleSendNotification}
                                    disabled={sending}
                                >
                                    {sending ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text allowFontScaling={false} style={modalForm.submitText}>Send Notification</Text>
                                    )}
                                </TouchableOpacity>

                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </Animated.View>
        </SafeAreaView>
    );
}

// Notification Card Component
const NotificationCard = ({ notification, colors, onPress }: any) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':   return '#EF4444';
            case 'medium': return '#F59E0B';
            case 'low':    return '#10B981';
            default:       return colors.textSecondary;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'assignment_added': return BookOpen;
            case 'event':           return Calendar;
            case 'reminder':        return Clock;
            case 'announcement':    return Megaphone;
            default:                return Bell;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'assignment_added': return '#6366F1';
            case 'event':           return '#0EA5E9';
            case 'reminder':        return '#F59E0B';
            case 'announcement':    return colors.primary;
            default:                return colors.primary;
        }
    };

    const getTargetLabel = (targetType: string) => {
        switch (targetType) {
            case 'all':        return 'All Users';
            case 'students':   return 'All Students';
            case 'individual': return 'Individual';
            default:           return targetType;
        }
    };

    const getTargetIcon = (targetType: string) => {
        switch (targetType) {
            case 'all':      return Globe;
            case 'students': return Users;
            default:         return User;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const TypeIcon = getTypeIcon(notification.type);
    const TargetIcon = getTargetIcon(notification.target_type);
    const typeColor = getTypeColor(notification.type);
    const priorityColor = getPriorityColor(notification.priority);

    return (
        <TouchableOpacity
            style={[styles.notificationCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                {/* Icon box */}
                <View style={[styles.cardIconBox, { backgroundColor: typeColor }]}>
                    <TypeIcon size={20} color="#fff" />
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                    <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {notification.title}
                    </Text>
                    <View style={styles.cardMetaRow}>
                        <View style={styles.cardMetaItem}>
                            <TargetIcon size={12} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.cardMetaText, { color: colors.textSecondary }]}>
                                {getTargetLabel(notification.target_type)}
                            </Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                            <Text allowFontScaling={false} style={[styles.priorityBadgeText, { color: priorityColor }]}>
                                {notification.priority?.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardByDateRow}>
                        <Text allowFontScaling={false} style={[styles.cardTypeText, { color: colors.textSecondary }]}>
                            {notification.type?.replace('_', ' ')}
                        </Text>
                        <View style={styles.cardMetaItem}>
                            <Calendar size={11} color={colors.textSecondary} />
                            <Text allowFontScaling={false} style={[styles.cardMetaText, { color: colors.textSecondary }]}>
                                {formatDate(notification.created_at)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Message preview */}
            <Text
                allowFontScaling={false}
                style={[styles.cardMessage, { color: colors.textSecondary }]}
                numberOfLines={2}
            >
                {notification.message}
            </Text>
        </TouchableOpacity>
    );
};


// ── Notification Detail Modal ─────────────────────────────────────────────────
const NotificationDetailModal = ({ notification, colors, onClose }: any) => {
    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high':   return '#EF4444';
            case 'medium': return '#F59E0B';
            case 'low':    return '#10B981';
            default:       return colors.textSecondary;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'assignment_added': return BookOpen;
            case 'event':           return Calendar;
            case 'reminder':        return Clock;
            case 'announcement':    return Megaphone;
            default:                return Bell;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'assignment_added': return '#6366F1';
            case 'event':           return '#0EA5E9';
            case 'reminder':        return '#F59E0B';
            case 'announcement':    return colors.primary;
            default:                return colors.primary;
        }
    };

    const getTargetLabel = (t: string) => {
        switch (t) {
            case 'all':        return 'All Users';
            case 'students':   return 'All Students';
            case 'individual': return 'Individual';
            default:           return t;
        }
    };

    const getTargetIcon = (t: string) => {
        switch (t) {
            case 'all':      return Globe;
            case 'students': return Users;
            default:         return User;
        }
    };

    const formatDate = (s: string) =>
        new Date(s).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit',
        });

    const TypeIcon = getTypeIcon(notification.type);
    const TargetIcon = getTargetIcon(notification.target_type);
    const typeColor = getTypeColor(notification.type);
    const priorityColor = getPriorityColor(notification.priority);

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={detailStyles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={{ flex: 1 }} />
                </TouchableWithoutFeedback>

            <View style={[detailStyles.sheet, { backgroundColor: colors.cardBackground }]}>
                <View style={[detailStyles.handle, { backgroundColor: colors.border }]} />

                {/* Header row */}
                <View style={detailStyles.headerRow}>
                    <View style={[detailStyles.iconBox, { backgroundColor: typeColor }]}>
                        <TypeIcon size={22} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} style={[detailStyles.title, { color: colors.text }]}>
                            {notification.title}
                        </Text>
                        <View style={detailStyles.badgeRow}>
                            <View style={[detailStyles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                                <Text allowFontScaling={false} style={[detailStyles.priorityText, { color: priorityColor }]}>
                                    {notification.priority?.toUpperCase()}
                                </Text>
                            </View>
                            <View style={[detailStyles.typeBadge, { backgroundColor: typeColor + '15' }]}>
                                <Text allowFontScaling={false} style={[detailStyles.typeText, { color: typeColor }]}>
                                    {notification.type?.replace('_', ' ')}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
                        <X size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={detailStyles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Message */}
                    <View style={[detailStyles.section, { borderColor: colors.border }]}>
                        <Text allowFontScaling={false} style={[detailStyles.sectionLabel, { color: colors.textSecondary }]}>Message</Text>
                        <Text allowFontScaling={false} style={[detailStyles.message, { color: colors.text }]}>
                            {notification.message}
                        </Text>
                    </View>

                    {/* Meta */}
                    <View style={[detailStyles.metaGrid, { borderColor: colors.border }]}>
                        <View style={detailStyles.metaItem}>
                            <TargetIcon size={16} color={colors.primary} />
                            <View>
                                <Text allowFontScaling={false} style={[detailStyles.metaLabel, { color: colors.textSecondary }]}>Sent To</Text>
                                <Text allowFontScaling={false} style={[detailStyles.metaValue, { color: colors.text }]}>
                                    {getTargetLabel(notification.target_type)}
                                </Text>
                            </View>
                        </View>
                        <View style={[detailStyles.metaDivider, { backgroundColor: colors.border }]} />
                        <View style={detailStyles.metaItem}>
                            <Calendar size={16} color={colors.primary} />
                            <View>
                                <Text allowFontScaling={false} style={[detailStyles.metaLabel, { color: colors.textSecondary }]}>Sent On</Text>
                                <Text allowFontScaling={false} style={[detailStyles.metaValue, { color: colors.text }]}>
                                    {formatDate(notification.created_at)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={[detailStyles.closeFullBtn, { backgroundColor: colors.primary }]}
                    onPress={onClose}
                >
                    <Text allowFontScaling={false} style={detailStyles.closeFullBtnText}>Close</Text>
                </TouchableOpacity>
            </View>
            </View>
        </Modal>
    );
};

import { TextSizes } from '@/src/styles/TextSizes';

const detailStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingBottom: 32,
        height: height * 0.60,
        overflow: 'hidden',
    },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 6,
        flex: 1,
    },
    badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    priorityText: { fontSize: TextSizes.tiny, fontFamily: 'Inter-SemiBold' },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    typeText: { fontSize: TextSizes.tiny, fontFamily: 'Inter-SemiBold', textTransform: 'capitalize' },
    closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: 20 },
    section: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: TextSizes.filterLabel,
        fontFamily: 'Inter-Medium',
        marginBottom: 8,
    },
    message: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        lineHeight: 22,
    },
    metaGrid: {
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
    },
    metaDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
    metaLabel: { fontSize: TextSizes.tiny, fontFamily: 'Inter-Medium', marginBottom: 2 },
    metaValue: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
    closeFullBtn: {
        marginHorizontal: 20,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    closeFullBtnText: { color: '#fff', fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    restrictedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restrictedText: {
        fontSize: TextSizes.medium, // was 16
        fontFamily: 'Inter-Medium',
        marginTop: 12,
    },
    // ── Filter sheet (attendance-style) ──────────────────────────────────────
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 24,
        height: height * 0.45,
        overflow: 'hidden',
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
    actionRow: { marginHorizontal: 16, marginBottom: 12 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 11,
        borderRadius: 10,
        borderWidth: 1,
        gap: 6,
    },
    actionBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
    sheetTitle: { flex: 1, fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
    resetText: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium' },
    sheetScroll: { flex: 1, paddingHorizontal: 16 },
    fieldLabel: { fontSize: TextSizes.filterLabel, fontFamily: 'Inter-Medium', marginBottom: 8 },
    chipRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    chip: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
    chipText: { fontSize: TextSizes.small, fontFamily: 'Inter-SemiBold' },
    customDateBox: { borderRadius: 10, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
    dateInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
    dateInputLabel: { width: 36, fontSize: TextSizes.medium, fontFamily: 'Inter-Medium' },
    dateInputValue: { flex: 1, fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
    dateInputDivider: { height: StyleSheet.hairlineWidth },
    pickerSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    pickerHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
    },
    pickerTitle: { fontSize: TextSizes.sectionTitle, fontFamily: 'Inter-SemiBold' },
    pickerDone: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold' },
    listContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: TextSizes.large, // was 18
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: TextSizes.regular, // was 14
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    // ── Notification card (diary-style) ──────────────────────────────────────
    notificationCard: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    cardIconBox: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: TextSizes.header,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    cardMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardMetaText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    priorityBadge: {
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 4,
    },
    priorityBadgeText: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-SemiBold',
    },
    cardByDateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTypeText: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Italic',
        textTransform: 'capitalize',
    },
    cardMessage: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
    },
    applyBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    applyBtnText: { fontSize: TextSizes.medium, fontFamily: 'Inter-SemiBold', color: '#fff' },
    templateChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
    templateChipText: { fontSize: TextSizes.small, fontFamily: 'Inter-Medium' },
    // skeleton
    skeletonCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
    skeletonRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
});


// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     restrictedContainer: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     restrictedText: {
//         fontSize: 16,
//         fontFamily: 'Inter-Medium',
//         marginTop: 12,
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 24,
//         paddingVertical: 20,
//         borderBottomWidth: 1,
//     },
//     headerTitle: {
//         fontSize: 28,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 4,
//     },
//     headerSubtitle: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//     },
//     createButton: {
//         width: 50,
//         height: 50,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     listContainer: {
//         flex: 1,
//         paddingHorizontal: 24,
//         paddingTop: 16,
//     },
//     centerContainer: {
//         flex: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//     },
//     emptyContainer: {
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 60,
//     },
//     emptyText: {
//         fontSize: 18,
//         fontFamily: 'Inter-SemiBold',
//         marginTop: 16,
//         marginBottom: 8,
//     },
//     emptySubtext: {
//         fontSize: 14,
//         fontFamily: 'Inter-Regular',
//         textAlign: 'center',
//     },
//     notificationCard: {
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 12,
//         borderWidth: 1,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 4,
//         elevation: 2,
//     },
//     cardHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 12,
//     },
//     priorityIndicator: {
//         width: 8,
//         height: 8,
//         borderRadius: 4,
//         marginRight: 10,
//     },
//     cardTitleContainer: {
//         flex: 1,
//     },
//     cardTitle: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 2,
//     },
//     cardType: {
//         fontSize: 12,
//         fontFamily: 'Inter-Regular',
//     },
//     badge: {
//         width: 24,
//         height: 24,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     cardMessage: {
//         fontSize: 13,
//         fontFamily: 'Inter-Regular',
//         lineHeight: 18,
//         marginBottom: 12,
//     },
//     cardFooter: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     cardTarget: {
//         fontSize: 12,
//         fontFamily: 'Inter-Medium',
//     },
//     cardTime: {
//         fontSize: 11,
//         fontFamily: 'Inter-Regular',
//     },
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         justifyContent: 'flex-end',
//     },
//     modalContent: {
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         maxHeight: '95%',
//     },
//     modalHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 24,
//         paddingTop: 20,
//         paddingBottom: 16,
//         borderBottomWidth: 1,
//     },
//     modalTitle: {
//         fontSize: 20,
//         fontFamily: 'Inter-SemiBold',
//     },
//     closeButton: {
//         width: 32,
//         height: 32,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     modalScroll: {
//         paddingHorizontal: 24,
//         paddingTop: 20,
//         paddingBottom: 20,
//     },
//     inputGroup: {
//         marginBottom: 24,
//     },
//     label: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//         marginBottom: 8,
//     },
//     input: {
//         borderWidth: 1,
//         borderRadius: 12,
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         fontSize: 16,
//         fontFamily: 'Inter-Regular',
//     },
//     textArea: {
//         height: 100,
//         textAlignVertical: 'top',
//     },
//     charCount: {
//         fontSize: 11,
//         fontFamily: 'Inter-Regular',
//         marginTop: 4,
//         textAlign: 'right',
//     },
//     typeGrid: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 8,
//     },
//     typeOption: {
//         flex: 1,
//         minWidth: '48%',
//         paddingVertical: 12,
//         paddingHorizontal: 12,
//         borderRadius: 8,
//         borderWidth: 1,
//         alignItems: 'center',
//     },
//     typeOptionText: {
//         fontSize: 13,
//         fontFamily: 'Inter-Medium',
//     },
//     priorityGrid: {
//         flexDirection: 'row',
//         gap: 8,
//     },
//     priorityOption: {
//         flex: 1,
//         paddingVertical: 12,
//         borderRadius: 8,
//         borderWidth: 1,
//         alignItems: 'center',
//     },
//     priorityOptionText: {
//         fontSize: 13,
//         fontFamily: 'Inter-Medium',
//     },
//     targetGrid: {
//         flexDirection: 'row',
//         gap: 8,
//     },
//     targetOption: {
//         flex: 1,
//         paddingVertical: 12,
//         paddingHorizontal: 8,
//         borderRadius: 8,
//         borderWidth: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 6,
//     },
//     targetOptionText: {
//         fontSize: 12,
//         fontFamily: 'Inter-Medium',
//     },
//     studentScroll: {
//         marginHorizontal: -8,
//         paddingHorizontal: 8,
//     },
//     studentOption: {
//         paddingHorizontal: 14,
//         paddingVertical: 10,
//         borderRadius: 8,
//         borderWidth: 1,
//         marginRight: 8,
//     },
//     studentOptionText: {
//         fontSize: 13,
//         fontFamily: 'Inter-Medium',
//     },
//     previewCard: {
//         borderWidth: 1,
//         borderRadius: 12,
//         padding: 12,
//     },
//     previewHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 10,
//     },
//     priorityDot: {
//         width: 8,
//         height: 8,
//         borderRadius: 4,
//         marginRight: 8,
//     },
//     previewTitleContainer: {
//         flex: 1,
//     },
//     previewTitle: {
//         fontSize: 14,
//         fontFamily: 'Inter-SemiBold',
//     },
//     previewSubtitle: {
//         fontSize: 11,
//         fontFamily: 'Inter-Regular',
//         marginTop: 2,
//     },
//     previewMessage: {
//         fontSize: 13,
//         fontFamily: 'Inter-Regular',
//         lineHeight: 18,
//         marginBottom: 8,
//     },
//     previewFooter: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 4,
//     },
//     previewFooterText: {
//         fontSize: 11,
//         fontFamily: 'Inter-Regular',
//     },
//     modalFooter: {
//         flexDirection: 'row',
//         gap: 12,
//         paddingHorizontal: 24,
//         paddingBottom: 24,
//     },
//     cancelButton: {
//         flex: 1,
//         paddingVertical: 14,
//         borderRadius: 12,
//         borderWidth: 1,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     cancelButtonText: {
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//     },
//     sendButton: {
//         flex: 1,
//         flexDirection: 'row',
//         paddingVertical: 14,
//         borderRadius: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//         gap: 8,
//     },
//     sendButtonDisabled: {
//         opacity: 0.6,
//     },
//     sendButtonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontFamily: 'Inter-SemiBold',
//     },
// });