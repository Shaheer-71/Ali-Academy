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
// ============================================
// 1. SCREEN NAVIGATION ANIMATION (SUPER SMOOTH + SPICY)
// ============================================
export const createScreenAnimation = (animatedValue: Animated.Value) => {
    return {
        start: () => {
            animatedValue.setValue(0);

            Animated.spring(animatedValue, {
                toValue: 1,
                damping: 14,        // smoother spring
                mass: 0.6,          // lighter feel
                stiffness: 120,     // premium snappiness
                velocity: 0.5,      // natural push
                overshootClamping: false,
                useNativeDriver: true,
            }).start();
        },

        style: {
            opacity: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1], // clean fade
            }),

            transform: [
                // LAYER 1: Smooth slide
                {
                    translateX: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [55, 0], // deeper slide = premium feel
                    }),
                },

                // LAYER 2: Parallax depth (subtle vertical)
                {
                    translateY: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0], // floating entry
                    }),
                },

                // LAYER 3: Scale depth
                {
                    scale: animatedValue.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.93, 0.98, 1], // luxurious zoom-in
                    }),
                },

                // LAYER 4: Tiny rotation for cinematic effect
                {
                    rotateZ: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['2deg', '0deg'], // subtle tilt
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