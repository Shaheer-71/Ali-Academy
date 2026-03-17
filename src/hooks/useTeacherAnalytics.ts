// hooks/useTeacherAnalytics.ts - FIXED TYPE ISSUES
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';
import { StudentPerformance, ClassAnalytics, Class } from '../types/analytics';

// Define proper types for Supabase responses
type StudentWithClass = {
    id: string;
    full_name: string;
    roll_number: string | null;
    class_id: string;
    classes: {
        id: string;
        name: string;
    };
};


export const useTeacherAnalytics = (profileId: string | undefined, selectedClass: string = 'all', selectedSubject: string = 'all', isSuperAdmin: boolean = false) => {
    const [studentPerformances, setStudentPerformances] = useState<StudentPerformance[]>([]);
    const [classAnalytics, setClassAnalytics] = useState<ClassAnalytics[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refetch = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    useEffect(() => {
        if (!profileId) {
            setLoading(false);
            return;
        }

        const fetchAllData = async () => {
            try {
                setLoading(true);
                setError(null);

                let classIDs: string[] = [];
                let subjectIDs: string[] = [];
                const subjectsMap = new Map<string, string>();

                if (isSuperAdmin) {
                    // Superadmin: pull all classes and all subjects directly
                    const [{ data: allClasses, error: allClassesErr }, { data: allSubjects, error: allSubjectsErr }] = await Promise.all([
                        supabase.from('classes').select('id, name').order('name'),
                        supabase.from('subjects').select('id, name').order('name'),
                    ]);
                    if (allClassesErr) throw allClassesErr;
                    if (allSubjectsErr) throw allSubjectsErr;
                    classIDs = (allClasses || []).map((c: any) => c.id);
                    subjectIDs = (allSubjects || []).map((s: any) => s.id);
                    // Build subjects list for filter
                    const relevantSubjects = selectedClass === 'all'
                        ? (allSubjects || [])
                        : (allSubjects || []); // show all subjects regardless for superadmin
                    relevantSubjects.forEach((s: any) => subjectsMap.set(s.id, s.name));
                    setSubjects(relevantSubjects.map((s: any) => ({ id: s.id, name: s.name })));
                } else {
                    const { data: classesIDData, error: classesIDError } = await supabase
                        .from('teacher_subject_enrollments')
                        .select('class_id, subject_id, subjects!inner(id, name)')
                        .eq('teacher_id', profileId);

                    if (classesIDError) {
                        console.warn('Enrollments fetch error:', classesIDError);
                        throw new Error('Unable to load your class assignments. Please check your internet connection and try again.');
                    }

                    classIDs = [...new Set(classesIDData?.map(item => item.class_id) || [])];
                    subjectIDs = [...new Set(classesIDData?.map(item => item.subject_id) || [])];

                    const relevantEnrollments = selectedClass === 'all'
                        ? (classesIDData || [])
                        : (classesIDData || []).filter((item: any) => item.class_id === selectedClass);
                    relevantEnrollments.forEach((item: any) => {
                        subjectsMap.set(item.subject_id, (item.subjects as any)?.name || item.subject_id);
                    });
                    setSubjects(Array.from(subjectsMap.entries()).map(([id, name]) => ({ id, name })));
                }

                // Narrow to the selected subject when one is explicitly chosen
                const effectiveSubjectIDs = selectedSubject !== 'all' ? [selectedSubject] : subjectIDs;

                // For superadmin, get all students in those classes directly (no enrollment filter)
                let studentsenrolledId: string[] = [];
                if (!isSuperAdmin) {
                    const { data: studentIDData } = await supabase
                        .from('student_subject_enrollments')
                        .select('student_id, class_id')
                        .in('class_id', classIDs)
                        .in('subject_id', effectiveSubjectIDs);
                    studentsenrolledId = studentIDData?.map(item => item.student_id) || [];
                }

                const { data: classesData, error: classesError } = await supabase
                    .from('classes')
                    .select('*')
                    .in('id', classIDs)
                    .order('name');

                if (classesError) {
                    console.warn('Classes fetch error:', classesError);
                    throw new Error('Unable to load class information. Please try refreshing the page.');
                }

                const teacherClasses = (classesData || []) as Class[];
                setClasses(teacherClasses);

                if (teacherClasses.length === 0) {
                    setError('No classes assigned to you yet.');
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 2: Determine which classes to analyze
                let classIds: string[] = [];
                if (selectedClass === 'all') {
                    classIds = teacherClasses.map(c => c.id);
                } else {
                    const selectedClassExists = teacherClasses.find(c => c.id === selectedClass);
                    if (selectedClassExists) {
                        classIds = [selectedClass];
                    } else {
                            classIds = teacherClasses.map(c => c.id);
                    }
                }


                if (classIds.length === 0) {
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 3: Fetch students from selected classes
                let studentsQuery = supabase
                    .from('students')
                    .select(`
                        id,
                        full_name,
                        roll_number,
                        class_id,
                        classes!inner(id, name)
                    `)
                    .in('class_id', classIds)
                    .eq('is_deleted', false);

                // Regular teachers: restrict to enrolled students only
                if (!isSuperAdmin && studentsenrolledId.length > 0) {
                    studentsQuery = studentsQuery.in('id', studentsenrolledId);
                }

                const { data: studentsRaw, error: studentsError } = await studentsQuery;

                if (studentsError) {
                    console.warn('Students fetch error:', studentsError);
                    throw new Error('Unable to load student information from the selected classes. Please try again.');
                }

                // CRITICAL FIX: Transform the data to ensure correct structure
                const students = (studentsRaw as any[])?.map((student: any) => ({
                    id: student.id,
                    full_name: student.full_name,
                    roll_number: student.roll_number,
                    class_id: student.class_id,
                    classes: {
                        id: student.classes.id,
                        name: student.classes.name
                    }
                })) || [] as StudentWithClass[];


                if (students.length === 0) {
                    setStudentPerformances([]);
                    setClassAnalytics([]);
                    setLoading(false);
                    return;
                }

                // Step 4: Batch-fetch all performance data (3 queries instead of 3N)
                const allStudentIds = students.map(s => s.id);

                const [
                    { data: allAttendanceData },
                    { data: allQuizResultsData },
                    { data: allQuizzesData },
                ] = await Promise.all([
                    supabase
                        .from('attendance')
                        .select('student_id, status')
                        .in('student_id', allStudentIds),
                    supabase
                        .from('quiz_results')
                        .select('student_id, percentage, quizzes!inner(class_id, subject_id)')
                        .in('student_id', allStudentIds),
                    supabase
                        .from('quizzes')
                        .select('id, class_id, subject_id')
                        .in('class_id', classIds)
                        .in('subject_id', effectiveSubjectIDs),
                ]);

                // Build lookup maps — filter by this teacher's classes AND effective subjects only
                const classIdSet = new Set(classIds);
                const subjectIdSet = new Set(effectiveSubjectIDs);

                const attendanceMap: Record<string, { total: number; present: number }> = {};
                (allAttendanceData || []).forEach((r: any) => {
                    if (!attendanceMap[r.student_id]) attendanceMap[r.student_id] = { total: 0, present: 0 };
                    attendanceMap[r.student_id].total++;
                    if (r.status === 'present') attendanceMap[r.student_id].present++;
                });

                const quizResultsMap: Record<string, number[]> = {};
                (allQuizResultsData || []).forEach((r: any) => {
                    // Only count results for quizzes in THIS teacher's classes AND subjects
                    if (!classIdSet.has(r.quizzes?.class_id)) return;
                    if (!subjectIdSet.has(r.quizzes?.subject_id)) return;
                    if (!quizResultsMap[r.student_id]) quizResultsMap[r.student_id] = [];
                    quizResultsMap[r.student_id].push(r.percentage || 0);
                });

                const quizCountByClass: Record<string, number> = {};
                (allQuizzesData || []).forEach((q: any) => {
                    quizCountByClass[q.class_id] = (quizCountByClass[q.class_id] || 0) + 1;
                });

                const performanceData: StudentPerformance[] = students.map(student => {
                    const att = attendanceMap[student.id] || { total: 0, present: 0 };
                    const attendance_rate = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
                    const percentages = quizResultsMap[student.id] || [];
                    const average_grade = percentages.length > 0 ?
                        Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length) : 0;
                    return {
                        id: student.id,
                        full_name: student.full_name,
                        roll_number: student.roll_number || 'N/A',
                        attendance_rate,
                        average_grade,
                        assignments_completed: percentages.length,
                        total_assignments: quizCountByClass[student.class_id] || 0,
                        class_name: student.classes.name,
                        subject_name: selectedSubject !== 'all' ? (subjectsMap.get(selectedSubject) || undefined) : undefined,
                    };
                });

                setStudentPerformances(performanceData);

                // Step 5: Calculate class analytics
                const analyticsData: ClassAnalytics[] = [];

                for (const classId of classIds) {
                    const className = teacherClasses.find(c => c.id === classId)?.name || 'Unknown Class';
                    const classStudents = students.filter(s => s.class_id === classId);
                    const classPerformances = performanceData.filter(p =>
                        classStudents.some(s => s.id === p.id)
                    );

                    const total_students = classStudents.length;
                    const average_attendance = classPerformances.length > 0 ?
                        Math.round(classPerformances.reduce((sum, p) => sum + p.attendance_rate, 0) / classPerformances.length) : 0;
                    const average_grade = classPerformances.length > 0 ?
                        Math.round(classPerformances.reduce((sum, p) => sum + p.average_grade, 0) / classPerformances.length) : 0;

                    const topPerformer = classPerformances.length > 0 ?
                        classPerformances.reduce((top, current) =>
                            current.average_grade > top.average_grade ? current : top
                        ) : null;

                    const classAnalytic: ClassAnalytics = {
                        class_id: classId,
                        class_name: className,
                        total_students,
                        average_attendance,
                        average_grade,
                        top_performer: topPerformer?.full_name || 'N/A'
                    };

                    analyticsData.push(classAnalytic);
                }

                setClassAnalytics(analyticsData);


            } catch (err) {
                console.warn('Error in fetchAllData:', err);
                setError(err instanceof Error ? err.message : 'Unable to load analytics data. Please check your internet connection and try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [profileId, selectedClass, selectedSubject, isSuperAdmin, refreshKey]);

    return {
        studentPerformances,
        classAnalytics,
        classes,
        subjects,
        loading,
        error,
        refetch
    };
};