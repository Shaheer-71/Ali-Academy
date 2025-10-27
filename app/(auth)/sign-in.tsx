// File: app/(auth)/sign-in.tsx (or wherever your SignInScreen is located)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { supabase } from '@/src/lib/supabase';
import { GraduationCap } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  // const handleSignIn = async () => {
  //   if (!email || !password) {
  //     Alert.alert('Error', 'Please fill in all fields');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     console.log('Attempting sign in with:', email);
      
  //     await signIn(email.toLowerCase().trim(), password);
      

  //   } catch (error: any) {
  //     console.error('Sign in error:', error);
  //     Alert.alert('Sign In Failed', error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Debug function to test auth directly (remove in production)
  // const debugSignIn = async () => {
  //   if (!email || !password) {
  //     Alert.alert('Error', 'Please fill in email and password for debugging');
  //     return;
  //   }

  //   console.log('=== DEBUG SIGNIN START ===');
  //   console.log('Email:', email);
  //   console.log('Password length:', password.length);

  //   try {
  //     // Test raw auth
  //     console.log('Testing raw auth...');
  //     const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  //       email: email.toLowerCase().trim(),
  //       password: password,
  //     });

  //     if (authError) {
  //       console.log('AUTH ERROR:', authError);
  //       Alert.alert('Auth Error', authError.message);
  //       return;
  //     }

  //     console.log('AUTH SUCCESS:', authData.user?.id);

  //     // Test profile fetch
  //     console.log('Testing profile fetch...');
  //     const { data: profileData, error: profileError } = await supabase
  //       .from('profiles')
  //       .select('*')
  //       .eq('id', authData.user.id)
  //       .single();

  //     if (profileError) {
  //       console.log('PROFILE ERROR:', profileError);
  //       Alert.alert('Profile Error', profileError.message);
  //       return;
  //     }

  //     console.log('PROFILE SUCCESS:', profileData);
  //     Alert.alert('Debug Success', `Auth and Profile working!\nUser: ${authData.user.email}\nRole: ${profileData.role}`);

  //     // Sign out after debug test
  //     await supabase.auth.signOut();

  //   } catch (error: any) {
  //     console.log('DEBUG ERROR:', error);
  //     Alert.alert('Debug Error', error.message);
  //   }
  // };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // console.log('Attempting sign in with:', email);
      
      // Add try-catch specifically for signIn to catch parsing errors
      try {
        await signIn(email.toLowerCase().trim(), password);
      } catch (signInError: any) {
        // Check if it's a JSON parse error
        if (signInError.message && signInError.message.includes('JSON Parse error')) {
          console.error('JSON Parse Error detected. This usually means:');
          console.error('1. Incorrect Supabase URL in your config');
          console.error('2. Network/Proxy issues');
          console.error('3. Supabase service is down');
          console.error('Full error:', signInError);
          
          // Try to get more details about what was returned
          Alert.alert(
            'Connection Error', 
            'Unable to connect to the authentication service. Please check:\n\n' +
            '1. Your internet connection\n' +
            '2. Supabase URL configuration\n' +
            '3. Try again in a few moments\n\n' +
            'Error: ' + signInError.message
          );
        } else {
          throw signInError; // Re-throw if it's not a JSON parse error
        }
      }

    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // More specific error messages
      let errorMessage = 'An unknown error occurred';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Network error. Please check your connection';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced debug function with better error handling
  const debugSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password for debugging');
      return;
    }

    // console.log('=== DEBUG SIGNIN START ===');
    // console.log('Email:', email);
    // console.log('Password length:', password.length);
    
    // First, check the Supabase URL
    // console.log('Supabase URL:', supabase.supabaseUrl);
    // console.log('Checking if URL is accessible...');

    try {
      // Test raw auth with better error handling
      // console.log('Testing raw auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (authError) {
        // console.log('AUTH ERROR:', authError);
        // console.log('Error type:', typeof authError);
        // console.log('Error details:', JSON.stringify(authError, null, 2));
        Alert.alert('Auth Error', authError.message);
        return;
      }

      console.log('AUTH SUCCESS:', authData.user?.id);

      // Test profile fetch
      console.log('Testing profile fetch...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        // console.log('PROFILE ERROR:', profileError);
        Alert.alert('Profile Error', profileError.message);
        return;
      }

      // console.log('PROFILE SUCCESS:', profileData);
      Alert.alert('Debug Success', `Auth and Profile working!\nUser: ${authData.user.email}\nRole: ${profileData.role}`);

      // Sign out after debug test
      await supabase.auth.signOut();

    } catch (error: any) {
      // console.log('DEBUG CATCH ERROR:', error);
      // console.log('Error name:', error.name);
      // console.log('Error message:', error.message);
      // console.log('Error stack:', error.stack);
      
      if (error.message && error.message.includes('JSON Parse error')) {
        Alert.alert(
          'Configuration Error', 
          'Cannot parse response from Supabase.\n\n' +
          'This usually means:\n' +
          '• Wrong Supabase URL in config\n' +
          '• URL is missing or malformed\n' +
          '• Network/Firewall blocking request\n\n' +
          'Check your supabase.ts config file'
        );
      } else {
        Alert.alert('Debug Error', error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <GraduationCap size={48} color="#b6d509" />
            </View>
            <Text style={styles.title}>Academy Management</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Debug button - remove this after testing */}
            {/* {__DEV__ && (
              <TouchableOpacity
                style={[styles.debugButton]}
                onPress={debugSignIn}
              >
                <Text style={styles.debugButtonText}>🐛 Debug Auth</Text>
              </TouchableOpacity>
            )} */}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New Student?</Text>
            <View style={styles.footerButtonRow}>
              <Text style={styles.demoText}>Click Here to</Text>
              <TouchableOpacity
                onPress={() => router.push("/sign-up")}
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}> Register Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    width: 80,
    height: 80,
    backgroundColor: '#274d71',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: '#274d71',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  button: {
    height: 50,
    backgroundColor: '#274d71',
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
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  debugButton: {
    height: 40,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerButtonRow: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  registerButton: {
    justifyContent: "center",
    alignItems: "center"
  },
  registerButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  demoText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
});