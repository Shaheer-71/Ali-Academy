// hooks/useQuizzes.ts - Fixed validation
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

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
    const { profile } = useAuth();

    useEffect(() => {
        console.log('🚀 useQuizzes: Initial data fetch');
        fetchSubjects();
        fetchClassesSubjects();
        fetchQuizzes();
        if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
            fetchQuizResults();
        } else if (profile?.role === 'student') {
            fetchStudentResults();
        }

        setupRealtimeSubscriptions();

        return () => {
            supabase.removeAllChannels();
        };
    }, [profile]);

    const setupRealtimeSubscriptions = () => {
        const quizChannel = supabase
            .channel('quiz-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'quizzes'
                },
                (payload) => {
                    fetchQuizzes();
                }
            )
            .subscribe();

        const resultsChannel = supabase
            .channel('quiz-results-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'quiz_results'
                },
                (payload) => {
                    console.log('🔔 Quiz result change detected:', payload);
                    if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
                        fetchQuizResults();
                    } else if (profile?.role === 'student') {
                        fetchStudentResults();
                    }
                }
            )
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
            console.log('✅ Class-subject relationships fetched:', data?.length || 0);
            setClassesSubjects(data || []);
        } catch (error) {
            console.error('❌ Error fetching class-subject relationships:', error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const { data: classesIDData, error: classesIDError } = await supabase
                .from('student_subject_enrollments')
                .select('subject_id, class_id')
                .eq('teacher_id', profile?.id);

            if (classesIDError) {
                console.error('Enrollments fetch error:', classesIDError);
                throw new Error('Failed to fetch enrollments: ' + classesIDError.message);
            }

            let subject_id = classesIDData?.map(item => item.subject_id) || [];

            console.log('📚 Fetching ALL subjects...');
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('is_active', true)
                .in('id', subject_id)
                .order('name');

            if (error) throw error;
            console.log('✅ Subjects fetched:', data?.length || 0);
            setSubjects(data || []);
        } catch (error) {
            console.error('❌ Error fetching subjects:', error);
        }
    };

    const fetchQuizzes = async () => {
        try {
            let data, error;
            let subjectIDs: string[] = [];

            const { data: classesIDData, error: classesIDError } = await supabase
                .from('teacher_subject_enrollments')
                .select('subject_id, class_id')
                .eq('teacher_id', profile?.id);

            if (classesIDError) {
                console.error('Enrollments fetch error:', classesIDError);
                throw new Error('Failed to fetch enrollments: ' + classesIDError.message);
            }

            subjectIDs = [
                ...new Set(classesIDData?.map(item => item.subject_id).filter(Boolean))
            ];

            console.log('🎯 Student subject IDs:', subjectIDs);

            if (profile?.role === "student") {
                const class_id = await fetchStudentClassId(profile?.id);

                if (!class_id) {
                    console.warn('⚠️ No class_id found for student');
                    setQuizzes([]);
                    return;
                }

                ({ data, error } = await supabase
                    .from('quizzes')
                    .select(`
                            *,
                            subjects (id, name),
                            classes (name)
                            `)
                    .eq('class_id', class_id)
                    .order('scheduled_date', { ascending: false }));
            }
            else {
                ({ data, error } = await supabase
                    .from('quizzes')
                    .select(`
          *,
          subjects (id, name),
          classes (name)
        `)
                    .in('subject_id', subjectIDs)
                    .order('scheduled_date', { ascending: false }));
            }

            if (error) throw error;

            console.log('✅ Quizzes fetched:', data?.length || 0);
            setQuizzes(data || []);
        } catch (error) {
            console.error('❌ Error fetching quizzes:', error);
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
                    .eq('student_id', profile?.id)
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
            console.error('❌ Error fetching quiz results:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentResults = async () => {
        try {
            console.log('👨‍🎓 Fetching student results for user:', profile?.id);
            
            // First, get the student record ID from the students table
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('id')
                .eq('id', profile?.id)
                .single();

            console.log("Student Found" , studentData)

            if (studentError) {
                console.error('❌ Error fetching student record:', studentError);
                throw studentError;
            }

            if (!studentData) {
                console.warn('⚠️ No student record found for user:', profile?.id);
                setQuizResults([]);
                setLoading(false);
                return;
            }

            console.log('📋 Student record ID:', profile?.id);

            const { data, error } = await supabase
                .from('quiz_results')
                .select(`
                    *,
                    quizzes (
                        title,
                        total_marks,
                        scheduled_date,
                        class_id,
                        subject_id,
                        subjects (name)
                    )
                `)
                .eq('student_id', studentData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('✅ Student results fetched:', data?.length || 0);
            setQuizResults(data || []);
        } catch (error) {
            console.error('❌ Error fetching student results:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSubjectsForClass = (selectedClass: string) => {
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
            console.log('🔍 Validating quiz creation:', quizData);
            
            // FIXED: Check teacher_subject_enrollments instead of classes_subjects
            const { data: enrollment, error: enrollmentError } = await supabase
                .from('teacher_subject_enrollments')
                .select('*')
                .eq('teacher_id', profile?.id)
                .eq('class_id', quizData.class_id)
                .eq('subject_id', quizData.subject_id)
                .single();

            if (enrollmentError || !enrollment) {
                console.error('❌ Validation failed:', enrollmentError);
                throw new Error('You are not assigned to teach this subject in this class');
            }

            console.log('✅ Validation passed, creating quiz');

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

            console.log('✅ Quiz created successfully:', data);

            // Create quiz result entries for all students in the class
            const { data: students } = await supabase
                .from('students')
                .select('id')
                .eq('class_id', quizData.class_id);

            if (students && students.length > 0) {
                const resultEntries = students.map(student => ({
                    quiz_id: data.id,
                    student_id: student.id,
                    total_marks: quizData.total_marks,
                    is_checked: false,
                    submission_status: 'submitted'
                }));

                await supabase
                    .from('quiz_results')
                    .insert(resultEntries);
            }

            // FORCE IMMEDIATE REFRESH
            await fetchQuizzes();
            if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
                await fetchQuizResults();
            } else if (profile?.role === 'student') {
                await fetchStudentResults();
            }

            return { success: true, data };
        } catch (error) {
            console.error('❌ Error creating quiz:', error);
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
                    console.log('🔄 Auto-completing quiz since teacher started marking:', quiz.title);
                    await supabase
                        .from('quizzes')
                        .update({ status: 'completed' })
                        .eq('id', quiz.id);
                }
            }

            if ((profile?.role === 'teacher' || profile?.role === 'admin')) {
                await fetchQuizResults();
                await fetchQuizzes();
            } else if (profile?.role === 'student') {
                await fetchStudentResults();
            }

            return { success: true, data };
        } catch (error) {
            console.error('❌ Error marking quiz result:', error);
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
            console.error('❌ Error updating quiz status:', error);
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
        const studentResults = studentId
            ? quizResults.filter(r => r.student_id === studentId)
            : quizResults.filter(r => r.student_id === profile?.id);

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
                console.error('Error fetching class ID:', error);
                return null;
            }

            return data?.class_id || null;
        } catch (err) {
            console.error('Unexpected error fetching class ID:', err);
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
        markQuizResult,
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