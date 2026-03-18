// screens/AnalyticsScreen.tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { StudentAnalyticsView } from '../components/analytics/StudentAnalyticsView';
import { TeacherAnalyticsView } from '../components/analytics/TeacherAnalyticsView';
import TopSections from '@/src/components/common/TopSections';

export default function AnalyticsScreen() {
    const { profile } = useAuth();
    const { colors } = useTheme();

    const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin';
    const isSuperAdmin = profile?.role === 'superadmin';

    const [filterVisible, setFilterVisible] = useState(false);
    const [isFiltered, setIsFiltered] = useState(false);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <TopSections
                onFilterPress={isTeacher ? () => setFilterVisible(true) : undefined}
                isFiltered={isTeacher ? isFiltered : false}
            />
            {profile?.role === 'student' ? (
                <StudentAnalyticsView />
            ) : (
                <TeacherAnalyticsView
                    filterVisible={filterVisible}
                    onFilterClose={() => setFilterVisible(false)}
                    onFilterChange={setIsFiltered}
                    isSuperAdmin={isSuperAdmin}
                />
            )}
        </View>
    );
}