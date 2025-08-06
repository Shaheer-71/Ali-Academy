import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { 
  Home, 
  Users, 
  ClipboardCheck, 
  BookOpen, 
  NotebookPen, 
  BarChart3,
  Settings 
} from 'lucide-react-native';

export default function TabLayout() {
  const { user, profile, loading } = useAuth();

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
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#274d71',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
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
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ size, color }) => (
            <NotebookPen size={size} color={color} />
          ),
        }}
      />

      {/* Dashboard - Only for Parents/Students */}
      {isParentOrStudent && (
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ size, color }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
      )}

      {/* Settings - Available to all roles */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}