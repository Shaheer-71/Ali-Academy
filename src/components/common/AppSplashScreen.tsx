import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('screen');

interface Props {
    visible: boolean;
}

export const AppSplashScreen = ({ visible }: Props) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const logoScale = useRef(new Animated.Value(0.82)).current;

    useEffect(() => {
        Animated.spring(logoScale, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 10,
            speed: 8,
        }).start();
    }, []);

    useEffect(() => {
        if (!visible) {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    return (
        <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
            <Animated.Image
                source={require('../../assets/icons/splashscreen.png')}
                style={styles.splash}
                resizeMode="cover"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        zIndex: 9999,
    },
    splash: {
        width,
        height,
    },
});
