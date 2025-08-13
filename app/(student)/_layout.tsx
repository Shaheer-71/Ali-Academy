import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Redirect } from 'expo-router';
import {
    House as Home,
    ClipboardCheck,
    BookOpen,
    BarChart3,
    Calendar,
    GraduationCap,
    NotepadText,
} from 'lucide-react-native';

export default function StudentLayout() {
    const { user, profile, loading } = useAuth();
    const { colors } = useTheme();

    if (loading) {
        return null;
    }

    if (!user || !profile) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    if (profile.role !== 'student') {
        return <Redirect href="/(auth)/sign-in" />;
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
                        paddingTop: 4,
                        position: 'absolute',
                    },
                    tabBarLabelStyle: {
                        fontSize: 8,
                        fontFamily: 'Inter-Medium',
                        marginTop: 4,
                    },
                }}>

                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ size, color }) => (
                            <Home size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="timetable"
                    options={{
                        title: 'Timetable',
                        tabBarIcon: ({ size, color }) => (
                            <Calendar size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="exams"
                    options={{
                        title: 'Exams',
                        tabBarIcon: ({ size, color }) => (
                            <GraduationCap size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="lectures"
                    options={{
                        title: 'Lectures',
                        tabBarIcon: ({ size, color }) => (
                            <BookOpen size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="dairy"
                    options={{
                        title: 'Diary',
                        tabBarIcon: ({ size, color }) => (
                            <NotepadText size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="analytics"
                    options={{
                        title: 'Analytics',
                        tabBarIcon: ({ size, color }) => (
                            <BarChart3 size={size} color={color} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="attendance"
                    options={{
                        title: 'Attendance',
                        tabBarIcon: ({ size, color }) => (
                            <ClipboardCheck size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}