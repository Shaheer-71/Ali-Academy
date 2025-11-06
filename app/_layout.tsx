import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/src/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import { LoadingProvider } from '@/src/contexts/LoadingContext';
import { ThemeProvider } from '@/src/contexts/ThemeContext';
import { NotificationProvider } from '@/src/contexts/NotificationContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import '@/src/constants/TextScaling';
import { registerDeviceForNotifications, setupNotificationHandlers } from '@/src/lib/notifications';


SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();


  // Setup notification handlers ONCE on mount
  useEffect(() => {
    console.log('📱 Setting up notification handlers...');
    setupNotificationHandlers();
  }, []);

  // Register device when user is loaded
  useEffect(() => {
    console.log('🔍 Checking user state:', { user: !!user, profile: !!profile, loading });

    if (loading) {
      console.log('⏳ Still loading, skipping device registration');
      return;
    }

    if (!user) {
      console.log('❌ No user found, skipping device registration');
      return;
    }

    if (!user.id) {
      console.log('❌ User ID is missing:', user);
      return;
    }

    console.log('✅ Registering device for user:', user.id);
    registerDeviceForNotifications(user.id);
  }, [user?.id, loading]); // Only depend on user.id and loading

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTeacherGroup = segments[0] === '(teacher)';
    const inStudentGroup = segments[0] === '(student)';
    const inSettings = segments[0] === 'settings';
    const inFee = segments[0] === 'fee';
  const inNotifications = segments[0] === 'notifications';


    if (!user || !profile) {
      // Redirect to auth if not authenticated
      if (!inAuthGroup) {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    // Allow access to settings/fee/notifications for authenticated users - STOP HERE
    if (inSettings || inFee || inNotifications) {
      console.log('User is in settings/fee/notifications, allowing access');
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
    if (profile.role === 'teacher' && !inTeacherGroup && !inSettings && !inNotifications) {
      // console.log('Redirecting teacher to teacher group');
      router.replace('/(teacher)');
    } else if (profile.role === 'student' && !inStudentGroup && !inSettings) {
      // console.log('Redirecting student to student group');
      router.replace('/(student)');
    }

  }, [user, profile, loading, segments]);


  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false}} />
      <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="fee" options={{ headerShown: false }} />
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
        <NotificationProvider>
          {/* <LoadingProvider> */}
          <RootLayoutNav />
          <StatusBar style="auto" />
          {/* </LoadingProvider> */}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}