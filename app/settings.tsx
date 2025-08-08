import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, LogOut, Bell, Shield, CircleHelp as HelpCircle, Info, ChevronRight, Mail, Phone } from 'lucide-react-native';
import TopSection from '@/components/TopSections';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { colors } = useTheme();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const settingsOptions = [
    {
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      icon: Shield,
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon'),
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: HelpCircle,
      onPress: () => Alert.alert('Support', 'For support, please contact: support@academy.com'),
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      icon: Info,
      onPress: () => Alert.alert('Academy Management App', 'Version 1.0.0\nBuilt with React Native & Supabase'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TopSection />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>


          {/* Profile Section */}
          <View style={styles.section}>
            <View style={[styles.profileCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.profileInitial}>
                  {profile?.full_name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>{profile?.full_name}</Text>
                <View style={styles.profileDetails}>
                  <View style={styles.profileDetail}>
                    <Mail size={14} color={colors.textSecondary} />
                    <Text style={[styles.profileDetailText, { color: colors.textSecondary }]}>{profile?.email}</Text>
                  </View>
                  {profile?.contact_number && (
                    <View style={styles.profileDetail}>
                      <Phone size={14} color={colors.textSecondary} />
                      <Text style={[styles.profileDetailText, { color: colors.textSecondary }]}>{profile.contact_number}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.roleContainer, { backgroundColor: colors.primary }]}>
                  <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Options */}
          <View style={styles.section}>
            {settingsOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={option.onPress}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.primary }]}>
                  <option.icon size={20} color={colors.text} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <View style={[styles.appInfoCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <Text style={[styles.appInfoTitle, { color: colors.primary }]}>Academy Management System</Text>
              <Text style={[styles.appInfoDescription, { color: colors.text }]}>
                A comprehensive solution for managing academy operations including attendance,
                lectures, assignments, and parent communication.
              </Text>
              <View style={styles.appInfoDetails}>
                <Text style={[styles.appInfoDetail, { color: colors.textSecondary }]}>• Real-time WhatsApp notifications</Text>
                <Text style={[styles.appInfoDetail, { color: colors.textSecondary }]}>• Secure file storage and sharing</Text>
                <Text style={[styles.appInfoDetail, { color: colors.textSecondary }]}>• Role-based access control</Text>
                <Text style={[styles.appInfoDetail, { color: colors.textSecondary }]}>• Comprehensive attendance tracking</Text>
              </View>
            </View>
          </View>

          {/* Sign Out Button */}
          <View style={styles.section}>
            <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.cardBackground, borderColor: colors.error }]} onPress={handleSignOut}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>Ali Academy App v1.0.0</Text>
            <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>Powered By QHASH TECH SOLUTIONS</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom : 20
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
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
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 6,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#b6d509',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  appInfoCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  appInfoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  appInfoDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  appInfoDetails: {
    gap: 4,
  },
  appInfoDetail: {
    fontSize: 12,
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
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
});