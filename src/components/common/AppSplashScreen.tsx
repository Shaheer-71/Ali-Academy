import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface Props {
    visible: boolean;
}

export const AppSplashScreen = ({ visible }: Props) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const logoScale = useRef(new Animated.Value(0.82)).current;

    // Logo springs in on mount
    useEffect(() => {
        Animated.spring(logoScale, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 10,
            speed: 8,
        }).start();
    }, []);

    // Fade out when visible becomes false
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
                source={require('../../../assets/images/icon.png')}
                style={[styles.logo, { transform: [{ scale: logoScale }] }]}
                resizeMode="contain"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    logo: {
        width: 180,
        height: 180,
    },
});
