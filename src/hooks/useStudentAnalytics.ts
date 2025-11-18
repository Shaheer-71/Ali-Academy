// hooks/useStudentAnalytics.ts - DEFINITIVE TYPE FIX
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { StudentAnalytics, QuizResult, Student, Subject } from '../types/analytics';

type QuizResultWithSubject = {
    percentage: number | null;
    marks_obtained: number | null;
    total_marks: number;
    created_at: string;
    quizzes: {
        title: string;
        subject_id: string;
        class_id: string;
        subjects: {
            name: string;
        };
    };
};

type SubjectQuizData = {
    subject_id: string;
    subjects: {
        name: string;
    };
};

export const useStudentAnalytics = (profileId: string | undefined) => {
    const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profileId) {
            setLoading(false);
            return;
        }

        const fetchStudentAnalytics = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get the profile data
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('email, id')
                    .eq('id', profileId)
                    .single();

                if (profileError) {
                    console.warn('Profile error:', profileError);
                    throw new Error('Unable to load your profile. Please try signing in again.');
                }

                // Find student record by email
                const { data: studentData, error: studentError } = await supabase
                    .from('students')
                    .select(`
                        id,
                        full_name,
                        class_id,
                        email,
                        classes!inner(id, name)
                    `)
                    .eq('id', profileData.id)
                    .eq('is_deleted', false)
                    .single();

                console.log("HELLO : ", studentData)


                if (studentError) {
                    console.warn('Student error:', studentError);
                    throw new Error('Your student record could not be found. Please contact your class teacher or administrator.');
                }

                const student = studentData;

                if (!student.class_id) {
                    throw new Error('You are not assigned to any class yet. Please contact your administrator.');
                }

                // Get student's attendance
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('student_id', student.id);

                if (attendanceError) {
                    console.warn('Attendance error:', attendanceError);
                }

                const totalAttendanceDays = attendanceData?.length || 0;
                const presentDays = attendanceData?.filter(record => record.status === 'present').length || 0;
                const attendance_rate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0;

                // Get student's quiz results - FIXED TYPE HANDLING
                const { data: quizResultsRaw, error: quizError } = await supabase
                    .from('quiz_results')
                    .select(`
                        percentage,
                        marks_obtained,
                        total_marks,
                        created_at,
                        quizzes!inner(
                            title,
                            subject_id,
                            class_id,
                            subjects!inner(name)
                        )
                    `)
                    .eq('student_id', student.id)
                    .eq('quizzes.class_id', student.class_id)
                    .order('created_at', { ascending: false });

                if (quizError) {
                    console.warn('Quiz results error:', quizError);
                }

                // CRITICAL FIX: Cast the data properly to override TypeScript inference
                const typedQuizResults = (quizResultsRaw as any[])?.map((result: any) => ({
                    percentage: result.percentage,
                    marks_obtained: result.marks_obtained,
                    total_marks: result.total_marks,
                    created_at: result.created_at,
                    quizzes: {
                        title: result.quizzes.title,
                        subject_id: result.quizzes.subject_id,
                        class_id: result.quizzes.class_id,
                        subjects: {
                            name: result.quizzes.subjects.name
                        }
                    }
                })) || [] as QuizResultWithSubject[];

                // Calculate average grade from percentages
                const percentages = typedQuizResults.map(result => result.percentage || 0);
                const average_grade = percentages.length > 0 ?
                    Math.round(percentages.reduce((sum, percentage) => sum + percentage, 0) / percentages.length) : 0;

                // Get recent grades (last 5)
                const recent_grades = percentages.slice(0, 5);

                // Calculate improvement trend
                let improvement_trend: 'up' | 'down' | 'stable' = 'stable';
                if (recent_grades.length >= 3) {
                    const firstHalf = recent_grades.slice(0, Math.floor(recent_grades.length / 2));
                    const secondHalf = recent_grades.slice(Math.floor(recent_grades.length / 2));
                    if (firstHalf.length > 0 && secondHalf.length > 0) {
                        const firstAvg = firstHalf.reduce((sum, grade) => sum + grade, 0) / firstHalf.length;
                        const secondAvg = secondHalf.reduce((sum, grade) => sum + grade, 0) / secondHalf.length;

                        if (secondAvg > firstAvg + 5) improvement_trend = 'up';
                        else if (secondAvg < firstAvg - 5) improvement_trend = 'down';
                    }
                }

                // Get total quizzes for the class
                const { data: totalQuizzes, error: totalQuizzesError } = await supabase
                    .from('quizzes')
                    .select('id')
                    .eq('class_id', student.class_id);

                if (totalQuizzesError) {
                    console.warn('Total quizzes error:', totalQuizzesError);
                }

                const total_assignments = totalQuizzes?.length || 0;
                const assignments_completed = typedQuizResults.length;

                // Group results by subject - NOW THIS WILL WORK
                const subjectGroups: Record<string, { name: string; percentages: number[]; completed: number }> = {};

                typedQuizResults.forEach(result => {
                    // This now works because we properly cast the data structure
                    const subjectName = result.quizzes.subjects.name;
                    if (subjectName) {
                        if (!subjectGroups[subjectName]) {
                            subjectGroups[subjectName] = {
                                name: subjectName,
                                percentages: [],
                                completed: 0
                            };
                        }
                        subjectGroups[subjectName].percentages.push(result.percentage || 0);
                        subjectGroups[subjectName].completed += 1;
                    }
                });

                // Get total quizzes per subject for this class - FIXED TYPE HANDLING
                const { data: subjectQuizzesRaw, error: subjectQuizzesError } = await supabase
                    .from('quizzes')
                    .select(`
                        subject_id,
                        subjects!inner(name)
                    `)
                    .eq('class_id', student.class_id);

                if (subjectQuizzesError) {
                    console.warn('Subject quizzes error:', subjectQuizzesError);
                }

                // CRITICAL FIX: Cast the subject quiz data properly
                const subjectQuizzes = (subjectQuizzesRaw as any[])?.map((quiz: any) => ({
                    subject_id: quiz.subject_id,
                    subjects: {
                        name: quiz.subjects.name
                    }
                })) || [] as SubjectQuizData[];

                const subjectTotals: Record<string, number> = {};
                subjectQuizzes.forEach((quiz) => {
                    const subjectName = quiz.subjects.name;
                    if (subjectName) {
                        subjectTotals[subjectName] = (subjectTotals[subjectName] || 0) + 1;
                    }
                });

                const subjects = Object.keys(subjectGroups).map(subjectName => ({
                    name: subjectName,
                    grade: subjectGroups[subjectName].percentages.length > 0 ?
                        Math.round(subjectGroups[subjectName].percentages.reduce((sum, p) => sum + p, 0) / subjectGroups[subjectName].percentages.length) : 0,
                    assignments_completed: subjectGroups[subjectName].completed,
                    total_assignments: subjectTotals[subjectName] || 0
                }));

                // Get class students for ranking
                const { data: classStudents, error: classStudentsError } = await supabase
                    .from('students')
                    .select('id')
                    .eq('class_id', student.class_id)
                    .eq('is_deleted', false);

                if (classStudentsError) {
                    console.warn('Class students error:', classStudentsError);
                }

                const total_students = classStudents?.length || 0;

                // Calculate student ranking
                const { data: allClassResults, error: rankingError } = await supabase
                    .from('quiz_results')
                    .select(`
                        student_id,
                        percentage,
                        quizzes!inner(class_id)
                    `)
                    .eq('quizzes.class_id', student.class_id);

                if (rankingError) {
                    console.warn('Ranking error:', rankingError);
                }

                const studentAverages: Record<string, number[]> = {};
                (allClassResults || []).forEach((result: any) => {
                    if (!studentAverages[result.student_id]) {
                        studentAverages[result.student_id] = [];
                    }
                    studentAverages[result.student_id].push(result.percentage || 0);
                });

                const rankings = Object.entries(studentAverages)
                    .map(([id, percentages]) => ({
                        student_id: id,
                        average: percentages.reduce((sum, p) => sum + p, 0) / percentages.length
                    }))
                    .sort((a, b) => b.average - a.average);

                const rank_in_class = rankings.findIndex(r => r.student_id === student.id) + 1 || 1;

                const analyticsResult: StudentAnalytics = {
                    attendance_rate,
                    average_grade,
                    assignments_completed,
                    total_assignments,
                    rank_in_class,
                    total_students,
                    improvement_trend,
                    recent_grades,
                    subjects
                };

                setAnalytics(analyticsResult);

            } catch (err) {
                console.warn('Error fetching student analytics:', err);
                setError(err instanceof Error ? err.message : 'Unable to load your performance data. Please check your internet connection and try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentAnalytics();
    }, [profileId]);

    return { analytics, loading, error };
};