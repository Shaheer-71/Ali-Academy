// File: app/(auth)/sign-in.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Animated, Image } from 'react-native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useScreenAnimation, useButtonAnimation } from '@/src/utils/animations';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { handleAuthError, getValidationError } from '@/src/utils/errorHandler/errorHandler';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const { signIn } = useAuth();
  const router = useRouter();
  const screenStyle = useScreenAnimation();
  const ButtonAnimation = useButtonAnimation();
  const RegisterButtonAnimation = useButtonAnimation();

  const showError = (title: string, message: string) => {
    setErrorModal({
      visible: true,
      title,
      message,
    });
  };

  const closeErrorModal = () => {
    setErrorModal({
      visible: false,
      title: '',
      message: '',
    });
  };

  const handleSignIn = async () => {
    // Validate inputs
    const validationError = getValidationError(email, password);
    if (validationError) {
      showError(validationError.title, validationError.message);
      return;
    }

    setLoading(true);
    try {
      await signIn(email.toLowerCase().trim(), password);
    } catch (error: any) {
      console.warn('Sign in error:', error);
      const userError = handleAuthError(error);
      showError(userError.title, userError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>

        {/* Top branded section — shrinks when keyboard opens */}
        <View style={styles.brandSection}>
          <View style={styles.decorCircleTL} />
          <View style={styles.decorCircleBR} />
          <Image source={require('@/src/assets/icons/logo.png')} style={styles.logo} />
          <Text allowFontScaling={false} style={styles.brandName}>ALI SCIENCE ACADEMY</Text>
          <Text allowFontScaling={false} style={styles.brandTagline}>Learn · Discover · Lead</Text>
          <View style={styles.brandDivider} />
        </View>

        {/* Bottom form card — grows when keyboard opens */}
        <View style={styles.card}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardContent}
            style={styles.cardScroll}
          >
          {/* Heading */}
          <View style={styles.cardHeader}>
            <View style={styles.cardAccentLine} />
            <Text allowFontScaling={false} style={styles.welcomeTitle}>Welcome Back</Text>
            <Text allowFontScaling={false} style={styles.welcomeSub}>Sign in to your account to continue</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text allowFontScaling={false} style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputRow}>
              <Mail size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                allowFontScaling={false}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text allowFontScaling={false} style={styles.label}>PASSWORD</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                allowFontScaling={false}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                {showPassword
                  ? <EyeOff size={18} color="#6B7280" />
                  : <Eye size={18} color="#6B7280" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <Animated.View style={[ButtonAnimation.style, styles.buttonWrapper]}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              onPressIn={ButtonAnimation.onPressIn}
              onPressOut={ButtonAnimation.onPressOut}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#1F3F4A" />
              ) : (
                <Text allowFontScaling={false} style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          </ScrollView>

          {/* Register — always visible, outside scroll */}
          <View style={styles.registerRow}>
            <Text allowFontScaling={false} style={styles.registerLabel}>New student? </Text>
            <Animated.View style={RegisterButtonAnimation.style}>
              <TouchableOpacity
                onPress={() => router.push('/sign-up')}
                onPressIn={RegisterButtonAnimation.onPressIn}
                onPressOut={RegisterButtonAnimation.onPressOut}
              >
                <Text allowFontScaling={false} style={styles.registerLink}>Register here</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={closeErrorModal}
      />
    </Animated.View>
  );
}

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1F3F4A',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#1F3F4A',
    overflow: 'hidden',
  },
  decorCircleTL: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(164,196,0,0.08)',
    top: -40,
    left: -40,
  },
  decorCircleBR: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(164,196,0,0.08)',
    bottom: -20,
    right: -20,
  },
  logo: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    letterSpacing: 2.5,
    marginTop: 12,
  },
  brandTagline: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#A4C400',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  brandDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#A4C400',
    marginTop: 14,
  },
  keyboardView: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardScroll: {
    flex: 1,
  },
  cardContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardAccentLine: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#A4C400',
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#1F3F4A',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  buttonWrapper: {
    marginTop: 8,
  },
  button: {
    height: 52,
    backgroundColor: '#1F3F4A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerLabel: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  registerLink: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    color: '#1F3F4A',
  },
});