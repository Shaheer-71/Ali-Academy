import { useEffect, useRef, useState } from 'react';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);
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
import { registerDeviceForNotifications, setupNotificationHandlers, pendingNavigation } from '@/src/lib/notifications';
import * as Notifications from 'expo-notifications';
import { AppSplashScreen } from '@/src/components/common/AppSplashScreen';


SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();


  // Setup notification handlers ONCE on mount
  useEffect(() => {
    setupNotificationHandlers();

    // Cold-start: app was killed and opened by tapping a notification
    console.log('[DEEPLINK] Checking cold-start notification...');
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (!response) {
        console.log('[DEEPLINK] Cold-start: no pending notification response');
        return;
      }
      const data = response.notification.request.content.data as Record<string, any>;
      console.log('[DEEPLINK] Cold-start: notification data =', JSON.stringify(data));

      if (!data?.type) {
        console.log('[DEEPLINK] Cold-start: no type in data, skipping');
        return;
      }

      const FEE_TYPES = ['fee_reminder', 'fee_paid', 'fee'];
      if (FEE_TYPES.includes(data.type)) {
        console.log('[DEEPLINK] Cold-start: fee notification → pushing /fee-status');
        router.push('/fee-status' as any);
        return;
      }

      if (data.type === 'assignment_added' && data.assignmentId) {
        console.log('[DEEPLINK] Cold-start: diary notification → storing pendingNavigation, assignmentId =', data.assignmentId);
        // Cold start: store intent only — auth routing hasn't finished yet.
        // The segments effect below will navigate to dairy once auth completes.
        pendingNavigation.diaryAssignmentId = data.assignmentId;
        pendingNavigation.coldStartDiary = true;
      } else {
        console.log('[DEEPLINK] Cold-start: unhandled type =', data.type);
      }
    });

    // Warm-start: app is open (foreground or background) and user taps a notification.
    // Using useRouter() here keeps navigation inside the React tree — reliable on Android.
    console.log('[DEEPLINK] Registering warm-start tap listener...');
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, any>;
      console.log('[DEEPLINK] Warm-start: notification tapped, data =', JSON.stringify(data));

      if (!data?.type) {
        console.log('[DEEPLINK] Warm-start: no type in data, skipping');
        return;
      }

      const FEE_TYPES = ['fee_reminder', 'fee_paid', 'fee'];
      if (FEE_TYPES.includes(data.type)) {
        console.log('[DEEPLINK] Warm-start: fee notification → pushing /fee-status');
        router.push('/fee-status' as any);
        return;
      }

      if (data.type === 'assignment_added' && data.assignmentId) {
        console.log('[DEEPLINK] Warm-start: diary notification → navigating to dairy, assignmentId =', data.assignmentId);
        pendingNavigation.diaryAssignmentId = data.assignmentId;
        router.navigate('/(student)/dairy' as any);
      } else {
        console.log('[DEEPLINK] Warm-start: unhandled type =', data.type);
      }
    });

    return () => {
      console.log('[DEEPLINK] Cleaning up tap listener');
      tapSub.remove();
    };
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
        case 'superadmin':
          console.log('[Route] teacher/superadmin → /(teacher)');
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

    if ((profile.role === 'teacher' || profile.role === 'superadmin') && !inTeacherGroup) {
      router.replace('/(teacher)');
    } else if (profile.role === 'student' && !inStudentGroup) {
      router.replace('/(student)');
    }

  // Only re-run when auth state changes, not when navigation changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.role, loading]);

  // Cold-start deep link: once auth routing lands the student in (student) group,
  // navigate to the dairy tab so the diary screen can open the pending assignment.
  useEffect(() => {
    console.log('[DEEPLINK] Cold-start segments effect fired:', {
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      role: profile?.role,
      seg0: segments[0],
      coldStartDiary: pendingNavigation.coldStartDiary,
      diaryAssignmentId: pendingNavigation.diaryAssignmentId,
    });

    if (loading || !user || !profile) return;
    if (profile.role !== 'student') return;
    if (segments[0] !== '(student)') return;
    if (!pendingNavigation.coldStartDiary) return;

    console.log('[DEEPLINK] Cold-start: navigating to dairy tab');
    pendingNavigation.coldStartDiary = false; // consume so it doesn't re-fire
    router.navigate('/(student)/dairy' as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, loading, user?.id, profile?.role]);


  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false}} />
      <Stack.Screen name="(teacher)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="fee" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="students" options={{ headerShown: false }} />
      <Stack.Screen name="fee-status" options={{ headerShown: false }} />
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