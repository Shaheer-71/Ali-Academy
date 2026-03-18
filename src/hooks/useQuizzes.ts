// hooks/useQuizzes.ts - Fixed validation
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import {
    handleFilterApplicationError,
    handleQuizFetchError,
    handleQuizResultFetchError,
    handleQuizStatsError,
    handleSubjectFetchForClassError
} from '@/src/utils/errorHandler/quizErrorHandler';
import { handleError, handleSubjectFetchError } from '../utils/errorHandler/attendanceErrorHandler';

export interface Subject {
    id: string;
    name: string;
    description?: string;
    class_id?: string;
    teacher_id: string;
    is_active: boolean;
    created_at: string;
}

export interface Quiz {
    id: string;
    title: string;
    description?: string;
    subject_id: string;
    class_id: string;
    scheduled_date: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    quiz_type: 'quiz' | 'test' | 'exam' | 'assignment';
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    instructions?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    subjects?: Subject;
    classes?: { name: string };
}

export interface QuizResult {
    id: string;
    quiz_id: string;
    student_id: string;
    marks_obtained?: number;
    total_marks: number;
    percentage?: number;
    grade?: string;
    is_checked: boolean;
    submission_status?: string;
    remarks?: string;
    marked_by?: string;
    marked_at?: string;
    created_at: string;
    updated_at: string;
    students?: {
        full_name: string;
        roll_number: string;
    };
    quizzes?: {
        title: string;
        total_marks: number;
        subjects?: { name: string };
    };
}

export interface ClassSubject {
    id: string;
    class_id: string;
    subject_id: string;
    is_active: boolean;
    classes?: { id: string; name: string };
    subjects?: { id: string; name: string };
}

