import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useDialog } from '@/src/contexts/DialogContext';
import {
  LogOut,
  HelpCircle,
  Lock,
  ChevronRight,
  Send,
  UserCheck,
  DollarSign,
  Sun,
  Moon,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { useRouter } from 'expo-router';
import { TextSizes } from '@/src/styles/TextSizes';
import { useScreenAnimation } from '@/src/utils/animations';

function ThemeToggle({ value, onToggle, colors }: { value: boolean; onToggle: () => void; colors: ReturnType<typeof useTheme>['colors'] }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 260,
      friction: 22,
    }).start();
  }, [value]);

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const thumbTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 24],
  });

  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <Animated.View style={[toggleStyles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[toggleStyles.thumb, { transform: [{ translateX: thumbTranslate }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const toggleStyles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { showConfirm, showInfo } = useDialog();
  const router = useRouter();
  const screenStyle = useScreenAnimation();

  const handleNavigateToActivateUsers = () => {
    try {
      (router as any).push('/activate-users');
    } catch (err) {
      console.warn('Navigation to /activate-users failed:', err);
    }
  };

  const handleNavigateToNotifications = () => {
    try {
      (router as any).push('/notifications');
    } catch (err) {
      console.warn('Navigation to /notifications failed:', err);
    }
  };

  const handleSignOut = () => {
    showConfirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: () => {
        signOut();
        router.back();
      },
    });
  };

  const handleSupport = () => {
    showInfo(
      'Contact Support',
      'You can reach us via email at mohammadshaheer342@gmail.com or on WhatsApp at +923178550707'
    );
  };

  const isSuperAdmin = profile?.role === 'superadmin';

  const isStudent = profile?.role === 'student';

  const settingsOptions = [
    {
      title: 'Management',
      items: [
        ...(isStudent
          ? [
            {
              title: 'Fee Status',
              subtitle: 'View your fee payment history',
              icon: DollarSign,
              onPress: () => (router as any).push('/fee-status'),
            },
          ]
          : []),
        ...(isSuperAdmin
          ? [
            {
              title: 'Manage Fee',
              subtitle: 'Manage student fee payments',
              icon: DollarSign,
              onPress: () => (router as any).push('/fee'),
            },
            {
              title: 'Activate Users',
              subtitle: 'Reactivate deactivated student accounts',
              icon: UserCheck,
              onPress: handleNavigateToActivateUsers,
            },
          ]
          : []),
      ],
    },
    {
      title: 'Notifications',
      items: [
        ...(isSuperAdmin
          ? [
            {
              title: 'Create Notification',
              subtitle: 'Send notifications to users',
              icon: Send,
              onPress: handleNavigateToNotifications,
            },
          ]
          : []),
      ],
    },
    {
      title: 'Support',
      items: [
        ...(!isSuperAdmin
          ? [
            {
              title: 'Help Center',
              subtitle: 'Get help and find answers',
              icon: HelpCircle,
              onPress: handleSupport,
            },
          ]
          : []),
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: Lock,
          onPress: () => (router as any).push('/change-password'),
        },
        {
          title: 'Sign Out',
          subtitle: 'Log out of your account',
          icon: LogOut,
          onPress: handleSignOut,
          danger: true,
        },
      ],
    },
  ].filter(section => section.items.length > 0);



  return (
    <Animated.View style={[styles.container, screenStyle, { backgroundColor: colors.background }]}>
      <TopSections />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 50 }}
        >
          {/* Appearance */}
          <View style={styles.section}>
            <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Appearance
            </Text>
            <View style={[styles.settingCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.settingButton}>
                {isDark ? (
                  <Moon size={18} color={colors.textSecondary} />
                ) : (
                  <Sun size={18} color={colors.textSecondary} />
                )}
                <View style={styles.buttonContent}>
                  <Text allowFontScaling={false} style={[styles.buttonTitle, { color: colors.text }]}>
                    Dark Mode
                  </Text>
                  <Text allowFontScaling={false} style={[styles.buttonSubtitle, { color: colors.textSecondary }]}>
                    {isDark ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <ThemeToggle value={isDark} onToggle={toggleTheme} colors={colors} />
              </View>
            </View>
          </View>

          {/* Settings Sections */}
          {settingsOptions.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
              <View style={[styles.settingCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {section.items.map((item, itemIndex) => {
                  const danger = 'danger' in item && item.danger;
                  const tint = danger ? '#EF4444' : colors.textSecondary;
                  return (
                    <React.Fragment key={itemIndex}>
                      {itemIndex > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                      <TouchableOpacity
                        style={styles.settingButton}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                      >
                        <item.icon size={18} color={tint} />
                        <View style={styles.buttonContent}>
                          <Text allowFontScaling={false} style={[styles.buttonTitle, { color: danger ? tint : colors.text }]}>
                            {item.title}
                          </Text>
                          <Text allowFontScaling={false} style={[styles.buttonSubtitle, { color: colors.textSecondary }]}>
                            {item.subtitle}
                          </Text>
                        </View>
                        {!danger && <ChevronRight size={18} color={colors.textSecondary} />}
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
        </View>
      </SafeAreaView>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingCard: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonContent: {
    flex: 1,
    marginLeft: 14,
  },
  buttonTitle: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
  },
});
