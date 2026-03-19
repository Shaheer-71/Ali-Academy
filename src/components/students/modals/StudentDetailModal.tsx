import React from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Text,
    Dimensions,
} from 'react-native';

const { height: windowHeight } = Dimensions.get('window');
import {
    X,
    Users,
    User,
    Calendar,
    Phone,
    Home,
    Mail,
    UserCheck,
    AlertCircle,
    Hash,
} from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { TextSizes } from '@/src/styles/TextSizes';

export const StudentDetailModal = ({
    visible,
    student,
    onClose,
}: {
    visible: boolean;
    student: any | null;
    onClose: () => void;
}) => {
    const { colors } = useTheme();
    if (!student) return null;

    const initials = (student.full_name || '')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const InfoRow = ({
        icon,
        label,
        value,
    }: {
        icon: React.ReactNode;
        label: string;
        value?: string;
    }) => {
        if (!value) return null;
        return (
            <View style={[s.row, { borderBottomColor: colors.border }]}>
                <View style={[s.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                    {icon}
                </View>
                <View style={s.rowBody}>
                    <Text allowFontScaling={false} style={[s.rowLabel, { color: colors.textSecondary }]}>
                        {label}
                    </Text>
                    <Text allowFontScaling={false} style={[s.rowValue, { color: colors.text }]}>
                        {value}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={s.overlay}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

                <View style={[s.sheet, { backgroundColor: colors.background }]}>
                    {/* Handle */}
                    <View style={[s.handle, { backgroundColor: colors.border }]} />

                    {/* Header row */}
                    <View style={s.header}>
                        {/* Avatar */}
                        <View style={[s.avatar, { backgroundColor: colors.primary + '20' }]}>
                            <Text allowFontScaling={false} style={[s.avatarText, { color: colors.primary }]}>
                                {initials}
                            </Text>
                        </View>
                        {/* Name + class */}
                        <View style={s.headerInfo}>
                            <Text allowFontScaling={false} style={[s.name, { color: colors.text }]} numberOfLines={1}>
                                {student.full_name}
                            </Text>
                            <Text allowFontScaling={false} style={[s.classBadge, { color: colors.textSecondary }]}>
                                {student.classes?.name || 'No class'} · Roll {student.roll_number}
                            </Text>
                        </View>
                        <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.cardBackground }]} onPress={onClose}>
                            <X size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Info rows */}
                    <ScrollView
                        style={s.scroll}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={s.scrollContent}
                    >
                        <InfoRow
                            icon={<Mail size={15} color={colors.primary} />}
                            label="Email"
                            value={student.email}
                        />
                        <InfoRow
                            icon={<Phone size={15} color={colors.primary} />}
                            label="Phone"
                            value={student.phone_number}
                        />
                        <InfoRow
                            icon={<User size={15} color={colors.primary} />}
                            label="Gender"
                            value={student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : undefined}
                        />
                        <InfoRow
                            icon={<Calendar size={15} color={colors.primary} />}
                            label="Date of Birth"
                            value={student.date_of_birth}
                        />
                        <InfoRow
                            icon={<Calendar size={15} color={colors.primary} />}
                            label="Admission Date"
                            value={student.admission_date}
                        />
                        <InfoRow
                            icon={<Home size={15} color={colors.primary} />}
                            label="Address"
                            value={student.address}
                        />
                        <InfoRow
                            icon={<UserCheck size={15} color={colors.primary} />}
                            label="Parent Name"
                            value={student.parent_name}
                        />
                        <InfoRow
                            icon={<Phone size={15} color={colors.primary} />}
                            label="Parent Contact"
                            value={student.parent_contact}
                        />
                        <InfoRow
                            icon={<AlertCircle size={15} color={colors.primary} />}
                            label="Emergency Contact"
                            value={student.emergency_contact}
                        />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        height: windowHeight * 0.60,
        overflow: 'hidden',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 10,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
    },
    headerInfo: {
        flex: 1,
    },
    name: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    classBadge: {
        fontSize: TextSizes.small,
        fontFamily: 'Inter-Regular',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    scrollContent: {
        paddingBottom: 28,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 12,
    },
    iconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowBody: {
        flex: 1,
    },
    rowLabel: {
        fontSize: TextSizes.tiny,
        fontFamily: 'Inter-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 1,
    },
    rowValue: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
    },
});

export default StudentDetailModal;
