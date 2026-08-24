import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Modal,
  Image,
  View,
  Text,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

interface Props {
  visible: boolean;
}

// Every gap between the top-level pieces of the splash, named and defined
// once here. To change the space between two elements, edit the one number
// below that names that relationship — nothing else moves.
const GAP = {
  topOffset: 34, // logo down from the top of its stage
  aroundLoader: 20, // logo -> loader AND loader -> "By Abdul Rafeh Ali" card, kept equal so the loader sits centered between them
};

const LOADER_TRACK_W = 140;
const LOADER_FILL_W = 44;

export const AppSplashScreen = ({ visible }: Props) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [modalVisible, setModalVisible] = useState(true);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const orbitA = useRef(new Animated.Value(0)).current;
  const orbitB = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(badgeAnim, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Ambient orbital motion — two rings drifting in opposite directions,
    // echoing the atom mark inside the academy logo.
    Animated.loop(
      Animated.timing(orbitA, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.timing(orbitB, {
        toValue: 1,
        duration: 13000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Loading bar — a short segment sweeping back and forth along the track,
    // driven manually (reset + restart) so it never visually stalls mid-sweep.
    let mounted = true;
    const sweep = () => {
      barAnim.setValue(0);
      Animated.sequence([
        Animated.timing(barAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(barAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && mounted) sweep();
      });
    };
    sweep();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible]);

  const spinA = orbitA.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '342deg'],
  });
  const spinB = orbitB.interpolate({
    inputRange: [0, 1],
    outputRange: ['26deg', '-334deg'],
  });
  const barTranslate = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LOADER_TRACK_W - LOADER_FILL_W],
  });

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity }]}>
        <LinearGradient
          colors={['#FFFFFF', '#F0F7F6', '#FFFFFF']}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.heroGroup}>
          <View style={{ height: GAP.topOffset }} />

          <View style={styles.logoStage}>
            {/* Orbit rings — commented out for now
                        <Animated.View style={[styles.orbit, styles.orbitA, { transform: [{ rotate: spinA }] }]} />
                        <Animated.View style={[styles.orbit, styles.orbitB, { transform: [{ rotate: spinB }] }]} />
                        */}

            <Animated.View
              style={[
                styles.logoWrap,
                {
                  opacity: logoAnim,
                  transform: [
                    {
                      scale: logoAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.86, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/icons/logo-nbg.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <View style={{ height: GAP.aroundLoader }} />

          <Animated.View
            style={{
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Welcome text — commented out for now
                        <Text allowFontScaling={false} style={styles.welcomeTitle}>Welcome</Text>
                        <Text allowFontScaling={false} style={styles.welcomeSubtitle}>to your official app</Text>
                        */}

            <View style={styles.bylineCard}>
              <Text allowFontScaling={false} style={styles.bylineEyebrow}>
                By
              </Text>
              <Text allowFontScaling={false} style={styles.bylineText}>
                Abdul Rafeh Ali
              </Text>
              <Text allowFontScaling={false} style={styles.bylineSubtext}>
                PhD Scholar (NUST)
              </Text>

              <View style={styles.loaderTrack}>
                <Animated.View
                  style={[
                    styles.loaderFill,
                    { transform: [{ translateX: barTranslate }] },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.footer,
            {
              opacity: badgeAnim,
              transform: [
                {
                  translateY: badgeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text allowFontScaling={false} style={styles.tagText}>
            Learning without limits,{' '}
            <Text style={styles.tagTextAccent}>anywhere</Text>.
          </Text>

          <View style={styles.footerDivider} />

          <Text allowFontScaling={false} style={styles.footerCredit}>
            V {Constants.expoConfig?.version || '1.0.0'}{' '}
            <Text style={styles.footerCreditDot}>•</Text> POWERED BY{' '}
            <Text style={styles.footerBrand}>KODEX</Text>
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  heroGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
  },
  logoStage: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderTrack: {
    width: LOADER_TRACK_W,
    height: 3,
    borderRadius: 1.5,
    marginTop: 12,
    backgroundColor: 'rgba(31,63,74,0.1)',
    overflow: 'hidden',
  },
  loaderFill: {
    width: LOADER_FILL_W,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#A4C400',
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(164,196,0,0.3)',
  },
  orbitA: {
    width: 340,
    height: 170,
    borderRadius: 170,
  },
  orbitB: {
    width: 190,
    height: 320,
    borderRadius: 160,
    borderColor: 'rgba(31,63,74,0.14)',
  },
  logoWrap: {
    shadowColor: '#1F3F4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: {
    width: 280,
    height: 280,
  },
  welcomeTitle: {
    fontSize: 38,
    fontFamily: 'Inter-SemiBold',
    color: '#A4C400',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F3F4A',
    letterSpacing: 0.3,
    marginTop: 2,
    opacity: 0.85,
  },
  bylineCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(31,63,74,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(31,63,74,0.08)',
    shadowColor: '#1F3F4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bylineEyebrow: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#A4C400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  bylineText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#1F3F4A',
    letterSpacing: 0.2,
    marginTop: 4,
    textAlign: 'center',
  },
  bylineSubtext: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#5A7A80',
    letterSpacing: 0.3,
    marginTop: 3,
    textAlign: 'center',
  },
  tagText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontStyle: 'italic',
    color: '#5A7A80',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  tagTextAccent: {
    fontFamily: 'Inter-SemiBold',
    fontStyle: 'italic',
    color: '#1F3F4A',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 52,
  },
  footerDivider: {
    width: 22,
    height: 1,
    backgroundColor: '#5A7A80',
    opacity: 0.25,
    marginTop: 18,
    marginBottom: 14,
  },
  footerCredit: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
    color: '#5A7A80',
    opacity: 0.6,
  },
  footerCreditDot: {
    opacity: 0.5,
  },
  footerBrand: {
    color: '#1F3F4A',
    opacity: 1,
  },
});
