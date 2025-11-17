// src/utils/animations.ts
import { Animated, Easing } from 'react-native';

/**
 * Centralized Animation Configuration
 * Use these consistent animations throughout the app
 */

// ============================================
// ANIMATION DURATIONS (in milliseconds)
// ============================================
export const ANIMATION_DURATION = {
    FAST: 200,
    NORMAL: 300,
    SLOW: 400,
};

// ============================================
// EASING FUNCTIONS
// ============================================
export const EASING = {
    SMOOTH: Easing.bezier(0.4, 0.0, 0.2, 1),
    BOUNCE: Easing.elastic(1),
    LINEAR: Easing.linear,
};

// ============================================
// 1. SCREEN NAVIGATION ANIMATION (ENHANCED)
// ============================================
export const createScreenAnimation = (animatedValue: Animated.Value) => {
    return {
        start: () => {
            animatedValue.setValue(0);
            Animated.spring(animatedValue, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        },

        style: {
            opacity: animatedValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.3, 1],
            }),
            transform: [
                {
                    translateX: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0], // Slide from right
                    }),
                },
                {
                    scale: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.95, 1], // Slight zoom in
                    }),
                },
            ],
        },
    };
};

// ============================================
// 2. BUTTON PRESS ANIMATION
// ============================================
export const createButtonAnimation = (animatedValue: Animated.Value) => {
    return {
        onPressIn: () => {
            Animated.spring(animatedValue, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }).start();
        },

        onPressOut: () => {
            Animated.spring(animatedValue, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }).start();
        },

        style: {
            transform: [{ scale: animatedValue }],
        },
    };
};

// ============================================
// 3. MODAL ANIMATION
// ============================================
export const createModalAnimation = (animatedValue: Animated.Value) => {
    return {
        show: () => {
            animatedValue.setValue(0);
            Animated.parallel([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: ANIMATION_DURATION.NORMAL,
                    easing: EASING.SMOOTH,
                    useNativeDriver: true,
                }),
            ]).start();
        },

        hide: (callback?: () => void) => {
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: ANIMATION_DURATION.FAST,
                easing: EASING.SMOOTH,
                useNativeDriver: true,
            }).start(() => callback?.());
        },

        backdropStyle: {
            opacity: animatedValue,
        },

        contentStyle: {
            opacity: animatedValue,
            transform: [
                {
                    translateY: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [300, 0],
                    }),
                },
                {
                    scale: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                    }),
                },
            ],
        },
    };
};

// ============================================
// 4. CARD/LIST ITEM ANIMATION
// ============================================
export const createCardAnimation = (animatedValue: Animated.Value, delay: number = 0) => {
    return {
        start: () => {
            animatedValue.setValue(0);
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: ANIMATION_DURATION.NORMAL,
                delay,
                easing: EASING.SMOOTH,
                useNativeDriver: true,
            }).start();
        },

        style: {
            opacity: animatedValue,
            transform: [
                {
                    translateX: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                    }),
                },
            ],
        },
    };
};

// ============================================
// 5. FADE IN/OUT ANIMATION
// ============================================
export const createFadeAnimation = (animatedValue: Animated.Value) => {
    return {
        fadeIn: () => {
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: ANIMATION_DURATION.FAST,
                easing: EASING.SMOOTH,
                useNativeDriver: true,
            }).start();
        },

        fadeOut: (callback?: () => void) => {
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: ANIMATION_DURATION.FAST,
                easing: EASING.SMOOTH,
                useNativeDriver: true,
            }).start(() => callback?.());
        },

        style: {
            opacity: animatedValue,
        },
    };
};

// ============================================
// HOOKS FOR EASY USAGE
// ============================================
import { useRef, useEffect } from 'react';

export const useScreenAnimation = () => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const animation = createScreenAnimation(animatedValue);

    useEffect(() => {
        animation.start();
    }, []);

    return animation.style;
};

export const useButtonAnimation = () => {
    const animatedValue = useRef(new Animated.Value(1)).current;
    return createButtonAnimation(animatedValue);
};

export const useModalAnimation = (visible: boolean) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const animation = createModalAnimation(animatedValue);

    useEffect(() => {
        if (visible) {
            animation.show();
        }
    }, [visible]);

    return animation;
};

export const useCardAnimation = (delay: number = 0) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const animation = createCardAnimation(animatedValue, delay);

    useEffect(() => {
        animation.start();
    }, []);

    return animation.style;
};

export const useFadeAnimation = () => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    return createFadeAnimation(animatedValue);
};