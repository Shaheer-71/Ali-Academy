// screens/AnalyticsScreen.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import { StudentAnalyticsView } from '../analytics/StudentAnalyticsView';
import { TeacherAnalyticsView } from '../analytics/TeacherAnalyticsView';

export default function AnalyticsScreen() {
    const { profile } = useAuth();

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
            {profile?.role === 'student' ? (
                <StudentAnalyticsView />
            ) : (
                <TeacherAnalyticsView />
            )}
        </SafeAreaView>
    );
}