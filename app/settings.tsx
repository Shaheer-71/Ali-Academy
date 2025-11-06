import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { 
  User, 
  LogOut, 
  Bell, 
  Shield, 
  CircleHelp as HelpCircle, 
  Info, 
  ChevronRight, 
  Mail, 
  Phone,
  Edit2,
  Moon,
  Sun,
  Globe,
  Lock,
  X,
  Check,
  MessageCircle,
  FileText,
  AlertCircle,
  Palette,
  Volume2,
  Wifi,
  Download,
  Trash2,
  Send,
} from 'lucide-react-native';
import TopSections from '@/src/components/common/TopSections';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { profile, signOut, updateProfile } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  // Settings States
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [language, setLanguage] = useState('en');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile Edit States
  const [editedProfile, setEditedProfile] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    contact_number: profile?.contact_number || '',
  });

  // Password Change States
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    assignments: true,
    announcements: true,
    grades: true,
    attendance: true,
    messages: true,
    reminders: true,
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'everyone', // 'everyone', 'teachers', 'nobody'
    showEmail: true,
    showPhone: false,
    allowMessages: true,
  });

  // Load saved settings
  useEffect(() => {
    loadSettings();
    checkNotificationPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setNotificationsEnabled(parsedSettings.notificationsEnabled ?? true);
        setSoundEnabled(parsedSettings.soundEnabled ?? true);
        setAutoDownload(parsedSettings.autoDownload ?? false);
        setWifiOnly(parsedSettings.wifiOnly ?? true);
        setLanguage(parsedSettings.language ?? 'en');
        setNotificationSettings(parsedSettings.notificationSettings ?? notificationSettings);
        setPrivacySettings(parsedSettings.privacySettings ?? privacySettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        notificationsEnabled,
        soundEnabled,
        autoDownload,
        wifiOnly,
        language,
        notificationSettings,
        privacySettings,
      };
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    // Mock check - replace with actual notification permission check
    // const { status } = await Notifications.getPermissionsAsync();
    // if (status !== 'granted') {
    //   setNotificationsEnabled(false);
    // }
  };

  const handleNotificationToggle = async (value) => {
    if (value) {
      // Mock permission request - replace with actual implementation
      // const { status } = await Notifications.requestPermissionsAsync();
      // if (status === 'granted') {
        setNotificationsEnabled(true);
        await saveSettings();
      // } else {
      //   Alert.alert(
      //     'Permission Required',
      //     'Please enable notifications in your device settings to receive updates.',
      //     [
      //       { text: 'Cancel', style: 'cancel' },
      //       { text: 'Open Settings', onPress: () => Linking.openSettings() },
      //     ]
      //   );
      // }
    } else {
      setNotificationsEnabled(false);
      await saveSettings();
    }
  };

  const handleSoundToggle = async (value) => {
    setSoundEnabled(value);
    await saveSettings();
  };

  const handleAutoDownloadToggle = async (value) => {
    setAutoDownload(value);
    await saveSettings();
  };

  const handleWifiOnlyToggle = async (value) => {
    setWifiOnly(value);
    await saveSettings();
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // Here you would call your API to update profile
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the profile in context
      await updateProfile(editedProfile);
      
      Alert.alert('Success', 'Profile updated successfully');
      setProfileModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

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
      // Here you would call your API to change password
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Password changed successfully');
      setPasswordModalVisible(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToNotifications = () => {
    try {
      console.log('Navigating to /notifications from Settings');
      // cast to any to avoid expo-router typed path union issues at compile time
      (router as any).push('/notifications');
    } catch (err) {
      console.error('Navigation to /notifications failed:', err);
      // fallback: try replace
      try {
        (router as any).replace('/notifications');
      } catch (err2) {
        console.error('Fallback replace to /notifications also failed:', err2);
      }
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear cache logic here
              await AsyncStorage.removeItem('cachedData');
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
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
          onPress: async () => {
            await saveSettings(); // Save settings before signing out
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
          showArrow: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Help Center',
          subtitle: 'Get help and find answers',
          icon: HelpCircle,
          onPress: handleSupport,
          showArrow: true,
        },
      ],
    },
  ];

  // Profile Edit Modal
  const ProfileEditModal = () => (
    <Modal
      visible={profileModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setProfileModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={editedProfile.full_name}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, full_name: text })}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={editedProfile.email}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.text }]}>Contact Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={editedProfile.contact_number}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, contact_number: text })}
                placeholder="Enter your contact number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text allowFontScaling={false} style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleProfileUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#b6d509" />
              ) : (
                <Text allowFontScaling={false} style={[styles.buttonText, { color: '#b6d509' }]}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Password Change Modal
  const PasswordChangeModal = () => (
    <Modal
      visible={passwordModalVisible}
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
            <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text allowFontScaling={false} style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
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
              <Text allowFontScaling={false} style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handlePasswordChange}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#b6d509" />
              ) : (
                <Text allowFontScaling={false} style={[styles.buttonText, { color: '#b6d509' }]}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Notification Settings Modal
  const NotificationSettingsModal = () => (
    <Modal
      visible={notificationModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setNotificationModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>Notification Settings</Text>
            <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {Object.entries(notificationSettings).map(([key, value]) => (
              <View key={key} style={styles.notificationItem}>
                <View style={styles.notificationInfo}>
                  <Text allowFontScaling={false} style={[styles.notificationTitle, { color: colors.text }]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <Text allowFontScaling={false} style={[styles.notificationSubtitle, { color: colors.textSecondary }]}>
                    Receive notifications for {key}
                  </Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={(newValue) => {
                    setNotificationSettings({ ...notificationSettings, [key]: newValue });
                    saveSettings();
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={value ? '#b6d509' : '#f4f3f4'}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                saveSettings();
                setNotificationModalVisible(false);
              }}
            >
              <Text allowFontScaling={false} style={[styles.buttonText, { color: '#b6d509' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Privacy Settings Modal
  const PrivacySettingsModal = () => (
    <Modal
      visible={privacyModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setPrivacyModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text allowFontScaling={false} style={[styles.modalTitle, { color: colors.text }]}>Privacy Settings</Text>
            <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.privacySection}>
              <Text allowFontScaling={false} style={[styles.privacySectionTitle, { color: colors.text }]}>Profile Visibility</Text>
              {['everyone', 'teachers', 'nobody'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioItem}
                  onPress={() => {
                    setPrivacySettings({ ...privacySettings, profileVisibility: option });
                    saveSettings();
                  }}
                >
                  <View style={[styles.radio, { borderColor: colors.primary }]}>
                    {privacySettings.profileVisibility === option && (
                      <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                    )}
                  </View>
                  <Text allowFontScaling={false} style={[styles.radioLabel, { color: colors.text }]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.privacySection}>
              <Text allowFontScaling={false} style={[styles.privacySectionTitle, { color: colors.text }]}>Contact Information</Text>
              
              <View style={styles.privacyItem}>
                <View style={styles.privacyInfo}>
                  <Text allowFontScaling={false} style={[styles.privacyTitle, { color: colors.text }]}>Show Email</Text>
                  <Text allowFontScaling={false} style={[styles.privacySubtitle, { color: colors.textSecondary }]}>
                    Allow others to see your email
                  </Text>
                </View>
                <Switch
                  value={privacySettings.showEmail}
                  onValueChange={(value) => {
                    setPrivacySettings({ ...privacySettings, showEmail: value });
                    saveSettings();
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={privacySettings.showEmail ? '#b6d509' : '#f4f3f4'}
                />
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyInfo}>
                  <Text allowFontScaling={false} style={[styles.privacyTitle, { color: colors.text }]}>Show Phone</Text>
                  <Text allowFontScaling={false} style={[styles.privacySubtitle, { color: colors.textSecondary }]}>
                    Allow others to see your phone number
                  </Text>
                </View>
                <Switch
                  value={privacySettings.showPhone}
                  onValueChange={(value) => {
                    setPrivacySettings({ ...privacySettings, showPhone: value });
                    saveSettings();
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={privacySettings.showPhone ? '#b6d509' : '#f4f3f4'}
                />
              </View>

              <View style={styles.privacyItem}>
                <View style={styles.privacyInfo}>
                  <Text allowFontScaling={false} style={[styles.privacyTitle, { color: colors.text }]}>Allow Messages</Text>
                  <Text allowFontScaling={false} style={[styles.privacySubtitle, { color: colors.textSecondary }]}>
                    Receive messages from other users
                  </Text>
                </View>
                <Switch
                  value={privacySettings.allowMessages}
                  onValueChange={(value) => {
                    setPrivacySettings({ ...privacySettings, allowMessages: value });
                    saveSettings();
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={privacySettings.allowMessages ? '#b6d509' : '#f4f3f4'}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                saveSettings();
                setPrivacyModalVisible(false);
              }}
            >
              <Text allowFontScaling={false} style={[styles.buttonText, { color: '#b6d509' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                <Text allowFontScaling={false} style={[styles.profileName, { color: colors.text }]}>{profile?.full_name || 'User'}</Text>
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
                  <Text allowFontScaling={false} style={styles.roleText}>{profile?.role?.toUpperCase() || 'STUDENT'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Create Notification Button - Visible only to superadmins */}
          {(profile?.role === 'teacher' && profile?.email === 'rafeh@aliacademy.edu') && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.createNotificationButton, { backgroundColor: colors.primary }]}
                onPress={handleNavigateToNotifications}
              >
                <Send size={20} color="#b6d509" />
                <View style={styles.buttonContent}>
                  <Text allowFontScaling={false} style={[styles.createNotificationTitle, { color: '#b6d509' }]}>
                    Create Notification
                  </Text>
                  <Text allowFontScaling={false} style={[styles.createNotificationSubtitle, { color: '#b6d509' }]}>
                    Send notifications to users
                  </Text>
                </View>
                <ChevronRight size={20} color="#b6d509" />
              </TouchableOpacity>
            </View>
          )}

          {/* Settings Sections */}
          {settingsOptions.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text allowFontScaling={false} style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={item.onPress}
                  disabled={item.hasSwitch}
                >
                  <View style={[styles.settingIcon, { backgroundColor: colors.background }]}>
                    <item.icon size={20} color={colors.primary} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text allowFontScaling={false} style={[styles.settingTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text allowFontScaling={false} style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  {item.hasSwitch ? (
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={item.switchValue ? '#b6d509' : '#f4f3f4'}
                    />
                  ) : item.showArrow ? (
                    <ChevronRight size={20} color={colors.textSecondary} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Sign Out Button */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.signOutButton, { backgroundColor: colors.cardBackground, borderColor: colors.error }]} 
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#EF4444" />
              <Text allowFontScaling={false} style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text allowFontScaling={false} style={[styles.footerText, { color: colors.textSecondary }]}>Ali Academy App v1.0.0</Text>
            <Text allowFontScaling={false} style={[styles.footerSubtext, { color: colors.textSecondary }]}>
              Powered By QHASH TECH SOLUTIONS
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <ProfileEditModal />
      <PasswordChangeModal />
      <NotificationSettingsModal />
      <PrivacySettingsModal />
    </View>
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
    fontSize: 12,
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
  createNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flex: 1,
    marginLeft: 12,
  },
  createNotificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  createNotificationSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
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
  // Modal Styles
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
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
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
  saveButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  privacySection: {
    marginBottom: 24,
  },
  privacySectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  privacyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  privacySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});