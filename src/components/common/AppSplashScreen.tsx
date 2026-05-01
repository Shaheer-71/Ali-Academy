import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Modal, Image } from 'react-native';

interface Props {
    visible: boolean;
}

export const AppSplashScreen = ({ visible }: Props) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const [modalVisible, setModalVisible] = useState(true);

    useEffect(() => {
        if (!visible) {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => setModalVisible(false));
        }
    }, [visible]);

    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <Animated.View style={[styles.container, { opacity }]}>
                <Image
                    source={require('../../assets/icons/splashscreen.png')}
                    style={styles.splash}
                    resizeMode="stretch"
                />
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    splash: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
