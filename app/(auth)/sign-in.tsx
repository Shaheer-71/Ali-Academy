// File: app/(auth)/sign-in.tsx
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Image, Animated } from 'react-native';
import { useScreenAnimation, useButtonAnimation } from '@/src/utils/animations';
import { ErrorModal } from '@/src/components/common/ErrorModal';
import { handleAuthError, getValidationError } from '@/src/utils/errorHandler/errorHandler';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View style={[{ flex: 1 }, screenStyle]}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Image
                  source={require('@/src/assets/icons/logo.jpg')}
                  style={{ width: 170, height: 170, resizeMode: 'contain' }}
                />
              </View>
              <Text allowFontScaling={false} style={styles.title}>
                Academy Management
              </Text>
              <Text allowFontScaling={false} style={styles.subtitle}>
                Sign in to your account
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text allowFontScaling={false} style={styles.label}>
                  Email
                </Text>
                <TextInput
                  allowFontScaling={false}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text allowFontScaling={false} style={styles.label}>
                  Password
                </Text>
                <TextInput
                  allowFontScaling={false}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Animated.View style={ButtonAnimation.style}>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignIn}
                  onPressIn={ButtonAnimation.onPressIn}
                  onPressOut={ButtonAnimation.onPressOut}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text allowFontScaling={false} style={styles.buttonText}>
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.footer}>
              <Text allowFontScaling={false} style={styles.footerText}>
                New Student?
              </Text>
              <View style={styles.footerButtonRow}>
                <Text allowFontScaling={false} style={styles.demoText}>
                  Click Here to
                </Text>
                <Animated.View style={RegisterButtonAnimation.style}>
                  <TouchableOpacity
                    onPress={() => router.push('/sign-up')}
                    onPressIn={RegisterButtonAnimation.onPressIn}
                    onPressOut={RegisterButtonAnimation.onPressOut}
                    style={styles.registerButton}
                  >
                    <Text allowFontScaling={false} style={styles.registerButtonText}>
                      {' '}
                      Register Now
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={closeErrorModal}
      />
    </SafeAreaView>
  );
}

import { TextSizes } from '@/src/styles/TextSizes';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#204040',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: TextSizes.large,
    fontFamily: 'Inter-SemiBold',
    color: '#204040',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  button: {
    height: 50,
    backgroundColor: '#204040',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: TextSizes.medium,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  footerText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerButtonRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  demoText: {
    fontSize: TextSizes.small,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
});