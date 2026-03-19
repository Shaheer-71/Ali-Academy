import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useDialog } from '@/src/contexts/DialogContext';
import { supabase } from '@/src/lib/supabase';
import { TextSizes } from '@/src/styles/TextSizes';
import { useScreenAnimation, useButtonAnimation } from '@/src/utils/animations';
import TopSections from '@/src/components/common/TopSections';
import { useRouter } from 'expo-router';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { showError, showSuccess } = useDialog();
  const router = useRouter();
  const screenStyle = useScreenAnimation();
  const submitAnimation = useButtonAnimation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword) {
      showError('Missing Field', 'Please enter your current password');
      return;
    }
    if (!newPassword) {
      showError('Missing Field', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      showError('Weak Password', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords Do Not Match', 'New password and confirm password must be the same');
      return;
    }
    if (newPassword === currentPassword) {
      showError('Same Password', 'New password must be different from your current password');
      return;
    }

    setIsLoading(true);
    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email ?? '',
        password: currentPassword,
      });

      if (signInError) {
        showError('Incorrect Password', 'Your current password is wrong. Please try again.');
        return;
      }

      // Current password verified — now update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      showSuccess('Success', 'Password changed successfully', () => router.back());
    } catch (error: any) {
      showError('Error', error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View style={[{ flex: 1 }, screenStyle, { backgroundColor: colors.background }]}>
      <TopSections showNotifications={false} />
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]} edges={['left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Icon header */}
            <View style={styles.iconWrapper}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
                <Lock size={32} color="#b6d509" />
              </View>
              <Text allowFontScaling={false} style={[styles.iconTitle, { color: colors.text }]}>
                Update your password
              </Text>
              <Text allowFontScaling={false} style={[styles.iconSubtitle, { color: colors.textSecondary }]}>
                Choose a strong password with at least 6 characters
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                show={showCurrent}
                toggleShow={() => setShowCurrent(v => !v)}
                colors={colors}
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                show={showNew}
                toggleShow={() => setShowNew(v => !v)}
                colors={colors}
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                show={showConfirm}
                toggleShow={() => setShowConfirm(v => !v)}
                colors={colors}
              />

              <Animated.View style={submitAnimation.style}>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.primary }, isLoading && styles.disabled]}
                  onPress={handleSubmit}
                  onPressIn={submitAnimation.onPressIn}
                  onPressOut={submitAnimation.onPressOut}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#b6d509" />
                  ) : (
                    <Text allowFontScaling={false} style={styles.submitText}>
                      Change Password
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

function PasswordField({ label, value, onChangeText, placeholder, show, toggleShow, colors }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  show: boolean;
  toggleShow: () => void;
  colors: any;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text allowFontScaling={false} style={[styles.fieldLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <View style={[styles.inputRow, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <TextInput
          allowFontScaling={false}
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.eyeBtn} onPress={toggleShow}>
          {show
            ? <EyeOff size={18} color={colors.textSecondary} />
            : <Eye size={18} color={colors.textSecondary} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    flexGrow: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 32,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconTitle: {
    fontSize: TextSizes.large,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    textAlign: 'center',
  },
  iconSubtitle: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: TextSizes.filterLabel,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    color: '#b6d509',
  },
});
