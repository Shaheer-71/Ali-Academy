// hooks/useDiaryAssignments.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useDialog } from '@/src/contexts/DialogContext';
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
    const { showError: dialogShowError, showSuccess, showConfirm } = useDialog();
    const [assignments, setAssignments] = useState<DiaryAssignment[]>([]);
    const [studentsMap, setStudentsMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStudentNames = useCallback(async (list: any[]) => {
        const ids = [...new Set(list.flatMap((a: any) => a.student_ids || []))];
        if (ids.length === 0) { setStudentsMap({}); return; }
        const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        const map: Record<string, string> = {};
        data?.forEach((p: any) => { map[p.id] = p.full_name; });
        setStudentsMap(map);
    }, []);

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            if (!profile) {
                setAssignments([]);
                return;
            }

            // SUPERADMIN — sees everything
            if (profile.role === "superadmin") {
                const { data: allAssignments, error: allErr } = await supabase
                    .from("diary_assignments")
                    .select(`
                        *,
                        classes(name),
                        students(full_name),
                        subjects(name),
                        profiles:assigned_by(full_name)
                    `)
                    .eq("is_deleted", false)
                    .order("created_at", { ascending: false });

                if (allErr) throw allErr;

                const data = allAssignments || [];
                setAssignments(data);
                await fetchStudentNames(data);
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
                    .eq("is_deleted", false)
                    .order("created_at", { ascending: false });

                if (assignErr) throw assignErr;

                const data = assignmentsData || [];
                setAssignments(data);
                await fetchStudentNames(data);
                return;
            }

            // STUDENT
            if (profile.role === "student" && student?.id) {
                const { data: studentEnrollments, error: enrollErr } = await supabase
                    .from("student_subject_enrollments")
                    .select("class_id, subject_id")
                    .eq("student_id", student?.id)
                    .eq("is_active", true);

                if (enrollErr) throw enrollErr;

                if (!studentEnrollments || studentEnrollments.length === 0) {
                    setAssignments([]);
                    return;
                }

                // Match class-wide entries: same class + (same subject OR no subject set) + not targeted at a specific student
                const classIds = [...new Set(studentEnrollments.map(p => p.class_id))];
                const classWideOrExpr = classIds
                    .map(cid => `and(class_id.eq.${cid},student_id.is.null)`)
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
                    .contains("student_ids", [student?.id])
                    .eq("is_deleted", false)
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
                        .eq("is_deleted", false)
                        .filter('student_ids', 'eq', '{}')
                        .order("created_at", { ascending: false });

                    if (classErr) throw classErr;
                    classAssignments = data || [];
                }

                const seen = new Set<string>();
                const combined = [...(personalAssignments || []), ...classAssignments]
                    .filter(a => {
                        if (seen.has(a.id)) return false;
                        seen.add(a.id);
                        return true;
                    })
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                setAssignments(combined);
                await fetchStudentNames(combined);
                return;
            }

            setAssignments([]);
        } catch (err: any) {
            console.warn("❌ fetchAssignments error:", err);

            if (showError) {
                showError(err, handleAssignmentFetchError);
            } else {
                dialogShowError('Error', 'Failed to load assignments. Please try again.');
            }

            setAssignments([]);
        } finally {
            setLoading(false);
        }
    }, [profile, student, showError]);

    const deleteAssignment = useCallback(async (assignment: DiaryAssignment) => {
        return new Promise((resolve) => {
            showConfirm({
                title: 'Delete Assignment',
                message: 'Are you sure you want to delete this assignment?',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                destructive: true,
                onCancel: () => resolve(false),
                onConfirm: async () => {
                    try {
                        const { error } = await supabase
                            .from('diary_assignments')
                            .update({ is_deleted: true })
                            .eq('id', assignment.id);

                        if (error) throw error;

                        showSuccess('Success', 'Assignment deleted successfully');
                        await fetchAssignments();
                        resolve(true);
                    } catch (error: any) {
                        console.warn('❌ Delete assignment error:', error);

                        if (showError) {
                            showError(error, handleAssignmentDeleteError);
                        } else {
                            dialogShowError('Error', error.message || 'Failed to delete assignment');
                        }

                        resolve(false);
                    }
                },
            });
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
        studentsMap,
        loading,
        refreshing,
        fetchAssignments,
        deleteAssignment,
        handleRefresh,
    };
};