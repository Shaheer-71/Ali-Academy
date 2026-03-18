import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    House as Home,
    ClipboardCheck,
    BookOpen,
    BarChart3,
    Calendar,
    GraduationCap,
    NotepadText,
} from 'lucide-react-native';

export default function TeacherLayout() {
    const { user, profile, loading } = useAuth();
    const { colors } = useTheme();
    const router = useRouter();
    const { bottom: bottomInset } = useSafeAreaInsets();

    const isAllowed = profile?.role === 'teacher' || profile?.role === 'superadmin';

    useEffect(() => {
        if (loading) return;
        if (!user || !profile || !isAllowed) {
            router.replace('/(auth)/sign-in');
        }
    }, [loading, user?.id, profile?.role]);

    if (loading || !user || !profile || !isAllowed) {
        return null;
    }

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
                        borderTopColor: colors.border,
                        paddingTop: 8,
                        paddingBottom: Platform.OS === 'android' ? Math.max(bottomInset, 10) : bottomInset,
                        height: Platform.OS === 'android' ? 60 + Math.max(bottomInset, 10) : 60 + bottomInset,
                        position: 'absolute',
                    },
                    tabBarLabelStyle: {
                        fontSize: 8,
                        fontFamily: 'Inter-Medium',
                    },
                }}>

                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <Home size={size} color={color} />
                        ),
                    }}
                />



                <Tabs.Screen
                    name="attendance"
                    options={{
                        title: 'Attendance',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <ClipboardCheck size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="exams"
                    options={{
                        title: 'Exams',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <GraduationCap size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="timetable"
                    options={{
                        title: 'Timetable',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <Calendar size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="lectures"
                    options={{
                        title: 'Lectures',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <BookOpen size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="dairy"
                    options={{
                        title: 'Diary',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <NotepadText size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="analytics"
                    options={{
                        title: 'Analytics',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <BarChart3 size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="students"
                    options={{ href: null }}
                />
            </Tabs>
        </>
    );
}