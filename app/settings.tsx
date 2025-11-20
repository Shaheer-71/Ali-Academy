import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
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
  X,
  ChevronRight,
  Send,
  User,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { useRouter } from 'expo-router';
import { TextSizes } from '@/src/styles/TextSizes';
import { useScreenAnimation } from '@/src/utils/animations';
import { supabase } from '@/src/lib/supabase';


function PasswordChangeModal({
  visible,
  colors,
  isLoading,
  passwordData,
  setPasswordData,
  handlePasswordChange,
  setPasswordModalVisible
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setPasswordModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Change Password
            </Text>
            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Current Password
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                New Password
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Confirm New Password
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={() => setPasswordModalVisible(false)}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handlePasswordChange}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#b6d509" />
              ) : (
                <Text style={[styles.buttonText, { color: '#b6d509' }]}>
                  Change Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const screenStyle = useScreenAnimation();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      Alert.alert('Success', 'Password changed successfully');
      setPasswordModalVisible(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
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

  const settingsOptions = [
    {
      title: 'Account',
      items: [
        {
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: Lock,
          onPress: () => setPasswordModalVisible(true),
        },
        ...(profile?.role === 'teacher' && profile?.email === 'rafeh@aliacademy.edu'
          ? [
            {
              title: 'Manage Students',
              subtitle: 'Manage your students here',
              icon: User,
              onPress: handleNavigateToStudents,
            },
            {
              title: 'Create Notification',
              subtitle: 'Send notifications to users',
              icon: Send,
              onPress: handleNavigateToNotifications,
            },
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

      <PasswordChangeModal
        visible={passwordModalVisible}
        colors={colors}
        isLoading={isLoading}
        passwordData={passwordData}
        setPasswordData={setPasswordData}
        handlePasswordChange={handlePasswordChange}
        setPasswordModalVisible={setPasswordModalVisible}
      />

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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: TextSizes.large,
    fontFamily: 'Inter-SemiBold',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  saveButton: {},
  buttonText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
  },
});