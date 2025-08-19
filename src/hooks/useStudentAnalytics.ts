// hooks/useStudentAnalytics.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useLoading } from '@/src/contexts/LoadingContext';

interface StudentAnalytics {
    attendance_rate: number;
    average_grade: number;
    assignments_completed: number;
    total_assignments: number;
    rank_in_class: number;
    total_students: number;
    improvement_trend: 'up' | 'down' | 'stable';
    recent_grades: number[];
    subjects: {
        name: string;
        grade: number;
        assignments_completed: number;
        total_assignments: number;
    }[];
}

interface QuizResult {
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
}

interface Student {
    id: string;
    full_name: string;
    class_id: string;
    email: string;
    classes: {
        id: string;
        name: string;
    };
}

export const useStudentAnalytics = (profileId: string | undefined) => {
    const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { setAnalyticsLoading } = useLoading();

    useEffect(() => {
        if (!profileId) {
            setLoading(false);
            setAnalyticsLoading(false);
            return;
        }

        const fetchStudentAnalytics = async () => {
            try {
                setLoading(true);
                setAnalyticsLoading(true);
                setError(null);

                console.log('Fetching analytics for profile ID:', profileId);

                // First, get the profile data
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('email, id')
                    .eq('id', profileId)
                    .single();

                if (profileError) {
                    console.error('Profile error:', profileError);
                    throw new Error('Profile not found');
                }

                console.log('Profile data:', profileData);

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
                    .eq('email', profileData.email)
                    .eq('is_deleted', false)
                    .single();

                if (studentError) {
                    console.error('Student error:', studentError);
                    throw new Error('Student record not found. Please contact administrator.');
                }

                const student = studentData as Student;
                console.log('Student data:', student);

                if (!student.class_id) {
                    throw new Error('Student is not assigned to any class.');
                }

                // Get student's attendance
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('student_id', student.id);

                if (attendanceError) {
                    console.error('Attendance error:', attendanceError);
                    // Don't throw error for attendance, just log it
                }

                const totalAttendanceDays = attendanceData?.length || 0;
                const presentDays = attendanceData?.filter(record => record.status === 'present').length || 0;
                const attendance_rate = totalAttendanceDays > 0 ? Math.round((presentDays / totalAttendanceDays) * 100) : 0;

                // Get student's quiz results
                const { data: quizResults, error: quizError } = await supabase
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
                    console.error('Quiz results error:', quizError);
                    // Don't throw error, just use empty array
                }

                const typedQuizResults = (quizResults || []) as QuizResult[];
                console.log('Quiz results:', typedQuizResults);

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
                    console.error('Total quizzes error:', totalQuizzesError);
                }

                const total_assignments = totalQuizzes?.length || 0;
                const assignments_completed = typedQuizResults.length;

                // Group results by subject
                const subjectGroups: Record<string, { name: string; percentages: number[]; completed: number }> = {};
                
                typedQuizResults.forEach(result => {
                    const subjectName = result.quizzes?.subjects?.name;
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

                // Get total quizzes per subject for this class
                const { data: subjectQuizzes, error: subjectQuizzesError } = await supabase
                    .from('quizzes')
                    .select(`
                        subject_id,
                        subjects!inner(name)
                    `)
                    .eq('class_id', student.class_id);

                if (subjectQuizzesError) {
                    console.error('Subject quizzes error:', subjectQuizzesError);
                }

                const subjectTotals: Record<string, number> = {};
                (subjectQuizzes || []).forEach((quiz: any) => {
                    const subjectName = quiz.subjects?.name;
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
                    console.error('Class students error:', classStudentsError);
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
                    console.error('Ranking error:', rankingError);
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

                console.log('Final analytics:', analyticsResult);
                setAnalytics(analyticsResult);

            } catch (err) {
                console.error('Error fetching student analytics:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
            } finally {
                setLoading(false);
                setAnalyticsLoading(false);
            }
        };

        fetchStudentAnalytics();
    }, [profileId, setAnalyticsLoading]);

    return { analytics, loading, error };
};