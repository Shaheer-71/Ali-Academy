import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Redirect } from 'expo-router';
import { House as Home, Users, ClipboardCheck, BookOpen, NotebookPen , NotepadText} from 'lucide-react-native';

export default function TabLayout() {
  const { user, profile, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return null;
  }

  if (!user || !profile) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Different tabs based on user role
  const isTeacher = profile.role === 'teacher';
  const isParentOrStudent = profile.role === 'parent' || profile.role === 'student';

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            // borderTopLeftRadius: 20,
            // borderTopRightRadius: 20,
            borderTopColor: colors.border,
            paddingTop: 4,
            // paddingBottom: 8,
            position: 'absolute',
            // overflow: 'hidden',
          },
          tabBarLabelStyle: {
            fontSize: 8,
            fontFamily: 'Inter-Medium',
            marginTop: 4,
          },
        }}>

        {/* Home - Available to all roles */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />

        {/* Students - Only for Teachers */}
        {isTeacher && (
          <Tabs.Screen
            name="students"
            options={{
              title: 'Students',
              tabBarIcon: ({ size, color }) => (
                <Users size={size} color={color} />
              ),
            }}
          />
        )}

        {/* Attendance - Only for Teachers */}
        {isTeacher && (
          <Tabs.Screen
            name="attendance"
            options={{
              title: 'Attendance',
              tabBarIcon: ({ size, color }) => (
                <ClipboardCheck size={size} color={color} />
              ),
            }}
          />
        )}

        {/* Lectures - Available to all roles */}
        <Tabs.Screen
          name="lectures"
          options={{
            title: 'Lectures',
            tabBarIcon: ({ size, color }) => (
              <BookOpen size={size} color={color} />
            ),
          }}
        />

        {/* Diary - Available to all roles */}
        <Tabs.Screen
          name="dairy"
          options={{
            title: 'Diary',
            tabBarIcon: ({ size, color }) => (
              <NotepadText size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}