import { useEffect, useRef, useState } from 'react'; // useState kept for splashVisible
import { LogBox, AppState, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

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
import { DialogProvider } from '@/src/contexts/DialogContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import '@/src/constants/TextScaling';
import { registerDeviceForNotifications, setupNotificationHandlers, pendingNavigation } from '@/src/lib/notifications';
import * as Notifications from 'expo-notifications';
import { useLastNotificationResponse } from 'expo-notifications';
import { AppSplashScreen } from '@/src/components/common/AppSplashScreen';


SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // useLastNotificationResponse — fires when user taps a notification while app is in foreground
  const lastNotificationResponse = useLastNotificationResponse();

  useEffect(() => {
    setupNotificationHandlers();
  }, []);

  // Track which notification id we've already handled to prevent double-navigation
  const handledNotificationId = useRef<string | null>(null);

  // Refs so navigation callbacks always have the latest auth state
  const loadingRef = useRef(loading);
  const userRef = useRef(user);
  const profileRef = useRef(profile);
  loadingRef.current = loading;
  userRef.current = user;
  profileRef.current = profile;

  // Core handler — called from both the hook and the AppState fallback
  const handleNotifData = useRef((notifId: string, data: Record<string, any>, source: string) => {
    console.log(`[DEEPLINK][${source}] handleNotifData called`);
    console.log(`[DEEPLINK][${source}]   notifId =`, notifId);
    console.log(`[DEEPLINK][${source}]   data =`, JSON.stringify(data));
    console.log(`[DEEPLINK][${source}]   already handled =`, handledNotificationId.current === notifId);
    console.log(`[DEEPLINK][${source}]   loading =`, loadingRef.current, '| user =', !!userRef.current, '| role =', profileRef.current?.role);

    if (handledNotificationId.current === notifId) return;
    if (loadingRef.current) {
      console.log(`[DEEPLINK][${source}] Auth still loading — skipping (AppState will retry)`);
      return;
    }
    if (!userRef.current || !profileRef.current) {
      console.log(`[DEEPLINK][${source}] No auth — skipping`);
      return;
    }
    if (!data?.type) {
      handledNotificationId.current = notifId;
      return;
    }

    handledNotificationId.current = notifId;
    const { type, assignmentId } = data;
    console.log(`[DEEPLINK][${source}] Processing type =`, type, '| assignmentId =', assignmentId);

    const FEE_TYPES = ['fee_reminder', 'fee_paid', 'fee'];
    if (FEE_TYPES.includes(type)) {
      console.log(`[DEEPLINK][${source}] → /fee-status`);
      router.push('/fee-status' as any);
      return;
    }

    if (type === 'assignment_added') {
      if (profileRef.current.role === 'student') {
        console.log(`[DEEPLINK][${source}] → dairy, assignmentId =`, assignmentId);
        if (assignmentId) pendingNavigation.diaryAssignmentId = assignmentId;
        // Small delay to let the navigation stack settle on Android
        setTimeout(() => {
          console.log(`[DEEPLINK][${source}] Calling router.navigate to dairy`);
          router.navigate('/(student)/dairy' as any);
        }, 300);
      } else {
        console.log(`[DEEPLINK][${source}] Not a student — skipping`);
      }
      return;
    }

    const { lectureId } = data;
    if (type === 'lecture_added') {
      const role = profileRef.current.role;
      if (lectureId) pendingNavigation.lectureId = lectureId;
      setTimeout(() => {
        if (role === 'student') {
          router.navigate('/(student)/lectures' as any);
        } else {
          router.navigate('/(teacher)/lectures' as any);
        }
      }, 300);
      return;
    }

    if (type === 'timetable_added') {
      const role = profileRef.current.role;
      pendingNavigation.timetableEntry = true;
      setTimeout(() => {
        if (role === 'student') {
          router.navigate('/(student)/timetable' as any);
        } else {
          router.navigate('/(teacher)/timetable' as any);
        }
      }, 300);
      return;
    }

    if (type === 'quiz_added') {
      const role = profileRef.current.role;
      const { quizId } = data;
      if (quizId) pendingNavigation.quizId = quizId;
      setTimeout(() => {
        if (role === 'student') {
          router.navigate('/(student)/exams' as any);
        } else {
          router.navigate('/(teacher)/exams' as any);
        }
      }, 300);
      return;
    }

    if (type === 'quiz_marked') {
      const { resultId } = data;
      if (resultId) pendingNavigation.quizMarkedResultId = resultId;
      setTimeout(() => {
        router.navigate('/(student)/exams' as any);
      }, 300);
      return;
    }

    if (type === 'attendance_alert') {
      const role = profileRef.current.role;
      setTimeout(() => {
        if (role === 'student') {
          router.navigate('/(student)/attendance' as any);
        } else {
          router.navigate('/(teacher)/attendance' as any);
        }
      }, 300);
      return;
    }
  });

  // Path 1: foreground tap — useLastNotificationResponse
  useEffect(() => {
    if (!lastNotificationResponse) return;
    const notifId = lastNotificationResponse.notification.request.identifier;
    const data = lastNotificationResponse.notification.request.content.data as Record<string, any>;
    console.log('[DEEPLINK][hook] lastNotificationResponse fired, id =', notifId);
    handleNotifData.current(notifId, data, 'hook');
  }, [lastNotificationResponse, loading, user?.id, profile?.role]);

  // Path 2: background→foreground — AppState + getLastNotificationResponseAsync
  // On Android Expo Go, useLastNotificationResponse may not fire for this case.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      console.log('[DEEPLINK][appstate] AppState →', nextState);
      if (nextState !== 'active') return;

      // Re-hide system navigation bar every time app comes to foreground
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');
      }

      const response = await Notifications.getLastNotificationResponseAsync();
      if (!response) {
        console.log('[DEEPLINK][appstate] No last notification response');
        return;
      }
      const notifId = response.notification.request.identifier;
      const data = response.notification.request.content.data as Record<string, any>;
      console.log('[DEEPLINK][appstate] Got last notification, id =', notifId, '| data =', JSON.stringify(data));
      handleNotifData.current(notifId, data, 'appstate');
    });
    return () => sub.remove();
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
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');
      }
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
          <DialogProvider>
            <RootLayoutNav />
            <AppSplashScreen visible={splashVisible} />
            <StatusBar style="auto" />
          </DialogProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}