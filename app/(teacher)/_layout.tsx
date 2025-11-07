import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Redirect } from 'expo-router';
import {
    House as Home,
    Users,
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

    if (loading) {
        return null;
    }

    if (!user || !profile) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    if (profile.role !== 'teacher') {
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
                        paddingTop: 8,
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
                    options={{
                        title: 'Students',
                        // tabBarShowLabel: false,
                        tabBarIcon: ({ size, color }) => (
                            <Users size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}