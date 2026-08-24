// File: app/(auth)/sign-in.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Animated, Image } from 'react-native';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check, Fingerprint } from 'lucide-react-native';
import { useScreenAnimation, useButtonAnimation } from '@/src/utils/animations';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { AccountPickerModal } from '@/src/components/common/AccountPickerModal';
import { handleAuthError, getValidationError } from '@/src/utils/errorHandler/errorHandler';
import { useRememberMe } from '@/src/hooks/useRememberMe';

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
  const insets = useSafeAreaInsets();
  const screenStyle = useScreenAnimation();
  const ButtonAnimation = useButtonAnimation();
  const RegisterButtonAnimation = useButtonAnimation();
  const rememberMeState = useRememberMe();

  // Compress the logo and slide it up when the keyboard opens, so the form
  // never gets pushed off-screen behind it.
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateTo = (toValue: number, duration?: number) => {
      Animated.timing(keyboardAnim, {
        toValue,
        duration: duration ?? 220,
        useNativeDriver: false,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, (e) => { setKeyboardVisible(true); animateTo(1, e?.duration); });
    const hideSub = Keyboard.addListener(hideEvent, (e) => { setKeyboardVisible(false); animateTo(0, e?.duration); });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAnim]);

  const logoWidth = keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [210, 108] });
  const logoHeight = keyboardAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 103] });

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

  const handleEmailChange = (text: string) => {
    setEmail(text);
    rememberMeState.onEmailChange(text);
  };

  const handleSignIn = async (overrideEmail?: string, overridePassword?: string) => {
    const signInEmail = overrideEmail ?? email;
    const signInPassword = overridePassword ?? password;

    // Validate inputs
    const validationError = getValidationError(signInEmail, signInPassword);
    if (validationError) {
      showError(validationError.title, validationError.message);
      return;
    }

    setLoading(true);
    let success = false;
    try {
      await signIn(signInEmail.toLowerCase().trim(), signInPassword);
      success = true;
    } catch (error: any) {
      console.warn('Sign in error:', error);
      const userError = handleAuthError(error);
      showError(userError.title, userError.message);
    } finally {
      setLoading(false);
      await rememberMeState.onSignInSettled(success, signInEmail);
    }
  };

  const handleToggleRememberMe = () => {
    rememberMeState.toggleRememberMe(email, password, message => showError('Remember Me', message));
  };

  const fillAndSignIn = async (filledEmail: string, filledPassword: string) => {
    setEmail(filledEmail);
    setPassword(filledPassword);
    await handleSignIn(filledEmail, filledPassword);
  };

  const handleBiometricPress = () => {
    rememberMeState.handleBiometricLogin(fillAndSignIn, message => showError('Sign In', message));
  };

  const handlePickAccount = (pickedEmail: string) => {
    rememberMeState.handlePickAccount(pickedEmail, fillAndSignIn, message => showError('Sign In', message));
  };

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
          <View
            style={[
              styles.scrollContent,
              {
                justifyContent: keyboardVisible ? 'flex-start' : 'center',
                paddingTop: insets.top + 24,
                paddingBottom: insets.bottom + 32,
              },
            ]}
          >
            {/* Header */}
            <Animated.View style={styles.header}>
              <Animated.Image
                source={require('@/src/assets/icons/logo-nbg.png')}
                style={[styles.logo, { width: logoWidth, height: logoHeight }]}
              />
            </Animated.View>

            {/* Card */}
            <View style={styles.card}>
              {/* Welcome row */}
              <View style={styles.welcomeRow}>
                <View style={styles.avatarCircle}>
                  <User size={22} color="#1F3F4A" />
                </View>
                <View style={styles.welcomeTextBlock}>
                  <Text allowFontScaling={false} style={styles.welcomeTitle}>Welcome Back</Text>
                  <Text allowFontScaling={false} style={styles.welcomeSub}>Sign in to your account to continue</Text>
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text allowFontScaling={false} style={styles.label}>EMAIL ADDRESS</Text>
                <View style={styles.inputRow}>
                  <Mail size={18} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    allowFontScaling={false}
                    style={styles.input}
                    value={email}
                    onChangeText={handleEmailChange}
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
                    onSubmitEditing={() => handleSignIn()}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                    {showPassword
                      ? <EyeOff size={18} color="#6B7280" />
                      : <Eye size={18} color="#6B7280" />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me */}
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={handleToggleRememberMe}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMeState.rememberMe && styles.checkboxChecked]}>
                  {rememberMeState.rememberMe && <Check size={12} color="#ffffff" />}
                </View>
                <Text allowFontScaling={false} style={styles.rememberText}>Remember Me</Text>
              </TouchableOpacity>

              {!keyboardVisible && (
                <>
                  {/* Sign In Button */}
                  <Animated.View style={[ButtonAnimation.style, styles.buttonWrapper]}>
                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={() => handleSignIn()}
                      onPressIn={ButtonAnimation.onPressIn}
                      onPressOut={ButtonAnimation.onPressOut}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Text allowFontScaling={false} style={styles.buttonText}>Sign In</Text>
                          <ArrowRight size={18} color="#ffffff" style={styles.buttonArrow} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Biometric quick sign-in */}
                  {rememberMeState.hasSavedAccounts && (
                    <>
                      <View style={styles.orDividerRow}>
                        <View style={styles.orDividerLine} />
                        <Text allowFontScaling={false} style={styles.orDividerText}>OR</Text>
                        <View style={styles.orDividerLine} />
                      </View>

                      <TouchableOpacity
                        style={styles.biometricButton}
                        onPress={handleBiometricPress}
                        activeOpacity={0.8}
                      >
                        <Fingerprint size={20} color="#1F3F4A" />
                        <Text allowFontScaling={false} style={styles.biometricButtonText}>
                          {rememberMeState.canRememberMe
                            ? `Sign in with ${rememberMeState.biometricLabel}`
                            : 'Sign in with saved account'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Register */}
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
                </>
              )}
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

      <AccountPickerModal
        visible={rememberMeState.showAccountPicker}
        accounts={rememberMeState.pickerAccounts}
        selectionMode={rememberMeState.pickerSelectionMode}
        selectedForRemoval={rememberMeState.pickerSelectedForRemoval}
        onPickAccount={handlePickAccount}
        onToggleSelectionMode={rememberMeState.togglePickerSelectionMode}
        onToggleSelected={rememberMeState.togglePickerSelectedForRemoval}
        onRemoveSelected={rememberMeState.removePickerSelected}
        onClose={rememberMeState.dismissAccountPicker}
      />
    </Animated.View>
  );
}

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F7F8',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 210,
    height: 200,
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    marginHorizontal: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(31,63,74,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTextBlock: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: '#1F3F4A',
    marginBottom: 2,
  },
  welcomeSub: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
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
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#A4C400',
    borderColor: '#A4C400',
  },
  rememberText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  buttonWrapper: {
    marginTop: 8,
  },
  button: {
    height: 50,
    backgroundColor: '#1F3F4A',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F3F4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    marginLeft: 10,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orDividerText: {
    fontSize: TextSizes.tiny,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
    marginHorizontal: 12,
    letterSpacing: 0.6,
  },
  biometricButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  biometricButtonText: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
    color: '#1F3F4A',
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
