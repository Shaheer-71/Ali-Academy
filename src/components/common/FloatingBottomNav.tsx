// src/components/common/FloatingBottomNav.tsx
import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { House as Home, User, Settings as SettingsIcon } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

const { width: SW } = Dimensions.get('window');
const wp = (pct: number) => (SW * pct) / 100;

const PILL_H = 50;
const ICON_W = 50;
const ACTIVE_W = 108;

type NavKey = 'home' | 'profile' | 'settings';

const ITEMS: { key: NavKey; label: string; icon: typeof Home; routeName: string }[] = [
    { key: 'home', label: 'Home', icon: Home, routeName: 'index' },
    { key: 'profile', label: 'Profile', icon: User, routeName: 'profile' },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, routeName: 'settings' },
];

export default function FloatingBottomNav({ state, navigation }: BottomTabBarProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const focusedRouteName = state.routes[state.index]?.name;
    const rawActiveIndex = ITEMS.findIndex(i => i.routeName === focusedRouteName);
    const activeIndex = Math.max(0, rawActiveIndex);

    const widthAnims = useRef(ITEMS.map((_, i) => new Animated.Value(i === activeIndex ? 1 : 0))).current;
    const opacityAnims = useRef(ITEMS.map((_, i) => new Animated.Value(i === activeIndex ? 1 : 0))).current;
    const prevIndex = useRef(activeIndex);

    useEffect(() => {
        const prev = prevIndex.current;
        if (prev === activeIndex) return;
        prevIndex.current = activeIndex;

        Animated.parallel([
            Animated.spring(widthAnims[prev], { toValue: 0, tension: 260, friction: 24, useNativeDriver: false }),
            Animated.spring(widthAnims[activeIndex], { toValue: 1, tension: 260, friction: 24, useNativeDriver: false }),
            Animated.timing(opacityAnims[prev], { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(opacityAnims[activeIndex], { toValue: 1, duration: 200, delay: 100, useNativeDriver: true }),
        ]).start();
    }, [activeIndex]);

    const handlePress = (routeName: string) => {
        const route = state.routes.find(r => r.name === routeName);
        if (route) navigation.navigate(route.name);
    };

    // Only the primary tabs (Home, Profile, Settings) show the floating nav —
    // every other screen is a "common" screen with its own header back button.
    if (rawActiveIndex === -1) return null;

    return (
        <View
            style={[styles.navSafe, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom - 10, 0) : 0 }]}
            pointerEvents="box-none"
        >
            <View style={styles.navShadow}>
                <LinearGradient
                    colors={['#173239', colors.primary, '#173239']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.navClip}
                >
                    <View style={styles.navTopBorder} pointerEvents="none" />

                    <View style={styles.navRow}>
                        {ITEMS.map((item, i) => {
                            const active = i === activeIndex;
                            const Icon = item.icon;

                            const pillWidth = widthAnims[i].interpolate({
                                inputRange: [0, 1],
                                outputRange: [ICON_W, ACTIVE_W],
                            });
                            const labelWidth = widthAnims[i].interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, ACTIVE_W - ICON_W],
                            });

                            return (
                                <Pressable
                                    key={item.key}
                                    onPress={() => handlePress(item.routeName)}
                                    style={styles.navItem}
                                    accessibilityRole="button"
                                    accessibilityLabel={item.label}
                                >
                                    <Animated.View style={[styles.pill, { width: pillWidth }]}>
                                        <Animated.View style={[styles.pillBg, { opacity: opacityAnims[i] }]} />
                                        <Icon
                                            size={22}
                                            color={active ? colors.primary : 'rgba(255,255,255,0.65)'}
                                        />
                                        <Animated.View style={{ width: labelWidth, overflow: 'hidden' }}>
                                            <Animated.Text
                                                numberOfLines={1}
                                                style={[styles.pillLabel, { opacity: opacityAnims[i], marginLeft: 5, color: colors.primary }]}
                                            >
                                                {item.label}
                                            </Animated.Text>
                                        </Animated.View>
                                    </Animated.View>
                                </Pressable>
                            );
                        })}
                    </View>
                </LinearGradient>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    navSafe: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    navShadow: {
        marginHorizontal: wp(5),
        marginBottom: Platform.OS === 'android' ? wp(3) + 10 : 0,
        borderRadius: PILL_H,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
    },
    navClip: {
        borderRadius: PILL_H,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    navTopBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        zIndex: 1,
    },
    navRow: {
        flexDirection: 'row',
        paddingVertical: wp(2),
        paddingHorizontal: wp(4),
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pill: {
        height: PILL_H,
        borderRadius: PILL_H / 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    pillBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        borderRadius: PILL_H / 2,
    },
    pillLabel: {
        fontSize: 11,
        fontFamily: 'Inter-SemiBold',
    },
});
