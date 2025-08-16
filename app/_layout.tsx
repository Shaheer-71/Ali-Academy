import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
// Import text scaling configuration to ensure consistent text sizes across devices
import '@/constants/TextScaling';
// import '@/lib/globalTextOverride';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTeacherGroup = segments[0] === '(teacher)';
    const inStudentGroup = segments[0] === '(student)';
    const inSettings = segments[0] === 'settings';

    console.log('Current segments:', segments);
    console.log('User profile:', profile?.role);

    if (!user || !profile) {
      // Redirect to auth if not authenticated
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    // Allow access to settings for authenticated users - STOP HERE
    if (inSettings) {
      console.log('User is in settings, allowing access');
      return; // This will stop the redirect
    }

    // Redirect based on user role after authentication
    if (inAuthGroup) {
      switch (profile.role) {
        case 'teacher':
          router.replace('/(teacher)');
          break;
        case 'student':
          router.replace('/(student)');
          break;
        default:
          router.replace('/(auth)/sign-in');
      }
      return;
    }

    // Only redirect to role groups if user is NOT in settings and NOT already in correct group
    if (profile.role === 'teacher' && !inTeacherGroup && !inSettings) {
      console.log('Redirecting teacher to teacher group');
      router.replace('/(teacher)');
    } else if (profile.role === 'student' && !inStudentGroup && !inSettings) {
      console.log('Redirecting student to student group');
      router.replace('/(student)');
    }
  }, [user, profile, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}