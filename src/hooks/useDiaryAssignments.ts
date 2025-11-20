// hooks/useDiaryAssignments.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Alert } from 'react-native';
import {
    handleAssignmentFetchError,
    handleAssignmentDeleteError
} from '@/src/utils/errorHandler/diaryErrorHandler';

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

export const useDiaryAssignments = (
    profile: any,
    student: any,
    showError?: (error: any, handler?: (error: any) => any) => void
) => {
    const [assignments, setAssignments] = useState<DiaryAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            if (!profile) {
                setAssignments([]);
                return;
            }

            // TEACHER
            if (profile.role === "teacher") {
                const { data: teacherEnrollments, error: teacherErr } = await supabase
                    .from("teacher_subject_enrollments")
                    .select("class_id, subject_id")
                    .eq("teacher_id", profile.id)
                    .eq("is_active", true);

                if (teacherErr) throw teacherErr;

                if (!teacherEnrollments || teacherEnrollments.length === 0) {
                    setAssignments([]);
                    return;
                }

                const orExpr = teacherEnrollments
                    .map(p => `and(class_id.eq.${p.class_id},subject_id.eq.${p.subject_id})`)
                    .join(',');

                const { data: assignmentsData, error: assignErr } = await supabase
                    .from("diary_assignments")
                    .select(`
            *,
            classes(name),
            students(full_name),
            subjects(name),
            profiles:assigned_by(full_name)
          `)
                    .or(orExpr)
                    .order("created_at", { ascending: false });

                if (assignErr) throw assignErr;

                setAssignments(assignmentsData || []);
                return;
            }

            // STUDENT
            if (profile.role === "student" && profile?.id) {
                const { data: studentEnrollments, error: enrollErr } = await supabase
                    .from("student_subject_enrollments")
                    .select("class_id, subject_id")
                    .eq("student_id", profile?.id)
                    .eq("is_active", true);

                if (enrollErr) throw enrollErr;

                if (!studentEnrollments || studentEnrollments.length === 0) {
                    setAssignments([]);
                    return;
                }

                const classWideOrExpr = studentEnrollments
                    .map(p => `and(class_id.eq.${p.class_id},subject_id.eq.${p.subject_id},student_id.is.null)`)
                    .join(',');

                const { data: personalAssignments, error: personalErr } = await supabase
                    .from("diary_assignments")
                    .select(`
            *,
            classes(name),
            students(full_name),
            subjects(name),
            profiles:assigned_by(full_name)
          `)
                    .eq("student_id", profile?.id)
                    .order("created_at", { ascending: false });

                if (personalErr) throw personalErr;

                let classAssignments: DiaryAssignment[] = [];
                if (classWideOrExpr) {
                    const { data, error: classErr } = await supabase
                        .from("diary_assignments")
                        .select(`
              *,
              classes(name),
              students(full_name),
              subjects(name),
              profiles:assigned_by(full_name)
            `)
                        .or(classWideOrExpr)
                        .order("created_at", { ascending: false });

                    if (classErr) throw classErr;
                    classAssignments = data || [];
                }

                const combined = [...(personalAssignments || []), ...classAssignments]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setAssignments(combined);
                return;
            }

            setAssignments([]);
        } catch (err: any) {
            console.warn("❌ fetchAssignments error:", err);

            if (showError) {
                showError(err, handleAssignmentFetchError);
            } else {
                Alert.alert('Error', 'Failed to load assignments. Please try again.');
            }

            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [profile, student, showError]);

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
                                console.warn('❌ Delete assignment error:', error);

                                if (showError) {
                                    showError(error, handleAssignmentDeleteError);
                                } else {
                                    Alert.alert('Error', error.message || 'Failed to delete assignment');
                                }

                                resolve(false);
                            }
                        },
                    },
                ],
            );
        });
    }, [fetchAssignments, showError]);

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await fetchAssignments();
        } catch (error) {
            console.warn('❌ Error refreshing:', error);

            if (showError) {
                showError(error, handleAssignmentFetchError);
            }
        } finally {
            setRefreshing(false);
        }
    }, [fetchAssignments, showError]);

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