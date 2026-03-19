import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Trash2, HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { DialogType } from '@/src/contexts/DialogContext';
import { TextSizes } from '@/src/styles/TextSizes';

interface AppDialogProps {
    visible: boolean;
    type: DialogType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const { width } = Dimensions.get('window');

const TYPE_CONFIG = {
    error:   { icon: AlertCircle,   color: '#EF4444', bg: '#FEF2F2' },
    success: { icon: CheckCircle,   color: '#10B981', bg: '#F0FDF4' },
    warning: { icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB' },
    info:    { icon: Info,          color: '#3B82F6', bg: '#EFF6FF' },
    confirm: { icon: HelpCircle,    color: '#6366F1', bg: '#EEF2FF' },
};

export const AppDialog: React.FC<AppDialogProps> = ({
    visible,
    type,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    destructive = false,
    onClose,
    onConfirm,
    onCancel,
}) => {
    const { colors } = useTheme();
    const cfg = TYPE_CONFIG[type];
    const Icon = cfg.icon;
    const isConfirm = type === 'confirm';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={isConfirm ? onCancel : onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>

                    {/* Icon */}
                    <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                        <Icon size={28} color={cfg.color} />
                    </View>

                    {/* Title */}
                    <Text allowFontScaling={false} style={[styles.title, { color: colors.text }]}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text allowFontScaling={false} style={[styles.message, { color: colors.textSecondary }]}>
                        {message}
                    </Text>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Buttons */}
                    {isConfirm ? (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.btn, styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                                onPress={onCancel}
                                activeOpacity={0.75}
                            >
                                <Text allowFontScaling={false} style={[styles.cancelText, { color: colors.textSecondary }]}>
                                    {cancelText}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.confirmBtn, { backgroundColor: destructive ? '#EF4444' : colors.primary }]}
                                onPress={onConfirm}
                                activeOpacity={0.75}
                            >
                                <Text allowFontScaling={false} style={styles.confirmText}>
                                    {confirmText}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.singleBtn, { backgroundColor: cfg.color }]}
                            onPress={onClose}
                            activeOpacity={0.75}
                        >
                            <Text allowFontScaling={false} style={styles.confirmText}>
                                {confirmText === 'Confirm' ? 'OK' : confirmText}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 20,
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    iconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: TextSizes.sectionTitle,
        fontFamily: 'Inter-SemiBold',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    divider: {
        width: '100%',
        height: StyleSheet.hairlineWidth,
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    btn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        borderWidth: 1,
    },
    confirmBtn: {},
    singleBtn: {
        width: '100%',
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-Medium',
    },
    confirmText: {
        fontSize: TextSizes.normal,
        fontFamily: 'Inter-SemiBold',
        color: '#ffffff',
    },
});
