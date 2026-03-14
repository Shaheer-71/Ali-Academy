import { useEffect, useRef, useState } from 'react';
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
import { AppSplashScreen } from '@/src/components/common/AppSplashScreen';


SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();


  // Setup notification handlers ONCE on mount
  useEffect(() => {
    setupNotificationHandlers();
  }, []);

  // Register device when user is loaded
  useEffect(() => {
    if (loading || !user?.id) return;
    registerDeviceForNotifications(user.id);
  }, [user?.id, loading]);

  // Keep a ref to current segments so the routing effect can read it
  // without re-running every time navigation changes
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  useEffect(() => {
    if (loading) return;

    const seg0 = segmentsRef.current[0];
    const inAuthGroup = seg0 === '(auth)';
    const inTeacherGroup = seg0 === '(teacher)';
    const inStudentGroup = seg0 === '(student)';
    const inSettings = seg0 === 'settings';
    const inFee = seg0 === 'fee';
    const inNotifications = seg0 === 'notifications';
    const inStudents = seg0 === 'students';

    console.log('[Route]', { seg0, role: profile?.role, user: !!user });

    if (!user || !profile) {
      if (!inAuthGroup) {
        console.log('[Route] No auth → sign-in');
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    if (inSettings || inFee || inNotifications || inStudents) {
      return;
    }

    if (inAuthGroup) {
      switch (profile.role) {
        case 'teacher':
          console.log('[Route] teacher → /(teacher)');
          router.replace('/(teacher)');
          break;
        case 'student':
          console.log('[Route] student → /(student)');
          router.replace('/(student)');
          break;
        default:
          router.replace('/(auth)/sign-in');
      }
      return;
    }

    if (profile.role === 'teacher' && !inTeacherGroup) {
      router.replace('/(teacher)');
    } else if (profile.role === 'student' && !inStudentGroup) {
      router.replace('/(student)');
    }

  // Only re-run when auth state changes, not when navigation changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.role, loading]);


  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false}} />
      <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="fee" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="students" options={{ headerShown: false }} />
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

  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      // Keep custom splash visible for at least 1.5s after fonts load
      const t = setTimeout(() => setSplashVisible(false), 1500);
      return () => clearTimeout(t);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <RootLayoutNav />
          <AppSplashScreen visible={splashVisible} />
          <StatusBar style="auto" />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}