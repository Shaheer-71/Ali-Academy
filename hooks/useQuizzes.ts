import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
        if (profile?.role === 'teacher') {
            fetchQuizResults();
        } else if (profile?.role === 'student') {
            fetchStudentResults();
        }

        // Set up real-time subscriptions
        setupRealtimeSubscriptions();

        // Cleanup subscriptions on unmount
        return () => {
            supabase.removeAllChannels();
        };
    }, [profile]);

    // REAL-TIME SUBSCRIPTIONS
    const setupRealtimeSubscriptions = () => {
        console.log('🔄 Setting up real-time subscriptions...');

        // Subscribe to quiz changes
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
                    console.log('🔔 Quiz change detected:', payload);
                    fetchQuizzes(); // Refresh quizzes
                }
            )
            .subscribe();

        // Subscribe to quiz result changes
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
                    if (profile?.role === 'teacher') {
                        fetchQuizResults();
                    } else if (profile?.role === 'student') {
                        fetchStudentResults();
                    }
                }
            )
            .subscribe();

        console.log('✅ Real-time subscriptions set up');
    };

    const fetchClassesSubjects = async () => {
        try {
            console.log('🔗 Fetching class-subject relationships...');
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
            console.log('📚 Fetching ALL subjects...');
            const { data, error } = await supabase
                .from('subjects')
                .select('*')
                .eq('is_active', true)
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
            console.log('📝 Fetching ALL quizzes...');
            const { data, error } = await supabase
                .from('quizzes')
                .select(`
                    *,
                    subjects (id, name),
                    classes (name)
                `)
                .order('scheduled_date', { ascending: false });

            if (error) throw error;
            console.log('✅ Quizzes fetched:', data?.length || 0);
            setQuizzes(data || []);
        } catch (error) {
            console.error('❌ Error fetching quizzes:', error);
        }
    };

    const fetchQuizResults = async () => {
        try {
            console.log('📊 Fetching ALL quiz results...');
            const { data, error } = await supabase
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
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('✅ Quiz results fetched:', data?.length || 0);
            setQuizResults(data || []);
        } catch (error) {
            console.error('❌ Error fetching quiz results:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentResults = async () => {
        try {
            console.log('👨‍🎓 Fetching student results for:', profile?.id);
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
                .eq('student_id', profile?.id)
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

    // Get subjects for a specific class using class-subject relationships
    const getSubjectsForClass = (selectedClass: string) => {
        console.log('🎯 getSubjectsForClass called with class:', selectedClass);
        
        if (!selectedClass || selectedClass === 'all') {
            const subjectsWithQuizzes = subjects.filter(subject => 
                quizzes.some(quiz => quiz.subject_id === subject.id)
            );
            console.log('🎯 All classes selected - Available subjects:', subjectsWithQuizzes.map(s => s.name));
            return subjectsWithQuizzes;
        } else {
            // Get subjects assigned to the specific class from class-subject relationships
            const classSubjectRelations = classesSubjects.filter(cs => 
                String(cs.class_id) === String(selectedClass) && cs.is_active
            );
            
            console.log('🎯 Class-subject relations for class:', selectedClass, classSubjectRelations.length);
            
            // Get subject IDs for this class
            const subjectIdsInClass = classSubjectRelations.map(cs => cs.subject_id);
            
            // Filter subjects to only those assigned to this class
            const subjectsInClass = subjects.filter(subject => 
                subjectIdsInClass.includes(subject.id)
            );
            
            console.log('🎯 Class', selectedClass, 'assigned subjects:', subjectsInClass.map(s => s.name));
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
            .filter(Boolean) as Array<{id: string, name: string}>;

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

    // Check if all results for a quiz are marked
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
            console.log('➕ Creating quiz:', quizData.title);
            
            // Validate that the class-subject combination exists
            const validCombination = classesSubjects.some(cs => 
                String(cs.class_id) === String(quizData.class_id) &&
                String(cs.subject_id) === String(quizData.subject_id) &&
                cs.is_active
            );
            
            if (!validCombination) {
                throw new Error('This subject is not assigned to the selected class');
            }
            
            // FIXED: Only use fields that exist in your schema
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

            console.log('✅ Quiz created successfully');
            
            // FORCE IMMEDIATE REFRESH - Don't rely only on real-time
            await fetchQuizzes();
            if (profile?.role === 'teacher') {
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
            console.log('✏️ Marking quiz result:', resultId, { marks, isAbsent });
            
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
                
                // REMOVED: Don't set percentage and grade - they are generated columns
                // The database will calculate these automatically based on marks_obtained and total_marks
            }

            const { data, error } = await supabase
                .from('quiz_results')
                .update(updateData)
                .eq('id', resultId)
                .select()
                .single();

            if (error) throw error;

            // NEW: Auto-complete quiz if teacher starts marking but quiz is still scheduled
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

            console.log('✅ Quiz result marked successfully');
            
            // FORCE IMMEDIATE REFRESH - Don't rely only on real-time
            if (profile?.role === 'teacher') {
                await fetchQuizResults();
                await fetchQuizzes(); // Also refresh quizzes to get updated status
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
            console.log('🔄 Updating quiz status:', quizId, status);
            
            // FIXED: Only update status field (no updated_by field)
            const { error } = await supabase
                .from('quizzes')
                .update({
                    status: status,
                })
                .eq('id', quizId);

            if (error) throw error;

            console.log('✅ Quiz status updated');
            
            // FORCE IMMEDIATE REFRESH - Don't rely only on real-time
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
        areAllResultsMarked, // NEW: Export function to check if all results are marked
        refetch: () => {
            console.log('🔄 Manual refetch triggered');
            fetchQuizzes();
            fetchQuizResults();
            fetchSubjects();
            fetchClassesSubjects();
        },
    };
};