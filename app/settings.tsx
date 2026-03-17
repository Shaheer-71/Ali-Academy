import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import {
  LogOut,
  HelpCircle,
  Mail,
  Phone,
  Lock,
  ChevronRight,
  Send,
  User,
  UserCheck,
  DollarSign,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { useRouter } from 'expo-router';
import { TextSizes } from '@/src/styles/TextSizes';
import { useScreenAnimation } from '@/src/utils/animations';



export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { colors } = useTheme();
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

  const handleNavigateToStudents = () => {
    try {
      (router as any).push('/students');
    } catch (err) {
      console.warn('Navigation to /notifications failed:', err);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            signOut();
            router.back();
          },
        },
      ]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => Linking.openURL('mailto:mohammadshaheer342@gmail.com') },
        { text: 'WhatsApp', onPress: () => Linking.openURL('whatsapp://send?phone=+923178550707') },
      ]
    );
  };

  const isSuperAdmin = profile?.role === 'superadmin';

  const isStudent = profile?.role === 'student';

  const settingsOptions = [
    {
      title: 'Account',
      items: [
        {
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: Lock,
          onPress: () => (router as any).push('/change-password'),
        },
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
              title: 'Manage Students',
              subtitle: 'Add and edit your students',
              icon: User,
              onPress: handleNavigateToStudents,
            },
            {
              title: 'Activate Users',
              subtitle: 'Reactivate deactivated student accounts',
              icon: UserCheck,
              onPress: handleNavigateToActivateUsers,
            },
            {
              title: 'Create Notification',
              subtitle: 'Send notifications to users',
              icon: Send,
              onPress: handleNavigateToNotifications,
            },
          ]
          : []),
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
    // {
    //   title: 'Support',
    //   items: [
    //     {
    //       title: 'Help Center',
    //       subtitle: 'Get help and find answers',
    //       icon: HelpCircle,
    //       onPress: handleSupport,
    //     },
    //   ],
    // },
  ];


  return (
    <Animated.View style={[styles.container, screenStyle, { backgroundColor: colors.background }]}>
      <TopSections />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          {/* Profile Section */}
          <View style={styles.section}>
            <View style={[styles.profileCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Text allowFontScaling={false} style={styles.profileInitial}>
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text allowFontScaling={false} style={[styles.profileName, { color: colors.text }]}>
                  {profile?.full_name || 'User'}
                </Text>
                <View style={styles.profileDetails}>
                  <View style={styles.profileDetail}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text allowFontScaling={false} style={[styles.profileDetailText, { color: colors.textSecondary }]}>
                      {profile?.email || 'No email'}
                    </Text>
                  </View>
                  {profile?.contact_number && (
                    <View style={styles.profileDetail}>
                      <Phone size={14} color={colors.textSecondary} />
                      <Text allowFontScaling={false} style={[styles.profileDetailText, { color: colors.textSecondary }]}>
                        {profile.contact_number}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.roleContainer, { backgroundColor: colors.primary }]}>
                  <Text allowFontScaling={false} style={styles.roleText}>
                    {profile?.role?.toUpperCase() || 'STUDENT'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Create Notification Button - Visible only to superadmins */}
          {/* {(profile?.role === 'teacher' && profile?.email === 'rafeh@aliacademy.edu') && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.settingButton, { backgroundColor: colors.cardBackground }]}
                onPress={handleNavigateToStudents}
              >
                <User size={20} color={colors.primary} />
                <View style={styles.buttonContent}>
                  <Text allowFontScaling={false} style={[styles.buttonTitle, { color: colors.text }]}>
                    Manage Students
                  </Text>
                  <Text allowFontScaling={false} style={[styles.buttonSubtitle, { color: colors.textSecondary }]}>
                    Manage your students here
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingButton, { backgroundColor: colors.cardBackground }]}
                onPress={handleNavigateToNotifications}
              >
                <Send size={20} color={colors.primary} />
                <View style={styles.buttonContent}>
                  <Text allowFontScaling={false} style={[styles.buttonTitle, { color: colors.text }]}>
                    Create Notification
                  </Text>
                  <Text allowFontScaling={false} style={[styles.buttonSubtitle, { color: colors.textSecondary }]}>
                    Send notifications to users
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )} */}

          {/* Settings Sections */}
          {settingsOptions.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.settingButton, { backgroundColor: colors.cardBackground }]}
                  onPress={item.onPress}
                >
                  <item.icon size={20} color={colors.primary} />
                  <View style={styles.buttonContent}>
                    <Text allowFontScaling={false} style={[styles.buttonTitle, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    <Text allowFontScaling={false} style={[styles.buttonSubtitle, { color: colors.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Sign Out Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: colors.cardBackground, borderColor: '#EF4444' }]}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#EF4444" />
              <Text allowFontScaling={false} style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text allowFontScaling={false} style={[styles.footerText, { color: colors.textSecondary }]}>
              Ali Academy App v1.0.0
            </Text>
            <Text allowFontScaling={false} style={[styles.footerSubtext, { color: colors.textSecondary }]}>
              Powered By QHASH TECH SOLUTIONS
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  profileCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  profileInitial: {
    fontSize: TextSizes.xlarge,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: TextSizes.xlarge,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  profileDetails: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileDetailText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-SemiBold',
    color: '#b6d509',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flex: 1,
    marginLeft: 12,
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: TextSizes.tiny,
    fontFamily: 'Inter-Regular',
  },
});