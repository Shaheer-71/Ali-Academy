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
            if (!profile) return setAssignments([]);

            // -------------------- TEACHER --------------------
            if (profile.role === "teacher") {
                // 1️⃣ Get teacher's active class-subject pairs
                const { data: teacherEnrollments, error: teacherErr } = await supabase
                    .from("teacher_subject_enrollments")
                    .select("class_id, subject_id")
                    .eq("teacher_id", profile.id)
                    .eq("is_active", true);

                if (teacherErr) throw teacherErr;
                if (!teacherEnrollments || teacherEnrollments.length === 0) return setAssignments([]);

                // 2️⃣ Build OR expression for class-subject combinations
                const orExpr = teacherEnrollments
                    .map(p => `and(class_id.eq.${p.class_id},subject_id.eq.${p.subject_id})`)
                    .join(',');

                // 3️⃣ Fetch assignments for teacher's class-subject pairs
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

            // -------------------- STUDENT --------------------
            if (profile.role === "student" && profile?.id) {
                // 1️⃣ Get student's active class-subject enrollments
                const { data: studentEnrollments, error: enrollErr } = await supabase
                    .from("student_subject_enrollments")
                    .select("class_id, subject_id")
                    .eq("student_id", profile?.id)
                    .eq("is_active", true);

                if (enrollErr) throw enrollErr;
                if (!studentEnrollments || studentEnrollments.length === 0) return setAssignments([]);

                // 2️⃣ Separate: 
                // - assignments for this student
                // - class-wide assignments (student_id IS NULL) but only for enrolled class+subject
                const classWideOrExpr = studentEnrollments
                    .map(p => `and(class_id.eq.${p.class_id},subject_id.eq.${p.subject_id},student_id.is.null)`)
                    .join(',');

                // 3️⃣ Fetch assignments assigned specifically to student
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

                // 4️⃣ Fetch class-wide assignments for student's enrolled subjects
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

                // 5️⃣ Combine and sort by newest first
                const combined = [...(personalAssignments || []), ...classAssignments]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setAssignments(combined);
                return;
            }

            setAssignments([]);
        } catch (err: any) {
            console.error("❌ fetchAssignments error:", err);
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
            console.error('❌ Error refreshing:', error);
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