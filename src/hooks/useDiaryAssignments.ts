// hooks/useDiaryAssignments.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Alert } from 'react-native';

interface DiaryAssignment {
    id: string;
    title: string;
    description: string;
    due_date: string;
    file_url?: string;
    class_id?: string;
    student_id?: string;
    subject_id?: string;
    created_at: string;
    classes?: { name: string };
    students?: { full_name: string };
}

export const useDiaryAssignments = (profile: any, student: any) => {
    const [assignments, setAssignments] = useState<DiaryAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAssignments = useCallback(async () => {
        try {
            let query = supabase
                .from('diary_assignments')
                .select(`
        *,
        classes (name),
        students (full_name)
      `)
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            let filteredData = data || [];
            if (profile?.role === "student" && student?.class_id && student?.id) {
                filteredData = filteredData.filter(item =>
                    item.class_id === student.class_id || item.student_id === student.id
                );
            }

            setAssignments(filteredData);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoading(false);
        }
    }, [profile, student]);

    const deleteAssignment = useCallback(async (assignment: DiaryAssignment) => {
        return new Promise((resolve) => {
            Alert.alert(
                'Delete Assignment',
                'Are you sure you want to delete this assignment?',
                [
                    {
                        text: 'Cancel',
                        onPress: () => resolve(false),
                        style: 'cancel',
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                const { error } = await supabase
                                    .from('diary_assignments')
                                    .delete()
                                    .eq('id', assignment.id);

                                if (error) throw error;
                                Alert.alert('Success', 'Assignment deleted successfully');
                                await fetchAssignments();
                                resolve(true);
                            } catch (error: any) {
                                Alert.alert('Error', error.message);
                                resolve(false);
                            }
                        },
                    },
                ],
            );
        });
    }, [fetchAssignments]);

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await fetchAssignments();
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchAssignments]);

    return {
        assignments,
        setAssignments,
        loading,
        refreshing,
        fetchAssignments,
        deleteAssignment,
        handleRefresh,
    };
};

