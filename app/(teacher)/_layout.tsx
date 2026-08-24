import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import * as NavigationBar from 'expo-navigation-bar';
import {
    House as Home,
    ClipboardCheck,
    BookOpen,
    BarChart3,
    Calendar,
    GraduationCap,
    NotepadText,
} from 'lucide-react-native';
import FloatingBottomNav from '@/src/components/common/FloatingBottomNav';
import { tabSlideTransition } from '@/src/utils/tabTransitions';

export default function TeacherLayout() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    const isAllowed = profile?.role === 'teacher' || profile?.role === 'superadmin';

    useEffect(() => {
        if (loading) return;
        if (!user || !profile || !isAllowed) {
            router.replace('/(auth)/sign-in');
        }
    }, [loading, user?.id, profile?.role]);

    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setVisibilityAsync('hidden');
            NavigationBar.setBehaviorAsync('overlay-swipe');
        }
    }, []);

    if (loading || !user || !profile || !isAllowed) {
        return null;
    }

    return (
        <>
            <Tabs
                tabBar={(props) => <FloatingBottomNav {...props} />}
                screenOptions={{
                    headerShown: false,
                    ...tabSlideTransition,
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

                <Tabs.Screen name="profile" options={{ href: null }} />
                <Tabs.Screen name="settings" options={{ href: null }} />
            </Tabs>
        </>
    );
}