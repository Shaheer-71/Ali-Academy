// screens/NotificationScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
    RefreshControl,
    SafeAreaView,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
    Plus,
    Send,
    Users,
    User,
    Globe,
    Clock,
    AlertCircle,
    Info,
    Check,
    X,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { useNotificationForm } from '../../hooks/useNotificationForm';
import { useNotificationHistory } from '../../hooks/useNotificationHistory';

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

export default function NotificationScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

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

    // Fetch students for individual selection
    useEffect(() => {
        if (formData.target_type === 'individual') {
            fetchStudents();
        }
    }, [formData.target_type]);

    const fetchStudents = async () => {
        try {
            const { supabase } = require('@/src/lib/supabase');
            const { data, error } = await supabase
                .from('students')
                .select('id, full_name, class_id')
                .order('full_name');

            if (error) throw error;
            setStudents(data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleSendNotification = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            Alert.alert('Error', 'Please fill in title and message');
            return;
        }

        if (formData.target_type === 'individual' && !formData.target_id) {
            Alert.alert('Error', 'Please select a student');
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

    const getTargetTypeLabel = (targetType: string, targetId: string) => {
        if (targetType === 'all') return '👥 All Users';
        if (targetType === 'students') return '👨‍🎓 All Students';
        if (targetType === 'individual') {
            const student = students.find(s => s.id === targetId);
            return `👤 ${student?.full_name || 'Individual'}`;
        }
        return targetType;
    };

    if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <TopSections />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View>
                    <Text allowFontScaling={false} style={[styles.headerTitle, { color: colors.text }]}>You Can</Text>
                    <Text allowFontScaling={false} style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                        Create and manage notifications
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}
                >
                    <Plus size={24} color="#fff" />
                </TouchableOpacity>
            </View>

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
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
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
                ) : (
                    notifications.map((notif) => (
                        <NotificationCard
                            key={notif.id}
                            notification={notif}
                            colors={colors}
                            students={students}
                        />
                    ))
                )}
            </ScrollView>

            {/* Create Notification Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>
                                Create Notification
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {/* Title Input */}
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Title *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    placeholder="Notification title"
                                    value={formData.title}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, title: text })
                                    }
                                    placeholderTextColor={colors.textSecondary}
                                    maxLength={100}
                                />
                                <Text allowFontScaling={false} style={[styles.charCount, { color: colors.textSecondary }]}>
                                    {formData.title.length}/100
                                </Text>
                            </View>

                            {/* Message Input */}
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Message *</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        {
                                            backgroundColor: colors.cardBackground,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    placeholder="Notification message"
                                    value={formData.message}
                                    onChangeText={(text) =>
                                        setFormData({ ...formData, message: text })
                                    }
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={4}
                                    maxLength={500}
                                />
                                <Text allowFontScaling={false} style={[styles.charCount, { color: colors.textSecondary }]}>
                                    {formData.message.length}/500
                                </Text>
                            </View>

                            {/* Type Selector */}
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Type</Text>
                                <View style={styles.typeGrid}>
                                    {[
                                        { value: 'announcement', label: 'Announcement' },
                                        { value: 'assignment_added', label: 'Assignment' },
                                        { value: 'event', label: 'Event' },
                                        { value: 'reminder', label: 'Reminder' },
                                    ].map((type) => (
                                        <TouchableOpacity
                                            key={type.value}
                                            style={[
                                                styles.typeOption,
                                                {
                                                    backgroundColor:
                                                        formData.type === type.value
                                                            ? colors.primary
                                                            : colors.cardBackground,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            onPress={() =>
                                                setFormData({ ...formData, type: type.value as any })
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.typeOptionText,
                                                    {
                                                        color:
                                                            formData.type === type.value
                                                                ? '#fff'
                                                                : colors.text,
                                                    },
                                                ]}
                                            >
                                                {type.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Priority Selector */}
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>Priority</Text>
                                <View style={styles.priorityGrid}>
                                    {[
                                        { value: 'low', label: 'Low', color: '#10B981' },
                                        { value: 'medium', label: 'Medium', color: '#F59E0B' },
                                        { value: 'high', label: 'High', color: '#EF4444' },
                                    ].map((priority) => (
                                        <TouchableOpacity
                                            key={priority.value}
                                            style={[
                                                styles.priorityOption,
                                                {
                                                    backgroundColor:
                                                        formData.priority === priority.value
                                                            ? priority.color
                                                            : colors.cardBackground,
                                                    borderColor:
                                                        formData.priority === priority.value
                                                            ? priority.color
                                                            : colors.border,
                                                },
                                            ]}
                                            onPress={() =>
                                                setFormData({
                                                    ...formData,
                                                    priority: priority.value as any,
                                                })
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.priorityOptionText,
                                                    {
                                                        color:
                                                            formData.priority === priority.value
                                                                ? '#fff'
                                                                : colors.text,
                                                    },
                                                ]}
                                            >
                                                {priority.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Target Type Selector */}
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                    Send To *
                                </Text>
                                <View style={styles.targetGrid}>
                                    {[
                                        { value: 'all', label: 'All Users', icon: Globe },
                                        { value: 'students', label: 'All Students', icon: Users },
                                        { value: 'individual', label: 'Individual', icon: User },
                                    ].map(({ value, label, icon: Icon }) => (
                                        <TouchableOpacity
                                            key={value}
                                            style={[
                                                styles.targetOption,
                                                {
                                                    backgroundColor:
                                                        formData.target_type === value
                                                            ? colors.primary
                                                            : colors.cardBackground,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            onPress={() =>
                                                setFormData({
                                                    ...formData,
                                                    target_type: value as any,
                                                    target_id: '',
                                                })
                                            }
                                        >
                                            <Icon
                                                size={20}
                                                color={
                                                    formData.target_type === value
                                                        ? '#fff'
                                                        : colors.primary
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.targetOptionText,
                                                    {
                                                        color:
                                                            formData.target_type === value
                                                                ? '#fff'
                                                                : colors.text,
                                                    },
                                                ]}
                                            >
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Individual Student Selection */}
                            {formData.target_type === 'individual' && (
                                <View style={styles.inputGroup}>
                                    <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                        Select Student *
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.studentScroll}
                                    >
                                        {students.map((student) => (
                                            <TouchableOpacity
                                                key={student.id}
                                                style={[
                                                    styles.studentOption,
                                                    {
                                                        backgroundColor:
                                                            formData.target_id === student.id
                                                                ? colors.primary
                                                                : colors.cardBackground,
                                                        borderColor: colors.border,
                                                    },
                                                ]}
                                                onPress={() =>
                                                    setFormData({
                                                        ...formData,
                                                        target_id: student.id,
                                                    })
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.studentOptionText,
                                                        {
                                                            color:
                                                                formData.target_id === student.id
                                                                    ? '#fff'
                                                                    : colors.text,
                                                        },
                                                    ]}
                                                >
                                                    {student.full_name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Preview */}
                            <View style={styles.inputGroup}>
                                <Text allowFontScaling={false} style={[styles.label, { color: colors.text }]}>
                                    Preview
                                </Text>
                                <View
                                    style={[
                                        styles.previewCard,
                                        { backgroundColor: colors.cardBackground, borderColor: colors.border },
                                    ]}
                                >
                                    <View style={styles.previewHeader}>
                                        <View
                                            style={[
                                                styles.priorityDot,
                                                {
                                                    backgroundColor:
                                                        formData.priority === 'high'
                                                            ? '#EF4444'
                                                            : formData.priority === 'medium'
                                                                ? '#F59E0B'
                                                                : '#10B981',
                                                },
                                            ]}
                                        />
                                        <View style={styles.previewTitleContainer}>
                                            <Text
                                                style={[styles.previewTitle, { color: colors.text }]}
                                                numberOfLines={1}
                                            >
                                                {formData.title || 'Notification Title'}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.previewSubtitle,
                                                    { color: colors.textSecondary },
                                                ]}
                                            >
                                                {formData.type}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text
                                        style={[
                                            styles.previewMessage,
                                            { color: colors.textSecondary },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {formData.message || 'Notification message...'}
                                    </Text>
                                    <View style={styles.previewFooter}>
                                        <Info size={14} color={colors.textSecondary} />
                                        <Text
                                            style={[
                                                styles.previewFooterText,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            Sending to {getTargetTypeLabel(formData.target_type, formData.target_id)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Send Button */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: colors.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text allowFontScaling={false} style={[styles.cancelButtonText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: colors.primary },
                                    sending && styles.sendButtonDisabled,
                                ]}
                                onPress={handleSendNotification}
                                disabled={sending}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Send size={18} color="#fff" />
                                        <Text allowFontScaling={false} style={styles.sendButtonText}>Send Notification</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Notification Card Component
const NotificationCard = ({ notification, colors, students }: any) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return '#EF4444';
            case 'medium':
                return '#F59E0B';
            case 'low':
                return '#10B981';
            default:
                return colors.textSecondary;
        }
    };

    const getTargetLabel = (targetType: string) => {
        switch (targetType) {
            case 'all':
                return '👥 All Users';
            case 'students':
                return '👨‍🎓 All Students';
            case 'individual':
                return '👤 Individual';
            default:
                return targetType;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View
            style={[
                styles.notificationCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
        >
            <View style={styles.cardHeader}>
                <View
                    style={[
                        styles.priorityIndicator,
                        { backgroundColor: getPriorityColor(notification.priority) },
                    ]}
                />
                <View style={styles.cardTitleContainer}>
                    <Text allowFontScaling={false} style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                        {notification.title}
                    </Text>
                    <Text
                        style={[styles.cardType, { color: colors.textSecondary }]}
                    >
                        {notification.type}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                    <Check size={12} color={colors.primary} />
                </View>
            </View>

            <Text
                style={[styles.cardMessage, { color: colors.textSecondary }]}
                numberOfLines={2}
            >
                {notification.message}
            </Text>

            <View style={styles.cardFooter}>
                <Text allowFontScaling={false} style={[styles.cardTarget, { color: colors.textSecondary }]}>
                    {getTargetLabel(notification.target_type)}
                </Text>
                <Text allowFontScaling={false} style={[styles.cardTime, { color: colors.textSecondary }]}>
                    {formatDate(notification.created_at)}
                </Text>
            </View>
        </View>
    );
};

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
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    createButton: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    notificationCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    priorityIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    cardTitleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    cardType: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    badge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardMessage: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTarget: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    cardTime: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '95%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
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
    modalScroll: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
        textAlign: 'right',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeOption: {
        flex: 1,
        minWidth: '48%',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    typeOptionText: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
    },
    priorityGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    priorityOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    priorityOptionText: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
    },
    targetGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    targetOption: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    targetOptionText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
    },
    studentScroll: {
        marginHorizontal: -8,
        paddingHorizontal: 8,
    },
    studentOption: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
    },
    studentOptionText: {
        fontSize: 13,
        fontFamily: 'Inter-Medium',
    },
    previewCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    previewTitleContainer: {
        flex: 1,
    },
    previewTitle: {
        fontSize: 14,
        fontFamily: 'Inter-SemiBold',
    },
    previewSubtitle: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
        marginTop: 2,
    },
    previewMessage: {
        fontSize: 13,
        fontFamily: 'Inter-Regular',
        lineHeight: 18,
        marginBottom: 8,
    },
    previewFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    previewFooterText: {
        fontSize: 11,
        fontFamily: 'Inter-Regular',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
    sendButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
    },
});