export const useQuizzes = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
    const [classesSubjects, setClassesSubjects] = useState<ClassSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const { profile, student } = useAuth();
    const quizTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resultsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        fetchSubjects();
        fetchClassesSubjects();
        fetchQuizzes();
        if ((profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin')) {
            fetchQuizResults();
        } else if (profile?.role === 'student') {
            fetchStudentResults();
        }

        setupRealtimeSubscriptions();

        return () => {
            supabase.removeAllChannels();
        };
    }, [profile]);

    // student loads async after profile — re-fetch subjects + results once student.id is available
    useEffect(() => {
        if (profile?.role === 'student' && student?.id) {
            fetchSubjects();
            fetchStudentResults();
        }
    }, [student?.id]);

    const setupRealtimeSubscriptions = () => {
        const quizChannel = supabase
            .channel('quiz-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => {
                if (quizTimerRef.current) clearTimeout(quizTimerRef.current);
                quizTimerRef.current = setTimeout(fetchQuizzes, 800);
            })
            .subscribe();

        const resultsChannel = supabase
            .channel('quiz-results-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_results' }, () => {
                if (resultsTimerRef.current) clearTimeout(resultsTimerRef.current);
                resultsTimerRef.current = setTimeout(() => {
                    if (profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin') {
                        fetchQuizResults();
                    } else if (profile?.role === 'student') {
                        fetchStudentResults();
                    }
                }, 800);
            })
            .subscribe();
    };

    const fetchClassesSubjects = async () => {
        try {
            const { data, error } = await supabase
                .from('classes_subjects')
                .select(`
                    *,
                    classes (id, name),
                    subjects (id, name)
                `)
                .eq('is_active', true)
                .order('classes(name), subjects(name)');

            if (error) throw error;
            setClassesSubjects(data || []);
        } catch (error) {
            console.warn('❌ Error fetching class-subject relationships:', error);
            throw handleSubjectFetchError(error);
        }
    };

    const fetchSubjects = async () => {
        try {
            if (profile?.role === 'superadmin') {
                const { data, error } = await supabase
                    .from('subjects').select('*').eq('is_active', true).order('name');
                if (error) throw error;
                setSubjects(data || []);
                return;
            }

            const isTeacher = profile?.role === 'teacher' || profile?.role === 'admin';
            const table = isTeacher ? 'teacher_subject_enrollments' : 'student_subject_enrollments';
            const filterCol = isTeacher ? 'teacher_id' : 'student_id';
            const filterVal = isTeacher ? profile?.id : student?.id;

            if (!filterVal) { setSubjects([]); return; }

            const { data: enrollments, error: enrollmentError } = await supabase
                .from(table)
                .select('subject_id')
                .eq(filterCol, filterVal);

            if (enrollmentError) throw enrollmentError;

            const subject_ids = [...new Set(enrollments?.map(i => i.subject_id) || [])];
            if (subject_ids.length === 0) { setSubjects([]); return; }

            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('is_active', true)
                .in('id', subject_ids)
                .order('name');

            if (error) throw error;
            setSubjects(data || []);
        } catch (error) {
            console.warn('❌ Error fetching subjects:', error);
            throw handleSubjectFetchError(error);
        }
    };

    const fetchQuizzes = async () => {
        try {
            if (!profile?.id) return setQuizzes([]);

            // Superadmin: fetch all quizzes without enrollment filter
            if (profile.role === 'superadmin') {
                const { data, error } = await supabase
                    .from('quizzes')
                    .select('*, subjects(id, name), classes(name)')
                    .order('scheduled_date', { ascending: false });
                if (error) throw error;
                setQuizzes(data || []);
                return;
            }

            let enrollmentsData, enrollmentsError;

            if (profile.role === "teacher" || profile.role === "admin") {
                ({ data: enrollmentsData, error: enrollmentsError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('class_id, subject_id')
                    .eq('teacher_id', profile.id)
                    .eq('is_active', true));
            } else {
                ({ data: enrollmentsData, error: enrollmentsError } = await supabase
                    .from('student_subject_enrollments')
                    .select('class_id, subject_id')
                    .eq('student_id', student?.id)
                    .eq('is_active', true));
            }

            if (enrollmentsError) throw enrollmentsError;
            if (!enrollmentsData || enrollmentsData.length === 0) {
                setQuizzes([]);
                return;
            }

            // Build OR condition for class + subject combinations
            const orExpr = enrollmentsData
                .map(e => `and(class_id.eq.${e.class_id},subject_id.eq.${e.subject_id})`)
                .join(',');

            let { data, error } = await supabase
                .from('quizzes')
                .select(`
                *,
                subjects(id, name),
                classes(name)
            `)
                .or(orExpr)
                .order('scheduled_date', { ascending: false });

            if (error) throw error;
            setQuizzes(data || []);
        } catch (err) {
            console.warn('❌ Error fetching quizzes:', err);
            throw handleQuizFetchError(err);
            setQuizzes([]);
        }
    };

    const fetchQuizResults = async () => {
        try {
            let data, error;

            if (profile?.role === "student") {
                ({ data, error } = await supabase
                    .from('quiz_results')
                    .select(`
          *,
          students (full_name, roll_number),
          quizzes (
            title,
            total_marks,
            class_id,
            subject_id,
            subjects (name)
          )
        `)
                    .eq('student_id', student?.id)
                    .order('created_at', { ascending: false }));
            } else {
                ({ data, error } = await supabase
                    .from('quiz_results')
                    .select(`
          *,
          students (full_name, roll_number),
          quizzes (
            title,
            total_marks,
            class_id,
            subject_id,
            subjects (name)
          )
        `)
                    .order('created_at', { ascending: false }));
            }

            if (error) throw error;

            setQuizResults(data || []);
        } catch (error) {
            console.warn('❌ Error fetching quiz results:', error);
            throw handleQuizResultFetchError(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentResults = async () => {
        try {

            if (!student?.id) {
                setQuizResults([]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('quiz_results')
                .select(`
                    *,
                    quizzes (
                        title,
                        total_marks,
                        passing_marks,
                        scheduled_date,
                        class_id,
                        subject_id,
                        subjects (name)
                    )
                `)
                .eq('student_id', student.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuizResults(data || []);
        } catch (error) {
            console.warn('❌ Error fetching student results:', error);
            throw handleQuizResultFetchError(error);
        } finally {
            setLoading(false);
        }
    };

    const getSubjectsForClass = async (selectedClass: string) => {
        try {
            if (!selectedClass || selectedClass === 'all') {
                const subjectsWithQuizzes = subjects.filter(subject =>
                    quizzes.some(quiz => quiz.subject_id === subject.id)
                );
                return subjectsWithQuizzes;
            } else {
                const classSubjectRelations = classesSubjects.filter(cs =>
                    String(cs.class_id) === String(selectedClass) && cs.is_active
                );

                const subjectIdsInClass = classSubjectRelations.map(cs => cs.subject_id);

                const subjectsInClass = subjects.filter(subject =>
                    subjectIdsInClass.includes(subject.id)
                );

                return subjectsInClass;
            }
        } catch (error) {
            console.warn('❌ Error getting subjects for class:', error);
            throw handleSubjectFetchForClassError(error);
        }
    };

    const getSubjectsWithAll = (selectedClass?: string) => {
        const targetClass = selectedClass || 'all';
        const availableSubjects = getSubjectsForClass(targetClass);

        return [
            { id: 'all', name: 'All Subjects' },
            ...availableSubjects
        ];
    };

    const getClassesWithSubjects = () => {
        const classesWithSubjects = [...new Set(classesSubjects.map(cs => cs.class_id))]
            .map(classId => {
                const classInfo = classesSubjects.find(cs => cs.class_id === classId);
                return classInfo?.classes;
            })
            .filter(Boolean) as Array<{ id: string, name: string }>;

        return [
            { id: 'all', name: 'All Classes' },
            ...classesWithSubjects
        ];
    };

    const getFilteredResults = (selectedClass: string, selectedSubject: string, checkedFilter: 'all' | 'checked' | 'unchecked') => {
        try {
            let filteredResults = [...quizResults];

            if (selectedClass !== 'all') {
                const classQuizIds = quizzes
                    .filter(quiz => String(quiz.class_id) === String(selectedClass))
                    .map(quiz => quiz.id);

                filteredResults = filteredResults.filter(result =>
                    classQuizIds.includes(result.quiz_id)
                );
            }

            if (selectedSubject !== 'all') {
                let subjectQuizIds: string[];

                if (selectedClass === 'all') {
                    subjectQuizIds = quizzes
                        .filter(quiz => String(quiz.subject_id) === String(selectedSubject))
                        .map(quiz => quiz.id);
                } else {
                    subjectQuizIds = quizzes
                        .filter(quiz =>
                            String(quiz.subject_id) === String(selectedSubject) &&
                            String(quiz.class_id) === String(selectedClass)
                        )
                        .map(quiz => quiz.id);
                }

                filteredResults = filteredResults.filter(result =>
                    subjectQuizIds.includes(result.quiz_id)
                );
            }

            if (checkedFilter === 'checked') {
                filteredResults = filteredResults.filter(result => result.is_checked);
            } else if (checkedFilter === 'unchecked') {
                filteredResults = filteredResults.filter(result => !result.is_checked);
            }

            return filteredResults;
        } catch (error) {
            console.warn('❌ Error filtering results:', error);
            throw handleFilterApplicationError(error);
        }
    };

    const areAllResultsMarked = (quizId: string) => {
        const quizResults_filtered = quizResults.filter(result => result.quiz_id === quizId);

        if (quizResults_filtered.length === 0) {
            return false;
        }

        return quizResults_filtered.every(result =>
            result.is_checked || result.submission_status === 'absent'
        );
    };

    // const createQuiz = async (quizData: {
    //     title: string;
    //     description?: string;
    //     subject_id: string;
    //     class_id: string;
    //     scheduled_date: string;
    //     duration_minutes: number;
    //     total_marks: number;
    //     passing_marks: number;
    //     quiz_type: 'quiz' | 'test' | 'exam' | 'assignment';
    //     instructions?: string;
    // }) => {
    //     try {
    //         console.log('🔍 Validating quiz creation:', quizData);

    //         // FIXED: Check teacher_subject_enrollments instead of classes_subjects
    //         const { data: enrollment, error: enrollmentError } = await supabase
    //             .from('teacher_subject_enrollments')
    //             .select('*')
    //             .eq('teacher_id', profile?.id)
    //             .eq('class_id', quizData.class_id)
    //             .eq('subject_id', quizData.subject_id)
    //             .single();

    //         if (enrollmentError || !enrollment) {
    //             console.warn('❌ Validation failed:', enrollmentError);
    //             throw new Error('You are not assigned to teach this subject in this class');
    //         }

    //         console.log('✅ Validation passed, creating quiz');

    //         const { data, error } = await supabase
    //             .from('quizzes')
    //             .insert([{
    //                 title: quizData.title,
    //                 description: quizData.description,
    //                 subject_id: quizData.subject_id,
    //                 class_id: quizData.class_id,
    //                 scheduled_date: quizData.scheduled_date,
    //                 duration_minutes: quizData.duration_minutes,
    //                 total_marks: quizData.total_marks,
    //                 passing_marks: quizData.passing_marks,
    //                 quiz_type: quizData.quiz_type,
    //                 status: 'scheduled',
    //                 instructions: quizData.instructions,
    //                 created_by: profile!.id,
    //             }])
    //             .select()
    //             .single();

    //         if (error) throw error;

    //         console.log('✅ Quiz created successfully:', data);

    //         // Create quiz result entries for all students in the class
    //         const { data: students } = await supabase
    //             .from('students')
    //             .select('id')
    //             .eq('class_id', quizData.class_id);

    //         if (students && students.length > 0) {
    //             const resultEntries = students.map(student => ({
    //                 quiz_id: data.id,
    //                 student_id: student.id,
    //                 total_marks: quizData.total_marks,
    //                 is_checked: false,
    //                 submission_status: 'submitted'
    //             }));

    //             await supabase
    //                 .from('quiz_results')
    //                 .insert(resultEntries);
    //         }

    //         // FORCE IMMEDIATE REFRESH
    //         await fetchQuizzes();
    //         if ((profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin')) {
    //             await fetchQuizResults();
    //         } else if (profile?.role === 'student') {
    //             await fetchStudentResults();
    //         }

    //         return { success: true, data };
    //     } catch (error) {
    //         console.warn('❌ Error creating quiz:', error);
    //         return { success: false, error };
    //     }
    // };

    const createQuiz = async (quizData: {
        title: string;
        description?: string;
        subject_id: string;
        class_id: string;
        scheduled_date: string;
        duration_minutes: number;
        total_marks: number;
        passing_marks: number;
        quiz_type: 'quiz' | 'test' | 'exam' | 'assignment';
        instructions?: string;
    }) => {
        try {
            // Regular teachers: verify they're assigned to this class+subject
            if (profile?.role !== 'superadmin') {
                const { data: enrollment, error: enrollmentError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('*')
                    .eq('teacher_id', profile?.id)
                    .eq('class_id', quizData.class_id)
                    .eq('subject_id', quizData.subject_id)
                    .single();

                if (enrollmentError || !enrollment) {
                    throw new Error('You are not assigned to teach this subject in this class');
                }
            }

            const { data, error } = await supabase
                .from('quizzes')
                .insert([{
                    title: quizData.title,
                    description: quizData.description,
                    subject_id: quizData.subject_id,
                    class_id: quizData.class_id,
                    scheduled_date: quizData.scheduled_date,
                    duration_minutes: quizData.duration_minutes,
                    total_marks: quizData.total_marks,
                    passing_marks: quizData.passing_marks,
                    quiz_type: quizData.quiz_type,
                    status: 'scheduled',
                    instructions: quizData.instructions,
                    created_by: profile!.id,
                }])
                .select()
                .single();

            if (error) throw error;

            // Create quiz results only for students enrolled in this class + subject
            const { data: enrolledStudents, error: studentsError } = await supabase
                .from('student_subject_enrollments')
                .select('student_id')
                .eq('class_id', quizData.class_id)
                .eq('subject_id', quizData.subject_id)
                .eq('is_active', true);

            if (studentsError) {
                console.warn('❌ Error fetching enrolled students:', studentsError);
            } else if (enrolledStudents && enrolledStudents.length > 0) {
                const resultEntries = enrolledStudents.map(enrollment => ({
                    quiz_id: data.id,
                    student_id: enrollment.student_id,
                    total_marks: quizData.total_marks,
                    is_checked: false,
                    submission_status: 'submitted'
                }));

                const { error: insertError } = await supabase
                    .from('quiz_results')
                    .insert(resultEntries);
                if (insertError) console.warn('❌ Error inserting quiz results:', insertError);
            }

            // FORCE IMMEDIATE REFRESH
            await fetchQuizzes();
            if ((profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin')) {
                await fetchQuizResults();
            } else if (profile?.role === 'student') {
                await fetchStudentResults();
            }

            return { success: true, data };
        } catch (error) {
            console.warn('❌ Error creating quiz:', error);
            return { success: false, error };
        }
    };


    const markQuizResult = async (
        resultId: string,
        marks: number | null,
        remarks?: string,
        isAbsent?: boolean
    ) => {
        try {
            const updateData: any = {
                is_checked: true,
                remarks: remarks,
                marked_by: profile!.id,
                marked_at: new Date().toISOString(),
            };

            if (isAbsent) {
                updateData.marks_obtained = null;
                updateData.submission_status = 'absent';
            } else {
                updateData.marks_obtained = marks;
                updateData.submission_status = 'submitted';
            }

            const { data, error } = await supabase
                .from('quiz_results')
                .update(updateData)
                .eq('id', resultId)
                .select()
                .single();

            if (error) throw error;

            const result = quizResults.find(r => r.id === resultId);
            if (result) {
                const quiz = quizzes.find(q => q.id === result.quiz_id);
                if (quiz && (quiz.status === 'scheduled' || quiz.status === 'active')) {
                    await supabase
                        .from('quizzes')
                        .update({ status: 'completed' })
                        .eq('id', quiz.id);
                }
            }

            if ((profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'superadmin')) {
                await fetchQuizResults();
                await fetchQuizzes();
            } else if (profile?.role === 'student') {
                await fetchStudentResults();
            }

            return { success: true, data };
        } catch (error) {
            console.warn('❌ Error marking quiz result:', error);
            return { success: false, error };
        }
    };

    const bulkMarkQuizResults = async (
        entries: Array<{
            resultId: string;
            marks: number | null;
            remarks?: string;
            isAbsent?: boolean;
        }>,
        quizId: string
    ): Promise<{ success: boolean; failed: number; results: any[] }> => {
        try {
            // All updates in parallel — no sequential waiting
            const updates = await Promise.all(
                entries.map(({ resultId, marks, remarks, isAbsent }) => {
                    const updateData: any = {
                        is_checked: true,
                        remarks,
                        marked_by: profile!.id,
                        marked_at: new Date().toISOString(),
                    };
                    if (isAbsent) {
                        updateData.marks_obtained = null;
                        updateData.submission_status = 'absent';
                    } else {
                        updateData.marks_obtained = marks;
                        updateData.submission_status = 'submitted';
                    }
                    return supabase
                        .from('quiz_results')
                        .update(updateData)
                        .eq('id', resultId)
                        .select()
                        .single();
                })
            );

            const failed = updates.filter(u => u.error).length;
            const succeeded = updates.filter(u => !u.error).map(u => u.data);

            // Update quiz status ONCE (not per student)
            const quiz = quizzes.find(q => q.id === quizId);
            if (quiz && (quiz.status === 'scheduled' || quiz.status === 'active')) {
                await supabase.from('quizzes').update({ status: 'completed' }).eq('id', quizId);
            }

            // Single refetch after everything
            await fetchQuizResults();
            await fetchQuizzes();

            return { success: failed === 0, failed, results: succeeded };
        } catch (error) {
            console.warn('❌ Error bulk marking quiz results:', error);
            return { success: false, failed: entries.length, results: [] };
        }
    };

    const updateQuiz = async (quizId: string, quizData: Partial<Quiz>) => {
        try {
            const { error } = await supabase
                .from('quizzes')
                .update(quizData)
                .eq('id', quizId);
            if (error) throw error;
            await fetchQuizzes();
            return { success: true };
        } catch (error) {
            console.warn('❌ Error updating quiz:', error);
            return { success: false, error };
        }
    };

    const deleteQuiz = async (quizId: string) => {
        try {
            // Delete results first (FK), then the quiz
            await supabase.from('quiz_results').delete().eq('quiz_id', quizId);
            const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
            if (error) throw error;
            await fetchQuizzes();
            await fetchQuizResults();
            return { success: true };
        } catch (error) {
            console.warn('❌ Error deleting quiz:', error);
            return { success: false, error };
        }
    };

    const updateQuizStatus = async (quizId: string, status: Quiz['status']) => {
        try {
            const { error } = await supabase
                .from('quizzes')
                .update({
                    status: status,
                })
                .eq('id', quizId);

            if (error) throw error;

            await fetchQuizzes();
            await fetchQuizResults();

            return { success: true };
        } catch (error) {
            console.warn('❌ Error updating quiz status:', error);
            return { success: false, error };
        }
    };


    const getQuizResultsBySubject = (subjectId: string, checkedFilter?: 'all' | 'checked' | 'unchecked') => {
        let filtered = quizResults.filter(result =>
            result.quizzes?.subjects?.name === subjects.find(s => s.id === subjectId)?.name
        );

        if (checkedFilter === 'checked') {
            filtered = filtered.filter(result => result.is_checked);
        } else if (checkedFilter === 'unchecked') {
            filtered = filtered.filter(result => !result.is_checked);
        }

        return filtered;
    };

    const getStudentQuizStats = (studentId?: string) => {
        try {
            const studentResults = studentId
                ? quizResults.filter(r => r.student_id === studentId)
                : quizResults.filter(r => r.student_id === student?.id);

            const checkedResults = studentResults.filter(r => r.is_checked && r.marks_obtained !== null);
            const totalMarks = checkedResults.reduce((sum, r) => sum + (r.marks_obtained || 0), 0);
            const totalPossible = checkedResults.reduce((sum, r) => sum + r.total_marks, 0);
            const averagePercentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;

            return {
                totalQuizzes: studentResults.length,
                checkedQuizzes: checkedResults.length,
                uncheckedQuizzes: studentResults.length - checkedResults.length,
                averagePercentage: Math.round(averagePercentage),
                totalMarks,
                totalPossible,
            };
        } catch (error) {
            console.warn('❌ Error calculating quiz stats:', error);
            throw handleQuizStatsError(error);
        }
    };

    const fetchStudentClassId = async (studentId?: string) => {
        if (!studentId) return null;
        try {
            const { data, error } = await supabase
                .from('students')
                .select('class_id')
                .eq('id', studentId)
                .single();

            if (error) {
                console.warn('Error fetching class ID:', error);
                return null;
            }

            return data?.class_id || null;
        } catch (err) {
            console.warn('Unexpected error fetching class ID:', err);
            throw handleError(err);
            return null;
        }
    };

    return {
        quizzes,
        subjects,
        quizResults,
        classesSubjects,
        loading,
        createQuiz,
        updateQuiz,
        deleteQuiz,
        markQuizResult,
        bulkMarkQuizResults,
        updateQuizStatus,
        getQuizResultsBySubject,
        getStudentQuizStats,
        getSubjectsWithAll,
        getSubjectsForClass,
        getClassesWithSubjects,
        getFilteredResults,
        areAllResultsMarked,
        fetchStudentClassId,
        refetch: () => {
            fetchQuizzes();
            fetchQuizResults();
            fetchSubjects();
            fetchClassesSubjects();
        },
    };
};