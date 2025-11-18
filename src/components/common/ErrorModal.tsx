// File: src/components/ErrorModal.tsx
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';
import { TextSizes } from '@/src/styles/TextSizes';

interface ErrorModalProps {
    visible: boolean;
    title?: string;
    message: string;
    onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
    visible,
    title = 'Oops!',
    message,
    onClose,
}) => {
    const scaleValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8,
                tension: 40,
            }).start();
        } else {
            scaleValue.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={true}
            presentationStyle="overFullScreen"
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ scale: scaleValue }],
                        },
                    ]}
                >
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={20} color="#6B7280" />
                    </TouchableOpacity>

                    {/* Error icon */}
                    <View style={styles.iconContainer}>
                        <AlertCircle size={48} color="#EF4444" />
                    </View>

                    {/* Title */}
                    <Text allowFontScaling={false} style={styles.title}>
                        {title}
                    </Text>

                    {/* Message */}
                    <Text allowFontScaling={false} style={styles.message}>
                        {message}
                    </Text>

                    {/* Action button */}
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text allowFontScaling={false} style={styles.buttonText}>
                            Got it
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 1,
    },
    iconContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#FEE2E2',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: TextSizes.large,
        fontFamily: 'Inter-SemiBold',
        color: '#111827',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-Regular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    button: {
        height: 48,
        backgroundColor: '#204040',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: TextSizes.medium,
        fontFamily: 'Inter-SemiBold',
    },
});