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
    assigned_by?: string;
    created_at: string;
    classes?: { name: string };
    students?: { full_name: string };
    subjects?: { name: string };
    profiles?: { full_name: string };
}

export const useDiaryAssignments = (profile: any, student: any) => {
    const [assignments, setAssignments] = useState<DiaryAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);

            if (profile?.role === 'teacher' || profile?.role === 'admin') {
                // Step 1: Get enrolled student IDs (same as attendance)
                const { data: enrollmentsData, error: enrollError } = await supabase
                    .from('student_subject_enrollments')
                    .select('student_id, subject_id, class_id')
                    .eq('teacher_id', profile.id)
                    .eq('is_active', true);

                if (enrollError) {
                    console.error('Enrollments fetch error:', enrollError);
                    throw enrollError;
                }

                console.log("📚 Teacher enrollments:", enrollmentsData);

                if (!enrollmentsData || enrollmentsData.length === 0) {
                    console.log("ℹ️ No enrollments found");
                    setAssignments([]);
                    return;
                }

                // Get unique subject IDs
                const teacherSubjects = [...new Set(enrollmentsData.map(e => e.subject_id))];
                console.log("📖 Teacher subjects:", teacherSubjects);

                // Step 2: Fetch assignments with joins (like attendance does)
                const { data, error } = await supabase
                    .from('diary_assignments')
                    .select(`
                        *,
                        classes (name),
                        students (full_name),
                        subjects (name),
                        profiles:assigned_by (full_name)
                    `)
                    .in('subject_id', teacherSubjects)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                console.log("✅ Fetched assignments:", data?.length || 0);
                setAssignments(data || []);

            } else if (profile?.role === 'student' && student?.id) {
                // Step 1: Get student's enrolled subjects
                const { data: enrollmentsData, error: enrollError } = await supabase
                    .from('student_subject_enrollments')
                    .select('subject_id')
                    .eq('student_id', student.id)
                    .eq('is_active', true);

                if (enrollError) {
                    console.error('Student enrollments error:', enrollError);
                    throw enrollError;
                }

                console.log("📚 Student enrollments:", enrollmentsData);

                if (!enrollmentsData || enrollmentsData.length === 0) {
                    console.log("ℹ️ No enrollments found");
                    setAssignments([]);
                    return;
                }

                const enrolledSubjects = enrollmentsData.map(e => e.subject_id);
                console.log("📖 Enrolled subjects:", enrolledSubjects);

                // Step 2: Fetch assignments (individual OR class-wide for enrolled subjects)
                const { data, error } = await supabase
                    .from('diary_assignments')
                    .select(`
                        *,
                        classes (name),
                        students (full_name),
                        subjects (name),
                        profiles:assigned_by (full_name)
                    `)
                    .or(`student_id.eq.${student.id},and(class_id.eq.${student.class_id},subject_id.in.(${enrolledSubjects.join(',')}))`)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                console.log("✅ Fetched student assignments:", data?.length || 0);
                setAssignments(data || []);
            }
        } catch (error) {
            console.error('❌ Error fetching assignments:', error);
            setAssignments([]);
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